
import { Product, Inquiry, Service, EarningMethod, Course, User, ActivityLog, Module, Lesson, AppSettings, Notification, TutorQuestion } from '../types';

const API_URL = '/api';

async function api<T>(action: string, method = 'GET', body?: any): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
      const res = await fetch(`${API_URL}?action=${action}`, options);
      if (!res.ok) {
        const errText = await res.text();
        let errObj;
        try { errObj = JSON.parse(errText); } catch { errObj = { error: res.statusText }; }
        throw new Error(errObj.error || `API Error: ${res.statusText}`);
      }
      return res.json();
  } catch (error: any) {
      console.warn(`API call '${action}' failed:`, error.message);
      throw error;
  }
}

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

// --- TUTOR SERVICES ---

export const getTutorCourses = async (tutorId: string): Promise<Course[]> => {
    try {
        const all = await api<Course[]>('getCourses');
        return all.filter(c => c.tutorId === tutorId);
    } catch {
        return getLocal<Course>('courses').filter(c => c.tutorId === tutorId);
    }
};

export const getTutorStats = async (tutorId: string) => {
    try {
        return await api<{totalStudents: number, totalEarnings: number}>(`getTutorStats&tutorId=${tutorId}`);
    } catch {
        const users = getLocal<User>('users');
        const courses = getLocal<Course>('courses').filter(c => c.tutorId === tutorId);
        let studentCount = 0;
        let earnings = 0;
        courses.forEach(c => {
            const courseStudents = users.filter(u => u.enrolledCourses?.includes(c.id)).length;
            studentCount += courseStudents;
            earnings += (courseStudents * c.price * 0.1);
        });
        return { totalStudents: studentCount, totalEarnings: earnings };
    }
};

export const postStudentQuestion = async (q: Omit<TutorQuestion, 'id' | 'createdAt'>): Promise<void> => {
    const id = `tq-${Date.now()}`;
    try {
        await api('postQuestion', 'POST', { ...q, id });
    } catch {
        const local = getLocal<TutorQuestion>('tutor_questions');
        local.unshift({ ...q, id, createdAt: new Date().toISOString() });
        setLocal('tutor_questions', local);
    }
};

export const replyToQuestion = async (questionId: string, reply: string): Promise<void> => {
    try {
        await api('replyToQuestion', 'POST', { id: questionId, reply });
    } catch {
        const local = getLocal<TutorQuestion>('tutor_questions');
        const idx = local.findIndex(q => q.id === questionId);
        if (idx !== -1) {
            local[idx].reply = reply;
            local[idx].repliedAt = new Date().toISOString();
            setLocal('tutor_questions', local);
            
            // Notify student
            await sendNotification({
                userId: local[idx].studentId,
                title: 'Tutor Replied!',
                message: 'Your instructor has responded to your question in the classroom.',
                type: 'success'
            });
        }
    }
};

export const getQuestionsByCourse = async (courseId: string): Promise<TutorQuestion[]> => {
    try { return await api<TutorQuestion[]>(`getQuestions&courseId=${courseId}`); }
    catch { return getLocal<TutorQuestion>('tutor_questions').filter(q => q.courseId === courseId); }
};

export const getQuestionsByStudent = async (studentId: string): Promise<TutorQuestion[]> => {
    try { return await api<TutorQuestion[]>(`getQuestions&studentId=${studentId}`); }
    catch { return getLocal<TutorQuestion>('tutor_questions').filter(q => q.studentId === studentId); }
};

// --- NOTIFICATION SERVICES ---

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        return await api<Notification[]>(`getNotifications&userId=${userId}`);
    } catch {
        return getLocal<Notification>('notifications').filter(n => n.userId === userId);
    }
};

export const sendNotification = async (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isBroadcast?: boolean }): Promise<void> => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    try {
        await api('sendNotification', 'POST', { ...notif, id });
    } catch {
        const local = getLocal<Notification>('notifications');
        local.unshift({ ...notif, id, createdAt: new Date().toISOString(), isRead: false } as Notification);
        setLocal('notifications', local);
    }
};

export const markNotificationRead = async (id: string): Promise<void> => {
    try {
        await api('markNotificationRead', 'POST', { id });
    } catch {
        const local = getLocal<Notification>('notifications');
        const idx = local.findIndex(n => n.id === id);
        if (idx !== -1) {
            local[idx].isRead = true;
            setLocal('notifications', local);
        }
    }
};

// --- HOSTING SERVICES ---

export interface HostedFile {
    id: string;
    name: string;
    mime_type: string;
    created_at: string;
    content?: string; 
}

export const getHostedFiles = async (): Promise<HostedFile[]> => {
    try { return await api<HostedFile[]>('getHostedFiles'); } catch { return getLocal<HostedFile>('hosted_files'); }
};

export const uploadHostedFile = async (name: string, mimeType: string, content: string): Promise<HostedFile> => {
    const id = `file-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
    const newFile: HostedFile = { id, name, mime_type: mimeType, content, created_at: new Date().toISOString() };
    try {
        await api('uploadHostedFile', 'POST', { id, name, mimeType, content });
        return newFile;
    } catch {
        const files = getLocal<HostedFile>('hosted_files');
        files.unshift(newFile);
        setLocal('hosted_files', files);
        return newFile;
    }
};

export const deleteHostedFile = async (id: string): Promise<void> => {
    try { await api('deleteHostedFile', 'POST', { id }); } catch {
        const files = getLocal<HostedFile>('hosted_files');
        setLocal('hosted_files', files.filter(f => f.id !== id));
    }
};

export const getFileContent = async (id: string): Promise<{content: string, mime_type: string} | null> => {
    try {
        const res = await fetch(`${API_URL}?action=getFileContent&id=${id}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        const files = getLocal<HostedFile>('hosted_files');
        const file = files.find(f => f.id === id);
        if (!file || !file.content) return null;
        return { content: file.content, mime_type: file.mime_type };
    }
};

// --- APP SETTINGS ---
export const getAppSettings = (): AppSettings => {
    api<AppSettings>('getAppSettings').then(settings => {
        const current = localStorage.getItem('appSettings');
        if (current !== JSON.stringify(settings)) {
            localStorage.setItem('appSettings', JSON.stringify(settings));
            window.dispatchEvent(new Event('appSettingsChanged'));
        }
    }).catch(() => {});
    try {
        const stored = localStorage.getItem('appSettings');
        return stored ? JSON.parse(stored) : { platformName: 'Nexlify' };
    } catch { return { platformName: 'Nexlify' }; }
};

export const updateAppSettings = async (settings: AppSettings) => {
    try {
        await api('updateAppSettings', 'POST', settings);
        localStorage.setItem('appSettings', JSON.stringify(settings));
        window.dispatchEvent(new Event('appSettingsChanged'));
    } catch (e) {
        localStorage.setItem('appSettings', JSON.stringify(settings));
        window.dispatchEvent(new Event('appSettingsChanged'));
    }
};

export const initializeDatabase = async () => {
    console.log("🚀 Nexlify initializing...");
    if(getLocal('users').length === 0) setLocal('users', []);
};

// --- AUTH SERVICES ---

export const googleAuthenticate = async (accessToken: string): Promise<User> => {
    try {
        const user = await api<User>('googleAuth', 'POST', { accessToken });
        await logUserActivity(user.id, 'Login', 'User logged in via Google', 'info');
        return user;
    } catch (e: any) {
        throw new Error(e.message || "Google Authentication failed");
    }
};

export const registerUser = async (name: string, email: string, password: string, role: string = 'user', adminSecret?: string): Promise<User> => {
    const id = `u-${Date.now()}`;
    try {
        const user = await api<User>('register', 'POST', { id, name, email, password, role, adminSecret });
        await logUserActivity(user.id, 'Account Created', `User registered as ${role}`, 'success');
        return user;
    } catch (e: any) {
        const users = getLocal<User>('users');
        if (users.find(u => u.email === email)) throw new Error('Email already exists (Local Mode)');
        const finalRole = (role === 'admin' || role === 'tutor') ? role : 'user';
        const newUser: User = { 
            id, name, email, password, role: finalRole as any, 
            balance: 0, joinedAt: new Date().toISOString(), status: 'active', enrolledCourses: [], purchasedProducts: [] 
        };
        users.push(newUser);
        setLocal('users', users);
        return newUser;
    }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        const user = await api<User>('login', 'POST', { email, password });
        await logUserActivity(user.id, 'Login', 'User logged into the platform', 'info');
        return user;
    } catch (e) {
        const users = getLocal<User>('users');
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) throw new Error('Invalid credentials');
        if (user.status === 'suspended' || user.status === 'banned') throw new Error('Account suspended');
        return user;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try { return await api<User[]>('getAllUsers'); } catch { return getLocal<User>('users'); }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    try { await api('updateUser', 'POST', updatedUser); } catch {
        const users = getLocal<User>('users');
        const idx = users.findIndex(u => u.id === updatedUser.id);
        if(idx !== -1) { users[idx] = updatedUser; setLocal('users', users); }
    }
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    try { await api('changePassword', 'POST', { userId, currentPassword, newPassword }); } catch (e: any) {
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
    try { await api('deleteUser', 'POST', { id: userId }); } catch {
        const users = getLocal<User>('users');
        const idx = users.findIndex(u => u.id === userId);
        if(idx !== -1) { users[idx].status = 'banned'; setLocal('users', users); }
    }
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
};

// --- LOGGING ---

export const logUserActivity = async (userId: string, action: string, description: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info') => {
    try { await api('logActivity', 'POST', { userId, action, description, type }); } catch {
        const logs = getLocal<ActivityLog>('logs');
        logs.unshift({ id: `log-${Date.now()}`, userId, action, description, timestamp: new Date().toISOString(), type });
        setLocal('logs', logs);
    }
};

export const getUserActivity = async (userId: string): Promise<ActivityLog[]> => {
    try {
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
        
        // Trigger notification
        await sendNotification({
            userId,
            title: type === 'product_purchase' ? 'Product Purchased' : 'Course Enrolled',
            message: `Your payment of ₦${amount.toLocaleString()} for ref ${reference} was successful. Access is now granted.`,
            type: 'success'
        });

        const currentUser = getCurrentUser();
        if(currentUser && currentUser.id === userId) {
            if(type === 'product_purchase') {
                currentUser.purchasedProducts = [...(currentUser.purchasedProducts || []), itemId];
            } else if (type === 'course_enrollment') {
                currentUser.enrolledCourses = [...(currentUser.enrolledCourses || []), itemId];
            }
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (e) {
        await sendNotification({
            userId,
            title: 'Transaction Error',
            message: 'There was an error processing your access. Please contact support with your reference.',
            type: 'danger'
        });
    }
};

export const getAdminStats = async () => {
    try { return await api<{totalRevenue: number}>('getAdminStats'); } catch { return { totalRevenue: 0 }; }
};

// --- PRODUCT SERVICES ---

export const getProducts = async (): Promise<Product[]> => {
    try { return await api<Product[]>('getProducts'); } catch { return []; }
};

export const addProduct = async (product: Product): Promise<void> => {
    try { await api('addProduct', 'POST', product); } catch {}
};

export const updateProduct = async (product: Product): Promise<void> => {
    try { await api('updateProduct', 'POST', product); } catch {}
};

export const deleteProduct = async (id: string): Promise<void> => {
    try { await api('deleteProduct', 'POST', { id }); } catch {}
};

// --- COURSE SERVICES ---

export const getCourses = async (): Promise<Course[]> => {
    try { return await api<Course[]>('getCourses'); } catch { return []; }
};

export const getCourseById = async (id: string): Promise<Course | undefined> => {
    try {
        const res = await fetch(`${API_URL}?action=getCourseById&id=${id}`);
        if(!res.ok) throw new Error("Fetch failed");
        return await res.json();
    } catch { return undefined; }
};

export const addCourse = async (course: Course): Promise<void> => {
    try { await api('addCourse', 'POST', course); } catch {}
};

export const updateCourse = async (course: Course): Promise<void> => {
    try { await api('updateCourse', 'POST', course); } catch {}
};

export const deleteCourse = async (id: string): Promise<void> => {
    try { await api('deleteCourse', 'POST', { id }); } catch {}
};

export const adminEnrollUser = async (userId: string, courseId: string): Promise<User> => {
    try {
        await api('enroll', 'POST', { userId, courseId });
        await sendNotification({
            userId,
            title: 'Course Access Granted',
            message: 'An administrator has manually granted you access to a new course.',
            type: 'success'
        });
        const users = await getAllUsers();
        return users.find(u => u.id === userId)!;
    } catch { throw new Error("Failed"); }
};

export const adminRevokeAccess = async (userId: string, courseId: string): Promise<User> => {
    try {
        await api('unenroll', 'POST', { userId, courseId });
        await sendNotification({
            userId,
            title: 'Course Access Revoked',
            message: 'An administrator has revoked your access to a course.',
            type: 'warning'
        });
        const users = await getAllUsers();
        return users.find(u => u.id === userId)!;
    } catch { throw new Error("Failed"); }
};

export const enrollInCourse = async (courseId: string): Promise<void> => {
    const user = getCurrentUser();
    if (!user) return;
    try {
        await api('enroll', 'POST', { userId: user.id, courseId });
        await sendNotification({
            userId: user.id,
            title: 'Welcome to the Course!',
            message: 'You have successfully enrolled. You can now start learning in the classroom.',
            type: 'success'
        });
    } catch {}
    const updatedUser = { ...user, enrolledCourses: [...(user.enrolledCourses || []), courseId] };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
};

export const checkEnrollment = async (courseId: string): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) return false;
    try {
        const res = await fetch(`${API_URL}?action=checkEnrollment&userId=${user.id}&courseId=${courseId}`);
        if(res.ok) return await res.json();
        return user.enrolledCourses?.includes(courseId) || false;
    } catch { return user.enrolledCourses?.includes(courseId) || false; }
};

export const getCompletedLessons = (courseId: string): string[] => {
    const user = getCurrentUser();
    if (!user) return [];
    try { return JSON.parse(localStorage.getItem(`progress_${user.id}_${courseId}`) || '[]'); } catch { return []; }
}

export const saveCompletedLesson = (courseId: string, lessonId: string) => {
    const user = getCurrentUser();
    if (!user) return;
    const completed = getCompletedLessons(courseId);
    if (!completed.includes(lessonId)) {
        completed.push(lessonId);
        localStorage.setItem(`progress_${user.id}_${courseId}`, JSON.stringify(completed));
    }
}

// --- INQUIRIES ---

export const submitInquiry = async (inquiryData: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<void> => {
    const id = `inq-${Date.now()}`;
    try { await api('submitInquiry', 'POST', { ...inquiryData, id }); } catch {}
};

export const deleteInquiry = async (id: string): Promise<void> => {
    try { await api('deleteInquiry', 'POST', { id }); } catch {}
};

export const getInquiries = async (): Promise<Inquiry[]> => {
    try { return await api<Inquiry[]>('getInquiries'); } catch { return []; }
};

export const SERVICES_LIST: Service[] = [
  { id: 's1', title: 'Web Development', description: 'Custom websites built with modern technologies.', iconName: 'code' },
  { id: 's2', title: 'Digital Marketing', description: 'Grow your audience with targeted campaigns.', iconName: 'megaphone' },
  { id: 's3', title: 'Graphic Design', description: 'Stunning visuals for your brand identity.', iconName: 'pen-tool' },
  { id: 's4', title: 'Content Writing', description: 'Professional copywriting for blogs and sites.', iconName: 'file-text' }
];

export const EARNING_METHODS: EarningMethod[] = [
  { id: 'e1', title: 'Referral Program', description: 'Invite friends and earn commissions.', potential: '₦5,000 - ₦50,000 per user' },
  { id: 'e2', title: 'Freelance Marketplace', description: 'List your skills and get hired.', potential: '₦20,000 - ₦100,000 per hour' },
  { id: 'e3', title: 'Micro-Tasks', description: 'Complete simple digital tasks.', potential: '₦5,000 - 20,000 per day' }
];
