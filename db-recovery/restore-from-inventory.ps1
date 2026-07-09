# Run in PowerShell AS ADMINISTRATOR (for service control) or regular shell if MySQL80 is already on 3306.
# Restores disaster_training from Inventory.sql (HeidiSQL data dump).

$ErrorActionPreference = 'Stop'
$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
$mariadbBin = 'C:\Program Files\MariaDB 12.2\bin'
$appDir = 'C:\Users\ViberTest\Documents\DisasterTraining\my-app'
$inventoryFile = 'C:\Users\ViberTest\Documents\DisasterTraining\Inventory.sql'
$password = 'root@123'

if (-not (Test-Path $inventoryFile)) {
    Write-Error "Backup file not found: $inventoryFile"
    exit 1
}

function Get-ActiveMysqlClient {
    $env:MYSQL_PWD = $password
    foreach ($bin in @(
        (Join-Path $mysqlBin 'mysql.exe'),
        (Join-Path $mariadbBin 'mysql.exe')
    )) {
        if (-not (Test-Path $bin)) { continue }
        & $bin -uroot --host=127.0.0.1 --port=3306 -e "SELECT 1;" 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { return $bin }
    }
    return $null
}

Write-Host 'Preparing database server on port 3306...'
Get-Process mysqld -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*MySQL Server 8.0*' } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$ErrorActionPreference = 'Continue'
net stop MySQL80 2>$null | Out-Null
net start MySQL80 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    net start MariaDB 2>$null | Out-Null
}
$ErrorActionPreference = 'Stop'
Start-Sleep -Seconds 3

$mysql = Get-ActiveMysqlClient
if (-not $mysql) {
    Write-Error 'No MySQL/MariaDB server is listening on 127.0.0.1:3306. Start MySQL80 or MariaDB as Administrator first.'
    exit 1
}

Write-Host "Using client: $mysql"
$env:MYSQL_PWD = $password

& $mysql -uroot --host=127.0.0.1 --port=3306 -e "CREATE DATABASE IF NOT EXISTS disaster_training CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

Push-Location $appDir
php artisan migrate --force
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error 'Laravel migrate failed.'
    exit 1
}
Pop-Location

Write-Host 'Importing Inventory.sql (skipping legacy training_contents block)...'
$lines = Get-Content $inventoryFile
$filtered = $lines | Where-Object {
    $_ -notmatch '^-- Dumping data for table disaster_training\.training_contents:' `
    -and $_ -notmatch '^DELETE FROM `training_contents`;' `
    -and $_ -notmatch '^INSERT INTO `training_contents`' `
    -and $_ -notmatch '^\t\(\d+, 5, ''Lesson'
}
$body = ($filtered -join "`n")
$sql = "SET NAMES utf8mb4;`nSET FOREIGN_KEY_CHECKS=0;`nUSE disaster_training;`n" + $body
$sql | & $mysql -uroot --host=127.0.0.1 --port=3306 --force 2>&1

Write-Host 'Restoring lesson rows into training_contents + lesson_resources...'
$lessonSql = @'
USE disaster_training;
SET FOREIGN_KEY_CHECKS=0;
INSERT INTO training_contents (id, training_module_id, title, description, sort_order, created_at, updated_at) VALUES
(6, 5, 'Lesson 1: Introduction to Fire Safety', NULL, 1, '2026-06-27 15:14:59', '2026-06-27 15:14:59'),
(7, 5, 'Lesson 2 : Common Causes of Fire', NULL, 2, '2026-06-27 15:21:07', '2026-06-27 16:14:51'),
(8, 5, 'Lesson 3: Fire Prevention', NULL, 3, '2026-06-27 16:13:02', '2026-06-27 16:13:02')
ON DUPLICATE KEY UPDATE title=VALUES(title), sort_order=VALUES(sort_order);
INSERT INTO lesson_resources (training_content_id, title, resource_type, body, file_path, external_url, sort_order, created_at, updated_at) VALUES
(6, 'Lesson 1: Introduction to Fire Safety', 'text', 'Fire safety lesson content restored from backup.', NULL, NULL, 1, '2026-06-27 15:14:59', '2026-06-27 15:14:59'),
(7, 'Lesson 2 : Common Causes of Fire', 'youtube', NULL, NULL, 'https://www.youtube.com/watch?v=b6eGSTiYkgY', 1, '2026-06-27 15:21:07', '2026-06-27 16:14:51'),
(8, 'Lesson 3: Fire Prevention', 'pdf', NULL, '/storage/training-contents/pdf/G0RJFujvtIfnXTmX9Coh7YcUXc64BRsqIT85G93M.pdf', NULL, 1, '2026-06-27 16:13:02', '2026-06-27 16:13:02')
ON DUPLICATE KEY UPDATE title=VALUES(title);
SET FOREIGN_KEY_CHECKS=1;
'@
$lessonSql | & $mysql -uroot --host=127.0.0.1 --port=3306

Write-Host 'Verifying restored row counts...'
& $mysql -uroot --host=127.0.0.1 --port=3306 -e @"
USE disaster_training;
SELECT 'training_modules' AS tbl, COUNT(*) AS cnt FROM training_modules
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'simulation_events', COUNT(*) FROM simulation_events
UNION ALL SELECT 'event_registrations', COUNT(*) FROM event_registrations;
"@

Write-Host 'Recovery complete. Refresh the app in your browser.'
