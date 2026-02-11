#!/bin/bash

# Fix Other Subdomains - Enable/Create Apache Configs

echo "=========================================="
echo "Checking and Fixing Other Subdomain Configs"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: List all available configs
echo -e "${YELLOW}Step 1: Checking existing Apache configs...${NC}"
echo ""
echo "Available configs in sites-available:"
ls -la /etc/apache2/sites-available/ | grep -v "default\|disaster-training" | grep "\.conf$"
echo ""

echo "Enabled configs in sites-enabled:"
ls -la /etc/apache2/sites-enabled/ | grep -v "default\|disaster-training"
echo ""

# Step 2: Check what subdomain directories exist
echo -e "${YELLOW}Step 2: Checking subdomain directories in /var/www/html...${NC}"
echo ""
SUBDOMAINS=(
    "EMERGENCY-COM:emergency-comm.alertaraqc.com"
    "emergency_communication_alertaraqc:emergency-comm.alertaraqc.com"
    "community_policing_alertaraqc:community-policing.alertaraqc.com"
    "safety_campaign_alertaraqc:safety-campaign.alertaraqc.com"
)

for subdir_info in "${SUBDOMAINS[@]}"; do
    IFS=':' read -r dir subdomain <<< "$subdir_info"
    if [ -d "/var/www/html/$dir" ]; then
        echo -e "${GREEN}Found: $dir${NC}"
        echo "  Should be: $subdomain"
        
        # Check if config exists
        config_name=$(echo "$subdomain" | cut -d'.' -f1)
        if [ -f "/etc/apache2/sites-available/${config_name}.conf" ]; then
            echo -e "  ${GREEN}Config exists: ${config_name}.conf${NC}"
            if [ -L "/etc/apache2/sites-enabled/${config_name}.conf" ]; then
                echo -e "  ${GREEN}Config is ENABLED${NC}"
            else
                echo -e "  ${YELLOW}Config exists but NOT ENABLED - will enable it${NC}"
            fi
        else
            echo -e "  ${RED}No config found - will create one${NC}"
        fi
        echo ""
    fi
done

echo ""
echo "=========================================="
echo "Next: I'll create/enable configs for these subdomains"
echo "=========================================="
