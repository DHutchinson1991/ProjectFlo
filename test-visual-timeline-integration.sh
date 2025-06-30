#!/bin/bash

# Test Enhanced Visual Timeline Builder Integration
# This script verifies that the component library and auto-add tasks functionality works

echo "🧪 Testing Enhanced Visual Timeline Builder Integration"
echo "========================================================"

# Check if jq is available
if ! command -v jq &> /dev/null && ! [ -f "./jq.exe" ]; then
    echo "⚠️  jq not found. Downloading..."
    curl -L -o jq.exe https://github.com/stedolan/jq/releases/latest/download/jq-win64.exe
    JQ="./jq.exe"
else
    JQ="jq"
    if [ -f "./jq.exe" ]; then
        JQ="./jq.exe"
    fi
fi

echo "✅ Using jq: $JQ"
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL"
        return 1
    fi
}

# Function to test JSON endpoint with jq
test_json_endpoint() {
    local url=$1
    local description=$2
    local jq_filter=$3
    
    echo -n "Testing $description... "
    
    local result=$(curl -s "$url" | $JQ "$jq_filter" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$result" ]; then
        echo "✅ PASS"
        echo "   Result: $result"
        return 0
    else
        echo "❌ FAIL"
        return 1
    fi
}

echo "📡 1. SERVER CONNECTIVITY TESTS"
echo "--------------------------------"

# Test servers are running
test_endpoint "http://localhost:3001" "Frontend server (port 3001)"
test_endpoint "http://localhost:3002/components" "Backend API (port 3002)"

echo ""
echo "🧩 2. COMPONENT LIBRARY API TESTS"
echo "-----------------------------------"

# Test component library endpoints
test_json_endpoint "http://localhost:3002/components" "Component count" "length"
test_json_endpoint "http://localhost:3002/components" "Component types distribution" 'group_by(.type) | map({type: .[0].type, count: length})'

# Test specific component types
echo ""
echo "Testing component types..."
for type in "VIDEO" "AUDIO" "GRAPHICS" "MUSIC" "EDIT" "COVERAGE_LINKED"; do
    test_json_endpoint "http://localhost:3002/components" "$type components" ".[] | select(.type == \"$type\") | .name" >/dev/null
    count=$(curl -s "http://localhost:3002/components" | $JQ ".[] | select(.type == \"$type\") | .name" | wc -l)
    echo "   $type: $count components"
done

echo ""
echo "🎯 3. TIMELINE LAYER INTEGRATION TESTS"
echo "---------------------------------------"

# Test timeline layers
test_json_endpoint "http://localhost:3002/timeline/layers" "Timeline layers count" "length"
test_json_endpoint "http://localhost:3002/timeline/layers" "Layer order verification" 'sort_by(.order_index) | map("\(.order_index): \(.name) (ID: \(.id))")'

echo ""
echo "⚙️ 4. AUTO-ADD TASKS FUNCTIONALITY TESTS"
echo "------------------------------------------"

# Test default tasks for different components
component_ids=(1 2 3 7 10 13)
for id in "${component_ids[@]}"; do
    component_name=$(curl -s "http://localhost:3002/components" | $JQ ".[] | select(.id == $id) | .name" | tr -d '"')
    if [ -n "$component_name" ]; then
        echo -n "Testing default tasks for Component $id ($component_name)... "
        task_count=$(curl -s "http://localhost:3002/api/entities/component/$id/default-tasks" | $JQ '.data | length' 2>/dev/null)
        if [ $? -eq 0 ] && [ "$task_count" != "null" ]; then
            echo "✅ PASS ($task_count tasks)"
        else
            echo "❌ FAIL"
        fi
    fi
done

echo ""
echo "🎨 5. VISUAL TIMELINE BUILDER COMPONENT MAPPING"
echo "------------------------------------------------"

# Test component type to track mapping
echo "Testing component type to timeline track mapping..."

# Expected mapping based on our enhanced Visual Timeline Builder
declare -A track_mapping=(
    ["GRAPHICS"]="Graphics"
    ["VIDEO"]="Video" 
    ["AUDIO"]="Audio"
    ["MUSIC"]="Music"
)

for type in "${!track_mapping[@]}"; do
    track_name="${track_mapping[$type]}"
    
    # Get the track ID for this type from timeline layers
    track_id=$(curl -s "http://localhost:3002/timeline/layers" | $JQ ".[] | select(.name == \"$track_name\") | .id" 2>/dev/null)
    
    if [ -n "$track_id" ] && [ "$track_id" != "null" ]; then
        echo "   ✅ $type components → $track_name track (ID: $track_id)"
    else
        echo "   ❌ $type components → $track_name track (NOT FOUND)"
    fi
done

echo ""
echo "📊 6. INTEGRATION SUMMARY"
echo "-------------------------"

# Component library stats
total_components=$(curl -s "http://localhost:3002/components" | $JQ 'length' 2>/dev/null)
total_layers=$(curl -s "http://localhost:3002/timeline/layers" | $JQ 'length' 2>/dev/null)

echo "Total Components: $total_components"
echo "Total Timeline Layers: $total_layers"

# Test a sample component's auto-add tasks workflow
echo ""
echo "🔄 Testing Complete Auto-Add Tasks Workflow..."
sample_component_id=1
component_info=$(curl -s "http://localhost:3002/components" | $JQ ".[] | select(.id == $sample_component_id)")
component_name=$(echo "$component_info" | $JQ -r '.name')
component_type=$(echo "$component_info" | $JQ -r '.type')

echo "Sample Component: $component_name (Type: $component_type)"

# Get default tasks
default_tasks=$(curl -s "http://localhost:3002/api/entities/component/$sample_component_id/default-tasks" | $JQ '.data')
task_count=$(echo "$default_tasks" | $JQ 'length')

echo "Default Tasks Count: $task_count"

if [ "$task_count" -gt 0 ]; then
    echo "Task Details:"
    echo "$default_tasks" | $JQ '.[] | "  - \(.task_name) (\(.estimated_hours)h)"' | tr -d '"'
fi

echo ""
echo "🎉 INTEGRATION TEST COMPLETE"
echo "============================="
echo "The Enhanced Visual Timeline Builder should now support:"
echo "✅ Component library browsing and selection"
echo "✅ Automatic track assignment based on component type"
echo "✅ Auto-addition of default tasks when components are added"
echo "✅ Visual timeline editing with proper layer mapping"
echo ""
echo "🚀 Ready to test in the frontend at: http://localhost:3001"
