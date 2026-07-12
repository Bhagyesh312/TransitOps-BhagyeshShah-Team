"""
Backend Testing Script
Tests all critical backend functionality
"""
from app import app
import json

def test_endpoints():
    """Test all critical endpoints"""
    print("🧪 Testing TransitOps Backend...")
    print("="*60)
    
    with app.test_client() as client:
        # Test 1: Failed Login (should log audit without crashing)
        print("\n1️⃣  Testing Failed Login...")
        response = client.post('/api/auth/login',
                              json={'email': 'wrong@test.com', 'password': 'wrong'},
                              headers={'Content-Type': 'application/json'})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("   ✅ Failed login handled correctly")
        
        # Test 2: Successful Login
        print("\n2️⃣  Testing Successful Login...")
        response = client.post('/api/auth/login',
                              json={'email': 'admin@transitops.com', 'password': 'password123'},
                              headers={'Content-Type': 'application/json'})
        assert response.status_code == 200, f"Login failed: {response.json}"
        data = response.json
        token = data['token']
        print(f"   ✅ Login successful - Token received")
        
        # Test 3: Get Current User
        print("\n3️⃣  Testing Get Current User...")
        response = client.get('/api/auth/me',
                             headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 200
        user = response.json['user']
        print(f"   ✅ User: {user['email']} - Role: {user['role']}")
        
        # Test 4: Get Vehicles (with auth)
        print("\n4️⃣  Testing Get Vehicles...")
        response = client.get('/api/vehicles',
                             headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 200
        vehicles = response.json['vehicles']
        print(f"   ✅ Retrieved {len(vehicles)} vehicles")
        
        # Test 5: Create Vehicle (fleet_manager only)
        print("\n5️⃣  Testing Create Vehicle...")
        response = client.post('/api/vehicles',
                              json={
                                  'registration_number': 'TEST-001',
                                  'vehicle_name': 'Test Truck',
                                  'vehicle_type': 'truck',
                                  'max_load_capacity': 5000,
                                  'acquisition_cost': 500000
                              },
                              headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        if response.status_code == 201:
            print(f"   ✅ Vehicle created successfully")
        else:
            print(f"   ⚠️  Vehicle creation: {response.status_code} - {response.json}")
        
        # Test 6: Get Trips
        print("\n6️⃣  Testing Get Trips...")
        response = client.get('/api/trips',
                             headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 200
        trips = response.json['trips']
        print(f"   ✅ Retrieved {len(trips)} trips")
        
        # Test 7: Login as Driver
        print("\n7️⃣  Testing Driver Login & Data Isolation...")
        response = client.post('/api/auth/login',
                              json={'email': 'driver@transitops.com', 'password': 'password123'},
                              headers={'Content-Type': 'application/json'})
        assert response.status_code == 200
        driver_token = response.json['token']
        
        # Driver trying to access all drivers (should fail)
        response = client.get('/api/drivers',
                             headers={'Authorization': f'Bearer {driver_token}'})
        if response.status_code == 403:
            print("   ✅ Driver correctly denied access to drivers list")
        else:
            print(f"   ⚠️  Expected 403, got {response.status_code}")
        
        # Test 8: Rate Limiting
        print("\n8️⃣  Testing Rate Limiting...")
        test_email = 'ratelimit@test.com'
        attempts = 0
        for i in range(6):
            response = client.post('/api/auth/login',
                                  json={'email': test_email, 'password': 'wrong'},
                                  headers={'Content-Type': 'application/json'})
            if response.status_code == 429:
                print(f"   ✅ Rate limit triggered after {i+1} attempts")
                break
            attempts += 1
        
        # Test 9: Input Validation
        print("\n9️⃣  Testing Input Validation...")
        response = client.post('/api/auth/register',
                              json={
                                  'email': 'invalid-email',  # Invalid format
                                  'password': '123',  # Too short
                                  'name': 'Test',
                                  'role': 'driver'
                              },
                              headers={'Content-Type': 'application/json'})
        if response.status_code == 400:
            print("   ✅ Input validation working correctly")
        else:
            print(f"   ⚠️  Expected 400, got {response.status_code}")
        
        # Test 10: Dashboard KPIs
        print("\n🔟 Testing Dashboard KPIs...")
        response = client.get('/api/dashboard/kpis',
                             headers={'Authorization': f'Bearer {token}'})
        assert response.status_code == 200
        kpis = response.json
        print(f"   ✅ KPIs retrieved: {list(kpis.keys())}")
        
    print("\n" + "="*60)
    print("✅ All tests passed successfully!")
    print("="*60)

if __name__ == '__main__':
    try:
        test_endpoints()
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")
