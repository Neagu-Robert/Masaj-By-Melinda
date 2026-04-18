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

const getMassageImage = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('relaxare')) return '/new_images/Masaj_de_relaxare.webp';
  if (lowerName.includes('anticelulitic')) return '/new_images/Masaj_anticelulitic.webp';
  if (lowerName.includes('bambus')) return '/new_images/Masaj_bete_bambus.webp';
  if (lowerName.includes('drenaj')) return '/new_images/Masaj_drenaj_limfatic.webp';
  if (lowerName.includes('facial')) return '/new_images/Masaj_facial.webp';
  if (lowerName.includes('pietre')) return '/new_images/Masaj_pietre_vulcanice.webp';
  if (lowerName.includes('terapeutic')) return '/new_images/Masaj_terapeutic.webp';
  return '/new_images/Masaj_de_relaxare.webp';
};

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[...Array(6)].map((_, index) => (
            <Card
              key={index}
              className="h-[320px] md:h-[400px] rounded-xl bg-[#1E1B24] border-none animate-pulse"
            />
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
    <div className="container mx-auto px-4" id="massage-services">
      <h3 className="text-2xl md:text-3xl font-semibold text-center text-[#F3EDF7] mb-8 md:mb-12">
        Masaje Terapeutice și de Relaxare
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {massageServices.map((service) => {
          const bgImage = getMassageImage(service.name);
          return (
            <Card
              key={service.id}
              className="group relative overflow-hidden rounded-xl border-none cursor-pointer bg-[#1E1B24] h-[350px] md:h-[400px] transition-shadow duration-500 transform-gpu will-change-transform md:hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]"
              onClick={() => setSelectedService(service)}
            >
              {/* Background Image with hover scale */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out transform-gpu will-change-transform md:group-hover:scale-105"
                style={{ backgroundImage: `url('${bgImage}')` }}
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,16,22,0.95)] via-[rgba(18,16,22,0.5)] to-[rgba(18,16,22,0.1)] transition-colors duration-500 md:group-hover:from-[rgba(18,16,22,0.85)] md:group-hover:via-[rgba(18,16,22,0.4)]" />

              {/* Content */}
              <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-end text-left">
                {/* Title */}
                <h4 className="text-xl md:text-2xl font-bold text-[#F3EDF7] transition-transform duration-500 ease-out transform-gpu will-change-transform md:translate-y-4 md:group-hover:translate-y-0">
                  {service.name}
                </h4>

                {/* Progressive Disclosure Section */}
                <div className="grid grid-rows-[1fr] md:grid-rows-[0fr] transition-[grid-template-rows,opacity,margin] duration-500 ease-out md:group-hover:grid-rows-[1fr] md:opacity-0 md:group-hover:opacity-100 mt-3 md:mt-0 md:group-hover:mt-3">
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-3 text-[#A59EAD] mb-4 text-sm md:text-base">
                      <span className="font-medium tracking-wide">
                        {service.duration} MIN
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A59EAD]/50"></span>
                      <span className="font-medium tracking-wide">
                        {service.price} RON
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        className="flex-1 bg-white/10 text-[#F3EDF7] hover:bg-white/20 border-0 h-11"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                        }}
                      >
                        Detalii
                      </Button>
                      <Button
                        className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/book?service=${encodeURIComponent(service.name)}`, { state: { service: service.name } });
                        }}
                      >
                        Rezervă
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Service detail modal */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent showCloseButton className="max-w-4xl p-0 overflow-hidden bg-[#1E1B24] border-gray-800/50 rounded-xl gap-0">
          <DialogTitle className="sr-only">{selectedService?.name}</DialogTitle>
          <DialogDescription className="sr-only">Detalii serviciu {selectedService?.name}</DialogDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left Image */}
            <div className="relative h-64 md:h-auto md:min-h-[400px]">
              {selectedService && (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${getMassageImage(selectedService.name)}')` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B24] to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Right Content */}
            <div className="p-6 md:p-8 lg:p-10 flex flex-col h-full bg-[#1E1B24]">
              <h2 className="text-2xl md:text-3xl font-bold text-[#F3EDF7] mb-4">
                {selectedService?.name}
              </h2>
              
              <div className="flex items-center gap-4 mb-6">
                <span className="text-2xl font-semibold text-[#7C3AED]">
                  {selectedService?.price} RON
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A59EAD]/50"></span>
                <span className="text-lg font-medium text-[#A59EAD]">
                  {selectedService?.duration} min
                </span>
              </div>

              <div className="prose prose-invert max-w-none mb-8 text-[#A59EAD] flex-grow">
                <p className="leading-relaxed">
                  {selectedService?.description}
                </p>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-12 text-lg font-medium"
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MassageServices;
