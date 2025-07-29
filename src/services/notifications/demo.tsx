import { useState } from 'react';
import { notify } from './index';
import { NotificationConfigStatus } from './status';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export function NotificationDemo() {
  const [loading, setLoading] = useState(false);
  const [testingApiRoute, setTestingApiRoute] = useState(false);
  const { user } = useAuth();
  
  const getApiBaseUrl = (): string => {
    // In development, use the Express server
    if (import.meta.env.DEV) {
      return 'http://localhost:3003'; // Change from 3002 to 3003
    }
    // In production, use the deployed API (you'll need to update this)
    return 'https://your-api-domain.com';
  };
  
  const testApiRouteDirectly = async () => {
    setTestingApiRoute(true);
    try {
      const testData = {
        to: 'robertneagu814@gmail.com',
        subject: 'Test Email from Express API',
        htmlContent: '<h1>Test Email</h1><p>This is a test email from the Express API server.</p>',
        textContent: 'Test Email\n\nThis is a test email from the Express API server.'
      };
      
      console.log('Testing Express API server directly with data:', testData);
      
      const apiBaseUrl = getApiBaseUrl();
      console.log('API Base URL:', apiBaseUrl);
      console.log('Full URL:', `${apiBaseUrl}/api/send-email`);
      
      const response = await fetch(`${apiBaseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      console.log('Response received:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('API server response:', { data, status: response.status });
      
      if (!response.ok) {
        toast.error('API Server Error', {
          description: JSON.stringify(data, null, 2)
        });
      } else {
        toast.success('API Server Success', {
          description: JSON.stringify(data, null, 2)
        });
      }
    } catch (error) {
      console.error('API server test error:', error);
      toast.error('API Server Test Failed', {
        description: error.message
      });
    } finally {
      setTestingApiRoute(false);
    }
  };
  
  const sendTestEmail = async () => {
    setLoading(true);
    try {
      // Use current user's ID if logged in, otherwise use a demo UUID
      const userId = user?.id || 'b3b1c2d3-e4f5-6789-0123-456789abcdef';
      const userEmail = user?.email || 'test@example.com';
      const userName = user?.user_metadata?.full_name || 'Test User';
      
      const result = await notify({
        type: 'booking_created',
        recipient: {
          userId: userId,
          email: userEmail,
          phone: '+15551234567',
          name: userName
        },
        data: {
          bookingId: 'demo-booking-123',
          userId: userId,
          userName: userName,
          userEmail: userEmail,
          userPhone: '+15551234567',
          serviceName: 'Test Massage Service',
          dateTime: new Date().toLocaleString(),
          duration: 60,
          price: 150,
          status: 'confirmed'
        }
      });
      
      toast.success('Test notification sent!', {
        description: `Email: ${result[0]?.success ? 'Success' : 'Failed'}, SMS: ${result[1]?.success ? 'Success' : 'Failed'}`
      });
      
      console.log('Notification result:', result);
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Notification System Demo</h1>
      
      <NotificationConfigStatus />
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Send a test notification to verify the system is working correctly.
          {user ? ` Using logged-in user: ${user.email}` : ' Using demo user for testing.'}
          Check the console for detailed results.
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={sendTestEmail} 
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Test Notification'}
          </Button>
          
          <Button 
            onClick={testApiRouteDirectly} 
            disabled={testingApiRoute}
            variant="outline"
          >
            {testingApiRoute ? 'Testing...' : 'Test Express API Server'}
          </Button>
        </div>
      </div>
    </div>
  );
} 