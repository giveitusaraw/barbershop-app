import React from 'react';
import {
  Calendar, Clock, MapPin, Phone, Scissors, Star, Users, Shield,
  Award, Heart, Sparkles, Trophy, CheckCircle, ThumbsUp, Smile,
  Zap, Target, Palette, Briefcase, Gift, Crown, BadgeCheck
} from 'lucide-react';
import { useHomepageData } from '../hooks/useHomepageData';
import { useThemeColors } from '../hooks/useThemeColors';

interface HomePageProps {
  onNavigate: (page: 'booking') => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { settings, featuredServices, loading } = useHomepageData();

  useThemeColors(settings ? {
    primaryColor: settings.primary_color,
    secondaryColor: settings.secondary_color,
    accentColor: settings.accent_color,
    pageBgColor: settings.page_bg_color,
    servicesSectionBgColor: settings.services_section_bg_color,
    contactSectionBgColor: settings.contact_section_bg_color,
    cardBgColor: settings.card_bg_color,
    textHeadingColor: settings.text_heading_color,
    textBodyColor: settings.text_body_color,
  } : null);

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Users, Scissors, Star, Award, Clock, Shield, Heart,
      Sparkles, Trophy, CheckCircle, ThumbsUp, Smile, Zap,
      Target, Palette, Briefcase, Gift, Crown, BadgeCheck
    };
    return icons[iconName] || Users;
  };

  const Feature1Icon = getIconComponent(settings.feature_1_icon || 'Users');
  const Feature2Icon = getIconComponent(settings.feature_2_icon || 'Scissors');
  const Feature3Icon = getIconComponent(settings.feature_3_icon || 'Star');

  const addressLines = settings.contact_address.split('\n');

  const getHeroBackgroundStyle = () => {
    if (settings.use_background_image && settings.hero_background_image_url) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${settings.hero_background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      };
    }

    const gradientFrom = settings.hero_gradient_from || '#111827';
    const gradientVia = settings.hero_gradient_via || '#1f2937';
    const gradientTo = settings.hero_gradient_to || '#92400e';
    const direction = settings.hero_gradient_direction || 'to-br';

    const directionMap: { [key: string]: string } = {
      'to-r': 'to right',
      'to-l': 'to left',
      'to-t': 'to top',
      'to-b': 'to bottom',
      'to-tr': 'to top right',
      'to-tl': 'to top left',
      'to-br': 'to bottom right',
      'to-bl': 'to bottom left'
    };

    const cssDirection = directionMap[direction] || 'to bottom right';

    return {
      backgroundImage: `linear-gradient(${cssDirection}, ${gradientFrom}, ${gradientVia}, ${gradientTo})`
    };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-page-bg)' }}>
      <section className="text-white py-20 relative" style={getHeroBackgroundStyle()}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {settings.hero_title}
            </h1>
            {settings.hero_subtitle && (
              <p className="text-2xl md:text-3xl mb-4 text-gray-200 whitespace-pre-line">
                {settings.hero_subtitle}
              </p>
            )}
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto whitespace-pre-line">
              {settings.hero_description}
            </p>
            <button
              onClick={() => onNavigate('booking')}
              className="font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 transform hover:scale-105"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              {settings.hero_button_text}
            </button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
              {settings.why_choose_title}
            </h2>
            <p className="text-xl max-w-3xl mx-auto whitespace-pre-line" style={{ color: 'var(--color-text-body)' }}>
              {settings.why_choose_description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-200" style={{ backgroundColor: 'var(--color-card-bg)' }}>
              <div className="rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                <Feature1Icon className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>{settings.feature_1_title}</h3>
              <p className="whitespace-pre-line" style={{ color: 'var(--color-text-body)' }}>
                {settings.feature_1_description}
              </p>
            </div>

            <div className="rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-200" style={{ backgroundColor: 'var(--color-card-bg)' }}>
              <div className="rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                <Feature2Icon className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>{settings.feature_2_title}</h3>
              <p className="whitespace-pre-line" style={{ color: 'var(--color-text-body)' }}>
                {settings.feature_2_description}
              </p>
            </div>

            <div className="rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition-shadow duration-200" style={{ backgroundColor: 'var(--color-card-bg)' }}>
              <div className="rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                <Feature3Icon className="h-8 w-8" style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>{settings.feature_3_title}</h3>
              <p className="whitespace-pre-line" style={{ color: 'var(--color-text-body)' }}>
                {settings.feature_3_description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: 'var(--color-services-section-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4" style={{ color: 'var(--color-text-heading)' }}>
              {settings.services_section_title}
            </h2>
            <p className="text-xl whitespace-pre-line" style={{ color: 'var(--color-text-body)' }}>
              {settings.services_section_description}
            </p>
          </div>

          {featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <div key={service.id} className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--color-card-bg)' }}>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>{service.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>€{service.price.toFixed(2)}</span>
                    <div className="flex items-center" style={{ color: 'var(--color-text-body)' }}>
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">{service.duration} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Nenhum serviço em destaque configurado
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('booking')}
              className="font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              Ver Todos os Serviços
            </button>
          </div>
        </div>
      </section>

      <section className="text-white py-16" style={{ backgroundColor: 'var(--color-contact-section-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{settings.contact_section_title}</h2>
            <p className="text-xl text-gray-300 whitespace-pre-line">
              {settings.contact_section_description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="rounded-full p-4 w-16 h-16 mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <MapPin className="h-8 w-8" style={{ color: 'var(--color-secondary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Localização</h3>
              <p className="text-gray-300">
                {addressLines.map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < addressLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-full p-4 w-16 h-16 mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Clock className="h-8 w-8" style={{ color: 'var(--color-secondary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Horários</h3>
              <p className="text-gray-300">
                {settings.hours_weekday}<br />
                {settings.hours_weekend}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-full p-4 w-16 h-16 mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
                <Phone className="h-8 w-8" style={{ color: 'var(--color-secondary)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Contacto</h3>
              <p className="text-gray-300">
                {settings.contact_phone}<br />
                {settings.contact_email}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
