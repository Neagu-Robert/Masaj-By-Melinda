
import React from 'react';

const Hero = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center" 
      style={{
        backgroundImage: "url('/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png')"
      }}
    >
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto bg-black/40 p-6 rounded-lg backdrop-blur-sm">
          <h1 className="text-5xl font-bold mb-6 text-white">Masaj de relaxare și remodelare</h1>
          <p className="text-xl text-gray-100 mb-8">Descoperiți un sanctuar de pace și bunăstare în care mâini experte aduc armonie corpului și minții.</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
