const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWZ1MzFvcW4wMDBrd3p0dms2aGcyemZlIiwiZW1haWwiOiJnYWJyaWVsY2FsbGlzYXlhZGlhekBnbWFpbC5jb20iLCJmaXJzdE5hbWUiOiJKdWFuIiwibGFzdE5hbWUiOiJQZXJleiIsInJvbGUiOiJVU0VSX0NBU1VBTCIsImlhdCI6MTc1ODQ4MzA1NywiZXhwIjoxNzU4NDgzOTU3fQ.liivnzJK36v5NbaJHsaTp1Wqgzv9vYlkrzaHlB4Zxng';
const secret = 'citylights-auth-jwt-secret-2024-very-secure-key-change-in-production';

try {
  const decoded = jwt.verify(token, secret);
  console.log('✅ Token válido');
  console.log('📋 Payload:', decoded);
  console.log('⏰ Expira:', new Date(decoded.exp * 1000));
  console.log('🕒 Ahora:', new Date());
  console.log('⏳ Válido:', decoded.exp * 1000 > Date.now());
} catch (error) {
  console.log('❌ Token inválido:', error.message);
}