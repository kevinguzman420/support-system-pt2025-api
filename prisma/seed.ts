import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('demo123', 10);

  // Create Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created Admin user:', admin.email);

  // Create Support user
  const support = await prisma.user.upsert({
    where: { email: 'support@example.com' },
    update: {},
    create: {
      email: 'support@example.com',
      password: hashedPassword,
      name: 'Support Staff',
      role: 'SUPPORT',
    },
  });
  console.log('✅ Created Support user:', support.email);

  // Create Client user
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: hashedPassword,
      name: 'John Client',
      role: 'CLIENT',
    },
  });
  console.log('✅ Created Client user:', client.email);

  // Create sample requests
  const request1 = await prisma.request.create({
    data: {
      title: 'Login Issue',
      description: 'I cannot access my account. The password reset is not working.',
      status: 'PENDING',
      priority: 'HIGH',
      userId: client.id,
    },
  });
  console.log('✅ Created Request:', request1.title);

  const request2 = await prisma.request.create({
    data: {
      title: 'Feature Request',
      description: 'Would be great to have dark mode support in the application.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      userId: client.id,
    },
  });
  console.log('✅ Created Request:', request2.title);

  const request3 = await prisma.request.create({
    data: {
      title: 'Billing Question',
      description: 'I have a question about my last invoice. Can you help?',
      status: 'RESOLVED',
      priority: 'LOW',
      userId: client.id,
    },
  });
  console.log('✅ Created Request:', request3.title);

  // Create sample responses
  const response1 = await prisma.response.create({
    data: {
      content: 'Thank you for reporting this issue. Our team is investigating.',
      requestId: request1.id,
      userId: support.id,
      isAutomatic: false,
    },
  });
  console.log('✅ Created Response for request:', request1.title);

  const response2 = await prisma.response.create({
    data: {
      content: 'We are working on implementing dark mode. Expected release: Q2 2025',
      requestId: request2.id,
      userId: support.id,
      isAutomatic: false,
    },
  });
  console.log('✅ Created Response for request:', request2.title);

  const response3 = await prisma.response.create({
    data: {
      content: 'Your invoice has been reviewed. Everything looks correct. The charges are for your monthly subscription.',
      requestId: request3.id,
      userId: support.id,
      isAutomatic: false,
    },
  });
  console.log('✅ Created Response for request:', request3.title);

  console.log('🎉 Database seeded successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Admin:   admin@example.com / demo123');
  console.log('   Support: support@example.com / demo123');
  console.log('   Client:  client@example.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });