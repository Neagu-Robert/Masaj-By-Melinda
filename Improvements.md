**Improvements**

1. Recurring bookings:
- current status: Users can create recurring booking from their profile pages for already created booking for a certain period of time. If the slots are available the system creates a booking for every week/two weeks for the user for the selected period of time. If the user decides to cancel the recurring then all instances are deleted.
- update to: The user should be able to delete one recurring booking at a time instead of all of them by clicking on the date it's booked in it's profile page calendar.
The "cancel recurring" button will be renamed "cancel all recurrings". A new button will be added called "Cancel this recurring" to only cancel that specific booking from the calendar. 
Upon cancelation for only one recurring booking, the instance for it in the database in the recurring_bookings table will be deleted.
The admin page will have the same options from now on when viewing all the bookings to cancel one recurring booking at a time.
Notification changes: Right now email is sent to user and SMS to admin when a recurring is deleted (all instances). A similar type of notification will be sent when only one instance is deleted specifing the exact date and that only one instance was deleted (+ all the other information regarding the booking)
notification behaviour: Profile page recurring instance deletion -> email+sms sent | admin booking page recurring instance deletion -> only email to user

2.The profile page:
- current status: The profile page has an arrow button that brings users back but it redirects to the same page everytime depending to what type of user is logged in (admin/customer)
- update to: It should remember the last  page you came from and bring you back to the previous page instead of always home.

3. Authentication Page:
- current status: The Auth page is too simplistic, no logo, no name. It can make people belive they got the wrong site.
- update to: The background image from the main page (index page, where the services are) should also be displayed in the background of the login form. Above the login form should be the "Masaj By Melinda" Title, the same one that appeares on the main (index) page on the top left corner.

4. Contact details:
- current status: in the footer of the index page and the Pachete page, there are contact details which are clickable, phone number and email address. They do not do anything.
- update to: the email address button should redirect the user to it's own email app (gmail/yahoo) and set him ready to writte an email to that address.
The phone number button (on mobile only) would get the user in the phone app with the number dialled.