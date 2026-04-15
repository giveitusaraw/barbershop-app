import React, { useState, useEffect } from 'react';
import { Scissors, Calendar, LogIn, Menu, X, Download } from 'lucide-react';
import { db } from '../lib/database';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'booking' | 'admin') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoText, setLogoText] = useState<string | null>(null);
  const [logoImageUrl, setLogoImageUrl] = useState<string | undefined>();
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    loadLogoSettings();

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const loadLogoSettings = async () => {
    const settings = await db.getHomepageSettings();
    if (settings) {
      setLogoText(settings.logo_text || '');
      setLogoImageUrl(settings.logo_image_url);
      setUseCustomLogo(settings.use_custom_logo || false);
    } else {
      setLogoText('');
    }
    setIsLoading(false);
  };

  const handleNavigate = (page: 'home' | 'booking' | 'admin') => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    const { outcome } = await (installPrompt as any).userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
    }
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => handleNavigate('home')}
          >
            <div className="mr-3 flex items-center justify-center">
              {useCustomLogo && logoImageUrl ? (
                <img
                  src={logoImageUrl}
                  alt={logoText || 'Logo'}
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const scissors = e.currentTarget.parentElement?.querySelector('.scissors-fallback');
                    if (scissors) (scissors as HTMLElement).style.display = 'block';
                  }}
                />
              ) : (
                <Scissors className="h-6 w-6 text-gray-900" />
              )}
              <Scissors className="h-6 w-6 text-gray-900 scissors-fallback" style={{ display: 'none' }} />
            </div>
            {logoText && (
              <h1 className="text-2xl font-bold text-gray-900" style={{ visibility: isLoading ? 'hidden' : 'visible' }}>
                {logoText}
              </h1>
            )}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <button
              onClick={() => handleNavigate('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage === 'home'
                  ? ''
                  : 'text-gray-700'
              }`}
              style={currentPage === 'home' ? {
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              } : {}}
              onMouseEnter={(e) => {
                if (currentPage !== 'home') {
                  e.currentTarget.style.color = 'var(--color-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'home') {
                  e.currentTarget.style.color = '';
                }
              }}
            >
              Início
            </button>
            <button
              onClick={() => handleNavigate('booking')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center ${
                currentPage === 'booking'
                  ? ''
                  : 'text-gray-700'
              }`}
              style={currentPage === 'booking' ? {
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              } : {}}
              onMouseEnter={(e) => {
                if (currentPage !== 'booking') {
                  e.currentTarget.style.color = 'var(--color-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'booking') {
                  e.currentTarget.style.color = '';
                }
              }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Reservar
            </button>
            <button
              onClick={() => handleNavigate('admin')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center ${
                currentPage === 'admin'
                  ? ''
                  : 'text-gray-700'
              }`}
              style={currentPage === 'admin' ? {
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              } : {}}
              onMouseEnter={(e) => {
                if (currentPage !== 'admin') {
                  e.currentTarget.style.color = 'var(--color-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'admin') {
                  e.currentTarget.style.color = '';
                }
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </button>
            {isInstallable && (
              <button
                onClick={handleInstall}
                className="px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center border text-gray-700 hover:bg-gray-50"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                  e.currentTarget.style.color = 'var(--color-secondary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <nav className="flex flex-col space-y-1">
              <button
                onClick={() => handleNavigate('home')}
                className={`w-full text-left px-4 py-3 font-medium transition-colors duration-200 ${
                  currentPage === 'home'
                    ? ''
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={currentPage === 'home' ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-secondary)'
                } : {}}
              >
                Início
              </button>
              <button
                onClick={() => handleNavigate('booking')}
                className={`w-full text-left px-4 py-3 font-medium transition-colors duration-200 flex items-center ${
                  currentPage === 'booking'
                    ? ''
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={currentPage === 'booking' ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-secondary)'
                } : {}}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Reservar
              </button>
              <button
                onClick={() => handleNavigate('admin')}
                className={`w-full text-left px-4 py-3 font-medium transition-colors duration-200 flex items-center ${
                  currentPage === 'admin'
                    ? ''
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={currentPage === 'admin' ? {
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-secondary)'
                } : {}}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </button>
              {isInstallable && (
                <button
                  onClick={() => { handleInstall(); setIsMobileMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 font-medium transition-colors duration-200 flex items-center"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar App
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;