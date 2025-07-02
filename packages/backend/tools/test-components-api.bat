@echo off
setlocal enabledelayedexpansion

REM ------------- SETUP -------------
REM Base URL for your API
set "API_URL=http://localhost:3000"

REM Authentication - adjust these values for your environment
set "EMAIL=admin@projectflo.io"
set "PASSWORD=password123"

REM ------------- AUTHENTICATION -------------
echo Logging in...
for /f "tokens=*" %%a in ('curl -s -X POST "%API_URL%/auth/login" -H "Content-Type: application/json" -d "{\"email\": \"%EMAIL%\", \"password\": \"%PASSWORD%\"}" ^| jq.exe -r ".access_token"') do (
  set "TOKEN=%%a"
)

if "!TOKEN!"=="" (
  echo Login failed! Please check your credentials.
  exit /b 1
) else if "!TOKEN!"=="null" (
  echo Login failed! Please check your credentials.
  exit /b 1
) else (
  echo Login successful! Token acquired.
)

REM ------------- COMPONENTS API TESTS -------------

REM Get all components
echo.
echo ----- Getting all components -----
curl -s -X GET "%API_URL%/components" -H "Authorization: Bearer !TOKEN!" | jq.exe "."

REM Get components with relations
echo.
echo ----- Getting all components with relations -----
curl -s -X GET "%API_URL%/components/with-relations" -H "Authorization: Bearer !TOKEN!" | jq.exe "."

REM Get component stats
echo.
echo ----- Getting component stats -----
curl -s -X GET "%API_URL%/components/stats" -H "Authorization: Bearer !TOKEN!" | jq.exe "."

REM Get components by type (GRAPHICS, VIDEO, AUDIO, MUSIC)
echo.
echo ----- Getting components by type -----
curl -s -X GET "%API_URL%/components/by-type/VIDEO" -H "Authorization: Bearer !TOKEN!" | jq.exe "."

REM Create a new component
echo.
echo ----- Creating a new component -----
curl -s -X POST "%API_URL%/components" -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"name\":\"Test Component\",\"description\":\"A test component created via API\",\"type\":\"VIDEO\",\"complexity_score\":3,\"estimated_duration\":120,\"default_editing_style\":\"Standard\",\"base_task_hours\":2}" | jq.exe "."

REM Get the ID of the newly created component for further operations
for /f "tokens=*" %%a in ('curl -s -X GET "%API_URL%/components" -H "Authorization: Bearer !TOKEN!" ^| jq.exe ".[] | select(.name==\"Test Component\") | .id"') do (
  set "COMPONENT_ID=%%a"
)

if "!COMPONENT_ID!"=="" (
  echo Could not get component ID. Using a default ID for testing.
  set "COMPONENT_ID=1"
) else (
  echo Got component ID: !COMPONENT_ID!
)

REM Get a specific component with relations
echo.
echo ----- Getting component !COMPONENT_ID! with relations -----
curl -s -X GET "%API_URL%/components/!COMPONENT_ID!/with-relations" -H "Authorization: Bearer !TOKEN!" | jq.exe "."

REM Update a component
echo.
echo ----- Updating component !COMPONENT_ID! -----
curl -s -X PATCH "%API_URL%/components/!COMPONENT_ID!" -H "Content-Type: application/json" -H "Authorization: Bearer !TOKEN!" -d "{\"description\":\"Updated description via API\",\"complexity_score\":4}" | jq.exe "."

REM Delete the test component (optional - uncomment if you want to delete)
echo.
echo ----- Deleting component !COMPONENT_ID! -----
curl -s -X DELETE "%API_URL%/components/!COMPONENT_ID!" -H "Authorization: Bearer !TOKEN!" | jq.exe "."

echo.
echo Tests completed!
