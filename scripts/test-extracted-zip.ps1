Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = Join-Path $pwd.Path "ShopSphere-final-100-commits-100-prs.zip"
$testDir = Join-Path $env:TEMP "shopsphere-zip-validation"

if (Test-Path $testDir) {
    Remove-Item -Recurse -Force $testDir
}

New-Item -ItemType Directory -Path $testDir -Force | Out-Null

Write-Host "Extracting $zipPath to $testDir..."
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $testDir)

Push-Location $testDir

Write-Host "--- Git In-Tree Check ---"
git rev-parse --is-inside-work-tree

Write-Host "--- Commit Count Check ---"
git rev-list --count HEAD

Write-Host "--- Git Status ---"
git status

Write-Host "--- Git Log (Latest 5) ---"
git log --oneline -5

Pop-Location
Write-Host "✅ Validation completed successfully!"
