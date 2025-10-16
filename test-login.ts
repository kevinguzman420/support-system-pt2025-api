import { PrismaClient } from './generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing login functionality...');

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: 'client@example.com' }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Password hash:', user.password.substring(0, 20) + '...');

    // Test password comparison
    const testPassword = 'demo123';
    const isValid = await bcrypt.compare(testPassword, user.password);

    console.log('\n🔐 Password validation:');
    console.log('   Test password:', testPassword);
    console.log('   Is valid:', isValid ? '✅ CORRECT' : '❌ INCORRECT');

    if (isValid) {
      console.log('\n🎉 Login functionality is working correctly!');
      console.log('   The issue might be in the API endpoint or frontend implementation.');
    } else {
      console.log('\n❌ Password validation failed!');
      console.log('   The stored password hash might be corrupted.');
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();