
import React from 'react';
import Navbar from '../components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Gift, Phone, MessageSquare } from 'lucide-react';
import Booking from '@/components/Booking';

const PachetePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-semibold text-center text-[#63099c] mb-12">Pachete Speciale</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Pachet 1 */}
            <Card className="overflow-hidden border-[#9b87f5]/30 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-auto">
                  <img 
                    src="/lovable-uploads/d1638de6-ca53-4e9b-96fd-bd385a3f988f.png" 
                    alt="Masaj loialitate" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Package className="w-6 h-6 text-[#9b87f5] mr-2" />
                    <h3 className="text-xl font-semibold text-[#63099c]">Pachet loialitate</h3>
                  </div>
                  <p className="text-gray-700">
                    10 masaje + 1 gratis (pot fi folosite de mai multe persoane /prieteni/ membrii ai familiei)
                  </p>
                </CardContent>
              </div>
            </Card>

            {/* Pachet 2 */}
            <Card className="overflow-hidden border-[#9b87f5]/30 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-auto">
                  <img 
                    src="/lovable-uploads/1b73aee3-1d55-465f-b371-bfb2a17cc0e3.png" 
                    alt="Remodelare corporala" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Package className="w-6 h-6 text-[#9b87f5] mr-2" />
                    <h3 className="text-xl font-semibold text-[#63099c]">Remodelare corporala</h3>
                  </div>
                  <p className="text-gray-700">
                    30 de minute cu un aparat in functie de nevoi + un masaj fie de fermitate/anticelulitic (10 sedinte -950 lei) dupa 2 abonamente primiti un tratament facial antiimbatranire gratuit.
                  </p>
                </CardContent>
              </div>
            </Card>

            {/* Pachet 3 */}
            <Card className="overflow-hidden border-[#9b87f5]/30 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-auto">
                  <img 
                    src="/lovable-uploads/918d4504-6b81-4311-b421-c0e2df19ed59.png" 
                    alt="Impachetari pentru detox" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Package className="w-6 h-6 text-[#9b87f5] mr-2" />
                    <h3 className="text-xl font-semibold text-[#63099c]">Impachetari pentru detox/remodelare</h3>
                  </div>
                  <p className="text-gray-700">
                    Impachetari pentru detox/remodelare cu termocuvertura (10 sedinte - 900 de lei) dupa un abonament primiti un masaj facial/reflexo/masaj la spate.
                  </p>
                </CardContent>
              </div>
            </Card>

            {/* Pachet 4 */}
            <Card className="overflow-hidden border-[#9b87f5]/30 shadow-lg hover:shadow-xl transition-shadow">
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-auto">
                  <img 
                    src="/lovable-uploads/c94579d3-e2b1-4851-892c-79044c3ca995.png" 
                    alt="Voucher cadou" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Gift className="w-6 h-6 text-[#9b87f5] mr-2" />
                    <h3 className="text-xl font-semibold text-[#63099c]">Vouchere cadou</h3>
                  </div>
                  <p className="text-gray-700">
                    Vouchere valorice ce se pot oferi cadou persoanelor dragi. Cu suma valorica de pe voucher se poate achizitiona orice serviciu din gama noastra. Se plateste la salon cash/card.
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>
          
          {/* New contact message */}
          <div className="mt-14 max-w-3xl mx-auto text-center p-6 bg-[#f8f5ff] rounded-lg border border-[#9b87f5]/30 shadow-sm">
            <p className="text-lg text-[#63099c] flex flex-col md:flex-row items-center justify-center gap-2">
              <span>Pentru achiziționarea unui pachet special vă rugăm să ne contactați printr-un apel sau mesaj și vă vom face o rezervare</span>
              <span className="flex items-center gap-2 mt-2 md:mt-0 md:ml-2">
                <Phone className="text-[#63099c] w-5 h-5" />
                <MessageSquare className="text-[#63099c] w-5 h-5" />
              </span>
            </p>
          </div>
        </div>
      </div>

      <Booking />
    </div>
  );
};

export default PachetePage;
