# Nexlify Database Setup (Neon Postgres on Vercel)

This project is configured to run on Vercel with a Neon PostgreSQL database backend using `@neondatabase/serverless`.

## 1. Configure Neon
1. Create a project on [Neon](https://neon.tech).
2. Get your connection string from the Neon Dashboard.

## 2. Configure Vercel Environment Variables
In your Vercel Project Dashboard (Settings > Environment Variables), add the following:

### Database
- `DATABASE_URL`: `postgresql://user:password@host/dbname?sslmode=require`

### Admin Security
- `ADMIN_SECRET`: `your_secure_secret_code_here` (e.g., admin2024)
  *   *This key is used to validate admin registration requests server-side.*

## 3. Create Schema
Run the following SQL commands in your Neon SQL Editor to create the necessary tables.

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  balance DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- App Settings Table (Singleton Configuration)
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  platform_name TEXT DEFAULT 'Nexlify',
  logo_url TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Initialize Default Settings
INSERT INTO app_settings (id, platform_name) VALUES (1, 'Nexlify') ON CONFLICT (id) DO NOTHING;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  image_url TEXT,
  preview_url TEXT,
  download_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table (Using JSONB for modules)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  level TEXT,
  duration TEXT,
  instructor TEXT,
  price DECIMAL(10, 2) DEFAULT 0,
  modules_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);

-- Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT,
  service_type TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  description TEXT,
  type TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Updates for Existing Databases
If you already have tables, run these specific commands to update your schema:

```sql
-- Add photo_url to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  platform_name TEXT DEFAULT 'Nexlify',
  logo_url TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings row
INSERT INTO app_settings (id, platform_name) VALUES (1, 'Nexlify') ON CONFLICT (id) DO NOTHING;
```

## Local Development
1. Create a `.env` file in the root directory with all variables listed in section 2.
2. Run `npm run dev` or `vercel dev`.