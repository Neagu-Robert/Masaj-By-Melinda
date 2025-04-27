
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-semibold text-[#7E69AB]">Serenity Spa</div>
          <div className="space-x-6">
            <Button 
              variant="ghost" 
              className="text-[#7E69AB] hover:text-[#9b87f5]"
              onClick={() => navigate('/#services')}
            >
              Services
            </Button>
            <Button 
              variant="ghost" 
              className="text-[#7E69AB] hover:text-[#9b87f5]"
              onClick={() => navigate('/#pricing')}
            >
              Pricing
            </Button>
            <Button 
              variant="ghost" 
              className="text-[#7E69AB] hover:text-[#9b87f5]"
              onClick={() => navigate('/#contact')}
            >
              Contact
            </Button>
            <Button 
              className="bg-[#9b87f5] text-white hover:bg-[#7E69AB]"
              onClick={() => navigate('/book')}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
