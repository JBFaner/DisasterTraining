# Import local database (`Inventory.sql`) to production server

Your `Inventory.sql` file is a **MariaDB/MySQL data dump** from your local `disaster_training` database.  
The production server must use **MySQL**, not SQLite.

Server path: `/var/www/html/disaster_training_alertaraqc/my-app`

---

## Step 1 — Upload `Inventory.sql` from your PC

Run this in **PowerShell on your Windows machine** (not on the server):

```powershell
scp "C:\Users\ViberTest\Documents\DisasterTraining\Inventory.sql" root@72.60.209.226:/var/www/html/disaster_training_alertaraqc/Inventory.sql
```

---

## Step 2 — SSH into the server

```bash
ssh root@72.60.209.226
cd /var/www/html/disaster_training_alertaraqc/my-app
```

---

## Step 3 — Install MySQL/MariaDB (if not installed)

```bash
apt update
apt install -y mariadb-server
systemctl enable mariadb
systemctl start mariadb
```

Create database and user:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS disaster_training CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'disaster_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON disaster_training.* TO 'disaster_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 4 — Configure production `.env`

```bash
cd /var/www/html/disaster_training_alertaraqc/my-app
cp .env.production.example .env
nano .env
```

Set at minimum:

| Variable | Production value |
|----------|------------------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://disaster-training.alertaraqc.com` |
| `DB_CONNECTION` | `mysql` |
| `DB_DATABASE` | `disaster_training` |
| `DB_USERNAME` | `disaster_user` |
| `DB_PASSWORD` | your MySQL password |
| `MAIN_DOMAIN` | `https://disaster-training.alertaraqc.com` |

Generate app key (only if `.env` has no `APP_KEY` yet):

```bash
php artisan key:generate
```

Clear old SQLite config if present — remove or comment out:

```
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

---

## Step 5 — Run migrations (schema first)

```bash
php artisan config:clear
php artisan migrate --force
```

If a migration failed earlier on SQLite, after switching to MySQL you should be able to continue.  
If the database is messy, reset and migrate fresh **before** importing data:

```bash
php artisan migrate:fresh --force
```

> **Do not run `db:seed` if you plan to import `Inventory.sql`** — the SQL file already contains your local data (users, modules, resources, etc.).

---

## Step 6 — Import your local data

```bash
mysql -u disaster_user -p disaster_training < /var/www/html/disaster_training_alertaraqc/Inventory.sql
```

If you get duplicate-key errors because seeders already ran, either:

- use a fresh database (`migrate:fresh` then import), or  
- import only specific tables you need.

---

## Step 7 — Cache and permissions

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache

chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

Restart PHP / web server:

```bash
systemctl restart php8.2-fpm
systemctl restart nginx
```

---

## Quick checklist

1. `Inventory.sql` uploaded to server  
2. `.env` uses **mysql**, not sqlite  
3. `php artisan migrate --force` succeeds  
4. `mysql ... < Inventory.sql` completes  
5. Site loads at production URL  

---

## Common errors

| Error | Cause | Fix |
|-------|--------|-----|
| `no such table: training_contents` during seed | Migrations not run | Run `migrate --force` before seed/import |
| `near "MODIFY": syntax error` | SQLite in use | Switch `.env` to `DB_CONNECTION=mysql` |
| `db:seed` duplicate errors after import | Seed + SQL both loaded data | Skip seed; use import only |
| Login redirect wrong | `MAIN_DOMAIN` still localhost | Set production URLs in `.env` |
