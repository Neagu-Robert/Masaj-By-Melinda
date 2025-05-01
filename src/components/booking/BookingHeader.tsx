
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BookingHeader = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-semibold text-[#7E69AB]">Serenity Spa</div>
          <Button 
            onClick={() => navigate('/')}
            className="bg-[#9b87f5] text-white hover:bg-[#7E69AB]"
          >
            Back to pricing
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default BookingHeader;
