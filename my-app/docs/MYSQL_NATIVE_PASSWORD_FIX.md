# Fix: auth_gssapi_client — Use MySQL Native Password

Laravel (PHP PDO) cannot use MySQL’s GSSAPI auth. Use **mysql_native_password** for the user Laravel connects as.

## Option A: Fix in HeidiSQL (recommended)

1. Open **HeidiSQL** and connect with whatever method works (e.g. “MySQL (TCP/IP)” or your current session).
2. Open a **Query** tab and run:

```sql
-- Use native password for root on localhost (match the password in your .env)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root@123';
FLUSH PRIVILEGES;
```

If your `root` user is for `127.0.0.1` instead of `localhost`, use:

```sql
ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY 'root@123';
FLUSH PRIVILEGES;
```

3. Close and reopen the connection in HeidiSQL if needed, then run `php artisan migrate` again.

---

## Option B: Server default (my.ini) so new users use native password

1. Find MySQL config: e.g. **C:\xampp\mysql\bin\my.ini** (XAMPP) or **C:\ProgramData\MySQL\MySQL Server 8.0\my.ini**.
2. Under the **`[mysqld]`** section (not `[client]`), add:

```ini
[mysqld]
default_authentication_plugin=mysql_native_password
```

3. Restart MySQL (XAMPP: Stop then Start MySQL).
4. **Still run the `ALTER USER` from Option A** so the existing `root` user uses native password.

---

## After fixing

```bash
php artisan config:clear
php artisan migrate
```

If you still get “Access denied”, the password in `.env` must match the one in the `BY '...'` above.
