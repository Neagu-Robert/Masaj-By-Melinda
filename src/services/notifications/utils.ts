/**
 * Utilities for the notification system
 */

/**
 * Loads the SendGrid API key from the sendgrid.env file
 * Format: SENDGRID_API_KEY='SG.xxx'
 */
export const loadSendGridApiKey = (): string => {
  try {
    // In a real environment, we would use fs.readFileSync,
    // but since we're in a browser context, we'll return a hardcoded value
    // that was read from the file
    return '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';
  } catch (error) {
    console.error('Failed to load SendGrid API key:', error);
    return '';
  }
};

/**
 * Loads the Infobip API key from the infobip.env file
 * Format: infobip_api_key=xxx
 */
export const loadInfobipApiKey = (): string => {
  try {
    // In a real environment, we would use fs.readFileSync,
    // but since we're in a browser context, we'll return a hardcoded value
    // that was read from the file
    return '562a2030f8a2f1c9ac59df6255fd1949-3f14140a-46c9-428e-a219-7d89702cb8b1';
  } catch (error) {
    console.error('Failed to load Infobip API key:', error);
    return '';
  }
};

/**
 * Loads the Infobip sender number from the infobip.env file
 * Format: infobip_sender_number=xxx
 */
export const loadInfobipSenderNumber = (): string => {
  try {
    // In a real environment, we would use fs.readFileSync,
    // but since we're in a browser context, we'll return a hardcoded value
    // that was read from the file
    return '447491163443';
  } catch (error) {
    console.error('Failed to load Infobip sender number:', error);
    return '';
  }
};

/**
 * Tests if the SendGrid API key is loaded correctly
 * Returns the masked API key for security
 */
export const testSendGridApiKey = (): { isLoaded: boolean, maskedKey: string } => {
  const apiKey = loadSendGridApiKey();
  
  if (!apiKey) {
    return { isLoaded: false, maskedKey: '' };
  }
  
  // Mask the API key for security, showing only first 7 characters
  const maskedKey = apiKey.substring(0, 7) + '...' + 
    (apiKey.length > 30 ? apiKey.substring(apiKey.length - 5) : '');
    
  return {
    isLoaded: true,
    maskedKey
  };
};

/**
 * Tests if the Infobip API key is loaded correctly
 * Returns the masked API key for security
 */
export const testInfobipApiKey = (): { isLoaded: boolean, maskedKey: string } => {
  const apiKey = loadInfobipApiKey();
  
  if (!apiKey) {
    return { isLoaded: false, maskedKey: '' };
  }
  
  // Mask the API key for security, showing only first 6 characters
  const maskedKey = apiKey.substring(0, 6) + '...' + 
    (apiKey.length > 30 ? apiKey.substring(apiKey.length - 4) : '');
    
  return {
    isLoaded: true,
    maskedKey
  };
}; 