import { describe, expect, it } from "vitest";
import {
  evaluateAvailability,
  type AvailabilityMachineryInput,
  type AvailabilityRequestInput,
  type AvailabilityWindowInput,
  type BookingConflictInput,
} from "../src/domain/availability-engine";

const machinery: AvailabilityMachineryInput = {
  id: "machine-1",
  status: "active",
};

const request: AvailabilityRequestInput = {
  machineryId: "machine-1",
  startAt: "2026-11-01T10:00:00Z",
  endAt: "2026-11-01T12:00:00Z",
  estimatedDurationMinutes: 120,
};

const availableWindow: AvailabilityWindowInput = {
  id: "window-1",
  machineryId: "machine-1",
  startAt: "2026-11-01T08:00:00Z",
  endAt: "2026-11-01T14:00:00Z",
  status: "available",
  source: "provider_declared",
};

describe("evaluateAvailability", () => {
  it("allows a request covered by declared availability when no conflict exists", () => {
    const result = evaluateAvailability(
      machinery,
      request,
      [availableWindow],
      [],
    );

    expect(result.status).toBe("feasible");
    expect(result.constraints).toHaveLength(1);
    expect(result.constraints[0].code).toBe(
      "DATA_REQUIRES_VERIFICATION",
    );
  });

  it("requires verification when availability data is missing", () => {
    const result = evaluateAvailability(machinery, request, [], []);

    expect(result.status).toBe("requires_verification");
    expect(result.constraints[0].code).toBe(
      "MISSING_AVAILABILITY_DATA",
    );
  });

  it("requires verification when no window fully covers the request", () => {
    const partialWindow: AvailabilityWindowInput = {
      ...availableWindow,
      startAt: "2026-11-01T11:00:00Z",
    };

    const result = evaluateAvailability(
      machinery,
      request,
      [partialWindow],
      [],
    );

    expect(result.status).toBe("requires_verification");
    expect(result.constraints[0].code).toBe(
      "NO_COVERING_AVAILABILITY_WINDOW",
    );
  });

  it("rejects an overlapping confirmed booking", () => {
    const booking: BookingConflictInput = {
      id: "booking-1",
      machineryId: "machine-1",
      startAt: "2026-11-01T11:00:00Z",
      endAt: "2026-11-01T13:00:00Z",
      status: "confirmed",
    };

    const result = evaluateAvailability(
      machinery,
      request,
      [availableWindow],
      [booking],
    );

    expect(result.status).toBe("infeasible");
    expect(result.constraints.some(
      (constraint) => constraint.code === "BOOKING_CONFLICT",
    )).toBe(true);
  });

  it("does not reject adjacent, non-overlapping bookings", () => {
    const booking: BookingConflictInput = {
      id: "booking-1",
      machineryId: "machine-1",
      startAt: "2026-11-01T12:00:00Z",
      endAt: "2026-11-01T14:00:00Z",
      status: "confirmed",
    };

    const result = evaluateAvailability(
      machinery,
      request,
      [availableWindow],
      [booking],
    );

    expect(result.status).toBe("feasible");
  });

  it("rejects maintenance periods", () => {
    const maintenance: AvailabilityWindowInput = {
      id: "maintenance-1",
      machineryId: "machine-1",
      startAt: "2026-11-01T11:00:00Z",
      endAt: "2026-11-01T13:00:00Z",
      status: "blocked",
      source: "maintenance",
    };

    const result = evaluateAvailability(
      machinery,
      request,
      [availableWindow, maintenance],
      [],
    );

    expect(result.status).toBe("infeasible");
    expect(result.constraints.some(
      (constraint) => constraint.code === "MAINTENANCE_CONFLICT",
    )).toBe(true);
  });

  it("rejects inactive machinery", () => {
    const result = evaluateAvailability(
      { ...machinery, status: "maintenance" },
      request,
      [availableWindow],
      [],
    );

    expect(result.status).toBe("infeasible");
    expect(result.constraints[0].code).toBe("RESOURCE_INACTIVE");
  });

  it("requires verification for invalid timestamps in availability data", () => {
    const malformedWindow: AvailabilityWindowInput = {
      ...availableWindow,
      startAt: "not-a-date",
    };

    const result = evaluateAvailability(
      machinery,
      request,
      [malformedWindow],
      [],
    );

    expect(result.status).toBe("requires_verification");
    expect(result.constraints[0].code).toBe(
      "DATA_REQUIRES_VERIFICATION",
    );
  });

  it("rejects an invalid requested time range", () => {
    const result = evaluateAvailability(
      machinery,
      {
        ...request,
        endAt: "2026-11-01T09:00:00Z",
      },
      [availableWindow],
      [],
    );

    expect(result.status).toBe("infeasible");
    expect(result.constraints[0].code).toBe("INVALID_TIME_WINDOW");
  });

  it("ignores bookings belonging to other machinery", () => {
    const otherBooking: BookingConflictInput = {
      id: "booking-2",
      machineryId: "machine-2",
      startAt: "2026-11-01T10:00:00Z",
      endAt: "2026-11-01T12:00:00Z",
      status: "confirmed",
    };

    const result = evaluateAvailability(
      machinery,
      request,
      [availableWindow],
      [otherBooking],
    );

    expect(result.status).toBe("feasible");
  });
});
