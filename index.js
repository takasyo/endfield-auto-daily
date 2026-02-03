#!/usr/bin/env node

/**
 * Arknights: Endfield Auto Daily Check-in
 * Simple script for automated daily attendance via SKPort API
 */

import crypto from 'crypto'

const creds = (process.env.CRED || "").split('\n').map(s => s.trim()).filter(Boolean)
const tokens = (process.env.TOKEN || "").split('\n').map(s => s.trim()).filter(Boolean)
const discordWebhook = process.env.DISCORD_WEBHOOK
const discordUser = process.env.DISCORD_USER

const BINDING_URL = 'https://zonai.skport.com/api/v1/game/player/binding'
const ATTENDANCE_URL = 'https://zonai.skport.com/web/v1/game/endfield/attendance'
const ENDFIELD_GAME_ID = '3'

const messages = []
let hasErrors = false

/**
 * Resolve token for account index. If tokens list has one entry, use it for all accounts.
 */
function resolveTokenForIndex(index) {
  if (!tokens || tokens.length === 0) return undefined
  if (tokens.length === 1) return tokens[0]
  return tokens[index] || undefined
}

/**
 * Build headers for SKPort API
 * Accepts optional timestamp so the same timestamp can be used in the sign computation.
 */
function buildHeaders(cred, gameRole = null, timestamp = null) {
  const ts = timestamp || Math.floor(Date.now() / 1000).toString()

  const headers = {
    'accept': 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'origin': 'https://game.skport.com',
    'referer': 'https://game.skport.com/',
    'cred': cred,
    'platform': '3',
    'sk-language': 'en',
    'timestamp': ts,
    'vname': '1.0.0',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  }

  if (gameRole) {
    headers['sk-game-role'] = gameRole
  }

  return headers
}

/**
 * Compute V2-style sign header: MD5(HMAC-SHA256(path + timestamp + headers_json, token))
 * token = secret salt (from TOKENS env)
 */
function signHeader(path, timestamp, platform, vName, token) {
  if (!token) return null
  const headerJson = JSON.stringify({ platform, timestamp, dId: "", vName })
  const s = `${path}${timestamp}${headerJson}`
  const hmac = crypto.createHmac("sha256", token).update(s).digest("hex")
  return crypto.createHash("md5").update(hmac).digest("hex")
}

/**
 * Fetch player binding to get all roles
 * Accepts token used to sign the binding request (if available)
 */
async function getPlayerRoles(cred, token) {
  const path = '/api/v1/game/player/binding'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const headers = buildHeaders(cred, null, timestamp)

  // Add sign header if token provided
  if (token) {
    const sign = signHeader(path, timestamp, '3', '1.0.0', token)
    if (sign) headers['sign'] = sign
  }

  const res = await fetch(BINDING_URL, { method: 'GET', headers })
  const json = await res.json()

  if (json.code !== 0) {
    throw new Error(json.message || `Binding API error: ${json.code}`)
  }

  // Find endfield binding
  const endfieldApp = json.data?.list?.find(app => app.appCode === 'endfield')

  if (!endfieldApp || !endfieldApp.bindingList?.length) {
    throw new Error('No Endfield account binding found')
  }

  // Collect all roles from all bindings
  const allRoles = []

  for (const binding of endfieldApp.bindingList) {
    const roles = binding.roles || []

    for (const role of roles) {
      allRoles.push({
        gameRole: `${ENDFIELD_GAME_ID}_${role.roleId}_${role.serverId}`,
        nickname: role.nickname,
        level: role.level,
        server: role.serverName,
        serverId: role.serverId,
        roleId: role.roleId,
      })
    }
  }

  if (!allRoles.length) {
    throw new Error('No roles found in binding')
  }

  return allRoles
}

/**
 * Check if already signed in today
 * (headers should already include timestamp and sign if desired)
 */
async function checkAttendance(headers) {
  const res = await fetch(ATTENDANCE_URL, { method: 'GET', headers })
  const json = await res.json()

  if (json.code !== 0) {
    throw new Error(json.message || `API error code: ${json.code}`)
  }

  return {
    hasToday: json.data?.hasToday ?? false,
    totalSignIns: json.data?.records?.length ?? 0
  }
}

/**
 * Claim daily attendance
 * (headers should already include timestamp and sign if desired)
 */
async function claimAttendance(headers) {
  const res = await fetch(ATTENDANCE_URL, { method: 'POST', headers, body: null })
  const json = await res.json()

  if (json.code !== 0) {
    throw new Error(json.message || `API error code: ${json.code}`)
  }

  // Parse rewards
  const rewards = []
  const awardIds = json.data?.awardIds ?? []
  const resourceMap = json.data?.resourceInfoMap ?? {}

  for (const award of awardIds) {
    const info = resourceMap[award.id]
    if (info) {
      rewards.push(`${info.name} x${info.count}`)
    }
  }

  return { rewards }
}

/**
 * Run check-in for a single role
 * token is the secret salt token used for signing (if available)
 */
async function checkInRole(cred, role, token) {
  const path = '/web/v1/game/endfield/attendance'
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const headers = buildHeaders(cred, role.gameRole, timestamp)

  // Add sign header when token provided
  if (token) {
    const sign = signHeader(path, timestamp, '3', '1.0.0', token)
    if (sign) headers['sign'] = sign
  }

  // Check status
  const status = await checkAttendance(headers)

  if (status.hasToday) {
    return { success: true, alreadyClaimed: true }
  }

  // Claim if not signed in
  const result = await claimAttendance(headers)

  return { success: true, alreadyClaimed: false, rewards: result.rewards }
}

/**
 * Run check-in for a single account (all roles)
 */
async function run(cred, token, accountIndex) {
  log('debug', `\n----- CHECKING IN FOR ACCOUNT ${accountIndex} -----`)

  try {
    // Step 1: Get all player roles (include sign if token present)
    log('debug', 'Fetching player binding...')
    const roles = await getPlayerRoles(cred, token)

    log('info', `Account ${accountIndex}:`, `Found ${roles.length} role(s)`)

    // Step 2: Check in for each role
    for (const role of roles) {
      const roleLabel = `${role.nickname} (Lv.${role.level}) [${role.server}]`

      try {
        const result = await checkInRole(cred, role, token)

        if (result.alreadyClaimed) {
          log('info', `  → ${roleLabel}:`, 'Already checked in today')
        } else if (result.rewards?.length > 0) {
          log('info', `  → ${roleLabel}:`, `Checked in! Rewards: ${result.rewards.join(', ')}`)
        } else {
          log('info', `  → ${roleLabel}:`, 'Successfully checked in!')
        }
      } catch (error) {
        log('error', `  → ${roleLabel}:`, error.message)
      }

      // Small delay between roles to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

  } catch (error) {
    log('error', `Account ${accountIndex}:`, error.message)
  }
}

/**
 * Custom log function to store messages
 */
function log(type, ...data) {
  console[type](...data)

  switch (type) {
    case 'debug': return
    case 'error': hasErrors = true
  }

  const string = data
    .map(value => typeof value === 'object' ? JSON.stringify(value, null, 2) : value)
    .join(' ')

  messages.push({ type, string })
}

/**
 * Send results to Discord webhook
 */
async function discordWebhookSend() {
  log('debug', '\n----- DISCORD WEBHOOK -----')

  if (!discordWebhook.toLowerCase().trim().startsWith('https://discord.com/api/webhooks/')) {
    log('error', 'DISCORD_WEBHOOK is not a Discord webhook URL')
    return
  }

  let discordMsg = ''
  if (discordUser) {
    discordMsg = `<@${discordUser}>\n`
  }
  discordMsg += '**Endfield Daily Check-in**\n'
  discordMsg += messages.map(msg => `(${msg.type.toUpperCase()}) ${msg.string}`).join('\n')

  const res = await fetch(discordWebhook, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: discordMsg })
  })

  if (res.status === 204) {
    log('info', 'Successfully sent message to Discord webhook!')
    return
  }

  log('error', 'Error sending message to Discord webhook')
}

// Main execution
if (!creds || !creds.length) {
  throw new Error('CRED environment variable not set!')
}

for (const index in creds) {
  const token = resolveTokenForIndex(Number(index))
  await run(creds[index], token, Number(index) + 1)

  // Delay between accounts
  if (index < creds.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

if (discordWebhook && URL.canParse(discordWebhook)) {
  await discordWebhookSend()
}

if (hasErrors) {
  console.log('')
  throw new Error('Error(s) occurred.')
}
