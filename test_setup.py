#!/usr/bin/env python
"""Quick setup test for TransitOps"""

import sys

print("🚀 TransitOps Setup Test\n")
print("=" * 50)

# Test 1: Python version
print("\n✅ Python Version:")
print(f"   {sys.version}")

# Test 2: Import dependencies
print("\n📦 Testing Dependencies:")
deps = [
    ('Flask', 'flask'),
    ('SQLAlchemy', 'flask_sqlalchemy'),
    ('Bcrypt', 'flask_bcrypt'),
    ('JWT', 'jwt'),
    ('python-dotenv', 'dotenv')
]

missing = []
for name, module in deps:
    try:
        __import__(module)
        print(f"   ✅ {name}")
    except ImportError:
        print(f"   ❌ {name} - NOT INSTALLED")
        missing.append(name)

# Test 3: Check files
print("\n📁 Checking Project Files:")
import os
files = [
    'app.py',
    'models.py',
    'services.py',
    'seed_data.py',
    'requirements.txt',
    'static/index.html',
    'static/css/style.css',
    'static/js/app.js'
]

for file in files:
    if os.path.exists(file):
        print(f"   ✅ {file}")
    else:
        print(f"   ❌ {file} - MISSING")

# Summary
print("\n" + "=" * 50)
if missing:
    print(f"\n❌ Missing dependencies: {', '.join(missing)}")
    print("\n📥 To install missing dependencies, run:")
    print("   pip install -r requirements.txt")
    sys.exit(1)
else:
    print("\n✅ All checks passed!")
    print("\n🚀 Ready to run TransitOps!")
    print("\n📝 Next steps:")
    print("   1. python seed_data.py  (Create sample data)")
    print("   2. python app.py        (Start the server)")
    print("   3. Open http://localhost:5000")
    print("\n👤 Login with:")
    print("   Email: admin@transitops.com")
    print("   Password: password123")
