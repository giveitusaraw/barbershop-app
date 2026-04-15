import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { db, HomepageSettings } from '../lib/database';
import HeroSectionEditor from './layout-editor/HeroSectionEditor';
import FeaturesSectionEditor from './layout-editor/FeaturesSectionEditor';
import ServicesSectionEditor from './layout-editor/ServicesSectionEditor';
import FeaturedServicesEditor from './layout-editor/FeaturedServicesEditor';
import ContactSectionEditor from './layout-editor/ContactSectionEditor';
import ThemeColorsEditor from './layout-editor/ThemeColorsEditor';
import LogoSectionEditor from './layout-editor/LogoSectionEditor';
import HeroBackgroundEditor from './layout-editor/HeroBackgroundEditor';
import { isValidHexColor } from '../lib/themeUtils';

type TabType = 'logo' | 'hero' | 'hero-background' | 'features' | 'services-info' | 'services-selection' | 'contact' | 'colors';

interface LayoutAdminPageProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const LayoutAdminPage: React.FC<LayoutAdminPageProps> = ({ activeTab, onTabChange }) => {
  const setActiveTab = onTabChange;
  const [settings, setSettings] = useState<Partial<HomepageSettings>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroBackgroundFile, setHeroBackgroundFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, featuredServices] = await Promise.all([
        db.getHomepageSettings(),
        db.getFeaturedServices()
      ]);

      if (settingsData) {
        setSettings(settingsData);
      }
      setSelectedServiceIds(featuredServices.map(s => s.id));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleServicesChange = (serviceIds: string[]) => {
    setSelectedServiceIds(serviceIds);
    setHasUnsavedChanges(true);
  };

  const handleLogoImageChange = (file: File | null) => {
    setLogoFile(file);
    setHasUnsavedChanges(true);
  };

  const handleRemoveOldLogoImage = async () => {
    if (settings.logo_image_url) {
      try {
        await db.deleteLogoImage(settings.logo_image_url);
        setSettings(prev => ({ ...prev, logo_image_url: '' }));
      } catch (error) {
        console.error('Error deleting old logo image:', error);
      }
    }
  };

  const handleHeroBackgroundImageChange = (file: File | null) => {
    setHeroBackgroundFile(file);
    setHasUnsavedChanges(true);
  };

  const handleRemoveOldHeroBackgroundImage = async () => {
    if (settings.hero_background_image_url) {
      try {
        await db.deleteHeroBackgroundImage(settings.hero_background_image_url);
        setSettings(prev => ({ ...prev, hero_background_image_url: '' }));
      } catch (error) {
        console.error('Error deleting old hero background image:', error);
      }
    }
  };

  const validateSettings = (): boolean => {
    if (!settings.hero_title?.trim()) {
      showMessage('error', 'O título principal é obrigatório');
      setActiveTab('hero');
      return false;
    }

    if (!settings.primary_color || !isValidHexColor(settings.primary_color)) {
      showMessage('error', 'A cor primária é inválida');
      setActiveTab('colors');
      return false;
    }

    if (!settings.secondary_color || !isValidHexColor(settings.secondary_color)) {
      showMessage('error', 'A cor secundária é inválida');
      setActiveTab('colors');
      return false;
    }

    if (!settings.accent_color || !isValidHexColor(settings.accent_color)) {
      showMessage('error', 'A cor de acento é inválida');
      setActiveTab('colors');
      return false;
    }

    if (selectedServiceIds.length === 0) {
      showMessage('error', 'Selecione pelo menos 1 serviço em destaque');
      setActiveTab('services-selection');
      return false;
    }

    if (selectedServiceIds.length > 6) {
      showMessage('error', 'Selecione no máximo 6 serviços em destaque');
      setActiveTab('services-selection');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.contact_email && !emailRegex.test(settings.contact_email)) {
      showMessage('error', 'O email de contacto é inválido');
      setActiveTab('contact');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateSettings()) return;

    try {
      setSaving(true);

      let updatedSettings = { ...settings };

      if (logoFile) {
        const logoUrl = await db.uploadLogoImage(logoFile);
        updatedSettings.logo_image_url = logoUrl;
        setLogoFile(null);
      }

      if (heroBackgroundFile) {
        const heroBackgroundUrl = await db.uploadHeroBackgroundImage(heroBackgroundFile);
        updatedSettings.hero_background_image_url = heroBackgroundUrl;
        setHeroBackgroundFile(null);
      }

      await db.updateHomepageSettings(updatedSettings);
      await db.updateFeaturedServices(selectedServiceIds);
      setSettings(updatedSettings);
      setHasUnsavedChanges(false);

      window.dispatchEvent(new Event('themeColorsUpdated'));

      showMessage('success', 'Alterações guardadas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Erro ao guardar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Tem a certeza que deseja restaurar todos os valores padrão? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setSaving(true);
      await db.resetHomepageToDefaults();
      await loadData();

      window.dispatchEvent(new Event('themeColorsUpdated'));

      showMessage('success', 'Valores padrão restaurados com sucesso!');
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      showMessage('error', 'Erro ao restaurar valores padrão');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">A carregar...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Layout da Homepage</h2>
          <p className="text-gray-600 mt-1">
            Personalize todos os elementos visuais e textuais da página inicial
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              Alterações não guardadas
            </span>
          )}
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrões
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {saving ? 'A guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {activeTab === 'logo' && (
            <LogoSectionEditor
              logoText={settings.logo_text || ''}
              logoImageUrl={settings.logo_image_url}
              useCustomLogo={settings.use_custom_logo || false}
              onLogoTextChange={(value) => handleFieldChange('logo_text', value)}
              onLogoImageChange={handleLogoImageChange}
              onUseCustomLogoChange={(value) => {
                setSettings(prev => ({ ...prev, use_custom_logo: value }));
                setHasUnsavedChanges(true);
              }}
              onRemoveOldImage={handleRemoveOldLogoImage}
            />
          )}

          {activeTab === 'hero' && (
            <HeroSectionEditor
              title={settings.hero_title || ''}
              subtitle={settings.hero_subtitle || ''}
              description={settings.hero_description || ''}
              buttonText={settings.hero_button_text || ''}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'hero-background' && (
            <HeroBackgroundEditor
              useBackgroundImage={settings.use_background_image}
              backgroundImageUrl={settings.hero_background_image_url}
              gradientFrom={settings.hero_gradient_from || '#111827'}
              gradientVia={settings.hero_gradient_via || '#1f2937'}
              gradientTo={settings.hero_gradient_to || '#92400e'}
              gradientDirection={settings.hero_gradient_direction || 'to-br'}
              onUseBackgroundImageChange={(value) => {
                setSettings(prev => ({ ...prev, use_background_image: value }));
                setHasUnsavedChanges(true);
              }}
              onBackgroundImageChange={handleHeroBackgroundImageChange}
              onGradientFromChange={(value) => handleFieldChange('hero_gradient_from', value)}
              onGradientViaChange={(value) => handleFieldChange('hero_gradient_via', value)}
              onGradientToChange={(value) => handleFieldChange('hero_gradient_to', value)}
              onGradientDirectionChange={(value) => handleFieldChange('hero_gradient_direction', value)}
              onRemoveOldImage={handleRemoveOldHeroBackgroundImage}
            />
          )}

          {activeTab === 'features' && (
            <FeaturesSectionEditor
              whyChooseTitle={settings.why_choose_title || ''}
              whyChooseDescription={settings.why_choose_description || ''}
              feature1Title={settings.feature_1_title || ''}
              feature1Description={settings.feature_1_description || ''}
              feature1Icon={settings.feature_1_icon || 'Users'}
              feature2Title={settings.feature_2_title || ''}
              feature2Description={settings.feature_2_description || ''}
              feature2Icon={settings.feature_2_icon || 'Scissors'}
              feature3Title={settings.feature_3_title || ''}
              feature3Description={settings.feature_3_description || ''}
              feature3Icon={settings.feature_3_icon || 'Star'}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'services-info' && (
            <ServicesSectionEditor
              title={settings.services_section_title || ''}
              description={settings.services_section_description || ''}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'services-selection' && (
            <FeaturedServicesEditor
              selectedServiceIds={selectedServiceIds}
              onChange={handleServicesChange}
            />
          )}

          {activeTab === 'contact' && (
            <ContactSectionEditor
              title={settings.contact_section_title || ''}
              description={settings.contact_section_description || ''}
              address={settings.contact_address || ''}
              phone={settings.contact_phone || ''}
              email={settings.contact_email || ''}
              hoursWeekday={settings.hours_weekday || ''}
              hoursWeekend={settings.hours_weekend || ''}
              onChange={handleFieldChange}
            />
          )}

          {activeTab === 'colors' && (
            <ThemeColorsEditor
              primaryColor={settings.primary_color || '#FACC15'}
              secondaryColor={settings.secondary_color || '#111827'}
              accentColor={settings.accent_color || '#F59E0B'}
              pageBgColor={settings.page_bg_color || '#F9FAFB'}
              servicesSectionBgColor={settings.services_section_bg_color || '#F3F4F6'}
              contactSectionBgColor={settings.contact_section_bg_color || '#111827'}
              cardBgColor={settings.card_bg_color || '#FFFFFF'}
              textHeadingColor={settings.text_heading_color || '#111827'}
              textBodyColor={settings.text_body_color || '#4B5563'}
              onChange={handleFieldChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LayoutAdminPage;
