import { Mail, MapPin, Phone, Star, CheckCircle, Cpu } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 text-center md:text-left">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-semibold text-white mb-4">Masaj by Melinda</h3>
            <p className="text-gray-400">
              Relaxare, remodelare și răsfăț pentru trup și suflet.
            </p>
            <ul className="mt-4 flex flex-col gap-2 items-center md:items-start text-center md:text-left">
              <li className="flex items-center gap-2 text-sm text-violet-400">
                <Star size={16} />
                <span>10 ani de experiență</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-violet-400">
                <CheckCircle size={16} />
                <span>Certificată profesional</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-violet-400">
                <Cpu size={16} />
                <span>Echipamente moderne</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Contactează-ne</h3>
            <a href="https://www.google.com/maps/search/?api=1&query=str.+Aluminei,+Oradea" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-3 text-gray-300 hover:text-violet-400 transition-colors">
              <MapPin size={20} />
              <span>str. Aluminei, Oradea, Bihor, Romania</span>
            </a>
            <a href="tel:0771761649" className="flex items-center justify-center md:justify-start gap-3 text-violet-400 hover:text-violet-300 transition-colors font-medium">
              <Phone size={20} />
              <span>0771 761 649</span>
            </a>
            <a href="mailto:melindaneagu22@gmail.com" className="flex items-center justify-center md:justify-start gap-3 text-violet-400 hover:text-violet-300 transition-colors font-medium">
              <Mail size={20} />
              <span>melindaneagu22@gmail.com</span>
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; 2026 Masaj by Melinda. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
