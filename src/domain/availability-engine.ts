
/**
 * SUTRA Availability Engine
 *
 * Evaluates whether machinery can be scheduled for a requested time window.
 * This module does not create bookings or confirm provider availability.
 */

export type AvailabilityEvaluationStatus =
  | "feasible"
  | "infeasible"
  | "requires_verification";

export type AvailabilityConstraintCode =
  | "INVALID_TIME_WINDOW"
  | "MISSING_DURATION"
  | "RESOURCE_INACTIVE"
  | "MISSING_AVAILABILITY_DATA"
  | "NO_COVERING_AVAILABILITY_WINDOW"
  | "AVAILABILITY_BLOCKED"
  | "AVAILABILITY_UNAVAILABLE"
  | "AVAILABILITY_RESERVED"
  | "BOOKING_CONFLICT"
  | "MAINTENANCE_CONFLICT"
  | "DATA_REQUIRES_VERIFICATION";

export interface AvailabilityConstraint {
  code: AvailabilityConstraintCode;
  message: string;
}

export interface AvailabilityWindowInput {
  id: string;
  machineryId: string;
  startAt: string;
  endAt: string;
  status: "available" | "unavailable" | "reserved" | "blocked";
  source?:
    | "provider_declared"
    | "booking"
    | "maintenance"
    | "administrator";
}

export interface BookingConflictInput {
  id: string;
  machineryId: string;
  startAt: string;
  endAt: string;
  status: string;
}

export interface AvailabilityMachineryInput {
  id: string;
  status: string;
}

export interface AvailabilityRequestInput {
  machineryId: string;
  startAt: string;
  endAt: string;
  estimatedDurationMinutes?: number;
}

export interface AvailabilityEvaluation {
  status: AvailabilityEvaluationStatus;
  machineryId: string;
  requestedStartAt: string;
  requestedEndAt: string;
  constraints: AvailabilityConstraint[];
  checkedAvailabilityWindows: number;
  checkedBookings: number;
}

export interface AvailabilityEvaluationOptions {
  /**
   * If true, a covering provider-declared availability window is required.
   * Defaults to true.
   */
  requireDeclaredAvailability?: boolean;

  /**
   * Active booking statuses that reserve machinery.
   * Defaults to common SUTRA booking lifecycle statuses.
   */
  blockingBookingStatuses?: string[];
}

const DEFAULT_BLOCKING_BOOKING_STATUSES = [
  "requested",
  "accepted",
  "confirmed",
  "in_progress",
];

function parseTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function overlaps(
  requestedStart: number,
  requestedEnd: number,
  existingStart: number,
  existingEnd: number,
): boolean {
  // Adjacent time windows do not conflict.
  return requestedStart < existingEnd && existingStart < requestedEnd;
}

function covers(
  requestedStart: number,
  requestedEnd: number,
  windowStart: number,
  windowEnd: number,
): boolean {
  return windowStart <= requestedStart && windowEnd >= requestedEnd;
}

function addConstraint(
  constraints: AvailabilityConstraint[],
  code: AvailabilityConstraintCode,
  message: string,
): void {
  if (!constraints.some((constraint) => constraint.code === code)) {
    constraints.push({ code, message });
  }
}

export function evaluateAvailability(
  machinery: AvailabilityMachineryInput,
  request: AvailabilityRequestInput,
  availabilityWindows: AvailabilityWindowInput[],
  bookings: BookingConflictInput[],
  options: AvailabilityEvaluationOptions = {},
): AvailabilityEvaluation {
  const constraints: AvailabilityConstraint[] = [];

  const requestedStart = parseTimestamp(request.startAt);
  const requestedEnd = parseTimestamp(request.endAt);

  const baseResult = {
    machineryId: machinery.id,
    requestedStartAt: request.startAt,
    requestedEndAt: request.endAt,
    constraints,
    checkedAvailabilityWindows: availabilityWindows.length,
    checkedBookings: bookings.length,
  };

  if (
    requestedStart === null ||
    requestedEnd === null ||
    requestedEnd <= requestedStart
  ) {
    addConstraint(
      constraints,
      "INVALID_TIME_WINDOW",
      "The requested start and end times must be valid, with the end after the start.",
    );

    return { ...baseResult, status: "infeasible" };
  }

  if (
    request.estimatedDurationMinutes !== undefined &&
    (!Number.isFinite(request.estimatedDurationMinutes) ||
      request.estimatedDurationMinutes <= 0)
  ) {
    addConstraint(
      constraints,
      "MISSING_DURATION",
      "The estimated duration must be a positive number of minutes.",
    );

    return { ...baseResult, status: "requires_verification" };
  }

  if (machinery.id !== request.machineryId) {
    addConstraint(
      constraints,
      "DATA_REQUIRES_VERIFICATION",
      "The machinery ID does not match the requested resource.",
    );

    return { ...baseResult, status: "requires_verification" };
  }

  if (machinery.status !== "active") {
    addConstraint(
      constraints,
      "RESOURCE_INACTIVE",
      "The machinery is not marked active.",
    );

    return { ...baseResult, status: "infeasible" };
  }

  const relevantWindows = availabilityWindows.filter(
    (window) => window.machineryId === machinery.id,
  );

  const relevantBookings = bookings.filter(
    (booking) => booking.machineryId === machinery.id,
  );

  const blockingStatuses = new Set(
    (
      options.blockingBookingStatuses ??
      DEFAULT_BLOCKING_BOOKING_STATUSES
    ).map((status) => status.toLowerCase()),
  );

  let requiresVerification = false;
  let infeasible = false;

  // Unknown or malformed scheduling data must never be treated as safe.
  for (const window of relevantWindows) {
    const start = parseTimestamp(window.startAt);
    const end = parseTimestamp(window.endAt);

    if (start === null || end === null || end <= start) {
      addConstraint(
        constraints,
        "DATA_REQUIRES_VERIFICATION",
        `Availability window ${window.id} has invalid time data.`,
      );
      requiresVerification = true;
    }
  }

  for (const booking of relevantBookings) {
    const start = parseTimestamp(booking.startAt);
    const end = parseTimestamp(booking.endAt);

    if (start === null || end === null || end <= start) {
      addConstraint(
        constraints,
        "DATA_REQUIRES_VERIFICATION",
        `Booking ${booking.id} has invalid time data.`,
      );
      requiresVerification = true;
    }
  }

  if (requiresVerification) {
    return { ...baseResult, status: "requires_verification" };
  }

  const overlappingWindows = relevantWindows.filter((window) => {
    const start = parseTimestamp(window.startAt)!;
    const end = parseTimestamp(window.endAt)!;

    return overlaps(requestedStart, requestedEnd, start, end);
  });

  // Maintenance and administrative blocks take priority over availability.
  const blockedWindow = overlappingWindows.find(
    (window) =>
      window.status === "blocked" ||
      window.source === "maintenance" ||
      (window.status === "unavailable" &&
        window.source === "administrator"),
  );

  if (blockedWindow) {
    addConstraint(
      constraints,
      blockedWindow.source === "maintenance"
        ? "MAINTENANCE_CONFLICT"
        : "AVAILABILITY_BLOCKED",
      "The requested time overlaps a blocked or maintenance period.",
    );
    infeasible = true;
  }

  const unavailableWindow = overlappingWindows.find(
    (window) => window.status === "unavailable",
  );

  if (unavailableWindow && !infeasible) {
    addConstraint(
      constraints,
      "AVAILABILITY_UNAVAILABLE",
      "The provider has marked the requested period unavailable.",
    );
    infeasible = true;
  }

  const reservedWindow = overlappingWindows.find(
    (window) => window.status === "reserved",
  );

  if (reservedWindow && !infeasible) {
    addConstraint(
      constraints,
      "AVAILABILITY_RESERVED",
      "The requested period overlaps a reserved availability window.",
    );
    infeasible = true;
  }

  const conflictingBooking = relevantBookings.find((booking) => {
    if (!blockingStatuses.has(booking.status.toLowerCase())) {
      return false;
    }

    const start = parseTimestamp(booking.startAt)!;
    const end = parseTimestamp(booking.endAt)!;

    return overlaps(requestedStart, requestedEnd, start, end);
  });

  if (conflictingBooking) {
    addConstraint(
      constraints,
      "BOOKING_CONFLICT",
      `The requested period overlaps booking ${conflictingBooking.id}.`,
    );
    infeasible = true;
  }

  if (infeasible) {
    return { ...baseResult, status: "infeasible" };
  }

  const requiresDeclaredAvailability =
    options.requireDeclaredAvailability ?? true;

  if (requiresDeclaredAvailability) {
    const coveringWindow = relevantWindows.some((window) => {
      if (
        window.status !== "available" ||
        window.source === "maintenance" ||
        window.source === "booking" ||
        window.source === "administrator"
      ) {
        return false;
      }

      const start = parseTimestamp(window.startAt)!;
      const end = parseTimestamp(window.endAt)!;

      return covers(requestedStart, requestedEnd, start, end);
    });

    if (!coveringWindow) {
      addConstraint(
        constraints,
        relevantWindows.length === 0
          ? "MISSING_AVAILABILITY_DATA"
          : "NO_COVERING_AVAILABILITY_WINDOW",
        "No provider-declared availability window fully covers the requested period.",
      );

      return { ...baseResult, status: "requires_verification" };
    }
  }

  addConstraint(
    constraints,
    "DATA_REQUIRES_VERIFICATION",
    "Scheduling checks passed, but provider confirmation is still required.",
  );

  return { ...baseResult, status: "feasible" };
}

