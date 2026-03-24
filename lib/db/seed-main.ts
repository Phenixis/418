import dotenv from 'dotenv';

dotenv.config({ quiet: true });

if (!process.env.MAIN_POSTGRES_URL) {
  throw new Error('MAIN_POSTGRES_URL environment variable is not set. Please add it to your .env file.');
}

// Reuse the existing seed script by overriding the runtime DB URL.
process.env.POSTGRES_URL = process.env.MAIN_POSTGRES_URL;

await import('./seed');