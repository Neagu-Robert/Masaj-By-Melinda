import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
const massageServices = [{
  title: "Masaj de relaxare",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}, {
  title: "Masaj terapeutic",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}, {
  title: "Masaj de drenaj limfatic",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}, {
  title: "Masaj anticelulitic",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}, {
  title: "Masaj facial",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}, {
  title: "Masaj cu pietre vulcanice",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}, {
  title: "Masaj cu bete de bambus",
  description: "*Description*",
  duration: "60 min",
  price: "140 RON"
}];
const MassageServices = () => {
  return <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-[#63099c] mb-8">Masaje</h3>
      <div className="grid md:grid-cols-2 gap-8 [&>*:last-child:nth-child(2n+1)]:col-span-2 [&>*:last-child:nth-child(2n+1)]:mx-auto [&>*:last-child:nth-child(2n+1)]:max-w-2xl">
        {massageServices.map(service => <Card key={service.title} className="hover:shadow-lg transition-shadow duration-300 p-4">
            <CardHeader>
              <CardTitle className="text-[#63099c] text-2xl">{service.title}</CardTitle>
              <CardDescription className="text-lg">{service.duration}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 text-lg">{service.description}</p>
              <p className="text-3xl font-semibold text-[#63099c]">{service.price}</p>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};
export default MassageServices;