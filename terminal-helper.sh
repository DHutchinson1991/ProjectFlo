#!/bin/bash

# Terminal Helper for ProjectFlo
# This script detects VS Code terminal names and routes commands appropriately

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log() {
    echo -e "${BLUE}[TERMINAL-HELPER]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to detect current terminal name based on working directory
detect_terminal_name() {
    local current_dir=$(pwd)
    
    if [[ "$current_dir" =~ backend$ ]]; then
        echo "Backend"
    elif [[ "$current_dir" =~ frontend$ ]]; then
        echo "Frontend"
    elif [[ "$current_dir" =~ ProjectFlo$ ]]; then
        echo "Servers"  # Root directory, likely Servers terminal
    else
        echo "General"  # Default fallback
    fi
}

# Function to validate we're in the expected terminal
validate_terminal() {
    local expected_terminal="$1"
    local current_dir=$(pwd)
    
    case "$expected_terminal" in
        "Servers"|"servers"|"SERVERS")
            if [[ ! "$current_dir" =~ ProjectFlo$ ]]; then
                error "Expected to be in Servers terminal (root directory)"
                error "Current directory: $current_dir"
                error "Please switch to the 'Servers' terminal"
                return 1
            fi
            ;;
        "Backend"|"backend"|"BACKEND")
            if [[ ! "$current_dir" =~ backend$ ]]; then
                error "Expected to be in Backend terminal"
                error "Current directory: $current_dir"
                error "Please switch to the 'Backend' terminal"
                return 1
            fi
            ;;
        "Frontend"|"frontend"|"FRONTEND")
            if [[ ! "$current_dir" =~ frontend$ ]]; then
                error "Expected to be in Frontend terminal"
                error "Current directory: $current_dir"
                error "Please switch to the 'Frontend' terminal"
                return 1
            fi
            ;;
        "General"|"general"|"GENERAL")
            # General can be anywhere, but typically root
            ;;
    esac
    return 0
}

# Function to show current terminal status
show_status() {
    local detected_name=$(detect_terminal_name)
    local current_dir=$(pwd)
    
    echo ""
    echo "=================================================="
    echo "📍 TERMINAL STATUS"
    echo "=================================================="
    echo "Current Directory: $current_dir"
    echo "Detected Terminal: $detected_name"
    echo ""
    
    # Show appropriate commands based on detection
    case "$detected_name" in
        "Servers"|"servers")
            success "✅ SERVERS Terminal Detected"
            echo "Available commands:"
            echo "  • pnpm dev (start both servers)"
            echo "  • npx kill-port 3001 3002 (kill servers)"
            echo "  • pnpm build (build all packages)"
            echo "  • git status (version control)"
            ;;
        "Backend"|"backend")
            success "✅ BACKEND Terminal Detected"
            echo "Available commands:"
            echo "  • npm run start:dev (start backend only)"
            echo "  • npx prisma studio (database browser)"
            echo "  • npx prisma migrate dev (run migrations)"
            echo "  • curl -s http://localhost:3002/components | jq length"
            ;;
        "Frontend"|"frontend")
            success "✅ FRONTEND Terminal Detected"
            echo "Available commands:"
            echo "  • npm run dev (start frontend only)"
            echo "  • npm run build (build frontend)"
            echo "  • npm run lint (lint code)"
            ;;
        "General"|"general")
            success "✅ GENERAL Terminal Detected"
            echo "Available commands:"
            echo "  • git operations"
            echo "  • file management"
            echo "  • general tasks"
            ;;
        *)
            warning "⚠️  Could not detect terminal type"
            echo "Please ensure you're in one of these terminals:"
            echo "  • Servers (for pnpm dev, builds)"
            echo "  • Backend (for database, API work)"
            echo "  • Frontend (for frontend development)"
            echo "  • General (for git, file operations)"
            ;;
    esac
    echo "=================================================="
    echo ""
}

# Function to check server status
check_servers() {
    echo ""
    echo "=================================================="
    echo "🔍 SERVER STATUS CHECK"
    echo "=================================================="
    
    # Check frontend
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        success "✅ Frontend (3001): Running"
    else
        error "❌ Frontend (3001): Not running"
    fi
    
    # Check backend
    if curl -s http://localhost:3002/components > /dev/null 2>&1; then
        success "✅ Backend (3002): Running"
    else
        error "❌ Backend (3002): Not running"
    fi
    
    # Check database connection (if backend is running)
    if curl -s http://localhost:3002/timeline/layers > /dev/null 2>&1; then
        success "✅ Database: Connected"
    else
        error "❌ Database: Connection failed"
    fi
    
    echo "=================================================="
    echo ""
}

# Function to run a command with terminal validation
run_command() {
    local target_terminal="$1"
    shift
    local command="$@"
    
    log "Target terminal: $target_terminal"
    log "Command: $command"
    
    # Validate we're in the correct terminal
    if ! validate_terminal "$target_terminal"; then
        return 1
    fi
    
    success "✅ Executing in correct terminal"
    echo ""
    
    # Execute the command
    eval "$command"
}

# Function to guide user to correct terminal
guide_to_terminal() {
    local target_terminal="$1"
    
    echo ""
    echo "=================================================="
    echo "🎯 TERMINAL NAVIGATION GUIDE"
    echo "=================================================="
    echo "To run this command, please:"
    echo ""
    case "$target_terminal" in
        "Servers"|"servers")
            echo "1. Click on the 'Servers' terminal tab"
            echo "2. Verify you're in the root ProjectFlo directory"
            echo "3. Run the command again"
            ;;
        "Backend"|"backend")
            echo "1. Click on the 'Backend' terminal tab"
            echo "2. Verify you're in the packages/backend directory"
            echo "3. Run the command again"
            ;;
        "Frontend"|"frontend")
            echo "1. Click on the 'Frontend' terminal tab"
            echo "2. Verify you're in the packages/frontend directory"
            echo "3. Run the command again"
            ;;
        "General"|"general")
            echo "1. Click on the 'General' terminal tab"
            echo "2. Run the command again"
            ;;
    esac
    echo "=================================================="
    echo ""
}

# Main command handler
case "${1:-status}" in
    "status")
        show_status
        ;;
    "servers")
        check_servers
        ;;
    "run")
        if [[ $# -lt 3 ]]; then
            error "Usage: $0 run <terminal> <command>"
            echo "Examples:"
            echo "  $0 run servers 'pnpm dev'"
            echo "  $0 run backend 'npm run start:dev'"
            echo "  $0 run frontend 'npm run dev'"
            exit 1
        fi
        run_command "$2" "${@:3}"
        ;;
    "guide")
        if [[ $# -lt 2 ]]; then
            error "Usage: $0 guide <terminal>"
            exit 1
        fi
        guide_to_terminal "$2"
        ;;
    "setup")
        echo ""
        echo "=================================================="
        echo "🚀 TERMINAL SETUP GUIDE"
        echo "=================================================="
        echo "Perfect! You already have named terminals set up:"
        echo ""
        echo "✅ Servers   - For pnpm dev, builds, git operations"
        echo "✅ Frontend  - For frontend development tasks"
        echo "✅ Backend   - For database, API, backend tasks"
        echo "✅ General   - For general file operations"
        echo ""
        echo "The system will automatically detect which terminal"
        echo "you're in and guide you to the right one if needed."
        echo "=================================================="
        echo ""
        ;;
    *)
        echo "Usage: $0 {status|servers|run|guide|setup}"
        echo ""
        echo "Commands:"
        echo "  status          - Show current terminal status"
        echo "  servers         - Check if servers are running"
        echo "  run <term> <cmd> - Run command in specific terminal"
        echo "  guide <term>    - Show navigation guide"
        echo "  setup           - Show setup information"
        echo ""
        echo "Examples:"
        echo "  $0 status"
        echo "  $0 servers"
        echo "  $0 run servers 'pnpm dev'"
        echo "  $0 run backend 'npm run start:dev'"
        echo "  $0 guide backend"
        exit 1
        ;;
esac
