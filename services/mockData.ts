import { Product, Inquiry, Service, EarningMethod, Course, User, ActivityLog, Module, Lesson, AppSettings } from '../types';

// Vercel Serverless Functions are served at /api by default
const API_URL = '/api';

// --- HELPERS ---

// Helper to wrap fetch calls
async function api<T>(action: string, method = 'GET', body?: any): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
      const res = await fetch(`${API_URL}?action=${action}`, options);
      if (!res.ok) {
        // Try to parse error message, fallback to status text
        const errText = await res.text();
        let errObj;
        try { errObj = JSON.parse(errText); } catch { errObj = { error: res.statusText }; }
        throw new Error(errObj.error || `API Error: ${res.statusText}`);
      }
      return res.json();
  } catch (error: any) {
      // If network error or 404 (local dev without backend), rethrow for fallback handling
      console.warn(`API call '${action}' failed:`, error.message);
      throw error;
  }
}

// Local Storage Helpers for Fallback Mode
const getLocal = <T>(key: string): T[] => {
    try {
        const data = localStorage.getItem(`local_${key}`);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
};

const setLocal = (key: string, data: any[]) => {
    localStorage.setItem(`local_${key}`, JSON.stringify(data));
};

export const isCloudEnabled = () => true;

// --- APP SETTINGS ---
export const getAppSettings = (): AppSettings => {
    // We try to fetch from API, but this function is often called synchronously during render.
    // For React simplicity, we rely on LocalStorage as a cache, which is updated by the async fetch.
    
    // Trigger async refresh
    api<AppSettings>('getAppSettings').then(settings => {
        const current = localStorage.getItem('appSettings');
        if (current !== JSON.stringify(settings)) {
            localStorage.setItem('appSettings', JSON.stringify(settings));
            window.dispatchEvent(new Event('appSettingsChanged'));
        }
    }).catch(() => {});

    // Return current cached value
    try {
        const stored = localStorage.getItem('appSettings');
        return stored ? JSON.parse(stored) : { platformName: 'Nexlify' };
    } catch { return { platformName: 'Nexlify' }; }
};

export const updateAppSettings = async (settings: AppSettings) => {
    try {
        await api('updateAppSettings', 'POST', settings);
        // Update local cache
        localStorage.setItem('appSettings', JSON.stringify(settings));
        window.dispatchEvent(new Event('appSettingsChanged'));
    } catch (e) {
        console.warn("Failed to save settings to DB, using local fallback");
        localStorage.setItem('appSettings', JSON.stringify(settings));
        window.dispatchEvent(new Event('appSettingsChanged'));
    }
};

// --- INITIALIZATION ---
export const initializeDatabase = async () => {
    console.log("🚀 Nexlify initializing...");
    // Initialize local storage buckets if empty
    if(getLocal('users').length === 0) setLocal('users', []);
};

// --- AUTH SERVICES ---

export const googleAuthenticate = async (accessToken: string): Promise<User> => {
    try {
        const user = await api<User>('googleAuth', 'POST', { accessToken });
        await logUserActivity(user.id, 'Login', 'User logged in via Google', 'info');
        return user;
    } catch (e: any) {
        console.warn("⚠️ Backend Google Auth failed, fallback not supported for Google Auth.");
        throw new Error(e.message || "Google Authentication failed");
    }
};

export const registerUser = async (name: string, email: string, password: string, role: string = 'user', adminSecret?: string): Promise<User> => {
    const id = `u-${Date.now()}`;
    
    try {
        // Try Cloud First - pass adminSecret to backend for validation
        const user = await api<User>('register', 'POST', { id, name, email, password, role, adminSecret });
        await logUserActivity(user.id, 'Account Created', `User registered as ${role}`, 'success');
        return user;
    } catch (e: any) {
        console.warn("⚠️ Backend failed, falling back to Local Storage for Register.");
        
        // Local Fallback
        const users = getLocal<User>('users');
        if (users.find(u => u.email === email)) throw new Error('Email already exists (Local Mode)');
        
        // In local mode, we trust the client because it's offline/demo
        const finalRole = role === 'admin' ? 'admin' : 'user';

        const newUser: User = { 
            id, name, email, password, role: finalRole, 
            balance: 0, joinedAt: new Date().toISOString(), status: 'active', enrolledCourses: [], purchasedProducts: [] 
        };
        
        users.push(newUser);
        setLocal('users', users);
        return newUser;
    }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        // Try Cloud First
        const user = await api<User>('login', 'POST', { email, password });
        await logUserActivity(user.id, 'Login', 'User logged into the platform', 'info');
        return user;
    } catch (e) {
        console.warn("⚠️ Backend failed, falling back to Local Storage for Login.");
        
        // Local Fallback
        const users = getLocal<User>('users');
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            // Check if admin fallback
            if(email === 'admin@nexlify.com' && password === 'admin') {
                return { id: 'admin-local', name: 'Local Admin', email, role: 'admin', balance: 999999, joinedAt: new Date().toISOString(), status: 'active', enrolledCourses: [], purchasedProducts: [] };
            }
            throw new Error('Invalid credentials (Local Mode). Ensure you have registered locally if backend is offline.');
        }
        
        if (user.status === 'suspended' || user.status === 'banned') throw new Error('Account suspended');
        return user;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try {
        return await api<User[]>('getAllUsers');
    } catch {
        return getLocal<User>('users');
    }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    try {
        await api('updateUser', 'POST', updatedUser);
    } catch {
        const users = getLocal<User>('users');
        const idx = users.findIndex(u => u.id === updatedUser.id);
        if(idx !== -1) {
            users[idx] = { ...users[idx], ...updatedUser };
            setLocal('users', users);
        }
    }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    try {
        await api('changePassword', 'POST', { userId, currentPassword, newPassword });
        await logUserActivity(userId, 'Security', 'Password changed successfully', 'warning');
    } catch (e: any) {
        // Local Fallback
        const users = getLocal<User>('users');
        const idx = users.findIndex(u => u.id === userId);
        if(idx !== -1) {
            if (users[idx].password !== currentPassword) throw new Error('Incorrect current password');
            users[idx].password = newPassword;
            setLocal('users', users);
            return;
        }
        throw new Error(e.message || 'Change password failed');
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        await api('deleteUser', 'POST', { id: userId });
        await logUserActivity(userId, 'Account Banned', 'Admin banned this user', 'danger');
    } catch {
        const users = getLocal<User>('users');
        const idx = users.findIndex(u => u.id === userId);
        if(idx !== -1) {
            users[idx].status = 'banned';
            setLocal('users', users);
        }
    }
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
};

// --- LOGGING ---

export const logUserActivity = async (userId: string, action: string, description: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info') => {
    try {
        await api('logActivity', 'POST', { userId, action, description, type });
    } catch {
        // Local Log
        const logs = getLocal<ActivityLog>('logs');
        const newLog: ActivityLog = {
            id: `log-${Date.now()}`, userId, action, description, timestamp: new Date().toISOString(), type
        };
        logs.unshift(newLog);
        setLocal('logs', logs);
    }
};

export const getUserActivity = async (userId: string): Promise<ActivityLog[]> => {
    try {
        // Manual construction since GET params are tricky with simple wrapper
        const res = await fetch(`${API_URL}?action=getLogs&userId=${userId}`);
        if(!res.ok) throw new Error("Log fetch failed");
        return await res.json();
    } catch {
        return getLocal<ActivityLog>('logs').filter(l => l.userId === userId);
    }
};

// --- TRANSACTIONS ---

export const recordTransaction = async (userId: string, type: 'course_enrollment' | 'product_purchase', itemId: string, amount: number, reference: string) => {
    try {
        await api('recordTransaction', 'POST', { userId, type, itemId, amount, reference });
        
        // After success, we need to update the local current user session to reflect the purchase immediately
        const currentUser = getCurrentUser();
        if(currentUser && currentUser.id === userId) {
            if(type === 'product_purchase') {
                const updatedPurchases = [...(currentUser.purchasedProducts || []), itemId];
                const updatedUser = { ...currentUser, purchasedProducts: updatedPurchases };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            } else if (type === 'course_enrollment') {
                const updatedEnrollments = [...(currentUser.enrolledCourses || []), itemId];
                const updatedUser = { ...currentUser, enrolledCourses: updatedEnrollments };
                localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
        }

    } catch (e) {
        console.warn("Failed to record transaction to DB", e);
    }
};

export const getAdminStats = async () => {
    try {
        return await api<{totalRevenue: number}>('getAdminStats');
    } catch {
        return { totalRevenue: 0 };
    }
};

// --- PRODUCT SERVICES ---

export const getProducts = async (): Promise<Product[]> => {
    try {
        return await api<Product[]>('getProducts');
    } catch {
        // Return dummy data if backend fails - Adding Design and Template examples to test Paystack
        return [
            { 
                id: 'p1', 
                title: 'Ultimate Freelance Guide', 
                description: 'Complete guide to starting your freelance journey.', 
                category: 'Ebook', 
                price: 5000, 
                imageUrl: 'https://images.unsplash.com/photo-1544716278-ca83adff9d51?auto=format&fit=crop&q=80&w=800', 
                createdAt: new Date().toISOString() 
            },
            { 
                id: 'p2', 
                title: 'Modern Portfolio Template', 
                description: 'Responsive HTML/CSS template for creatives.', 
                category: 'Template', 
                price: 15000, 
                imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800', 
                createdAt: new Date().toISOString() 
            },
            { 
                id: 'p3', 
                title: 'Social Media Kit', 
                description: 'Pack of 50+ editable Canva designs.', 
                category: 'Design', 
                price: 8500, 
                imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800', 
                createdAt: new Date().toISOString() 
            }
        ] as any;
    }
};

export const addProduct = async (product: Product): Promise<void> => {
    try {
        await api('addProduct', 'POST', product);
    } catch { console.warn("Add product failed (Backend Offline)"); }
};

export const updateProduct = async (product: Product): Promise<void> => {
    try {
        await api('updateProduct', 'POST', product);
    } catch { console.warn("Update product failed (Backend Offline)"); }
};

export const deleteProduct = async (id: string): Promise<void> => {
    try {
        await api('deleteProduct', 'POST', { id });
    } catch { console.warn("Delete product failed (Backend Offline)"); }
};

// --- COURSE SERVICES ---

export const getCourses = async (): Promise<Course[]> => {
    try {
        return await api<Course[]>('getCourses');
    } catch {
        // Fallback Data
        return [{
            id: 'c-local', title: 'Offline Mode Course', description: 'Backend is unreachable. This is a placeholder.', 
            thumbnail: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&q=80&w=800', 
            level: 'Beginner', duration: 'N/A', instructor: 'System', price: 0, modules: []
        }];
    }
};

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    try {
        const res = await fetch(`${API_URL}?action=getCourseById&id=${id}`);
        if(!res.ok) throw new Error("Fetch failed");
        return await res.json();
    } catch {
        return undefined;
    }
};

export const addCourse = async (course: Course): Promise<void> => {
    try {
        await api('addCourse', 'POST', course);
    } catch { console.warn("Operation failed (Backend Offline)"); }
};

export const updateCourse = async (course: Course): Promise<void> => {
    try {
        await api('updateCourse', 'POST', course);
    } catch { console.warn("Operation failed (Backend Offline)"); }
};

export const deleteCourse = async (id: string): Promise<void> => {
    try {
        await api('deleteCourse', 'POST', { id });
    } catch { console.warn("Operation failed (Backend Offline)"); }
};

export const adminEnrollUser = async (userId: string, courseId: string): Promise<User> => {
    try {
        await api('enroll', 'POST', { userId, courseId });
        await logUserActivity(userId, 'Admin Grant', `Admin granted access to course ${courseId}`, 'warning');
        
        // Return refreshed user
        const users = await getAllUsers();
        const user = users.find(u => u.id === userId);
        if(!user) throw new Error("User not found");
        return user;
    } catch {
        // Local Fallback
        const users = getLocal<User>('users');
        const user = users.find(u => u.id === userId);
        if(user) {
            user.enrolledCourses = [...(user.enrolledCourses || []), courseId];
            const idx = users.findIndex(u => u.id === userId);
            users[idx] = user;
            setLocal('users', users);
            return user;
        }
        throw new Error("User not found (Local)");
    }
};

export const enrollInCourse = async (courseId: string): Promise<void> => {
    const user = getCurrentUser();
    if (!user) return;

    try {
        await api('enroll', 'POST', { userId: user.id, courseId });
        await logUserActivity(user.id, 'Course Enrollment', `User enrolled in course ${courseId}`, 'success');
    } catch {
        console.warn("Cloud enroll failed, local session updated only");
    }

    // Always update local session for UI responsiveness
    const updatedUser = { ...user, enrolledCourses: [...(user.enrolledCourses || []), courseId] };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Also try updating the "database" entry if in local mode
    try {
        const users = getLocal<User>('users');
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx] = updatedUser;
            setLocal('users', users);
        }
    } catch {}
};

export const checkEnrollment = async (courseId: string): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) return false;
    
    try {
        const res = await fetch(`${API_URL}?action=checkEnrollment&userId=${user.id}&courseId=${courseId}`);
        if(res.ok) return await res.json();
        throw new Error("Fetch failed");
    } catch {
        return user.enrolledCourses?.includes(courseId) || false;
    }
};

// --- PROGRESS TRACKING ---
// Currently using LocalStorage to ensure functionality without schema migration complexity for the user.
export const getCompletedLessons = (courseId: string): string[] => {
    const user = getCurrentUser();
    if (!user) return [];
    const key = `progress_${user.id}_${courseId}`;
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
}

export const saveCompletedLesson = (courseId: string, lessonId: string) => {
    const user = getCurrentUser();
    if (!user) return;
    const key = `progress_${user.id}_${courseId}`;
    const completed = getCompletedLessons(courseId);
    if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        localStorage.setItem(key, JSON.stringify(completed));
    }
}

// --- INQUIRIES ---

export const submitInquiry = async (inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    const id = `inq-${Date.now()}`;
    try {
        await api('submitInquiry', 'POST', { ...inquiryData, id });
    } catch {
        const inquiries = getLocal<Inquiry>('inquiries');
        inquiries.unshift({ ...inquiryData, id, createdAt: new Date().toISOString(), status: 'new' });
        setLocal('inquiries', inquiries);
    }
};

export const getInquiries = async (): Promise<Inquiry[]> => {
    try {
        return await api<Inquiry[]>('getInquiries');
    } catch {
        return getLocal<Inquiry>('inquiries');
    }
};

// --- CONSTANTS ---
export const SERVICES_LIST: Service[] = [
  { id: 's1', title: 'Web Development', description: 'Custom websites built with modern technologies.', iconName: 'code' },
  { id: 's2', title: 'Digital Marketing', description: 'Grow your audience with targeted campaigns.', iconName: 'megaphone' },
  { id: 's3', title: 'Graphic Design', description: 'Stunning visuals for your brand identity.', iconName: 'pen-tool' },
  { id: 's4', title: 'Content Writing', description: 'Professional copywriting for blogs and sites.', iconName: 'file-text' }
];

export const EARNING_METHODS: EarningMethod[] = [
  { id: 'e1', title: 'Referral Program', description: 'Invite friends and earn commissions.', potential: '₦5,000 - ₦50,000 per user' },
  { id: 'e2', title: 'Freelance Marketplace', description: 'List your skills and get hired.', potential: '₦20,000 - ₦100,000 per hour' },
  { id: 'e3', title: 'Micro-Tasks', description: 'Complete simple digital tasks.', potential: '₦5,000 - ₦20,000 per day' }
];