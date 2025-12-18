
import { Pool } from '@neondatabase/serverless';
import { VercelRequest, VercelResponse } from '@vercel/node';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
    const tables = [
        `CREATE TABLE IF NOT EXISTS course_materials (
            id TEXT PRIMARY KEY,
            course_id TEXT,
            lesson_id TEXT,
            file_name TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];
    for (const sql of tables) {
        await pool.query(sql).catch(e => console.error("Material table check failed", e));
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

    switch(action) {
        // --- PRE-EXISTING ACTIONS ---
        case 'getAppSettings':
            const settings = await pool.query("SELECT value FROM settings WHERE key = 'app_config'");
            return res.status(200).json(settings.rows[0]?.value || { platformName: 'Nexlify' });

        case 'getProducts':
            const products = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
            return res.status(200).json(products.rows.map(p => ({ ...p, price: parseFloat(p.price) })));

        case 'getCourses':
            const courses = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
            return res.status(200).json(courses.rows.map(c => ({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] })));

        case 'getCourseById':
            const course = await pool.query('SELECT * FROM courses WHERE id = $1', [req.query.id]);
            if (!course.rows[0]) return res.status(200).json(null);
            const c = course.rows[0];
            return res.status(200).json({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] });

        case 'updateCourse':
            await pool.query(
                'UPDATE courses SET title=$1, description=$2, thumbnail=$3, level=$4, duration=$5, instructor=$6, tutor_id=$7, price=$8, modules_json=$9 WHERE id=$10',
                [body.title, body.description, body.thumbnail, body.level, body.duration, body.instructor, body.tutorId, body.price, JSON.stringify(body.modules), body.id]
            );
            return res.status(200).json({ success: true });

        // --- NEW MATERIAL ACTIONS ---
        case 'uploadMaterial':
            const { id, courseId, lessonId, fileName, mimeType, fileData } = body;
            await pool.query(
                'INSERT INTO course_materials (id, course_id, lesson_id, file_name, mime_type, file_data) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, courseId, lessonId, fileName, mimeType, fileData]
            );
            return res.status(200).json({ success: true, fileId: id });

        case 'getMaterial':
            const matId = req.query.id;
            const mat = await pool.query('SELECT file_name, mime_type, file_data FROM course_materials WHERE id = $1', [matId]);
            if (!mat.rows[0]) return res.status(404).json({ error: 'File not found' });
            return res.status(200).json(mat.rows[0]);

        case 'login':
            const userRes = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [body.email, body.password]);
            if (!userRes.rows[0]) return res.status(401).json({ error: 'Invalid credentials' });
            const u = userRes.rows[0];
            const enrolls = await pool.query('SELECT course_id FROM enrollments WHERE user_id = $1', [u.id]);
            return res.status(200).json({ ...u, balance: parseFloat(u.balance), enrolledCourses: enrolls.rows.map((e:any) => e.course_id) });

        case 'register':
            await pool.query('INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)', [body.id, body.name, body.email, body.password, body.role]);
            return res.status(200).json({ success: true });

        case 'getAdminStats':
            const revenue = await pool.query("SELECT SUM(amount) as total FROM transactions WHERE status = 'success'");
            const userCount = await pool.query("SELECT COUNT(*) as count FROM users");
            return res.status(200).json({ totalRevenue: parseFloat(revenue.rows[0].total || 0), userCount: parseInt(userCount.rows[0].count) });

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
