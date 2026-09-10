import { seedDatabase } from './seedData';

async function run() {
  try {
    await seedDatabase(true);
    console.log('Seed runner completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed runner failed:', error);
    process.exit(1);
  }
}

run();
