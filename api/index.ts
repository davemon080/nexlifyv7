import { Pool } from '@neondatabase/serverless';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Neon Connection Pool
// The Pool automatically handles connection management in serverless environments
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check Database Configuration
  if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'Server Configuration Error: Missing DATABASE_URL.' });
  }

  try {
    const action = req.query.action as string;
    const body = req.body || {};

    // --- AUTHENTICATION ---

    if (action === 'googleAuth') {
      const { accessToken } = body;
      
      // Verify the token by calling Google's UserInfo endpoint
      const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!googleRes.ok) {
        return res.status(401).json({ error: 'Invalid Google Token' });
      }

      const googleData = await googleRes.json();
      const { sub, name, email } = googleData;

      // Check if user exists
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

      if (rows.length > 0) {
          const user = rows[0];
          if (user.status === 'suspended' || user.status === 'banned') {
              return res.status(403).json({ error: 'Account suspended' });
          }
          
          // Fetch enrollments
          const { rows: enrollRows } = await pool.query('SELECT course_id FROM enrollments WHERE user_id = $1', [user.id]);
          const enrolledCourses = enrollRows.map((e: any) => e.course_id);
          
          return res.status(200).json({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              balance: parseFloat(user.balance),
              status: user.status,
              joinedAt: user.created_at,
              enrolledCourses
          });
      } else {
          // Register new user automatically
          const newId = `u-${sub.substring(0, 10)}${Date.now().toString().substring(8)}`;
          await pool.query(
              'INSERT INTO users (id, name, email, password, role, balance, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
              [newId, name, email, 'google-oauth-user', 'user', 0, 'active']
          );
          
          return res.status(200).json({
              id: newId,
              name,
              email,
              role: 'user',
              balance: 0,
              status: 'active',
              joinedAt: new Date().toISOString(),
              enrolledCourses: []
          });
      }
    }

    if (action === 'login') {
      const { email, password } = body;
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
      
      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = rows[0];
      if (user.status === 'suspended' || user.status === 'banned') {
        return res.status(403).json({ error: 'Account suspended' });
      }

      // Fetch enrollments
      const { rows: enrollRows } = await pool.query('SELECT course_id FROM enrollments WHERE user_id = $1', [user.id]);
      const enrolledCourses = enrollRows.map((e: any) => e.course_id);

      return res.status(200).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: parseFloat(user.balance),
        status: user.status,
        joinedAt: user.created_at,
        enrolledCourses
      });
    }

    if (action === 'register') {
      const { id, name, email, password, role, adminSecret } = body;
      
      // SERVER-SIDE SECURITY CHECK
      // Check if the requested role is admin, and if the provided secret matches the server env var
      let finalRole = 'user';
      if (role === 'admin') {
          if (process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) {
              finalRole = 'admin';
          } else {
              // If secret is wrong or missing, force user role
              finalRole = 'user'; 
          }
      }

      try {
        await pool.query(
          'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
          [id, name, email, password, finalRole]
        );
        return res.status(200).json({
          id, name, email, role: finalRole, balance: 0, status: 'active', enrolledCourses: []
        });
      } catch (e: any) {
        // Postgres unique violation code is 23505
        if (e.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        console.error("Register error:", e);
        throw e;
      }
    }

    if (action === 'changePassword') {
        const { userId, currentPassword, newPassword } = body;
        
        // Verify current password
        const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
        
        if (rows[0].password !== currentPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Update password
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
        return res.status(200).json({ success: true });
    }

    // --- PRODUCTS ---
    if (action === 'getProducts') {
      // Postgres returns column names as is. We map snake_case db columns to camelCase API response if needed.
      const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      const mapped = rows.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        price: parseFloat(p.price),
        imageUrl: p.image_url,
        previewUrl: p.preview_url,
        downloadUrl: p.download_url,
        createdAt: p.created_at
      }));
      return res.status(200).json(mapped);
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
      const { id } = body;
      await pool.query('DELETE FROM products WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    }

    // --- USERS MANAGEMENT ---

    if (action === 'getAllUsers') {
      const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const mapped = rows.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        balance: parseFloat(u.balance),
        status: u.status,
        joinedAt: u.created_at,
        enrolledCourses: [] 
      }));
      return res.status(200).json(mapped);
    }

    if (action === 'updateUser') {
      const { id, name, email, role, balance, status } = body;
      await pool.query(
        'UPDATE users SET name=$1, email=$2, role=$3, balance=$4, status=$5 WHERE id=$6',
        [name, email, role, balance, status, id]
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'deleteUser') {
        const { id } = body;
        await pool.query("UPDATE users SET status = 'banned' WHERE id = $1", [id]);
        return res.status(200).json({ success: true });
    }

    // --- ACTIVITY LOGS ---
    if (action === 'getLogs') {
        const userId = req.query.userId;
        const { rows } = await pool.query('SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
        const mapped = rows.map((l: any) => ({
            id: l.id,
            userId: l.user_id,
            action: l.action,
            description: l.description,
            timestamp: l.created_at,
            type: l.type
        }));
        return res.status(200).json(mapped);
    }

    if (action === 'logActivity') {
        const { userId, action: act, description, type } = body;
        const id = `log-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        await pool.query(
           'INSERT INTO activity_logs (id, user_id, action, description, type) VALUES ($1, $2, $3, $4, $5)',
           [id, userId, act, description, type]
        );
        return res.status(200).json({ success: true });
    }

    // --- COURSES ---
    if (action === 'getCourses') {
      const { rows } = await pool.query('SELECT * FROM courses');
      const mapped = rows.map((c: any) => {
        // Postgres JSONB columns are automatically parsed into objects by the driver
        const modules = c.modules_json || [];
        return {
            ...c,
            price: parseFloat(c.price),
            modules
        };
      });
      return res.status(200).json(mapped);
    }
    
    if (action === 'getCourseById') {
        const id = req.query.id;
        const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        
        if(rows.length === 0) return res.status(200).json(null);
        
        const c = rows[0];
        const modules = c.modules_json || [];

        return res.status(200).json({ 
            ...c, 
            price: parseFloat(c.price),
            modules
        });
    }

    if (action === 'addCourse') {
        const { id, title, description, thumbnail, level, duration, instructor, price, modules } = body;
        // Store modules as JSONB
        await pool.query(
            'INSERT INTO courses (id, title, description, thumbnail, level, duration, instructor, price, modules_json) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, title, description, thumbnail, level, duration, instructor, price, JSON.stringify(modules)]
        );
        return res.status(200).json({ success: true });
    }

    if (action === 'updateCourse') {
        const { id, title, description, thumbnail, level, duration, instructor, price, modules } = body;
        await pool.query(
            'UPDATE courses SET title=$1, description=$2, thumbnail=$3, level=$4, duration=$5, instructor=$6, price=$7, modules_json=$8 WHERE id=$9',
            [title, description, thumbnail, level, duration, instructor, price, JSON.stringify(modules), id]
        );
        return res.status(200).json({ success: true });
    }

    if (action === 'deleteCourse') {
        const { id } = body;
        // Cascading deletes handled by DB constraints usually, but good to be explicit
        await pool.query('DELETE FROM enrollments WHERE course_id = $1', [id]);
        await pool.query('DELETE FROM courses WHERE id = $1', [id]);
        return res.status(200).json({ success: true });
    }

    if (action === 'enroll') {
        const { userId, courseId } = body;
        // Postgres equivalent of INSERT IGNORE is ON CONFLICT DO NOTHING
        await pool.query(
            'INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, courseId]
        );
        return res.status(200).json({ success: true });
    }

    if (action === 'checkEnrollment') {
        const userId = req.query.userId;
        const courseId = req.query.courseId;
        const { rows } = await pool.query('SELECT 1 FROM enrollments WHERE user_id=$1 AND course_id=$2', [userId, courseId]);
        return res.status(200).json(rows.length > 0);
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
        const mapped = rows.map((i: any) => ({
            id: i.id,
            name: i.name,
            email: i.email,
            message: i.message,
            serviceType: i.service_type,
            status: i.status,
            createdAt: i.created_at
        }));
        return res.status(200).json(mapped);
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (err: any) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message });
  }
}