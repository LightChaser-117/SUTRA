import { useEffect, useState } from "react";
import { machinerySchema, type Machinery } from "../domain/machinery";
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

function getDevelopmentProviderId(): string {
  const existing = localStorage.getItem(PROVIDER_ID_KEY);

  if (existing) {
    return existing;
  }

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

    if (saved.length > 0) {
      return saved;
    }

    const samples = createSampleMachinery(getDevelopmentProviderId());

    try {
      writeStoredRecords(MACHINERY_KEY, samples);
    } catch {
      // The dashboard can still display the in-memory sample data.
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

  useEffect(() => {
    function refreshSharedData() {
      setRequests(readValidWorkOrders());
      setMachinery(readValidMachinery());
      setResponses(readResponses());
    }

    window.addEventListener("storage", refreshSharedData);

    return () => {
      window.removeEventListener("storage", refreshSharedData);
    };
  }, []);

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
      setNotice("You have already responded to this work order.");
      return;
    }

    const response: ProviderResponse = {
      workOrderId,
      providerId,
      status,
      updatedAt: new Date().toISOString(),
    };

    const updatedResponses = [response, ...responses];

    try {
      writeStoredRecords(RESPONSES_KEY, updatedResponses);
      setResponses(updatedResponses);
      setNotice(
        status === "accepted"
          ? "Response saved locally. This is not a confirmed booking."
          : "Rejection saved locally.",
      );
    } catch {
      setNotice("Could not save your response. Check browser storage.");
    }
  }

  const activeCount = machinery.filter(
    (item) => item.status === "active",
  ).length;

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
        <p className="provider-notice" role="status">
          {notice}
        </p>
      )}

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
                <th>Operational status</th>
                <th>Availability</th>
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

                  <td>
                    <span
                      className={`provider-status provider-status-${item.status}`}
                    >
                      {titleCase(item.status)}
                    </span>
                  </td>

                  <td>
                    {item.status === "active"
                      ? "Requires scheduling check"
                      : "Not available for matching"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="provider-footnote">
          Only verified active machinery can be considered for matching.
          Declared status alone does not establish real-time availability.
        </p>
      </section>

      <section className="provider-panel provider-requests-panel">
        <div className="provider-section-heading">
          <div>
            <p className="provider-eyebrow">WORK COORDINATION</p>
            <h2>Incoming work requests</h2>
          </div>

          <span className="provider-count">
            {requests.length} requests
          </span>
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
                      {request.location.village},{" "}
                      {request.location.district}
                    </span>
                    <span>
                      Preferred start: {formatDate(request.preferredStartAt)}
                    </span>
                    <span>
                      Deadline: {formatDate(request.deadlineAt)}
                    </span>
                    <span>
                      Duration: {request.estimatedDurationMinutes} minutes
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