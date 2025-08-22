# 🔐 Password Reset Quick Reference

## 🚀 Quick Steps

### 1. Request Reset
```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bilten.com"}'
```

### 2. Get Token from Logs
```bash
docker compose logs bilten-backend --tail=5
# Look for: "Password reset requested for user@bilten.com. Reset token: [TOKEN]"
```

### 3. Reset Password
```bash
curl -X POST http://localhost:3001/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"[TOKEN]","newPassword":"NewPassword123"}'
```

## 🧪 Test Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@bilten.com` | `admin123` | Admin |
| `user@bilten.com` | `user123` | User |
| `organizer@bilten.com` | `organizer123` | Organizer |

## 🔒 Password Requirements

- **Minimum:** 8 characters
- **Must include:** Uppercase + Lowercase + Numbers
- **Example:** `NewPassword123`

## 🔗 Frontend URLs

- **Login:** `http://localhost:3000/login`
- **Forgot Password:** `http://localhost:3000/forgot-password`
- **Reset Password:** `http://localhost:3000/reset-password?token=[TOKEN]`

## ⚠️ Important Notes

- **Token Expiration:** 1 hour
- **Development Mode:** Tokens logged to console (not emailed)
- **Single Use:** Tokens invalidated after reset
- **Test Only:** Use test accounts for development

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| "User Not Found" | Use test accounts listed above |
| "Invalid Token" | Request new reset (tokens expire in 1h) |
| "Validation Error" | Ensure password meets requirements |
| Backend 404 | Restart: `docker compose restart bilten-backend` |

## 📞 Quick Commands

```bash
# Check backend status
curl http://localhost:3001/health

# View recent logs
docker compose logs bilten-backend --tail=10

# Test login after reset
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@bilten.com","password":"NewPassword123"}'
```
