import mysql from 'mysql2/promise';

// Initialize MySQL Connection Pool
// Connection string format: mysql://user:password@host:port/database
// Or use individual env vars if preferred, but DATABASE_URL is standard.
const pool = mysql.createPool(process.env.DATABASE_URL || '');

export default async (req: Request) => {
  // Handle CORS for local development
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Check Database Configuration
  if (!process.env.DATABASE_URL) {
      console.error("Missing DATABASE_URL environment variable.");
      return error('Server Configuration Error: Database not connected.', 500);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  
  try {
    const body = req.method !== 'GET' ? await req.json() : {};

    // --- PRODUCTS ---
    if (action === 'getProducts') {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      const products = rows as any[];
      const mapped = products.map(p => ({
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
      return json(mapped);
    }

    if (action === 'addProduct') {
      const { id, title, description, category, price, imageUrl, previewUrl, downloadUrl } = body;
      await pool.execute(
        'INSERT INTO products (id, title, description, category, price, image_url, preview_url, download_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, title, description, category, price, imageUrl, previewUrl, downloadUrl]
      );
      return json({ success: true });
    }

    if (action === 'updateProduct') {
      const { id, title, description, category, price, imageUrl, previewUrl, downloadUrl } = body;
      await pool.execute(
        'UPDATE products SET title=?, description=?, category=?, price=?, image_url=?, preview_url=?, download_url=? WHERE id=?',
        [title, description, category, price, imageUrl, previewUrl, downloadUrl, id]
      );
      return json({ success: true });
    }

    if (action === 'deleteProduct') {
      const { id } = body;
      await pool.execute('DELETE FROM products WHERE id = ?', [id]);
      return json({ success: true });
    }

    // --- USERS / AUTH ---
    if (action === 'login') {
      const { email, password } = body;
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
      const users = rows as any[];
      
      if (users.length === 0) {
        return error('Invalid credentials', 401);
      }
      
      const user = users[0];
      if (user.status === 'suspended' || user.status === 'banned') {
        return error('Account suspended', 403);
      }

      // Fetch enrollments
      const [enrollRows] = await pool.execute('SELECT course_id FROM enrollments WHERE user_id = ?', [user.id]);
      const enrolledCourses = (enrollRows as any[]).map(e => e.course_id);

      return json({
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
      const { id, name, email, password, role } = body;
      const validRole = role === 'admin' ? 'admin' : 'user';

      try {
        await pool.execute(
          'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
          [id, name, email, password, validRole]
        );
        return json({
          id, name, email, role: validRole, balance: 0, status: 'active', enrolledCourses: []
        });
      } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') return error('Email already exists', 400);
        console.error("Register error:", e);
        throw e;
      }
    }

    if (action === 'getAllUsers') {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const users = rows as any[];
      const mapped = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        balance: parseFloat(u.balance),
        status: u.status,
        joinedAt: u.created_at,
        enrolledCourses: [] 
      }));
      return json(mapped);
    }

    if (action === 'updateUser') {
      const { id, name, email, role, balance, status } = body;
      await pool.execute(
        'UPDATE users SET name=?, email=?, role=?, balance=?, status=? WHERE id=?',
        [name, email, role, balance, status, id]
      );
      return json({ success: true });
    }

    if (action === 'deleteUser') {
        const { id } = body;
        await pool.execute("UPDATE users SET status = 'banned' WHERE id = ?", [id]);
        return json({ success: true });
    }

    // --- ACTIVITY LOGS ---
    if (action === 'getLogs') {
        const userId = url.searchParams.get('userId');
        const [rows] = await pool.execute('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
        const mapped = (rows as any[]).map(l => ({
            id: l.id,
            userId: l.user_id,
            action: l.action,
            description: l.description,
            timestamp: l.created_at,
            type: l.type
        }));
        return json(mapped);
    }

    if (action === 'logActivity') {
        const { userId, action: act, description, type } = body;
        const id = `log-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
        try {
             await pool.execute(
               'INSERT INTO activity_logs (id, user_id, action, description, type) VALUES (?, ?, ?, ?, ?)',
               [id, userId, act, description, type]
             );
             return json({ success: true });
        } catch(e) {
            console.error("Log failed", e);
            return json({ success: false });
        }
    }

    // --- COURSES ---
    if (action === 'getCourses') {
      const [rows] = await pool.query('SELECT * FROM courses');
      const courses = rows as any[];
      const mapped = courses.map(c => {
        // MySQL JSON columns might come back as object or string depending on driver config
        let modules = c.modules_json;
        if (typeof modules === 'string') {
            try { modules = JSON.parse(modules); } catch { modules = []; }
        }
        return {
            ...c,
            price: parseFloat(c.price),
            modules: modules || []
        };
      });
      return json(mapped);
    }
    
    if (action === 'getCourseById') {
        const id = url.searchParams.get('id');
        const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [id]);
        const courses = rows as any[];
        
        if(courses.length === 0) return json(null);
        
        const c = courses[0];
        let modules = c.modules_json;
        if (typeof modules === 'string') {
            try { modules = JSON.parse(modules); } catch { modules = []; }
        }

        return json({ 
            ...c, 
            price: parseFloat(c.price),
            modules: modules || []
        });
    }

    if (action === 'addCourse') {
        const { id, title, description, thumbnail, level, duration, instructor, price, modules } = body;
        await pool.execute(
            'INSERT INTO courses (id, title, description, thumbnail, level, duration, instructor, price, modules_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, thumbnail, level, duration, instructor, price, JSON.stringify(modules)]
        );
        return json({ success: true });
    }

    if (action === 'updateCourse') {
        const { id, title, description, thumbnail, level, duration, instructor, price, modules } = body;
        await pool.execute(
            'UPDATE courses SET title=?, description=?, thumbnail=?, level=?, duration=?, instructor=?, price=?, modules_json=? WHERE id=?',
            [title, description, thumbnail, level, duration, instructor, price, JSON.stringify(modules), id]
        );
        return json({ success: true });
    }

    if (action === 'deleteCourse') {
        const { id } = body;
        // Delete enrollments first due to FK constraint
        await pool.execute('DELETE FROM enrollments WHERE course_id = ?', [id]);
        await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
        return json({ success: true });
    }

    if (action === 'enroll') {
        const { userId, courseId } = body;
        // IGNORE handles "ON CONFLICT DO NOTHING" logic in MySQL
        await pool.execute(
            'INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)',
            [userId, courseId]
        );
        return json({ success: true });
    }

    if (action === 'checkEnrollment') {
        const userId = url.searchParams.get('userId');
        const courseId = url.searchParams.get('courseId');
        const [rows] = await pool.execute('SELECT 1 FROM enrollments WHERE user_id=? AND course_id=?', [userId, courseId]);
        return json((rows as any[]).length > 0);
    }

    // --- INQUIRIES ---
    if (action === 'submitInquiry') {
      const { id, name, email, message, serviceType } = body;
      await pool.execute(
        'INSERT INTO inquiries (id, name, email, message, service_type) VALUES (?, ?, ?, ?, ?)',
        [id, name, email, message, serviceType]
      );
      return json({ success: true });
    }

    if (action === 'getInquiries') {
        const [rows] = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC');
        const inq = rows as any[];
        const mapped = inq.map(i => ({
            id: i.id,
            name: i.name,
            email: i.email,
            message: i.message,
            serviceType: i.service_type,
            status: i.status,
            createdAt: i.created_at
        }));
        return json(mapped);
    }

    return error('Invalid action', 400);

  } catch (err: any) {
    console.error(err);
    return error(err.message, 500);
  }
};

// Helpers
const json = (data: any) => new Response(JSON.stringify(data), {
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
});

const error = (msg: string, status: number) => new Response(JSON.stringify({ error: msg }), {
  status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
});