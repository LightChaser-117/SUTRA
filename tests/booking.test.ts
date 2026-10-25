import { describe, expect, it } from "vitest";
import {
  canTransitionBooking,
  getAllowedBookingTransitions,
} from "../src/domain/booking";

describe("booking lifecycle", () => {
  it("allows a request to be accepted", () => {
    expect(canTransitionBooking("requested", "accepted")).toBe(true);
  });

  it("allows an accepted booking to be confirmed", () => {
    expect(canTransitionBooking("accepted", "confirmed")).toBe(true);
  });

  it("does not allow a requested booking to jump directly to completed", () => {
    expect(canTransitionBooking("requested", "completed")).toBe(false);
  });

  it("does not allow a completed booking to restart", () => {
    expect(canTransitionBooking("completed", "in_progress")).toBe(false);
  });

  it("does not allow a rejected booking to be confirmed", () => {
    expect(canTransitionBooking("rejected", "confirmed")).toBe(false);
  });

  it("returns the allowed transitions for a confirmed booking", () => {
    expect(getAllowedBookingTransitions("confirmed")).toEqual([
      "in_progress",
      "cancelled",
      "failed",
    ]);
  });
});