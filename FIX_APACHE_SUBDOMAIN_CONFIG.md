# Fix Apache Configuration for Subdomain Routing

## Problem Identified
From your SSH output, I can see:
1. Apache configs exist for `disaster-preparedness.alertaraqc.com`
2. Other subdomains have directories but may not have Apache configs
3. The default Apache config might be catching all requests

## Solution: Check and Fix Apache Virtual Hosts

Run these commands in SSH to diagnose and fix:

### Step 1: View Current Apache Configs

```bash
# View the disaster-training config
cat /etc/apache2/sites-available/disaster-training.conf

# View the SSL config
cat /etc/apache2/sites-available/disaster-training-le-ssl.conf

# View the default config
cat /etc/apache2/sites-available/000-default.conf

# Check if other subdomains have configs
ls -la /etc/apache2/sites-available/ | grep -i "emergency\|community\|safety"
```

### Step 2: Check What's Actually Configured

The issue is likely that:
- `000-default.conf` is catching all subdomains
- OR `disaster-training.conf` is configured as a catch-all
- Other subdomains don't have their own virtual hosts

### Step 3: Fix the Disaster-Training Config

The config should ONLY respond to `disaster-preparedness.alertaraqc.com`. Let's check and fix it.
