
import React from 'react';

const Hero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="container mx-auto text-center">
        <div className="max-w-2xl mx-auto bg-black/40 p-4 md:p-6 rounded-lg backdrop-blur-sm">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white leading-tight">
            Masaj de relaxare și remodelare
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-6 md:mb-8 leading-relaxed">
            Descoperiți un sanctuar de pace și bunăstare în care mâini experte aduc armonie corpului și minții.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
