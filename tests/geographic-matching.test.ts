import { describe, expect, it } from "vitest";
import {
calculateStraightLineDistanceKm,
evaluateGeographicFeasibility,
} from "../src/domain/matching-engine";

const evaluatedAt = "2026-10-25T10:00:00.000Z";

const machinery = {
id: "machine-1",
serviceLocation: {
latitude: 28.8955,
longitude: 76.6066,
},
serviceRadiusKm: 25,
};

const workOrder = {
id: "work-1",
location: {
latitude: 28.9,
longitude: 76.61,
},
};

describe("calculateStraightLineDistanceKm", () => {
it("returns zero for identical coordinates", () => {
expect(
calculateStraightLineDistanceKm(
{ latitude: 28.9, longitude: 76.6 },
{ latitude: 28.9, longitude: 76.6 },
),
).toBe(0);
});

it("calculates a positive distance for different coordinates", () => {
const distance = calculateStraightLineDistanceKm(
{ latitude: 28.9, longitude: 76.6 },
{ latitude: 29, longitude: 76.7 },
);

expect(distance).toBeDefined();
expect(distance).toBeGreaterThan(0);
expect(distance).toBeLessThan(20);


});

it("returns undefined when coordinates are missing", () => {
expect(
calculateStraightLineDistanceKm(
{ latitude: undefined, longitude: 76.6 },
{ latitude: 28.9, longitude: 76.7 },
),
).toBeUndefined();
});

it("returns undefined for invalid coordinate ranges", () => {
expect(
calculateStraightLineDistanceKm(
{ latitude: 91, longitude: 76.6 },
{ latitude: 28.9, longitude: 76.7 },
),
).toBeUndefined();
});

it("handles coordinates across the antimeridian", () => {
const distance = calculateStraightLineDistanceKm(
{ latitude: 0, longitude: 179.9 },
{ latitude: 0, longitude: -179.9 },
);

expect(distance).toBeDefined();
expect(distance).toBeGreaterThan(20);
expect(distance).toBeLessThan(25);


});
});

describe("evaluateGeographicFeasibility", () => {
it("accepts a work site within the service radius", () => {
const result = evaluateGeographicFeasibility(
machinery,
workOrder,
{ evaluatedAt },
);


expect(result.result).toBe("within_service_radius");
expect(result.straightLineDistanceKm).toBeDefined();
expect(result.straightLineDistanceKm).toBeLessThan(25);
expect(result.constraints).toHaveLength(0);


});

it("rejects a work site outside the service radius", () => {
const result = evaluateGeographicFeasibility(
{
...machinery,
serviceRadiusKm: 1,
},
{
...workOrder,
location: { latitude: 29.1, longitude: 76.9 },
},
{ evaluatedAt },
);

expect(result.result).toBe("outside_service_radius");
expect(result.constraints.map((item) => item.code)).toContain(
  "OUTSIDE_SERVICE_RADIUS",
);


});

it("requires verification when the work site coordinates are missing", () => {
const result = evaluateGeographicFeasibility(
machinery,
{
...workOrder,
location: { latitude: undefined, longitude: undefined },
},
{ evaluatedAt },
);


expect(result.result).toBe("requires_verification");
expect(result.constraints.map((item) => item.code)).toContain(
  "MISSING_LOCATION",
);


});

it("requires verification when the service radius is invalid", () => {
const result = evaluateGeographicFeasibility(
{ ...machinery, serviceRadiusKm: 0 },
workOrder,
{ evaluatedAt },
);

expect(result.result).toBe("requires_verification");
expect(result.constraints[0]?.code).toBe(
  "DATA_REQUIRES_VERIFICATION",
);


});

it("returns stable identifiers and timestamp", () => {
const result = evaluateGeographicFeasibility(
machinery,
workOrder,
{ evaluatedAt },
);

expect(result.workOrderId).toBe("work-1");
expect(result.machineryId).toBe("machine-1");
expect(result.evaluatedAt).toBe(evaluatedAt);

});
});
