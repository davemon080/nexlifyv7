export enum ProductCategory {
  EBOOK = 'Ebook',
  TEMPLATE = 'Template',
  COURSE = 'Course',
  GUIDE = 'Guide',
  DESIGN = 'Design'
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  previewUrl?: string; // URL for live preview
  downloadUrl?: string; // Simulated file path
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

export interface User {
  id: string;
  email: string;
  password?: string; // In a real app, never store plain text
  role: 'admin' | 'user';
  name: string;
  balance: number;
  joinedAt: string;
  enrolledCourses?: string[]; // IDs of courses
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

// Training System Types

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[]; // Array of 4 options
    correctAnswer: number; // Index (0-3)
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content: string; // URL for video, Text content for reading
  fileUrl?: string; // PDF/Doc URL for reading
  questions?: QuizQuestion[]; // For Quizzes
  duration: string; // e.g. "15 mins"
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string; // e.g. "Week 1: Introduction"
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
  duration: string; // "3 Months"
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