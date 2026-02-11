# Apache Fix - Run These Commands Directly

## Step 1: Check Current Configurations

Run these commands to see what needs fixing:

```bash
# View current disaster-training config
cat /etc/apache2/sites-available/disaster-training.conf

# View SSL config
cat /etc/apache2/sites-available/disaster-training-le-ssl.conf

# View default config (this is likely the problem)
cat /etc/apache2/sites-available/000-default.conf
```

## Step 2: Backup Configs

```bash
# Create backup directory
mkdir -p /root/apache-backup-$(date +%Y%m%d)

# Backup the configs
cp /etc/apache2/sites-available/disaster-training.conf /root/apache-backup-$(date +%Y%m%d)/
cp /etc/apache2/sites-available/disaster-training-le-ssl.conf /root/apache-backup-$(date +%Y%m%d)/
cp /etc/apache2/sites-available/000-default.conf /root/apache-backup-$(date +%Y%m%d)/
```

## Step 3: Fix disaster-training.conf (HTTP)

```bash
cat > /etc/apache2/sites-available/disaster-training.conf << 'EOF'
<VirtualHost *:80>
    ServerName disaster-preparedness.alertaraqc.com
    ServerAlias www.disaster-preparedness.alertaraqc.com
    
    # Redirect to HTTPS
    Redirect permanent / https://disaster-preparedness.alertaraqc.com/
</VirtualHost>
EOF
```

## Step 4: Fix disaster-training-le-ssl.conf (HTTPS)

```bash
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
```

## Step 5: Fix 000-default.conf (This is the KEY fix)

```bash
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
```

## Step 6: Test and Reload

```bash
# Test Apache configuration
apache2ctl configtest

# If test passes, reload Apache
systemctl reload apache2
```

## What This Fixes

1. **disaster-preparedness.alertaraqc.com** → Points ONLY to your Laravel app
2. **000-default.conf** → No longer catches subdomains (blocks them with 403)
3. **Other subdomains** → Will show their own apps if they have configs, or 403 if not

## Verify It Works

After running the commands:

```bash
# Test your subdomain
curl -I https://disaster-preparedness.alertaraqc.com

# Test another subdomain (should NOT show your app)
curl -I http://emergency-comm.alertaraqc.com
```
