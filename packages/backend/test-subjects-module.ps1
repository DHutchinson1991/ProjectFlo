# Test Subjects Module
Write-Host "=== SUBJECTS MODULE TEST SUITE ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3002"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "`n[1/6] Backend Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/films" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Backend responding on port 3002" -ForegroundColor Green
    $testsPassed++
} catch {
    Write-Host "❌ Backend not responding" -ForegroundColor Red
    Write-Host "Please start the backend: cd packages/backend && npm run start:dev" -ForegroundColor Red
    $testsFailed++
    exit 1
}

# First, get a film ID to use for testing
Write-Host "`n[Prep] Getting Film ID for testing..." -ForegroundColor Gray
try {
    $filmsResponse = Invoke-WebRequest -Uri "$baseUrl/films" -UseBasicParsing
    $films = $filmsResponse.Content | ConvertFrom-Json
    
    if ($films.Count -gt 0) {
        $testFilmId = $films[0].id
        Write-Host "  Using Film ID: $testFilmId" -ForegroundColor Gray
    } else {
        Write-Host "  No films found, creating test film..." -ForegroundColor Gray
        $createFilmBody = @{
            name = "Test Film for Subjects"
            brand_id = 1
        } | ConvertTo-Json
        
        $createResponse = Invoke-WebRequest -Uri "$baseUrl/films" `
            -Method POST `
            -ContentType "application/json" `
            -Body $createFilmBody `
            -UseBasicParsing
        
        $createdFilm = $createResponse.Content | ConvertFrom-Json
        $testFilmId = $createdFilm.id
        Write-Host "  Created Film ID: $testFilmId" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to get/create test film" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
    exit 1
}

# Test 2: Create Subject
Write-Host "`n[2/6] POST /subjects/films/:filmId/subjects - Create Subject" -ForegroundColor Yellow
try {
    $createSubjectBody = @{
        name = "Test Subject - People"
        category = "PEOPLE"
        is_custom = $true
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/subjects/films/$testFilmId/subjects" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createSubjectBody `
        -UseBasicParsing
    
    $subject = $response.Content | ConvertFrom-Json
    $testSubjectId = $subject.id
    
    if ($subject.name -eq "Test Subject - People" -and $subject.category -eq "PEOPLE") {
        Write-Host "✅ Created subject ID: $testSubjectId (name: $($subject.name), category: $($subject.category))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Subject created but data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to create subject" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Get All Subjects for Film
Write-Host "`n[3/6] GET /subjects/films/:filmId/subjects - Find All Subjects" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/subjects/films/$testFilmId/subjects" `
        -UseBasicParsing
    
    $subjects = $response.Content | ConvertFrom-Json
    $subjectCount = if ($subjects -is [array]) { $subjects.Count } else { 1 }
    
    if ($subjectCount -gt 0) {
        Write-Host "✅ Found $subjectCount subject(s) in film" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ No subjects found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get subjects" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Get Single Subject
Write-Host "`n[4/6] GET /subjects/:id - Find One Subject" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/subjects/$testSubjectId" `
        -UseBasicParsing
    
    $subject = $response.Content | ConvertFrom-Json
    
    if ($subject.id -eq $testSubjectId -and $subject.name -eq "Test Subject - People") {
        Write-Host "✅ Retrieved subject ID: $testSubjectId (name: $($subject.name))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Subject data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get subject" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Update Subject
Write-Host "`n[5/6] PATCH /subjects/:id - Update Subject" -ForegroundColor Yellow
try {
    $updateBody = @{
        name = "Updated Test Subject"
        category = "OBJECTS"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/subjects/$testSubjectId" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $updateBody `
        -UseBasicParsing
    
    $updated = $response.Content | ConvertFrom-Json
    
    if ($updated.name -eq "Updated Test Subject" -and $updated.category -eq "OBJECTS") {
        Write-Host "✅ Updated subject ID: $testSubjectId (new name: $($updated.name), category: $($updated.category))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Update failed or data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to update subject" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Delete Subject
Write-Host "`n[6/6] DELETE /subjects/:id - Remove Subject" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/subjects/$testSubjectId" `
        -Method DELETE `
        -UseBasicParsing
    
    # Try to get the deleted subject - should return 404
    try {
        $getResponse = Invoke-WebRequest -Uri "$baseUrl/subjects/$testSubjectId" `
            -UseBasicParsing -ErrorAction Stop
        Write-Host "❌ Subject still exists after deletion" -ForegroundColor Red
        $testsFailed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Subject ID: $testSubjectId successfully deleted (confirmed 404)" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
            $testsFailed++
        }
    }
} catch {
    Write-Host "❌ Failed to delete subject" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed/6" -ForegroundColor Green
Write-Host "Failed: $testsFailed/6" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
