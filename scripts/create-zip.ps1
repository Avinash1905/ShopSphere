Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

$zipPath = Join-Path $pwd.Path "ShopSphere-final-100-commits-100-prs.zip"

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

$zipFile = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$excludeDirs = @(
    (Join-Path $pwd.Path "node_modules"),
    (Join-Path $pwd.Path "dist"),
    (Join-Path $pwd.Path "coverage"),
    (Join-Path $pwd.Path ".cache"),
    (Join-Path $pwd.Path "logs")
)

$excludeFiles = @(
    (Join-Path $pwd.Path "ShopSphere-final-100-commits-100-prs.zip"),
    (Join-Path $pwd.Path "ShopSphere-final-100-PRs.zip")
)

Write-Host "Archiving repository files including .git..."

$rootLen = $pwd.Path.Length + 1

Get-ChildItem -Path $pwd.Path -Recurse -Force | ForEach-Object {
    $itemPath = $_.FullName
    $skip = $false

    foreach ($ex in $excludeDirs) {
        if ($itemPath.StartsWith($ex)) {
            $skip = $true
            break
        }
    }

    if (-not $skip) {
        foreach ($ef in $excludeFiles) {
            if ($itemPath -eq $ef) {
                $skip = $true
                break
            }
        }
    }

    if (-not $skip -and -not $_.PSIsContainer) {
        $relPath = $itemPath.Substring($rootLen).Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zipFile, $itemPath, $relPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
}

$zipFile.Dispose()
$size = (Get-Item $zipPath).Length
Write-Host "SUCCESS: Created $zipPath ($size bytes)"
