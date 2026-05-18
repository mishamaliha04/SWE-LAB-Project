$mysqlPath = "E:\Project_softwares\Apps\xampp\mysql"
$backupPath = "$mysqlPath\backup"
$dataPath = "$mysqlPath\data"
$originalBackupPath = "$mysqlPath\data_corrupted_20260518_053439"

Write-Output "--- Starting Clean MySQL Restore from True Original Backup ---"
Write-Output "MySQL directory: $mysqlPath"
Write-Output "Backup source: $backupPath"
Write-Output "Data directory to reconstruct: $dataPath"
Write-Output "True original database files source: $originalBackupPath"

# 1. Stop any running mysql/mysqld processes
Write-Output "Stopping any running mysql/mysqld processes..."
Stop-Process -Name "mysqld" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Verify existence of backup and original directories
if (-not (Test-Path $backupPath)) {
    Write-Error "Backup directory does not exist! Aborting."
    exit
}
if (-not (Test-Path $originalBackupPath)) {
    Write-Error "Original backup directory does not exist! Aborting."
    exit
}

# 3. Clean up the current data directory (remove it completely if it exists)
if (Test-Path $dataPath) {
    Write-Output "Removing current data directory..."
    Remove-Item -Path $dataPath -Recurse -Force -ErrorAction Stop
}

# 4. Create a new empty data folder
Write-Output "Creating new empty data folder..."
New-Item -ItemType Directory -Path $dataPath -ErrorAction Stop

# 5. Copy all files and folders from backup to the new data folder
Write-Output "Copying pristine system files from backup to new data folder..."
Copy-Item -Path "$backupPath\*" -Destination $dataPath -Recurse -Force -ErrorAction Stop

# 6. Copy user database folder 'krishibondhu'
$dbSrc = "$originalBackupPath\krishibondhu"
if (Test-Path $dbSrc) {
    Write-Output "Restoring database folder: krishibondhu..."
    Copy-Item -Path $dbSrc -Destination $dataPath -Recurse -Force -ErrorAction Stop
} else {
    Write-Error "krishibondhu database folder not found in original backup!"
}

# 7. Copy original ibdata1
$ibdata1Src = "$originalBackupPath\ibdata1"
if (Test-Path $ibdata1Src) {
    Write-Output "Restoring original ibdata1..."
    Copy-Item -Path $ibdata1Src -Destination $dataPath -Force -ErrorAction Stop
} else {
    Write-Error "ibdata1 not found in original backup!"
}

# 8. Copy original ib_logfiles
$ibLogfiles = Get-ChildItem -Path $originalBackupPath -Filter "ib_logfile*"
foreach ($logfile in $ibLogfiles) {
    Write-Output "Restoring original InnoDB log file: $($logfile.Name)"
    Copy-Item -Path $logfile.FullName -Destination $dataPath -Force -ErrorAction Stop
}

Write-Output "--- Restore Complete! ---"
Write-Output "Please open the XAMPP Control Panel and try starting MySQL now."
