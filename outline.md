Project Structure

1. accounts       ← Base user model (critical)
2. ads            ← Ads FK to users
3. moderation     ← Operates on ads, checks user roles
4. analytics      ← Tracks views per ad/user
5. payments       ← Optional, FK to ad/user
6. search         ← External, no migration dependency
7. utils/common   ← Support code
8. config         ← Project-wide routing/config



postgres=# CREATE DATABASE stardust_db;
CREATE DATABASE
postgres=# CREATE USER stardust_user WITH PASSWORD 's63GK94t<';
CREATE ROLE
postgres=# GRANT ALL PRIVILEGES ON DATABASE stardust_db TO stardust_user;
GRANT
postgres=# 