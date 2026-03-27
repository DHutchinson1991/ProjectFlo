$srcDir = 'c:\Users\works\Documents\Code Projects\ProjectFlo\packages\frontend\src'
$files = Get-ChildItem -Path $srcDir -Recurse -Include '*.ts','*.tsx' | Where-Object { $_.FullName -notlike '*node_modules*' }

# Ordered: longest/most specific patterns first to avoid partial matches
$replacements = [ordered]@{
  # Type/interface names (longest first)
  'ContributorApiResponse'      = 'CrewMemberApiResponse'
  'ContributorJobRole'          = 'CrewMemberJobRole'
  'NewContributorData'          = 'NewCrewMemberData'
  'UpdateContributorDto'        = 'UpdateCrewMemberDto'
  'ContributorRecord'           = 'CrewMemberRecord'
  'ContributorPickerProps'      = 'CrewMemberPickerProps'
  'ContributorPicker'           = 'CrewMemberPicker'
  # Function/mapper names
  'mapContributorResponse'      = 'mapCrewMemberResponse'
  # API object names
  'contributorsApi'             = 'crewMembersApi'
  # Hook names
  'useContributors'             = 'useCrewMembers'
  # PackageDayOperator types (longest first)
  'PackageDayOperatorEquipmentRecord' = 'PackageCrewSlotEquipmentRecord'
  'PackageDayOperatorRecord'    = 'PackageCrewSlotRecord'
  'PackageDayOperator'          = 'PackageCrewSlot'
  # ProjectDayOperator
  'ProjectDayOperatorRecord'    = 'ProjectCrewSlotRecord'
  'ProjectDayOperator'          = 'ProjectCrewSlot'
  # UserBrand
  'UserBrandRecord'             = 'BrandMemberRecord'
  'UserBrand'                   = 'BrandMember'
}

$count = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  if (-not $content) { continue }
  $original = $content
  foreach ($key in $replacements.Keys) {
    $content = $content -replace [regex]::Escape($key), $replacements[$key]
  }
  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    $relPath = $file.FullName.Substring($srcDir.Length + 1)
    Write-Host "Updated: $relPath"
    $count++
  }
}
Write-Host "Pass 1 done. $count files updated."
