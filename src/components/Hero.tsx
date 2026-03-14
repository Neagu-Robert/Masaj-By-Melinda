
import React from 'react';

const Hero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="container mx-auto text-center">
        <div className="max-w-3xl mx-auto bg-black/50 p-6 md:p-8 rounded-xl backdrop-blur-md">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 md:mb-6 text-white leading-tight animate-fade-in opacity-0 [animation-delay:200ms]">
            Masaj și Remodelare Corporală Profesională în Oradea
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-6 md:mb-8 leading-relaxed animate-fade-in opacity-0 [animation-delay:500ms]">
            Descoperiți un sanctuar de pace și bunăstare în Oradea — mâini experte pentru armonia corpului și minții.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
