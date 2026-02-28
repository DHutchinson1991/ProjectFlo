# Test Music Module - Scene and Moment Music Management
Write-Host "=== MUSIC MODULE TESTS ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3002"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "`n[1/8] Backend Health Check" -ForegroundColor Yellow
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

# Test 2: Setup - Get or Create Film, Scene, and Moment
Write-Host "`n[2/8] Setup: Get or Create Film, Scene, and Moment" -ForegroundColor Yellow
Write-Host "`n[Prep] Getting Film and Scene ID for testing..." -ForegroundColor Gray
try {
    $filmsResponse = Invoke-WebRequest -Uri "$baseUrl/films" -UseBasicParsing
    $films = $filmsResponse.Content | ConvertFrom-Json
    
    if ($films.Count -gt 0) {
        $testFilmId = $films[0].id
        Write-Host "  Using Film ID: $testFilmId" -ForegroundColor Gray
    } else {
        Write-Host "  No films found, creating test film..." -ForegroundColor Gray
        $createFilmBody = @{
            name = "Test Film for Music"
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
    
    # Create a scene for the music
    Write-Host "  Creating test scene..." -ForegroundColor Gray
    $createSceneBody = @{
        name = "Test Scene for Music"
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

# Test 2: Create Scene Music
Write-Host "`n[2/6] POST /music/scenes/:sceneId/music - Create Scene Music" -ForegroundColor Yellow
try {
    $createMusicBody = @{
        music_name = "Background Orchestration"
        artist = "Composer One"
        duration = 300
        music_type = "ORCHESTRAL"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/music/scenes/$testSceneId/music" `
        -Method POST `
        -ContentType "application/json" `
        -Body $createMusicBody `
        -UseBasicParsing
    
    $music = $response.Content | ConvertFrom-Json
    
    if ($music.music_name -eq "Background Orchestration" -and $music.music_type -eq "ORCHESTRAL") {
        Write-Host "✅ Created scene music ID: $($music.id) (name: $($music.music_name), type: $($music.music_type))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Music created but data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to create scene music" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Get Scene Music
Write-Host "`n[3/6] GET /music/scenes/:sceneId/music - Get Scene Music" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/music/scenes/$testSceneId/music" `
        -UseBasicParsing
    
    $music = $response.Content | ConvertFrom-Json
    
    if ($music.music_name -eq "Background Orchestration") {
        Write-Host "✅ Retrieved scene music: $($music.music_name) by $($music.artist)" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Music data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get scene music" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Update Scene Music
Write-Host "`n[4/6] PATCH /music/scenes/:sceneId/music - Update Scene Music" -ForegroundColor Yellow
try {
    $updateBody = @{
        music_name = "Updated Orchestration"
        music_type = "ORCHESTRAL"
        duration = 350
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$baseUrl/music/scenes/$testSceneId/music" `
        -Method PATCH `
        -ContentType "application/json" `
        -Body $updateBody `
        -UseBasicParsing
    
    $updated = $response.Content | ConvertFrom-Json
    
    if ($updated.music_name -eq "Updated Orchestration" -and $updated.music_type -eq "ORCHESTRAL") {
        Write-Host "✅ Updated scene music (new name: $($updated.music_name), type: $($updated.music_type))" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ Update failed or data mismatch" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to update scene music" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Get Music Types
Write-Host "`n[5/6] GET /music/types - Get Available Music Types" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/music/types" `
        -UseBasicParsing
    
    $types = $response.Content | ConvertFrom-Json
    $typeCount = if ($types -is [array]) { $types.Count } else { 1 }
    
    if ($typeCount -gt 0) {
        Write-Host "✅ Found $typeCount music types available" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "❌ No music types found" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "❌ Failed to get music types" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Delete Scene Music
Write-Host "`n[6/6] DELETE /music/scenes/:sceneId/music - Remove Scene Music" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/music/scenes/$testSceneId/music" `
        -Method DELETE `
        -UseBasicParsing
    
    # Try to get the deleted music - should return 404
    try {
        $getResponse = Invoke-WebRequest -Uri "$baseUrl/music/scenes/$testSceneId/music" `
            -UseBasicParsing -ErrorAction Stop
        Write-Host "❌ Music still exists after deletion" -ForegroundColor Red
        $testsFailed++
    } catch {
        if ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "✅ Scene music successfully deleted (confirmed 404)" -ForegroundColor Green
            $testsPassed++
        } else {
            Write-Host "❌ Unexpected error: $_" -ForegroundColor Red
            $testsFailed++
        }
    }
} catch {
    Write-Host "❌ Failed to delete scene music" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    $testsFailed++
}

# Test Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed/6" -ForegroundColor Green
Write-Host "Failed: $testsFailed/6" -ForegroundColor $(if ($testsFailed -eq 0) { "Green" } else { "Red" })

if ($testsFailed -eq 0) {
    Write-Host "`n✅ ALL MUSIC TESTS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
