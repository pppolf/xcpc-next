$ErrorActionPreference = "Stop"

$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallDir = Join-Path $env:USERPROFILE "bin"
$EnvironmentKey = "HKCU:\Environment"

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -LiteralPath (Join-Path $SourceDir "submit.cmd") -Destination $InstallDir -Force
Copy-Item -LiteralPath (Join-Path $SourceDir "submit.bat") -Destination $InstallDir -Force
Copy-Item -LiteralPath (Join-Path $SourceDir "submit.ps1") -Destination $InstallDir -Force

function Split-PathList($Value) {
  if (!$Value) {
    return @()
  }

  return @($Value -split ";" | Where-Object { $_ })
}

function Join-PathList($Parts) {
  return (($Parts | Where-Object { $_ }) -join ";")
}

$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$Parts = @()
if ($UserPath) {
  $Parts = Split-PathList $UserPath
}

$AlreadyInstalled = $false
foreach ($Part in $Parts) {
  if ($Part.TrimEnd("\") -ieq $InstallDir.TrimEnd("\")) {
    $AlreadyInstalled = $true
    break
  }
}

if (!$AlreadyInstalled) {
  $NewPath = Join-PathList ($Parts + $InstallDir)

  try {
    [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
    Set-ItemProperty -Path $EnvironmentKey -Name "Path" -Value $NewPath
  } catch {
    Write-Warning "Could not update user PATH automatically: $_"
  }
}

$WrittenPath = [Environment]::GetEnvironmentVariable("Path", "User")
$WrittenParts = Split-PathList $WrittenPath
$Verified = $false
foreach ($Part in $WrittenParts) {
  if ($Part.TrimEnd("\") -ieq $InstallDir.TrimEnd("\")) {
    $Verified = $true
    break
  }
}

Write-Host "Installed submit files to $InstallDir"

if ($Verified -or (($env:Path -split ";") -contains $InstallDir)) {
  Write-Host "Added to user PATH: $InstallDir"
  Write-Host "Open a new Command Prompt or PowerShell window, then run: submit status"
} else {
  Write-Warning "$InstallDir is not visible in this process PATH yet."
  Write-Host "If submit is not found after opening a new terminal, add this directory manually to user PATH:"
  Write-Host "  $InstallDir"
}
