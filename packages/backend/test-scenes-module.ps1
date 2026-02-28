# Test Scenes Module - Complete CRUD and Ordering Tests
Write-Host "=== SCENES MODULE TESTS ===" -ForegroundColor Cyan

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

# Get a film ID to use for testing
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
            name = "Test Film for Scenes"
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

# Test 2: Create Scene
Write-Host "`n[2/6] POST /scenes/films/:filmId/scenes - Create Scene" -ForegroundColor Yellow
try {
    $createSceneBody = @{
        name = "Test Opening Scene"
        order_index = 0
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/scenes/films/$testFilmId/scenes" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createSceneBody `
        -UseBasicParsing
    
    $scene = $response.Content | ConvertFrom-Json
    $testSceneId = $scene.id
    
    if ($scene.name -eq "Test Opening Scene" -and $scene.order_index -eq 0) {
        Write-Host "✅ Created scene ID: $testSceneId (name: $($scene.name), order: $($scene.order_index))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Scene created but data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to create scene" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Get All Scenes for Film
Write-Host "`n[3/6] GET /scenes/films/:filmId/scenes - Find All Scenes" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/scenes/films/$testFilmId/scenes" `
        -UseBasicParsing
    
    $scenes = $response.Content | ConvertFrom-Json
    $sceneCount = if ($scenes -is [array]) { $scenes.Count } else { 1 }
    
    if ($sceneCount -gt 0) {
        Write-Host "✅ Found $sceneCount scene(s) in film" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ No scenes found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get scenes" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Get Single Scene
Write-Host "`n[4/6] GET /scenes/:id - Find One Scene" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/scenes/$testSceneId" `
        -UseBasicParsing
    
    $scene = $response.Content | ConvertFrom-Json
    
    if ($scene.id -eq $testSceneId -and $scene.name -eq "Test Opening Scene") {
        Write-Host "✅ Retrieved scene ID: $testSceneId (name: $($scene.name))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Scene data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get scene" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Update Scene
Write-Host "`n[5/6] PATCH /scenes/:id - Update Scene" -ForegroundColor Yellow
try {
    $updateBody = @{
        name = "Updated Opening Scene"
        order_index = 1
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/scenes/$testSceneId" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $updateBody `
        -UseBasicParsing
    
    $updated = $response.Content | ConvertFrom-Json
    
    if ($updated.name -eq "Updated Opening Scene" -and $updated.order_index -eq 1) {
        Write-Host "✅ Updated scene ID: $testSceneId (new name: $($updated.name), order: $($updated.order_index))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Update failed or data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to update scene" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Delete Scene
Write-Host "`n[6/6] DELETE /scenes/:id - Remove Scene" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/scenes/$testSceneId" `
        -Method DELETE `
        -UseBasicParsing
    
    # Try to get the deleted scene - should return 404
    try {
        $getResponse = Invoke-WebRequest -Uri "$baseUrl/scenes/$testSceneId" `
            -UseBasicParsing -ErrorAction Stop
        Write-Host "❌ Scene still exists after deletion" -ForegroundColor Red
        $testsFailed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Scene ID: $testSceneId successfully deleted (confirmed 404)" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
            $testsFailed++
        }
    }
} catch {
    Write-Host "❌ Failed to delete scene" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed/6" -ForegroundColor Green
Write-Host "Failed: $testsFailed/6" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ ALL SCENES TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
