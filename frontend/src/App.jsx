import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/navigation/Sidebar';
import Navbar from './components/navigation/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SmartRestore from './pages/SmartRestore';
import ImageColorization from './pages/ImageColorization';
import ImageSuperResolution from './pages/ImageSuperResolution';
import VideoColorization from './pages/VideoColorization';
import VideoEnhancement from './pages/VideoEnhancement';
import History from './pages/History';
import About from './pages/About';
import { api } from './services/api';

function AppLayout({ systemStatus }) {
  return (
    <div className="flex min-h-screen bg-[#05070B] text-[#F5F8FC]">
      <Sidebar systemStatus={systemStatus} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar systemStatus={systemStatus} />
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await api.getSystemStatus();
        setSystemStatus(data);
      } catch (err) {
        console.warn('API status check offline or connecting...', err);
        setSystemStatus({
          device: 'mps',
          device_name: 'Apple Silicon (MPS Acceleration)',
          platform: 'Darwin (arm64)',
          memory: { total_gb: 16.0, used_gb: 6.5, available_gb: 9.5, percent_used: 40 },
        });
      }
    }
    loadStatus();
  }, []);

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage systemStatus={systemStatus} />} />

      {/* Authenticated / Application Studio Shell */}
      <Route path="/app" element={<AppLayout systemStatus={systemStatus} />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard systemStatus={systemStatus} />} />
        <Route path="smart-restore" element={<SmartRestore />} />
        <Route path="image-colorization" element={<ImageColorization />} />
        <Route path="image-sr" element={<ImageSuperResolution />} />
        <Route path="video-colorization" element={<VideoColorization />} />
        <Route path="video-enhancement" element={<VideoEnhancement />} />
        <Route path="history" element={<History />} />
        <Route path="about" element={<About />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

