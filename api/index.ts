
import { Pool } from '@neondatabase/serverless';
import { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'Server Configuration Error: Missing DATABASE_URL.' });
  }

  try {
    const action = req.query.action as string;
    const body = req.body || {};

    // --- AUTO-INITIALIZE TABLES ---
    await pool.query(`
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
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            price DECIMAL(15, 2) DEFAULT 0,
            image_url TEXT,
            preview_url TEXT,
            download_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            thumbnail TEXT,
            level TEXT,
            duration TEXT,
            instructor TEXT,
            tutor_id TEXT,
            price DECIMAL(15, 2) DEFAULT 0,
            modules_json JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS enrollments (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, course_id)
        );
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
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS inquiries (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            service_type TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
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
    `);

    // --- SETTINGS ---
    if (action === 'getAppSettings') {
        const { rows } = await pool.query("SELECT value FROM settings WHERE key = 'app_config'");
        return res.status(200).json(rows.length > 0 ? rows[0].value : { platformName: 'Nexlify' });
    }

    if (action === 'updateAppSettings') {
        await pool.query(
            "INSERT INTO settings (key, value) VALUES ('app_config', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
            [JSON.stringify(body)]
        );
        return res.status(200).json({ success: true });
    }

    // --- PRODUCTS ---
    if (action === 'getProducts') {
        const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        return res.status(200).json(rows.map((p: any) => ({
            id: p.id, title: p.title, description: p.description, category: p.category,
            price: parseFloat(p.price), imageUrl: p.image_url, previewUrl: p.preview_url,
            downloadUrl: p.download_url, createdAt: p.created_at
        })));
    }

    if (action === 'addProduct') {
        const { id, title, description, category, price, imageUrl, previewUrl, downloadUrl } = body;
        await pool.query(
            'INSERT INTO products (id, title, description, category, price, image_url, preview_url, download_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [id, title, description, category, price, imageUrl, previewUrl, downloadUrl]
        );
        return res.status(200).json({ success: true });
    }

    if (action === 'deleteProduct') {
        await pool.query('DELETE FROM products WHERE id = $1', [req.body.id]);
        return res.status(200).json({ success: true });
    }

    // --- USERS ---
    if (action === 'getAllUsers') {
        const { rows } = await pool.query('SELECT id, name, email, role, balance, status, created_at FROM users ORDER BY created_at DESC');
        return res.status(200).json(rows.map((u: any) => ({
            ...u, balance: parseFloat(u.balance), joinedAt: u.created_at
        })));
    }

    if (action === 'updateUser') {
        const { id, name, email, role, balance, status } = body;
        await pool.query('UPDATE users SET name=$1, email=$2, role=$3, balance=$4, status=$5 WHERE id=$6', [name, email, role, balance, status, id]);
        return res.status(200).json({ success: true });
    }

    // --- INQUIRIES ---
    if (action === 'getInquiries') {
        const { rows } = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
        return res.status(200).json(rows.map((i: any) => ({ ...i, serviceType: i.service_type, createdAt: i.created_at })));
    }

    if (action === 'submitInquiry') {
        const { id, name, email, message, serviceType } = body;
        await pool.query('INSERT INTO inquiries (id, name, email, message, service_type) VALUES ($1, $2, $3, $4, $5)', [id, name, email, message, serviceType]);
        return res.status(200).json({ success: true });
    }

    if (action === 'deleteInquiry') {
        await pool.query('DELETE FROM inquiries WHERE id = $1', [body.id]);
        return res.status(200).json({ success: true });
    }

    // --- TUTOR STATS ---
    if (action === 'getTutorStats') {
        const tutorId = req.query.tutorId;
        const { rows: tutorCourses } = await pool.query('SELECT id, price FROM courses WHERE tutor_id = $1', [tutorId]);
        let totalStudents = 0;
        let totalEarnings = 0;
        for (const c of tutorCourses) {
            const { rows: enrolls } = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1', [c.id]);
            const count = parseInt(enrolls[0].count);
            totalStudents += count;
            totalEarnings += (count * parseFloat(c.price) * 0.1);
        }
        return res.status(200).json({ totalStudents, totalEarnings });
    }

    // --- AUTH, COURSES, NOTIFICATIONS ... (Keep existing working logic) ---
    if (action === 'login') {
      const { email, password } = body;
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const user = rows[0];
      const { rows: enrollRows } = await pool.query('SELECT course_id FROM enrollments WHERE user_id = $1', [user.id]);
      return res.status(200).json({ ...user, balance: parseFloat(user.balance), joinedAt: user.created_at, enrolledCourses: enrollRows.map((e: any) => e.course_id) });
    }

    if (action === 'getCourses') {
        const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
        return res.status(200).json(rows.map((c: any) => ({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] })));
    }

    if (action === 'getQuestionsByTutor') {
        const tutorId = req.query.tutorId;
        const { rows } = await pool.query('SELECT tq.* FROM tutor_questions tq JOIN courses c ON tq.course_id = c.id WHERE c.tutor_id = $1 ORDER BY tq.created_at DESC', [tutorId]);
        return res.status(200).json(rows.map((r: any) => ({ ...r, studentId: r.student_id, courseId: r.course_id, lessonId: r.lesson_id, repliedAt: r.replied_at, createdAt: r.created_at })));
    }

    if (action === 'sendNotification') {
        const { id, userId, title, message, type, isBroadcast } = body;
        if (isBroadcast) {
            const { rows: users } = await pool.query('SELECT id FROM users');
            for(const u of users) {
                const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                await pool.query('INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)', [uniqueId, u.id, title, message, type]);
            }
        } else {
            await pool.query('INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)', [id, userId, title, message, type]);
        }
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Action not found' });

  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
