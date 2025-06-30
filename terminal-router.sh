#!/bin/bash

# Smart Terminal Router for ProjectFlo
# Automatically detects current terminal and switches to the correct one

# Terminal type detection and routing
detect_current_terminal() {
    local current_dir=$(pwd)
    
    if [[ "$current_dir" =~ backend$ ]]; then
        echo "backend"
    elif [[ "$current_dir" =~ frontend$ ]]; then
        echo "frontend"
    elif [[ "$current_dir" =~ ProjectFlo$ ]]; then
        echo "server"  # Root directory = server terminal
    else
        echo "general"  # Default/unknown
    fi
}

# Check if we're in the right terminal for the command type
check_terminal_match() {
    local required_type="$1"
    local current_type=$(detect_current_terminal)
    
    if [[ "$current_type" == "$required_type" ]]; then
        return 0  # Match - we're in the right terminal
    else
        return 1  # No match - need to switch
    fi
}

# Navigate to the correct directory for terminal type
switch_to_terminal() {
    local target_type="$1"
    
    case "$target_type" in
        "server")
            cd "c:/Users/info/Documents/Website Files/ProjectFlo"
            echo "✅ Switched to SERVER terminal (root directory)"
            ;;
        "backend")
            cd "c:/Users/info/Documents/Website Files/ProjectFlo/packages/backend"
            echo "✅ Switched to BACKEND terminal"
            ;;
        "frontend")
            cd "c:/Users/info/Documents/Website Files/ProjectFlo/packages/frontend"
            echo "✅ Switched to FRONTEND terminal"
            ;;
        "general")
            cd "c:/Users/info/Documents/Website Files/ProjectFlo"
            echo "✅ Switched to GENERAL terminal (root directory)"
            ;;
        *)
            echo "❌ Unknown terminal type: $target_type"
            return 1
            ;;
    esac
    
    echo "📍 Current directory: $(pwd)"
    echo ""
}

# Main function to route commands
route_command() {
    local command_type="$1"
    shift
    local command="$@"
    
    echo "🎯 Target: $command_type terminal"
    echo "📋 Command: $command"
    echo ""
    
    # Check if we're already in the right terminal
    if check_terminal_match "$command_type"; then
        local current_type=$(detect_current_terminal)
        echo "✅ Already in $current_type terminal"
        echo "📍 Current directory: $(pwd)"
        echo ""
    else
        local current_type=$(detect_current_terminal)
        echo "🔄 Currently in $current_type terminal, switching to $command_type..."
        switch_to_terminal "$command_type"
    fi
    
    # Execute the command
    echo "⚡ Executing command..."
    eval "$command"
}

# Show current status
show_status() {
    local current_type=$(detect_current_terminal)
    local current_dir=$(pwd)
    
    echo "📍 CURRENT TERMINAL STATUS"
    echo "=========================="
    echo "Type: $current_type"
    echo "Directory: $current_dir"
    echo ""
    
    case "$current_type" in
        "server")
            echo "🚀 SERVER Terminal - Available commands:"
            echo "  • pnpm dev"
            echo "  • pnpm build"
            echo "  • git operations"
            ;;
        "backend")
            echo "🔧 BACKEND Terminal - Available commands:"
            echo "  • npm run start:dev"
            echo "  • npx prisma studio"
            echo "  • npx prisma migrate dev"
            echo "  • curl API tests"
            ;;
        "frontend")
            echo "🎨 FRONTEND Terminal - Available commands:"
            echo "  • npm run dev"
            echo "  • npm run build"
            echo "  • npm run lint"
            ;;
        "general")
            echo "🛠️ GENERAL Terminal - Available commands:"
            echo "  • git operations"
            echo "  • file management"
            echo "  • general tasks"
            ;;
    esac
    echo ""
}

# Quick server status check
check_servers() {
    echo "🔍 SERVER STATUS CHECK"
    echo "====================="
    
    # Check frontend
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo "✅ Frontend (3001): Running"
    else
        echo "❌ Frontend (3001): Not running"
    fi
    
    # Check backend
    if curl -s http://localhost:3002/components > /dev/null 2>&1; then
        echo "✅ Backend (3002): Running"
    else
        echo "❌ Backend (3002): Not running"
    fi
    
    echo ""
}

# Help function
show_help() {
    echo "Smart Terminal Router for ProjectFlo"
    echo ""
    echo "Usage: $0 <command_type> <command>"
    echo ""
    echo "Terminal Types:"
    echo "  server   - Root directory (for pnpm dev, builds, git)"
    echo "  backend  - packages/backend (for database, API work)"
    echo "  frontend - packages/frontend (for frontend development)"
    echo "  general  - Root directory (for general tasks)"
    echo ""
    echo "Examples:"
    echo "  $0 server 'pnpm dev'"
    echo "  $0 backend 'npm run start:dev'"
    echo "  $0 frontend 'npm run build'"
    echo "  $0 general 'git status'"
    echo ""
    echo "Other commands:"
    echo "  $0 status   - Show current terminal status"
    echo "  $0 servers  - Check server status"
    echo "  $0 help     - Show this help"
}

# Main command handler
case "${1:-status}" in
    "status")
        show_status
        ;;
    "servers")
        check_servers
        ;;
    "server"|"backend"|"frontend"|"general")
        if [[ $# -lt 2 ]]; then
            echo "Error: No command provided"
            echo "Usage: $0 $1 '<command>'"
            exit 1
        fi
        route_command "$1" "${@:2}"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Error: Unknown command or terminal type: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
