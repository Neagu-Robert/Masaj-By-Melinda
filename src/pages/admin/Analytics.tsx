import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { format, parseISO } from "date-fns";
// import massageServices from "@/components/MassageServices"; // Not needed, using static array

// Custom label renderer for the PieChart
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, service }) => {
  if (percent === 0) {
    return null;
  }
  const radius = outerRadius + 25; // Position labels further outside the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs" // Tailwind class for font size
    >
      {`${service}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Massage services
const MASSAGE_SERVICE_TYPES = [
  "Masaj de relaxare",
  "Masaj terapeutic",
  "Masaj de drenaj limfatic",
  "Masaj anticelulitic",
  "Masaj facial",
  "Masaj cu pietre vulcanice",
  "Masaj cu bete de bambus",
];
// Device treatments (from DeviceTreatments.tsx)
const DEVICE_TREATMENT_TYPES = [
  "Tratament cu Termocuvertă",
  "Remodelare Corporală cu Cavitație 40Khz",
  "Tratament cu Electrostimulare",
  "Radiofrecvență TECAR",
];

const SERVICE_TYPES = [...MASSAGE_SERVICE_TYPES, ...DEVICE_TREATMENT_TYPES];

const SERVICE_COLORS = [
  "#a78bfa", // violet
  "#f472b6", // pink
  "#facc15", // yellow
  "#34d399", // green
  "#60a5fa", // blue
  "#f87171", // red
  "#fbbf24", // orange
  "#818cf8", // indigo
  "#f472b6", // pink (repeat for device treatments)
  "#34d399",
  "#60a5fa",
  "#f87171"
];

const HOUR_RANGE = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getLast30DaysDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getDayOfWeek(dateStr) {
  // 0 (Sunday) to 6 (Saturday) -> 0 (Monday) to 6 (Sunday)
  const d = parseISO(dateStr);
  let day = d.getDay();
  return DAYS[(day + 6) % 7];
}

function getHourSlot(timeStr) {
  // Returns hour in HH:00 format
  if (!timeStr) return null;
  const [h] = timeStr.split(":");
  return `${h.padStart(2, "0")}:00`;
}

export default function Analytics() {
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [lineData, setLineData] = useState([]); // For line chart

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      setError(null);
      const fromDate = getLast30DaysDate();
      const { data, error } = await supabase
        .from("bookings")
        .select("service_type, booking_date, booking_time")
        .gte("booking_date", fromDate);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Aggregate bookings per service (existing)
      const counts = SERVICE_TYPES.map((type) => ({
        service: type,
        count: data.filter((b) => b.service_type === type).length,
      }));
      setServiceData(counts);
      // Aggregate bookings by day of week and hour
      const matrix = {};
      DAYS.forEach((day) => {
        matrix[day] = {};
        HOUR_RANGE.forEach((h) => (matrix[day][h] = 0));
      });
      data.forEach((b) => {
        const day = getDayOfWeek(b.booking_date);
        const hour = getHourSlot(b.booking_time);
        if (matrix[day] && matrix[day][hour] !== undefined) {
          matrix[day][hour]++;
        }
      });
      // Convert to array for recharts: [{ day: 'Monday', '08:00': 2, ... }]
      const hourlyArr = DAYS.map((day) => {
        const row = { day };
        HOUR_RANGE.forEach((h) => (row[h] = matrix[day][h]));
        return row;
      });
      setHourlyData(hourlyArr);
      // Aggregate bookings per day for line chart
      const today = new Date();
      const daysArr = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        daysArr.push(dateStr);
      }
      const lineCounts = daysArr.map(date => ({
        date,
        count: data.filter(b => b.booking_date === date).length
      }));
      setLineData(lineCounts);
      setLoading(false);
    }
    fetchBookings();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-violet-400">Analytics</h2>
      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Bookings per Service (Last 30 Days)</h3>
        {loading ? (
          <p>Loading analytics...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serviceData} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 11 }} height={60} dy={10} />
              <YAxis label={{ value: "Bookings", angle: -90, position: "insideLeft", fontSize: 14 }} allowDecimals={false} domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="count" name="Bookings" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {/* Next: Add heatmap/grouped bar chart for bookings by day/hour */}
      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Bookings by Day of Week & Hour (Last 30 Days)</h3>
        {loading ? (
          <p>Loading analytics...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={hourlyData} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} height={50} dy={8} />
              <YAxis label={{ value: "Bookings", angle: -90, position: "insideLeft", fontSize: 14 }} allowDecimals={false} domain={[0, 10]} />
              <Tooltip />
              {/* One bar per hour slot */}
              {HOUR_RANGE.map((h, idx) => (
                <Bar key={h} dataKey={h} stackId="a" fill={`hsl(${260 + idx * 10}, 70%, 70%)`} name={h} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Bookings Over Time (Last 30 Days)</h3>
        {loading ? (
          <p>Loading analytics...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={lineData} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={3} height={50} dy={8} />
              <YAxis label={{ value: "Bookings", angle: -90, position: "insideLeft", fontSize: 14 }} allowDecimals={false} domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: '#a78bfa' }} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Booking Distribution by Service (Last 30 Days)</h3>
        {loading ? (
          <p>Loading analytics...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart aria-label="Booking Distribution by Service">
              <Pie
                data={serviceData.filter(d => d.count > 0)} // Only render slices with data
                dataKey="count"
                nameKey="service"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={2}
                labelLine={false}
                label={renderCustomizedLabel}
                isAnimationActive={true}
              >
                {serviceData.filter(d => d.count > 0).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={SERVICE_COLORS[SERVICE_TYPES.indexOf(entry.service) % SERVICE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} bookings`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 