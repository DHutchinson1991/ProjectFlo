#!/bin/bash

# This script runs e2e tests for the contacts API

echo "Running Contacts API e2e tests..."
npm run test:e2e -- -t "Contacts API"
