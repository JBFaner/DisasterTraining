# Apache Subdomain Configuration Fix

## Problem
All subdomains are pointing to your disaster-training application because:
1. The default Apache config (000-default.conf) is catching all requests
2. OR the disaster-training config is set as a catch-all
3. Other subdomains don't have their own Apache virtual host configurations

## Solution

### Step 1: View Current Configurations

Run these commands in SSH:

```bash
# View the disaster-training config
cat /etc/apache2/sites-available/disaster-training.conf

# View the SSL config  
cat /etc/apache2/sites-available/disaster-training-le-ssl.conf

# View the default config (this is likely the problem)
cat /etc/apache2/sites-available/000-default.conf
```

### Step 2: Identify the Issue

The `000-default.conf` is probably set as the catch-all and pointing to `/var/www/html`, which contains your disaster-training app. We need to:

1. **Fix disaster-training config** to ONLY respond to `disaster-preparedness.alertaraqc.com`
2. **Fix default config** to NOT catch subdomains, or route them properly
3. **Create configs for other subdomains** (if they don't exist)

### Step 3: Fix the Configurations

Based on your directory structure:
- `disaster-preparedness.alertaraqc.com` → `/var/www/html/disaster_training_alertaraqc/my-app/public`
- `emergency-comm.alertaraqc.com` → `/var/www/html/EMERGENCY-COM` or `/var/www/html/emergency_communication_alertaraqc`
- Other subdomains → their respective directories

#### Fix 1: Update disaster-training.conf

The config should look like this:

```apache
<VirtualHost *:80>
    ServerName disaster-preparedness.alertaraqc.com
    ServerAlias www.disaster-preparedness.alertaraqc.com
    
    DocumentRoot /var/www/html/disaster_training_alertaraqc/my-app/public
    
    <Directory /var/www/html/disaster_training_alertaraqc/my-app/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/disaster-preparedness-error.log
    CustomLog ${APACHE_LOG_DIR}/disaster-preparedness-access.log combined
</VirtualHost>
```

#### Fix 2: Update disaster-training-le-ssl.conf (SSL version)

```apache
<VirtualHost *:443>
    ServerName disaster-preparedness.alertaraqc.com
    ServerAlias www.disaster-preparedness.alertaraqc.com
    
    DocumentRoot /var/www/html/disaster_training_alertaraqc/my-app/public
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/disaster-preparedness.alertaraqc.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/disaster-preparedness.alertaraqc.com/privkey.pem
    
    <Directory /var/www/html/disaster_training_alertaraqc/my-app/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/disaster-preparedness-ssl-error.log
    CustomLog ${APACHE_LOG_DIR}/disaster-preparedness-ssl-access.log combined
</VirtualHost>
```

#### Fix 3: Update 000-default.conf to NOT catch subdomains

The default config should only handle the main domain or unmatched requests:

```apache
<VirtualHost *:80>
    # Only handle main domain or unmatched requests
    ServerName alertaraqc.com
    ServerAlias www.alertaraqc.com
    
    # Point to main website or a default page
    DocumentRoot /var/www/html
    
    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### Step 4: Create Configs for Other Subdomains

For each other subdomain, create a config file. Example for emergency-comm:

```bash
# Create config for emergency-comm
cat > /etc/apache2/sites-available/emergency-comm.conf << 'EOF'
<VirtualHost *:80>
    ServerName emergency-comm.alertaraqc.com
    ServerAlias www.emergency-comm.alertaraqc.com
    
    # Adjust this path based on where the emergency-comm app actually is
    DocumentRoot /var/www/html/emergency_communication_alertaraqc
    
    <Directory /var/www/html/emergency_communication_alertaraqc>
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

### Step 5: Apply Changes

```bash
# Test Apache configuration
apache2ctl configtest

# If test passes, reload Apache
systemctl reload apache2

# Or restart if needed
systemctl restart apache2
```

## Quick Fix Script

I'll create a script that does this automatically. But first, run the diagnostic:

```bash
cd /var/www/html/disaster_training_alertaraqc
chmod +x fix-apache-subdomains.sh
./fix-apache-subdomains.sh > apache-diagnosis.txt
cat apache-diagnosis.txt
```

Then share the output so I can create the exact fix script for your setup.

## Important Notes

1. **Backup first**: Always backup configs before changing:
   ```bash
   cp /etc/apache2/sites-available/disaster-training.conf /etc/apache2/sites-available/disaster-training.conf.backup
   cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.backup
   ```

2. **Check document roots**: Verify where each subdomain's app actually is:
   ```bash
   ls -la /var/www/html/ | grep -i emergency
   ls -la /var/www/html/ | grep -i community
   ls -la /var/www/html/ | grep -i safety
   ```

3. **SSL certificates**: Other subdomains may need SSL configs too if they use HTTPS.
