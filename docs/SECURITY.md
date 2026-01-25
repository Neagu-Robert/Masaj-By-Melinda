# Security Documentation - Masaj by Melinda

## Overview

This document outlines the comprehensive security measures implemented in the Masaj by Melinda application to protect against common web application vulnerabilities.

## Architecture

The application uses a defense-in-depth security approach with multiple layers:

1. **Rate Limiting** - Distributed rate limiting using Upstash Redis
2. **Input Validation** - Runtime type validation using Zod schemas
3. **Authentication & Authorization** - Supabase Auth with role-based access control
4. **Structured Logging** - Comprehensive security event logging
5. **Request Processing** - Composable middleware architecture

## Rate Limiting

### Implementation
- **Technology**: Upstash Redis with sliding window counter algorithm
- **Storage**: Serverless-compatible REST API (not TCP connections)
- **Algorithms**:
  - Sliding Window Counter (most endpoints)
  - Token Bucket (OTP verification)
  - Fixed Window (admin actions)

### Endpoint Limits

#### OTP Endpoints (High Security)
- `request-phone-verification`: 3 requests per phone per 5 minutes, 10 requests per IP per 5 minutes
- `verify-phone-otp`: 5 attempts per phone per 15 minutes, 20 attempts per IP per 15 minutes

#### Booking Endpoints
- `create-recurring-bookings`: 10 requests per user per hour
- `cancel-recurring-bookings`: 20 requests per user per hour

#### Admin Endpoints
- `create-recurring-availabilities`: 20 requests per admin per hour
- `cancel-recurring-availabilities`: 30 requests per admin per hour
- `delete-user`: 5 deletions per admin per hour

#### Notification Endpoints
- `send-email`: 10 emails per recipient per hour, 50 emails per IP per hour
- `send-sms`: 5 SMS per phone per hour, 20 SMS per IP per hour
- `booking-response`: 3 responses per token per hour

#### Global Protection
- Global IP limit: 100 requests per minute per IP (DDoS protection)

### Monitoring Rate Limits
Rate limit violations are logged with:
- Identifier (phone, user ID, IP)
- Endpoint
- Timestamp
- User agent and IP address

## Input Validation

### Zod Schemas
All Edge Functions use Zod schemas for runtime validation:

```typescript
// Phone number validation (Romanian format)
phoneSchema = z.string().regex(/^\+40\d{9}$/, 'Invalid Romanian phone format')

// OTP validation
otpSchema = z.string().length(6).regex(/^\d{6}$/, 'OTP must be 6 digits')

// Date/time validation
dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
timeSchema = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS')
```

### Validation Features
- **Type Safety**: Runtime type checking prevents malformed data
- **Sanitization**: Input normalization and cleaning
- **Detailed Errors**: User-friendly error messages
- **Security**: Prevents injection attacks through validation

## Authentication & Authorization

### Authentication
- **Provider**: Supabase Auth with JWT tokens
- **Verification**: Automatic token validation on each request
- **Session Management**: Stateless JWT-based sessions

### Authorization
- **Role-Based Access Control**: `customer` and `admin` roles
- **Ownership Checks**: Users can only access their own resources
- **Admin Privileges**: Admins can access all resources

### Critical Security Checks
- **OTP Functions**: No authentication required (public endpoints)
- **Booking Functions**: User authentication + ownership verification
- **Admin Functions**: Admin role required
- **Guest Bookings**: Session-based validation for unauthenticated users

## Structured Logging

### Log Levels
- `DEBUG`: Development debugging
- `INFO`: Normal operations
- `WARN`: Potential issues (rate limit warnings)
- `ERROR`: Errors requiring attention
- `SECURITY`: Security events

### Security Events Logged
- Rate limit violations
- Authentication failures
- Validation errors
- Admin actions
- OTP events (requests, verifications, failures)
- Booking events
- Suspicious patterns

### Log Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "SECURITY",
  "endpoint": "verify-phone-otp",
  "message": "OTP verification failed",
  "context": {
    "reason": "invalid_otp",
    "phone": "+40*****1234",
    "attempts": 3
  },
  "userId": "guest",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## Request Processing Architecture

### Middleware Chain
Each request passes through a composable middleware chain:

```
Request → CORS → Logging → Error Handler → Rate Limiting → Validation → Authentication → Authorization → Business Logic
```

### Middleware Features
- **Composability**: Mix and match security layers
- **Short-Circuiting**: Failed middleware stops request processing
- **Context Passing**: Shared context between middlewares
- **Error Handling**: Consistent error responses

## Frontend Integration

### Rate Limit Headers
The API returns rate limit information in response headers:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1703123456
```

### Error Handling
Standardized error responses:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### Client-Side Backoff
Implement exponential backoff for rate-limited requests:

```javascript
if (response.status === 429) {
  const resetTime = response.headers.get('X-RateLimit-Reset');
  const delay = Math.max(1000, (resetTime * 1000) - Date.now());
  await new Promise(resolve => setTimeout(resolve, delay));
  // Retry request
}
```

## Monitoring & Alerting

### Key Metrics to Monitor
- Rate limit violation rates
- Authentication failure rates
- Validation error rates
- Response times
- Error rates by endpoint

### Alert Thresholds
- Rate limit violations > 10/minute
- Auth failures > 5/minute per IP
- Validation errors > 20/minute
- Response time > 5 seconds
- Error rate > 5%

### Log Analysis
- Search for suspicious patterns
- Track abuse attempts
- Monitor admin actions
- Audit user deletions

## Incident Response

### Rate Limit Breach
1. Check logs for attack patterns
2. Temporarily increase limits if legitimate traffic
3. Implement IP blocking if malicious
4. Notify development team

### OTP Abuse Detection
1. Monitor for repeated failures from same IP
2. Implement temporary blocks
3. Alert security team for investigation
4. Consider phone number blocking

### Unauthorized Access
1. Immediate token invalidation
2. IP blocking if suspicious
3. User notification
4. Security audit of affected resources

### Data Breach Response
1. Isolate affected systems
2. Notify affected users
3. Security audit
4. Regulatory compliance (GDPR)

## Compliance

### GDPR Compliance
- **Data Minimization**: Only collect necessary data
- **Purpose Limitation**: Clear data usage policies
- **Storage Limitation**: Automatic data cleanup
- **User Rights**: Data access, correction, deletion
- **Breach Notification**: 72-hour notification requirement

### Security Best Practices
- **Defense in Depth**: Multiple security layers
- **Fail-Safe Defaults**: Secure by default configuration
- **Principle of Least Privilege**: Minimal required permissions
- **Security Logging**: Comprehensive audit trails
- **Regular Updates**: Keep dependencies updated

## Configuration

### Environment Variables
Required environment variables for security features:

```bash
# Supabase (required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twilio (required for OTP)
TWILIO_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_VERIFY_SID=your-verify-service-sid

# Upstash Redis (required for rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token



### Rate Limit Tuning
Adjust limits based on usage patterns:

```typescript
// Increase limits for high-traffic periods
OTP_REQUEST_LIMIT: 5, // Instead of 3

// Decrease limits for sensitive operations
DELETE_USER_LIMIT: 3, // Instead of 5
```

## Testing Security

### Automated Tests
- Rate limiting enforcement
- Input validation
- Authentication requirements
- Authorization checks
- Error handling

### Penetration Testing
- SQL injection attempts
- XSS attack vectors
- CSRF protection
- Authentication bypass attempts
- Rate limit circumvention

### Load Testing
- Rate limit performance under load
- Concurrent request handling
- Database connection limits
- Memory usage monitoring

## Maintenance

### Regular Tasks
- **Weekly**: Review security logs for anomalies
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Security audit and penetration testing
- **Annually**: Complete security assessment

### Dependency Updates
- Monitor security advisories for all dependencies
- Test security updates in staging environment
- Automated dependency scanning in CI/CD pipeline

### Log Rotation
- Implement log retention policies
- Archive old logs securely
- Ensure GDPR compliance for log data

