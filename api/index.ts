
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

    // Ensure necessary tables exist
    await pool.query(`
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
        )
    `);

    if (action === 'getTutorCourses') {
        const tutorId = req.query.tutorId;
        const { rows } = await pool.query('SELECT * FROM courses WHERE tutor_id = $1', [tutorId]);
        const mapped = rows.map((c: any) => ({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] }));
        return res.status(200).json(mapped);
    }

    if (action === 'getTutorStats') {
        const tutorId = req.query.tutorId;
        const { rows: courses } = await pool.query('SELECT id, price FROM courses WHERE tutor_id = $1', [tutorId]);
        let totalStudents = 0;
        let totalEarnings = 0;
        
        for (const course of courses) {
            const { rows: enrolls } = await pool.query('SELECT COUNT(*) as count FROM enrollments WHERE course_id = $1', [course.id]);
            const count = parseInt(enrolls[0].count);
            totalStudents += count;
            totalEarnings += (count * parseFloat(course.price) * 0.1);
        }
        
        return res.status(200).json({ totalStudents, totalEarnings });
    }

    if (action === 'postQuestion') {
        const { courseId, lessonId, studentId, studentName, question } = body;
        const id = `tq-${Date.now()}`;
        await pool.query(
            'INSERT INTO tutor_questions (id, course_id, lesson_id, student_id, student_name, question) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, courseId, lessonId, studentId, studentName, question]
        );
        return res.status(200).json({ success: true });
    }

    if (action === 'replyToQuestion') {
        const { id, reply } = body;
        await pool.query('UPDATE tutor_questions SET reply = $1, replied_at = CURRENT_TIMESTAMP WHERE id = $2', [reply, id]);
        return res.status(200).json({ success: true });
    }

    if (action === 'getQuestionsByLesson') {
        const lessonId = req.query.lessonId;
        const { rows } = await pool.query('SELECT * FROM tutor_questions WHERE lesson_id = $1 ORDER BY created_at ASC', [lessonId]);
        return res.status(200).json(rows.map(r => ({ ...r, studentId: r.student_id, courseId: r.course_id, lessonId: r.lesson_id, repliedAt: r.replied_at, createdAt: r.created_at })));
    }

    if (action === 'getQuestionsByTutor') {
        const tutorId = req.query.tutorId;
        const { rows } = await pool.query(
            'SELECT tq.* FROM tutor_questions tq JOIN courses c ON tq.course_id = c.id WHERE c.tutor_id = $1 ORDER BY tq.created_at DESC',
            [tutorId]
        );
        return res.status(200).json(rows.map(r => ({ ...r, studentId: r.student_id, courseId: r.course_id, lessonId: r.lesson_id, repliedAt: r.replied_at, createdAt: r.created_at })));
    }

    // --- NOTIFICATIONS ---
    if (action === 'getNotifications') {
        const userId = req.query.userId;
        const { rows } = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        return res.status(200).json(rows.map((n: any) => ({
            id: n.id, userId: n.user_id, title: n.title, message: n.message, type: n.type, isRead: n.is_read, createdAt: n.created_at
        })));
    }

    if (action === 'sendNotification') {
        const { id, userId, title, message, type, isBroadcast } = body;
        if (isBroadcast) {
            const { rows: users } = await pool.query('SELECT id FROM users');
            const queries = users.map(u => {
                const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                return pool.query('INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)', [uniqueId, u.id, title, message, type]);
            });
            await Promise.all(queries);
        } else {
            await pool.query('INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)', [id, userId, title, message, type]);
        }
        return res.status(200).json({ success: true });
    }

    if (action === 'markNotificationRead') {
        const { id } = body;
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
        return res.status(200).json({ success: true });
    }

    // --- AUTHENTICATION ---
    if (action === 'login') {
      const { email, password } = body;
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
      if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      const user = rows[0];
      if (user.status === 'suspended' || user.status === 'banned') return res.status(403).json({ error: 'Account suspended' });
      const { rows: enrollRows } = await pool.query('SELECT course_id FROM enrollments WHERE user_id = $1', [user.id]);
      const enrolledCourses = enrollRows.map((e: any) => e.course_id);
      const { rows: purchaseRows } = await pool.query('SELECT product_id FROM purchases WHERE user_id = $1', [user.id]);
      const purchasedProducts = purchaseRows.map((e: any) => e.product_id);
      return res.status(200).json({
        id: user.id, name: user.name, email: user.email, role: user.role,
        balance: parseFloat(user.balance), status: user.status, photoUrl: user.photo_url,
        joinedAt: user.created_at, enrolledCourses, purchasedProducts
      });
    }

    if (action === 'register') {
      const { id, name, email, password, role, adminSecret } = body;
      let finalRole = (role === 'admin' || role === 'tutor') ? role : 'user';
      if (role === 'admin' && process.env.ADMIN_SECRET && adminSecret !== process.env.ADMIN_SECRET) finalRole = 'user';
      try {
        await pool.query(
          'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
          [id, name, email, password, finalRole]
        );
        return res.status(200).json({
          id, name, email, role: finalRole, balance: 0, status: 'active', enrolledCourses: [], purchasedProducts: []
        });
      } catch (e: any) {
        if (e.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        throw e;
      }
    }

    // --- COURSES ---
    if (action === 'getCourses') {
      const { rows } = await pool.query('SELECT * FROM courses');
      return res.status(200).json(rows.map((c: any) => ({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] })));
    }
    
    if (action === 'getCourseById') {
        const id = req.query.id;
        const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        if(rows.length === 0) return res.status(200).json(null);
        const c = rows[0];
        return res.status(200).json({ ...c, tutorId: c.tutor_id, price: parseFloat(c.price), modules: c.modules_json || [] });
    }

    if (action === 'addCourse') {
        const { id, title, description, thumbnail, level, duration, instructor, tutorId, price, modules } = body;
        await pool.query(
            'INSERT INTO courses (id, title, description, thumbnail, level, duration, instructor, tutor_id, price, modules_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [id, title, description, thumbnail, level, duration, instructor, tutorId, price, JSON.stringify(modules)]
        );
        return res.status(200).json({ success: true });
    }

    if (action === 'updateCourse') {
        const { id, title, description, thumbnail, level, duration, instructor, tutorId, price, modules } = body;
        await pool.query(
            'UPDATE courses SET title=$1, description=$2, thumbnail=$3, level=$4, duration=$5, instructor=$6, tutor_id=$7, price=$8, modules_json=$9 WHERE id=$10',
            [title, description, thumbnail, level, duration, instructor, tutorId, price, JSON.stringify(modules), id]
        );
        return res.status(200).json({ success: true });
    }

    // --- REST OF ACTIONS (PRODUCTS, INQUIRIES, etc.) ---
    if (action === 'getProducts') {
      const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(rows.map((p: any) => ({ id: p.id, title: p.title, description: p.description, category: p.category, price: parseFloat(p.price), imageUrl: p.image_url, previewUrl: p.preview_url, downloadUrl: p.download_url, createdAt: p.created_at })));
    }

    if (action === 'getAllUsers') {
      const { rows } = await pool.query('SELECT id, name, email, role, balance, status, created_at FROM users ORDER BY created_at DESC');
      return res.status(200).json(rows.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, balance: parseFloat(u.balance), status: u.status, joinedAt: u.created_at })));
    }

    if (action === 'updateUser') {
      const { id, name, email, role, balance, status } = body;
      await pool.query('UPDATE users SET name=$1, email=$2, role=$3, balance=$4, status=$5 WHERE id=$6', [name, email, role, balance, status, id]);
      return res.status(200).json({ success: true });
    }

    if (action === 'getInquiries') {
        const { rows } = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
        return res.status(200).json(rows);
    }

    if (action === 'getAdminStats') {
        const { rows } = await pool.query('SELECT SUM(amount) as total FROM transactions WHERE status = \'success\'');
        return res.status(200).json({ totalRevenue: parseFloat(rows[0].total || 0) });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
