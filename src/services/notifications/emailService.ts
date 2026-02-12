import { 
  BREVO_FROM_EMAIL, 
  BREVO_FROM_NAME,
  EMAIL_NOTIFICATIONS_ENABLED 
} from './config';
import { 
  NotificationPayload, 
  NotificationResult, 
  BookingNotificationData 
} from './types';
import { logNotification } from './loggingService';

// Email templates
const emailTemplates = {
  booking_created_customer: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const isUnconfirmed = data.status === 'unconfirmed';
    const hasTextRequest = !!data.requestedDateText;
    
    const subject = hasTextRequest
      ? `Cerere de Rezervare Primită - În Așteptare Aprobare - ${data.serviceName}`
      : isUnconfirmed 
        ? `Rezervare Primită - Așteptare Aprobare - ${data.serviceName}`
        : `Confirmare Rezervare - ${data.serviceName}`;
    
    const html = hasTextRequest ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Cerere de Rezervare Primită - În Așteptare</h2>
        <p>Dragă ${data.userName},</p>
        <p>Cererea dumneavoastră de rezervare a fost primită și este în așteptarea aprobării administratorului.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Cererea Dumneavoastră:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Data dorită:</strong> ${data.requestedDateText}</p>
          <p><strong>Ora preferată:</strong> ${data.requestedTimeText || 'Nu ați specificat'}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">În așteptare de aprobare</span></p>
        </div>
        <p style="color: #f59e0b;"><strong>Notă importantă:</strong> Cererea dumneavoastră este în așteptare de aprobare. Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${isUnconfirmed ? '#f59e0b' : '#8b5cf6'};">${isUnconfirmed ? 'Rezervare Primită - În Așteptare' : 'Confirmare Rezervare'}</h2>
        <p>Dragă ${data.userName},</p>
        <p>${isUnconfirmed ? 'Rezervarea dumneavoastră a fost primită și este în așteptarea aprobării administratorului.' : 'Rezervarea dumneavoastră a fost confirmată cu succes!'}</p>
        <div style="background-color: ${isUnconfirmed ? '#fffbeb' : '#f8fafc'}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> ${isUnconfirmed ? 'În așteptare de aprobare' : 'Confirmat'}</p>
        </div>
        ${isUnconfirmed ? '<p style="color: #f59e0b;"><strong>Notă:</strong> Veți primi un email de confirmare după ce administratorul va aproba rezervarea. Data și ora pot fi ajustate dacă este necesar.</p>' : '<p>Vă așteptăm cu drag!</p>'}
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    
    const text = hasTextRequest ? `
      Cerere de Rezervare Primită - În Așteptare
      
      Dragă ${data.userName},
      
      Cererea dumneavoastră de rezervare a fost primită și este în așteptarea aprobării administratorului.
      
      Cererea Dumneavoastră:
      - Serviciu: ${data.serviceName}
      - Data dorită: ${data.requestedDateText}
      - Ora preferată: ${data.requestedTimeText || 'Nu ați specificat'}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      - Status: În așteptare de aprobare
      
      Notă importantă: Cererea dumneavoastră este în așteptare de aprobare. Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.
      
      Cu respect,
      Masaj by Melinda
    ` : `
      ${isUnconfirmed ? 'Rezervare Primită - În Așteptare' : 'Confirmare Rezervare'}
      
      Dragă ${data.userName},
      
      ${isUnconfirmed ? 'Rezervarea dumneavoastră a fost primită și este în așteptarea aprobării administratorului.' : 'Rezervarea dumneavoastră a fost confirmată cu succes!'}
      
      Detalii Rezervare:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      - Status: ${isUnconfirmed ? 'În așteptare de aprobare' : 'Confirmat'}
      
      ${isUnconfirmed ? 'Notă: Veți primi un email de confirmare după ce administratorul va aproba rezervarea. Data și ora pot fi ajustate dacă este necesar.' : 'Vă așteptăm cu drag!'}
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_updated_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Rezervare Actualizată - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Rezervare Actualizată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost actualizată cu succes!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Actualizate ale Rezervării:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>Dacă aveți întrebări, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Actualizată
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost actualizată cu succes!
      
      Detalii Actualizate ale Rezervării:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      - Status: ${data.status}
      
      Dacă aveți întrebări, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_updated_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Rezervare Actualizată de Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Rezervare Actualizată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost actualizată de către personalul nostru.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Actualizate ale Rezervării:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> ${data.status}</p>
        </div>
        <p>Dacă aveți întrebări despre aceste modificări, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Actualizată de Admin
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost actualizată de către personalul nostru.
      
      Detalii Actualizate ale Rezervării:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      - Status: ${data.status}
      
      Dacă aveți întrebări despre aceste modificări, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_cancelled_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Rezervare Anulată - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Anulată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost anulată.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare Anulată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
        </div>
        <p>Dacă aveți întrebări sau doriți să reprogramați, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Anulată
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost anulată.
      
      Detalii Rezervare Anulată:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      
      Dacă aveți întrebări sau doriți să reprogramați, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_cancelled_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Rezervare Anulată de Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Anulată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost anulată de către personalul nostru.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare Anulată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
        </div>
        <p>Dacă aveți întrebări despre această anulare, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Anulată de Admin
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost anulată de către personalul nostru.
      
      Detalii Rezervare Anulată:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      
      Dacă aveți întrebări despre această anulare, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  // Recurring created by user from profile
  recurring_created_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurență Activată - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Rezervare Recurentă Activată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost setată să fie recurentă.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Recurență:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Început:</strong> ${data.dateTime}</p>
          <p><strong>Recurență:</strong> ${data.notes || 'Săptămânal/La două săptămâni'}</p>
        </div>
        <p>Puteți dezactiva recurența oricând din profilul dumneavoastră.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Recurentă Activată
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost setată să fie recurentă.
      
      Detalii Recurență:
      - Serviciu: ${data.serviceName}
      - Început: ${data.dateTime}
      - Recurență: ${data.notes || 'Săptămânal/La două săptămâni'}
      
      Puteți dezactiva recurența oricând din profilul dumneavoastră.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  // Recurring cancelled by user from profile
  recurring_cancelled_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurență Dezactivată - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Recurentă Dezactivată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră recurentă a fost anulată. Instanțele viitoare au fost eliminate.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Recurență Anulată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Original:</strong> ${data.dateTime}</p>
        </div>
        <p>Dacă a fost o greșeală, puteți reactiva recurența din profilul dumneavoastră.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Recurentă Dezactivată
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră recurentă a fost anulată. Instanțele viitoare au fost eliminate.
      
      Recurență Anulată:
      - Serviciu: ${data.serviceName}
      - Original: ${data.dateTime}
      
      Dacă a fost o greșeală, puteți reactiva recurența din profilul dumneavoastră.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  // Recurring created by admin
  recurring_created_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurență Activată de Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Rezervare Recurentă Activată (Admin)</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost setată să fie recurentă de către personalul nostru.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Recurență:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Început:</strong> ${data.dateTime}</p>
          <p><strong>Recurență:</strong> ${data.notes || 'Săptămânal/La două săptămâni'}</p>
        </div>
        <p>Dacă nu a fost intenționat, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Recurentă Activată (Admin)
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost setată să fie recurentă de către personalul nostru.
      
      Detalii Recurență:
      - Serviciu: ${data.serviceName}
      - Început: ${data.dateTime}
      - Recurență: ${data.notes || 'Săptămânal/La două săptămâni'}
      
      Dacă nu a fost intenționat, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  // Recurring cancelled by admin
  recurring_cancelled_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Recurență Dezactivată de Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Recurentă Dezactivată (Admin)</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră recurentă a fost anulată de către personalul nostru. Instanțele viitoare au fost eliminate.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Recurență Anulată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Original:</strong> ${data.dateTime}</p>
        </div>
        <p>Dacă nu a fost intenționat, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Recurentă Dezactivată (Admin)
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră recurentă a fost anulată de către personalul nostru. Instanțele viitoare au fost eliminate.
      
      Recurență Anulată:
      - Serviciu: ${data.serviceName}
      - Original: ${data.dateTime}
      
      Dacă nu a fost intenționat, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  // Single instance cancelled by user from profile
  recurring_instance_cancelled_profile: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Instanță Recurentă Anulată - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Instanță Recurentă Anulată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Cererea dumneavoastră de a anula o singură instanță recurentă a fost procesată.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Instanță Anulată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p style="margin:0;color:#6b7280;font-size:12px;">Notă: Doar această dată specifică a fost anulată; seria rămâne activă.</p>
        </div>
        <p>Dacă aveți întrebări, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Instanță Recurentă Anulată
      
      Dragă ${data.userName},
      
      Cererea dumneavoastră de a anula o singură instanță recurentă a fost procesată.
      
      Instanță Anulată:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      
      Notă: Doar această dată specifică a fost anulată; seria rămâne activă.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  // Single instance cancelled by admin
  recurring_instance_cancelled_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Instanță Recurentă Anulată de Admin - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Instanță Recurentă Anulată (Admin)</h2>
        <p>Dragă ${data.userName},</p>
        <p>O singură instanță a seriei dumneavoastră recurente a fost anulată de către personalul nostru.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Instanță Anulată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p style="margin:0;color:#6b7280;font-size:12px;">Notă: Doar această dată specifică a fost anulată; seria rămâne activă.</p>
        </div>
        <p>Dacă a fost neașteptat, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Instanță Recurentă Anulată (Admin)
      
      Dragă ${data.userName},
      
      O singură instanță a seriei dumneavoastră recurente a fost anulată de către personalul nostru.
      
      Instanță Anulată:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      
      Notă: Doar această dată specifică a fost anulată; seria rămâne activă.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  reminder: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Memento Programare - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Memento Programare</h2>
        <p>Dragă ${data.userName},</p>
        <p>Acesta este un memento prietenos despre programarea dumneavoastră de mâine.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Programare:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
        </div>
        <p>Vă așteptăm cu drag!</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Memento Programare
      
      Dragă ${data.userName},
      
      Acesta este un memento prietenos despre programarea dumneavoastră de mâine.
      
      Detalii Programare:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      
      Vă așteptăm cu drag!
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  password_changed: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Parolă Schimbată cu Succes`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Parolă Schimbată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Parola dumneavoastră a fost schimbată cu succes.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Actualizare Securitate Cont:</h3>
          <p><strong>Cont:</strong> ${data.userEmail}</p>
          <p><strong>Data Modificării:</strong> ${data.dateTime}</p>
        </div>
        <p>Dacă nu ați făcut această modificare, vă rugăm să ne contactați imediat pentru asistență.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Parolă Schimbată cu Succes
      
      Dragă ${data.userName},
      
      Parola dumneavoastră a fost schimbată cu succes.
      
      Actualizare Securitate Cont:
      - Cont: ${data.userEmail}
      - Data Modificării: ${data.dateTime}
      
      Dacă nu ați făcut această modificare, vă rugăm să ne contactați imediat pentru asistență.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  password_reset_requested: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Resetare Parolă Solicitată`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Resetare Parolă Solicitată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Am primit o cerere de resetare a parolei pentru contul dumneavoastră Masaj by Melinda.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Informații Cont:</h3>
          <p><strong>Cont:</strong> ${data.userEmail}</p>
          <p><strong>Data Solicitării:</strong> ${data.dateTime}</p>
        </div>
        <p>Dacă nu ați solicitat această resetare de parolă, vă rugăm să ignorați acest email. Parola dumneavoastră va rămâne neschimbată.</p>
        <p>Dacă ați solicitat această resetare, vă rugăm să verificați emailul pentru linkul de resetare și să urmați instrucțiunile.</p>
        <p>Din motive de securitate, linkurile de resetare a parolei expiră după o perioadă scurtă de timp.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Resetare Parolă Solicitată
      
      Dragă ${data.userName},
      
      Am primit o cerere de resetare a parolei pentru contul dumneavoastră Masaj by Melinda.
      
      Informații Cont:
      - Cont: ${data.userEmail}
      - Data Solicitării: ${data.dateTime}
      
      Dacă nu ați solicitat această resetare de parolă, vă rugăm să ignorați acest email. Parola dumneavoastră va rămâne neschimbată.
      
      Dacă ați solicitat această resetare, vă rugăm să verificați emailul pentru linkul de resetare și să urmați instrucțiunile.
      
      Din motive de securitate, linkurile de resetare a parolei expiră după o perioadă scurtă de timp.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_approval_needed: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const hasTextRequest = !!data.requestedDateText;
    const subject = `Rezervare Primită - În Așteptare Aprobare - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Rezervare Primită - În Așteptare</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost primită cu succes și este în așteptarea aprobării administratorului.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">${hasTextRequest ? 'Cererea Dumneavoastră:' : 'Detalii Rezervare:'}</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          ${hasTextRequest 
            ? `<p><strong>Data dorită:</strong> ${data.requestedDateText}</p>
          <p><strong>Ora preferată:</strong> ${data.requestedTimeText || 'Nu ați specificat'}</p>`
            : `<p><strong>Dată și Oră:</strong> ${data.dateTime}</p>`}
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">În așteptare de aprobare</span></p>
        </div>
        <p style="color: #f59e0b;"><strong>Notă:</strong> Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Primită - În Așteptare
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost primită cu succes și este în așteptarea aprobării administratorului.
      
      ${hasTextRequest ? 'Cererea Dumneavoastră:' : 'Detalii Rezervare:'}
      - Serviciu: ${data.serviceName}
      ${hasTextRequest 
        ? `- Data dorită: ${data.requestedDateText}
      - Ora preferată: ${data.requestedTimeText || 'Nu ați specificat'}`
        : `- Dată și Oră: ${data.dateTime}`}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      - Status: În așteptare de aprobare
      
      Notă: Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_confirmed_by_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Rezervare Confirmată - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Rezervare Confirmată</h2>
        <p>Dragă ${data.userName},</p>
        <p>Rezervarea dumneavoastră a fost confirmată de către administratorul nostru!</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">Detalii Rezervare Confirmată:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
          <p><strong>Durată:</strong> ${data.duration} minute</p>
          <p><strong>Preț:</strong> ${data.price} RON</p>
          <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Confirmat</span></p>
        </div>
        <p style="color: #10b981;"><strong>Rezervarea dumneavoastră este confirmată!</strong> Vă așteptăm cu drag!</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Confirmată
      
      Dragă ${data.userName},
      
      Rezervarea dumneavoastră a fost confirmată de către administratorul nostru!
      
      Detalii Rezervare Confirmată:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      - Durată: ${data.duration} minute
      - Preț: ${data.price} RON
      - Status: Confirmat
      
      Rezervarea dumneavoastră este confirmată! Vă așteptăm cu drag!
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_rejected_by_admin: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    const subject = `Rezervare Respinsă - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Respinsă</h2>
        <p>Dragă ${data.userName},</p>
        <p>Ne pare rău, dar rezervarea dumneavoastră nu a putut fi confirmată.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră Solicitată:</strong> ${data.dateTime}</p>
        </div>
        <p>Vă rugăm să ne contactați pentru a găsi o dată alternativă care să vă convină.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Rezervare Respinsă
      
      Dragă ${data.userName},
      
      Ne pare rău, dar rezervarea dumneavoastră nu a putut fi confirmată.
      
      Detalii Rezervare:
      - Serviciu: ${data.serviceName}
      - Dată și Oră Solicitată: ${data.dateTime}
      
      Vă rugăm să ne contactați pentru a găsi o dată alternativă care să vă convină.
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  },

  booking_suggestion_sent: (data: BookingNotificationData): { subject: string; html: string; text: string } => {
    // Extract suggested date/time from notes field (format: "suggested_date|suggested_time|token")
    const [suggestedDate, suggestedTime, token] = (data.notes || '||').split('|');
    
    const webAppBaseUrl = import.meta.env.DEV ? 'http://localhost:8080' : 'https://masajbymelinda.ro';

    const acceptUrl = `${webAppBaseUrl}/booking-confirmation?token=${token}&action=accept&booking_id=${data.bookingId}`;
    const declineUrl = `${webAppBaseUrl}/booking-confirmation?token=${token}&action=decline&booking_id=${data.bookingId}`;
    
    const subject = `Sugestie Modificare Rezervare - ${data.serviceName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Sugestie Modificare Rezervare</h2>
        <p>Dragă ${data.userName},</p>
        <p>Administratorul nostru vă sugerează o modificare a datei și orei pentru rezervarea dumneavoastră.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Rezervare Originală:</h3>
          <p><strong>Serviciu:</strong> ${data.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${data.dateTime}</p>
        </div>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dată și Oră Sugerată:</h3>
          <p><strong>Nouă Dată:</strong> ${suggestedDate}</p>
          <p><strong>Nouă Oră:</strong> ${suggestedTime}</p>
        </div>
        <p>Sunteți de acord cu această modificare?</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">Da, Accept</a>
          <a href="${declineUrl}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">Nu, Refuz</a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">Dacă butoanele nu funcționează, copiați și lipiți următoarele linkuri în browser:<br>
Accept: ${acceptUrl}<br>
Refuz: ${declineUrl}</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `;
    const text = `
      Sugestie Modificare Rezervare
      
      Dragă ${data.userName},
      
      Administratorul nostru vă sugerează o modificare a datei și orei pentru rezervarea dumneavoastră.
      
      Rezervare Originală:
      - Serviciu: ${data.serviceName}
      - Dată și Oră: ${data.dateTime}
      
      Dată și Oră Sugerată:
      - Nouă Dată: ${suggestedDate}
      - Nouă Oră: ${suggestedTime}
      
      Sunteți de acord cu această modificare?
      
      Pentru a accepta, accesați: ${acceptUrl}
      Pentru a refuza, accesați: ${declineUrl}
      
      Cu respect,
      Masaj by Melinda
    `;
    return { subject, html, text };
  }
};

/**
 * Check if email is properly configured
 */
const isEmailConfigured = (): boolean => {
  return !!(
    EMAIL_NOTIFICATIONS_ENABLED &&
    BREVO_FROM_EMAIL &&
    BREVO_FROM_NAME
  );
};

// Replace getApiBaseUrl with Supabase Edge Function URL
import { getSupabaseFunctionUrl, supabaseAuthHeader } from '@/lib/supabase-functions';

/**
 * Send a notification email using a Supabase Edge Function.
 */
export const sendEmailNotification = async (
  payload: NotificationPayload
): Promise<NotificationResult> => {
  if (!isEmailConfigured()) {
    console.error('Notificările prin email nu sunt configurate sau activate');
    return {
      success: false,
      channel: 'email',
      error: new Error('Notificările prin email nu sunt configurate sau activate'),
      timestamp: Date.now()
    };
  }

  if (!payload.recipient.email) {
    console.error('Emailul destinatarului este obligatoriu');
    return {
      success: false,
      channel: 'email',
      error: new Error('Emailul destinatarului este obligatoriu'),
      timestamp: Date.now()
    };
  }

  try {
    // Get the appropriate template
    const templateFn = emailTemplates[payload.type];
    if (!templateFn) {
      throw new Error(`Șablonul de email nu a fost găsit pentru tipul de notificare: ${payload.type}`);
    }

    // Generate the email content from template
    const emailContent = templateFn(payload.data as BookingNotificationData);

    // Set up the API call
    const url = getSupabaseFunctionUrl('send-email');
    const AUTH_HEADER = await supabaseAuthHeader();
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AUTH_HEADER
      },
      body: JSON.stringify({
        to: payload.recipient.email,
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text
      })
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Eroare la trimiterea emailului');
    }

    // Log the successful notification
    await logNotification({
      notificationType: payload.type,
      channel: 'email',
      recipientId: payload.recipient.userId,
      recipientEmail: payload.recipient.email,
      success: true,
      messageId: data.messageId,
      sentAt: new Date().toISOString(),
      data: payload.data
    });

    return {
      success: true,
      channel: 'email',
      messageId: data.messageId,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Eroare la trimiterea notificării prin email:', error);

    // Log the failed attempt
    await logNotification({
      notificationType: payload.type,
      channel: 'email',
      recipientId: payload.recipient.userId,
      recipientEmail: payload.recipient.email,
      success: false,
      error: error.message,
      sentAt: new Date().toISOString(),
      data: payload.data
    });

    return {
      success: false,
      channel: 'email',
      error: error,
      timestamp: Date.now()
    };
  }
};

/**
 * Retry sending an email notification
 */
export const retryEmailNotification = async (
  payload: NotificationPayload,
  retryCount = 0
): Promise<NotificationResult> => {
  if (retryCount >= 3) { // Fixed retry count for Express API
    const error = new Error(`Numărul maxim de reîncercări (3) a fost atins pentru notificarea prin email de tipul: ${payload.type}`);
    
    // Log the final failed attempt
    await logNotification({
      notificationType: payload.type,
      channel: 'email',
      recipientId: payload.recipient.userId,
      recipientEmail: payload.recipient.email,
      success: false,
      error: error.message,
      sentAt: new Date().toISOString(),
      data: payload.data,
      retryCount
    });
    
    return {
      success: false,
      channel: 'email',
      error,
      timestamp: Date.now()
    };
  }

  try {
    return await sendEmailNotification(payload);
  } catch (error) {
    console.error(`Reîncercare email ${retryCount + 1}/3 eșuată:`, error);
    
    // Exponential backoff for retries
    const delay = Math.pow(2, retryCount) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return retryEmailNotification(payload, retryCount + 1);
  }
}; 