import { 
  SENDGRID_API_KEY, 
  SENDGRID_FROM_EMAIL,
  SENDGRID_FROM_NAME,
  INFOBIP_API_KEY,
  INFOBIP_SENDER_NUMBER
} from './config';

interface TestResult {
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

export const testNotificationConfig = (): TestResult => {
  // Test SendGrid configuration
  const sendgridResult = {
    isLoaded: !!SENDGRID_API_KEY,
    maskedKey: SENDGRID_API_KEY ? 
      (SENDGRID_API_KEY.substring(0, 6) + '...' + 
       (SENDGRID_API_KEY.length > 10 ? SENDGRID_API_KEY.substring(SENDGRID_API_KEY.length - 4) : '')) : 
      'Not loaded',
    isEnabled: !!SENDGRID_API_KEY && !!SENDGRID_FROM_EMAIL
  };

  // Test Infobip configuration
  const infobipResult = {
    isConfigured: !!INFOBIP_API_KEY && !!INFOBIP_SENDER_NUMBER,
    isEnabled: !!INFOBIP_API_KEY && !!INFOBIP_SENDER_NUMBER,
    apiKey: INFOBIP_API_KEY ?
      (INFOBIP_API_KEY.substring(0, 6) + '...' +
       (INFOBIP_API_KEY.length > 10 ? INFOBIP_API_KEY.substring(INFOBIP_API_KEY.length - 4) : '')) :
      undefined,
    senderNumber: INFOBIP_SENDER_NUMBER || undefined
  };

  const testResult: TestResult = {
    sendgrid: sendgridResult,
    infobip: infobipResult
  };

  // Log configuration status
  console.log('SendGrid Email Status:',
    testResult.sendgrid.isLoaded ?
      `Configured (Key: ${testResult.sendgrid.maskedKey})` :
      'Not configured'
  );

  // Log Infobip status
  console.log('Infobip SMS Status:',
    testResult.infobip.isConfigured ?
      `Configured (API Key: ${testResult.infobip.apiKey})` :
      'Not configured'
  );

  console.log('Notification System Status:',
    (testResult.sendgrid.isEnabled && testResult.sendgrid.isEnabled) ?
      'Fully configured' :
      'Partially configured or disabled'
  );

  return testResult;
};

// Run test immediately when this module is imported
const testResult = testNotificationConfig();

// Log SendGrid status
console.log('SendGrid API Key Status:', 
  testResult.sendgrid.isLoaded ? 
  `Loaded (${testResult.sendgrid.maskedKey})` : 
  'Not loaded');
console.log('Email notifications enabled:', testResult.sendgrid.isEnabled ? 'Yes' : 'No');

// Log Infobip status
console.log('Infobip SMS Status:', 
  testResult.infobip.isConfigured ? 
  `Configured (API Key: ${testResult.infobip.apiKey})` : 
  'Not configured');
console.log('SMS notifications enabled:', 
  (testResult.infobip.isEnabled && testResult.infobip.isConfigured) ? 
  'Yes' : 
  'No'); 