param (
    [string]$StudentCode = "QE190122",
    [string]$FullName = "Nguyen Van A",
    [string]$GithubUrl = "https://github.com/username/repo-name",
    [string]$VercelUrl = "https://your-project.vercel.app",
    [string]$TestEmail = "grader.qe190122@example.com",
    [string]$TestPassword = "Test1234!"
)

$ProgressPreference = 'SilentlyContinue'
$rootDir = (Get-Item -Path ".").FullName
$docxStaging = Join-Path $rootDir ".docx_staging"
$tempZip = Join-Path $rootDir "temp_doc.zip"
$outputDocx = Join-Path $rootDir "$StudentCode.docx"

if (Test-Path $docxStaging) {
    Remove-Item -Recurse -Force $docxStaging -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path "$docxStaging\_rels" -Force | Out-Null
New-Item -ItemType Directory -Path "$docxStaging\word\_rels" -Force | Out-Null

# 1. [Content_Types].xml
$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
'@
[System.IO.File]::WriteAllText("$docxStaging\[Content_Types].xml", $contentTypes)

# 2. _rels/.rels
$rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText("$docxStaging\_rels\.rels", $rels)

# 3. word/_rels/document.xml.rels
$docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>
'@
[System.IO.File]::WriteAllText("$docxStaging\word\_rels\document.xml.rels", $docRels)

# 4. word/document.xml
$docXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Student Code: $StudentCode</w:t></w:r></w:p>
    <w:p><w:r><w:t>Full Name: $FullName</w:t></w:r></w:p>
    <w:p><w:r><w:t>GitHub Repository URL: $GithubUrl</w:t></w:r></w:p>
    <w:p><w:r><w:t>Vercel Production URL: $VercelUrl</w:t></w:r></w:p>
    <w:p><w:r><w:t>Test account email: $TestEmail</w:t></w:r></w:p>
    <w:p><w:r><w:t>Test account password: $TestPassword</w:t></w:r></w:p>
  </w:body>
</w:document>
"@
[System.IO.File]::WriteAllText("$docxStaging\word\document.xml", $docXml)

if (Test-Path $tempZip) { Remove-Item -Force $tempZip -ErrorAction SilentlyContinue }
if (Test-Path $outputDocx) { Remove-Item -Force $outputDocx -ErrorAction SilentlyContinue }

Compress-Archive -Path "$docxStaging\*" -DestinationPath $tempZip -Force
Move-Item -Path $tempZip -Destination $outputDocx -Force

Start-Sleep -Milliseconds 300
Remove-Item -Recurse -Force $docxStaging -ErrorAction SilentlyContinue

Write-Host "SUCCESS: Generated submission document at $outputDocx"
