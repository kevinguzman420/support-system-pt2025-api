#!/bin/bash

echo "🧪 Test Completo: Login → Create Request"
echo "=========================================="
echo ""

API_BASE="http://localhost:3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Login
echo "1️⃣ Testing Login..."
echo "-----------------------------------"

LOGIN_RESPONSE=$(curl -X POST "${API_BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{"email":"client@example.com","password":"demo123"}' \
  -s \
  -c cookies.txt \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Login successful (200)${NC}"
    
    # Extract token
    TOKEN=$(echo "$RESPONSE_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo -e "${GREEN}✅ Token received: ${TOKEN:0:30}...${NC}"
    else
        echo -e "${RED}❌ No token in response${NC}"
        exit 1
    fi
    
    # Check cookie
    if [ -f cookies.txt ]; then
        COOKIE_TOKEN=$(grep "auth-token" cookies.txt | awk '{print $7}')
        if [ -n "$COOKIE_TOKEN" ]; then
            echo -e "${GREEN}✅ Cookie set: ${COOKIE_TOKEN:0:30}...${NC}"
        else
            echo -e "${YELLOW}⚠️  No auth-token cookie found${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Login failed ($HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""
echo ""

# Step 2: Create Request (usando token del header)
echo "2️⃣ Testing Create Request (with Authorization header)..."
echo "-----------------------------------"

REQUEST_RESPONSE=$(curl -X POST "${API_BASE}/api/private/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Origin: http://localhost:3001" \
  -d '{"title":"Test Request","description":"This is a test request from bash script","priority":"HIGH"}' \
  -s \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$REQUEST_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REQUEST_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Request created successfully ($HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY" | head -10
else
    echo -e "${RED}❌ Request creation failed ($HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo ""

# Step 3: Create Request (usando cookie)
echo "3️⃣ Testing Create Request (with Cookie)..."
echo "-----------------------------------"

REQUEST_RESPONSE2=$(curl -X POST "${API_BASE}/api/private/requests" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -b cookies.txt \
  -d '{"title":"Test Request 2","description":"This is a test request using cookie","priority":"MEDIUM"}' \
  -s \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$REQUEST_RESPONSE2" | tail -n1)
RESPONSE_BODY=$(echo "$REQUEST_RESPONSE2" | sed '$d')

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Request created successfully with cookie ($HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY" | head -10
else
    echo -e "${RED}❌ Request creation with cookie failed ($HTTP_CODE)${NC}"
    echo "$RESPONSE_BODY"
fi

echo ""
echo ""

# Cleanup
rm -f cookies.txt

echo "=========================================="
echo "✅ Test completed!"
echo ""
echo "Summary:"
echo "--------"
echo "1. Login: Check if token is returned"
echo "2. Create Request (Header): Check if Authorization header works"
echo "3. Create Request (Cookie): Check if cookie authentication works"
echo ""
echo "📝 Check the API server logs for detailed debugging info:"
echo "   - Look for: 🔐 Auth Debug"
echo "   - Look for: ✅ Token verified successfully"
