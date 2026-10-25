
import {
  evaluateAvailability,
  type AvailabilityMachineryInput,
  type AvailabilityRequestInput,
  type AvailabilityWindowInput,
  type BookingConflictInput,
  type AvailabilityEvaluation,
} from "./availability-engine";

import {
  evaluateCompatibility,
  type CompatibilityMachinery,
  type CompatibilityWorkOrder,
} from "./matching-engine";

export type BookingReadiness =
  | "ready_for_provider_confirmation"
  | "blocked"
  | "requires_verification";

export interface BookingWorkflowInput {
  machinery: AvailabilityMachineryInput &
    CompatibilityMachinery;
  request: AvailabilityRequestInput &
    CompatibilityWorkOrder;
  availabilityWindows: AvailabilityWindowInput[];
  bookings: BookingConflictInput[];
}

export interface BookingWorkflowResult {
  readiness: BookingReadiness;
  compatibility: ReturnType<typeof evaluateCompatibility>;
  availability: AvailabilityEvaluation;
  reasons: string[];
  bookingCreated: false;
}

export function evaluateBookingReadiness(
  input: BookingWorkflowInput,
): BookingWorkflowResult {
  const compatibility = evaluateCompatibility(
    input.machinery,
    input.request,
  );

  const availability = evaluateAvailability(
    input.machinery,
    input.request,
    input.availabilityWindows,
    input.bookings,
  );

  const reasons: string[] = [];

  for (const constraint of compatibility.constraints) {
    reasons.push(constraint.message);
  }

  for (const constraint of availability.constraints) {
    reasons.push(constraint.message);
  }

  if (
    compatibility.result === "infeasible" ||
    availability.status === "infeasible"
  ) {
    return {
      readiness: "blocked",
      compatibility,
      availability,
      reasons,
      bookingCreated: false,
    };
  }

  if (
    compatibility.result === "requires_verification" ||
    availability.status === "requires_verification"
  ) {
    return {
      readiness: "requires_verification",
      compatibility,
      availability,
      reasons,
      bookingCreated: false,
    };
  }

  reasons.push(
    "Checks passed. The provider must confirm before a booking can proceed.",
  );

  return {
    readiness: "ready_for_provider_confirmation",
    compatibility,
    availability,
    reasons,
    bookingCreated: false,
  };
}
