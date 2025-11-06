# MySQL Database Setup

This dashboard connects to a **MySQL database** that stores sports equipment borrowing data.

## Prerequisites

- MySQL 5.7+ or MySQL 8.0+
- Node.js 18+
- Sports-Inventory app running (writes data to database)

## Quick Start

### 1. Set Up Local MySQL Database

```bash
# Start MySQL (if not already running)
mysql.server start

# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE sportsinventory;

# Use the database
USE sportsinventory;
```

### 2. Import Database Schema

The database schema is automatically created by the Sports-Inventory app. Tables include:

- **`sports`** - Main table storing borrow/return records
- **`email_logs`** - Tracks sent emails (optional)
- **`inventory`** - Equipment inventory tracking (optional)

### 3. Configure Environment Variables

Create a `.env.local` file in the `stats-dashboard` directory:

```bash
# Database (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=sportsinventory
DB_PORT=3306

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# NextAuth
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000
```

Generate `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 4. Run the Dashboard

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Shared Database Setup

Both **Sports-Inventory** (local Express app) and **stats-dashboard** (Next.js app) connect to the **same MySQL database**:

```
┌─────────────────────┐
│  Sports-Inventory   │ ──┐
│  (writes data)      │   │
└─────────────────────┘   │
                          ▼
                   ┌──────────────┐
                   │    MySQL     │
                   │   Database   │
                   └──────────────┘
                          ▲
┌─────────────────────┐   │
│  Stats-Dashboard    │ ──┘
│  (reads data)       │
└─────────────────────┘
```

### Sports-Inventory .env
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=sportsinventory
DB_PORT=3306
```

### Stats-Dashboard .env.local
```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=sportsinventory
DB_PORT=3306
```

**Same credentials, same database!**

## Database Schema

### `sports` Table
```sql
CREATE TABLE sports (
  id INT NOT NULL AUTO_INCREMENT,
  studentId VARCHAR(20),
  name VARCHAR(100),
  equipment VARCHAR(100),
  outTime DATETIME,
  inTime DATETIME,
  outNum INT DEFAULT 0,
  inNum INT DEFAULT 0,
  status ENUM('PENDING','LATE','RETURNED') NOT NULL DEFAULT 'PENDING',
  barcode CHAR(3),
  PRIMARY KEY (id)
);
```

## Session-Based Auth

The dashboard uses **session-based authentication** for Google OAuth:

- **Sessions stored**: In-memory (resets on server restart)
- **Session duration**: 1 hour
- **Authentication method**: Google OAuth via NextAuth.js
- **Database usage**: Read-only (statistics queries only)

Sessions are completely separate from the MySQL database:
- **Sessions** = Temporary user login state (in-memory)
- **Database** = Permanent equipment data (MySQL)

## Troubleshooting

### Connection Error
```
Error: ER_ACCESS_DENIED_ERROR
```
**Fix**: Check DB_USER and DB_PASSWORD in `.env.local`

### Database Not Found
```
Error: ER_BAD_DB_ERROR
```
**Fix**: Create database: `CREATE DATABASE sportsinventory;`

### No Data Showing
- Ensure Sports-Inventory app is running and writing data
- Check that both apps use the same database name
- Verify MySQL is running: `mysql.server status`

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Fix**: 
- Stop Sports-Inventory app (runs on port 3000)
- Or change stats-dashboard port in `package.json`

## Production Deployment

For production, consider using a hosted MySQL database:

### Option 1: PlanetScale (Free tier available)
- MySQL-compatible serverless database
- Automatic backups
- Easy scaling

### Option 2: AWS RDS MySQL
- Managed MySQL service
- Pay-as-you-go pricing

### Option 3: Railway MySQL
- Simple deployment
- ~$5-10/month

Update your production `.env` with the hosted database credentials.

## Resources

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [mysql2 Node.js Driver](https://github.com/sidorares/node-mysql2)
- [NextAuth.js Documentation](https://next-auth.js.org)
