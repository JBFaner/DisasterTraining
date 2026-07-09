# Database Recovery

## What we learned

| Location | `disaster_training`? | Notes |
|----------|---------------------|-------|
| **MariaDB** (app default) | Yes, but was empty after fresh migrate | Use `root@123` |
| **MySQL80** | **No** | Only has empty `reymon` DB |
| **Inventory.sql** | **Yes — your backup** | HeidiSQL data dump (~335 KB) |

## Recommended restore (Admin PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\ViberTest\Documents\DisasterTraining\db-recovery\restore-from-inventory.ps1"
```

This script:
1. Stops orphan MySQL80 processes and frees port 3306
2. Starts MariaDB
3. Runs Laravel migrations for schema
4. Imports `Inventory.sql`
5. Verifies row counts

## MySQL80 password reset (already done)

`reset-mysql80-password.ps1` — only needed if you must access MySQL80. Root password is now `root@123`.

## Not needed for this recovery

`dump-and-restore.ps1` — looks for `disaster_training` on MySQL80, which does not exist.
