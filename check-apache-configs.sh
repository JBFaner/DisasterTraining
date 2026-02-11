#!/bin/bash

echo "=========================================="
echo "Apache Configuration Diagnostic"
echo "=========================================="
echo ""

echo "=== Current disaster-training.conf ==="
cat /etc/apache2/sites-available/disaster-training.conf
echo ""

echo "=== Current disaster-training-le-ssl.conf ==="
cat /etc/apache2/sites-available/disaster-training-le-ssl.conf
echo ""

echo "=== Current 000-default.conf (THIS IS LIKELY THE PROBLEM) ==="
cat /etc/apache2/sites-available/000-default.conf
echo ""

echo "=== Enabled sites ==="
ls -la /etc/apache2/sites-enabled/
echo ""

echo "=== Other subdomain directories in /var/www/html ==="
ls -ld /var/www/html/EMERGENCY-COM /var/www/html/emergency_communication_alertaraqc /var/www/html/community_policing_alertaraqc /var/www/html/safety_campaign_alertaraqc 2>/dev/null
echo ""

echo "=== Checking for other subdomain configs ==="
ls -la /etc/apache2/sites-available/ | grep -v "default\|disaster-training"
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="
