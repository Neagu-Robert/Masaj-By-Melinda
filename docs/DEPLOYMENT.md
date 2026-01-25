# Deployment Guide - Security Updates

## Overview

This guide provides step-by-step instructions for deploying the comprehensive security updates to the Masaj by Melinda application.

## Prerequisites

### Required Accounts & Services
- **Supabase Account**: Project with Edge Functions enabled
- **Upstash Redis**: Free tier account for rate limiting
- **Twilio Account**: SMS service for OTP functionality
- **Supabase CLI**: Latest version installed

### Development Environment
- Node.js 18+
- Deno 1.28+
- Git
- Supabase CLI

## Upstash Redis Setup

### 1. Create Upstash Account
1. Visit [upstash.com](https://upstash.com)
2. Sign up for a free account
3. Verify your email

### 2. Create Redis Database
1. Click "Create Database" in the Upstash console
2. Choose "Global" for multi-region replication
3. Select "Free" tier (sufficient for this use case)
4. Name your database (e.g., "masaj-melinda-rate-limit")
5. Choose your preferred region (e.g., EU-West for European users)
6. Click "Create"

### 3. Get Connection Details
1. In your database dashboard, go to the "Connect" tab
2. Copy the **REST API** connection details:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Important**: Use the REST API credentials, not the TCP ones (REST is serverless-compatible)

### 4. Test Connection
```bash
# Test Redis connection (optional)
curl -X GET "https://your-redis-url.upstash.io/get/test" \
  -H "Authorization: Bearer your-token"
```

## Environment Configuration

### 1. Update Supabase Secrets
Add the Upstash Redis credentials to your Supabase project:

```bash
# Set secrets using Supabase CLI
supabase secrets set UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
supabase secrets set UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
```

### 2. Verify Existing Secrets
Ensure these secrets are already set:

```bash
supabase secrets list
```

Required secrets:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_VERIFY_SID`
- `UPSTASH_REDIS_REST_URL` (new)
- `UPSTASH_REDIS_REST_TOKEN` (new)

## Deployment Steps

### Phase 1: Infrastructure Preparation

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Update Supabase Functions
```bash
# Link to your Supabase project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy shared utilities first
supabase functions deploy --no-verify-jwt
```

#### 3. Deploy Functions Individually
Deploy functions in order of priority (start with least critical):

```bash
# 1. Test with a simple function first
supabase functions deploy send-email --no-verify-jwt

# 2. Deploy notification functions
supabase functions deploy send-sms --no-verify-jwt
supabase functions deploy booking-response --no-verify-jwt

# 3. Deploy admin functions (require testing)
supabase functions deploy create-recurring-availabilities --no-verify-jwt
supabase functions deploy cancel-recurring-availabilities --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt

# 4. Deploy booking functions
supabase functions deploy cancel-recurring-bookings --no-verify-jwt
supabase functions deploy create-recurring-bookings --no-verify-jwt

# 5. Deploy OTP functions (most critical - test thoroughly)
supabase functions deploy verify-phone-otp --no-verify-jwt
supabase functions deploy request-phone-verification --no-verify-jwt
```

### Phase 2: Testing & Validation

#### 1. Test Rate Limiting
```bash
# Test OTP rate limiting (should fail after 3 requests)
for i in {1..5}; do
  curl -X POST "https://your-project.supabase.co/functions/v1/request-phone-verification" \
    -H "Content-Type: application/json" \
    -d '{"phone": "+40712345678"}'
  echo "Request $i completed"
  sleep 1
done
```

#### 2. Test Authentication
```bash
# Test unauthenticated request (should return 401)
curl -X POST "https://your-project.supabase.co/functions/v1/create-recurring-bookings" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "test", "recurrenceType": "weekly", "horizonDays": 30}'

# Response should be: {"error": "Unauthorized", "message": "Authentication required"}
```

#### 3. Test Validation
```bash
# Test invalid phone format
curl -X POST "https://your-project.supabase.co/functions/v1/request-phone-verification" \
  -H "Content-Type: application/json" \
  -d '{"phone": "invalid-phone"}'

# Response should include validation error
```

#### 4. Test Admin Functions
```bash
# Test admin-only endpoint without admin auth (should return 403)
curl -X POST "https://your-project.supabase.co/functions/v1/delete-user" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user-jwt-token" \
  -d '{"userId": "some-user-id"}'

# Response should be: {"error": "Forbidden", "message": "Admin access required"}
```

#### 5. Test Successful OTP Flow
```bash
# 1. Request verification (with valid auth if required)
curl -X POST "https://your-project.supabase.co/functions/v1/request-phone-verification" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+40712345678"}'

# 2. Verify OTP (use actual OTP from SMS)
curl -X POST "https://your-project.supabase.co/functions/v1/verify-phone-otp" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+40712345678", "otp": "123456"}'
```

### Phase 3: Monitoring Setup

#### 1. Enable Supabase Logs
1. Go to Supabase Dashboard → Edge Functions
2. Enable "Function Logs"
3. Set log retention period (recommended: 30 days)

#### 2. Monitor Rate Limiting
Check logs for rate limit violations:

```bash
# Search for rate limit events
supabase functions logs | grep "rate limit"
```

#### 3. Set Up Alerts
Consider setting up alerts for:
- High rate limit violation rates
- Authentication failures
- Function errors

#### 4. Performance Monitoring
Monitor function execution times and set alerts for slow responses (>5 seconds).

## Rollback Procedure

### Emergency Rollback
If critical issues arise after deployment:

```bash
# Deploy previous version (assuming you have git tags)
git checkout previous-version-tag
supabase functions deploy --no-verify-jwt

# Or redeploy from specific commit
git checkout abc123
supabase functions deploy --no-verify-jwt
```

### Gradual Rollback
For non-critical issues:

```bash
# Revert individual functions
git checkout HEAD~1 -- supabase/functions/create-recurring-bookings/
supabase functions deploy create-recurring-bookings --no-verify-jwt
```

### Database Rollback
If database schema changes were made:

```bash
# Use Supabase backups or point-in-time recovery
# Contact Supabase support for assistance
```

## Troubleshooting

### Common Issues

#### Rate Limiting Not Working
1. Check Upstash Redis credentials in secrets
2. Verify Redis REST URL is correct
3. Check function logs for Redis connection errors
4. Test Redis connectivity manually

#### Authentication Failures
1. Verify JWT tokens are valid
2. Check Supabase Auth configuration
3. Ensure service role key has proper permissions
4. Test with Supabase CLI: `supabase auth users list`

#### Validation Errors
1. Check request payload format
2. Verify Zod schemas match expected data structure
3. Test with valid data to isolate issues

#### CORS Issues
1. Verify CORS headers are included in responses
2. Check request origin against allowed origins
3. Test with simple curl request first

### Debug Commands

#### Check Function Status
```bash
supabase functions list
```

#### View Function Logs
```bash
# All functions
supabase functions logs

# Specific function
supabase functions logs request-phone-verification

# With filtering
supabase functions logs | grep "ERROR"
```

#### Test Function Locally
```bash
# Start local Supabase
supabase start

# Test function
curl -X POST "http://localhost:54321/functions/v1/request-phone-verification" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+40712345678"}'
```

### Performance Issues

#### High Latency
1. Check Redis region (use closest region)
2. Monitor function cold starts
3. Optimize database queries
4. Consider function memory allocation

#### Rate Limiting Performance
1. Monitor Redis latency
2. Consider upgrading Redis plan if needed
3. Implement local caching for frequently accessed data

## Post-Deployment Checklist

### Security Verification
- [ ] Rate limiting is active on all endpoints
- [ ] Authentication required for protected endpoints
- [ ] Admin-only endpoints properly restricted
- [ ] Input validation working on all functions
- [ ] Security events are being logged

### Functionality Testing
- [ ] OTP request/response flow works
- [ ] Booking creation/cancellation works
- [ ] Admin functions work for admin users only
- [ ] Email/SMS notifications work
- [ ] Error handling provides user-friendly messages

### Performance Monitoring
- [ ] Function response times within acceptable limits
- [ ] Rate limit headers returned correctly
- [ ] No excessive Redis usage
- [ ] Database query performance acceptable

### Monitoring Setup
- [ ] Log retention configured
- [ ] Alert thresholds set
- [ ] Dashboard monitoring active
- [ ] Incident response procedures documented

## Maintenance

### Regular Tasks
- **Daily**: Check security logs for anomalies
- **Weekly**: Review rate limit violations
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Security audit and penetration testing

### Updates
- Monitor Supabase Edge Functions changelog
- Update Upstash Redis client when new versions available
- Keep Zod and other dependencies updated
- Review and adjust rate limits based on usage patterns

### Backup Strategy
- Regular database backups (Supabase handles this)
- Function code versioned in Git
- Environment secrets backed up securely
- Document recovery procedures

## Support

### Getting Help
1. Check this deployment guide
2. Review security documentation
3. Check Supabase status page
4. Contact development team

### Emergency Contacts
- **Technical Lead**: [Name] - [Contact]
- **Security Officer**: [Name] - [Contact]
- **Infrastructure Support**: [Name] - [Contact]

### Documentation Updates
Keep this document updated as procedures change:
- New deployment steps
- Changed configuration requirements
- Updated troubleshooting procedures
- New monitoring recommendations
