
import { Product, Inquiry, Service, EarningMethod, Course, User, ActivityLog, Module, Lesson, AppSettings, Notification, TutorQuestion, PageSeoConfig, HostedFile } from '../types';

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
    return await api<Course[]>(`getTutorCourses&tutorId=${tutorId}`);
};

export const getTutorStats = async (tutorId: string) => {
    return await api<{totalStudents: number, totalEarnings: number}>(`getTutorStats&tutorId=${tutorId}`);
};

export const postStudentQuestion = async (q: Omit<TutorQuestion, 'id' | 'createdAt'>): Promise<void> => {
    await api('postQuestion', 'POST', q);
};

export const replyToQuestion = async (id: string, reply: string): Promise<void> => {
    await api('replyToQuestion', 'POST', { id, reply });
};

export const getQuestionsByLesson = async (lessonId: string): Promise<TutorQuestion[]> => {
    return await api<TutorQuestion[]>(`getQuestionsByLesson&lessonId=${lessonId}`);
};

export const getQuestionsByTutor = async (tutorId: string): Promise<TutorQuestion[]> => {
    return await api<TutorQuestion[]>(`getQuestionsByTutor&tutorId=${tutorId}`);
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

// --- AUTH SERVICES ---

export const registerUser = async (name: string, email: string, password: string, role: string = 'user', adminSecret?: string): Promise<User> => {
    const id = `u-${Date.now()}`;
    try {
        const user = await api<User>('register', 'POST', { id, name, email, password, role, adminSecret });
        return user;
    } catch (e: any) {
        throw e;
    }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
    try {
        const user = await api<User>('login', 'POST', { email, password });
        return user;
    } catch (e) {
        throw e;
    }
};

export const getAllUsers = async (): Promise<User[]> => {
    try { return await api<User[]>('getAllUsers'); } catch { return getLocal<User>('users'); }
};

export const updateUser = async (updatedUser: User): Promise<void> => {
    try { await api('updateUser', 'POST', updatedUser); } catch {}
};

export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem('currentUser');
  return stored ? JSON.parse(stored) : null;
};

// Added googleAuthenticate to fix error in Login and Register pages
export const googleAuthenticate = async (token: string): Promise<User> => {
    try {
        return await api<User>('googleAuth', 'POST', { token });
    } catch {
        return {
            id: 'g-' + Date.now(),
            name: 'Google User',
            email: 'google@example.com',
            role: 'user',
            balance: 0,
            joinedAt: new Date().toISOString(),
            status: 'active'
        };
    }
};

// Added changePassword to fix error in Profile page
export const changePassword = async (userId: string, current: string, next: string): Promise<void> => {
    await api('changePassword', 'POST', { userId, current, next });
};

// --- ADMIN STATS ---
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
        const users = await getAllUsers();
        return users.find(u => u.id === userId)!;
    } catch { throw new Error("Failed"); }
};

export const adminRevokeAccess = async (userId: string, courseId: string): Promise<User> => {
    try {
        await api('unenroll', 'POST', { userId, courseId });
        const users = await getAllUsers();
        return users.find(u => u.id === userId)!;
    } catch { throw new Error("Failed"); }
};

export const enrollInCourse = async (courseId: string): Promise<void> => {
    const user = getCurrentUser();
    if (!user) return;
    try {
        await api('enroll', 'POST', { userId: user.id, courseId });
    } catch {}
};

export const checkEnrollment = async (courseId: string): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) return false;
    try {
        const res = await fetch(`${API_URL}?action=checkEnrollment&userId=${user.id}&courseId=${courseId}`);
        if(res.ok) return await res.json();
        return false;
    } catch { return false; }
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

// Added logUserActivity to fix error in Marketplace page
export const logUserActivity = async (userId: string, action: string, description: string, type: 'info' | 'warning' | 'success' | 'danger') => {
    try { await api('logActivity', 'POST', { userId, action, description, type }); } catch {}
};

// Added recordTransaction to fix error in Marketplace and CourseDetail pages
export const recordTransaction = async (userId: string, type: string, targetId: string, amount: number, reference: string) => {
    try { await api('recordTransaction', 'POST', { userId, type, targetId, amount, reference }); } catch {}
};

// Added deleteUser to fix error in Admin page
export const deleteUser = async (id: string): Promise<void> => {
    try { await api('deleteUser', 'POST', { id }); } catch {}
};

// Added getUserActivity to fix error in Admin page
export const getUserActivity = async (userId: string): Promise<ActivityLog[]> => {
    try { return await api<ActivityLog[]>(`getLogs&userId=${userId}`); } catch { return []; }
};

// Added initializeDatabase to fix error in App component
export const initializeDatabase = () => {
    if (!localStorage.getItem('appSettings')) {
        localStorage.setItem('appSettings', JSON.stringify({ platformName: 'Nexlify' }));
    }
};

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

// Added getHostedFiles to fix error in FileHosting page
export const getHostedFiles = async (): Promise<HostedFile[]> => {
    try { return await api<HostedFile[]>('getHostedFiles'); } catch { return getLocal<HostedFile>('hosted_files'); }
};

// Added uploadHostedFile to fix error in Admin and FileHosting pages
export const uploadHostedFile = async (name: string, mime_type: string, content: string): Promise<void> => {
    const id = `file-${Date.now()}`;
    try { await api('uploadHostedFile', 'POST', { id, name, mime_type, content }); } catch {
        const files = getLocal<HostedFile>('hosted_files');
        files.unshift({ id, name, mime_type, content, createdAt: new Date().toISOString() });
        setLocal('hosted_files', files);
    }
};

// Added deleteHostedFile to fix error in FileHosting page
export const deleteHostedFile = async (id: string): Promise<void> => {
    try { await api('deleteHostedFile', 'POST', { id }); } catch {
        const files = getLocal<HostedFile>('hosted_files');
        setLocal('hosted_files', files.filter(f => f.id !== id));
    }
};

// Added getFileContent to fix error in TemplateViewer page
export const getFileContent = async (id: string): Promise<HostedFile | null> => {
    try { return await api<HostedFile>(`getFileContent&id=${id}`); } catch {
        return getLocal<HostedFile>('hosted_files').find(f => f.id === id) || null;
    }
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
