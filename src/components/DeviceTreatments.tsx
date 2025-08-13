
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useServices } from '@/contexts/ServicesContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

  // Filter for device treatments (services that don't contain "Masaj" in the name)
  const deviceServices = services.filter(service => 
    !service.name.toLowerCase().includes('masaj') && service.is_active
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-semibold text-center text-white mb-8">Tratamente cu dispozitive</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {[...Array(4)].map((_, index) => (
            <Card 
              key={index} 
              className="transition-all duration-300 bg-black/60 backdrop-blur-sm text-white border-none animate-pulse"
            >
              <CardHeader>
                <div className="h-6 bg-gray-600 rounded"></div>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="w-full h-32 bg-gray-600 rounded-lg"></div>
                </div>
                <div className="md:w-2/3">
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-600 rounded"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-semibold text-center text-white mb-8">Tratamente cu dispozitive</h3>
        <div className="text-center text-red-400">
          Eroare la încărcarea serviciilor: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-white mb-8">Tratamente cu dispozitive</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {deviceServices.map((service, index) => {
          const image = deviceTreatmentImages[service.name as keyof typeof deviceTreatmentImages];
          const benefits = deviceTreatmentBenefits[service.name as keyof typeof deviceTreatmentBenefits] || [];
          
          return (
            <Card 
              key={service.id} 
              className={`transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-400/20 bg-black/60 backdrop-blur-sm text-white border-none ${
                index === deviceServices.length - 1 && deviceServices.length % 2 === 1 
                  ? "md:col-span-2 md:max-w-2xl md:mx-auto" 
                  : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="text-violet-400">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  {image && (
                    <img src={image} alt={service.name} className="w-full h-auto rounded-lg" />
                  )}
                </div>
                <div className="md:w-2/3">
                  <ul className="list-disc list-inside space-y-2 text-gray-200">
                    {benefits.map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <p className="text-lg text-gray-300">
                      <strong>Durată:</strong> {service.duration} min
                    </p>
                    <p className="text-2xl font-semibold text-violet-400">
                      {service.price} RON
                    </p>
                    <div className="mt-3 flex justify-end">
                      <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                        onClick={() => navigate(`/book?service=${encodeURIComponent(service.name)}`, { state: { service: service.name } })}
                      >
                        Rezervă acum
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DeviceTreatments;
