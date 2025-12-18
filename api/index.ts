
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

    // --- APP SETTINGS & SEO ---
    if (action === 'getAppSettings') {
        const { rows } = await pool.query('SELECT value FROM settings WHERE key = \'app_config\'');
        if (rows.length === 0) return res.status(200).json({ platformName: 'Nexlify' });
        return res.status(200).json(rows[0].value);
    }

    if (action === 'updateAppSettings') {
        await pool.query(
            'INSERT INTO settings (key, value) VALUES (\'app_config\', $1) ON CONFLICT (key) DO UPDATE SET value = $1',
            [JSON.stringify(body)]
        );
        return res.status(200).json({ success: true });
    }

    // --- TUTOR SERVICES ---
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
      const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
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

    if (action === 'deleteCourse') {
        const id = body.id;
        await pool.query('DELETE FROM enrollments WHERE course_id = $1', [id]);
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        return res.status(200).json({ success: true });
    }

    // --- PRODUCTS ---
    if (action === 'getProducts') {
      const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      return res.status(200).json(rows.map((p: any) => ({ ...p, price: parseFloat(p.price), imageUrl: p.image_url, previewUrl: p.preview_url, downloadUrl: p.download_url })));
    }

    if (action === 'addProduct') {
      const { id, title, description, category, price, imageUrl, previewUrl, downloadUrl } = body;
      await pool.query(
        'INSERT INTO products (id, title, description, category, price, image_url, preview_url, download_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, title, description, category, price, imageUrl, previewUrl, downloadUrl]
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'updateProduct') {
      const { id, title, description, category, price, imageUrl, previewUrl, downloadUrl } = body;
      await pool.query(
        'UPDATE products SET title=$1, description=$2, category=$3, price=$4, image_url=$5, preview_url=$6, download_url=$7 WHERE id=$8',
        [title, description, category, price, imageUrl, previewUrl, downloadUrl, id]
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'deleteProduct') {
      await pool.query('DELETE FROM products WHERE id = $1', [body.id]);
      return res.status(200).json({ success: true });
    }

    // --- USERS ---
    if (action === 'getAllUsers') {
      const { rows } = await pool.query('SELECT id, name, email, role, balance, status, created_at FROM users ORDER BY created_at DESC');
      return res.status(200).json(rows.map((u: any) => ({ ...u, joinedAt: u.created_at, balance: parseFloat(u.balance) })));
    }

    if (action === 'updateUser') {
      const { id, name, email, role, balance, status } = body;
      await pool.query('UPDATE users SET name=$1, email=$2, role=$3, balance=$4, status=$5 WHERE id=$6', [name, email, role, balance, status, id]);
      return res.status(200).json({ success: true });
    }

    // --- INQUIRIES ---
    if (action === 'submitInquiry') {
      const { id, name, email, message, serviceType } = body;
      await pool.query(
        'INSERT INTO inquiries (id, name, email, message, service_type) VALUES ($1, $2, $3, $4, $5)',
        [id, name, email, message, serviceType]
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'getInquiries') {
        const { rows } = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
        return res.status(200).json(rows.map((i: any) => ({ ...i, serviceType: i.service_type, createdAt: i.created_at })));
    }

    if (action === 'deleteInquiry') {
        await pool.query('DELETE FROM inquiries WHERE id = $1', [body.id]);
        return res.status(200).json({ success: true });
    }

    // --- ENROLLMENT ---
    if (action === 'enroll') {
        const { userId, courseId } = body;
        await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, courseId]);
        return res.status(200).json({ success: true });
    }

    if (action === 'checkEnrollment') {
        const { userId, courseId } = req.query;
        const { rows } = await pool.query('SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2', [userId, courseId]);
        return res.status(200).json(rows.length > 0);
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
