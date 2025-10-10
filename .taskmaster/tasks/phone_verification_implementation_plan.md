# Phone Number Verification Implementation Plan

## Overview
Implement phone number verification for customers and guests using Infobip OTP SMS service. This feature ensures all users have verified phone numbers before making bookings.

## Implementation Phases

### Phase 1: Backend Infrastructure & Database
1. **Database Schema Updates**
   - Add phone verification fields to profiles table
   - Create phone verification sessions table for temporary storage
   - Update existing phone field handling

2. **Infobip Integration Setup**
   - Configure Infobip API credentials
   - Create SMS message templates
   - Set up OTP generation and validation logic

3. **Backend API Endpoints**
   - Phone verification request endpoint
   - OTP validation endpoint
   - Phone verification status endpoint

### Phase 2: Core Verification System
4. **Phone Verification Modal Component**
   - Create reusable modal for both profile and booking pages
   - Phone number input with validation
   - OTP input field
   - Success/error states and messaging

5. **Verification Service Layer**
   - Phone number validation utilities
   - OTP generation and delivery
   - Verification status management
   - Session-based verification for guests

6. **Global State Management**
   - Phone verification context for app-wide state
   - Session storage for guest verification status
   - Integration with existing auth context

### Phase 3: Profile Page Integration
7. **Profile Page Updates**
   - Update phone number display and editing
   - Integrate verification modal
   - Update database on successful verification
   - Handle verification status display

8. **Edit Profile Modal Updates**
   - Add phone verification flow
   - Update phone number field behavior
   - Integrate with verification system

### Phase 4: Booking Page Integration
9. **Contact Form Updates**
   - Add verification button below phone input
   - Update phone number field behavior
   - Integrate verification modal
   - Handle verification status display

10. **Booking Validation**
    - Add phone verification requirement
    - Update form submission logic
    - Handle verification status checks

### Phase 5: Guest User Support
11. **Guest Verification Flow**
    - Session-based verification storage
    - Temporary verification status
    - Multiple booking support within session

12. **Cross-page Verification Persistence**
    - Maintain verification status across navigation
    - Handle page refreshes and new tabs
    - Session expiration handling

### Phase 6: Testing & Polish
13. **Integration Testing**
    - End-to-end verification flows
    - Error handling and edge cases
    - Performance optimization

14. **UI/UX Polish**
    - Consistent styling and messaging
    - Loading states and animations
    - Accessibility improvements

## Technical Requirements

### Database Changes
- `profiles.phone_verified` (boolean) - permanent verification status
- `profiles.phone_verified_at` (timestamp) - when verification occurred
- `phone_verification_sessions` table for temporary guest verification

### New Components
- `PhoneVerificationModal` - reusable verification interface
- `PhoneVerificationContext` - global state management
- `PhoneVerificationButton` - verification trigger component

### API Integration
- Infobip SMS service for OTP delivery
- Phone number validation and formatting
- Secure OTP generation and validation

### State Management
- Global verification status tracking
- Session storage for guest users
- Integration with existing auth system

## Success Criteria
- [ ] All users must verify phone numbers before booking
- [ ] Registered users can verify once and reuse
- [ ] Guest users verify per session
- [ ] No impact on admin booking functionality
- [ ] Seamless integration with existing UI
- [ ] Proper error handling and user feedback
- [ ] Mobile-responsive design
- [ ] Accessibility compliance

## Dependencies
- Infobip API access and credentials
- Existing notification system integration
- Current auth and profile systems
- Booking validation logic updates
