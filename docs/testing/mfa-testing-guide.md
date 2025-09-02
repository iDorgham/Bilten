# MFA Testing Guide

This guide provides comprehensive testing instructions for the Multi-Factor Authentication (MFA) implementation in the Bilten platform.

## Prerequisites

1. **Backend Server Running**: Ensure the backend server is running on `http://localhost:3001`
2. **Database Setup**: Run database migrations to create MFA tables
3. **Dependencies**: Install required packages (`axios` for automated tests)

## Quick Start Testing

### Automated Testing

Run the comprehensive automated test suite:

```bash
cd apps/bilten-backend
npm run test:mfa
```

This will test all MFA functionality including:
- User registration and login
- TOTP setup and verification
- SMS verification
- Backup codes generation and verification
- Error handling and security measures

### Manual Testing

Follow the step-by-step manual testing procedures below.

## Manual Testing Procedures

### 1. User Registration and Initial Login

**Objective**: Verify user can register and login without MFA initially.

**Steps**:
1. Register a new user:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test User",
       "email": "test@bilten.com",
       "password": "TestPassword123!"
     }'
   ```

2. Login without MFA:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@bilten.com",
       "password": "TestPassword123!"
     }'
   ```

**Expected Results**:
- Registration: 201 status with user data
- Login: 200 status with access token (no MFA required)

### 2. TOTP Setup and Enable

**Objective**: Verify TOTP setup process works correctly.

**Steps**:
1. Setup TOTP (requires authentication):
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/setup/totp \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json"
   ```

2. Enable TOTP with verification token:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/enable/totp \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "token": "123456"
     }'
   ```

**Expected Results**:
- Setup: 200 status with secret, QR code URL, and backup codes
- Enable: 200 status with success message

### 3. MFA Status Verification

**Objective**: Verify MFA status is correctly reported.

**Steps**:
1. Check MFA status:
   ```bash
   curl -X GET http://localhost:3001/api/v1/mfa/status \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

**Expected Results**:
- 200 status with MFA enabled: true
- TOTP enabled: true
- Backup codes count: 10

### 4. Login with MFA Required

**Objective**: Verify login flow correctly requires MFA after setup.

**Steps**:
1. Attempt login:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@bilten.com",
       "password": "TestPassword123!"
     }'
   ```

**Expected Results**:
- 200 status with `requiresMFA: true`
- `userId` returned for MFA verification

### 5. TOTP Verification

**Objective**: Verify TOTP token verification works correctly.

**Steps**:
1. Verify TOTP token:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/verify/totp \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "token": "123456"
     }'
   ```

2. Complete login with MFA:
   ```bash
   curl -X POST http://localhost:3001/api/v1/auth/verify-mfa \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "method": "totp",
       "token": "123456"
     }'
   ```

**Expected Results**:
- TOTP verification: 200 status with success
- Complete login: 200 status with access and refresh tokens

### 6. Backup Codes Testing

**Objective**: Verify backup codes functionality.

**Steps**:
1. Generate new backup codes:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/backup-codes/generate \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

2. Retrieve backup codes (masked):
   ```bash
   curl -X GET http://localhost:3001/api/v1/mfa/backup-codes \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

3. Verify backup code:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/verify/backup \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "code": "BACKUP_CODE"
     }'
   ```

**Expected Results**:
- Generation: 200 status with 10 new backup codes
- Retrieval: 200 status with masked codes
- Verification: 200 status with success

### 7. SMS Verification Testing

**Objective**: Verify SMS verification functionality.

**Steps**:
1. Send SMS verification code:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/sms/send \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "+1234567890"
     }'
   ```

2. Verify SMS code:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/sms/verify \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "code": "123456"
     }'
   ```

**Expected Results**:
- Send: 200 status with SMS code (for testing)
- Verification: 200 status with success

### 8. Error Handling Testing

**Objective**: Verify proper error handling for invalid inputs.

**Steps**:
1. Test invalid TOTP token:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/verify/totp \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "token": "000000"
     }'
   ```

2. Test invalid backup code:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/verify/backup \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "code": "INVALID1"
     }'
   ```

3. Test used backup code (should fail):
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/verify/backup \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "USER_ID",
       "code": "ALREADY_USED_CODE"
     }'
   ```

**Expected Results**:
- All should return 400 status with appropriate error messages

### 9. TOTP Disable Testing

**Objective**: Verify TOTP can be disabled correctly.

**Steps**:
1. Disable TOTP:
   ```bash
   curl -X POST http://localhost:3001/api/v1/mfa/disable/totp \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

2. Check MFA status after disable:
   ```bash
   curl -X GET http://localhost:3001/api/v1/mfa/status \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

**Expected Results**:
- Disable: 200 status with success message
- Status: MFA enabled: false, TOTP enabled: false

## Frontend Testing

### 1. MFA Setup Component

**Objective**: Test the MFA setup user interface.

**Steps**:
1. Navigate to MFA setup page
2. Click "Setup TOTP"
3. Scan QR code with authenticator app (Google Authenticator, Authy)
4. Enter verification token
5. Verify setup completion

**Expected Results**:
- QR code displays correctly
- Token verification works
- Setup completion message shown

### 2. MFA Verification Component

**Objective**: Test the MFA verification during login.

**Steps**:
1. Login with credentials
2. Select MFA method (TOTP, SMS, Backup)
3. Enter verification code
4. Verify successful login

**Expected Results**:
- MFA method selection works
- Verification succeeds
- User redirected to dashboard

## Security Testing

### 1. Rate Limiting

**Objective**: Verify rate limiting prevents brute force attacks.

**Steps**:
1. Attempt multiple failed TOTP verifications
2. Attempt multiple failed backup code verifications
3. Attempt multiple SMS code requests

**Expected Results**:
- Rate limiting should block excessive attempts
- Appropriate error messages returned

### 2. Token Expiration

**Objective**: Verify tokens expire correctly.

**Steps**:
1. Generate TOTP setup data
2. Wait for extended period
3. Attempt to enable TOTP with old data

**Expected Results**:
- Old setup data should be invalid
- Appropriate error message returned

### 3. Session Management

**Objective**: Verify proper session handling with MFA.

**Steps**:
1. Login with MFA
2. Use access token for API calls
3. Verify token refresh works
4. Test logout functionality

**Expected Results**:
- Access token works for authenticated requests
- Refresh token works for token renewal
- Logout properly invalidates tokens

## Performance Testing

### 1. Response Times

**Objective**: Verify MFA operations complete within acceptable time.

**Steps**:
1. Measure TOTP setup response time
2. Measure TOTP verification response time
3. Measure backup code generation time

**Expected Results**:
- All operations complete within 2 seconds
- No significant performance degradation

### 2. Concurrent Users

**Objective**: Verify system handles multiple concurrent MFA operations.

**Steps**:
1. Simulate multiple users setting up MFA simultaneously
2. Simulate multiple users verifying MFA simultaneously

**Expected Results**:
- No race conditions
- All operations complete successfully
- Database integrity maintained

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Verify database is running
   - Check connection string in `.env`
   - Run migrations: `npm run migrate`

2. **TOTP Token Mismatch**:
   - Check system clock synchronization
   - Verify authenticator app time settings
   - Ensure secret is correctly copied

3. **SMS Not Sending**:
   - Check Twilio configuration (if using)
   - Verify phone number format
   - Check logs for SMS service errors

4. **Backup Codes Not Working**:
   - Verify codes are correctly generated
   - Check if codes have been used
   - Ensure proper code format (8 characters)

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=mfa:*
```

### Log Analysis

Check application logs for MFA-related entries:
```bash
tail -f logs/application.log | grep -i mfa
```

## Test Data Cleanup

After testing, clean up test data:

```bash
# Remove test user from database
DELETE FROM users.users WHERE email = 'test@bilten.com';

# Remove test MFA settings
DELETE FROM authentication.mfa_settings WHERE user_id = 'TEST_USER_ID';
```

## Next Steps

After successful testing:

1. **Production Deployment**: Configure production environment variables
2. **Monitoring**: Set up monitoring for MFA operations
3. **User Documentation**: Create user guides for MFA setup
4. **Security Audit**: Conduct security review of MFA implementation

## Support

For issues or questions about MFA testing:

1. Check the application logs
2. Review the MFA integration documentation
3. Consult the API reference documentation
4. Contact the development team
