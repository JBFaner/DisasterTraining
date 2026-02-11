# Fix Nginx Startup Error

## Problem
Nginx failed to start. Need to check the error.

## Diagnostic Steps

### Step 1: Check Nginx Status and Error
```bash
systemctl status nginx.service
journalctl -xeu nginx.service --no-pager | tail -50
```

### Step 2: Test Nginx Configuration
```bash
nginx -t
```

This will show syntax errors or configuration issues.

### Step 3: Common Issues

1. **Port conflict** - Apache and Nginx both trying to use port 80/443
2. **Syntax error** in Nginx config files
3. **Missing files** or directories referenced in configs
4. **Permission issues**

### Step 4: Check for Port Conflicts
```bash
# Check what's using ports 80 and 443
netstat -tlnp | grep -E ':80|:443'
ss -tlnp | grep -E ':80|:443'
```

If Apache is using these ports, we need to either:
- Stop Apache (if Nginx should handle everything)
- Configure Nginx to use different ports
- Configure Nginx to proxy to Apache

### Step 5: Check Nginx Error Log
```bash
tail -50 /var/log/nginx/error.log
```
