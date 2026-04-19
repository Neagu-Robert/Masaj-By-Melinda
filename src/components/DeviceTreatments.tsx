import React, { useState } from 'react';
import { Card } from './ui/card';
import { useServices } from '@/contexts/ServicesContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Device treatment images mapping
const deviceTreatmentImages: Record<string, string> = {
  'Tratament cu Termocuvertă': '/new_images/Tratament_cu_Termocuvertă.webp',
  'Remodelare Corporală cu Cavitație 40Khz': '/new_images/Cavitatie40kHz.webp',
  'Tratament cu Electrostimulare': '/new_images/Tratament_cu_electrostimulare.webp',
  'Radiofrecvență TECAR': '/new_images/Radiofrecventa_TECAR.webp'
};

const defaultDeviceImage = '/new_images/Masaj_de_relaxare.webp';

// Device treatment benefits mapping
const deviceTreatmentBenefits: Record<string, string[]> = {
  'Tratament cu Termocuvertă': [
    "Detoxifierea corpului", "Pierdere în greutate și centimetri", "Reducerea retenției de apă",
    "Restabilirea elasticității pielii", "Reducerea țesutului adipos", "Elimină aspectul de coajă de portocală",
    "Îmbunătățește vergeturile", "Îmbunătățește sistemul limfatic", "Îmbunătățește aspectul pielii",
    "Dilată porii pentru permeabilitate maximă a principiilor active"
  ],
  'Remodelare Corporală cu Cavitație 40Khz': [
    "Remodelarea corpului prin arderea grăsimilor", "Detoxifierea limfatică",
    "Tonifierea pielii corpului", "Reducerea celulitei"
  ],
  'Tratament cu Electrostimulare': [
    "Accelerarea circulației sanguine", "Eliminarea celulitei și a aspectului de coajă de portocală",
    "Creșterea colagenului și elastinei", "Tonifierea musculară", "Pierdere în greutate",
    "Creșterea forței și a masei musculare", "Remodelarea corpului și reducerea circumferinței"
  ],
  'Radiofrecvență TECAR': [
    "Efecte spectaculoase în conturarea corpului", "Remodelarea siluetei prin reducerea grăsimii",
    "Tratamentul tuturor stadiilor de celulită", "Îmbunătățirea vergeturilor",
    "Tratamentul pielii lăsate", "Transfer de energie electromagnetică de înaltă frecvență",
    "Hipertermie selectivă a țesuturilor pentru pierderea în greutate"
  ]
};

const DeviceTreatments = () => {
  const { services, loading, error } = useServices();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<typeof services[number] | null>(null);

  // Filter for device treatments (services that don't contain "Masaj" in the name)
  const deviceServices = services.filter(service =>
    !service.name.toLowerCase().includes('masaj') && service.is_active
  );

  // Get image and benefits for the selected service
  const selectedImage = selectedService
    ? (deviceTreatmentImages[selectedService.name] || defaultDeviceImage)
    : null;
  const selectedBenefits = selectedService
    ? deviceTreatmentBenefits[selectedService.name] || []
    : [];

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-8">Tehnologie Modernă pentru Remodelare Corporală</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[...Array(4)].map((_, index) => (
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
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-8">Tehnologie Modernă pentru Remodelare Corporală</h3>
        <div className="text-center text-red-400">
          Eroare la încărcarea serviciilor: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4" id="device-treatments">
      <h3 className="text-2xl md:text-3xl font-semibold text-center text-[#F3EDF7] mb-8 md:mb-12">
        Tehnologie Modernă pentru Remodelare Corporală
      </h3>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {deviceServices.map((service) => {
          const bgImage = deviceTreatmentImages[service.name] || defaultDeviceImage;
          return (
            <Card
              key={service.id}
              className="group relative overflow-hidden rounded-xl border-none cursor-pointer bg-[#1E1B24] h-[350px] md:h-[400px] w-full md:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.4rem)] transition-shadow duration-500 transform-gpu will-change-transform md:hover:shadow-[0_0_20px_rgba(124,58,237,0.2)]"
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
        <DialogContent showCloseButton className="max-w-6xl p-0 overflow-hidden bg-[#1E1B24] border-gray-800/50 rounded-xl gap-0">
          <DialogTitle className="sr-only">{selectedService?.name}</DialogTitle>
          <DialogDescription className="sr-only">Detalii tratament {selectedService?.name}</DialogDescription>
          
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] max-h-[90vh] overflow-y-auto md:overflow-y-visible">
            {/* Left Image */}
            <div className="relative h-64 md:h-auto md:min-h-[500px]">
              {selectedImage && (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${selectedImage}')` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B24] via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            {/* Right Content */}
            <div className="p-6 md:p-8 lg:p-10 flex flex-col h-full bg-[#1E1B24] relative">
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

              <div className="flex-grow space-y-6">
                {selectedBenefits.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#7C3AED] uppercase tracking-wider mb-3">
                      Beneficii
                    </h4>
                    <ul className="space-y-2">
                      {selectedBenefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[#F3EDF7]">
                          <span className="text-[#7C3AED] mt-1 shrink-0">•</span>
                          <span className="leading-snug">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-8 mt-auto sticky bottom-0 bg-[#1E1B24] pb-2 md:pb-0">
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

export default DeviceTreatments;
