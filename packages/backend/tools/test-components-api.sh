#!/bin/bash

# ------------- SETUP -------------
# Base URL for your API
API_URL="http://localhost:3000"

# Authentication - adjust these values for your environment
EMAIL="admin@projectflo.io"
PASSWORD="password123"

# ------------- AUTHENTICATION -------------
# Login and get JWT token
echo "Logging in..."
TOKEN=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}" | ./jq.exe -r '.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Login failed! Please check your credentials."
  exit 1
else
  echo "Login successful! Token acquired."
fi

# ------------- COMPONENTS API TESTS -------------

# Get all components
echo -e "\n----- Getting all components -----"
curl -s -X GET "${API_URL}/components" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Get components with relations
echo -e "\n----- Getting all components with relations -----"
curl -s -X GET "${API_URL}/components/with-relations" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Get component stats
echo -e "\n----- Getting component stats -----"
curl -s -X GET "${API_URL}/components/stats" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Get components by type (GRAPHICS, VIDEO, AUDIO, MUSIC)
echo -e "\n----- Getting components by type -----"
curl -s -X GET "${API_URL}/components/by-type/VIDEO" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Get coverage-based components
echo -e "\n----- Getting coverage-based components -----"
curl -s -X GET "${API_URL}/components/coverage-based" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Get production components
echo -e "\n----- Getting production components -----"
curl -s -X GET "${API_URL}/components/production" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Create a new component
echo -e "\n----- Creating a new component -----"
curl -s -X POST "${API_URL}/components" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "Test Component",
    "description": "A test component created via API",
    "type": "VIDEO",
    "complexity_score": 3,
    "estimated_duration": 120,
    "default_editing_style": "Standard",
    "base_task_hours": 2
  }' | ./jq.exe '.'

# Get the ID of the newly created component for further operations
COMPONENT_ID=$(curl -s -X GET "${API_URL}/components" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.[] | select(.name=="Test Component") | .id')

if [ -z "$COMPONENT_ID" ] || [ "$COMPONENT_ID" == "null" ]; then
  echo "Could not get component ID. Using a default ID for testing."
  COMPONENT_ID=1
else
  echo "Got component ID: $COMPONENT_ID"
fi

# Get a specific component with relations
echo -e "\n----- Getting component $COMPONENT_ID with relations -----"
curl -s -X GET "${API_URL}/components/$COMPONENT_ID/with-relations" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Update a component
echo -e "\n----- Updating component $COMPONENT_ID -----"
curl -s -X PATCH "${API_URL}/components/$COMPONENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "description": "Updated description via API",
    "complexity_score": 4
  }' | ./jq.exe '.'

# Get component dependencies
echo -e "\n----- Getting dependencies for component $COMPONENT_ID -----"
curl -s -X GET "${API_URL}/components/$COMPONENT_ID/dependencies" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Bulk update task hours
echo -e "\n----- Bulk updating task hours -----"
curl -s -X POST "${API_URL}/components/bulk-update-hours" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "[
    { \"id\": $COMPONENT_ID, \"base_task_hours\": 3 }
  ]" | ./jq.exe '.'

# Get available coverage scenes
echo -e "\n----- Getting available coverage scenes -----"
curl -s -X GET "${API_URL}/components/coverage-scenes/available" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

# Add coverage scenes to a component
echo -e "\n----- Adding coverage scenes to component $COMPONENT_ID -----"
COVERAGE_SCENE_ID=$(curl -s -X GET "${API_URL}/components/coverage-scenes/available" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.[0].id')

if [ -z "$COVERAGE_SCENE_ID" ] || [ "$COVERAGE_SCENE_ID" == "null" ]; then
  echo "No coverage scenes available. Skipping this test."
else
  echo "Using coverage scene ID: $COVERAGE_SCENE_ID"
  curl -s -X POST "${API_URL}/components/$COMPONENT_ID/coverage-scenes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "[
      { \"coverage_scene_id\": $COVERAGE_SCENE_ID }
    ]" | ./jq.exe '.'
fi

# Add music options to a component
echo -e "\n----- Adding music options to component $COMPONENT_ID -----"
curl -s -X POST "${API_URL}/components/$COMPONENT_ID/music-options" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '[
    { "music_type": "MODERN", "weight": 5 },
    { "music_type": "PIANO", "weight": 3 }
  ]' | ./jq.exe '.'

# Get music option ID for further operations
MUSIC_OPTION_ID=$(curl -s -X GET "${API_URL}/components/$COMPONENT_ID/with-relations" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.music_options[0].id')

if [ -z "$MUSIC_OPTION_ID" ] || [ "$MUSIC_OPTION_ID" == "null" ]; then
  echo "Could not get music option ID. Skipping related tests."
else
  echo "Got music option ID: $MUSIC_OPTION_ID"
  
  # Update music option weight
  echo -e "\n----- Updating music option $MUSIC_OPTION_ID weight -----"
  curl -s -X PATCH "${API_URL}/components/music-options/$MUSIC_OPTION_ID/weight" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
      "weight": 8
    }' | ./jq.exe '.'
  
  # Remove a music option
  echo -e "\n----- Removing music option $MUSIC_OPTION_ID from component $COMPONENT_ID -----"
  curl -s -X DELETE "${API_URL}/components/$COMPONENT_ID/music-options/$MUSIC_OPTION_ID" \
    -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'
fi

# Remove coverage scene if we added one
if [ -n "$COVERAGE_SCENE_ID" ] && [ "$COVERAGE_SCENE_ID" != "null" ]; then
  echo -e "\n----- Removing coverage scene $COVERAGE_SCENE_ID from component $COMPONENT_ID -----"
  curl -s -X DELETE "${API_URL}/components/$COMPONENT_ID/coverage-scenes/$COVERAGE_SCENE_ID" \
    -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'
fi

# Delete the test component
echo -e "\n----- Deleting component $COMPONENT_ID -----"
curl -s -X DELETE "${API_URL}/components/$COMPONENT_ID" \
  -H "Authorization: Bearer ${TOKEN}" | ./jq.exe '.'

echo -e "\nTests completed!"
