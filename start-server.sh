#!/bin/bash
cd "$(dirname "$0")/my-app"
echo "Starting DisasterTraining dev environment (Laravel + queue + Vite)..."
composer run dev
