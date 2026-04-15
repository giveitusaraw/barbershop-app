import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, Check, Users, AlertCircle, ArrowLeft } from 'lucide-react';
import { Service, Barber } from '../types';
import { db } from '../lib/database';
import ServiceCard from '../components/ServiceCard';
import MonthlyCalendar from '../components/MonthlyCalendar';

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  barberName: string;
  appointmentDate: string;
  appointmentTime: string;
}

const sendBookingEmail = async (data: BookingEmailData): Promise<void> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/send-booking-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }

  return response.json();
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface BookingPageProps {
  onNavigateHome?: () => void;
}

const BookingPage: React.FC<BookingPageProps> = ({ onNavigateHome }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'service' | 'barber' | 'date' | 'time' | 'details'>('service');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const filterBarbersByService = async () => {
      if (selectedService) {
        const barberIds = await db.getBarbersForService(selectedService.id);
        const availableBarbers = barbers.filter(b => barberIds.includes(b.id));
        setFilteredBarbers(availableBarbers);

        if (selectedBarber && !barberIds.includes(selectedBarber.id)) {
          setSelectedBarber(null);
        }
      } else {
        setFilteredBarbers([]);
      }
    };
    filterBarbersByService();
  }, [selectedService, barbers]);

  useEffect(() => {
    if (selectedDate && selectedService && selectedBarber) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSelectedTime('');
    }
  }, [selectedDate, selectedService, selectedBarber]);

  const loadInitialData = async () => {
    try {
      const [servicesData, barbersData] = await Promise.all([
        db.getServices(),
        db.getBarbers()
      ]);
      setServices(servicesData);
      setBarbers(barbersData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !selectedBarber) return;

    setLoadingSlots(true);
    try {
      const slots = await db.getAvailableSlots(selectedDate, selectedService.id, selectedBarber.id);
      setAvailableSlots(slots);
      setSelectedTime('');
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep('barber');
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setCurrentStep('date');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('details');
  };

  const goBack = () => {
    if (currentStep === 'barber') {
      setCurrentStep('service');
      setSelectedService(null);
      setSelectedBarber(null);
    } else if (currentStep === 'date') {
      setCurrentStep('barber');
      setSelectedBarber(null);
      setSelectedDate('');
      setLoadingSlots(false);
    } else if (currentStep === 'time') {
      setCurrentStep('date');
      setSelectedDate('');
      setSelectedTime('');
      setLoadingSlots(false);
    } else if (currentStep === 'details') {
      setCurrentStep('time');
      setSelectedTime('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const slotCheck = await db.isSlotAvailable(
        selectedDate,
        selectedTime,
        selectedService.id,
        selectedBarber.id
      );

      if (!slotCheck.available) {
        setBookingError(slotCheck.reason || 'Este horário já não está disponível');
        await loadAvailableSlots();
        setSelectedTime('');
        setIsSubmitting(false);
        return;
      }

      await db.createAppointment({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        service_id: selectedService.id,
        barber_id: selectedBarber.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
      });

      if (customerEmail) {
        await db.registerCustomerFromBooking(customerName, customerEmail, customerPhone);
      }

      if (customerEmail) {
        try {
          await sendBookingEmail({
            customerName,
            customerEmail,
            serviceName: selectedService.name,
            barberName: selectedBarber.name,
            appointmentDate: formatDate(selectedDate),
            appointmentTime: selectedTime,
          });
        } catch (emailError) {
          console.error('Error sending confirmation email:', emailError);
        }
      }

      setShowSuccess(true);
      resetForm();
    } catch (error) {
      console.error('Error creating appointment:', error);
      setBookingError('Erro ao criar reserva. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedDate('');
    setSelectedTime('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setAvailableSlots([]);
    setBookingError(null);
    setCurrentStep('service');
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const organizeSlotsByPeriod = () => {
    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    availableSlots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);

      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 18) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="text-gray-600">A carregar...</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Reserva Confirmada!</h2>
          <p className="text-gray-600 mb-6">
            A sua reserva foi confirmada com sucesso. Aguardamos por si no dia e hora marcados!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowSuccess(false)}
              className="font-bold py-2 px-6 rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              Nova Reserva
            </button>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="font-bold py-2 px-6 rounded-lg border-2 transition-colors duration-200 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                Página Inicial
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Fazer Reserva</h1>
          <p className="text-xl text-gray-600">
            Escolha o serviço, funcionário, data e horário
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Back Button */}
          {currentStep !== 'service' && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>
          )}

          {/* Service Selection */}
          {currentStep === 'service' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <div className="rounded-full p-2 mr-3" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-accent)' }}>1</span>
                </div>
                Escolha o Serviço
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service.id} onClick={() => handleServiceSelect(service)}>
                    <ServiceCard
                      service={service}
                      selected={selectedService?.id === service.id}
                      onSelect={() => {}}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barber Selection */}
          {currentStep === 'barber' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <div className="rounded-full p-2 mr-3" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-accent)' }}>2</span>
                </div>
                Escolha o funcionário
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBarbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg"
                    onClick={() => handleBarberSelect(barber)}
                  >
                    <div className="flex items-center mb-3">
                      <div className="rounded-full p-2 mr-3" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                        <Users className="h-5 w-5" style={{ color: 'var(--color-accent)' }} />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{barber.name}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">
                      <strong>Especialidades:</strong> {barber.specialties}
                    </p>
                    <p className="text-gray-600">
                      <strong>Experiência:</strong> {barber.experience}
                    </p>
                  </div>
                ))}
              </div>
              {filteredBarbers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum funcionário disponível para este serviço.</p>
                </div>
              )}
            </div>
          )}

          {/* Date Selection */}
          {currentStep === 'date' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <div className="rounded-full p-2 mr-3" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-accent)' }}>3</span>
                </div>
                Escolha a Data
              </h2>
              <MonthlyCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                minDate={getMinDate()}
              />
            </div>
          )}

          {/* Time Selection */}
          {currentStep === 'time' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <div className="rounded-full p-2 mr-3" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-accent)' }}>4</span>
                </div>
                Escolha o Horário
              </h2>
              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-primary)' }}></div>
                  <p className="text-gray-600">A carregar horários...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div>
                  {(() => {
                    const { morning, afternoon, evening } = organizeSlotsByPeriod();
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {morning.length > 0 && (
                          <div>
                            <h3 className="text-center text-sm font-medium text-gray-600 mb-3">Manhã</h3>
                            <div className="space-y-2">
                              {morning.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleTimeSelect(slot)}
                                  className="w-full py-3 px-4 rounded-full text-sm font-medium transition-all border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {afternoon.length > 0 && (
                          <div>
                            <h3 className="text-center text-sm font-medium text-gray-600 mb-3">Tarde</h3>
                            <div className="space-y-2">
                              {afternoon.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleTimeSelect(slot)}
                                  className="w-full py-3 px-4 rounded-full text-sm font-medium transition-all border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {evening.length > 0 && (
                          <div>
                            <h3 className="text-center text-sm font-medium text-gray-600 mb-3">Noite</h3>
                            <div className="space-y-2">
                              {evening.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleTimeSelect(slot)}
                                  className="w-full py-3 px-4 rounded-full text-sm font-medium transition-all border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Não há horários disponíveis para esta data.</p>
                </div>
              )}
            </div>
          )}

          {/* Booking Error Message */}
          {bookingError && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
              <div className="flex items-start mb-4">
                <AlertCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-900 font-bold text-lg mb-2">RESERVA NÃO CONFIRMADA</p>
                  <p className="text-red-800 font-semibold mb-2">{bookingError}</p>
                  <p className="text-red-700 mb-2">A sua reserva não foi efetuada. Por favor, escolha outro horário disponível na lista acima.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingError(null)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                OK, Entendi
              </button>
            </div>
          )}

          {/* Customer Information and Summary */}
          {currentStep === 'details' && selectedService && selectedBarber && selectedDate && selectedTime && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <div className="rounded-full p-2 mr-3" style={{ backgroundColor: 'var(--color-primary-lighter)' }}>
                    <span className="font-bold" style={{ color: 'var(--color-accent)' }}>5</span>
                  </div>
                  Dados de Contacto
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-2" />
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {customerName && customerPhone && customerEmail && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold mb-6">Resumo da Reserva</h2>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Serviço</p>
                        <p className="font-semibold">{selectedService.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Preço</p>
                        <p className="font-semibold">€{selectedService.price}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Funcionário</p>
                        <p className="font-semibold">{selectedBarber.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Duração</p>
                        <p className="font-semibold">{selectedService.duration} min</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Data</p>
                        <p className="font-semibold">{new Date(selectedDate).toLocaleDateString('pt-PT')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Horário</p>
                        <p className="font-semibold">{selectedTime}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full font-bold py-4 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-300"
                    style={!isSubmitting ? {
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-secondary)'
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                      }
                    }}
                  >
                    {isSubmitting ? 'A processar...' : 'Confirmar Reserva'}
                  </button>
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default BookingPage;