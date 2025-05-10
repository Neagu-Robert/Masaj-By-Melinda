
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Contact from '../components/Contact';
import Booking from '../components/Booking';

const Index = () => {
  const location = useLocation();

  // Handle scrolling when directed from other pages
  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.state]);

  console.log("Index page rendering");

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <div id="services">
        <Services />
      </div>
      <div id="booking">
        <Booking />
      </div>
      <div id="contact">
        <Contact />
      </div>
    </div>
  );
};

export default Index;
