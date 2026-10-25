import { z } from "zod";

export const machineryCategorySchema = z.enum([
  "tractor",
  "seed_drill",
  "rotavator",
  "combine_harvester",
  "sprayer",
  "baler",
  "happy_seeder",
  "super_seeder",
  "laser_land_leveler",
  "cultivator",
  "other",
]);

export type MachineryCategory = z.infer<typeof machineryCategorySchema>;

export const machineryStatusSchema = z.enum([
  "pending_verification",
  "active",
  "maintenance",
  "inactive",
  "retired",
]);

export type MachineryStatus = z.infer<typeof machineryStatusSchema>;

export const machinerySchema = z.object({
  id: z.string().uuid(),
  providerId: z.string().uuid(),

  name: z.string().trim().min(2).max(120),
  category: machineryCategorySchema,
  manufacturer: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  yearOfManufacture: z.number().int().min(1950).max(2100).optional(),

  supportedOperations: z.array(z.string().trim().min(1).max(80)).min(1),
  capabilityTags: z.array(z.string().trim().min(1).max(80)).default([]),
  compatibleImplements: z.array(z.string().trim().min(1).max(80)).default([]),

  requiresOperator: z.boolean().default(true),

  serviceLocation: z.object({
    village: z.string().trim().min(1).max(120),
    district: z.string().trim().min(1).max(120),
    state: z.string().trim().min(1).max(120).default("Punjab"),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),

  serviceRadiusKm: z.number().positive().max(500),

  status: machineryStatusSchema.default("pending_verification"),

  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type Machinery = z.infer<typeof machinerySchema>;

export function parseMachinery(input: unknown): Machinery {
  return machinerySchema.parse(input);
}