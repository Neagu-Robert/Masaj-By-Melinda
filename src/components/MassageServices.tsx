
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useServices } from "@/contexts/ServicesContext";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const MassageServices = () => {
  const { services, loading, error } = useServices();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<typeof services[number] | null>(null);

  // Filter for massage services (services that contain "Masaj" in the name)
  const massageServices = services.filter(service =>
    service.name.toLowerCase().includes('masaj') && service.is_active
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-6 md:mb-8">
          Masaje Terapeutice și de Relaxare
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {[...Array(7)].map((_, index) => (
            <Card
              key={index}
              className="transition-all duration-300 py-3 md:py-4 px-4 md:px-6 bg-black/60 backdrop-blur-sm text-white border-none animate-pulse"
            >
              <CardHeader className="p-0 flex items-center justify-center">
                <div className="h-6 md:h-8 bg-gray-600 rounded w-3/4"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-6 md:mb-8">
          Masaje Terapeutice și de Relaxare
        </h3>
        <div className="text-center text-red-400">
          Eroare la încărcarea serviciilor: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-6 md:mb-8">
        Masaje Terapeutice și de Relaxare
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 [&>*:last-child:nth-child(2n+1)]:md:col-span-2 [&>*:last-child:nth-child(2n+1)]:md:mx-auto [&>*:last-child:nth-child(2n+1)]:md:max-w-2xl">
        {massageServices.map((service) => (
          <Card
            key={service.id}
            className="transition-all duration-300 hover:scale-[1.02] md:hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-400/20 py-3 md:py-4 px-4 md:px-6 bg-black/60 backdrop-blur-sm text-white border-none cursor-pointer"
            onClick={() => setSelectedService(service)}
          >
            <CardHeader className="p-0 flex items-center justify-center">
              <CardTitle className="text-violet-400 text-xl md:text-2xl text-center">
                {service.name}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Service detail modal */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent showCloseButton className="max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-bold text-violet-300">
              {selectedService?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400 sr-only">
              Detalii serviciu {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <span className="text-2xl md:text-3xl font-semibold text-violet-400">
                {selectedService?.price} RON
              </span>
              <span className="text-base md:text-lg text-gray-400">
                {selectedService?.duration} min
              </span>
            </div>

            <p className="text-gray-200 text-base md:text-lg leading-relaxed">
              {selectedService?.description}
            </p>

            <div className="flex justify-start pt-2">
              <Button
                className="bg-violet-600 hover:bg-violet-700 text-white"
                // Qwiet SAST warning-sink-redirect: false positive — React Router client-side SPA routing; path is the internal '/book' route with a URL-encoded service name sourced from the ServicesContext/DB, not an arbitrary external URL.
                onClick={() => {
                  if (selectedService) {
                    navigate(`/book?service=${encodeURIComponent(selectedService.name)}`, { state: { service: selectedService.name } });
                  }
                }}
              >
                Rezervă acum
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MassageServices;
