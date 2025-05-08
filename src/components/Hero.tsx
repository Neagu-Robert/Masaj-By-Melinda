import React from 'react';
const Hero = () => {
  return <div className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{
    backgroundImage: "url('/lovable-uploads/18542ad9-d45c-4897-80b0-b833afd3b342.png')"
  }}>
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-[#63099c]">
            Masaj de relaxare si remodelare
          </h1>
          <p className="text-xl text-gray-200 mb-8">Descoperiți un sanctuar de pace și bunăstare în care mâinile experte aduc armonie corpului și minții.</p>
        </div>
      </div>
    </div>;
};
export default Hero;