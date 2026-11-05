param (
    [string]$StudentId = "QE190122"
)

$ProgressPreference = 'SilentlyContinue'
$rootDir = (Get-Item -Path ".").FullName
$tempStaging = Join-Path $rootDir ".submission_staging"
$zipPath = Join-Path $rootDir "$StudentId.zip"

Write-Host "Preparing clean staging folder..."
if (Test-Path $tempStaging) {
    Remove-Item -Recurse -Force $tempStaging -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $tempStaging -Force | Out-Null

$excludeNames = @(
    'node_modules',
    '.next',
    '.git',
    '.env',
    '.submission_staging',
    "$StudentId.zip",
    "$StudentId.docx"
)

Write-Host "Copying project files (excluding node_modules, .next, .git, .env)..."
Get-ChildItem -Path $rootDir | Where-Object {
    $_.Name -notin $excludeNames -and -not $_.Name.EndsWith(".local")
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $tempStaging -Recurse -Force
}

if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath -ErrorAction SilentlyContinue
}

Write-Host "Compressing archive to $zipPath..."
Compress-Archive -Path "$tempStaging\*" -DestinationPath $zipPath -Force

Start-Sleep -Milliseconds 500
Remove-Item -Recurse -Force $tempStaging -ErrorAction SilentlyContinue

Write-Host "SUCCESS: Submission zip created at $zipPath"
