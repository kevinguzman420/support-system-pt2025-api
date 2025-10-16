#!/bin/bash

echo "🧪 Testing CORS Configuration"
echo "================================"
echo ""

API_URL="http://localhost:3000/api/auth/login"
ORIGIN="http://localhost:3001"

echo "1️⃣ Testing OPTIONS (Preflight)"
echo "-----------------------------------"
curl -X OPTIONS "$API_URL" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i \
  -s | head -20

echo ""
echo ""
echo "2️⃣ Testing POST (Login)"
echo "-----------------------------------"
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{"email":"client@example.com","password":"demo123"}' \
  -i \
  -s | head -30

echo ""
echo ""
echo "✅ Test completed!"
echo ""
echo "Expected headers:"
echo "  - Access-Control-Allow-Origin: $ORIGIN"
echo "  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS"
echo "  - Access-Control-Allow-Credentials: true"
