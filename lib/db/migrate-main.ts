import path from 'path';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.MAIN_POSTGRES_URL) {
  throw new Error("MAIN_POSTGRES_URL environment variable is not set. Please add it to your .env file.");
}

const client = neon(process.env.MAIN_POSTGRES_URL);
const db = drizzle(client, { schema });

async function main() {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), '/lib/db/migrations'),
  });
  console.log(`Migrations complete on MAIN branch`);
}

main();
