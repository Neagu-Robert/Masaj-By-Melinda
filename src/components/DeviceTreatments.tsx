
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from './ui/card';
import { useServices } from '@/contexts/ServicesContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Device treatment images mapping
const deviceTreatmentImages = {
  'Tratament cu Termocuvertă': '/lovable-uploads/8799995d-a401-4d09-96d3-2e8cb400d2c0.png',
  'Remodelare Corporală cu Cavitație 40Khz': '/lovable-uploads/16817603-5ec2-4bff-a5aa-9ac7174c302d.png',
  'Tratament cu Electrostimulare': '/lovable-uploads/6edd442e-9894-4629-b380-e171365a1a6c.png',
  'Radiofrecvență TECAR': '/lovable-uploads/08b53e34-d1fb-4fab-bbda-087bc55f6d1e.png'
};

// Device treatment benefits mapping
const deviceTreatmentBenefits = {
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
    ? deviceTreatmentImages[selectedService.name as keyof typeof deviceTreatmentImages]
    : null;
  const selectedBenefits = selectedService
    ? deviceTreatmentBenefits[selectedService.name as keyof typeof deviceTreatmentBenefits] || []
    : [];

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-8">Tehnologie Modernă pentru Remodelare Corporală</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, index) => (
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
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-8">Tehnologie Modernă pentru Remodelare Corporală</h3>
        <div className="text-center text-red-400">
          Eroare la încărcarea serviciilor: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-8">Tehnologie Modernă pentru Remodelare Corporală</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {deviceServices.map((service, index) => (
          <Card
            key={service.id}
            className={`transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-400/20 py-3 md:py-4 px-4 md:px-6 bg-black/60 backdrop-blur-sm text-white border-none cursor-pointer ${
              index === deviceServices.length - 1 && deviceServices.length % 2 === 1
                ? "md:col-span-2 md:max-w-2xl md:mx-auto"
                : ""
            }`}
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
        <DialogContent showCloseButton className="max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-bold text-violet-300">
              {selectedService?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-400 sr-only">
              Detalii tratament {selectedService?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Price and duration */}
            <div className="flex items-center gap-4">
              <span className="text-2xl md:text-3xl font-semibold text-violet-400">
                {selectedService?.price} RON
              </span>
              <span className="text-base md:text-lg text-gray-400">
                {selectedService?.duration} min
              </span>
            </div>

            {/* Image */}
            {selectedImage && (
              <img
                src={selectedImage}
                alt={selectedService?.name}
                className="w-full aspect-video object-cover rounded-lg"
              />
            )}

            {/* Benefits */}
            {selectedBenefits.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">Beneficii</p>
                <ul className="list-disc list-inside space-y-1.5 text-gray-200">
                  {selectedBenefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
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

export default DeviceTreatments;
