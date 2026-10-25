import { z } from "zod";

export const workOrderStatusSchema = z.enum([
  "draft",
  "submitted",
  "matching",
  "awaiting_provider",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "unfulfilled",
]);

export type WorkOrderStatus = z.infer<typeof workOrderStatusSchema>;

export const workOrderPrioritySchema = z.enum([
  "standard",
  "urgent",
]);

export type WorkOrderPriority = z.infer<typeof workOrderPrioritySchema>;

export const workLocationSchema = z.object({
  village: z.string().trim().min(1).max(120),
  district: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120).default("Punjab"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type WorkLocation = z.infer<typeof workLocationSchema>;

export const workOrderSchema = z
  .object({
    id: z.string().uuid(),
    farmerId: z.string().uuid(),

    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(2000).optional(),

    operation: z.string().trim().min(2).max(100),

    requiredCapabilities: z.array(z.string().trim().min(1).max(80)).default([]),
    requiredImplements: z.array(z.string().trim().min(1).max(80)).default([]),
    requiresOperator: z.boolean().default(true),

    location: workLocationSchema,

    preferredStartAt: z.string().datetime({ offset: true }),
    deadlineAt: z.string().datetime({ offset: true }),

    estimatedDurationMinutes: z.number().int().positive().max(10080),

    priority: workOrderPrioritySchema.default("standard"),
    status: workOrderStatusSchema.default("draft"),

    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .refine(
    (order) =>
      new Date(order.deadlineAt).getTime() >
      new Date(order.preferredStartAt).getTime(),
    {
      message: "The deadline must be later than the preferred start time.",
      path: ["deadlineAt"],
    },
  );

export type WorkOrder = z.infer<typeof workOrderSchema>;

export function parseWorkOrder(input: unknown): WorkOrder {
  return workOrderSchema.parse(input);
}