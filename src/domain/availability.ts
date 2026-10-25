import { z } from "zod";

export const availabilityStatusSchema = z.enum([
  "available",
  "unavailable",
  "reserved",
  "blocked",
]);

export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

export const availabilityWindowSchema = z
  .object({
    id: z.string().uuid(),
    machineryId: z.string().uuid(),

    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),

    status: availabilityStatusSchema,

    source: z.enum([
      "provider_declared",
      "booking",
      "maintenance",
      "administrator",
    ]),

    notes: z.string().trim().max(500).optional(),

    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .refine(
    (window) =>
      new Date(window.endAt).getTime() >
      new Date(window.startAt).getTime(),
    {
      message: "The availability window must end after it starts.",
      path: ["endAt"],
    },
  );

export type AvailabilityWindow = z.infer<typeof availabilityWindowSchema>;

export function parseAvailabilityWindow(
  input: unknown,
): AvailabilityWindow {
  return availabilityWindowSchema.parse(input);
}