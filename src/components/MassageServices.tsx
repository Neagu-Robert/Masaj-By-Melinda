
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useServices } from "@/contexts/ServicesContext";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';

const MassageServices = () => {
  const { services, loading, error } = useServices();
  const navigate = useNavigate();

  // Filter for massage services (services that contain "Masaj" in the name)
  const massageServices = services.filter(service => 
    service.name.toLowerCase().includes('masaj') && service.is_active
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-6 md:mb-8">
          Masaje
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {[...Array(7)].map((_, index) => (
            <Card
              key={index}
              className="transition-all duration-300 p-4 md:p-6 bg-black/60 backdrop-blur-sm text-white border-none animate-pulse"
            >
              <CardHeader className="pb-3 md:pb-4">
                <div className="h-6 md:h-8 bg-gray-600 rounded mb-2"></div>
                <div className="h-3 md:h-4 bg-gray-600 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 md:h-4 bg-gray-600 rounded mb-3 md:mb-4"></div>
                <div className="h-5 md:h-6 bg-gray-600 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-6 md:mb-8">
          Masaje
        </h3>
        <div className="text-center text-red-400">
          Eroare la încărcarea serviciilor: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h3 className="text-xl md:text-2xl font-semibold text-center text-white mb-6 md:mb-8">
        Masaje
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 [&>*:last-child:nth-child(2n+1)]:md:col-span-2 [&>*:last-child:nth-child(2n+1)]:md:mx-auto [&>*:last-child:nth-child(2n+1)]:md:max-w-2xl">
        {massageServices.map((service) => (
          <Card
            key={service.id}
            className="transition-all duration-300 hover:scale-[1.02] md:hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-400/20 p-4 md:p-6 bg-black/60 backdrop-blur-sm text-white border-none"
          >
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-violet-400 text-lg md:text-2xl">
                {service.name}
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-gray-300">
                {service.duration} min
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200 mb-3 md:mb-4 text-base md:text-lg leading-relaxed">
                {service.description}
              </p>
              <p className="text-2xl md:text-3xl font-semibold text-violet-400">
                {service.price} RON
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  // Qwiet SAST warning-sink-redirect: false positive — React Router client-side SPA routing; path is the internal '/book' route with a URL-encoded service name sourced from the ServicesContext/DB, not an arbitrary external URL.
                  onClick={() => navigate(`/book?service=${encodeURIComponent(service.name)}`, { state: { service: service.name } })}
                >
                  Rezervă acum
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MassageServices;
