
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const deviceTreatments = [{
  title: "Tratament cu Termocuvertă",
  image: "public/lovable-uploads/8799995d-a401-4d09-96d3-2e8cb400d2c0.png",
  benefits: ["Detoxifierea corpului", "Pierdere în greutate și centimetri", "Reducerea retenției de apă", "Restabilirea elasticității pielii", "Reducerea țesutului adipos", "Elimină aspectul de coajă de portocală", "Îmbunătățește vergeturile", "Îmbunătățește sistemul limfatic", "Îmbunătățește aspectul pielii", "Dilată porii pentru permeabilitate maximă a principiilor active"]
}, {
  title: "Remodelare Corporală cu Cavitație 40Khz",
  image: "public/lovable-uploads/16817603-5ec2-4bff-a5aa-9ac7174c302d.png",
  benefits: ["Remodelarea corpului prin arderea grăsimilor", "Detoxifierea limfatică", "Tonifierea pielii corpului", "Reducerea celulitei"]
}, {
  title: "Tratament cu Electrostimulare",
  image: "public/lovable-uploads/6edd442e-9894-4629-b380-e171365a1a6c.png",
  benefits: ["Accelerarea circulației sanguine", "Eliminarea celulitei și a aspectului de coajă de portocală", "Creșterea colagenului și elastinei", "Tonifierea musculară", "Pierdere în greutate", "Creșterea forței și a masei musculare", "Remodelarea corpului și reducerea circumferinței"]
}, {
  title: "Radiofrecvență TECAR",
  image: "public/lovable-uploads/08b53e34-d1fb-4fab-bbda-087bc55f6d1e.png",
  benefits: ["Efecte spectaculoase în conturarea corpului", "Remodelarea siluetei prin reducerea grăsimii", "Tratamentul tuturor stadiilor de celulită", "Îmbunătățirea vergeturilor", "Tratamentul pielii lăsate", "Transfer de energie electromagnetică de înaltă frecvență", "Hipertermie selectivă a țesuturilor pentru pierderea în greutate"]
}];

const DeviceTreatments = () => {
  return (
    <div className="container mx-auto px-4">
      <h3 className="text-2xl md:text-3xl font-semibold text-center text-white mb-8 relative">
        <span className="relative z-10">Tratamente cu dispozitive</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#63099c]/20 to-transparent h-0.5 top-1/2 transform -translate-y-1/2"></div>
      </h3>
      <div className="grid md:grid-cols-2 gap-8">
        {deviceTreatments.map((treatment, index) => (
          <Card 
            key={treatment.title} 
            className={`hover:shadow-xl transition-all duration-500 bg-black/60 backdrop-blur-sm text-white border-none transform hover:scale-105 hover:bg-black/70 group animate-fade-in ${
              index === deviceTreatments.length - 1 && deviceTreatments.length % 2 === 1 
                ? "md:col-span-2 md:max-w-4xl md:mx-auto" 
                : ""
            }`}
            style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'forwards', opacity: 0 }}
          >
            <CardHeader className="relative overflow-hidden">
              <CardTitle className="text-[#63099c] group-hover:text-[#7E69AB] transition-colors duration-300 text-xl md:text-2xl">
                {treatment.title}
              </CardTitle>
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#63099c]/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <div className="relative overflow-hidden rounded-lg group-hover:shadow-lg transition-shadow duration-300">
                  <img 
                    src={treatment.image} 
                    alt={treatment.title} 
                    className="w-full h-auto rounded-lg transform group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#63099c]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                </div>
              </div>
              <div className="md:w-2/3">
                <ul className="list-none space-y-3 text-gray-200">
                  {treatment.benefits.map((benefit, benefitIndex) => (
                    <li 
                      key={benefitIndex} 
                      className="flex items-start space-x-3 opacity-0 animate-fade-in group-hover:text-white transition-colors duration-300"
                      style={{ 
                        animationDelay: `${(index * 0.2) + (benefitIndex * 0.1)}s`, 
                        animationFillMode: 'forwards' 
                      }}
                    >
                      <span className="w-2 h-2 bg-[#63099c] rounded-full mt-2 flex-shrink-0 group-hover:bg-[#7E69AB] transition-colors duration-300"></span>
                      <span className="leading-relaxed">{benefit}</span>
                    </li>
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
