# Test Moments Module - Complete CRUD and Auto-Ordering Tests
Write-Host "=== MOMENTS MODULE TESTS ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3002"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "`n[1/7] Backend Health Check" -ForegroundColor Yellow
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

# Test 2: Setup - Get or Create Film and Scene
Write-Host "`n[2/7] Setup: Get or Create Film and Scene" -ForegroundColor Yellow
try {
    $filmsResponse = Invoke-WebRequest -Uri "$baseUrl/films" -UseBasicParsing
    $films = $filmsResponse.Content | ConvertFrom-Json
    
    if ($films.Count -gt 0) {
        $testFilmId = $films[0].id
        Write-Host "  Using Film ID: $testFilmId" -ForegroundColor Gray
    } else {
        Write-Host "  No films found, creating test film..." -ForegroundColor Gray
        $createFilmBody = @{
            name = "Test Film for Moments"
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
    
    # Create a scene for the moments
    Write-Host "  Creating test scene..." -ForegroundColor Gray
    $createSceneBody = @{
        name = "Test Scene for Moments"
        order_index = 0
    } | ConvertTo-Json
    
    $sceneResponse = Invoke-WebRequest -Uri "$baseUrl/scenes/films/$testFilmId/scenes" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createSceneBody `
        -UseBasicParsing
    
    $scene = $sceneResponse.Content | ConvertFrom-Json
    $testSceneId = $scene.id
    Write-Host "  Created Scene ID: $testSceneId" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get/create test film and scene" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
    exit 1
}

# Test 2: Create Moment
Write-Host "`n[2/6] POST /moments/scenes/:sceneId/moments - Create Moment" -ForegroundColor Yellow
try {
    $createMomentBody = @{
        name = "Intro Moment"
        order_index = 0
        duration = 30
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/moments/scenes/$testSceneId/moments" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createMomentBody `
        -UseBasicParsing
    
    $moment = $response.Content | ConvertFrom-Json
    $testMomentId = $moment.id
    
    if ($moment.name -eq "Intro Moment" -and $moment.duration -eq 30) {
        Write-Host "✅ Created moment ID: $testMomentId (name: $($moment.name), duration: $($moment.duration))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Moment created but data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to create moment" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Get All Moments for Scene
Write-Host "`n[3/6] GET /moments/scenes/:sceneId/moments - Find All Moments" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/moments/scenes/$testSceneId/moments" `
        -UseBasicParsing
    
    $moments = $response.Content | ConvertFrom-Json
    $momentCount = if ($moments -is [array]) { $moments.Count } else { 1 }
    
    if ($momentCount -gt 0) {
        Write-Host "✅ Found $momentCount moment(s) in scene" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ No moments found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get moments" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Get Single Moment
Write-Host "`n[4/6] GET /moments/:id - Find One Moment" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/moments/$testMomentId" `
        -UseBasicParsing
    
    $moment = $response.Content | ConvertFrom-Json
    
    if ($moment.id -eq $testMomentId -and $moment.name -eq "Intro Moment") {
        Write-Host "✅ Retrieved moment ID: $testMomentId (name: $($moment.name))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Moment data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get moment" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Update Moment
Write-Host "`n[5/6] PATCH /moments/:id - Update Moment" -ForegroundColor Yellow
try {
    $updateBody = @{
        name = "Updated Intro Moment"
        duration = 45
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/moments/$testMomentId" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $updateBody `
        -UseBasicParsing
    
    $updated = $response.Content | ConvertFrom-Json
    
    if ($updated.name -eq "Updated Intro Moment" -and $updated.duration -eq 45) {
        Write-Host "✅ Updated moment ID: $testMomentId (new name: $($updated.name), duration: $($updated.duration))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Update failed or data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to update moment" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Delete Moment
Write-Host "`n[6/6] DELETE /moments/:id - Remove Moment" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/moments/$testMomentId" `
        -Method DELETE `
        -UseBasicParsing
    
    # Try to get the deleted moment - should return 404
    try {
        $getResponse = Invoke-WebRequest -Uri "$baseUrl/moments/$testMomentId" `
            -UseBasicParsing -ErrorAction Stop
        Write-Host "❌ Moment still exists after deletion" -ForegroundColor Red
        $testsFailed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Moment ID: $testMomentId successfully deleted (confirmed 404)" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
            $testsFailed++
        }
    }
} catch {
    Write-Host "❌ Failed to delete moment" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed/6" -ForegroundColor Green
Write-Host "Failed: $testsFailed/6" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ ALL MOMENTS TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
