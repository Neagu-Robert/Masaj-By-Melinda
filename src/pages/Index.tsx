import React, { useEffect } from 'react';
import type { MetaFunction } from 'react-router';
import { useLocation } from 'react-router';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Footer from '../components/Footer';
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

export const meta: MetaFunction = () => {
  return [
    { title: "Masaj și Remodelare Corporală în Oradea | Masaj by Melinda" },
    { name: "description", content: "Bucură-te de servicii profesionale de masaj și remodelare corporală în Oradea. Programează online pentru o experiență de relaxare de neuitat." },
    { tagName: "link", rel: "canonical", href: "[DOMAIN_TBD]/" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "Masaj și Remodelare Corporală în Oradea | Masaj by Melinda" },
    { property: "og:description", content: "Bucură-te de servicii profesionale de masaj și remodelare corporală în Oradea. Programează online pentru o experiență de relaxare de neuitat." },
    { property: "og:url", content: "[DOMAIN_TBD]/" },
    { property: "og:image", content: "/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Masaj și Remodelare Corporală în Oradea | Masaj by Melinda" },
    { name: "twitter:description", content: "Bucură-te de servicii profesionale de masaj și remodelare corporală în Oradea. Programează online pentru o experiență de relaxare de neuitat." },
    { name: "twitter:image", content: "/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png" },
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BeautySalon",
        "name": "Masaj by Melinda",
        "telephone": "+40771761649",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "str. Aluminei",
          "addressLocality": "Oradea",
          "addressRegion": "Bihor",
          "addressCountry": "RO"
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "08:00",
            "closes": "20:00"
          },
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": "09:00",
            "closes": "14:00"
          }
        ],
        "hasMap": "https://www.google.com/maps/search/?api=1&query=str.+Aluminei,+Oradea",
        "image": "/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png",
        "url": "// TODO: [DOMAIN_TBD]",
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": "// TODO: [LAT_TBD]",
          "longitude": "// TODO: [LNG_TBD]"
        },
        "priceRange": "// TODO: [PRICE_RANGE_TBD]"
      }
    }
  ];
};

export default Index;
