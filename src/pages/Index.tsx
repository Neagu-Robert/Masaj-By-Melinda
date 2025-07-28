
import React, { useEffect } from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Footer from '../components/Footer';
import Booking from '../components/Booking';
import DashboardLayout from "./admin/DashboardLayout";
import AdminHome from "./admin/AdminHome";
import Bookings from "./admin/Bookings";
import Availabilities from "./admin/Availabilities";
import Analytics from "./admin/Analytics";
import Users from "./admin/Users";
import Settings from "./admin/AuditLogs";

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
    <div 
      className="min-h-screen bg-scroll md:bg-fixed bg-cover bg-center relative"
      style={{
        backgroundImage: "url('/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png')"
      }}
    >
      <Navbar />
      <Hero />
      <div className="relative z-10">
        <div id="services" className="bg-black/20 backdrop-blur-sm">
          <Services />
        </div>
        <div id="booking" className="bg-black/40 backdrop-blur-sm text-white">
          <Booking />
        </div>
        <div id="contact" className="bg-black/40 backdrop-blur-sm text-white">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Index;
