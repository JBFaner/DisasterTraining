#!/bin/bash

echo "=========================================="
echo "Apache Subdomain Configuration Fix"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking current Apache configurations...${NC}"
echo ""

# Check disaster-training config
echo "=== disaster-training.conf ==="
if [ -f "/etc/apache2/sites-available/disaster-training.conf" ]; then
    cat /etc/apache2/sites-available/disaster-training.conf
    echo ""
else
    echo -e "${RED}Config file not found!${NC}"
fi

echo ""
echo "=== disaster-training-le-ssl.conf ==="
if [ -f "/etc/apache2/sites-available/disaster-training-le-ssl.conf" ]; then
    cat /etc/apache2/sites-available/disaster-training-le-ssl.conf
    echo ""
else
    echo -e "${RED}SSL config file not found!${NC}"
fi

echo ""
echo "=== 000-default.conf (default/catch-all) ==="
if [ -f "/etc/apache2/sites-available/000-default.conf" ]; then
    cat /etc/apache2/sites-available/000-default.conf
    echo ""
else
    echo -e "${RED}Default config file not found!${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking for other subdomain configs...${NC}"
ls -la /etc/apache2/sites-available/ | grep -E "emergency|community|safety|policing" || echo "No other subdomain configs found"

echo ""
echo -e "${YELLOW}Step 3: Checking enabled sites...${NC}"
ls -la /etc/apache2/sites-enabled/

echo ""
echo "=========================================="
echo "Analysis Complete"
echo "=========================================="
echo ""
echo "Next: I'll create fixed configs based on what we find."
echo "The fix will ensure:"
echo "1. disaster-preparedness.alertaraqc.com -> disaster_training_alertaraqc/my-app/public"
echo "2. Other subdomains -> their respective directories"
echo "3. Default config handles unmatched subdomains properly"
