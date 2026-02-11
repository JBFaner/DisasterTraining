#!/bin/bash

echo "=========================================="
echo "Subdomain Configuration Diagnostic Script"
echo "=========================================="
echo ""

echo "=== Current Directory ==="
pwd
echo ""

echo "=== Parent Directory Contents ==="
cd /var/www/html 2>/dev/null && ls -la || echo "Cannot access /var/www/html"
echo ""

echo "=== Your App Directory Structure ==="
cd /var/www/html/disaster_training_alertaraqc 2>/dev/null && ls -la || echo "Cannot access app directory"
echo ""

echo "=== Checking for .htaccess Files ==="
find /var/www/html -maxdepth 3 -name ".htaccess" -type f 2>/dev/null | head -10
echo ""

echo "=== Your App's Public .htaccess (first 20 lines) ==="
head -20 /var/www/html/disaster_training_alertaraqc/my-app/public/.htaccess 2>/dev/null || echo "Cannot read .htaccess"
echo ""

echo "=== Checking Apache Configuration ==="
if [ -d "/etc/apache2/sites-available" ]; then
    echo "Apache sites-available:"
    ls -la /etc/apache2/sites-available/ 2>/dev/null | grep -i alertaraqc || echo "No alertaraqc configs found or no access"
    echo ""
    echo "Apache sites-enabled:"
    ls -la /etc/apache2/sites-enabled/ 2>/dev/null | grep -i alertaraqc || echo "No alertaraqc configs found or no access"
else
    echo "Apache config directory not accessible"
fi
echo ""

echo "=== Web Server Status ==="
if systemctl is-active --quiet apache2; then
    echo "Apache2 is running"
elif systemctl is-active --quiet nginx; then
    echo "Nginx is running"
else
    echo "Cannot determine web server status"
fi
echo ""

echo "=== File Permissions Check ==="
cd /var/www/html/disaster_training_alertaraqc/my-app 2>/dev/null && {
    echo "Storage directory permissions:"
    ls -ld storage 2>/dev/null || echo "Storage directory not found"
    echo "Bootstrap cache permissions:"
    ls -ld bootstrap/cache 2>/dev/null || echo "Bootstrap cache not found"
} || echo "Cannot check permissions"
echo ""

echo "=== Laravel Environment ==="
cd /var/www/html/disaster_training_alertaraqc/my-app 2>/dev/null && {
    if [ -f ".env" ]; then
        echo "APP_URL from .env:"
        grep "^APP_URL" .env 2>/dev/null || echo "APP_URL not set"
        echo "APP_ENV:"
        grep "^APP_ENV" .env 2>/dev/null || echo "APP_ENV not set"
    else
        echo ".env file not found"
    fi
} || echo "Cannot check Laravel config"
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Review the output above"
echo "2. The .htaccess in public/ should block other subdomains"
echo "3. Contact Hostinger support to fix document root configuration"
echo "4. See SSH_DIAGNOSIS_AND_FIX.md for detailed instructions"
