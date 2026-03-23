import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless'
import * as schema from './schema';

// The problem with these lines is that they can't be run when using `pnpm dev` because the dotenv package is not supported in the Edge Runtime.
// But they are necessary when using `pnpm db:migrate`.
// So, you need to comment or uncomment them based on your next usage.
// import dotenv from 'dotenv';
// dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is not set or the dotenv package hasn't been loaded. To load it, uncomment the line 5 and 6 of drizzle.ts.");
}

export const client = neon(process.env.POSTGRES_URL);
export const db = drizzle(client, { schema });
