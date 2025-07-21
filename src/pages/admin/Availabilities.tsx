import React, { useState, useEffect } from "react";
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, format } from "date-fns";
import { useAvailabilities } from "../../contexts/AvailabilitiesContext";
import { toast } from "@/components/ui/use-toast";

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<Record<string, Record<string, boolean> & { _allOff?: boolean }>>({});
  const [originalAvailability, setOriginalAvailability] = useState<Record<string, Record<string, boolean> & { _allOff?: boolean }>>({});
  const [dirty, setDirty] = useState(false);
  const { availabilities, loading, fetchAvailabilities, upsertAvailabilities } = useAvailabilities();

  const days = getMonthDays(currentMonth);
  const monthStr = format(currentMonth, "MMMM yyyy");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch availabilities for the current month
  useEffect(() => {
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    fetchAvailabilities(monthStart, monthEnd);
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

  // Toggle hour
  const toggleHour = (date: Date, hour: string) => {
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
      toast({ title: "No changes to save." });
      return;
    }
    await upsertAvailabilities(upserts);
    toast({ title: "Availabilities saved!" });
    setOriginalAvailability(JSON.parse(JSON.stringify(availability)));
    setDirty(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Availabilities</h2>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-3 py-1 bg-gray-700 rounded">Prev</button>
        <span className="text-xl font-semibold">{monthStr}</span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-3 py-1 bg-gray-700 rounded">Next</button>
      </div>
      {loading && <div className="mb-4 text-violet-400">Loading...</div>}
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="text-center text-gray-400">{d}</div>
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
              className={`aspect-square w-10 rounded flex items-center justify-center border transition-colors
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
        <div className="bg-gray-800 rounded p-4 mb-4">
          <div className="flex items-center mb-2">
            <span className="text-lg font-semibold mr-4">{format(selectedDay, "PPP")}</span>
            <button
              onClick={() => toggleWholeDay(selectedDay)}
              disabled={selectedDay < today}
              className={`ml-auto px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 ${selectedDay < today ? "cursor-not-allowed opacity-50" : ""}`}
            >
              Toggle whole day {isDayAllOff(selectedDay) ? "on" : "off"}
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {HOURS.map(hour => (
              <button
                key={hour}
                onClick={() => toggleHour(selectedDay, hour)}
                disabled={selectedDay < today}
                className={`px-3 py-2 rounded font-mono transition-colors
                  ${selectedDay < today ? "bg-gray-700/50 text-gray-500 cursor-not-allowed" : isHourAvailable(selectedDay, hour) ? "bg-violet-400 text-gray-900" : "bg-gray-700 text-gray-400"}
                `}
              >
                {hour}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={!dirty || loading}
        className={`mt-4 px-6 py-2 rounded bg-violet-400 text-gray-900 font-bold transition-opacity ${dirty && !loading ? "opacity-100" : "opacity-50 cursor-not-allowed"}`}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
} 