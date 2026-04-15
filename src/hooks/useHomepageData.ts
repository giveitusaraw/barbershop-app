import { useState, useEffect } from 'react';
import { db, HomepageSettings, FeaturedService } from '../lib/database';

interface HomepageData {
  settings: HomepageSettings | null;
  featuredServices: FeaturedService[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DEFAULT_SETTINGS: HomepageSettings = {
  id: '',
  hero_title: 'Barber',
  hero_subtitle: '',
  hero_description: 'Onde o estilo encontra a perfeição. Mais de 15 anos criando looks únicos e atemporais.',
  hero_button_text: 'Reservar Agora',
  why_choose_title: 'Por que escolher a Barber?',
  why_choose_description: 'Combinamos tradição e modernidade para oferecer a melhor experiência em cuidados masculinos.',
  feature_1_title: 'Profissionais Experientes',
  feature_1_description: 'Equipe altamente qualificada com mais de 15 anos de experiência em cortes clássicos e modernos.',
  feature_2_title: 'Equipamentos Premium',
  feature_2_description: 'Utilizamos apenas os melhores equipamentos e produtos para garantir resultados excepcionais.',
  feature_3_title: 'Atendimento 5 Estrelas',
  feature_3_description: 'Ambiente acolhedor e atendimento personalizado para uma experiência única e memorável.',
  services_section_title: 'Nossos Serviços',
  services_section_description: 'Serviços profissionais para o homem moderno',
  contact_section_title: 'Visite-nos',
  contact_section_description: 'Localização conveniente e horários flexíveis',
  contact_address: 'Rua da Barbearia, 123\n1000-001 Lisboa',
  contact_phone: '+351 210 123 456',
  contact_email: 'info@barber.pt',
  hours_weekday: 'Segunda a Sábado: 9h - 19h',
  hours_weekend: 'Domingo: Fechado',
  primary_color: '#FACC15',
  secondary_color: '#111827',
  accent_color: '#F59E0B',
};

export function useHomepageData(): HomepageData {
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [settingsData, servicesData] = await Promise.all([
        db.getHomepageSettings(),
        db.getFeaturedServices()
      ]);

      setSettings(settingsData || DEFAULT_SETTINGS);
      setFeaturedServices(servicesData);
    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setError('Erro ao carregar dados da homepage');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    settings,
    featuredServices,
    loading,
    error,
    refetch: fetchData
  };
}
