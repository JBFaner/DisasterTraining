# AlerTara Centralized Login Integration Guide

This guide explains how the Disaster Preparedness Training & Simulation system integrates with the AlerTara Centralized Login System.

## Overview

The system supports authentication via the centralized login server at `login.alertaraqc.com`. Users log in through the centralized system and are redirected to this dashboard with a JWT token for authentication.

## How It Works

```
User logs in at login.alertaraqc.com
            ↓
   OTP verification
            ↓
   JWT token generated
            ↓
   System checks user DEPARTMENT
            ↓
   Routes to disaster.alertaraqc.com
            ↓
   Redirect with token: /dashboard?token=JWT_TOKEN
            ↓
   Dashboard validates token via API
            ↓
   User authenticated ✅
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Centralized Login API (AlerTara)
CENTRALIZED_LOGIN_URL=https://login.alertaraqc.com
AUTH_API_ENDPOINT=https://login.alertaraqc.com/api/auth/validate
MAIN_DOMAIN=https://alertaraqc.com
```

**For Local Development:**
```env
CENTRALIZED_LOGIN_URL=https://login.alertaraqc.com
AUTH_API_ENDPOINT=https://login.alertaraqc.com/api/auth/validate
MAIN_DOMAIN=http://localhost:8000
```

### Service Configuration

The configuration is stored in `config/services.php`:

```php
'centralized_login' => [
    'url' => env('CENTRALIZED_LOGIN_URL', 'https://login.alertaraqc.com'),
    'api_endpoint' => env('AUTH_API_ENDPOINT', 'https://login.alertaraqc.com/api/auth/validate'),
    'main_domain' => env('MAIN_DOMAIN', 'https://alertaraqc.com'),
],
```

## Implementation Details

### Routes

1. **Entry Point**: `/dashboard?token=JWT_TOKEN`
   - Handles incoming requests from centralized login
   - Validates token and authenticates user
   - Redirects to dashboard after successful authentication

2. **Alternative Entry Point**: `/auth/centralized?token=JWT_TOKEN`
   - Dedicated route for centralized login handling
   - Same functionality as dashboard route

3. **Logout**: `/auth/centralized/logout`
   - Logs out user and redirects to centralized login logout

### Controller

**File**: `app/Http/Controllers/CentralizedLoginController.php`

**Key Methods:**
- `handle()` - Validates token, syncs user, and logs in
- `validateToken()` - Calls API to validate JWT token
- `syncUser()` - Creates or updates local user from centralized data
- `logout()` - Handles logout and redirects to centralized system

### User Synchronization

When a user authenticates via centralized login:

1. **Token Validation**: Token is validated via API endpoint
2. **User Data Extraction**: User email, role, and department are extracted
3. **Local User Sync**:
   - If user exists: Updates role and status
   - If user doesn't exist: Creates new user with:
     - Email from centralized system
     - Role mapped from centralized role
     - Status set to 'active'
     - Email verified automatically
     - Random password (not used for centralized login)

### Role Mapping

Centralized roles are mapped to local roles:

| Centralized Role | Local Role |
|----------------|------------|
| `super_admin` | `SUPER_ADMIN` |
| `admin` | `LGU_ADMIN` |
| Default | `LGU_ADMIN` |

## API Integration

### Token Validation

The system calls the centralized login API to validate tokens:

**Endpoint**: `https://login.alertaraqc.com/api/auth/validate`

**Request**:
```http
GET /api/auth/validate
Authorization: Bearer {JWT_TOKEN}
```

**Response**:
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "admin@alertaraqc.com",
    "role": "admin",
    "department": "disaster_preparedness_department",
    "department_name": "Disaster Preparedness Department",
    "exp": 1645000000
  }
}
```

## Security Features

1. **HTTPS Encryption**: All tokens are transmitted over HTTPS
2. **Token Validation**: Tokens are validated on every request (with 5-minute caching)
3. **Session Storage**: Tokens are stored in server session, not localStorage
4. **URL Token Hiding**: JavaScript removes token from URL after initial load
5. **Automatic Logout**: Invalid tokens trigger automatic logout and redirect

## User Flow

### First-Time Login

1. User visits `login.alertaraqc.com`
2. Enters credentials and completes OTP verification
3. System generates JWT token
4. User is redirected to `disaster.alertaraqc.com/dashboard?token=JWT_TOKEN`
5. Dashboard validates token
6. User is created/updated in local database
7. User is logged in and redirected to dashboard
8. Token is hidden from URL via JavaScript

### Subsequent Requests

1. Token is stored in session
2. User accesses protected routes normally
3. Token is re-validated every 5 minutes
4. If token expires, user is logged out and redirected to centralized login

## Logout Flow

1. User clicks logout
2. Local session is destroyed
3. User is redirected to `login.alertaraqc.com/logout`
4. Centralized system handles final logout

## Troubleshooting

### Token Not Found

**Issue**: "Token not found in URL or session"

**Solution**: 
- Ensure token is in URL when first visiting dashboard
- Check that session is working correctly
- Verify `SESSION_DRIVER` in `.env`

### API Validation Fails

**Issue**: "Unable to authenticate"

**Solution**:
- Check `AUTH_API_ENDPOINT` in `.env`
- Verify network connectivity to `login.alertaraqc.com`
- Check Laravel logs for API errors

### User Not Created

**Issue**: User authentication succeeds but user not found locally

**Solution**:
- Check database connection
- Verify User model is configured correctly
- Check Laravel logs for sync errors

### Token Visible in URL

**Issue**: Token remains visible in browser URL

**Solution**:
- Ensure JavaScript is enabled
- Check that the script in `app.blade.php` is loading
- Token should only be visible on initial redirect

## Testing

### Test Checklist

- [ ] User can log in via centralized login
- [ ] Redirected to dashboard with token
- [ ] User information displays correctly
- [ ] Token stored in session
- [ ] Can navigate between pages without losing session
- [ ] Logout redirects to login page
- [ ] Department name displays correctly
- [ ] Admin/super_admin roles work
- [ ] Token is hidden from URL after page load

### Debug Tips

**Check browser console:**
```javascript
// View stored user data
console.log(localStorage.getItem('user_data'));

// View current token (if in session)
// Token is stored server-side, not in localStorage
```

**Check Laravel logs:**
```bash
tail -f storage/logs/laravel.log
```

**Check session:**
```php
// In tinker or controller
session()->all();
session()->get('jwt_token');
session()->get('centralized_login');
```

## Migration from Local Auth

If you're migrating from local authentication to centralized login:

1. **Keep Local Auth**: The system supports both authentication methods
2. **Gradual Migration**: Users can be migrated one by one
3. **Role Mapping**: Ensure roles are correctly mapped
4. **User Sync**: Existing users will be updated on first centralized login

## Support

For issues or questions:
- Check Laravel logs: `storage/logs/laravel.log`
- Review API responses in controller logs
- Contact AlerTara admin for centralized login server issues

## Files Modified

- `app/Http/Controllers/CentralizedLoginController.php` - New controller
- `app/Http/Middleware/ValidateCentralizedToken.php` - New middleware (optional)
- `routes/web.php` - Added centralized login routes
- `config/services.php` - Added centralized login configuration
- `resources/views/app.blade.php` - Added token hiding script
- `env.template` - Added environment variables

## Next Steps

1. ✅ Add environment variables to `.env`
2. ✅ Test token validation
3. ✅ Verify user synchronization
4. ✅ Test logout flow
5. ✅ Deploy to production

---

**Last Updated**: 2026-02-19  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
