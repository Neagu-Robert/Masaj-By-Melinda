import{s as u}from"./client-CUx4-LUr.js";import{s as f}from"./utils-C3OaHiSO.js";import{g as v,s as b}from"./supabase-functions-C3Trw1Ga.js";const p=parseInt("3",10),h=parseInt("5000",10),l=async e=>{if(!e.recipientId){console.log("Skipping notification log for demo user");return}try{const{error:r}=await u.from("notification_logs").insert({notification_type:e.notificationType,channel:e.channel,recipient_id:e.recipientId,recipient_email:e.recipientEmail,recipient_phone:e.recipientPhone,success:e.success,error:e.error,message_id:e.messageId,sent_at:e.sentAt,data:e.data,retry_count:e.retryCount||0});if(r){if(r.code==="23503"&&r.message.includes("users")){console.warn("User not found in database, but logging notification anyway:",e.recipientId),console.log("Notification log (demo):",{type:e.notificationType,channel:e.channel,recipient:e.recipientId,success:e.success,timestamp:e.sentAt});return}console.error("Error logging notification:",r)}}catch(r){console.error("Error logging notification:",r)}},$={booking_created_customer:e=>{const r=e.status==="unconfirmed",i=!!e.requestedDateText,a=i?`Cerere de Rezervare Primită - În Așteptare Aprobare - ${e.serviceName}`:r?`Rezervare Primită - Așteptare Aprobare - ${e.serviceName}`:`Confirmare Rezervare - ${e.serviceName}`,s=i?`
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
    `,n=i?`
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
    `;return{subject:a,html:s,text:n}},booking_updated_profile:e=>{const r=`Rezervare Actualizată - ${e.serviceName}`,i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},booking_updated_admin:e=>{const r=`Rezervare Actualizată de Admin - ${e.serviceName}`,i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},booking_cancelled_profile:e=>{const r=`Rezervare Anulată - ${e.serviceName}`,i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},booking_cancelled_admin:e=>{const r=`Rezervare Anulată de Admin - ${e.serviceName}`,i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},reminder:e=>{const r=`Memento Programare - ${e.serviceName}`,i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},password_changed:e=>{const r="Parolă Schimbată cu Succes",i=`
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
    `,a=`
      Parolă Schimbată cu Succes
      
      Dragă ${e.userName},
      
      Parola dumneavoastră a fost schimbată cu succes.
      
      Actualizare Securitate Cont:
      - Cont: ${e.userEmail}
      - Data Modificării: ${e.dateTime}
      
      Dacă nu ați făcut această modificare, vă rugăm să ne contactați imediat pentru asistență.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:i,text:a}},password_reset_requested:e=>{const r="Resetare Parolă Solicitată",i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},booking_approval_needed:e=>{const r=!!e.requestedDateText,i=`Rezervare Primită - În Așteptare Aprobare - ${e.serviceName}`,a=`
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
    `,s=`
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
    `;return{subject:i,html:a,text:s}},booking_confirmed_by_admin:e=>{const r=`Rezervare Confirmată - ${e.serviceName}`,i=`
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
    `,a=`
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
    `;return{subject:r,html:i,text:a}},booking_rejected_by_admin:e=>{const r=`Rezervare Respinsă - ${e.serviceName}`,i=`
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
    `,a=`
      Rezervare Respinsă
      
      Dragă ${e.userName},
      
      Ne pare rău, dar rezervarea dumneavoastră nu a putut fi confirmată.
      
      Detalii Rezervare:
      - Serviciu: ${e.serviceName}
      - Dată și Oră Solicitată: ${e.dateTime}
      
      Vă rugăm să ne contactați pentru a găsi o dată alternativă care să vă convină.
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:r,html:i,text:a}},booking_suggestion_sent:e=>{const[r,i,a]=(e.notes||"||").split("|"),s="https://masajbymelinda.ro",n=`${s}/booking-confirmation?token=${a}&action=accept&booking_id=${e.bookingId}`,t=`${s}/booking-confirmation?token=${a}&action=decline&booking_id=${e.bookingId}`,o=`Sugestie Modificare Rezervare - ${e.serviceName}`,d=`
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
          <p><strong>Nouă Oră:</strong> ${i}</p>
        </div>
        <p>Sunteți de acord cu această modificare?</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${n}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">Da, Accept</a>
          <a href="${t}" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px; font-weight: bold;">Nu, Refuz</a>
        </div>
        <p style="color: #6b7280; font-size: 12px;">Dacă butoanele nu funcționează, copiați și lipiți următoarele linkuri în browser:<br>
Accept: ${n}<br>
Refuz: ${t}</p>
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
      - Nouă Oră: ${i}
      
      Sunteți de acord cu această modificare?
      
      Pentru a accepta, accesați: ${n}
      Pentru a refuza, accesați: ${t}
      
      Cu respect,
      Masaj by Melinda
    `;return{subject:o,html:d,text:g}}},c=async e=>{if(!e.recipient.email)return console.error("Emailul destinatarului este obligatoriu"),{success:!1,channel:"email",error:new Error("Emailul destinatarului este obligatoriu"),timestamp:Date.now()};try{const r=$[e.type];if(!r)throw new Error(`Șablonul de email nu a fost găsit pentru tipul de notificare: ${e.type}`);const i=r(e.data),a=v("send-email"),n={method:"POST",headers:{"Content-Type":"application/json",...await b()},body:JSON.stringify({to:e.recipient.email,subject:i.subject,htmlContent:i.html,textContent:i.text})},t=await fetch(a,n),o=await t.json();if(!t.ok)throw new Error(o.error||`HTTP ${t.status}: ${t.statusText}`);if(!o.success)throw new Error(o.error||"Eroare la trimiterea emailului");return await l({notificationType:e.type,channel:"email",recipientId:e.recipient.userId,recipientEmail:e.recipient.email,success:!0,messageId:o.messageId,sentAt:new Date().toISOString(),data:e.data}),{success:!0,channel:"email",messageId:o.messageId,timestamp:Date.now()}}catch(r){return console.error("Eroare la trimiterea notificării prin email:",r),await l({notificationType:e.type,channel:"email",recipientId:e.recipient.userId,recipientEmail:e.recipient.email,success:!1,error:r.message,sentAt:new Date().toISOString(),data:e.data}),{success:!1,channel:"email",error:r,timestamp:Date.now()}}},m=async(e,r=0)=>{if(r>=p){const i=new Error(`Numărul maxim de reîncercări (${p}) a fost atins pentru notificarea prin email de tipul: ${e.type}`);return await l({notificationType:e.type,channel:"email",recipientId:e.recipient.userId,recipientEmail:e.recipient.email,success:!1,error:i.message,sentAt:new Date().toISOString(),data:e.data,retryCount:r}),{success:!1,channel:"email",error:i,timestamp:Date.now()}}try{return await c(e)}catch(i){console.error(`Reîncercare email ${r+1}/${p} eșuată:`,i);const a=h*Math.pow(2,r);return await f(a),m(e,r+1)}},D=async e=>{if(!e)return console.log("Skipping preference check for demo user"),null;try{const{data:r,error:i}=await u.from("notification_preferences").select("*").eq("user_id",e).maybeSingle();return i?(console.error("Error fetching user preferences:",i),null):r?{userId:r.user_id,bookingCreationEnabled:r.booking_creation_enabled,bookingUpdateEnabled:r.booking_update_enabled,bookingCancellationEnabled:r.booking_cancellation_enabled,passwordChangeEnabled:r.password_change_enabled,reminderEnabled:r.reminder_enabled??!0}:(console.log("No preferences found for user, using defaults"),null)}catch(r){return console.error("Error fetching user preferences:",r),null}},x=async(e,r)=>{try{let i=null;if(e){const{data:a,error:s}=await u.from("services").select("duration, price").eq("id",e).single();!s&&a&&(i=a)}if(!i&&r&&r.trim()!==""){const{data:a,error:s}=await u.from("services").select("duration, price").eq("name",r).eq("is_active",!0).single();!s&&a&&(i=a)}return{duration:(i==null?void 0:i.duration)||60,price:(i==null?void 0:i.price)||140}}catch(i){return console.error("Error fetching service details:",i),{duration:60,price:140}}},R=async e=>{const r=[],i=await D(e.recipient.userId);let a="customer";if(e.recipient.userId)try{const{data:t}=await u.from("profiles").select("role").eq("id",e.recipient.userId).single();a=(t==null?void 0:t.role)||"customer"}catch(t){console.error("Error fetching user role:",t)}let s=e;if(e.type!=="password_changed"){const t=await x(e.data.serviceId,e.data.serviceName);s={...e,data:{...e.data,duration:t.duration,price:t.price}}}const n=t=>{if(!i)return console.log(`No preferences found for user ${e.recipient.userId}, defaulting to send email notification for ${t}`),!0;let o=!1;switch(t){case"booking_created_customer":o=i.bookingCreationEnabled;break;case"booking_updated_profile":case"booking_updated_admin":o=i.bookingUpdateEnabled;break;case"booking_cancelled_profile":case"booking_cancelled_admin":o=i.bookingCancellationEnabled;break;case"reminder":o=i.reminderEnabled;break;case"password_changed":case"password_reset_requested":o=i.passwordChangeEnabled;break;default:o=!0}return console.log(`Email notification preference check for ${t}: ${o} (user: ${e.recipient.userId})`),o};switch(e.type){case"booking_created_customer":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_updated_profile":case"booking_cancelled_profile":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_updated_admin":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_cancelled_admin":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"reminder":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"password_changed":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending password change notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"password_reset_requested":if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending password reset request notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_approval_needed":if(e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending approval needed email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_confirmed_by_admin":if(e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending confirmation email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_rejected_by_admin":if(e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending rejection email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;case"booking_suggestion_sent":if(e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending suggestion email:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break;default:if(n(e.type)&&e.recipient.email)try{const t=await c(s);r.push(t)}catch(t){console.error("Error sending email notification:",t),r.push({success:!1,channel:"email",error:t,timestamp:Date.now()})}break}return r},w=async e=>{console.log("Sending notification:",e.type,"to:",e.recipient.email);const r=await R(e);for(let i=0;i<r.length;i++){const a=r[i];if(!a.success&&a.error){console.log(`Retrying ${a.channel} notification...`);let s;a.channel==="email"?s=await m(e):s=a,r[i]=s}}return r};export{w as n};
