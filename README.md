
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

## 3. Create Schema
Run the following SQL commands in your Neon SQL Editor to create the necessary tables.

```sql
-- Settings Table (for Platform Brand, Logo, and dynamic SEO)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'admin', 'tutor', 'user'
  balance DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  photo_url TEXT,
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
  tutor_id TEXT REFERENCES users(id), -- Linked Instructor
  price DECIMAL(10, 2) DEFAULT 0,
  modules_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor Questions Table (For student interaction)
CREATE TABLE IF NOT EXISTS tutor_questions (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id TEXT,
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT,
    question TEXT NOT NULL,
    reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id)
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
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Required Updates for Existing Databases
If you have already created your database, run these commands to add the new Tutor Support and Global Settings features:

```sql
-- Settings for Global Brand/SEO
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Support Tutor assignment on existing courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS tutor_id TEXT REFERENCES users(id);

-- Create Questions Table for interactions
CREATE TABLE IF NOT EXISTS tutor_questions (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id TEXT,
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT,
    question TEXT NOT NULL,
    reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
