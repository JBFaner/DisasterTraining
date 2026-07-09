# Run this script in PowerShell AS ADMINISTRATOR
# Resets MySQL80 root password to root@123 for recovery, then restarts the service.

$ErrorActionPreference = 'Stop'
$mysqlBin = 'C:\Program Files\MySQL\MySQL Server 8.0\bin'
$myIni = 'C:\ProgramData\MySQL\MySQL Server 8.0\my.ini'
$initFile = 'C:\temp\mysql-recovery-init.sql'
$newPassword = 'root@123'

Write-Host 'Stopping MySQL80...'
net stop MySQL80 | Out-Null
Start-Sleep -Seconds 4

# Ensure no stray mysqld is still holding the data directory.
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

New-Item -ItemType Directory -Force -Path 'C:\temp' | Out-Null
@"
ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPassword';
FLUSH PRIVILEGES;
"@ | Set-Content -Encoding ASCII -Path $initFile

Write-Host 'Applying temporary password reset via init-file...'
$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = Join-Path $mysqlBin 'mysqld.exe'
$pinfo.Arguments = "--defaults-file=`"$myIni`" --init-file=`"$initFile`" --console"
$pinfo.UseShellExecute = $false
$pinfo.CreateNoWindow = $true
$proc = [System.Diagnostics.Process]::Start($pinfo)

Start-Sleep -Seconds 15
if (-not $proc.HasExited) {
    $proc.Kill()
    $proc.WaitForExit()
}
Start-Sleep -Seconds 2

Write-Host 'Starting MySQL80 service...'
net start MySQL80 | Out-Null
Start-Sleep -Seconds 5

$env:MYSQL_PWD = $newPassword
& (Join-Path $mysqlBin 'mysql.exe') -uroot --host=127.0.0.1 --port=3306 -e "SHOW DATABASES;"
if ($LASTEXITCODE -ne 0) {
    Write-Error 'Password reset failed. Share this output with support.'
    exit 1
}

Write-Host 'MySQL80 root password reset successful. You can now run dump-and-restore.ps1'
