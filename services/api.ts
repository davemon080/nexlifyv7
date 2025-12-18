
// Fix: Removed 'HostedFile' from imports as it's not exported from '../types'. 
// Also removed unused imports 'Notification' and 'TutorQuestion'.
import { Product, Inquiry, Course, User, AppSettings } from '../types';

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
  getAllUsers: () => fetchApi<User[]>('getAllUsers'),
  updateCourse: (course: Course) => fetchApi('updateCourse', 'POST', course),
  
  // NEW: Material Upload
  uploadMaterial: (data: { id: string, courseId: string, lessonId: string, fileName: string, mimeType: string, fileData: string }) => 
    fetchApi('uploadMaterial', 'POST', data),
    
  getMaterial: (id: string) => fetchApi<{ file_name: string, mime_type: string, file_data: string }>(`getMaterial&id=${id}`)
};
