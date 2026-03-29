import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar } from 'lucide-react';

interface Booking {
  id: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status?: 'unconfirmed' | 'confirmed' | 'rejected' | 'suggested';
}

interface BookingsListProps {
  selectedDay: Date;
  bookings: Booking[];
  onEditClick: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  user: any;
  role: string;
}

const BookingsList: React.FC<BookingsListProps> = ({
  selectedDay,
  bookings,
  onEditClick,
  onCancelBooking,
  user,
  role
}) => {
  // Helper to format date and time as 'HH:mm | DD/MM/YYYY'
  function formatBookingDateTime(dateStr: string, timeStr: string) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // If timeStr is present, use it; otherwise fallback to 00:00
    const [hour, minute] = (timeStr || '00:00').split(':');
    date.setHours(Number(hour), Number(minute));
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())} | ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function getStatusBadge(status?: string) {
    if (!status || status === 'confirmed') return null;
    
    const statusConfig = {
      unconfirmed: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'În așteptare' },
      suggested: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Sugestie' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-300', label: 'Respins' },
    };
    
    const config = statusConfig[status] || statusConfig.unconfirmed;
    
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  }

  const dayBookings = bookings.filter(b => {
    const d = new Date(b.booking_date);
    d.setHours(0,0,0,0);
    return d.getTime() === selectedDay.getTime();
  }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 h-full">
      <h3 className="text-lg font-semibold text-violet-300 mb-4">
        Rezervări pentru {selectedDay.toLocaleDateString('ro-RO', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </h3>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {dayBookings.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nu există rezervări pentru această dată.</p>
            </div>
          </div>
        ) : (
          <>
          {/* Regular bookings */}
          {dayBookings.map((booking) => {
            const isUnconfirmed = booking.status === 'unconfirmed' || booking.status === 'suggested';
            return (
              <Card key={booking.id} className={`bg-gray-800/50 border-gray-700 hover:border-violet-500/50 transition-colors duration-200 ${isUnconfirmed ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-sm text-gray-400">Serviciu</div>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-white font-medium">{booking.service_type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Data</div>
                      <div className="text-white text-sm">{formatBookingDateTime(booking.booking_date, booking.booking_time)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-700">
                    {/* Only allow edit/cancel for concrete booking rows */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEditClick(booking)} 
                      disabled={isUnconfirmed}
                      className={`text-white hover:text-gray-300 hover:bg-gray-700/50 transition-colors duration-200 text-xs px-2 py-1 ${isUnconfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title={isUnconfirmed ? 'Nu puteți edita o rezervare neconfirmată' : 'Editează rezervarea'}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editează
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCancelBooking(booking)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors duration-200 text-xs px-2 py-1">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Anulează
                    </Button>
                </div>
              </CardContent>
            </Card>
            );
          })}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
