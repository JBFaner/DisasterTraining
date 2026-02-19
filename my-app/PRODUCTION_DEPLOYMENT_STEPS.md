# Production Deployment Steps

After running migrations, execute these commands in order:

## 1. Seed Roles and Permissions
```bash
php artisan db:seed --class=RolesSeeder
php artisan db:seed --class=PermissionsSeeder
```

Or run all seeders:
```bash
php artisan db:seed --force
```

## 2. Clear Application Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

## 3. Rebuild Frontend Assets
```bash
npm install
npm run build
```

## 4. Optimize for Production (Optional but Recommended)
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 5. Set Proper Permissions
```bash
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

## 6. Restart Web Server (if using PHP-FPM)
```bash
# For Nginx + PHP-FPM
systemctl restart php8.2-fpm  # or php8.1-fpm, php8.3-fpm depending on version
systemctl restart nginx

# Or if using Apache
systemctl restart apache2
```

## Verification Checklist
- [ ] Roles table has 5 roles (SUPER_ADMIN, LGU_ADMIN, LGU_TRAINER, STAFF, PARTICIPANT)
- [ ] Permissions table has all module permissions
- [ ] role_has_permissions table has assignments
- [ ] Super Admin account can log in
- [ ] Super Admin can see "Super Admin" option in account type dropdown
- [ ] Roles and Permissions pages load without errors
- [ ] Frontend assets are compiled and loading
