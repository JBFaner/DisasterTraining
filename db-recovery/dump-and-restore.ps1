# Run AFTER reset-mysql80-password.ps1 succeeds (Admin PowerShell)

$ErrorActionPreference = 'Stop'
$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
$mariadbBin = 'C:\Program Files\MariaDB 12.2\bin'
$backupDir = 'C:\Users\ViberTest\Documents\DisasterTraining\db-recovery'
$backupFile = Join-Path $backupDir 'disaster_training_mysql80_backup.sql'
$password = 'root@123'

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$env:MYSQL_PWD = $password

Write-Host 'Checking old data in MySQL80...'
& "$mysqlBin\mysql.exe" -uroot --host=127.0.0.1 --port=3306 -e "USE disaster_training; SELECT 'training_modules' AS tbl, COUNT(*) AS cnt FROM training_modules UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'simulation_events', COUNT(*) FROM simulation_events;"

Write-Host "Dumping disaster_training to $backupFile ..."
& "$mysqlBin\mysqldump.exe" -uroot --host=127.0.0.1 --port=3306 --databases disaster_training --routines --triggers --single-transaction | Set-Content -Encoding UTF8 $backupFile

if (-not (Test-Path $backupFile) -or (Get-Item $backupFile).Length -lt 1000) {
    Write-Error 'Dump file is missing or too small. Old data may not exist in MySQL80.'
    exit 1
}

Write-Host 'Stopping MySQL80, starting MariaDB...'
net stop MySQL80 | Out-Null
Start-Sleep -Seconds 3
net start MariaDB | Out-Null
Start-Sleep -Seconds 4

Write-Host 'Restoring into MariaDB disaster_training...'
$env:MYSQL_PWD = $password
Get-Content $backupFile -Raw | & (Join-Path $mariadbBin 'mysql.exe') -uroot --host=127.0.0.1 --port=3306

Write-Host 'Verifying restored counts...'
& (Join-Path $mariadbBin 'mysql.exe') -uroot --host=127.0.0.1 --port=3306 -e "USE disaster_training; SELECT 'training_modules' AS tbl, COUNT(*) AS cnt FROM training_modules UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'simulation_events', COUNT(*) FROM simulation_events;"

Write-Host 'Recovery complete.'
