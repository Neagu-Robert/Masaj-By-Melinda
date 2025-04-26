
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const massageServices = [
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

const MassageServices = () => {
  return (
    <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-[#63099c] mb-8">Massage Services</h3>
      <div className="grid md:grid-cols-3 gap-8">
        {massageServices.map((service) => (
          <Card key={service.title} className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-[#63099c]">{service.title}</CardTitle>
              <CardDescription>{service.duration}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <p className="text-2xl font-semibold text-[#63099c]">{service.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MassageServices;
