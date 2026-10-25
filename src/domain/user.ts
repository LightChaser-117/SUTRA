import { z } from "zod";

/**
 * The supported roles within SUTRA.
 *
 * Roles determine which operations a user may request.
 * Actual authorization must also be enforced by the backend.
 */
export const userRoleSchema = z.enum([
  "farmer",
  "provider",
  "admin",
]);

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Common profile information shared by all user roles.
 *
 * Authentication credentials are intentionally excluded.
 * They belong to the authentication provider, not this profile.
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20).optional(),
  role: userRoleSchema,
  village: z.string().trim().min(1).max(120).optional(),
  district: z.string().trim().min(1).max(120).optional(),
  state: z.string().trim().min(1).max(120).default("Punjab"),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

/**
 * Validates untrusted profile data at runtime.
 *
 * TypeScript types alone cannot validate data received from an API
 * or database, so external data must pass through this schema.
 */
export function parseUserProfile(input: unknown): UserProfile {
  return userProfileSchema.parse(input);
}