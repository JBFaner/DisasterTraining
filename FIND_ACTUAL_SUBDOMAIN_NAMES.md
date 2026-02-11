# Find Actual Subdomain Names

## Problem
Some subdomains return "Could not resolve host" which means the DNS subdomain names don't match what we configured.

## Solution: Find the Actual Subdomain Names

### Option 1: Check DNS Records

```bash
# Check what subdomains exist in DNS
dig +short alertaraqc.com | grep -v "^$"
nslookup alertaraqc.com

# Or check Apache access logs for what subdomains are being accessed
grep "alertaraqc.com" /var/log/apache2/access.log | awk '{print $1, $11}' | sort | uniq
```

### Option 2: Check Existing Apache/Nginx Configs

```bash
# Check if there are other configs we missed
ls -la /etc/apache2/sites-available/
ls -la /etc/apache2/sites-enabled/

# Check Nginx configs (some might be using Nginx)
ls -la /etc/nginx/sites-available/ 2>/dev/null
ls -la /etc/nginx/sites-enabled/ 2>/dev/null

# Search for any configs mentioning alertaraqc
grep -r "alertaraqc" /etc/apache2/sites-available/ 2>/dev/null
grep -r "alertaraqc" /etc/nginx/sites-available/ 2>/dev/null
```

### Option 3: Check What Subdomains Are Actually Being Accessed

```bash
# Check Apache logs for subdomain access
tail -100 /var/log/apache2/access.log | grep alertaraqc.com | awk '{print $11}' | sort | uniq

# Or check error logs
tail -100 /var/log/apache2/error.log | grep alertaraqc
```

### Option 4: Common Subdomain Name Patterns

Based on your directories, the subdomains might be:
- `emergency-communication.alertaraqc.com` (not `emergency-comm`)
- `community-policing.alertaraqc.com` (might be correct, but DNS not set)
- `safety-campaign.alertaraqc.com` (might be correct, but DNS not set)
- Or they might use underscores: `community_policing.alertaraqc.com`

### Quick Fix: Test Common Variations

```bash
# Test different subdomain name patterns
curl -I http://emergency-communication.alertaraqc.com
curl -I http://community-policing.alertaraqc.com  
curl -I http://safety-campaign.alertaraqc.com
curl -I http://safety.alertaraqc.com
curl -I http://community.alertaraqc.com
```

## Next Steps

1. Find the actual subdomain names (use the commands above)
2. Update the Apache configs with the correct ServerName
3. Or create DNS records for the subdomains if they don't exist yet
