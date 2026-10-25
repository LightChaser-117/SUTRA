import { useEffect, useState } from "react";
import {
  machinerySchema,
  machineryCategorySchema,
  type Machinery,
  type MachineryCategory,
} from "../domain/machinery";
import { workOrderSchema, type WorkOrder } from "../domain/work-order";
import { readStoredRecords, writeStoredRecords } from "../lib/storage";
import "./ProviderDashboard.css";

const WORK_ORDERS_KEY = "work-orders";
const MACHINERY_KEY = "machinery";
const RESPONSES_KEY = "provider-work-order-responses";
const PROVIDER_ID_KEY = "sutra:development-provider-id";

type ProviderResponse = {
  workOrderId: string;
  providerId: string;
  status: "accepted" | "rejected";
  updatedAt: string;
};

const categoryOptions: { value: MachineryCategory; label: string }[] = [
  { value: "tractor", label: "Tractor" },
  { value: "seed_drill", label: "Seed drill" },
  { value: "rotavator", label: "Rotavator" },
  { value: "combine_harvester", label: "Combine harvester" },
  { value: "sprayer", label: "Sprayer" },
  { value: "baler", label: "Baler" },
  { value: "happy_seeder", label: "Happy Seeder" },
  { value: "super_seeder", label: "Super Seeder" },
  { value: "laser_land_leveler", label: "Laser land leveler" },
  { value: "cultivator", label: "Cultivator" },
  { value: "other", label: "Other" },
];

const operationOptions = [
  "Ploughing",
  "Cultivation",
  "Rotavator",
  "Seeding",
  "Sowing",
  "Spraying",
  "Harvesting",
  "Baling",
  "Land leveling",
  "Other",
];

function getDevelopmentProviderId(): string {
  const existing = localStorage.getItem(PROVIDER_ID_KEY);

  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(PROVIDER_ID_KEY, id);
  return id;
}

function readValidWorkOrders(): WorkOrder[] {
  return readStoredRecords<WorkOrder>(WORK_ORDERS_KEY).flatMap((record) => {
    const parsed = workOrderSchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
}

function readValidMachinery(): Machinery[] {
  return readStoredRecords<Machinery>(MACHINERY_KEY).flatMap((record) => {
    const parsed = machinerySchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
}

function readResponses(): ProviderResponse[] {
  return readStoredRecords<ProviderResponse>(RESPONSES_KEY).filter(
    (response) =>
      typeof response.workOrderId === "string" &&
      typeof response.providerId === "string" &&
      (response.status === "accepted" || response.status === "rejected") &&
      typeof response.updatedAt === "string",
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function titleCase(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createSampleMachinery(providerId: string): Machinery[] {
  const now = new Date().toISOString();

  const candidates: unknown[] = [
    {
      id: crypto.randomUUID(),
      providerId,
      name: "John Deere 5310",
      category: "tractor",
      supportedOperations: ["Ploughing", "Cultivation"],
      capabilityTags: ["tractor"],
      compatibleImplements: ["cultivator", "rotavator"],
      requiresOperator: true,
      serviceLocation: {
        village: "Provider fleet",
        district: "Unspecified",
        state: "Punjab",
      },
      serviceRadiusKm: 50,
      status: "pending_verification",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      providerId,
      name: "Rotavator",
      category: "rotavator",
      supportedOperations: ["Rotavator", "Cultivation"],
      capabilityTags: ["tillage"],
      compatibleImplements: ["rotavator"],
      requiresOperator: true,
      serviceLocation: {
        village: "Provider fleet",
        district: "Unspecified",
        state: "Punjab",
      },
      serviceRadiusKm: 50,
      status: "pending_verification",
      createdAt: now,
      updatedAt: now,
    },
  ];

  return candidates.flatMap((candidate) => {
    const parsed = machinerySchema.safeParse(candidate);
    return parsed.success ? [parsed.data] : [];
  });
}

export default function ProviderDashboard() {
  const [providerId] = useState(() => getDevelopmentProviderId());

  const [machinery, setMachinery] = useState<Machinery[]>(() => {
    const saved = readValidMachinery();

    if (saved.length > 0) return saved;

    const samples = createSampleMachinery(getDevelopmentProviderId());

    try {
      writeStoredRecords(MACHINERY_KEY, samples);
    } catch {
      // Keep sample data available in memory if storage is unavailable.
    }

    return samples;
  });

  const [requests, setRequests] = useState<WorkOrder[]>(() =>
    readValidWorkOrders(),
  );
  const [responses, setResponses] = useState<ProviderResponse[]>(() =>
    readResponses(),
  );

  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<MachineryCategory>("tractor");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [supportedOperations, setSupportedOperations] = useState<string[]>([]);
  const [capabilityTags, setCapabilityTags] = useState("");
  const [compatibleImplements, setCompatibleImplements] = useState("");
  const [requiresOperator, setRequiresOperator] = useState(true);
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [stateName, setStateName] = useState("Punjab");
  const [serviceRadiusKm, setServiceRadiusKm] = useState("50");

  useEffect(() => {
    function refreshSharedData() {
      setRequests(readValidWorkOrders());
      setMachinery(readValidMachinery());
      setResponses(readResponses());
    }

    window.addEventListener("storage", refreshSharedData);

    return () => window.removeEventListener("storage", refreshSharedData);
  }, []);

  function showNotice(text: string, isError = false) {
    setNotice(text);
    setNoticeIsError(isError);
  }

  function handleOperationChange(operation: string, checked: boolean) {
    setSupportedOperations((current) => {
      if (checked) return [...new Set([...current, operation])];
      return current.filter((item) => item !== operation);
    });
  }

  function registerMachinery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();

    const candidate = {
      id: crypto.randomUUID(),
      providerId,
      name: name.trim(),
      category,
      ...(manufacturer.trim() ? { manufacturer: manufacturer.trim() } : {}),
      ...(model.trim() ? { model: model.trim() } : {}),
      ...(yearOfManufacture
        ? { yearOfManufacture: Number(yearOfManufacture) }
        : {}),
      supportedOperations,
      capabilityTags: capabilityTags
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      compatibleImplements: compatibleImplements
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      requiresOperator,
      serviceLocation: {
        village: village.trim(),
        district: district.trim(),
        state: stateName.trim(),
      },
      serviceRadiusKm: Number(serviceRadiusKm),
      status: "pending_verification",
      createdAt: now,
      updatedAt: now,
    };

    const result = machinerySchema.safeParse(candidate);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      showNotice(
        firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Please check the machinery details.",
        true,
      );
      return;
    }

    const updatedMachinery = [result.data, ...machinery];

    try {
      writeStoredRecords(MACHINERY_KEY, updatedMachinery);
      setMachinery(updatedMachinery);
      showNotice(
        "Machinery registered. It is pending verification and will not be considered active.",
      );

      setName("");
      setCategory("tractor");
      setManufacturer("");
      setModel("");
      setYearOfManufacture("");
      setSupportedOperations([]);
      setCapabilityTags("");
      setCompatibleImplements("");
      setRequiresOperator(true);
      setVillage("");
      setDistrict("");
      setStateName("Punjab");
      setServiceRadiusKm("50");
    } catch {
      showNotice(
        "Could not save machinery. Check browser storage and try again.",
        true,
      );
    }
  }

  function updateRequest(
    workOrderId: string,
    status: ProviderResponse["status"],
  ) {
    const existing = responses.find(
      (response) =>
        response.workOrderId === workOrderId &&
        response.providerId === providerId,
    );

    if (existing) {
      showNotice("You have already responded to this work order.", true);
      return;
    }

    const updatedResponses = [
      {
        workOrderId,
        providerId,
        status,
        updatedAt: new Date().toISOString(),
      },
      ...responses,
    ];

    try {
      writeStoredRecords(RESPONSES_KEY, updatedResponses);
      setResponses(updatedResponses);
      showNotice(
        status === "accepted"
          ? "Response saved locally. This is not a confirmed booking."
          : "Rejection saved locally.",
      );
    } catch {
      showNotice("Could not save your response.", true);
    }
  }

  const activeCount = machinery.filter(
    (item) => item.status === "active",
  ).length;

  // Availability cannot be established without scheduling checks.
  const availableCount = 0;

  const pendingCount = requests.filter(
    (request) =>
      !responses.some(
        (response) =>
          response.workOrderId === request.id &&
          response.providerId === providerId,
      ),
  ).length;

  return (
    <main className="provider-page">
      <header className="provider-header">
        <div>
          <p className="provider-eyebrow">SUTRA · PROVIDER PORTAL</p>
          <h1>Your machinery. Your schedule.</h1>
          <p className="provider-subtitle">
            Manage your fleet and coordinate agricultural work requests.
          </p>
        </div>
        <span className="provider-region">Punjab, India</span>
      </header>

      <section className="provider-summary" aria-label="Fleet summary">
        <article className="provider-stat">
          <span>Total machinery</span>
          <strong>{machinery.length}</strong>
        </article>
        <article className="provider-stat">
          <span>Active machinery</span>
          <strong>{activeCount}</strong>
        </article>
        <article className="provider-stat">
          <span>Available now</span>
          <strong>{availableCount}</strong>
        </article>
        <article className="provider-stat">
          <span>Pending requests</span>
          <strong>{pendingCount}</strong>
        </article>
      </section>

      {notice && (
        <p
          className="provider-notice"
          role={noticeIsError ? "alert" : "status"}
        >
          {notice}
        </p>
      )}

      <section className="provider-panel provider-registration-panel">
        <div className="provider-section-heading">
          <div>
            <p className="provider-eyebrow">ADD A RESOURCE</p>
            <h2>Register machinery</h2>
          </div>
        </div>

        <p className="provider-footnote">
          New machinery is saved as pending verification. Registering a
          machine does not confirm its availability for a work order.
        </p>

        <form className="provider-registration-form" onSubmit={registerMachinery}>
          <label>
            Machinery name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. John Deere 5310"
              minLength={2}
              maxLength={120}
              required
            />
          </label>

          <label>
            Machinery category *
            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  machineryCategorySchema.parse(event.target.value),
                )
              }
              required
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <div className="provider-registration-row">
            <label>
              Manufacturer
              <input
                value={manufacturer}
                onChange={(event) => setManufacturer(event.target.value)}
                maxLength={100}
                placeholder="e.g. John Deere"
              />
            </label>

            <label>
              Model
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                maxLength={100}
                placeholder="Model number"
              />
            </label>
          </div>

          <label>
            Year of manufacture
            <input
              type="number"
              value={yearOfManufacture}
              onChange={(event) => setYearOfManufacture(event.target.value)}
              min={1950}
              max={2100}
              step={1}
              placeholder="e.g. 2022"
            />
          </label>

          <fieldset className="provider-operation-fieldset">
            <legend>Supported operations *</legend>
            <div className="provider-operation-options">
              {operationOptions.map((operation) => (
                <label key={operation} className="provider-checkbox-label">
                  <input
                    type="checkbox"
                    checked={supportedOperations.includes(operation)}
                    onChange={(event) =>
                      handleOperationChange(operation, event.target.checked)
                    }
                  />
                  <span>{operation}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label>
            Capability tags
            <input
              value={capabilityTags}
              onChange={(event) => setCapabilityTags(event.target.value)}
              placeholder="e.g. heavy-duty, tillage, 4WD"
            />
            <small>Separate multiple tags with commas.</small>
          </label>

          <label>
            Compatible implements
            <input
              value={compatibleImplements}
              onChange={(event) => setCompatibleImplements(event.target.value)}
              placeholder="e.g. cultivator, rotavator"
            />
            <small>Separate implements with commas.</small>
          </label>

          <label className="provider-checkbox-label provider-operator-option">
            <input
              type="checkbox"
              checked={requiresOperator}
              onChange={(event) => setRequiresOperator(event.target.checked)}
            />
            <span>Machinery requires an operator</span>
          </label>

          <div className="provider-registration-row">
            <label>
              Service village *
              <input
                value={village}
                onChange={(event) => setVillage(event.target.value)}
                maxLength={120}
                required
                placeholder="Village"
              />
            </label>

            <label>
              District *
              <input
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
                maxLength={120}
                required
                placeholder="District"
              />
            </label>
          </div>

          <label>
            State *
            <input
              value={stateName}
              onChange={(event) => setStateName(event.target.value)}
              maxLength={120}
              required
            />
          </label>

          <label>
            Service radius (km) *
            <input
              type="number"
              value={serviceRadiusKm}
              onChange={(event) => setServiceRadiusKm(event.target.value)}
              min="0.1"
              max="500"
              step="0.1"
              required
            />
          </label>

          <button className="provider-accept" type="submit">
            Register machinery
          </button>
        </form>
      </section>

      <section className="provider-panel">
        <div className="provider-section-heading">
          <div>
            <p className="provider-eyebrow">YOUR FLEET</p>
            <h2>Machinery management</h2>
          </div>
          <span className="provider-count">
            {machinery.length} resources
          </span>
        </div>

        <div className="provider-table-wrap">
          <table className="provider-table">
            <thead>
              <tr>
                <th>Machinery</th>
                <th>Category</th>
                <th>Supported operations</th>
                <th>Service area</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {machinery.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="provider-machine-name">{item.name}</div>
                    <span className="provider-machine-id">
                      {item.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>{titleCase(item.category)}</td>
                  <td>{item.supportedOperations.join(", ")}</td>
                  <td>
                    {item.serviceLocation.village},{" "}
                    {item.serviceLocation.district}
                    <br />
                    <small>{item.serviceRadiusKm} km radius</small>
                  </td>
                  <td>
                    <span
                      className={`provider-status provider-status-${item.status}`}
                    >
                      {titleCase(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="provider-footnote">
          Machinery must be verified and active before it can be considered
          for matching. Real availability requires a scheduling check.
        </p>
      </section>

      <section className="provider-panel provider-requests-panel">
        <div className="provider-section-heading">
          <div>
            <p className="provider-eyebrow">WORK COORDINATION</p>
            <h2>Incoming work requests</h2>
          </div>
          <span className="provider-count">{requests.length} requests</span>
        </div>

        {requests.length === 0 ? (
          <div className="provider-empty">
            <h3>No incoming requests</h3>
            <p>
              Work orders saved in the farmer dashboard will appear here when
              both dashboards use the same browser storage.
            </p>
          </div>
        ) : (
          <div className="provider-request-list">
            {requests.map((request) => {
              const response = responses.find(
                (item) =>
                  item.workOrderId === request.id &&
                  item.providerId === providerId,
              );

              return (
                <article className="provider-request" key={request.id}>
                  <div className="provider-request-symbol" aria-hidden="true">
                    {request.operation.charAt(0)}
                  </div>

                  <div className="provider-request-details">
                    <strong>{request.title}</strong>
                    <span>{request.operation}</span>
                    <span>
                      {request.location.village}, {request.location.district}
                    </span>
                    <span>
                      Preferred start: {formatDate(request.preferredStartAt)}
                    </span>
                    <span>Deadline: {formatDate(request.deadlineAt)}</span>
                    <span>
                      Estimated duration: {request.estimatedDurationMinutes}{" "}
                      minutes
                    </span>
                  </div>

                  {response ? (
                    <span
                      className={`provider-status provider-status-${response.status}`}
                    >
                      {titleCase(response.status)}
                    </span>
                  ) : (
                    <span className="provider-status provider-status-pending">
                      Awaiting response
                    </span>
                  )}

                  {!response && (
                    <div className="provider-actions">
                      <button
                        type="button"
                        className="provider-accept"
                        onClick={() => updateRequest(request.id, "accepted")}
                      >
                        Respond: accept
                      </button>
                      <button
                        type="button"
                        className="provider-reject"
                        onClick={() => updateRequest(request.id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="provider-footer">
        SUTRA · System for Unified Task and Resource Allocation
      </footer>
    </main>
  );
}