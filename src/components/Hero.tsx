
import React from 'react';
import { Button } from './ui/button';

const Hero = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E5DEFF] to-white flex items-center">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold text-[#7E69AB] mb-6">
            Experience Pure Relaxation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover a sanctuary of peace and wellness where expert hands bring harmony to body and mind.
          </p>
          <Button className="bg-[#9b87f5] text-white hover:bg-[#7E69AB] px-8 py-6 text-lg">
            Book Your Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;
