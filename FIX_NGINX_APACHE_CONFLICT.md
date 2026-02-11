# Fix Nginx/Apache Conflict

## Problem Identified
- Subdomains are configured in **Nginx**, not Apache
- `disaster-training.alertaraqc.com` uses Nginx
- We created Apache configs that won't be used
- The Apache default config we fixed is blocking requests that Nginx might proxy

## Solution

### Step 1: Check if Nginx is Running and Handling Requests

```bash
# Check Nginx status
systemctl status nginx

# Check if Nginx is listening on port 80/443
netstat -tlnp | grep nginx
ss -tlnp | grep nginx

# Check Nginx error logs
tail -50 /var/log/nginx/error.log
```

### Step 2: Check Nginx Configs for disaster-training

```bash
# View the disaster-training Nginx config
cat /etc/nginx/sites-available/disaster-training.alertaraqc.com

# Check if it's proxying to Apache or serving directly
```

### Step 3: The Real Issue

Since subdomains use Nginx, the Apache configs we created won't help. The issue is likely:

1. **Nginx is handling all subdomains** - so they should work
2. **But something is wrong** - maybe Nginx configs need fixing, or there's a conflict

### Step 4: Check What's Actually Happening

```bash
# Test if Nginx is responding
curl -I http://campaign.alertaraqc.com
curl -I http://surveillance.alertaraqc.com
curl -I http://disaster-training.alertaraqc.com

# Check Nginx access logs
tail -20 /var/log/nginx/access.log | grep alertaraqc
```

## Key Finding

The actual subdomain names are:
- `campaign.alertaraqc.com` (not `safety-campaign`)
- `surveillance.alertaraqc.com` (not `community-policing`)
- `emergency-comm.alertaraqc.com` (this one works)
- `disaster-training.alertaraqc.com` (Nginx, not Apache)

## Next Steps

1. Remove the Apache configs we created (they're not needed)
2. Check Nginx configs - they should already be correct
3. The original problem might have been that Nginx wasn't running, or there was a conflict
