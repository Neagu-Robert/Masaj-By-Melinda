import React, { useState, useEffect } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format } from "date-fns";
import { useAvailabilities } from "../../contexts/AvailabilitiesContext";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/lib/audit-logger";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  previewCreateRecurringAvailability,
  confirmCreateRecurringAvailability,
  cancelRecurringAvailability,
  RecurrenceType as RecurrenceTypeAvail,
} from "@/services/recurring/availability";

const HOURS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

function getMonthDays(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = [];
  let day = start;
  while (day <= end) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

export default function Availabilities() {
  const { user: adminUser } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<Record<string, Record<string, boolean> & { _allOff?: boolean }>>({});
  const [originalAvailability, setOriginalAvailability] = useState<Record<string, Record<string, boolean> & { _allOff?: boolean }>>({});
  const [dirty, setDirty] = useState(false);
  const { availabilities, loading, fetchAvailabilities, upsertAvailabilities } = useAvailabilities();
  // Booked slots map: key is yyyy-MM-dd, value is a Set of HH:MM (local)
  const [bookedMap, setBookedMap] = useState<Record<string, Set<string>>>({});
  const [loadingBooked, setLoadingBooked] = useState(false);
  // Recurring block UI state
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceTypeAvail>('daily');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [recurringHour, setRecurringHour] = useState<string>(HOURS[0]);
  const [recurringStartDate, setRecurringStartDate] = useState<string | undefined>(undefined);
  const [preview, setPreview] = useState<{ date: string; time: string; available: boolean; reason?: string }[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeRecurring, setActiveRecurring] = useState<{ id: string; recurrence_type: string; weekdays: number[] | null; hour: string; start_date: string; until: string }[]>([]);

  const days = getMonthDays(currentMonth);
  const monthStr = format(currentMonth, "MMMM yyyy");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch availabilities for the current month
  useEffect(() => {
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    fetchAvailabilities(monthStart, monthEnd);
    // Also fetch booked hours (bookings + recurring instances with TRUE status)
    const fetchBooked = async () => {
      try {
        setLoadingBooked(true);
        // Fetch bookings in range
        const [bookingsRes, recurringRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('booking_date, booking_time')
            .gte('booking_date', monthStart)
            .lte('booking_date', monthEnd),
          supabase
            .from('recurring_bookings')
            .select('date, hour, status')
            .eq('status', true)
            .gte('date', monthStart)
            .lte('date', monthEnd)
        ]);

        const map: Record<string, Set<string>> = {};

        // Map regular bookings
        if (bookingsRes.data) {
          for (const b of bookingsRes.data as any[]) {
            const dateKey = b.booking_date as string; // yyyy-MM-dd
            const time = (b.booking_time as string)?.slice(0,5);
            if (!dateKey || !time) continue;
            if (!map[dateKey]) map[dateKey] = new Set<string>();
            map[dateKey].add(time);
          }
        }
        // Map recurring TRUE instances
        if (recurringRes.data) {
          for (const r of recurringRes.data as any[]) {
            if (!r.status) continue;
            const dateKey = r.date as string; // yyyy-MM-dd
            const time = (r.hour as string)?.slice(0,5);
            if (!dateKey || !time) continue;
            if (!map[dateKey]) map[dateKey] = new Set<string>();
            map[dateKey].add(time);
          }
        }

        setBookedMap(map);
      } catch (e) {
        console.error('Error fetching booked slots:', e);
        setBookedMap({});
      } finally {
        setLoadingBooked(false);
      }
    };
    fetchBooked();
    // Load active recurring blocks intersecting month
    const fetchRecurring = async () => {
      try {
        const { data, error } = await supabase
          .from('recurring_availabilities')
          .select('id,recurrence_type,weekdays,hour,start_date,until')
          .lte('start_date', monthEnd)
          .gte('until', monthStart);
        if (error) throw error;
        setActiveRecurring(data || []);
      } catch (e) {
        console.error('Error fetching recurring availabilities:', e);
        setActiveRecurring([]);
      }
    };
    fetchRecurring();
    // eslint-disable-next-line
  }, [currentMonth]);

  // Map context data to local state for UI editing
  useEffect(() => {
    const availMap: Record<string, Record<string, boolean> & { _allOff?: boolean }> = {};
    availabilities.forEach((row) => {
      const key = row.date;
      if (!availMap[key]) availMap[key] = {};
      availMap[key][row.hour.slice(0,5)] = row.is_available;
    });
    Object.keys(availMap).forEach(key => {
      availMap[key]._allOff = HOURS.every(h => availMap[key][h] === false);
    });
    setAvailability(availMap);
    setOriginalAvailability(JSON.parse(JSON.stringify(availMap)));
    setDirty(false);
  }, [availabilities]);

  // Helper: is whole day off?
  const isDayAllOff = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayAvail = availability[key];
    if (!dayAvail) return false;
    return dayAvail._allOff === true || HOURS.every(h => dayAvail[h] === false);
  };
  // Helper: is any hour available? (default: available)
  const isDayAvailable = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const dayAvail = availability[key];
    if (!dayAvail) return true; // default: available
    return HOURS.some(h => dayAvail[h] !== false);
  };
  // Helper: get hour state (default: available)
  const isHourAvailable = (date: Date, hour: string) => {
    const key = format(date, "yyyy-MM-dd");
    const dayAvail = availability[key];
    if (!dayAvail) return true; // default: available
    return dayAvail[hour] !== false;
  };

  // Helper: is hour booked based on bookings/recurring TRUE instances
  const isHourBooked = (date: Date, hour: string) => {
    const key = format(date, "yyyy-MM-dd");
    const set = bookedMap[key];
    return !!set && set.has(hour);
  };

  // Toggle hour
  const toggleHour = (date: Date, hour: string) => {
    // Do not allow toggling a booked slot
    if (isHourBooked(date, hour)) return;
    const key = format(date, "yyyy-MM-dd");
    setAvailability(prev => {
      const day = { ...prev[key] };
      day[hour] = !(day[hour] !== false);
      day._allOff = HOURS.every(h => day[h] === false);
      return { ...prev, [key]: day };
    });
    setDirty(true);
  };
  // Toggle whole day
  const toggleWholeDay = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    setAvailability(prev => {
      const day = { ...prev[key] };
      const allOff = !isDayAllOff(date);
      HOURS.forEach(h => { day[h] = !allOff; });
      day._allOff = allOff;
      return { ...prev, [key]: day };
    });
    setDirty(true);
  };

  // Save handler: upsert all changed slots
  const handleSave = async () => {
    if (!adminUser) return;

    const upserts: any[] = [];
    days.forEach(day => {
      const key = format(day, "yyyy-MM-dd");
      const dayAvail = availability[key] || {};
      HOURS.forEach(hour => {
        const isAvailable = dayAvail[hour] !== false;
        const origAvail = (originalAvailability[key] && originalAvailability[key][hour] !== undefined)
          ? originalAvailability[key][hour] !== false : true;
        if (isAvailable !== origAvail) {
          upserts.push({
            date: key,
            hour: hour + ":00",
            is_available: isAvailable,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
    if (upserts.length === 0) {
      toast.info("Nu sunt modificări de salvat.");
      return;
    }
    try {
      await upsertAvailabilities(upserts);
      toast.success("Disponibilitățile au fost salvate cu succes!");

      // Log the action
      await logAdminAction(
        adminUser?.id || "",
        "availability.update",
        "availability",
        adminUser?.id || "", // Target ID is the admin who made the change
        `Updated availability for admin ID ${adminUser?.id} on ${format(currentMonth, "MMMM yyyy")}`
      );
    } catch (error) {
      console.error("Error saving availabilities:", error);
      toast.error("Salvarea disponibilităților a eșuat.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-violet-400">Gestionare Disponibilități</h2>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">Înapoi</button>
        <span className="text-lg md:text-xl font-semibold">{monthStr}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors">Următorul</button>
      </div>
      {loading && <div className="mb-4 text-violet-400">Se încarcă...</div>}
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-6 text-xs md:text-base">
        {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map(d => (
          <div key={d} className="text-center text-gray-400 text-sm md:text-base font-medium">{d}</div>
        ))}
        {days.map(day => {
          const isPast = day < today;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const allOff = isDayAllOff(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && setSelectedDay(day)}
              disabled={isPast}
              className={`aspect-square w-9 h-9 md:w-12 rounded flex items-center justify-center border transition-colors text-xs md:text-base font-medium
                ${isPast ? "bg-gray-800 text-gray-700 cursor-not-allowed" : ""}
                ${!isPast && !isCurrentMonth ? "bg-gray-800 text-gray-600" : ""}
                ${!isPast && isCurrentMonth && (allOff ? "bg-gray-700 text-gray-500" : "bg-violet-400 text-gray-900")}
                ${isSelected && !isPast ? "ring-2 ring-violet-400" : ""}
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
      
      {/* Hours section */}
      {selectedDay && (
        <div className="bg-gray-800 rounded p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center mb-4 md:mb-6">
            <span className="text-lg md:text-xl font-semibold mb-2 md:mb-0">{format(selectedDay, "PPP")}</span>
            <div className="md:ml-auto flex gap-2 w-full md:w-auto">
              <button
                onClick={() => toggleWholeDay(selectedDay)}
                disabled={selectedDay < today}
                className={`px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors flex-1 md:flex-none ${selectedDay < today ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Comută toată ziua {isDayAllOff(selectedDay) ? "pornit" : "oprit"}
              </button>
              <button
                onClick={() => {
                  setRecurringHour(HOURS[0]);
                  setRecurringStartDate(format(selectedDay, 'yyyy-MM-dd'));
                  setRecurrenceType('daily');
                  setWeekdays([]);
                  setHorizon(30);
                  setPreview(null);
                  setRecurringOpen(true);
                }}
                className={`px-4 py-2 rounded bg-violet-600 hover:bg-violet-700 transition-colors flex-1 md:flex-none`}
              >
                Blocare recurentă
              </button>
            </div>
          </div>
          
          {/* Hours Grid - More vertical spacing */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
            {HOURS.map(hour => {
              const booked = isHourBooked(selectedDay, hour);
              const past = selectedDay < today;
              const available = isHourAvailable(selectedDay, hour);
              return (
                <button
                  key={hour}
                  onClick={() => toggleHour(selectedDay, hour)}
                  disabled={past || booked}
                  title={booked ? 'Rezervat' : undefined}
                  className={`px-3 py-3 md:py-4 rounded font-mono transition-colors text-sm md:text-base font-medium
                    ${past ? "bg-gray-700/50 text-gray-500 cursor-not-allowed" : booked ? "bg-red-600 text-white cursor-not-allowed" : available ? "bg-violet-400 text-gray-900 hover:bg-violet-300" : "bg-gray-700 text-gray-400 hover:bg-gray-600"}
                  `}
                >
                  {hour}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Active recurring blocks list */}
      <div className="bg-gray-800 rounded p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold text-violet-300">Blocări recurente active (în acest interval)</span>
        </div>
        {activeRecurring.length === 0 ? (
          <div className="text-gray-400">Niciun blocaj recurent activ care se suprapune cu această lună.</div>
        ) : (
          <div className="space-y-2">
            {activeRecurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-gray-900/60 border border-gray-700 rounded px-3 py-2">
                <div className="text-sm text-gray-200">
                  <span className="text-violet-300 font-medium mr-2">{r.recurrence_type}</span>
                  <span className="mr-2">{r.hour.slice(0,5)}</span>
                  <span className="text-gray-400">{r.start_date} → {r.until}</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await cancelRecurringAvailability(r.id);
                      toast.success('Blocajul recurent a fost anulat');
                      const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
                      const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
                      await fetchAvailabilities(monthStart, monthEnd);
                      const { data } = await supabase
                        .from('recurring_availabilities')
                        .select('id,recurrence_type,weekdays,hour,start_date,until')
                        .lte('start_date', monthEnd)
                        .gte('until', monthStart);
                      setActiveRecurring(data || []);
                    } catch (e) {
                      console.error(e);
                      toast.error('Anularea blocajului recurent a eșuat');
                    }
                  }}
                  className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Anulează
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button
        onClick={handleSave}
        disabled={!dirty || loading}
        className={`mt-4 md:mt-6 px-6 py-3 md:py-4 rounded bg-violet-400 text-gray-900 font-bold transition-opacity text-base md:text-lg w-full md:w-auto ${dirty && !loading ? "opacity-100 hover:bg-violet-300" : "opacity-50 cursor-not-allowed"}`}
      >
        {loading ? "Se salvează..." : "Salvează"}
      </button>
      {/* Recurring Modal */}
      {recurringOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-lg p-6">
            <h3 className="text-xl font-semibold text-violet-300 mb-4">Creează blocaj recurent</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Recurență</label>
                  <select value={recurrenceType} onChange={(e)=> setRecurrenceType(e.target.value as RecurrenceTypeAvail)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2">
                    <option value="daily">Zilnic</option>
                    <option value="weekly">Săptămânal</option>
                    <option value="biweekly">La două săptămâni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Durată</label>
                  <select value={horizon} onChange={(e)=> setHorizon(Number(e.target.value) as 30|60|90)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2">
                    <option value={30}>30 de zile</option>
                    <option value={60}>60 de zile</option>
                    <option value={90}>90 de zile</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Oră</label>
                  <select value={recurringHour} onChange={(e)=> setRecurringHour(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2">
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Data de început</label>
                  <input type="date" value={recurringStartDate || ''} onChange={(e)=> setRecurringStartDate(e.target.value || undefined)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2" />
                </div>
              </div>
              {(recurrenceType === 'weekly' || recurrenceType === 'biweekly') && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Zilele săptămânii</label>
                  <div className="grid grid-cols-7 gap-2 text-sm text-gray-200">
                    {['Dum','Lun','Mar','Mie','Joi','Vin','Sâm'].map((d, idx) => (
                      <label key={d} className="flex items-center gap-1">
                        <input type="checkbox" checked={weekdays.includes(idx)} onChange={(e)=> setWeekdays(prev => e.target.checked ? [...prev, idx] : prev.filter(x => x !== idx))} />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      setPreviewLoading(true);
                      const res = await previewCreateRecurringAvailability(recurringHour, recurrenceType, horizon, recurringStartDate, weekdays);
                      setPreview(res.preview || []);
                    } catch (e:any) {
                      toast.error(e.message || 'Previzualizarea a eșuat');
                    } finally { setPreviewLoading(false); }
                  }}
                  className="px-4 py-2 rounded bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={previewLoading}
                >
                  {previewLoading ? 'Se previzualizează...' : 'Previzualizare'}
                </button>
                <button onClick={()=> setRecurringOpen(false)} className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800">Închide</button>
              </div>
              {preview && (
                <div className="max-h-64 overflow-auto border border-gray-700 rounded p-3 bg-gray-800">
                  <div className="text-sm text-gray-300 mb-2">Previzualizare ({preview.length} date)</div>
                  <ul className="space-y-1 text-sm">
                    {preview.map((p, idx) => (
                      <li key={idx} className={p.available ? 'text-green-300' : 'text-gray-400'}>
                        {p.date} la {p.time} {p.available ? '' : `(indisponibil: ${p.reason})`}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <button
                      onClick={async ()=>{
                        try {
                          const res = await confirmCreateRecurringAvailability(recurringHour, recurrenceType, horizon, recurringStartDate, weekdays);
                          toast.success(`S-au creat ${res.createdCount} blocaje, s-au omis ${res.skippedCount}`);
                          setRecurringOpen(false);
                          setPreview(null);
                          const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
                          const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
                          await fetchAvailabilities(monthStart, monthEnd);
                          const { data } = await supabase
                            .from('recurring_availabilities')
                            .select('id,recurrence_type,weekdays,hour,start_date,until')
                            .lte('start_date', monthEnd)
                            .gte('until', monthStart);
                          setActiveRecurring(data || []);
                        } catch (e:any) {
                          console.error(e);
                          toast.error(e.message || 'Crearea a eșuat');
                        }
                      }}
                      className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
                    >
                      Confirmă
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 