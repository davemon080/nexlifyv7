
import { Product, Inquiry, Course, User, AppSettings, Notification, TutorQuestion, HostedFile } from '../types';

const API_BASE = '/api';

async function fetchApi<T>(action: string, method = 'GET', body?: any): Promise<T> {
  const url = `${API_BASE}?action=${action}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error(`API Call [${action}] failed:`, err);
    throw err;
  }
}

export const api = {
  getAppSettings: () => fetchApi<AppSettings>('getAppSettings'),
  updateAppSettings: (s: AppSettings) => fetchApi('updateAppSettings', 'POST', s),
  getProducts: () => fetchApi<Product[]>('getProducts'),
  addProduct: (p: Product) => fetchApi('addProduct', 'POST', p),
  getCourses: () => fetchApi<Course[]>('getCourses'),
  getCourseById: (id: string) => fetchApi<Course>(`getCourseById&id=${id}`),
  login: (creds: any) => fetchApi<User>('login', 'POST', creds),
  register: (u: any) => fetchApi('register', 'POST', u),
  enroll: (userId: string, courseId: string) => fetchApi('enroll', 'POST', { userId, courseId }),
  getAdminStats: () => fetchApi<{totalRevenue: number, userCount: number}>('getAdminStats'),
  getInquiries: () => fetchApi<Inquiry[]>('getInquiries'),
  submitInquiry: (i: Inquiry) => fetchApi('submitInquiry', 'POST', i),
  getAllUsers: () => fetchApi<User[]>('getAllUsers')
};
