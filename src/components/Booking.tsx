
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Booking = () => {
  const navigate = useNavigate();
  return (
    <div className="py-12 md:py-20 px-4">
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold text-center text-white mb-8 md:mb-12 leading-tight">
          Rezervă direct de pe site sau contactează-ne
        </h2>
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate('/book')} 
            className="bg-[#63099c] hover:bg-[#63099c]/90 text-white text-lg md:text-xl py-4 md:py-6 px-6 md:px-8 w-full max-w-sm md:w-auto h-12 md:h-auto"
          >
            Rezerva un masaj
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
