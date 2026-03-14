import{s as m}from"./client-CUx4-LUr.js";import{s as b}from"./utils-C3OaHiSO.js";import{g as _,s as w}from"./supabase-functions-CYysW35-.js";const z=["+40745038809"],l=parseInt("3",10),h=parseInt("5000",10),f=async e=>{if(!e.recipientId){console.log("Skipping notification log for demo user");return}try{const{error:r}=await m.from("notification_logs").insert({notification_type:e.notificationType,channel:e.channel,recipient_id:e.recipientId,recipient_email:e.recipientEmail,recipient_phone:e.recipientPhone,success:e.success,error:e.error,message_id:e.messageId,sent_at:e.sentAt,data:e.data,retry_count:e.retryCount||0});if(r){if(r.code==="23503"&&r.message.includes("users")){console.warn("User not found in database, but logging notification anyway:",e.recipientId),console.log("Notification log (demo):",{type:e.notificationType,channel:e.channel,recipient:e.recipientId,success:e.success,timestamp:e.sentAt});return}console.error("Error logging notification:",r)}}catch(r){console.error("Error logging notification:",r)}},S={booking_created_customer:e=>{const r=e.status==="unconfirmed",a=!!e.requestedDateText,i=a?`Cerere de Rezervare Primită - În Așteptare Aprobare - ${e.serviceName}`:r?`Rezervare Primită - Așteptare Aprobare - ${e.serviceName}`:`Confirmare Rezervare - ${e.serviceName}`,n=a?`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Cerere de Rezervare Primită - În Așteptare</h2>
        <p>Dragă ${e.userName},</p>
        <p>Cererea dumneavoastră de rezervare a fost primită și este în așteptarea aprobării administratorului.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">Cererea Dumneavoastră:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Data dorită:</strong> ${e.requestedDateText}</p>
          <p><strong>Ora preferată:</strong> ${e.requestedTimeText||"Nu ați specificat"}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">În așteptare de aprobare</span></p>
        </div>
        <p style="color: #f59e0b;"><strong>Notă importantă:</strong> Cererea dumneavoastră este în așteptare de aprobare. Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${r?"#f59e0b":"#8b5cf6"};">${r?"Rezervare Primită - În Așteptare":"Confirmare Rezervare"}</h2>
        <p>Dragă ${e.userName},</p>
        <p>${r?"Rezervarea dumneavoastră a fost primită și este în așteptarea aprobării administratorului.":"Rezervarea dumneavoastră a fost confirmată cu succes!"}</p>
        <div style="background-color: ${r?"#fffbeb":"#f8fafc"}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
          <p><strong>Status:</strong> ${r?"În așteptare de aprobare":"Confirmat"}</p>
        </div>
        ${r?'<p style="color: #f59e0b;"><strong>Notă:</strong> Veți primi un email de confirmare după ce administratorul va aproba rezervarea. Data și ora pot fi ajustate dacă este necesar.</p>':"<p>Vă așteptăm cu drag!</p>"}
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,c=a?`
      Cerere de Rezervare Primită - În Așteptare
      
      Dragă ${e.userName},
      
      Cererea dumneavoastră de rezervare a fost primită și este în așteptarea aprobării administratorului.
      
      Cererea Dumneavoastră:
      - Serviciu: ${e.serviceName}
      - Data dorită: ${e.requestedDateText}
      - Ora preferată: ${e.requestedTimeText||"Nu ați specificat"}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      - Status: În așteptare de aprobare
      
      Notă importantă: Cererea dumneavoastră este în așteptare de aprobare. Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.
      
      Cu respect,
      Masaj by Melinda
    `:`
      ${r?"Rezervare Primită - În Așteptare":"Confirmare Rezervare"}
      
      Dragă ${e.userName},
      
      ${r?"Rezervarea dumneavoastră a fost primită și este în așteptarea aprobării administratorului.":"Rezervarea dumneavoastră a fost confirmată cu succes!"}
      
      Detalii Rezervare:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      - Status: ${r?"În așteptare de aprobare":"Confirmat"}
      
      ${r?"Notă: Veți primi un email de confirmare după ce administratorul va aproba rezervarea. Data și ora pot fi ajustate dacă este necesar.":"Vă așteptăm cu drag!"}
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:i,html:n,text:c}},booking_updated_profile:e=>{const r=`Rezervare Actualizată - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Rezervare Actualizată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost actualizată cu succes!</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Actualizate ale Rezervării:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
          <p><strong>Status:</strong> ${e.status}</p>
        </div>
        <p>Dacă aveți întrebări, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Actualizată
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost actualizată cu succes!
      
      Detalii Actualizate ale Rezervării:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      - Status: ${e.status}
      
      Dacă aveți întrebări, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},booking_updated_admin:e=>{const r=`Rezervare Actualizată de Admin - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Rezervare Actualizată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost actualizată de către personalul nostru.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Actualizate ale Rezervării:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
          <p><strong>Status:</strong> ${e.status}</p>
        </div>
        <p>Dacă aveți întrebări despre aceste modificări, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Actualizată de Admin
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost actualizată de către personalul nostru.
      
      Detalii Actualizate ale Rezervării:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      - Status: ${e.status}
      
      Dacă aveți întrebări despre aceste modificări, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},booking_cancelled_profile:e=>{const r=`Rezervare Anulată - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Anulată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost anulată.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare Anulată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
        </div>
        <p>Dacă aveți întrebări sau doriți să reprogramați, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Anulată
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost anulată.
      
      Detalii Rezervare Anulată:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      
      Dacă aveți întrebări sau doriți să reprogramați, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},booking_cancelled_admin:e=>{const r=`Rezervare Anulată de Admin - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Anulată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost anulată de către personalul nostru.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare Anulată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
        </div>
        <p>Dacă aveți întrebări despre această anulare, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Anulată de Admin
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost anulată de către personalul nostru.
      
      Detalii Rezervare Anulată:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      
      Dacă aveți întrebări despre această anulare, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},recurring_created_profile:e=>{const r=`Recurență Activată - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Rezervare Recurentă Activată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost setată să fie recurentă.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Recurență:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Început:</strong> ${e.dateTime}</p>
          <p><strong>Recurență:</strong> ${e.notes||"Săptămânal/La două săptămâni"}</p>
        </div>
        <p>Puteți dezactiva recurența oricând din profilul dumneavoastră.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Recurentă Activată
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost setată să fie recurentă.
      
      Detalii Recurență:
      - Serviciu: ${e.serviceName}
      - Început: ${e.dateTime}
      - Recurență: ${e.notes||"Săptămânal/La două săptămâni"}
      
      Puteți dezactiva recurența oricând din profilul dumneavoastră.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},recurring_cancelled_profile:e=>{const r=`Recurență Dezactivată - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Recurentă Dezactivată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră recurentă a fost anulată. Instanțele viitoare au fost eliminate.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Recurență Anulată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Original:</strong> ${e.dateTime}</p>
        </div>
        <p>Dacă a fost o greșeală, puteți reactiva recurența din profilul dumneavoastră.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Recurentă Dezactivată
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră recurentă a fost anulată. Instanțele viitoare au fost eliminate.
      
      Recurență Anulată:
      - Serviciu: ${e.serviceName}
      - Original: ${e.dateTime}
      
      Dacă a fost o greșeală, puteți reactiva recurența din profilul dumneavoastră.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},recurring_created_admin:e=>{const r=`Recurență Activată de Admin - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Rezervare Recurentă Activată (Admin)</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost setată să fie recurentă de către personalul nostru.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Recurență:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Început:</strong> ${e.dateTime}</p>
          <p><strong>Recurență:</strong> ${e.notes||"Săptămânal/La două săptămâni"}</p>
        </div>
        <p>Dacă nu a fost intenționat, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Recurentă Activată (Admin)
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost setată să fie recurentă de către personalul nostru.
      
      Detalii Recurență:
      - Serviciu: ${e.serviceName}
      - Început: ${e.dateTime}
      - Recurență: ${e.notes||"Săptămânal/La două săptămâni"}
      
      Dacă nu a fost intenționat, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},recurring_cancelled_admin:e=>{const r=`Recurență Dezactivată de Admin - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Recurentă Dezactivată (Admin)</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră recurentă a fost anulată de către personalul nostru. Instanțele viitoare au fost eliminate.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Recurență Anulată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Original:</strong> ${e.dateTime}</p>
        </div>
        <p>Dacă nu a fost intenționat, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Recurentă Dezactivată (Admin)
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră recurentă a fost anulată de către personalul nostru. Instanțele viitoare au fost eliminate.
      
      Recurență Anulată:
      - Serviciu: ${e.serviceName}
      - Original: ${e.dateTime}
      
      Dacă nu a fost intenționat, vă rugăm să ne contactați.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},recurring_instance_cancelled_profile:e=>{const r=`Instanță Recurentă Anulată - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Instanță Recurentă Anulată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Cererea dumneavoastră de a anula o singură instanță recurentă a fost procesată.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Instanță Anulată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p style="margin:0;color:#6b7280;font-size:12px;">Notă: Doar această dată specifică a fost anulată; seria rămâne activă.</p>
        </div>
        <p>Dacă aveți întrebări, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Instanță Recurentă Anulată
      
      Dragă ${e.userName},
      
      Cererea dumneavoastră de a anula o singură instanță recurentă a fost procesată.
      
      Instanță Anulată:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      
      Notă: Doar această dată specifică a fost anulată; seria rămâne activă.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},recurring_instance_cancelled_admin:e=>{const r=`Instanță Recurentă Anulată de Admin - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Instanță Recurentă Anulată (Admin)</h2>
        <p>Dragă ${e.userName},</p>
        <p>O singură instanță a seriei dumneavoastră recurente a fost anulată de către personalul nostru.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Instanță Anulată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p style="margin:0;color:#6b7280;font-size:12px;">Notă: Doar această dată specifică a fost anulată; seria rămâne activă.</p>
        </div>
        <p>Dacă a fost neașteptat, vă rugăm să ne contactați.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Instanță Recurentă Anulată (Admin)
      
      Dragă ${e.userName},
      
      O singură instanță a seriei dumneavoastră recurente a fost anulată de către personalul nostru.
      
      Instanță Anulată:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      
      Notă: Doar această dată specifică a fost anulată; seria rămâne activă.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},reminder:e=>{const r=`Memento Programare - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Memento Programare</h2>
        <p>Dragă ${e.userName},</p>
        <p>Acesta este un memento prietenos despre programarea dumneavoastră de mâine.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Programare:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
        </div>
        <p>Vă așteptăm cu drag!</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Memento Programare
      
      Dragă ${e.userName},
      
      Acesta este un memento prietenos despre programarea dumneavoastră de mâine.
      
      Detalii Programare:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      
      Vă așteptăm cu drag!
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},password_changed:e=>{const r="Parolă Schimbată cu Succes",a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Parolă Schimbată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Parola dumneavoastră a fost schimbată cu succes.</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Actualizare Securitate Cont:</h3>
          <p><strong>Cont:</strong> ${e.userEmail}</p>
          <p><strong>Data Modificării:</strong> ${e.dateTime}</p>
        </div>
        <p>Dacă nu ați făcut această modificare, vă rugăm să ne contactați imediat pentru asistență.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Parolă Schimbată cu Succes
      
      Dragă ${e.userName},
      
      Parola dumneavoastră a fost schimbată cu succes.
      
      Actualizare Securitate Cont:
      - Cont: ${e.userEmail}
      - Data Modificării: ${e.dateTime}
      
      Dacă nu ați făcut această modificare, vă rugăm să ne contactați imediat pentru asistență.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},password_reset_requested:e=>{const r="Resetare Parolă Solicitată",a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Resetare Parolă Solicitată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Am primit o cerere de resetare a parolei pentru contul dumneavoastră Masaj by Melinda.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Informații Cont:</h3>
          <p><strong>Cont:</strong> ${e.userEmail}</p>
          <p><strong>Data Solicitării:</strong> ${e.dateTime}</p>
        </div>
        <p>Dacă nu ați solicitat această resetare de parolă, vă rugăm să ignorați acest email. Parola dumneavoastră va rămâne neschimbată.</p>
        <p>Dacă ați solicitat această resetare, vă rugăm să verificați emailul pentru linkul de resetare și să urmați instrucțiunile.</p>
        <p>Din motive de securitate, linkurile de resetare a parolei expiră după o perioadă scurtă de timp.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Resetare Parolă Solicitată
      
      Dragă ${e.userName},
      
      Am primit o cerere de resetare a parolei pentru contul dumneavoastră Masaj by Melinda.
      
      Informații Cont:
      - Cont: ${e.userEmail}
      - Data Solicitării: ${e.dateTime}
      
      Dacă nu ați solicitat această resetare de parolă, vă rugăm să ignorați acest email. Parola dumneavoastră va rămâne neschimbată.
      
      Dacă ați solicitat această resetare, vă rugăm să verificați emailul pentru linkul de resetare și să urmați instrucțiunile.
      
      Din motive de securitate, linkurile de resetare a parolei expiră după o perioadă scurtă de timp.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},booking_approval_needed:e=>{const r=!!e.requestedDateText,a=`Rezervare Primită - În Așteptare Aprobare - ${e.serviceName}`,i=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Rezervare Primită - În Așteptare</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost primită cu succes și este în așteptarea aprobării administratorului.</p>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">${r?"Cererea Dumneavoastră:":"Detalii Rezervare:"}</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          ${r?`<p><strong>Data dorită:</strong> ${e.requestedDateText}</p>
          <p><strong>Ora preferată:</strong> ${e.requestedTimeText||"Nu ați specificat"}</p>`:`<p><strong>Dată și Oră:</strong> ${e.dateTime}</p>`}
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
          <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">În așteptare de aprobare</span></p>
        </div>
        <p style="color: #f59e0b;"><strong>Notă:</strong> Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,n=`
      Rezervare Primită - În Așteptare
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost primită cu succes și este în așteptarea aprobării administratorului.
      
      ${r?"Cererea Dumneavoastră:":"Detalii Rezervare:"}
      - Serviciu: ${e.serviceName}
      ${r?`- Data dorită: ${e.requestedDateText}
      - Ora preferată: ${e.requestedTimeText||"Nu ați specificat"}`:`- Dată și Oră: ${e.dateTime}`}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      - Status: În așteptare de aprobare
      
      Notă: Veți primi un email de confirmare cu data și ora exacte după ce administratorul va verifica disponibilitatea.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:a,html:i,text:n}},booking_confirmed_by_admin:e=>{const r=`Rezervare Confirmată - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Rezervare Confirmată</h2>
        <p>Dragă ${e.userName},</p>
        <p>Rezervarea dumneavoastră a fost confirmată de către administratorul nostru!</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0; color: #065f46;">Detalii Rezervare Confirmată:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
          <p><strong>Durată:</strong> ${e.duration} minute</p>
          <p><strong>Preț:</strong> ${e.price} RON</p>
          <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Confirmat</span></p>
        </div>
        <p style="color: #10b981;"><strong>Rezervarea dumneavoastră este confirmată!</strong> Vă așteptăm cu drag!</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Confirmată
      
      Dragă ${e.userName},
      
      Rezervarea dumneavoastră a fost confirmată de către administratorul nostru!
      
      Detalii Rezervare Confirmată:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      - Durată: ${e.duration} minute
      - Preț: ${e.price} RON
      - Status: Confirmat
      
      Rezervarea dumneavoastră este confirmată! Vă așteptăm cu drag!
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},booking_rejected_by_admin:e=>{const r=`Rezervare Respinsă - ${e.serviceName}`,a=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Rezervare Respinsă</h2>
        <p>Dragă ${e.userName},</p>
        <p>Ne pare rău, dar rezervarea dumneavoastră nu a putut fi confirmată.</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalii Rezervare:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră Solicitată:</strong> ${e.dateTime}</p>
        </div>
        <p>Vă rugăm să ne contactați pentru a găsi o dată alternativă care să vă convină.</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,i=`
      Rezervare Respinsă
      
      Dragă ${e.userName},
      
      Ne pare rău, dar rezervarea dumneavoastră nu a putut fi confirmată.
      
      Detalii Rezervare:
      - Serviciu: ${e.serviceName}
      - Dată și Oră Solicitată: ${e.dateTime}
      
      Vă rugăm să ne contactați pentru a găsi o dată alternativă care să vă convină.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:a,text:i}},booking_suggestion_sent:e=>{const[r,a,i]=(e.notes||"||").split("|"),n="https://masajbymelinda.ro",c=`${n}/booking-confirmation?token=${i}&action=accept&booking_id=${e.bookingId}`,s=`${n}/booking-confirmation?token=${i}&action=decline&booking_id=${e.bookingId}`,o=`Sugestie Modificare Rezervare - ${e.serviceName}`,d=`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Sugestie Modificare Rezervare</h2>
        <p>Dragă ${e.userName},</p>
        <p>Administratorul nostru vă sugerează o modificare a datei și orei pentru rezervarea dumneavoastră.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Rezervare Originală:</h3>
          <p><strong>Serviciu:</strong> ${e.serviceName}</p>
          <p><strong>Dată și Oră:</strong> ${e.dateTime}</p>
        </div>
        <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Dată și Oră Sugerată:</h3>
          <p><strong>Nouă Dată:</strong> ${r}</p>
          <p><strong>Nouă Oră:</strong> ${a}</p>
        </div>
        <p>Sunteți de acord cu această modificare?</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${c}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">Da, Accept</a>
          <a href="${s}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">Nu, Refuz</a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">Dacă butoanele nu funcționează, copiați și lipiți următoarele linkuri în browser:<br>
Accept: ${c}<br>
Refuz: ${s}</p>
        <p>Cu respect,<br>Masaj by Melinda</p>
      </div>
    `,g=`
      Sugestie Modificare Rezervare
      
      Dragă ${e.userName},
      
      Administratorul nostru vă sugerează o modificare a datei și orei pentru rezervarea dumneavoastră.
      
      Rezervare Originală:
      - Serviciu: ${e.serviceName}
      - Dată și Oră: ${e.dateTime}
      
      Dată și Oră Sugerată:
      - Nouă Dată: ${r}
      - Nouă Oră: ${a}
      
      Sunteți de acord cu această modificare?
      
      Pentru a accepta, accesați: ${c}
      Pentru a refuza, accesați: ${s}
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:o,html:d,text:g}}},u=async e=>{if(!e.recipient.email)return console.error("Emailul destinatarului este obligatoriu"),{success:!1,channel:"email",error:new Error("Emailul destinatarului este obligatoriu"),timestamp:Date.now()};try{const r=S[e.type];if(!r)throw new Error(`Șablonul de email nu a fost găsit pentru tipul de notificare: ${e.type}`);const a=r(e.data),i=_("send-email"),c={method:"POST",headers:{"Content-Type":"application/json",...await w()},body:JSON.stringify({to:e.recipient.email,subject:a.subject,htmlContent:a.html,textContent:a.text})},s=await fetch(i,c),o=await s.json();if(!s.ok)throw new Error(o.error||`HTTP ${s.status}: ${s.statusText}`);if(!o.success)throw new Error(o.error||"Eroare la trimiterea emailului");return await f({notificationType:e.type,channel:"email",recipientId:e.recipient.userId,recipientEmail:e.recipient.email,success:!0,messageId:o.messageId,sentAt:new Date().toISOString(),data:e.data}),{success:!0,channel:"email",messageId:o.messageId,timestamp:Date.now()}}catch(r){return console.error("Eroare la trimiterea notificării prin email:",r),await f({notificationType:e.type,channel:"email",recipientId:e.recipient.userId,recipientEmail:e.recipient.email,success:!1,error:r.message,sentAt:new Date().toISOString(),data:e.data}),{success:!1,channel:"email",error:r,timestamp:Date.now()}}},$=async(e,r=0)=>{if(r>=l){const a=new Error(`Numărul maxim de reîncercări (${l}) a fost atins pentru notificarea prin email de tipul: ${e.type}`);return await f({notificationType:e.type,channel:"email",recipientId:e.recipient.userId,recipientEmail:e.recipient.email,success:!1,error:a.message,sentAt:new Date().toISOString(),data:e.data,retryCount:r}),{success:!1,channel:"email",error:a,timestamp:Date.now()}}try{return await u(e)}catch(a){console.error(`Reîncercare email ${r+1}/${l} eșuată:`,a);const i=h*Math.pow(2,r);return await b(i),$(e,r+1)}},v=async e=>(console.error("Notificările SMS nu sunt configurate sau activate"),{success:!1,channel:"sms",error:new Error("Notificările SMS nu sunt configurate sau activate"),timestamp:Date.now()}),D=async(e,r=0)=>{if(r>=l)return console.error(`S-au atins numărul maxim de reîncercări (${l}) pentru notificarea SMS`),{success:!1,channel:"sms",error:new Error(`S-au atins numărul maxim de reîncercări (${l})`),timestamp:Date.now()};const a=h*Math.pow(2,r);await b(a),console.log(`Se reîncearcă notificarea SMS (încercarea ${r+1}/${l})`);try{const i=await v(e);return i.success&&i.details&&console.log("Reîncercarea SMS a avut succes, cu detalii:",i.details),i}catch(i){return console.error(`Reîncercarea SMS ${r+1} a eșuat:`,i),D(e,r+1)}},k=async e=>{if(!e)return console.log("Skipping preference check for demo user"),null;try{const{data:r,error:a}=await m.from("notification_preferences").select("*").eq("user_id",e).maybeSingle();return a?(console.error("Error fetching user preferences:",a),null):r?{userId:r.user_id,bookingCreationEnabled:r.booking_creation_enabled,bookingUpdateEnabled:r.booking_update_enabled,bookingCancellationEnabled:r.booking_cancellation_enabled,passwordChangeEnabled:r.password_change_enabled,reminderEnabled:r.reminder_enabled??!0}:(console.log("No preferences found for user, using defaults"),null)}catch(r){return console.error("Error fetching user preferences:",r),null}},R=async(e,r)=>{try{let a=null;if(e){const{data:i,error:n}=await m.from("services").select("duration, price").eq("id",e).single();!n&&i&&(a=i)}if(!a&&r&&r.trim()!==""){const{data:i,error:n}=await m.from("services").select("duration, price").eq("name",r).eq("is_active",!0).single();!n&&i&&(a=i)}return{duration:(a==null?void 0:a.duration)||60,price:(a==null?void 0:a.price)||140}}catch(a){return console.error("Error fetching service details:",a),{duration:60,price:140}}},p=async(e,r)=>{const a=[],i=await R(r.serviceId,r.serviceName),n={...r,duration:i.duration,price:i.price};for(const c of z)try{const o=await v({type:e,recipient:{userId:null,email:"",phone:c,name:"Admin"},data:n});a.push(o)}catch(s){console.error("Error sending admin SMS notification:",s),a.push({success:!1,channel:"sms",error:s,timestamp:Date.now()})}return a},A=async e=>{const r=[],a=await k(e.recipient.userId);let i="customer";if(e.recipient.userId)try{const{data:s}=await m.from("profiles").select("role").eq("id",e.recipient.userId).single();i=(s==null?void 0:s.role)||"customer"}catch(s){console.error("Error fetching user role:",s)}let n=e;if(e.type!=="password_changed"){const s=await R(e.data.serviceId,e.data.serviceName);n={...e,data:{...e.data,duration:s.duration,price:s.price}}}const c=s=>{if(!a)return console.log(`No preferences found for user ${e.recipient.userId}, defaulting to send email notification for ${s}`),!0;let o=!1;switch(s){case"booking_created_customer":o=a.bookingCreationEnabled;break;case"booking_updated_profile":case"booking_updated_admin":o=a.bookingUpdateEnabled;break;case"booking_cancelled_profile":case"booking_cancelled_admin":o=a.bookingCancellationEnabled;break;case"reminder":o=a.reminderEnabled;break;case"recurring_created_profile":o=a.bookingCreationEnabled;break;case"recurring_cancelled_profile":o=a.bookingCancellationEnabled;break;case"recurring_created_admin":o=a.bookingCreationEnabled;break;case"recurring_cancelled_admin":o=a.bookingCancellationEnabled;break;case"recurring_instance_cancelled_profile":o=a.bookingCancellationEnabled;break;case"recurring_instance_cancelled_admin":o=a.bookingCancellationEnabled;break;case"password_changed":case"password_reset_requested":o=a.passwordChangeEnabled;break;default:o=!0}return console.log(`Email notification preference check for ${s}: ${o} (user: ${e.recipient.userId})`),o};switch(e.type){case"recurring_created_profile":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending recurring created email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}{const t=await p(e.type,n.data);r.push(...t)}break;case"recurring_cancelled_profile":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending recurring cancelled email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}{const t=await p(e.type,n.data);r.push(...t)}break;case"recurring_instance_cancelled_profile":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending recurring instance cancelled (profile) email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}{const t=await p(e.type,n.data);r.push(...t)}break;case"booking_created_customer":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}const s=await p(e.type,n.data);r.push(...s);break;case"booking_updated_profile":case"booking_cancelled_profile":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}const o=await p(e.type,n.data);r.push(...o);break;case"booking_created_admin":const d=await p(e.type,n.data);r.push(...d);break;case"booking_updated_admin":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}const g=await p(e.type,n.data);r.push(...g);break;case"booking_cancelled_admin":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"recurring_created_admin":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending recurring created (admin) email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"recurring_cancelled_admin":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending recurring cancelled (admin) email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"recurring_instance_cancelled_admin":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending recurring instance cancelled (admin) email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"reminder":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"password_changed":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending password change notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"password_reset_requested":if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending password reset request notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_approval_needed":if(e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending approval needed email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}const x=await p(e.type,n.data);r.push(...x);break;case"booking_confirmed_by_admin":if(e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending confirmation email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_rejected_by_admin":if(e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending rejection email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_suggestion_sent":if(e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending suggestion email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_suggestion_accepted":const y=await p(e.type,n.data);r.push(...y);break;case"booking_suggestion_declined":const N=await p(e.type,n.data);r.push(...N);break;default:if(c(e.type)&&e.recipient.email)try{const t=await u(n);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}if(e.recipient.phone)try{const t=await v(n);r.push(t)}catch(t){console.error("Error sending SMS notification:",t),r.push({success:!1,channel:"sms",error:t,timestamp:Date.now()})}break}return r},j=async e=>{console.log("Sending notification:",e.type,"to:",e.recipient.email);const r=await A(e);for(let a=0;a<r.length;a++){const i=r[a];if(!i.success&&i.error){console.log(`Retrying ${i.channel} notification...`);let n;i.channel==="email"?n=await $(e):n=await D(e),r[a]=n}}return r};export{j as n};
