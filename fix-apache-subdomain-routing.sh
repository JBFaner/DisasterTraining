#!/bin/bash

# Apache Subdomain Routing Fix Script
# This script fixes Apache configuration so each subdomain points to its own directory

set -e  # Exit on error

echo "=========================================="
echo "Apache Subdomain Routing Fix"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backup existing configs
echo -e "${YELLOW}Step 1: Backing up existing configurations...${NC}"
BACKUP_DIR="/root/apache-config-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp /etc/apache2/sites-available/disaster-training.conf "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/apache2/sites-available/disaster-training-le-ssl.conf "$BACKUP_DIR/" 2>/dev/null || true
cp /etc/apache2/sites-available/000-default.conf "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}Backups saved to: $BACKUP_DIR${NC}"
echo ""

# Fix disaster-training.conf (HTTP)
echo -e "${YELLOW}Step 2: Fixing disaster-training.conf (HTTP)...${NC}"
cat > /etc/apache2/sites-available/disaster-training.conf << 'EOF'
<VirtualHost *:80>
    ServerName disaster-preparedness.alertaraqc.com
    ServerAlias www.disaster-preparedness.alertaraqc.com
    
    # Redirect to HTTPS
    Redirect permanent / https://disaster-preparedness.alertaraqc.com/
</VirtualHost>
EOF
echo -e "${GREEN}✓ Fixed disaster-training.conf${NC}"
echo ""

# Fix disaster-training-le-ssl.conf (HTTPS)
echo -e "${YELLOW}Step 3: Fixing disaster-training-le-ssl.conf (HTTPS)...${NC}"
cat > /etc/apache2/sites-available/disaster-training-le-ssl.conf << 'EOF'
<VirtualHost *:443>
    ServerName disaster-preparedness.alertaraqc.com
    ServerAlias www.disaster-preparedness.alertaraqc.com
    
    DocumentRoot /var/www/html/disaster_training_alertaraqc/my-app/public
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/disaster-preparedness.alertaraqc.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/disaster-preparedness.alertaraqc.com/privkey.pem
    
    <Directory /var/www/html/disaster_training_alertaraqc/my-app/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/disaster-preparedness-ssl-error.log
    CustomLog ${APACHE_LOG_DIR}/disaster-preparedness-ssl-access.log combined
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
EOF
echo -e "${GREEN}✓ Fixed disaster-training-le-ssl.conf${NC}"
echo ""

# Fix 000-default.conf to NOT catch subdomains
echo -e "${YELLOW}Step 4: Fixing 000-default.conf to not catch subdomains...${NC}"
cat > /etc/apache2/sites-available/000-default.conf << 'EOF'
<VirtualHost *:80>
    # Only handle main domain (alertaraqc.com) or unmatched requests
    # Subdomains should have their own VirtualHost configs
    ServerName alertaraqc.com
    ServerAlias www.alertaraqc.com
    
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Block subdomain requests that don't have their own config
    # This prevents subdomains from being served by the default site
    RewriteEngine On
    RewriteCond %{HTTP_HOST} ^[^.]+\.alertaraqc\.com$ [NC]
    RewriteRule ^(.*)$ - [F,L]
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF
echo -e "${GREEN}✓ Fixed 000-default.conf${NC}"
echo ""

# Test Apache configuration
echo -e "${YELLOW}Step 5: Testing Apache configuration...${NC}"
if apache2ctl configtest; then
    echo -e "${GREEN}✓ Apache configuration is valid${NC}"
    echo ""
    
    # Reload Apache
    echo -e "${YELLOW}Step 6: Reloading Apache...${NC}"
    systemctl reload apache2
    echo -e "${GREEN}✓ Apache reloaded${NC}"
else
    echo -e "${RED}✗ Apache configuration has errors!${NC}"
    echo "Please review the errors above and fix them before reloading."
    echo "You can restore backups from: $BACKUP_DIR"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Fix Complete!${NC}"
echo "=========================================="
echo ""
echo "What was fixed:"
echo "1. ✓ disaster-preparedness.alertaraqc.com now points ONLY to disaster_training_alertaraqc/my-app/public"
echo "2. ✓ Default config no longer catches subdomains"
echo "3. ✓ HTTP requests to disaster-preparedness redirect to HTTPS"
echo ""
echo "Next steps:"
echo "1. Test your subdomain: https://disaster-preparedness.alertaraqc.com"
echo "2. Test other subdomains - they should now show their own apps (or 403 if no config exists)"
echo "3. If other subdomains need configs, create them in /etc/apache2/sites-available/"
echo ""
echo "Backups saved to: $BACKUP_DIR"
echo ""
