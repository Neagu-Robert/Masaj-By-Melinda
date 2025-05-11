
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const massageServices = [
  {
    title: "Masaj de relaxare",
    description:
      "Relaxează mușchii tensionați și calmează mintea, oferind o stare profundă de bine și destindere.Reduce stresul și îmbunătățește somnul.",
    duration: "60 min",
    price: "140 RON",
  },
  {
    title: "Masaj terapeutic",
    description:
      "Ameliorează durerile musculare și articulațiile rigide prin tehnici specializate cu efecte vindecătoare.Contribuie la recuperarea fizică și mobilitatea articulară.",
    duration: "60 min",
    price: "140 RON",
  },
  {
    title: "Masaj de drenaj limfatic",
    description:
      "Stimulează sistemul limfatic pentru eliminarea toxinelor, reducând retenția de apă și umflăturile.Întărește sistemul imunitar și combate oboseala cronică.",
    duration: "60 min",
    price: "140 RON",
  },
  {
    title: "Masaj anticelulitic",
    description:
      "Activează circulația și ajută la diminuarea aspectului de „coajă de portocală", redând fermitatea pielii.Remodelează silueta și îmbunătățește textura pielii.",
    duration: "60 min",
    price: "140 RON",
  },
  {
    title: "Masaj facial",
    description:
      "Revigorează pielea feței, stimulează circulația și oferă un efect vizibil de prospețime și tonifiere.Încetinește apariția ridurilor și redă luminozitatea tenului.",
    duration: "60 min",
    price: "140 RON",
  },
  {
    title: "Masaj cu pietre vulcanice",
    description:
      "Combină căldura naturală a pietrelor cu presiunea blândă pentru relaxare profundă și echilibru energetic.Reduce tensiunea musculară și îmbunătățește circulația sângelui.",
    duration: "60 min",
    price: "140 RON",
  },
  {
    title: "Masaj cu bete de bambus",
    description:
      "Folosește bețe de bambus pentru a destinde mușchii și a activa circulația, oferind o experiență tonifiantă.Stimulează metabolismul și combate oboseala musculară.",
    duration: "60 min",
    price: "140 RON",
  },
];

const MassageServices = () => {
  return (
    <div className="container mx-auto px-4">
      <h3 className="text-2xl font-semibold text-center text-white mb-8">
        Masaje
      </h3>
      <div className="grid md:grid-cols-2 gap-8 [&>*:last-child:nth-child(2n+1)]:col-span-2 [&>*:last-child:nth-child(2n+1)]:mx-auto [&>*:last-child:nth-child(2n+1)]:max-w-2xl">
        {massageServices.map((service) => (
          <Card
            key={service.title}
            className="hover:shadow-lg transition-shadow duration-300 p-4 bg-black/60 backdrop-blur-sm text-white border-none"
          >
            <CardHeader>
              <CardTitle className="text-[#63099c] text-2xl">
                {service.title}
              </CardTitle>
              <CardDescription className="text-lg text-gray-300">
                {service.duration}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-200 mb-4 text-lg">
                {service.description}
              </p>
              <p className="text-3xl font-semibold text-[#63099c]">
                {service.price}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MassageServices;
