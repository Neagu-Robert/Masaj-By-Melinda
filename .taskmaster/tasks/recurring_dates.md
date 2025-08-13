This is a step by step plan for implementing a new feature for both customers and admins.

Goals:
Add a recurrring booking feature that allows users of any type to book the same service at the same date and hour every week or every two weeks for the next 30, 60 or 90 days. Can be cancelled at any point and all the remaining bookings that were supposed to happen (date being tomorrow or in the future from the moment of cancelling) will be deleted from the bookings table. The bookings will only keep recurring for the specific selected duration (max 90 days), it will not keep updating the system.


UI implementation:
For the user recurring bookings, the bookings display system will be modified.
- Instead of displaing the bookings like a table split into 3 section, it will be displayed like calendar similar to the ones from the booking page.
- The days of the month will be displayed, the current day will be highlighted in blue. 
- The past days will have the date text be greyed out. The future days will have date text white.
- The days with a booking for that specific user will be a different color:
    - If a day contains a booking that is in the past it will be dark purple
    - If a day contains a booking that is in the future in will be bright violet.
    - If a day contains a booking that is recurring it will be light green.
- Under the bookings calendar there will be a section displaying the bookings for the selected day. If there are no bookings, will display a message "No bookings for this date". By default the current day will be selected.
- The specific bookings will display details similar to how it currently displays, table like. It will keep having the edit and delete button.
- A new green button will be added next to the edit and delete buttons labeled (make recurring). A small form will appear informing the user that the same service, date and hour will be booked. He can choose between weekly or biweekly and for the time period: 30, 60 or 90 days.
- A 'recurring' status field will be added to each booking which will say 'yes' or 'no' based on the booking.


Supabase database implementation.
-add 'recurring' column for all bookings. type bool. By default FALSE when created by a booking page by a customer or admin.
- create a recurring_bookings table with the contents:
    - id -> uuid PK random()
    - booking_id -> uuid (referencing the original booking from the bookings table)
    - reccurence_type -> text (weekly, byweekly).
    - until -> date (will be calculated in the frontend during creation based on the selected time 30,60 or 90 days)
    - day -> text (day of the week when recurring)
    - hour -> time (hour of the day when recurring)


Notification behaviour:
- when a user decides to make a booking recuring a notification will be sent for both the specific user and admin
- for that user, Email: 'Your selected service is now recurring every <day of the week> at <hour> for the next <selected time period> days, you can always disable them if you no longer want them.'
- for the admin, SMS: 'The user <name> added a recurring booking for every <day of the week> at <hour> for the next <selected time period> days.'
- Same will happen if a user decides to cancel that recurrsion.

Implementation:
Through supabase edge functions

Answers:
Here are the answer to the questions:
1. Pre-create all instances up-front based on the choosen period of time (30, 60, or 90). And based on weekly or biweekly choice. this means there will be around 9 instances at max (depending) in the reccuring_bookings table each with a specific date for it's current week.


2.When creating the recurring instances, first the system will check for booked or blocked slots.If some dates are already blocked the user will see a message in the form saying "some of the dates for the recurring bookings are already taken, do you wish to proceed anyway?" 'yes' or 'no'. if no, close recurring form. If yes the slots that are already unavailable for instances will be skipped. The skipping logic will be implemented by adding a 'status' bool field for each instance. If a date and hour is already taken for that instance the status will be FALSE and in the UI it will be shown but greyed out saying "this date has already been reserved or is unavailable". A pop up message will show up after making the recurring dates in the frontend with two options. If all recuring dates have been accepted (no other date was blocked already or reserved) saying success. If atleast one instance was blocked will say "One or more recuring dates have been taken, you can see which one in the calendar above".

3. Use spelling 'biweekly'. Excuse my spelling mistake.

4. The calndar will replace the the profile booking list entirely.

5. On cancellation only one notification is being sent for both user and admin.

6. Keep current local-time behaviour.

More specifications:
Guests cannot make recurring dates, this feature can only be made in the profile page which requires a user to be authenticated.