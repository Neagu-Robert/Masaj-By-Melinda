Phone number verification feature for custmoers and guests.

The customer's booking page will now require the users to have a verified phone number before making a booking.

For registered users (customers) they will have to verify their phone number through the profile page using the 'edit profile' modal. They only need to verify it once and it will be stored in the database and be used for bookings everytime.

'Guest' users don't have access to the profile page, so they will have to verify their phone number everytime they access the website. The 'verified' phone number status lasts until the website is closed, allowing guests to make multiple bookings if wanted.

Database requirerments:
Right now, each user has a 'phone' (type:text) field in the profiles table in the database. They can only add the phone number after the registration is complete in the profile editing modal. The verification will be done using an OTP sms using infobib's service. Users will have to input the random code given by the sms and after the verification is complete the phone number will be added to the database and it will be available to be used during booking creations.


Frontend behaviour:
- Customers: For the booking page, there is a checkbox for phone number to autofill with the phone number set in the profile page. 
Right now, if no phone number is set for current user, it shows "(nu este setat în profil)" with red. It will be replaced with "Nu este verificat in profil, va rugam adaugati-va mai intai numarul de telefon pentru a-l putea folosi la rezervari viitoare".
- If the customer decides to use a number (not verified in profile yet, or a different number from the one in profile). The system will first check if the new number is identical with the one from profile (avoid double verification) and if the number isn't verified, the user will have to verify it. There will be a button under the phone number input field labeled "Verifica numar de telefon". If the number is verified already the button is greyed out, can't be clicked, and says "numar verificat" with green text. 
- Upon clicking the "confirma rezervarea" button, the system must check if the number is verified

# for guests, there will be only the "Verifica numar de telefon" button below the phone number label, working for any type of user.

Implementation:
- there will be a global state that remembers if the phone number has been verified until the page is closed for any type of user. Allowing users that verified the phone number but not in the profile page to book multiple times.

-This phone number requirement only applies to the customer's booking page. For admin's they don't need to verify the phone number when creating a booking through the admin page, nor should it use the number from the profile page. Admins will create bookings for other customers with their phone numbers already given from them. In summary, no changes are applied to the admin booking form, only to customers.


steps for phone number verification implementation using infobip:
-create phone number verification modal used for both profile page and booking page
-create message template
-deliver the passcode
-verify the passcode
-upon verification: if in profile page, update database profile with the number
else if in booking page, update global phone number status to 'verified'. 