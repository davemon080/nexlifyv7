import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Marketplace } from './pages/Marketplace';
import { Hire } from './pages/Hire';
import { Earn } from './pages/Earn';
import { Admin } from './pages/Admin';
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
import { ScrollToTop } from './components/ScrollToTop';
import { initializeDatabase } from './services/mockData';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize the Local JSON Database with defaults if empty
    initializeDatabase();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Marketplace />} />
          
          {/* AI Tools Routes */}
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;