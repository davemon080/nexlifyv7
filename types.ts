
export enum ProductCategory {
  EBOOK = 'Ebook',
  TEMPLATE = 'Template',
  COURSE = 'Course',
  GUIDE = 'Guide',
  DESIGN = 'Design'
}

export interface PageSeoConfig {
  path: string; 
  title: string;
  description: string;
  keywords: string;
  ogImage?: string;
}

export interface AppSettings {
  logoUrl?: string;
  platformName: string;
  seoDefinitions?: Record<string, PageSeoConfig>; 
  defaultSeo?: PageSeoConfig;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  previewUrl?: string; 
  downloadUrl?: string; 
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  serviceType: string;
  createdAt: string;
  status: 'new' | 'read' | 'archived';
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'danger';
    isRead: boolean;
    createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password?: string; 
  role: 'admin' | 'user';
  name: string;
  balance: number;
  joinedAt: string;
  enrolledCourses?: string[]; 
  purchasedProducts?: string[]; 
  status?: 'active' | 'suspended' | 'banned';
  photoUrl?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export interface Service {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface EarningMethod {
  id: string;
  title: string;
  description: string;
  potential: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[]; 
    correctAnswer: number; 
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string; 
  fileUrl?: string; 
  questions?: QuizQuestion[]; 
  duration: string; 
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string; 
  description: string;
  lessons: Lesson[];
  isLocked?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string; 
  instructor: string;
  price: number;
  modules: Module[];
}

export interface Enrollment {
  courseId: string;
  userId: string;
  enrolledAt: string;
  progress: number;
}