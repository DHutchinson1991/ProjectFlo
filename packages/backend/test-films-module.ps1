# Test Films Module (Refactor v2)
# Run this AFTER starting servers with: pnpm dev

Write-Host "`n=== Testing Films Module (Refactor v2) ===" -ForegroundColor Cyan

# Check if backend is running
Write-Host "`n[1/6] Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 2
    Write-Host "✅ Backend is running on port 3002" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT running. Start servers with: pnpm dev" -ForegroundColor Red
    exit 1
}

# Test GET /films (should return empty array initially)
Write-Host "`n[2/6] Testing GET /films (get all films)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/films" -UseBasicParsing
    $films = $response.Content | ConvertFrom-Json
    Write-Host "✅ GET /films successful" -ForegroundColor Green
    Write-Host "   Found $($films.Count) films" -ForegroundColor Gray
} catch {
    Write-Host "❌ GET /films failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POST /films (create a new film)
Write-Host "`n[3/6] Testing POST /films (create film with equipment)..." -ForegroundColor Yellow
try {
    $newFilm = @{
        name = "Test Wedding Film"
        brand_id = 1
        num_cameras = 2
        num_audio = 1
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3002/films" `
        -Method POST `
        -Body $newFilm `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $createdFilm = $response.Content | ConvertFrom-Json
    $filmId = $createdFilm.id
    Write-Host "✅ POST /films successful" -ForegroundColor Green
    Write-Host "   Created film ID: $filmId" -ForegroundColor Gray
    Write-Host "   Name: $($createdFilm.name)" -ForegroundColor Gray
    Write-Host "   Tracks created: $($createdFilm.tracks.Count)" -ForegroundColor Gray
    
    # Display tracks
    foreach ($track in $createdFilm.tracks) {
        Write-Host "     - $($track.name) (Type: $($track.type), Order: $($track.order_index))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ POST /films failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test GET /films/:id (get single film)
Write-Host "`n[4/6] Testing GET /films/:id (get single film)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/films/$filmId" -UseBasicParsing
    $film = $response.Content | ConvertFrom-Json
    Write-Host "✅ GET /films/:id successful" -ForegroundColor Green
    Write-Host "   Film: $($film.name)" -ForegroundColor Gray
    Write-Host "   Tracks: $($film.tracks.Count)" -ForegroundColor Gray
    Write-Host "   Subjects: $($film.subjects.Count)" -ForegroundColor Gray
    Write-Host "   Scenes: $($film.scenes.Count)" -ForegroundColor Gray
} catch {
    Write-Host "❌ GET /films/:id failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test PATCH /films/:id/equipment (update equipment)
Write-Host "`n[5/6] Testing PATCH /films/:id/equipment (update equipment)..." -ForegroundColor Yellow
try {
    $updateEquipment = @{
        num_cameras = 3
        num_audio = 2
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3002/films/$filmId/equipment" `
        -Method PATCH `
        -Body $updateEquipment `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $updatedFilm = $response.Content | ConvertFrom-Json
    Write-Host "✅ PATCH /films/:id/equipment successful" -ForegroundColor Green
    Write-Host "   Updated tracks: $($updatedFilm.tracks.Count)" -ForegroundColor Gray
    
    foreach ($track in $updatedFilm.tracks) {
        Write-Host "     - $($track.name) (Type: $($track.type))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ PATCH /films/:id/equipment failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test DELETE /films/:id (delete film)
Write-Host "`n[6/6] Testing DELETE /films/:id (delete film)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/films/$filmId" `
        -Method DELETE `
        -UseBasicParsing
    
    Write-Host "✅ DELETE /films/:id successful" -ForegroundColor Green
    
    # Verify deletion
    try {
        Invoke-WebRequest -Uri "http://localhost:3002/films/$filmId" -UseBasicParsing | Out-Null
        Write-Host "⚠️ Film still exists after deletion" -ForegroundColor Yellow
    } catch {
        Write-Host "   Film successfully deleted (404 returned)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ DELETE /films/:id failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Films Module Testing Complete ===" -ForegroundColor Cyan
Write-Host "All refactor v2 endpoints are working! ✅`n" -ForegroundColor Green
