
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const services = [
  {
    title: "Swedish Massage",
    description: "A gentle, relaxing massage that uses long strokes to ease tension.",
    duration: "60 min",
    price: "$85"
  },
  {
    title: "Deep Tissue Massage",
    description: "Targets deep muscle layers to release chronic muscle tension.",
    duration: "60 min",
    price: "$95"
  },
  {
    title: "Hot Stone Massage",
    description: "Heated stones and gentle pressure create deep relaxation.",
    duration: "90 min",
    price: "$120"
  }
];

const Services = () => {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center text-[#7E69AB] mb-12">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-[#7E69AB]">{service.title}</CardTitle>
                <CardDescription>{service.duration}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <p className="text-2xl font-semibold text-[#9b87f5]">{service.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
