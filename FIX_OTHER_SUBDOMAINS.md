# Fix Other Subdomains - Enable/Create Apache Configs

## Problem
After fixing the default config, other subdomains are getting 403 errors because:
1. Their Apache configs might exist but aren't enabled
2. OR they don't have Apache configs at all

## Solution: Check and Enable/Create Configs

### Step 1: Check What Configs Exist

```bash
# List all available configs
ls -la /etc/apache2/sites-available/

# List enabled configs
ls -la /etc/apache2/sites-enabled/

# Check for emergency-comm config
ls -la /etc/apache2/sites-available/ | grep -i emergency

# Check for other subdomain configs
ls -la /etc/apache2/sites-available/ | grep -E "community|safety|policing"
```

### Step 2: Check What Directories Exist

Based on your earlier output, you have these directories:
- `/var/www/html/EMERGENCY-COM`
- `/var/www/html/emergency_communication_alertaraqc`
- `/var/www/html/community_policing_alertaraqc`
- `/var/www/html/safety_campaign_alertaraqc`

Let's check which ones actually exist and what they contain:

```bash
# Check each directory
ls -la /var/www/html/EMERGENCY-COM
ls -la /var/www/html/emergency_communication_alertaraqc
ls -la /var/www/html/community_policing_alertaraqc
ls -la /var/www/html/safety_campaign_alertaraqc

# Find which one has index.php or is the actual app
find /var/www/html/EMERGENCY-COM -name "index.php" -o -name "index.html" 2>/dev/null
find /var/www/html/emergency_communication_alertaraqc -name "index.php" -o -name "index.html" 2>/dev/null
```

### Step 3: Enable Existing Configs (If They Exist)

If configs exist but aren't enabled:

```bash
# Enable emergency-comm (if config exists)
a2ensite emergency-comm.conf 2>/dev/null || echo "Config doesn't exist"

# Enable other subdomains
a2ensite community-policing.conf 2>/dev/null || echo "Config doesn't exist"
a2ensite safety-campaign.conf 2>/dev/null || echo "Config doesn't exist"

# Reload Apache
systemctl reload apache2
```

### Step 4: Create Configs for Subdomains That Don't Have Them

#### For emergency-comm.alertaraqc.com

First, determine which directory is the actual app:

```bash
# Check which directory has the actual app
ls -la /var/www/html/EMERGENCY-COM
ls -la /var/www/html/emergency_communication_alertaraqc
```

Then create the config (adjust the DocumentRoot based on what you find):

```bash
# Create HTTP config for emergency-comm
cat > /etc/apache2/sites-available/emergency-comm.conf << 'EOF'
<VirtualHost *:80>
    ServerName emergency-comm.alertaraqc.com
    ServerAlias www.emergency-comm.alertaraqc.com
    
    # Adjust this path based on where the actual app is
    # Check both: /var/www/html/EMERGENCY-COM and /var/www/html/emergency_communication_alertaraqc
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

# Enable it
a2ensite emergency-comm.conf
```

#### For community-policing.alertaraqc.com

```bash
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

a2ensite community-policing.conf
```

#### For safety-campaign.alertaraqc.com

```bash
cat > /etc/apache2/sites-available/safety-campaign.conf << 'EOF'
<VirtualHost *:80>
    ServerName safety-campaign.alertaraqc.com
    ServerAlias www.safety-campaign.alertaraqc.com
    
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

a2ensite safety-campaign.conf
```

### Step 5: Reload Apache

```bash
# Test configuration
apache2ctl configtest

# If OK, reload
systemctl reload apache2
```

## Quick Diagnostic Script

Run this to see what needs to be fixed:

```bash
echo "=== Checking existing configs ==="
ls -la /etc/apache2/sites-available/ | grep -v "default\|disaster-training"

echo ""
echo "=== Checking enabled configs ==="
ls -la /etc/apache2/sites-enabled/ | grep -v "default\|disaster-training"

echo ""
echo "=== Checking subdomain directories ==="
for dir in EMERGENCY-COM emergency_communication_alertaraqc community_policing_alertaraqc safety_campaign_alertaraqc; do
    if [ -d "/var/www/html/$dir" ]; then
        echo "✓ $dir exists"
        ls -la "/var/www/html/$dir" | head -5
    else
        echo "✗ $dir does not exist"
    fi
    echo ""
done
```

## Important Notes

1. **Find the correct DocumentRoot**: Some subdomains might have their app in a `public` subdirectory (like Laravel). Check:
   ```bash
   ls -la /var/www/html/emergency_communication_alertaraqc
   # If you see a 'public' directory, use: /var/www/html/emergency_communication_alertaraqc/public
   ```

2. **SSL Configs**: If these subdomains use HTTPS, you'll need to create SSL configs too (similar to disaster-training-le-ssl.conf)

3. **Subdomain Names**: Make sure the ServerName matches the actual subdomain. Check what subdomains are actually configured in your DNS.

## After Fixing

Test each subdomain:
```bash
curl -I http://emergency-comm.alertaraqc.com
curl -I http://community-policing.alertaraqc.com
curl -I http://safety-campaign.alertaraqc.com
```

They should now show their own websites instead of 403 errors.
