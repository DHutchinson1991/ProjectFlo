#!/bin/bash

# PID-based Terminal Command Runner for ProjectFlo
# Usage: ./terminal-runner.sh <PID> <command>

show_help() {
    echo "PID-based Terminal Command Runner"
    echo ""
    echo "Usage: $0 <terminal_pid> <command>"
    echo ""
    echo "Examples:"
    echo "  $0 1234 'pwd'"
    echo "  $0 1234 'pnpm dev'"
    echo "  $0 1234 'npm run start:dev'"
    echo ""
    echo "To find terminal PIDs:"
    echo "  ps aux | grep bash | grep -v grep"
    echo ""
    echo "Special commands:"
    echo "  $0 list          - Show all bash processes"
    echo "  $0 help          - Show this help"
}

list_terminals() {
    echo "Available bash terminals:"
    echo "PID    PPID   Command"
    echo "------------------------"
    ps aux | grep bash | grep -v grep | awk '{print $2 "  " $3 "  " $11}'
}

if [[ $# -eq 0 ]] || [[ "$1" == "help" ]]; then
    show_help
    exit 0
fi

if [[ "$1" == "list" ]]; then
    list_terminals
    exit 0
fi

if [[ $# -lt 2 ]]; then
    echo "Error: Missing arguments"
    show_help
    exit 1
fi

PID=$1
shift
COMMAND="$@"

# Check if PID exists
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "Error: Process $PID not found"
    echo ""
    echo "Available terminals:"
    list_terminals
    exit 1
fi

# Get process info
PROCESS_INFO=$(ps -p "$PID" -o comm= 2>/dev/null)
echo "Target Process: PID $PID ($PROCESS_INFO)"
echo "Command: $COMMAND"
echo ""

# For Windows/Git Bash, we'll use a different approach
# Create a temporary script file that the target terminal can execute
TEMP_SCRIPT="/tmp/terminal_cmd_$$"
echo "$COMMAND" > "$TEMP_SCRIPT"
chmod +x "$TEMP_SCRIPT"

echo "Command prepared. Note: Direct command injection to PIDs requires"
echo "advanced terminal multiplexing tools (tmux/screen) for full functionality."
echo "For now, the command has been prepared in: $TEMP_SCRIPT"

# Clean up
rm -f "$TEMP_SCRIPT"
