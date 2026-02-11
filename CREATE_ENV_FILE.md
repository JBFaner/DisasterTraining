# Create .env File Instructions

## Quick Setup

I've created a `.env.example` file with all the necessary environment variables. To create your `.env` file:

### Option 1: Copy from .env.example (Recommended)

```bash
cd my-app
cp .env.example .env
```

### Option 2: Create Manually

Create a new file named `.env` in the `my-app` directory with the contents from `.env.example`.

## Important: Generate Application Key

After creating the `.env` file, you **must** generate an application key:

```bash
cd my-app
php artisan key:generate
```

This will automatically set the `APP_KEY` in your `.env` file.

## Configuration Notes

### Database
- **Default**: SQLite (database/database.sqlite)
- **To use MySQL**: Uncomment the MySQL configuration lines and update with your database credentials

### Production Settings
- `APP_ENV=production` - Set to production
- `APP_DEBUG=false` - Disable debug mode in production
- `APP_URL` - Set to your actual domain
- `SESSION_SECURE_COOKIE=true` - Enable secure cookies for HTTPS

### Email & SMS
- **Development**: Uses `log` driver (emails/SMS logged to `storage/logs/laravel.log`)
- **Production**: Uncomment and configure SMTP/SMS provider settings

### Gemini AI
- Already configured with the API key from your codebase
- Update if you have a different key

## Verify Configuration

After creating `.env` and generating the key:

```bash
# Clear config cache
php artisan config:clear

# Test database connection
php artisan migrate:status

# Check environment
php artisan about
```

## Security Reminder

- **Never commit `.env` to git** (it's already in `.gitignore`)
- Keep your `.env` file secure and private
- Use different `.env` files for development and production
