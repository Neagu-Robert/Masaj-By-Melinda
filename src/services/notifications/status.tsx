import { useState, useEffect } from 'react';
import { testNotificationConfig } from './testApiKey';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ConfigStatus {
  sendgrid: {
    isLoaded: boolean;
    maskedKey: string;
    isEnabled: boolean;
  };
  infobip: {
    isConfigured: boolean;
    isEnabled: boolean;
    apiKey?: string;
    senderNumber?: string;
  };
}

export function NotificationConfigStatus() {
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const configStatus = testNotificationConfig();
      setStatus(configStatus);
    } catch (err) {
      setError(err.message || 'Failed to load notification configuration status');
    }
  }, []);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!status) {
    return <div>Loading configuration status...</div>;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <h2 className="text-xl font-semibold">Notification System Status</h2>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">SendGrid (Email)</h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">API Key:</span>
          {status.sendgrid.isLoaded ? (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Loaded
            </Badge>
          ) : (
            <Badge className="bg-red-500">
              <XCircle className="h-3 w-3 mr-1" />
              Not Loaded
            </Badge>
          )}
          {status.sendgrid.isLoaded && (
            <span className="text-sm text-muted-foreground">
              {status.sendgrid.maskedKey}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">Email Notifications:</span>
          {status.sendgrid.isEnabled ? (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          ) : (
            <Badge className="bg-amber-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              Disabled
            </Badge>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Infobip (SMS)</h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">Configuration:</span>
          {status.infobip.isConfigured ? (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configured
            </Badge>
          ) : (
            <Badge className="bg-red-500">
              <XCircle className="h-3 w-3 mr-1" />
              Not Configured
            </Badge>
          )}
        </div>
        
        {status.infobip.isConfigured && status.infobip.apiKey && (
          <div className="flex items-center gap-2">
            <span className="font-medium">API Key:</span>
            <span className="text-sm text-muted-foreground">
              {status.infobip.apiKey}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="font-medium">SMS Notifications:</span>
          {status.infobip.isEnabled && status.infobip.isConfigured ? (
            <Badge className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          ) : (
            <Badge className="bg-amber-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              {status.infobip.isEnabled ? 'Configured Required' : 'Disabled'}
            </Badge>
          )}
        </div>
        
        {status.infobip.isConfigured && status.infobip.senderNumber && (
          <div className="flex items-center gap-2">
            <span className="font-medium">Sender Number:</span>
            <span>{status.infobip.senderNumber}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Both email and SMS functionality are now fully operational via Supabase Edge Functions.
        </p>
      </div>
    </div>
  );
} 