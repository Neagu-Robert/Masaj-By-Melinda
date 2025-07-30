
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useServices } from "@/contexts/ServicesContext";

const MassageServices = () => {
  const { services, loading, error } = useServices();

  // Filter for massage services (services that contain "Masaj" in the name)
  const massageServices = services.filter(service => 
    service.name.toLowerCase().includes('masaj') && service.is_active
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <h3 className="text-2xl font-semibold text-center text-white mb-8">
          Masaje
        </h3>
        <div className="grid md:grid-cols-2 gap-8">
          {[...Array(7)].map((_, index) => (
            <Card
              key={index}
              className="transition-all duration-300 p-4 bg-black/60 backdrop-blur-sm text-white border-none animate-pulse"
            >
              <CardHeader>
                <div className="h-8 bg-gray-600 rounded mb-2"></div>
                <div className="h-4 bg-gray-600 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-600 rounded mb-4"></div>
                <div className="h-6 bg-gray-600 rounded"></div>
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
        <h3 className="text-2xl font-semibold text-center text-white mb-8">
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
      <h3 className="text-2xl font-semibold text-center text-white mb-8">
        Masaje
      </h3>
      <div className="grid md:grid-cols-2 gap-8 [&>*:last-child:nth-child(2n+1)]:col-span-2 [&>*:last-child:nth-child(2n+1)]:mx-auto [&>*:last-child:nth-child(2n+1)]:max-w-2xl">
        {massageServices.map((service) => (
          <Card
            key={service.id}
            className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-400/20 p-4 bg-black/60 backdrop-blur-sm text-white border-none"
          >
            <CardHeader>
              <CardTitle className="text-violet-400 text-2xl">
                {service.name}
              </CardTitle>
              <CardDescription className="text-lg text-gray-300">
                {service.duration} min
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200 mb-4 text-lg">
                {service.description}
              </p>
              <p className="text-3xl font-semibold text-violet-400">
                {service.price} RON
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MassageServices;
