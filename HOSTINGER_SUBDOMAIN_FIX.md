# Fix: All Subdomains Showing This Application (Hostinger)

## Problem
After deploying to Hostinger, ALL subdomains (emergency-comm.alertaraqc.com, etc.) are showing your disaster-preparedness application instead of their respective applications.

## Root Cause
The web server (Apache) is routing all subdomain requests to your Laravel application's `public` directory. This is a **server configuration issue** on Hostinger, not a Laravel application issue.

## Solution: Fix Hostinger/cPanel Configuration

### Step 1: Access cPanel
1. Log into your Hostinger account
2. Go to **cPanel** (or **hPanel** if using the new interface)

### Step 2: Check Subdomain Configuration

#### In cPanel (Classic):
1. Go to **Subdomains** section
2. Find `disaster-preparedness` subdomain
3. Check the **Document Root** - it should point to:
   ```
   public_html/disaster-preparedness
   ```
   Or if your app is in a subdirectory:
   ```
   public_html/disaster-preparedness/public
   ```

#### In hPanel (New):
1. Go to **Domains** → **Subdomains**
2. Find `disaster-preparedness` subdomain
3. Verify the **Document Root** path

### Step 3: Verify Other Subdomains

For each OTHER subdomain (like `emergency-comm`):
1. Check that its **Document Root** points to its own directory, NOT to your disaster-preparedness directory
2. Example for `emergency-comm`:
   ```
   public_html/emergency-comm
   ```
   or
   ```
   public_html/emergency-comm/public
   ```

### Step 4: Check Directory Structure

Your directory structure should look like this:

```
public_html/
├── disaster-preparedness/          # Your Laravel app
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                    # This is the document root
│   │   ├── index.php
│   │   ├── .htaccess
│   │   └── ...
│   ├── resources/
│   ├── routes/
│   └── ...
├── emergency-comm/                 # Other subdomain's app
│   └── (its own files)
└── (other subdomains...)
```

### Step 5: Fix Document Root in cPanel

**For disaster-preparedness subdomain:**
1. Go to **Subdomains** in cPanel
2. Click **Manage** or **Edit** next to `disaster-preparedness`
3. Set Document Root to: `public_html/disaster-preparedness/public`
4. Save changes

**For other subdomains:**
1. Edit each subdomain
2. Make sure Document Root points to THEIR directory, not disaster-preparedness
3. Example: `public_html/emergency-comm/public` (or wherever their app is)

### Step 6: Alternative - Using .htaccess in Root (If Subdomain Management Doesn't Work)

If you can't change the subdomain document root, you can add a check in the root `public_html/.htaccess`:

```apache
# Only process requests for disaster-preparedness subdomain
RewriteEngine On
RewriteCond %{HTTP_HOST} !^disaster-preparedness\.alertaraqc\.com$ [NC]
RewriteRule ^disaster-preparedness/ - [L]

# For other subdomains, don't process disaster-preparedness routes
RewriteCond %{HTTP_HOST} ^emergency-comm\.alertaraqc\.com$ [NC]
RewriteRule ^disaster-preparedness/ - [F,L]
```

**However, this is a workaround. The proper fix is Step 5 above.**

## Safety Measures Added to Your Application

I've added two safety measures to prevent other subdomains from accessing your app:

### 1. .htaccess Block (in `public/.htaccess`)
Blocks requests at the web server level before PHP even runs.

### 2. ValidateSubdomain Middleware
Blocks requests at the application level (backup safety measure).

These will prevent other subdomains from accessing your app, but **the proper fix is to configure the server correctly** so each subdomain points to its own directory.

## Verification Steps

After fixing the configuration:

1. **Test your subdomain:**
   ```
   https://disaster-preparedness.alertaraqc.com
   ```
   Should show your application ✅

2. **Test other subdomains:**
   ```
   https://emergency-comm.alertaraqc.com
   ```
   Should show THEIR application, NOT yours ✅

3. **Check HTTPS:**
   - All subdomains should use HTTPS
   - No mixed content warnings

## Common Issues

### Issue: "I can't find the Subdomains section in cPanel"
- Look for **Subdomains** in the **Domains** section
- Or search for "subdomain" in cPanel search
- In hPanel, go to **Domains** → **Subdomains**

### Issue: "The Document Root field is grayed out"
- You may need to delete and recreate the subdomain
- Or contact Hostinger support to change it

### Issue: "I don't have access to cPanel"
- Contact Hostinger support
- Ask them to set the document root for `disaster-preparedness.alertaraqc.com` to point to your Laravel app's `public` directory
- Ask them to verify other subdomains point to their own directories

### Issue: "After fixing, I get 403 Forbidden"
- Check file permissions (folders: 755, files: 644)
- Check that the `public` directory exists and has `index.php`
- Check `.htaccess` file exists in `public` directory

## File Permissions (If Needed)

If you have SSH access, set correct permissions:

```bash
# Navigate to your app directory
cd ~/public_html/disaster-preparedness

# Set directory permissions
find . -type d -exec chmod 755 {} \;

# Set file permissions
find . -type f -exec chmod 644 {} \;

# Make storage writable
chmod -R 775 storage bootstrap/cache
```

## Contact Hostinger Support

If you can't fix it yourself, contact Hostinger support with this message:

> "I have multiple subdomains on alertaraqc.com. After deploying my Laravel application to the disaster-preparedness subdomain, all my other subdomains (like emergency-comm.alertaraqc.com) are now showing the disaster-preparedness application instead of their own applications.
> 
> Please verify that:
> 1. The subdomain 'disaster-preparedness.alertaraqc.com' has its document root set to: public_html/disaster-preparedness/public
> 2. Other subdomains (like emergency-comm.alertaraqc.com) have their document roots set to their respective directories, NOT to the disaster-preparedness directory.
> 
> Each subdomain should point to its own application directory."

## Summary

**The fix is in Hostinger's server configuration, not in your Laravel code.**

1. ✅ Each subdomain must have its own Document Root
2. ✅ `disaster-preparedness` → `public_html/disaster-preparedness/public`
3. ✅ `emergency-comm` → `public_html/emergency-comm/public` (or wherever their app is)
4. ✅ Safety measures added to prevent cross-subdomain access

After fixing the server configuration, clear Laravel cache:
```bash
php artisan config:clear
php artisan cache:clear
```
