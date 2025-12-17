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