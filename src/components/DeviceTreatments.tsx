
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const deviceTreatments = [
  {
    title: "Termocuverta Treatment",
    image: "public/lovable-uploads/83a9bae4-ffae-4e2c-8896-f03c0f4070a5.png",
    benefits: [
      "Body detoxification",
      "Weight and centimeter loss",
      "Reduction of water retention",
      "Skin elasticity restoration",
      "Adipose tissue reduction",
      "Eliminates orange peel appearance",
      "Improves stretch marks",
      "Improves lymphatic system",
      "Improves skin appearance",
      "Dilates pores for maximum active principle permeability"
    ]
  },
  {
    title: "Volcanic Stone Therapy",
    image: "public/lovable-uploads/4425c182-0165-46c6-b526-0aa1c5085642.png",
    benefits: [
      "Body detoxification through toxin elimination",
      "Reduction or elimination of acute or chronic pain",
      "Accelerates cellular oxygen assimilation",
      "Improves kidney activity",
      "Hot stone application reduces tension",
      "Stores beneficial energy and transmits it through meridians"
    ]
  },
  {
    title: "40Khz Cavitation Body Remodeling",
    image: "public/lovable-uploads/16817603-5ec2-4bff-a5aa-9ac7174c302d.png", // Updated image
    benefits: [
      "Body remodeling through fat burning",
      "Lymphatic detoxification",
      "Body skin tightening",
      "Cellulite reduction"
    ]
  },
  {
    title: "Electrostimulation Treatment",
    image: "public/lovable-uploads/629509b2-80de-4919-a147-fb5c164c9984.png",
    benefits: [
      "Blood circulation acceleration",
      "Cellulite and orange peel appearance elimination",
      "Collagen and elastin increase",
      "Muscle toning",
      "Weight loss",
      "Increased strength and muscle mass",
      "Body remodeling and circumference reduction"
    ]
  },
  {
    title: "TECAR Radiofrequency",
    image: "public/lovable-uploads/67ac2584-7197-482d-8842-b3580622aaa2.png",
    benefits: [
      "Spectacular effects in body contouring",
      "Silhouette remodeling through fat reduction",
      "Treatment of all cellulite stages",
      "Stretch mark improvement",
      "Treatment of sagging skin",
      "High-frequency electromagnetic energy transfer",
      "Selective tissue hyperthermia for weight loss"
    ]
  }
];

const DeviceTreatments = () => {
  return (
    <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-[#63099c] mb-8">Device Treatments</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {deviceTreatments.map((treatment, index) => (
          <Card 
            key={treatment.title} 
            className={`hover:shadow-lg transition-shadow duration-300 ${
              index === deviceTreatments.length - 1 && deviceTreatments.length % 2 === 1 
                ? "md:col-span-2 md:max-w-2xl md:mx-auto" 
                : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="text-[#63099c]">{treatment.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={treatment.image} 
                  alt={treatment.title}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              <div className="md:w-2/3">
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {treatment.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DeviceTreatments;
