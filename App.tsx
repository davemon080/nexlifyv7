
import React, { useEffect, useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Hire } from './pages/Hire';
import { Earn } from './pages/Earn';
import { Admin } from './pages/Admin';
import { TutorDashboard } from './pages/TutorDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Training } from './pages/Training';
import { CourseDetail } from './pages/CourseDetail';
import { Classroom } from './pages/Classroom';
import { Profile } from './pages/Profile';
import { AiTools } from './pages/AiTools';
import { VideoDownloader } from './pages/VideoDownloader';
import { VideoTranscribe } from './pages/VideoTranscribe';
import { AiChat } from './pages/AiChat';
import { ImageAnalyzer } from './pages/ImageAnalyzer';
import { VideoAnalyzer } from './pages/VideoAnalyzer';
import { AudioTranscribe } from './pages/AudioTranscribe';
import { TextToSpeech } from './pages/TextToSpeech';
import { FileHosting } from './pages/FileHosting';
import { TemplateViewer } from './pages/TemplateViewer';
import { ScrollToTop } from './components/ScrollToTop';
import { initializeDatabase } from './services/mockData';
import { Toast, Dialog, Confetti } from './components/UI';

// Feedback Context
interface FeedbackContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  showDialog: (options: {
    title: string;
    message: string;
    type?: 'alert' | 'confirm' | 'prompt';
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
  }) => void;
  celebrate: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error('useFeedback must be used within FeedbackProvider');
  return context;
};

const App: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: any } | null>(null);
  const [dialog, setDialog] = useState<any>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const showDialog = (options: any) => {
    setDialog(options);
  };

  const celebrate = () => {
    setIsCelebrating(true);
    setTimeout(() => setIsCelebrating(false), 5000);
  };

  return (
    <FeedbackContext.Provider value={{ showToast, showDialog, celebrate }}>
      <Router>
        <ScrollToTop />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {dialog && (
          <Dialog 
            {...dialog} 
            onConfirm={(val) => { dialog.onConfirm(val); setDialog(null); }} 
            onCancel={() => { dialog.onCancel?.(); setDialog(null); }} 
          />
        )}
        {isCelebrating && <Confetti />}
        
        <Routes>
          <Route path="/template-view/:id" element={<TemplateViewer />} />
          <Route path="*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/market" element={<Marketplace />} />
                <Route path="/ai-tools" element={<AiTools />} />
                <Route path="/ai-tools/downloader" element={<VideoDownloader />} />
                <Route path="/ai-tools/transcribe" element={<VideoTranscribe />} />
                <Route path="/ai-tools/chat" element={<AiChat />} />
                <Route path="/ai-tools/image" element={<ImageAnalyzer />} />
                <Route path="/ai-tools/video" element={<VideoAnalyzer />} />
                <Route path="/ai-tools/audio" element={<AudioTranscribe />} />
                <Route path="/ai-tools/tts" element={<TextToSpeech />} />
                <Route path="/hire" element={<Hire />} />
                <Route path="/earn" element={<Earn />} />
                <Route path="/training" element={<Training />} />
                <Route path="/training/:id" element={<CourseDetail />} />
                <Route path="/classroom/:id" element={<Classroom />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/tutor-dashboard" element={<TutorDashboard />} />
                <Route path="/admin/hosting" element={<FileHosting />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </FeedbackContext.Provider>
  );
};

export default App;
