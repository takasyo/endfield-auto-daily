# Endfield Auto Daily Check In

Today's check in status:
[![If you see this text, chances are the automation hasn't run. Do your setup below!](../../actions/workflows/login.yml/badge.svg)](../../actions/workflows/login.yml)

Repository version:
[![Do your setup!](../../actions/workflows/version.yml/badge.svg)](../../actions/workflows/version.yml)

> [!NOTE]
> The script might stop working after a few months, there is currently no way of knowing when it will definitely break.
> If the status failed several times, try to redo your setup again before reporting it as an issue.

## Table of Contents

- [Getting your account token](#getting-your-account-token)
- [Usage](#usage)
- [Discord Webhook](#discord-webhook)
- [FAQ](#faq)
  - [Is this safe?](#is-this-safe)
  - [How to update my (fork) repository version?](#how-to-update-my-fork-repository-version)
  - [I have other issues](#i-have-other-issues)

## Getting your account token

You have to check in manually first to get your account token, follow these steps (click to open screenshot):

1. Open [SKPORT Arknights: Endfield Daily Sign In](https://game.skport.com/endfield/sign-in) and login if you haven't (obviously)

2. <details>
   <summary>Open dev tool (<kbd>Ctrl+Shift+I</kbd> or right click anywhere > Inspect)</summary>
   <img width="1133" height="841" alt="image" src="https://github.com/user-attachments/assets/a067d000-8231-4458-88d9-65656348db2e" />
   </details>

4. <details>
   <summary>For Chromium users, click on the Application tab -> Cookies, click on <code>ACCOUNT_TOKEN</code>, and check <code>Show URL-encoded</code>.</summary>
   <img width="1057" height="369" alt="image" src="https://github.com/user-attachments/assets/fd4e6f55-f0c6-4f07-934c-d46b3a5bde12" />
   </details>
   <details>
   <summary>For Firefox/Gecko-based browsers, click on the Storage tab -> Cookies, and copy <code>ACCOUNT_TOKEN</code> value.</summary>
   <img width="970" height="244" alt="image" src="https://github.com/user-attachments/assets/1b54d2a3-4b23-4b7a-b9cf-cf47d5ca45d8" />
   </details>

5. That's your account token, keep it save and do NOT share it with anyone!

## Usage

1. [Fork this repo](../../fork)
2. Open your fork repository
3. <details>
   <summary>Go to Settings > Secrets and variables > Actions, Click on New repository secrets</summary>
   <img width="1533" height="812" alt="image" src="https://github.com/user-attachments/assets/fd4605be-e64a-45ec-87c9-c3206ab46f4c" />
   </details>

5. <details>
   <summary>
      Insert the name <code>ACCOUNT_TOKEN</code> and the secret of your account token from before, then click Add secret. You can input as many accounts, separate it with a new line (Enter).
   </summary>
   <img width="798" height="422" alt="image" src="https://github.com/user-attachments/assets/3f1242f0-550d-42c3-97b5-399ecdade4ed" />
  </details>

6. <details>
   <summary>
     Here is the example secret value for multiple accounts.
   </summary>
   <img width="348" height="426" alt="image" src="https://github.com/user-attachments/assets/d5d816b6-f11d-4782-b881-df0fd27d68e7" />
   </details>

7. <details>
   <summary>
      For the first day, you have to trigger this manually.
      Simply go <a href="../../actions/workflows/login.yml">HERE</a> and click on Run workflow
   </summary>
   <img src="https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/ea1e48d2-a069-4db6-bdcd-86eecae8d81d" />
   </details>

9. <details>
    <summary>Refresh the page, wait for 15-25 secs, and see if it ran successfully. You should now see the check in status on top of README.</summary>
    <img src="https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/5c8520ee-a8b7-4c66-bb1b-ef945c499112" />
    </details>

10. You're set! Hop on your game the next day and see if you got the rewards

## Discord Webhook

You may use Discord webhook to send notifications to your channel!

1. <details>
   <summary>Go to channel settings</summary>
   <img src="https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/80f3b2f1-cc55-4316-9153-3fc5026b7da8" />
   </details>

2. <details>
   <summary>Go to Integrations and click Create Webhook</summary>
   <img src="https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/b4d0c07d-35a5-4382-99de-584c70c4d730" />
   </details>

3. <details>
   <summary>You can edit the name and picture freely, then Copy Webhook URL</summary>
   <img width="671" height="301" alt="image" src="https://github.com/user-attachments/assets/4d8fb873-b52f-4f83-8d14-f55246bc3104" />
   </details>

4. <details>
   <summary>Create a new repository <em>variable</em> named <code>DISCORD_WEBHOOK</code> with value of the webhook URL</summary>
   <img width="797" height="218" alt="image" src="https://github.com/user-attachments/assets/2d09e7a5-9fe0-4ddf-891b-a136b1bb02a4" />
   </details>

6. You may trigger the check in manually and see if the messages got sent

## FAQ

### Is this safe?

It is still unknown whether automated daily log in is bannable for Arknights Endfield since its just a few days after release, use at your own risk! I won't be responsible if anything happens with your account.

### How to update my (fork) repository version?

<details>
<summary>Go to your repository and click Sync fork</summary>
<img src="https://github.com/sglkc/hoyolab-auto-daily/assets/31957516/08c10262-8a97-433b-b499-143cc116184d" />
</details>

### I have other issues

To the [Issues page](https://github.com/sglkc/endfield-auto-daily/issues)
