
import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const Booking = () => {
  const navigate = useNavigate();

  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-[#63099c] mb-12">Book Your Session</h2>
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate('/book')}
            className="bg-[#63099c] hover:bg-[#63099c]/90 text-white text-xl py-6 px-8"
          >
            Rezerva un masaj
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Booking;
