
import React from 'react';

const Hero = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center" 
      style={{ 
        backgroundImage: "url('/lovable-uploads/c0a0b822-c972-465c-9713-59c92e713fe7.png')" 
      }}
    >
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">
            Masaj de relaxare si remodelare
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            Discover a sanctuary of peace and wellness where expert hands bring harmony to body and mind.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
