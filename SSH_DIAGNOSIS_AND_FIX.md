# SSH-Based Diagnosis and Fix for Subdomain Issue

## Your Current Location
Based on your SSH output, you're in:
```
/var/www/html/disaster_training_alertaraqc/my-app
```

## Step 1: Understand Your Directory Structure

Run these commands in SSH to understand the setup:

```bash
# See where you are
pwd

# Go to parent directory
cd /var/www/html

# List all directories
ls -la

# Check if there's a public_html or www directory
ls -la /var/www/

# Check the structure of your app
cd /var/www/html/disaster_training_alertaraqc
ls -la
```

## Step 2: Find Where Subdomains Are Configured

Hostinger typically uses Apache. Let's check the Apache configuration:

```bash
# Check Apache virtual host configurations
ls -la /etc/apache2/sites-available/
ls -la /etc/apache2/sites-enabled/

# Or check Apache conf.d
ls -la /etc/apache2/conf.d/
ls -la /etc/apache2/conf-available/

# View the main Apache config (if you have access)
cat /etc/apache2/apache2.conf | grep -i "disaster\|emergency\|alertaraqc"
```

## Step 3: Check for .htaccess in Parent Directories

The issue might be a parent .htaccess routing everything to your app:

```bash
# Check for .htaccess in parent directories
ls -la /var/www/html/.htaccess
ls -la /var/www/html/disaster_training_alertaraqc/.htaccess

# If they exist, view them
cat /var/www/html/.htaccess
cat /var/www/html/disaster_training_alertaraqc/.htaccess
```

## Step 4: Check Document Root Configuration

```bash
# Check Apache virtual hosts for your domain
grep -r "alertaraqc.com" /etc/apache2/sites-available/ 2>/dev/null
grep -r "alertaraqc.com" /etc/apache2/sites-enabled/ 2>/dev/null

# Or check in conf.d
grep -r "alertaraqc.com" /etc/apache2/conf.d/ 2>/dev/null
```

## Step 5: Check Where Other Subdomains Should Be

```bash
# List all directories that might be other subdomains
cd /var/www/html
ls -la

# Check if there are directories for other subdomains
# For example, if emergency-comm should be in a separate directory
ls -la | grep -i emergency
```

## Step 6: Solution Options

### Option A: If All Subdomains Point to Same Directory

If Hostinger is routing all subdomains to `/var/www/html/disaster_training_alertaraqc`, we need to add routing logic.

**Create/Update parent .htaccess:**

```bash
# Navigate to the parent directory
cd /var/www/html/disaster_training_alertaraqc

# Create or edit .htaccess
nano .htaccess
```

Add this content:

```apache
RewriteEngine On

# Only allow disaster-preparedness subdomain to access this directory
RewriteCond %{HTTP_HOST} !^disaster-preparedness\.alertaraqc\.com$ [NC]
RewriteCond %{REQUEST_URI} ^/disaster_training_alertaraqc [NC]
RewriteRule ^(.*)$ - [F,L]

# If request is for disaster-preparedness, route to my-app/public
RewriteCond %{HTTP_HOST} ^disaster-preparedness\.alertaraqc\.com$ [NC]
RewriteCond %{REQUEST_URI} !^/disaster_training_alertaraqc/my-app/public
RewriteRule ^(.*)$ /disaster_training_alertaraqc/my-app/public/$1 [L]
```

### Option B: Check if There's a Web Root Directory

Hostinger might use a different structure. Check:

```bash
# Check for symlinks or actual web root
ls -la /var/www/html | grep -E "public_html|www|html"

# Check if there's a user home directory with public_html
ls -la ~/public_html 2>/dev/null
ls -la /home/*/public_html 2>/dev/null
```

### Option C: Contact Hostinger Support

Since you can't change document roots in hPanel, you'll need to contact support. Use this message:

```
Subject: Subdomain Document Root Configuration Issue

Hello,

I have multiple subdomains on alertaraqc.com:
- disaster-preparedness.alertaraqc.com (Laravel app)
- emergency-comm.alertaraqc.com (different app)
- Other subdomains with their own applications

Currently, all subdomains are showing the disaster-preparedness application. 
This is because all subdomains are pointing to the same document root.

My Laravel application is located at:
/var/www/html/disaster_training_alertaraqc/my-app

The public directory (document root) should be:
/var/www/html/disaster_training_alertaraqc/my-app/public

Could you please:
1. Set the document root for 'disaster-preparedness.alertaraqc.com' to:
   /var/www/html/disaster_training_alertaraqc/my-app/public

2. Verify that other subdomains (like emergency-comm.alertaraqc.com) 
   have their document roots set to their respective directories, 
   NOT to the disaster_training_alertaraqc directory.

Each subdomain should point to its own application directory.

Thank you!
```

## Step 7: Temporary Fix - Application-Level Blocking

While waiting for support, the safety measures I added will block other subdomains. But let's verify they're working:

```bash
# Make sure the .htaccess in public directory has the subdomain check
cd /var/www/html/disaster_training_alertaraqc/my-app/public
cat .htaccess | grep -A 5 "Block requests"
```

The .htaccess should have this block (which I already added):
```apache
# Block requests from other subdomains
RewriteCond %{HTTP_HOST} !^disaster-preparedness\.alertaraqc\.com$ [NC]
RewriteCond %{HTTP_HOST} !^localhost$ [NC]
RewriteCond %{HTTP_HOST} !^127\.0\.0\.1$ [NC]
RewriteCond %{HTTP_HOST} !^.*:8000$ [NC]
RewriteRule ^(.*)$ - [F,L]
```

## Step 8: Check Current Web Server Setup

```bash
# Check what web server is running
systemctl status apache2
# or
systemctl status nginx

# Check Apache modules
apache2ctl -M | grep rewrite

# Check if mod_rewrite is enabled
a2enmod rewrite
systemctl restart apache2
```

## Step 9: Verify File Permissions

```bash
# Navigate to your app
cd /var/www/html/disaster_training_alertaraqc/my-app

# Set correct permissions
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# Make storage writable
chmod -R 775 storage bootstrap/cache

# Set ownership (adjust user:group as needed)
# chown -R www-data:www-data .
```

## Step 10: Clear Laravel Cache

```bash
cd /var/www/html/disaster_training_alertaraqc/my-app
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## Quick Diagnostic Script

Run this to gather all information:

```bash
#!/bin/bash
echo "=== Directory Structure ==="
pwd
ls -la /var/www/html/

echo -e "\n=== Your App Structure ==="
ls -la /var/www/html/disaster_training_alertaraqc/

echo -e "\n=== Apache Sites ==="
ls -la /etc/apache2/sites-available/ 2>/dev/null || echo "No access"
ls -la /etc/apache2/sites-enabled/ 2>/dev/null || echo "No access"

echo -e "\n=== .htaccess Files ==="
find /var/www/html -name ".htaccess" -type f 2>/dev/null

echo -e "\n=== Apache Config for alertaraqc ==="
grep -r "alertaraqc" /etc/apache2/sites-available/ 2>/dev/null || echo "No access"
grep -r "alertaraqc" /etc/apache2/sites-enabled/ 2>/dev/null || echo "No access"

echo -e "\n=== Web Server Status ==="
systemctl status apache2 --no-pager 2>/dev/null || systemctl status nginx --no-pager 2>/dev/null || echo "Cannot check"
```

Save this as `diagnose.sh`, make it executable, and run it:
```bash
chmod +x diagnose.sh
./diagnose.sh > diagnosis_output.txt
cat diagnosis_output.txt
```

## What to Do Next

1. **Run the diagnostic commands above** to understand your setup
2. **Share the output** so we can provide a more specific solution
3. **Contact Hostinger support** with the message above if you can't fix it via SSH
4. **The safety measures are already in place** - other subdomains will get a 403 error instead of showing your app

## Important Notes

- The `.htaccess` block I added will prevent other subdomains from accessing your app
- The `ValidateSubdomain` middleware provides an additional layer of protection
- The **proper fix** requires Hostinger to configure each subdomain's document root correctly
- Until that's fixed, other subdomains will get a 403 Forbidden error (which is better than showing the wrong app)
