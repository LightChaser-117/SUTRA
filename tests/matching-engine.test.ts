import { describe, expect, it } from "vitest";
import { evaluateCompatibility } from "../src/domain/matching-engine";

const machinery = {
  id: "machine-1",
  status: "active",
  supportedOperations: ["rotavating", "cultivating"],
  capabilityTags: ["heavy-soil"],
  compatibleImplements: ["rotavator"],
};

const workOrder = {
  id: "work-1",
  operation: "rotavating",
  requiredCapabilities: ["heavy-soil"],
  requiredImplements: ["rotavator"],
};

const evaluatedAt = "2026-10-25T10:00:00.000Z";

describe("evaluateCompatibility", () => {
  it("accepts compatible active machinery", () => {
    const result = evaluateCompatibility(machinery, workOrder, { evaluatedAt });
    expect(result.result).toBe("feasible");
    expect(result.constraints).toHaveLength(0);
  });

  it("rejects unsupported operations", () => {
    const result = evaluateCompatibility(
      { ...machinery, supportedOperations: ["cultivating"] },
      workOrder,
      { evaluatedAt },
    );
    expect(result.result).toBe("infeasible");
    expect(result.constraints.map((item) => item.code)).toContain("CAPABILITY_MISMATCH");
  });

  it("rejects missing required capabilities", () => {
    const result = evaluateCompatibility(
      { ...machinery, capabilityTags: [] },
      workOrder,
      { evaluatedAt },
    );
    expect(result.result).toBe("infeasible");
  });

  it("rejects missing required implements", () => {
    const result = evaluateCompatibility(
      { ...machinery, compatibleImplements: [] },
      workOrder,
      { evaluatedAt },
    );
    expect(result.result).toBe("infeasible");
    expect(result.constraints.map((item) => item.code)).toContain("IMPLEMENT_MISMATCH");
  });

  it("requires verification when implement data is missing", () => {
    const result = evaluateCompatibility(
      { ...machinery, compatibleImplements: undefined },
      workOrder,
      { evaluatedAt },
    );
    expect(result.result).toBe("requires_verification");
    expect(result.constraints.map((item) => item.code)).toContain("MISSING_IMPLEMENT_DATA");
  });

  it("rejects inactive machinery", () => {
    const result = evaluateCompatibility(
      { ...machinery, status: "maintenance" },
      workOrder,
      { evaluatedAt },
    );
    expect(result.result).toBe("infeasible");
    expect(result.constraints.map((item) => item.code)).toContain("RESOURCE_INACTIVE");
  });

  it("requires verification for unverified data", () => {
    const result = evaluateCompatibility(machinery, workOrder, {
      requiresVerification: true,
      evaluatedAt,
    });
    expect(result.result).toBe("requires_verification");
    expect(result.constraints.map((item) => item.code)).toContain("DATA_REQUIRES_VERIFICATION");
  });

  it("prioritizes known incompatibility over verification warnings", () => {
    const result = evaluateCompatibility(
      { ...machinery, supportedOperations: [] },
      workOrder,
      { requiresVerification: true, evaluatedAt },
    );
    expect(result.result).toBe("infeasible");
  });

  it("compares values case-insensitively and ignores surrounding whitespace", () => {
    const result = evaluateCompatibility(
      {
        ...machinery,
        supportedOperations: [" ROTAVATING "],
        capabilityTags: [" Heavy-Soil "],
        compatibleImplements: [" ROTAVATOR "],
      },
      {
        ...workOrder,
        operation: "Rotavating",
        requiredCapabilities: ["HEAVY-SOIL"],
        requiredImplements: ["Rotavator"],
      },
      { evaluatedAt },
    );
    expect(result.result).toBe("feasible");
  });

  it("returns work-order and machinery identifiers", () => {
    const result = evaluateCompatibility(machinery, workOrder, { evaluatedAt });
    expect(result.workOrderId).toBe("work-1");
    expect(result.machineryId).toBe("machine-1");
    expect(result.evaluatedAt).toBe(evaluatedAt);
  });
});
