
import { prisma } from '../lib/prisma';

async function main() {
  const count = await prisma.globalUser.count();
  console.log(`GlobalUser count: ${count}`);
  if (count > 0) {
    const users = await prisma.globalUser.findMany({ select: { username: true } });
    console.log('Existing users:', users.map(u => u.username));
  } else {
    console.log('No GlobalUser found.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
