import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useThemeColors } from './hooks/useThemeColors';
import { db } from './lib/database';
import { supabase } from './lib/supabase';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import MaintenancePage from './pages/MaintenancePage';

type Page = 'home' | 'booking' | 'admin' | 'login';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { isAuthenticated, isSessionLoading, checkAuth } = useAuth();
  const [themeColors, setThemeColors] = useState<{ primaryColor: string; secondaryColor: string; accentColor: string } | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(true);

  useEffect(() => {
    const loadThemeColors = async () => {
      const settings = await db.getHomepageSettings();
      if (settings) {
        setThemeColors({
          primaryColor: settings.primary_color,
          secondaryColor: settings.secondary_color,
          accentColor: settings.accent_color
        });
      }
    };

    loadThemeColors();

    const handleThemeUpdate = () => {
      loadThemeColors();
    };

    window.addEventListener('themeColorsUpdated', handleThemeUpdate);

    return () => {
      window.removeEventListener('themeColorsUpdated', handleThemeUpdate);
    };
  }, []);

  useEffect(() => {
    const fetchMaintenance = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('maintenance_mode')
        .eq('id', 1)
        .maybeSingle();
      if (data) setMaintenanceMode(data.maintenance_mode);
      setMaintenanceLoading(false);
    };

    fetchMaintenance();

    const channel = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, (payload) => {
        if (payload.new && typeof payload.new.maintenance_mode === 'boolean') {
          setMaintenanceMode(payload.new.maintenance_mode);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useThemeColors(themeColors);

  if (isSessionLoading || maintenanceLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm tracking-wide">A verificar sessao...</p>
        </div>
      </div>
    );
  }

  const handleNavigateToAdmin = () => {
    if (checkAuth()) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('login');
    }
  };

  const handleLoginSuccess = () => {
    setCurrentPage('admin');
  };

  if (maintenanceMode && !isAuthenticated && currentPage !== 'login') {
    return <MaintenancePage onNavigateToLogin={() => setCurrentPage('login')} />;
  }

  const handleNavigation = (page: Page) => {
    if (page === 'admin') {
      handleNavigateToAdmin();
    } else {
      setCurrentPage(page);
    }
  };

  if (currentPage === 'admin') {
    if (isAuthenticated) {
      return <AdminPage onLogout={() => setCurrentPage('login')} />;
    }
    return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateHome={() => setCurrentPage('home')} />;
  }

  if (currentPage === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateHome={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={handleNavigation} />
      {currentPage === 'booking' ? (
        <BookingPage onNavigateHome={() => setCurrentPage('home')} />
      ) : (
        <HomePage onNavigate={setCurrentPage} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
