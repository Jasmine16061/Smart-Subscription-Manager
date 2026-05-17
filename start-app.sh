#!/bin/bash

# Function to handle termination (Ctrl+C)
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Starting Backend server..."
cd Backend || exit
npm run dev &
BACKEND_PID=$!

echo "Starting Frontend server..."
cd ../Frontend || exit
python3 -m http.server 8080 &
FRONTEND_PID=$!

echo "------------------------------------------------"
echo "Both servers are running!"
echo "Frontend webpage: http://localhost:8080"
echo "Press Ctrl+C to stop both servers."
echo "------------------------------------------------"

# Keep the script running to allow Ctrl+C to trigger cleanup
wait
