
import React from 'react';

const Hero = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="container mx-auto text-center">
        <div className="max-w-2xl mx-auto bg-black/40 p-4 md:p-6 rounded-lg backdrop-blur-sm animate-fade-in">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-white leading-tight animate-scale-in">
            Masaj de relaxare și remodelare
          </h1>
          <p className="text-lg md:text-xl text-gray-100 mb-6 md:mb-8 leading-relaxed opacity-0 animate-fade-in [animation-delay:0.3s] [animation-fill-mode:forwards]">
            Descoperiți un sanctuar de pace și bunăstare în care mâini experte aduc armonie corpului și minții.
          </p>
          <div className="opacity-0 animate-fade-in [animation-delay:0.6s] [animation-fill-mode:forwards]">
            <a
              href="#services"
              className="inline-block bg-[#63099c] hover:bg-[#7E69AB] text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Descoperiți serviciile
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
