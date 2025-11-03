#!/bin/bash

echo "========================================="
echo "Testing AiDareU API - CORS & Authentication"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="https://api.aidareu.com"
ORIGIN="https://aidareu.com"

echo -e "${YELLOW}Test 1: OPTIONS Preflight Request${NC}"
echo "Testing CORS preflight for /api/auth/login..."
echo ""

RESPONSE=$(curl -s -i \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  "$API_URL/api/auth/login")

echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: $ORIGIN"; then
  echo -e "${GREEN}✓ CORS Allow-Origin header present${NC}"
else
  echo -e "${RED}✗ CORS Allow-Origin header MISSING${NC}"
fi

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Credentials: true"; then
  echo -e "${GREEN}✓ CORS Allow-Credentials header present${NC}"
else
  echo -e "${RED}✗ CORS Allow-Credentials header MISSING${NC}"
fi

echo ""
echo "========================================="
echo -e "${YELLOW}Test 2: POST Login Request (will fail with invalid credentials)${NC}"
echo "Testing actual POST request to /api/auth/login..."
echo ""

RESPONSE=$(curl -s -i \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"email":"test@example.com","password":"test123"}' \
  "$API_URL/api/auth/login")

echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: $ORIGIN"; then
  echo -e "${GREEN}✓ CORS headers present in POST response${NC}"
else
  echo -e "${RED}✗ CORS headers MISSING in POST response${NC}"
fi

if echo "$RESPONSE" | grep -q "Set-Cookie:"; then
  echo -e "${GREEN}✓ Set-Cookie headers present${NC}"
  echo "Cookies:"
  echo "$RESPONSE" | grep -i "set-cookie:"
else
  echo -e "${YELLOW}! No Set-Cookie headers (expected if login failed)${NC}"
fi

if echo "$RESPONSE" | grep -q "application/json"; then
  echo -e "${GREEN}✓ Response is JSON${NC}"
else
  echo -e "${RED}✗ Response is NOT JSON (probably HTML error)${NC}"
fi

echo ""
echo "========================================="
echo -e "${YELLOW}Test 3: GET Request to Public Endpoint${NC}"
echo "Testing /api/test-env..."
echo ""

RESPONSE=$(curl -s -i \
  -H "Origin: $ORIGIN" \
  "$API_URL/api/test-env")

echo "$RESPONSE"
echo ""

echo "========================================="
echo "Testing complete!"
echo "========================================="
