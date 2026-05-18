$mysqlPath = "E:\Project_softwares\Apps\xampp\mysql"
$backupPath = "$mysqlPath\backup"
$dataPath = "$mysqlPath\data"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$dataBackupPath = "$mysqlPath\data_corrupted_$timestamp"

Write-Output "--- Starting MySQL Rebuild & Repair Process ---"
Write-Output "MySQL directory: $mysqlPath"
Write-Output "Backup source: $backupPath"
Write-Output "Data directory: $dataPath"
Write-Output "Backup destination for corrupted data: $dataBackupPath"

# 1. Verify existence of backup and data folders
if (-not (Test-Path $backupPath)) {
    Write-Error "Backup directory does not exist! Aborting."
    exit
}
if (-not (Test-Path $dataPath)) {
    Write-Error "Data directory does not exist! Aborting."
    exit
}

# 2. Stop any running mysql/mysqld processes (just to be safe)
Write-Output "Stopping any running mysql/mysqld processes..."
Stop-Process -Name "mysqld" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 3. Rename current data folder to back it up
Write-Output "Backing up current data folder to $dataBackupPath..."
Rename-Item -Path $dataPath -NewName "data_corrupted_$timestamp" -ErrorAction Stop

# 4. Create a new empty data folder
Write-Output "Creating new empty data folder..."
New-Item -ItemType Directory -Path $dataPath -ErrorAction Stop

# 5. Copy all files and folders from backup to the new data folder
Write-Output "Copying pristine system files from backup to new data folder..."
Copy-Item -Path "$backupPath\*" -Destination $dataPath -Recurse -Force -ErrorAction Stop

# 6. Copy user databases from corrupted backup folder
Write-Output "Restoring user databases..."
# Find all subdirectories in the backed up data directory, excluding mysql, performance_schema, phpmyadmin, and test
$userDbs = Get-ChildItem -Path $dataBackupPath -Directory | Where-Object { $_.Name -notin "mysql", "performance_schema", "phpmyadmin", "test" }

foreach ($db in $userDbs) {
    Write-Output "Restoring database: $($db.Name)"
    Copy-Item -Path $db.FullName -Destination $dataPath -Recurse -Force -ErrorAction Stop
}

# 7. Copy the original ibdata1 file (contains InnoDB metadata)
$ibdata1Path = "$dataBackupPath\ibdata1"
if (Test-Path $ibdata1Path) {
    Write-Output "Restoring ibdata1 file (crucial for InnoDB databases)..."
    Copy-Item -Path $ibdata1Path -Destination $dataPath -Force -ErrorAction Stop
} else {
    Write-Warning "ibdata1 not found in backed up data folder! InnoDB tables may be unreadable."
}

# 8. Copy the original ib_logfile files (InnoDB transaction logs)
$ibLogfiles = Get-ChildItem -Path $dataBackupPath -Filter "ib_logfile*"
foreach ($logfile in $ibLogfiles) {
    Write-Output "Restoring InnoDB log file: $($logfile.Name)"
    Copy-Item -Path $logfile.FullName -Destination $dataPath -Force -ErrorAction Stop
}

Write-Output "--- Rebuild Complete! ---"
Write-Output "Please open the XAMPP Control Panel and try starting MySQL now."
