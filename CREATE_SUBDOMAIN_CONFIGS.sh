#!/bin/bash

# Create Apache configs for all subdomains

echo "Creating Apache configs for subdomains..."
echo ""

# 1. Emergency Communication
echo "Creating emergency-comm.conf..."
cat > /etc/apache2/sites-available/emergency-comm.conf << 'EOF'
<VirtualHost *:80>
    ServerName emergency-comm.alertaraqc.com
    ServerAlias www.emergency-comm.alertaraqc.com
    
    DocumentRoot /var/www/html/emergency_communication_alertaraqc
    
    <Directory /var/www/html/emergency_communication_alertaraqc>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/emergency-comm-error.log
    CustomLog ${APACHE_LOG_DIR}/emergency-comm-access.log combined
</VirtualHost>
EOF

# 2. Community Policing
echo "Creating community-policing.conf..."
cat > /etc/apache2/sites-available/community-policing.conf << 'EOF'
<VirtualHost *:80>
    ServerName community-policing.alertaraqc.com
    ServerAlias www.community-policing.alertaraqc.com
    
    DocumentRoot /var/www/html/community_policing_alertaraqc
    
    <Directory /var/www/html/community_policing_alertaraqc>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/community-policing-error.log
    CustomLog ${APACHE_LOG_DIR}/community-policing-access.log combined
</VirtualHost>
EOF

# 3. Safety Campaign
echo "Creating safety-campaign.conf..."
cat > /etc/apache2/sites-available/safety-campaign.conf << 'EOF'
<VirtualHost *:80>
    ServerName safety-campaign.alertaraqc.com
    ServerAlias www.safety-campaign.alertaraqc.com
    
    # Check if it needs /public - if index.php is in root, use root; if in public, use /public
    DocumentRoot /var/www/html/safety_campaign_alertaraqc
    
    <Directory /var/www/html/safety_campaign_alertaraqc>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/safety-campaign-error.log
    CustomLog ${APACHE_LOG_DIR}/safety-campaign-access.log combined
</VirtualHost>
EOF

# Enable all configs
echo ""
echo "Enabling configs..."
a2ensite emergency-comm.conf
a2ensite community-policing.conf
a2ensite safety-campaign.conf

# Test and reload
echo ""
echo "Testing Apache configuration..."
if apache2ctl configtest; then
    echo "✓ Configuration is valid"
    echo "Reloading Apache..."
    systemctl reload apache2
    echo "✓ Apache reloaded"
    echo ""
    echo "Configs created and enabled:"
    echo "  - emergency-comm.alertaraqc.com"
    echo "  - community-policing.alertaraqc.com"
    echo "  - safety-campaign.alertaraqc.com"
else
    echo "✗ Configuration has errors!"
    exit 1
fi
