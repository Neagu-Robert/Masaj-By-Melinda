
import React from 'react';
import type { MetaFunction } from 'react-router';
import Navbar from '../components/Navbar';
import { Package, Gift, Phone, Mail } from 'lucide-react';

const packages = [
  {
    id: 'loialitate',
    title: 'Pachet loialitate',
    icon: Package,
    image: '/new_images/Loialitate.webp',
    features: [
      '10 ședințe de masaj',
      '1 ședință GRATUITĂ',
      'Transmisibil (familie / prieteni)',
    ],
    price: null,
  },
  {
    id: 'remodelare',
    title: 'Remodelare corporală',
    icon: Package,
    image: '/new_images/Remodelare.webp',
    features: [
      '30 de minute cu un aparat în funcție de nevoi',
      '+ un masaj de fermitate / anticelulitic',
      'După 2 abonamente primiți un tratament facial anti-îmbătrânire gratuit',
    ],
    price: '950 RON / 10 ședințe',
  },
  {
    id: 'impachetari',
    title: 'Împachetări pentru detox / remodelare',
    icon: Package,
    image: '/new_images/Impachetari.webp',
    features: [
      'Împachetări cu termocuvertură',
      'După un abonament primiți un masaj facial / reflexo / masaj la spate',
    ],
    price: '900 RON / 10 ședințe',
  },
  {
    id: 'voucher',
    title: 'Vouchere cadou',
    icon: Gift,
    image: '/new_images/Voucher.webp',
    features: [
      'Vouchere valorice ce se pot oferi cadou persoanelor dragi',
      'Cu suma valorică se poate achiziționa orice serviciu din gama noastră',
      'Se plătește la salon cash / card',
    ],
    price: null,
  },
];

const PachetePage = () => {
  return (
    <div
      className="min-h-screen bg-gray-900 bg-scroll md:bg-fixed bg-cover bg-center relative"
      style={{ backgroundImage: "url('/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png')" }}
    >
      {/* Dark overlay matching home page treatment */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      <div className="relative z-10">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Pachete Speciale
          </h1>

          {/* Simplified Banner */}
          <p className="text-center text-gray-300 max-w-2xl mx-auto mb-12 md:mb-16 text-base md:text-lg leading-relaxed">
            Pentru achiziționarea unui pachet special vă rugăm să ne contactați
            printr-un apel sau mesaj și vă vom face o rezervare
          </p>

          {/* 2×2 Desktop Grid / 1-col Mobile Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <article
                  key={pkg.id}
                  className="rounded-xl overflow-hidden bg-[#1E1B24] border border-white/[0.06] shadow-lg h-full transition-all duration-500 ease-out hover:scale-[1.02] hover:border-[#7C3AED]/30 hover:shadow-[0_0_30px_rgba(124,58,237,0.15)] transform-gpu will-change-transform"
                >
                  <div className="grid grid-cols-1 md:grid-cols-[5fr_6fr] h-full">
                    {/* Image Side */}
                    <div className="relative h-64 md:h-full md:min-h-[320px]">
                      <img
                        src={pkg.image}
                        alt={pkg.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Subtle gradient to blend image into dark card */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B24]/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#1E1B24]" />
                    </div>

                    {/* Content Side */}
                    <div className="p-5 md:p-6 flex flex-col justify-between">
                      {/* Title Row */}
                      <div className="flex items-center gap-2.5 mb-5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#7C3AED]/15 shrink-0">
                          <Icon className="w-[18px] h-[18px] text-[#7C3AED]" />
                        </div>
                        <h2 className="text-lg md:text-xl font-bold text-[#F3EDF7] leading-tight">
                          {pkg.title}
                        </h2>
                      </div>

                      {/* Feature List + Price grouped — buttons pushed to bottom */}
                      <div>
                        <div className="mb-5">
                          <p className="text-xs font-semibold text-[#7C3AED] uppercase tracking-widest mb-3">
                            Ce include:
                          </p>
                          <ul className="space-y-2">
                            {pkg.features.map((feature, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 text-sm text-[#F3EDF7]/85"
                              >
                                <span className="text-[#7C3AED] mt-0.5 shrink-0 text-base leading-none">
                                  •
                                </span>
                                <span className="leading-snug">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Price (when applicable) */}
                        {pkg.price && (
                          <p className="text-base font-bold text-[#7C3AED] tracking-wide">
                            Preț: {pkg.price}
                          </p>
                        )}
                      </div>

                      {/* CTA Button Row — always anchored to card bottom via justify-between */}
                      <div className="flex gap-3 pt-4">
                        <a
                          href="tel:0771761649"
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] hover:-translate-y-0.5 active:bg-[#5B21B6] text-white h-11 rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          <Phone className="w-4 h-4 shrink-0" />
                          <span>0771 761 649</span>
                        </a>
                        <a
                          href="mailto:melindaneagu22@gmail.com"
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/[0.17] hover:-translate-y-0.5 active:bg-white/[0.22] text-[#F3EDF7] h-11 rounded-lg text-sm font-medium transition-all duration-200 border border-white/[0.06]"
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                          <span>Email</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export const meta: MetaFunction = () => {
  return [
    { title: "Pachete și Prețuri Masaj Oradea | Masaj by Melinda" },
    { name: "description", content: "Alege pachetele noastre avantajoase pentru masaj și remodelare corporală în Oradea. Oferte speciale și pachete de loialitate la Masaj by Melinda." },
    { tagName: "link", rel: "canonical", href: "[DOMAIN_TBD]/pachete" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "Pachete și Prețuri Masaj Oradea | Masaj by Melinda" },
    { property: "og:description", content: "Alege pachetele noastre avantajoase pentru masaj și remodelare corporală în Oradea. Oferte speciale și pachete de loialitate la Masaj by Melinda." },
    { property: "og:url", content: "[DOMAIN_TBD]/pachete" },
    { property: "og:image", content: "/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Pachete și Prețuri Masaj Oradea | Masaj by Melinda" },
    { name: "twitter:description", content: "Alege pachetele noastre avantajoase pentru masaj și remodelare corporală în Oradea. Oferte speciale și pachete de loialitate la Masaj by Melinda." },
    { name: "twitter:image", content: "/lovable-uploads/8659eb40-96fc-4579-9af8-1b649574c3ff.png" }
  ];
};

export default PachetePage;
