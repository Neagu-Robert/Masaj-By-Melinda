
import React from 'react';
import MassageServices from './MassageServices';
import DeviceTreatments from './DeviceTreatments';

const Services = () => {
  return (
    <div className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-br from-violet-400 to-pink-500">
          Serviciile noastre
        </h2>
        <div className="space-y-16">
          <MassageServices />
          <DeviceTreatments />
        </div>
      </div>
    </div>
  );
};

export default Services;
