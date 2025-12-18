
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
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  balance DECIMAL(15, 2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  level TEXT,
  duration TEXT,
  instructor TEXT,
  tutor_id TEXT REFERENCES users(id),
  price DECIMAL(15, 2) DEFAULT 0,
  modules_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course Materials Table (NEW: Stores PDF/DOC files)
CREATE TABLE IF NOT EXISTS course_materials (
    id TEXT PRIMARY KEY,
    course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id TEXT,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_data TEXT NOT NULL, -- Base64 Data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor Questions Table
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

-- Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    type TEXT,
    target_id TEXT,
    amount DECIMAL(15, 2),
    reference TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
