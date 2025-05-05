
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, Calendar } from 'lucide-react';

const BookingHeader = () => {
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

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    if (path === '/pachete' && location.pathname === '/pachete') {
      return true;
    }
    if (path === '/book' && location.pathname === '/book') {
      return true;
    }
    return false;
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm fixed w-full z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-semibold text-[#7E69AB]">Masaj by Melinda</div>
          <div className="space-x-6">
            <Button 
              variant={isActive('/') ? "default" : "ghost"}
              className={isActive('/') 
                ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                : "text-[#7E69AB] hover:text-[#9b87f5]"}
              onClick={() => scrollToElement('services')}
            >
              <Home className="mr-1" /> Servicii
            </Button>
            <Button 
              variant={isActive('/pachete') ? "default" : "ghost"}
              className={isActive('/pachete') 
                ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                : "text-[#7E69AB] hover:text-[#9b87f5]"}
              onClick={() => navigate('/pachete')}
            >
              <Package className="mr-1" /> Pachete
            </Button>
            <Button 
              className={isActive('/book') 
                ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                : "bg-[#9b87f5] text-white hover:bg-[#7E69AB]"}
              onClick={() => navigate('/book')}
            >
              <Calendar className="mr-1" /> Rezerva acum
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BookingHeader;
