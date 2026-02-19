# USB Key (Flash Drive) Guide

This system uses a **normal flash drive** with a **key file** stored on it.

## What the system supports (today)

- **USB key type**: a downloaded key file (ex: `.txt`) saved to your flash drive
- **Login flow**: user **manually uploads** the key file during login

## Important limitation: no true “auto-detection” with normal flash drives

A web browser **cannot automatically detect** a regular flash drive and read a file from it without the user selecting the file.

- Browsers intentionally block automatic access to your files/drives for privacy and security.
- So the **best/expected UX** for normal flash drives is: **choose the file → upload → verify**.

## Recommended user flow (simple and reliable)

### 1) Enable USB key for the account

- Go to **USB Security Key** settings
- Click **Generate USB Key File**
- Save the downloaded key file to your flash drive

### 2) Login using USB key verification

- Login as usual until you reach USB verification
- Click **Choose file**
- Select the key file from your flash drive
- Submit to verify

## Notes (to avoid login problems)

- Keep the key file **private** (don’t share it)
- If the flash drive is lost/compromised, use **Regenerate USB Key** or **Revoke USB Key**

