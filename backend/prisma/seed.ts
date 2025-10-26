import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@contractr.ai' },
    update: {},
    create: {
      email: 'demo@contractr.ai',
      name: 'Demo User',
    },
  });

  console.log('Seed completed:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
