/**

* SUTRA matching engine — compatibility evaluation.
*
* This module evaluates whether machinery is a potential match for a work
* order based on operation, capabilities, implements, and resource status.
*
* It does not reserve machinery or confirm a booking.
  */

export type CompatibilityResult =
| "feasible"
| "infeasible"
| "requires_verification";

export type CompatibilityConstraintCode =
| "CAPABILITY_MISMATCH"
| "IMPLEMENT_MISMATCH"
| "RESOURCE_INACTIVE"
| "MISSING_OPERATION"
| "MISSING_CAPABILITIES"
| "MISSING_IMPLEMENT_DATA"
| "DATA_REQUIRES_VERIFICATION";

export interface CompatibilityConstraint {
code: CompatibilityConstraintCode;
message: string;
severity: "error" | "warning";
evidence?: Record<string, unknown>;
}

export interface CompatibilityMachinery {
id: string;
status: string;
supportedOperations?: string[];
capabilityTags?: string[];
compatibleImplements?: string[];
}

export interface CompatibilityWorkOrder {
id: string;
operation?: string;
requiredCapabilities?: string[];
requiredImplements?: string[];
}

export interface CompatibilityEvaluation {
workOrderId: string;
machineryId: string;
result: CompatibilityResult;
constraints: CompatibilityConstraint[];
evaluatedAt: string;
}

export interface CompatibilityOptions {
/**

* Set true when the relevant machinery information has not been verified.
* A candidate can therefore require verification even when its declared
* capabilities appear compatible.
  */
  requiresVerification?: boolean;

/**

* Supply a stable timestamp in tests to make results reproducible.
* Defaults to the current time.
  */
  evaluatedAt?: string;
  }

function normalize(value: string): string {
return value.trim().toLowerCase();
}

function normalizeList(values: string[]): Set<string> {
return new Set(
values
.filter((value) => value.trim().length > 0)
.map(normalize),
);
}

/**

* Evaluates operation, capability, implement, and resource-status compatibility.
*
* Known incompatibilities take precedence over missing or unverified data.
* Missing information never silently counts as a successful check.
  */
  export function evaluateCompatibility(
  machinery: CompatibilityMachinery,
  workOrder: CompatibilityWorkOrder,
  options: CompatibilityOptions = {},
  ): CompatibilityEvaluation {
  const constraints: CompatibilityConstraint[] = [];

const addConstraint = (
constraint: CompatibilityConstraint,
): void => {
constraints.push(constraint);
};

const operation = workOrder.operation?.trim();
const supportedOperations = machinery.supportedOperations;
const capabilityTags = machinery.capabilityTags;
const compatibleImplements = machinery.compatibleImplements;

if (machinery.status.trim().toLowerCase() !== "active") {
addConstraint({
code: "RESOURCE_INACTIVE",
message: "Machinery is not in active status.",
severity: "error",
evidence: { status: machinery.status },
});
}

if (!operation) {
addConstraint({
code: "MISSING_OPERATION",
message: "The work order does not specify an operation.",
severity: "warning",
});
} else if (supportedOperations === undefined) {
addConstraint({
code: "MISSING_CAPABILITIES",
message: "Supported operations have not been recorded.",
severity: "warning",
evidence: { requestedOperation: operation },
});
} else if (
!normalizeList(supportedOperations).has(normalize(operation))
) {
addConstraint({
code: "CAPABILITY_MISMATCH",
message: "Machinery does not list the requested operation.",
severity: "error",
evidence: {
requestedOperation: operation,
supportedOperations,
},
});
}

const requiredCapabilities = workOrder.requiredCapabilities ?? [];

if (requiredCapabilities.length > 0 && capabilityTags === undefined) {
addConstraint({
code: "MISSING_CAPABILITIES",
message: "Machinery capability tags are missing.",
severity: "warning",
evidence: { requiredCapabilities },
});
} else if (requiredCapabilities.length > 0) {
const availableCapabilities = normalizeList(capabilityTags ?? []);
const missingCapabilities = requiredCapabilities.filter(
(capability) => !availableCapabilities.has(normalize(capability)),
);


if (missingCapabilities.length > 0) {
  addConstraint({
    code: "CAPABILITY_MISMATCH",
    message: "One or more required capabilities are not listed.",
    severity: "error",
    evidence: {
      missingCapabilities,
      availableCapabilities: [...availableCapabilities],
    },
  });
}


}

const requiredImplements = workOrder.requiredImplements ?? [];

if (requiredImplements.length > 0 && compatibleImplements === undefined) {
addConstraint({
code: "MISSING_IMPLEMENT_DATA",
message: "Machinery implement compatibility has not been recorded.",
severity: "warning",
evidence: { requiredImplements },
});
} else if (requiredImplements.length > 0) {
const availableImplements = normalizeList(compatibleImplements ?? []);
const missingImplements = requiredImplements.filter(
(implement) => !availableImplements.has(normalize(implement)),
);

if (missingImplements.length > 0) {
  addConstraint({
    code: "IMPLEMENT_MISMATCH",
    message: "One or more required implements are not listed as compatible.",
    severity: "error",
    evidence: {
      missingImplements,
      availableImplements: [...availableImplements],
    },
  });
}

}

if (options.requiresVerification) {
addConstraint({
code: "DATA_REQUIRES_VERIFICATION",
message: "Machinery information requires verification.",
severity: "warning",
});
}

const hasError = constraints.some(
(constraint) => constraint.severity === "error",
);

const requiresVerification =
options.requiresVerification === true ||
constraints.some((constraint) => constraint.severity === "warning");

const result: CompatibilityResult = hasError
? "infeasible"
: requiresVerification
? "requires_verification"
: "feasible";

return {
workOrderId: workOrder.id,
machineryId: machinery.id,
result,
constraints,
evaluatedAt: options.evaluatedAt ?? new Date().toISOString(),
};
}
