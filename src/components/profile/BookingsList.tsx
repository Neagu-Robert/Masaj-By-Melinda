import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Calendar } from 'lucide-react';

interface Booking {
  id: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  recurring?: boolean;
}

interface BookingsListProps {
  selectedDay: Date;
  bookings: Booking[];
  recurringInstances?: { id?: string; booking_id: string; date: string; hour: string; status: boolean; service_type?: string }[];
  onEditClick: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  onOpenRecurring: (booking: Booking) => void;
  onCancelRecurring: (booking: Booking) => void;
  user: any;
  onCancelRecurringInstance?: (instance: any) => void;
}

const BookingsList: React.FC<BookingsListProps> = ({
  selectedDay,
  bookings,
  recurringInstances = [],
  onEditClick,
  onCancelBooking,
  onOpenRecurring,
  onCancelRecurring,
  user,
  onCancelRecurringInstance
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

  const dayBookings = bookings.filter(b => {
    const d = new Date(b.booking_date);
    d.setHours(0,0,0,0);
    return d.getTime() === selectedDay.getTime();
  }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

  const dayRecurring = recurringInstances.filter(r => {
    const d = new Date(r.date);
    d.setHours(0,0,0,0);
    return d.getTime() === selectedDay.getTime();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        {dayBookings.length === 0 && dayRecurring.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nu există rezervări pentru această dată.</p>
            </div>
          </div>
        ) : (
          <>
          {/* Recurring planned instances (from recurring_bookings) */}
          {dayRecurring.map((r) => (
            <Card key={`rec-${r.booking_id}-${r.date}-${r.hour}`} className={`bg-gray-800/50 ${r.status ? 'border-green-600/50 hover:border-green-500/60' : 'border-gray-600/50'} transition-colors duration-200`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">Serviciu (recurent)</div>
                    <div className="text-white font-medium">{r.service_type || 'Serviciu'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Data</div>
                    <div className="text-white text-sm">{formatBookingDateTime(r.date, r.hour?.slice(0,5) || '00:00')}</div>
                  </div>
                </div>
                {!r.status && (
                  <div className="text-xs text-yellow-300">Omis din cauza datei deja ocupate</div>
                )}
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                  {/* Cancel single instance if handler provided and we have instance id */}
                  {onCancelRecurringInstance && r.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelRecurringInstance(r)}
                      className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/10 transition-colors duration-200"
                    >
                      Anulează această recurență
                    </Button>
                  )}
                  {/* Cancel entire series */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const root = bookings.find(b => b.id === r.booking_id);
                      if (root) {
                        onCancelRecurring(root);
                      } else {
                        onCancelRecurring({
                          id: r.booking_id,
                          service_type: r.service_type || 'Serviciu',
                          booking_date: r.date,
                          booking_time: (r.hour || '').slice(0,5),
                        } as Booking);
                      }
                    }}
                    className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/20 transition-colors duration-200"
                  >
                    Anulează toate recurențele
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Regular bookings (non-recurring or original root booking row) */}
          {dayBookings.map((booking) => (
            <Card key={booking.id} className="bg-gray-800/50 border-gray-700 hover:border-violet-500/50 transition-colors duration-200">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-sm text-gray-400 mb-1">Serviciu</div>
                    <div className="text-white font-medium">{booking.service_type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Data</div>
                    <div className="text-white text-sm">{formatBookingDateTime(booking.booking_date, booking.booking_time)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-700">
                  {/* Only allow edit/cancel for concrete booking rows */}
                  <Button variant="ghost" size="sm" onClick={() => onEditClick(booking)} className="text-white hover:text-gray-300 hover:bg-gray-700/50 transition-colors duration-200 text-xs px-2 py-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Editează
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onCancelBooking(booking)} className="text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors duration-200 text-xs px-2 py-1">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Anulează
                  </Button>
                  {user && (
                    booking.recurring ? (
                      <Button variant="ghost" size="sm" onClick={() => onCancelRecurring(booking)} className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/20 transition-colors duration-200 text-xs px-2 py-1">
                        Anulează Recurența
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => onOpenRecurring(booking)} className="text-green-300 hover:text-green-200 hover:bg-green-500/20 transition-colors duration-200 text-xs px-2 py-1">
                        Fă Recurent
                      </Button>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
