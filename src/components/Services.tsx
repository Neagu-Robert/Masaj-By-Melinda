
import React from 'react';
import MassageServices from './MassageServices';
import DeviceTreatments from './DeviceTreatments';

const Services = () => {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-semibold text-center text-white mb-4 animate-fade-in">
          Serviciile noastre
        </h2>
        <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto opacity-0 animate-fade-in [animation-delay:0.2s] [animation-fill-mode:forwards]">
          Oferim o gamă completă de servicii de masaj și tratamente moderne pentru bunăstarea și frumusețea dumneavoastră
        </p>
        <div className="space-y-20">
          <div className="opacity-0 animate-fade-in [animation-delay:0.4s] [animation-fill-mode:forwards]">
            <MassageServices />
          </div>
          <div className="opacity-0 animate-fade-in [animation-delay:0.6s] [animation-fill-mode:forwards]">
            <DeviceTreatments />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
