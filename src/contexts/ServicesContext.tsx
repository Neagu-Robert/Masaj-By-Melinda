import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';

export type Service = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

interface ServicesContextType {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  getServiceById: (id: number) => Service | undefined;
  getServiceByName: (name: string) => Service | undefined;
  getActiveServices: () => Service[];
}

const ServicesContext = createContext<ServicesContextType | undefined>(undefined);

export const ServicesProvider = ({ children }: { children: ReactNode }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        throw fetchError;
      }

      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const getServiceById = (id: number): Service | undefined => {
    return services.find(service => service.id === id);
  };

  const getServiceByName = (name: string): Service | undefined => {
    return services.find(service => service.name === name);
  };

  const getActiveServices = (): Service[] => {
    return services.filter(service => service.is_active);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const value: ServicesContextType = {
    services,
    loading,
    error,
    fetchServices,
    getServiceById,
    getServiceByName,
    getActiveServices
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServicesProvider');
  }
  return context;
}; 