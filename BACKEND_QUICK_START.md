# Backend Quick Start Guide

## 🚀 Running the Improved Backend

### Prerequisites
- Python 3.8+
- pip
- Virtual environment (recommended)

---

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create or update `.env` file:

```env
# Development settings
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-key
DATABASE_URL=sqlite:///instance/transitops.db
FLASK_ENV=development
```

### 3. Initialize Database

The new backend includes audit logging table. Initialize the database:

```bash
# Remove old database (development only)
rm -f instance/transitops.db

# Run the application (will create tables)
python app.py
```

The application will automatically create all tables including:
- users
- vehicles
- drivers
- trips
- maintenance_logs
- fuel_logs
- expenses
- **audit_logs** (NEW)

### 4. Seed Test Data

```bash
python seed_data.py
```

This creates test users with different roles:
- Fleet Manager: manager@transit.com / password123
- Driver: driver@transit.com / password123
- Safety Officer: safety@transit.com / password123
- Financial Analyst: finance@transit.com / password123

---

## 🧪 Testing the New Features

### Test 1: Rate Limiting

Try logging in 6 times in a row with wrong password:

```bash
# This should block you after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "\nAttempt $i"
done
```

Expected: 429 Too Many Requests after 5th attempt

### Test 2: Input Validation

Try creating a vehicle with invalid data:

```bash
# Get token first
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@transit.com","password":"password123"}' \
  | jq -r '.token')

# Try to create vehicle with invalid registration
curl -X POST http://localhost:5000/api/auth/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "registration_number": "ABC@123",
    "vehicle_name": "Test Truck",
    "vehicle_type": "truck",
    "max_load_capacity": 5000,
    "acquisition_cost": 500000
  }'
```

Expected: 400 Validation Error (invalid characters in registration)

### Test 3: Audit Logging

Check audit logs after operations:

```bash
# Login as fleet manager
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@transit.com","password":"password123"}' \
  | jq -r '.token')

# View audit logs
curl -X GET "http://localhost:5000/api/audit/logs?limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

Expected: JSON array of audit log entries

### Test 4: Role-Based Access Control

Try accessing data as driver:

```bash
# Login as driver
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@transit.com","password":"password123"}' \
  | jq -r '.token')

# Try to view all drivers (should be denied)
curl -X GET http://localhost:5000/api/drivers \
  -H "Authorization: Bearer $TOKEN"
```

Expected: 403 Forbidden

### Test 5: Driver Data Isolation

```bash
# Login as driver 1
TOKEN1=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver1@transit.com","password":"password123"}' \
  | jq -r '.token')

# View trips (should only see own trips)
curl -X GET http://localhost:5000/api/trips \
  -H "Authorization: Bearer $TOKEN1" | jq '.trips | length'
```

Expected: Only trips assigned to that driver

---

## 📊 Monitoring Endpoints

### Health Check
```bash
curl http://localhost:5000/
```

### Audit Logs (Fleet Manager Only)

**All audit logs:**
```bash
curl -X GET "http://localhost:5000/api/audit/logs?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

**Security events:**
```bash
curl -X GET "http://localhost:5000/api/audit/security-events?hours=24" \
  -H "Authorization: Bearer $TOKEN"
```

**Failed login attempts:**
```bash
curl -X GET "http://localhost:5000/api/audit/failed-logins?hours=24" \
  -H "Authorization: Bearer $TOKEN"
```

**User activity:**
```bash
curl -X GET "http://localhost:5000/api/audit/user/1" \
  -H "Authorization: Bearer $TOKEN"
```

**Resource history:**
```bash
curl -X GET "http://localhost:5000/api/audit/resource/Vehicle/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Debugging

### Check Rate Limit Headers

```bash
curl -v http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  2>&1 | grep "X-RateLimit"
```

Look for:
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 99`
- `X-RateLimit-Reset: 60`

### View Application Logs

The application logs to console. Look for:
- Audit logging confirmations
- Rate limit violations
- Validation errors
- Access denied events

### Database Inspection

```bash
# Open SQLite database
sqlite3 instance/transitops.db

# View tables
.tables

# Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;

# Check users
SELECT id, email, role, driver_id FROM users;

# Exit
.quit
```

---

## 🛠️ Common Issues & Solutions

### Issue: "Module not found" errors

**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: Database locked errors

**Solution:**
```bash
# Stop all running instances
pkill -f "python app.py"

# Remove database lock
rm -f instance/transitops.db-journal

# Restart
python app.py
```

### Issue: Rate limit blocking legitimate requests

**Solution:**
```bash
# Restart the application (clears in-memory rate limiter)
# Or upgrade to Redis-based rate limiting for persistence
```

### Issue: Audit logs table doesn't exist

**Solution:**
```bash
# Recreate database
rm -f instance/transitops.db
python app.py
```

---

## 📝 Configuration Options

### Rate Limiting

Edit `rate_limiter.py` to adjust limits:

```python
# Strict: Login attempts
rate_limit(max_requests=5, window_seconds=60, block_duration=600)

# Moderate: Write operations
rate_limit(max_requests=30, window_seconds=60, block_duration=300)

# Lenient: Read operations
rate_limit(max_requests=100, window_seconds=60, block_duration=60)
```

### Password Policy

Edit `validators.py`:

```python
def validate_password(password):
    if len(password) < 8:  # Change minimum length
        raise ValidationError("Password must be at least 8 characters")
```

### JWT Token Expiry

Edit `config.py`:

```python
JWT_ACCESS_TOKEN_EXPIRES = 604800  # 7 days (change as needed)
```

---

## 🚀 Production Deployment

### 1. Set Environment Variables

```bash
export FLASK_ENV=production
export SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
export JWT_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_hex(32))')
export DATABASE_URL=postgresql://user:pass@localhost:5432/transitops
```

### 2. Use Production WSGI Server

```bash
# Install gunicorn
pip install gunicorn

# Run with 4 worker processes
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### 3. Enable HTTPS

Use nginx as reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name transit.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. Database Migration to PostgreSQL

```bash
# Install PostgreSQL driver
pip install psycopg2-binary

# Set database URL
export DATABASE_URL=postgresql://user:pass@localhost:5432/transitops

# Run application (creates tables)
python app.py
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Application starts without errors
- [ ] All endpoints are accessible
- [ ] Login works with test accounts
- [ ] Rate limiting blocks excessive requests
- [ ] Audit logs are being created
- [ ] Role-based access control is enforced
- [ ] Input validation rejects invalid data
- [ ] Error messages don't expose sensitive info
- [ ] HTTPS is enabled (production)
- [ ] Database backups are configured (production)

---

## 📞 Support

If you encounter issues:

1. Check the logs in the console
2. Verify database integrity: `sqlite3 instance/transitops.db ".tables"`
3. Review audit logs for access denied events
4. Check Python version: `python --version` (should be 3.8+)
5. Verify all dependencies: `pip list`

---

## 🎉 Success!

If everything is working:
- The API is running on http://localhost:5000
- Frontend can connect and authenticate
- All security features are active
- Audit logging is tracking all operations

You're ready to start using the improved backend! 🚀
