
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToElement = (elementId: string) => {
    // Navigate to homepage first if not already there
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: elementId } });
      return;
    }
    
    // If already on homepage, scroll to the element
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-semibold text-[#7E69AB]">Serenity Spa</div>
          <div className="space-x-6">
            <Button 
              variant="ghost" 
              className="text-[#7E69AB] hover:text-[#9b87f5]"
              onClick={() => scrollToElement('services')}
            >
              Services
            </Button>
            <Button 
              variant="ghost" 
              className="text-[#7E69AB] hover:text-[#9b87f5]"
              onClick={() => scrollToElement('pricing')}
            >
              Pricing
            </Button>
            <Button 
              variant="ghost" 
              className="text-[#7E69AB] hover:text-[#9b87f5]"
              onClick={() => scrollToElement('contact')}
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
