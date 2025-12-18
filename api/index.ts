
import { Pool } from '@neondatabase/serverless';
import { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            balance DECIMAL(15, 2) DEFAULT 0,
            status TEXT DEFAULT 'active',
            photo_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            price DECIMAL(15, 2) DEFAULT 0,
            image_url TEXT,
            preview_url TEXT,
            download_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS courses (
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
        )`,
        `CREATE TABLE IF NOT EXISTS enrollments (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
            enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, course_id)
        )`,
        `CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            type TEXT,
            target_id TEXT,
            amount DECIMAL(15, 2),
            reference TEXT,
            status TEXT DEFAULT 'success',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value JSONB NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS inquiries (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            service_type TEXT NOT NULL,
            status TEXT DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS tutor_questions (
            id TEXT PRIMARY KEY,
            course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
            lesson_id TEXT,
            student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            student_name TEXT,
            question TEXT NOT NULL,
            reply TEXT,
            replied_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const sql of tables) {
        await pool.query(sql).catch(e => console.error("Table creation failed", e));
    }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'Database configuration missing.' });

  try {
    const action = req.query.action as string;
    const body = req.body || {};
    await initDb();

    // --- ACTIONS MAPPING ---
    switch(action) {
        case 'getAppSettings':
            const settings = await pool.query("SELECT value FROM settings WHERE key = 'app_config'");
            return res.status(200).json(settings.rows[0]?.value || { platformName: 'Nexlify' });

        case 'updateAppSettings':
            await pool.query("INSERT INTO settings (key, value) VALUES ('app_config', $1) ON CONFLICT (key) DO UPDATE SET value = $1", [JSON.stringify(body)]);
            return res.status(200).json({ success: true });

        case 'getProducts':
            const products = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
            return res.status(200).json(products.rows.map(p => ({ ...p, price: parseFloat(p.price) })));

        case 'addProduct':
            await pool.query('INSERT INTO products (id, title, description, category, price, image_url, preview_url, download_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [body.id, body.title, body.description, body.category, body.price, body.imageUrl, body.previewUrl, body.downloadUrl]);
            return res.status(200).json({ success: true });

        case 'getCourses':
            const courses = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
            return res.status(200).json(courses.rows.map(c => ({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] })));

        case 'getCourseById':
            const course = await pool.query('SELECT * FROM courses WHERE id = $1', [req.query.id]);
            if (!course.rows[0]) return res.status(200).json(null);
            const c = course.rows[0];
            return res.status(200).json({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] });

        case 'login':
            const userRes = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [body.email, body.password]);
            if (!userRes.rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
            const u = userRes.rows[0];
            const enrolls = await pool.query('SELECT course_id FROM enrollments WHERE user_id = $1', [u.id]);
            return res.status(200).json({ ...u, balance: parseFloat(u.balance), enrolledCourses: enrolls.rows.map(e => e.course_id) });

        case 'register':
            await pool.query('INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)', [body.id, body.name, body.email, body.password, body.role]);
            return res.status(200).json({ success: true });

        case 'enroll':
            await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [body.userId, body.courseId]);
            return res.status(200).json({ success: true });

        case 'getAdminStats':
            const revenue = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE status = 'success'");
            const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
            return res.status(200).json({ totalRevenue: parseFloat(revenue.rows[0].total || 0), userCount: parseInt(userCount.rows[0].count) });

        case 'getInquiries':
            const inquiries = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
            return res.status(200).json(inquiries.rows);

        case 'submitInquiry':
            await pool.query('INSERT INTO inquiries (id, name, email, message, service_type) VALUES ($1, $2, $3, $4, $5)', [body.id, body.name, body.email, body.message, body.serviceType]);
            return res.status(200).json({ success: true });

        case 'getAllUsers':
            const allUsers = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
            return res.status(200).json(allUsers.rows.map(u => ({ ...u, balance: parseFloat(u.balance) })));

        default:
            return res.status(404).json({ error: 'Action not found' });
    }
  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
