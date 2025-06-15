
import React from 'react';
import MassageServices from './MassageServices';
import DeviceTreatments from './DeviceTreatments';

const Services = () => {
  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-white mb-12">Serviciile noastre</h2>
        <div className="space-y-16">
          <MassageServices />
          <DeviceTreatments />
        </div>
      </div>
    </div>
  );
};

export default Services;
