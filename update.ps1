$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $MyInvocation.MyCommand.Path
$appDir = Join-Path $root 'FlowPilot-win32-x64'
$exe    = Join-Path $appDir 'FlowPilot.exe'
$verFile = Join-Path $root 'version.txt'
$repo   = 'FullerK55/flowpilot'

$local = (Get-Content $verFile -ErrorAction SilentlyContinue | Select-Object -First 1)
if (-not $local) { $local = '0.0.0' }
$local = $local.Trim()
Write-Host "Installed version: $local"

try {
  $latest = (Invoke-RestMethod "https://raw.githubusercontent.com/$repo/main/VERSION").Trim()
} catch {
  Write-Host "Could not reach GitHub (offline?). Launching current version."
  Start-Process $exe
  exit 0
}
Write-Host "Latest version:    $latest"

if ($latest -ne $local) {
  Write-Host "Update available: $latest"
  $asset = $null
  try {
    $rel = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
    $asset = $rel.assets | Where-Object { $_.name -like 'FlowPilot-Windows-*.zip' } | Select-Object -First 1
  } catch {
    Write-Host "No GitHub release exists yet."
  }
  if ($asset) {
    $zip = Join-Path $env:TEMP 'flowpilot-update.zip'
    Write-Host "Downloading $($asset.name) ..."
    Invoke-WebRequest $asset.browser_download_url -OutFile $zip
    $extract = Join-Path $env:TEMP 'flowpilot-update'
    if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
    Expand-Archive $zip -DestinationPath $extract
    $newApp = Get-ChildItem $extract -Directory | Select-Object -First 1
    if (Test-Path $appDir) { Rename-Item $appDir "FlowPilot-backup-$local" }
    Copy-Item $newApp.FullName $appDir -Recurse
    Set-Content $verFile $latest
    Remove-Item $zip -Force
    Write-Host "Updated to $latest. (Your schedule data is stored separately and was not touched.)"
  } else {
    Write-Host ""
    Write-Host "Version $latest is on GitHub, but its download zip hasn't been attached to a release yet."
    Write-Host "Opening the releases page - attach FlowPilot-Windows-$latest.zip to release v$latest,"
    Write-Host "then run this updater again."
    Start-Process "https://github.com/$repo/releases"
    Write-Host ""
    Read-Host 'Press Enter to launch your current version'
  }
} else {
  Write-Host "You're up to date."
}

Write-Host 'Launching FlowPilot...'
Start-Process $exe
