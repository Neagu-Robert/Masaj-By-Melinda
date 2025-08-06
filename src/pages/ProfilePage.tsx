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
import { useBookingNotifications } from '@/services/notifications/hooks';
import { toast } from '@/components/ui/use-toast';

function ProfilePageContent() {
  const { user, role } = useAuth();
  const { getServiceByName } = useServices();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeView, setActiveView] = useState('details');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { sendBookingCancellationProfile } = useBookingNotifications();

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
              {(() => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const todayStr = today.toISOString().slice(0,10);
                const future = bookings.filter(b => {
                  const d = new Date(b.booking_date);
                  d.setHours(0,0,0,0);
                  return d > today;
                }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
                const todayBookings = bookings.filter(b => {
                  const d = new Date(b.booking_date);
                  d.setHours(0,0,0,0);
                  return d.getTime() === today.getTime();
                }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
                const past = bookings.filter(b => {
                  const d = new Date(b.booking_date);
                  d.setHours(0,0,0,0);
                  return d < today;
                }).sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
                return <>
                  <div className="mb-8 md:mb-10">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-green-300">Future Bookings</h3>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-gray-800/50 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-700/50 border-b-gray-700">
                            <TableHead className="text-white">Service</TableHead>
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Created</TableHead>
                            <TableHead className="text-white">Updated</TableHead>
                            <TableHead className="text-white">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {future.length > 0 ? future.map((booking) => (
                            <TableRow key={booking.id} className="border-b-gray-800">
                              <TableCell>{booking.service_type}</TableCell>
                              <TableCell>{formatBookingDateTime(booking.booking_date, booking.booking_time)}</TableCell>
                              <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                              <TableCell>{booking.updated_at ? formatDateTime(booking.updated_at) : '—'}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(booking)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleCancelBooking(booking)} className="text-red-400 hover:text-red-300">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                No future bookings.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {future.length > 0 ? future.map((booking) => (
                        <Card key={booking.id} className="bg-gray-800/50 border-gray-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-1">Service</div>
                                <div className="text-white font-medium">{booking.service_type}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Date</div>
                                <div className="text-white text-sm">{formatBookingDateTime(booking.booking_date, booking.booking_time)}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-1">Created</div>
                                <div className="text-white text-sm">{formatDateTime(booking.created_at)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Updated</div>
                                <div className="text-white text-sm">{booking.updated_at ? formatDateTime(booking.updated_at) : '—'}</div>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-700">
                              <Button variant="ghost" size="sm" onClick={() => handleEditClick(booking)} className="text-white hover:text-gray-300">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleCancelBooking(booking)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        )) : (
                          <div className="text-center py-8 text-gray-400">
                            No future bookings.
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="mb-8 md:mb-10">
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-blue-300">Today's Bookings</h3>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-gray-800/50 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-700/50 border-b-gray-700">
                            <TableHead className="text-white">Service</TableHead>
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Created</TableHead>
                            <TableHead className="text-white">Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {todayBookings.length > 0 ? todayBookings.map((booking) => (
                            <TableRow key={booking.id} className="border-b-gray-800">
                              <TableCell>{booking.service_type}</TableCell>
                              <TableCell>{formatBookingDateTime(booking.booking_date, booking.booking_time)}</TableCell>
                              <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                              <TableCell>{booking.updated_at ? formatDateTime(booking.updated_at) : '—'}</TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                                No bookings for today.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {todayBookings.length > 0 ? todayBookings.map((booking) => (
                        <Card key={booking.id} className="bg-gray-800/50 border-gray-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-1">Service</div>
                                <div className="text-white font-medium">{booking.service_type}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Date</div>
                                <div className="text-white text-sm">{formatBookingDateTime(booking.booking_date, booking.booking_time)}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-1">Created</div>
                                <div className="text-white text-sm">{formatDateTime(booking.created_at)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Updated</div>
                                <div className="text-white text-sm">{booking.updated_at ? formatDateTime(booking.updated_at) : '—'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )) : (
                        <div className="text-center py-8 text-gray-400">
                          No bookings for today.
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-4 text-violet-300">Past Bookings</h3>
                    {/* Desktop Table View */}
                    <div className="hidden md:block bg-gray-800/50 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-700/50 border-b-gray-700">
                            <TableHead className="text-white">Service</TableHead>
                            <TableHead className="text-white">Date</TableHead>
                            <TableHead className="text-white">Created</TableHead>
                            <TableHead className="text-white">Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {past.length > 0 ? past.map((booking) => (
                            <TableRow key={booking.id} className="border-b-gray-800">
                              <TableCell>{booking.service_type}</TableCell>
                              <TableCell>{formatBookingDateTime(booking.booking_date, booking.booking_time)}</TableCell>
                              <TableCell>{formatDateTime(booking.created_at)}</TableCell>
                              <TableCell>{booking.updated_at ? formatDateTime(booking.updated_at) : '—'}</TableCell>
                            </TableRow>
                          )) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-400">
                                No past bookings.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                      {past.length > 0 ? past.map((booking) => (
                        <Card key={booking.id} className="bg-gray-800/50 border-gray-700">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-1">Service</div>
                                <div className="text-white font-medium">{booking.service_type}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Date</div>
                                <div className="text-white text-sm">{formatBookingDateTime(booking.booking_date, booking.booking_time)}</div>
                              </div>
                            </div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm text-gray-400 mb-1">Created</div>
                                <div className="text-white text-sm">{formatDateTime(booking.created_at)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-gray-400 mb-1">Updated</div>
                                <div className="text-white text-sm">{booking.updated_at ? formatDateTime(booking.updated_at) : '—'}</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )) : (
                        <div className="text-center py-8 text-gray-400">
                          No past bookings.
                        </div>
                      )}
                    </div>
                  </div>
                </>;
              })()}
            </section>
          )}
        </main>
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