#!/bin/bash

echo "Starting local server for Frontend..."
echo "You can access the webpage at http://localhost:8080"

# Change directory to Frontend and start the Python HTTP server
cd Frontend || exit
python3 -m http.server 8080
