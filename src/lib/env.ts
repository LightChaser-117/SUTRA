import { z } from "zod";

const environmentSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
});

const parsedEnvironment = environmentSchema.safeParse(import.meta.env);

if (!parsedEnvironment.success) {
  throw new Error(
    `Invalid environment configuration: ${z.treeifyError(parsedEnvironment.error)}`,
  );
}

export const env = parsedEnvironment.data;