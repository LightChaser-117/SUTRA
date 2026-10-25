import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "requested",
  "accepted",
  "rejected",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "failed",
]);

export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const bookingSchema = z
  .object({
    id: z.string().uuid(),
    workOrderId: z.string().uuid(),
    machineryId: z.string().uuid(),
    farmerId: z.string().uuid(),
    providerId: z.string().uuid(),

    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),

    status: bookingStatusSchema.default("requested"),

    quotedPrice: z.number().nonnegative().optional(),
    currency: z.string().length(3).default("INR"),

    providerResponseAt: z.string().datetime({ offset: true }).optional(),
    confirmedAt: z.string().datetime({ offset: true }).optional(),
    startedAt: z.string().datetime({ offset: true }).optional(),
    completedAt: z.string().datetime({ offset: true }).optional(),

    cancellationReason: z.string().trim().min(1).max(500).optional(),
    failureReason: z.string().trim().min(1).max(500).optional(),

    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .refine(
    (booking) =>
      new Date(booking.endAt).getTime() >
      new Date(booking.startAt).getTime(),
    {
      message: "The booking must end after it starts.",
      path: ["endAt"],
    },
  );

export type Booking = z.infer<typeof bookingSchema>;

export function parseBooking(input: unknown): Booking {
  return bookingSchema.parse(input);
}

/**
 * Valid transitions for the booking lifecycle.
 *
 * This is a domain-level guard, not a substitute for
 * server-side authorization or database constraints.
 */
const bookingTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["confirmed", "cancelled", "failed"],
  rejected: [],
  confirmed: ["in_progress", "cancelled", "failed"],
  in_progress: ["completed", "failed"],
  completed: [],
  cancelled: [],
  failed: [],
};

export function canTransitionBooking(
  current: BookingStatus,
  next: BookingStatus,
): boolean {
  return bookingTransitions[current].includes(next);
}

export function getAllowedBookingTransitions(
  current: BookingStatus,
): readonly BookingStatus[] {
  return bookingTransitions[current];
}