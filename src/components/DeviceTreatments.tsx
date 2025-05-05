
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const deviceTreatments = [{
  title: "Tratament cu Termocuvertă",
  image: "public/lovable-uploads/8799995d-a401-4d09-96d3-2e8cb400d2c0.png",
  benefits: ["Detoxifierea corpului", "Pierdere în greutate și centimetri", "Reducerea retenției de apă", "Restabilirea elasticității pielii", "Reducerea țesutului adipos", "Elimină aspectul de coajă de portocală", "Îmbunătățește vergeturile", "Îmbunătățește sistemul limfatic", "Îmbunătățește aspectul pielii", "Dilată porii pentru permeabilitate maximă a principiilor active"]
}, {
  title: "Terapie cu Pietre Vulcanice",
  image: "public/lovable-uploads/4425c182-0165-46c6-b526-0aa1c5085642.png",
  benefits: ["Detoxifierea corpului prin eliminarea toxinelor", "Reducerea sau eliminarea durerii acute sau cronice", "Accelerează asimilarea oxigenului celular", "Îmbunătățește activitatea renală", "Aplicarea pietrelor calde reduce tensiunea", "Stochează energia benefică și o transmite prin meridiane"]
}, {
  title: "Remodelare Corporală cu Cavitație 40Khz",
  image: "public/lovable-uploads/16817603-5ec2-4bff-a5aa-9ac7174c302d.png",
  benefits: ["Remodelarea corpului prin arderea grăsimilor", "Detoxifierea limfatică", "Tonifierea pielii corpului", "Reducerea celulitei"]
}, {
  title: "Tratament cu Electrostimulare",
  image: "public/lovable-uploads/629509b2-80de-4919-a147-fb5c164c9984.png",
  benefits: ["Accelerarea circulației sanguine", "Eliminarea celulitei și a aspectului de coajă de portocală", "Creșterea colagenului și elastinei", "Tonifierea musculară", "Pierdere în greutate", "Creșterea forței și a masei musculare", "Remodelarea corpului și reducerea circumferinței"]
}, {
  title: "Radiofrecvență TECAR",
  image: "public/lovable-uploads/67ac2584-7197-482d-8842-b3580622aaa2.png",
  benefits: ["Efecte spectaculoase în conturarea corpului", "Remodelarea siluetei prin reducerea grăsimii", "Tratamentul tuturor stadiilor de celulită", "Îmbunătățirea vergeturilor", "Tratamentul pielii lăsate", "Transfer de energie electromagnetică de înaltă frecvență", "Hipertermie selectivă a țesuturilor pentru pierderea în greutate"]
}];

const DeviceTreatments = () => {
  return <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-[#63099c] mb-8">Tratamente cu dispozitive</h3>
      <div className="grid md:grid-cols-2 gap-8">
        {deviceTreatments.map((treatment, index) => <Card key={treatment.title} className={`hover:shadow-lg transition-shadow duration-300 ${index === deviceTreatments.length - 1 && deviceTreatments.length % 2 === 1 ? "md:col-span-2 md:max-w-2xl md:mx-auto" : ""}`}>
            <CardHeader>
              <CardTitle className="text-[#63099c]">{treatment.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img src={treatment.image} alt={treatment.title} className="w-full h-auto rounded-lg" />
              </div>
              <div className="md:w-2/3">
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {treatment.benefits.map((benefit, index) => <li key={index}>{benefit}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};

export default DeviceTreatments;
