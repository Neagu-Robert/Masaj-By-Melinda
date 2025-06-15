
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, Package, Calendar, Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const scrollToElement = (elementId: string) => {
    setIsMobileMenuOpen(false);
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

  const handleNavigation = (path: string) => {
    setIsMobileMenuOpen(false);
    navigate(path);
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
    <nav className="bg-gray-900 fixed w-full z-50 shadow-lg border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div 
            className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500 cursor-pointer"
            onClick={handleLogoClick}
          >
            Masaj by Melinda
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <Button 
              variant={isActive('/') ? "default" : "ghost"}
              className={isActive('/') 
                ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                : "text-gray-300 hover:text-white hover:bg-white/10"}
              onClick={() => scrollToElement('services')}
            >
              <Home className="mr-1" /> Servicii
            </Button>
            <Button 
              variant={isActive('/pachete') ? "default" : "ghost"}
              className={isActive('/pachete') 
                ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                : "text-gray-300 hover:text-white hover:bg-white/10"}
              onClick={() => handleNavigation('/pachete')}
            >
              <Package className="mr-1" /> Pachete
            </Button>
            <Button 
              className={isActive('/book') 
                ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                : "bg-[#9b87f5] text-white hover:bg-[#7E69AB]"}
              onClick={() => handleNavigation('/book')}
            >
              <Calendar className="mr-1" /> Rezerva acum
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-300 hover:text-white hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700">
            <div className="flex flex-col space-y-2 pt-4">
              <Button 
                variant={isActive('/') ? "default" : "ghost"}
                className={`w-full justify-start h-12 ${isActive('/') 
                  ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                  : "text-gray-300 hover:text-white hover:bg-white/10"}`}
                onClick={() => scrollToElement('services')}
              >
                <Home className="mr-2 h-5 w-5" /> Servicii
              </Button>
              <Button 
                variant={isActive('/pachete') ? "default" : "ghost"}
                className={`w-full justify-start h-12 ${isActive('/pachete') 
                  ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                  : "text-gray-300 hover:text-white hover:bg-white/10"}`}
                onClick={() => handleNavigation('/pachete')}
              >
                <Package className="mr-2 h-5 w-5" /> Pachete
              </Button>
              <Button 
                className={`w-full justify-start h-12 ${isActive('/book') 
                  ? "bg-[#7E69AB] text-white hover:bg-[#9b87f5]" 
                  : "bg-[#9b87f5] text-white hover:bg-[#7E69AB]"}`}
                onClick={() => handleNavigation('/book')}
              >
                <Calendar className="mr-2 h-5 w-5" /> Rezerva acum
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
