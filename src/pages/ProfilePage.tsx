import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useServices } from '@/contexts/ServicesContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar, LogOut, Edit, Trash2, Menu, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EditBookingModal from '@/components/booking/EditBookingModal';
import { AvailabilitiesProvider } from "@/contexts/AvailabilitiesContext";
import { BookingsProvider } from "@/contexts/BookingsContext";
import EditProfileModal from '@/components/profile/EditProfileModal';
import NotificationPreferences from '@/components/profile/NotificationPreferences';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import BookingsList from '@/components/profile/BookingsList';
import { useBookingNotifications } from '@/services/notifications/hooks';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { previewCreateRecurring, confirmCreateRecurring, cancelRecurring, RecurrenceType } from '@/services/recurring/service';
import { toast } from '@/components/ui/use-toast';

function ProfilePageContent() {
  const { user, role } = useAuth();
  const { getServiceByName } = useServices();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [recurringInstances, setRecurringInstances] = useState<{
    booking_id: string;
    date: string;
    hour: string;
    status: boolean;
    service_type?: string;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { sendRecurringCreatedProfile, sendRecurringCancelledProfile, sendBookingCancellationProfile } = useBookingNotifications();
  // Recurring UI state
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30);
  const [preview, setPreview] = useState<{ date: string; time: string; available: boolean; reason?: string }[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Calendar selection state
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });

  useEffect(() => {
    let isMounted = true;
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError('Error fetching profile data.');
          console.error(profileError);
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (bookingsError) {
          setError('Error fetching bookings.');
          console.error('Bookings fetch error:', bookingsError);
        } else if (isMounted) {
          setBookings(bookingsData);
        }

        // Fetch recurring plan instances for this user's recurring bookings
        const { data: recurringRoots } = await supabase
          .from('bookings')
          .select('id, service_type, recurring')
          .eq('user_id', user.id)
          .eq('recurring', true);

        const recurringRootIds = (recurringRoots || []).map((b: any) => b.id);
        const serviceTypeByRoot: Record<string, string> = {};
        (recurringRoots || []).forEach((b: any) => { serviceTypeByRoot[b.id] = b.service_type; });

        if (recurringRootIds.length > 0) {
          const { data: recInst } = await supabase
            .from('recurring_bookings')
            .select('booking_id,date,hour,status')
            .in('booking_id', recurringRootIds);
          if (isMounted && recInst) {
            setRecurringInstances(
              recInst.map((r: any) => ({
                booking_id: r.booking_id,
                date: r.date,
                hour: r.hour,
                status: r.status,
                service_type: serviceTypeByRoot[r.booking_id],
              }))
            );
          } else if (isMounted) {
            setRecurringInstances([]);
          }
        } else if (isMounted) {
          setRecurringInstances([]);
        }

        if (isMounted) {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [user, refreshTrigger]);

  const handleEditClick = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };
  // Recurring: open modal and fetch preview
  const handleOpenRecurring = async (booking: any) => {
    setSelectedBooking(booking);
    setRecurringOpen(true);
    setPreview(null);
    setRecurrenceType('weekly');
    setHorizon(30);
  };

  const handlePreviewRecurring = async () => {
    if (!selectedBooking) return;
    setPreviewLoading(true);
    try {
      const result = await previewCreateRecurring(selectedBooking.id, recurrenceType, horizon);
      setPreview(result.preview);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmRecurring = async () => {
    if (!selectedBooking) return;
    try {
      const result = await confirmCreateRecurring(selectedBooking.id, recurrenceType, horizon);
      setRecurringOpen(false);
      setPreview(null);
      setRefreshTrigger(c => c + 1);
      if (result.skippedCount > 0) {
        toast({ title: 'Recurring created with skips', description: `${result.createdCount} created, ${result.skippedCount} skipped.` });
      } else {
        toast({ title: 'Recurring created', description: `${result.createdCount} instances created.` });
      }

      // Send notifications: user email and admin SMS via booking_updated_profile
      try {
        const serviceDetails = getServiceByName(selectedBooking.service_type);
        const serviceId = serviceDetails?.id || null;
        await sendRecurringCreatedProfile({
          bookingId: selectedBooking.id,
          userId: user.id,
          userName: profile?.full_name || user.email,
          userEmail: user.email,
          userPhone: profile?.phone_number || '',
          serviceName: selectedBooking.service_type,
          serviceId,
          serviceProvider: 'Melinda',
          bookingDate: selectedBooking.booking_date,
          bookingTime: selectedBooking.booking_time,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 140.0,
          notes: `${recurrenceType} for ${horizon} days`,
          status: 'recurring_enabled',
        });
      } catch (e) {
        console.error('Error sending recurring creation notification:', e);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCancelRecurring = async (booking: any) => {
    try {
      const ok = window.confirm('Cancel recurring and remove all future instances?');
      if (!ok) return;
      const res = await cancelRecurring(booking.id);
      setRefreshTrigger(c => c + 1);
      toast({ title: 'Recurring cancelled', description: `${res.deletedCount} future instances removed.` });

      // Send notifications: user email and admin SMS via booking_updated_profile
      try {
        const serviceDetails = getServiceByName(booking.service_type);
        const serviceId = serviceDetails?.id || null;
        await sendRecurringCancelledProfile({
          bookingId: booking.id,
          userId: user.id,
          userName: profile?.full_name || user.email,
          userEmail: user.email,
          userPhone: profile?.phone_number || '',
          serviceName: booking.service_type,
          serviceId,
          serviceProvider: 'Melinda',
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 140.0,
          status: 'recurring_cancelled',
        });
      } catch (e) {
        console.error('Error sending recurring cancellation notification:', e);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleCancelBooking = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      // Get service details from the database
      const serviceDetails = getServiceByName(booking.service_type);
      const serviceId = serviceDetails?.id || null;

      // Delete the booking from the database
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (error) {
        throw error;
      }

      // Remove the booking from the local state
      setBookings(prev => prev.filter(b => b.id !== booking.id));

      // Send cancellation notification
      try {
        await sendBookingCancellationProfile({
          bookingId: booking.id,
          userId: user.id,
          userName: profile?.full_name || user.email,
          userEmail: user.email,
          userPhone: profile?.phone_number || '',
          serviceName: booking.service_type,
          serviceId: serviceId,
          serviceProvider: 'Melinda',
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          duration: serviceDetails?.duration || 60,
          price: serviceDetails?.price || 140.00,
          status: 'cancelled'
        });
      } catch (notificationError) {
        console.error('Error sending cancellation notification:', notificationError);
      }

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBackClick = () => {
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/home');
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>You are not logged in.</p>
        <Button onClick={() => navigate('/')} className="ml-4">Go to Login</Button>
      </div>
    );
  }

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

  // Helper to format just a datetime string as 'HH:mm | DD/MM/YYYY'
  function formatDateTime(dateStr: string) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())} | ${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  // Calendar modifiers data (for color coding)
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const toKey = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  };
  const recurringSet = new Set<string>();
  const pastBookedSet = new Set<string>();
  const futureBookedSet = new Set<string>();

  // Mark original recurring booking date as recurring (green)
  bookings.forEach((b: any) => {
    const key = toKey(b.booking_date);
    if (b.recurring) recurringSet.add(key);
  });

  // Mark planned recurring instances (green) from recurring_bookings
  // Only mark as green if the instance status is TRUE
  recurringInstances.forEach((r) => {
    const d = new Date(r.date);
    d.setHours(0,0,0,0);
    const key = d.toISOString().slice(0,10);
    if (r.status) {
      recurringSet.add(key);
    }
  });

  // Non-recurring booked dates
  bookings.forEach((b: any) => {
    const d = new Date(b.booking_date);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0,10);
    if (!b.recurring) {
      if (d < todayMidnight) pastBookedSet.add(key);
      else if (d > todayMidnight) futureBookedSet.add(key);
    }
  });

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-800 p-6 flex-col">
        <h2 className="text-2xl font-bold mb-8 text-violet-400">My Account</h2>
        <nav className="flex flex-col space-y-4">
          <button
            onClick={() => setActiveView('details')}
            className={`flex items-center space-x-3 text-lg rounded-md p-2 transition-colors ${
              activeView === 'details' ? 'bg-violet-600/50 text-white' : 'hover:bg-gray-700'
            }`}
          >
            <User />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setActiveView('bookings')}
            className={`flex items-center space-x-3 text-lg rounded-md p-2 transition-colors ${
              activeView === 'bookings' ? 'bg-violet-600/50 text-white' : 'hover:bg-gray-700'
            }`}
          >
            <Calendar />
            <span>Bookings</span>
          </button>
        </nav>
        <Button
          onClick={handleLogout}
          className="w-full mt-auto bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold flex items-center justify-center space-x-2"
        >
          <LogOut />
          <span>Logout</span>
        </Button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleBackClick} className="mr-3 md:mr-0">
              <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            <h1 className="text-lg md:text-2xl font-semibold">Profile Overview</h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-gray-300 hover:text-white hover:bg-white/10"
              onClick={handleMobileMenuToggle}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </header>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-800/90 border-b border-gray-700">
            <div className="px-4 py-3">
              <div className="text-sm font-medium text-gray-400 mb-2 px-2">Navigation</div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-12 text-left ${
                    activeView === 'details'
                      ? "bg-violet-400/20 text-violet-300"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => handleViewChange('details')}
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile Details
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-12 text-left ${
                    activeView === 'bookings'
                      ? "bg-violet-400/20 text-violet-300"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                  onClick={() => handleViewChange('bookings')}
                >
                  <Calendar className="mr-3 h-5 w-5" />
                  Bookings
                </Button>
              </div>
              <div className="mt-4 pt-2 border-t border-gray-700">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {error && <div className="bg-red-900/50 text-red-300 p-4 rounded-md mb-6 md:mb-8">{error}</div>}
          
          {activeView === 'details' && (
            <section id="profile-details">
              <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-violet-300 border-b border-gray-700 pb-2 flex items-center justify-between">
                Profile Details
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="ml-2"
                  aria-label="Edit Profile"
                >
                  <Edit className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 bg-gray-800/50 p-4 md:p-6 rounded-lg mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-400">Full Name</label>
                  <p className="text-base md:text-lg mt-1">{profile.full_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Email Address</label>
                  <p className="text-base md:text-lg mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Phone Number</label>
                  <p className="text-base md:text-lg mt-1 text-gray-500">{profile.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Account Role</label>
                  <p className="text-base md:text-lg mt-1 capitalize">{role}</p>
                </div>
              </div>
              
              {/* Password Change Section */}
              <div className="bg-gray-800/50 p-4 md:p-6 rounded-lg mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-violet-300 mb-2 md:mb-0">Password</h3>
                  <Button
                    variant="outline"
                    onClick={() => setIsPasswordChangeOpen(true)}
                    className="border-gray-600 text-gray-800 hover:bg-gray-700 w-full md:w-auto"
                  >
                    Change Password
                  </Button>
                </div>
                <p className="text-gray-400 text-sm">
                  Keep your account secure by regularly updating your password.
                </p>
              </div>
              
              {/* Notification Preferences */}
              <NotificationPreferences 
                userId={user.id} 
                userRole={role} 
              />
              {role === 'admin' && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mt-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Note:</strong> SMS notifications are always sent to the Head admin regardless of preferences. 
                    Email preferences only control email notifications.
                  </p>
                </div>
              )}
              
              <EditProfileModal
                open={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                userId={user.id}
                currentName={profile.full_name || ''}
                currentPhone={profile.phone_number || ''}
                onSuccess={(newName, newPhone) => {
                  setProfile((prev) => ({ ...prev, full_name: newName, phone_number: newPhone }));
                }}
              />
              
              <PasswordChangeModal
                open={isPasswordChangeOpen}
                onClose={() => setIsPasswordChangeOpen(false)}
              />
            </section>
          )}

          {activeView === 'bookings' && (
            <section id="booking-history">
              <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-violet-300 border-b border-gray-700 pb-2">Bookings</h2>
              
              {/* Side-by-side layout: Calendar on left, Bookings on right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                               {/* Calendar view - Left side */}
               <div className="bg-gray-800/50 rounded-lg p-4">
                 <div className="mb-3 text-gray-300">Select a date to view bookings.</div>
                 <div className="flex justify-center">
                   <UICalendar
                     mode="single"
                     selected={selectedDay}
                     onSelect={(d) => { if (d) { d.setHours(0,0,0,0); setSelectedDay(d); } }}
                      className="rounded-md border border-gray-600 bg-gray-800 text-violet-300 p-3 md:p-4"
                     classNames={{
                        day: "h-12 w-12 md:h-14 md:w-14 p-0 font-normal aria-selected:opacity-100 rounded-lg transition-all duration-200 hover:scale-110 hover:bg-violet-500/20 cursor-pointer",
                        head_cell: "text-muted-foreground rounded-md w-12 md:w-14 font-normal text-xs md:text-sm",
                        cell: "h-12 w-12 md:h-14 md:w-14 text-center text-xs md:text-sm p-0 relative",
                     }}
                      modifiers={{
                        today: (date) => date.toDateString() === todayMidnight.toDateString(),
                        recurring: (date) => recurringSet.has(date.toISOString().slice(0,10)),
                        pastBooked: (date) => pastBookedSet.has(date.toISOString().slice(0,10)),
                        futureBooked: (date) => futureBookedSet.has(date.toISOString().slice(0,10)),
                      }}
                      modifiersClassNames={{
                        today: "bg-blue-600 text-white rounded-lg shadow-lg",
                        recurring: "bg-green-600/60 text-white rounded-lg shadow-lg",
                        pastBooked: "bg-violet-900 text-white rounded-lg shadow-lg",
                        futureBooked: "bg-purple-600 text-white rounded-lg shadow-lg",
                      }}
                    />
                  </div>
                </div>

                {/* Bookings list - Right side */}
                <div className="lg:min-h-[600px]">
                  <BookingsList
                    selectedDay={selectedDay}
                    bookings={bookings}
                    recurringInstances={recurringInstances}
                    onEditClick={handleEditClick}
                    onCancelBooking={handleCancelBooking}
                    onOpenRecurring={handleOpenRecurring}
                    onCancelRecurring={handleCancelRecurring}
                    user={user}
                  />
                </div>
              </div>
            </section>
          )}
        </main>
        {/* Recurring Modal */}
        {recurringOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-lg p-6">
              <h3 className="text-xl font-semibold text-violet-300 mb-4">Do you wish to make this booking recurring?</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Recurrence</label>
                    <select
                      value={recurrenceType}
                      onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Duration</label>
                    <select
                      value={horizon}
                      onChange={(e) => setHorizon(Number(e.target.value) as 30 | 60 | 90)}
                      className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
                    >
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={handlePreviewRecurring} disabled={previewLoading} className="bg-violet-600 hover:bg-violet-700 text-white">
                    {previewLoading ? 'Previewing...' : 'Preview'}
                  </Button>
                  <Button variant="outline" onClick={() => setRecurringOpen(false)} className="border-gray-600 text-gray-600 hover:bg-gray-800">
                    Close
                  </Button>
                </div>

                {preview && (
                  <div className="max-h-64 overflow-auto border border-gray-700 rounded p-3 bg-gray-800">
                    <div className="text-sm text-gray-300 mb-2">Preview ({preview.length} dates)</div>
                    <ul className="space-y-1 text-sm">
                      {preview.map((p, idx) => (
                        <li key={idx} className={p.available ? 'text-green-300' : 'text-gray-400'}>
                          {p.date} at {p.time} {p.available ? '' : `(unavailable: ${p.reason})`}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      {preview.some(p => !p.available) && (
                        <div className="text-xs text-yellow-300">Some dates are unavailable. Proceeding will create only available instances.</div>
                      )}
                    </div>
                    <div className="mt-3">
                      <Button onClick={handleConfirmRecurring} className="bg-green-600 hover:bg-green-700 text-white">
                        Confirm Recurring
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <EditBookingModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          booking={selectedBooking}
          onBookingUpdated={() => setRefreshTrigger(c => c + 1)}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <BookingsProvider>
      <AvailabilitiesProvider>
        <ProfilePageContent />
      </AvailabilitiesProvider>
    </BookingsProvider>
  );
} 