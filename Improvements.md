Features to improve
1.improve the forgot password functionality:
- current status: Only checks for email in the database during login, forgets about it .
-update to: After the user introduced their email, upon clicking "Send reset Link" the system should first check if that specific email is registered in the database and only after will it attempt to send a reset link. If the email doesn't appear in the database, then the password can't be changed and will cause errors. 
If the email in not registered then a message will pop up saying "Email-ul introdus nu este inregistrat, va rugam sa va inregistrati"

2.Improve the registration functionality.
-current status: There's only one name input field.
-update to: Users should input their full name. 
 There will be two name input fields, one called "Nume" and the other "Prenume". Both are required. After the input the system will concatenate the two fields ("Prenume"+"Nume") and send them to the database as one just how it was sending it previously without changing any database structure.

3. Booking page phone verification.
- current status: Right now , if a phone number number is verified it appeares in the profile page. Afterwards it can no longer be modified neither in the profile page or in the booking page
- update to: Users should be able to input any phone number they want into the booking page. If they check the box for "Foloseste numarul din profil" then the Phone number from the profile page will overwritte the text from the field. If they uncheck the box, the phone number will be editable just like the name field above it. Every time a character changes, it should be compared to the phone number from the profile page. If the phone number are identical then it will show the green "Numar verificat" text, if they differ then the "verifica numar de telefon" button will be present.
 also add some more input validation during the phone verification process making sure the number inputed is made out of only numbers and that it has the exact length of a phone number.
 the PhoneVerificationModal should not have a 'x' button in the top right corner since it can't be reopened and could mess up the OTP verification process. It should only dissapear after the phone was verified or if the page got refreshed (in case the OTP SMS got lost)

4. Booking page service and date selection.
- current service state: When selecting a service, you have to click on the center of the box with the service's name. Even the cursor is on the box and it changes cover due to hover, if it isn't in the center it can't be selected
- update to: If the cursor is on the box (The hover light is on) the box should be able to be selected.
- current date state: When selecting a date and time, if you select a hour and then switch to another day the hour stayes the same. Although the system doesn't allow it if the date wouldn't be a valid one, I want that each time the date is changed the hour gets deselected for safety reasons.

5. Profile page personal information update functionality.
- current status: Once the phone number has been verified only the name can be edited.
- update to: The name editing should be done with two labels just like during registration, "Nume" and "Prenume" which then concatenates them and sends it to the database. When taking the name from the database it splits it into 2 where the 'SPACE' is and then separetes them in the two fields. 
The phone number should be changable as well through a different modal. Inside the EditProfile modal, under the phone number (if already verified) will be a button labeled "Schimba numarul de telefon". Upon clicking that button a warning message will appear saying "Numarul este deja verificat, daca il schimbati va trebui sa-l verificati din nou. (Butoane optiuni:Schimba numarul / Inapoi)". After clicking the "Schimba numarul" button a new modal will open to input the new phone number and a button under it to verify it through an OTP.
