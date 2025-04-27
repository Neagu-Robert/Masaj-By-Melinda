
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

const massageServices = [
  {
    title: "Masaj de relaxare",
    description: "*Description*",
    duration: "",
    price: ""
  },
  {
    title: "Masaj terapeutic",
    description: "*Description*",
    duration: "",
    price: ""
  },
  {
    title: "Masaj de drenaj limfatic",
    description: "*Description*",
    duration: "",
    price: ""
  },
  {
    title: "Masaj anticelulitic",
    description: "*Description*",
    duration: "",
    price: ""
  },
  {
    title: "Masaj facial",
    description: "*Description*",
    duration: "",
    price: ""
  },
  {
    title: "Masaj cu pietre vulcanice",
    description: "*Description*",
    duration: "",
    price: ""
  },
  {
    title: "Masaj cu bete de bambus",
    description: "*Description*",
    duration: "",
    price: ""
  }
];

const MassageServices = () => {
  return (
    <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-[#63099c] mb-8">Massage Services</h3>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
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
