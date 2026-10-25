import { useEffect, useState } from "react";
import { workOrderSchema, type WorkOrder } from "../domain/work-order";
import { readStoredRecords, writeStoredRecords } from "../lib/storage";
import "./FarmerDashboard.css";

const FARMER_ID_KEY = "sutra:development-farmer-id";
const WORK_ORDERS_KEY = "work-orders";

const operations = [
  "Ploughing",
  "Cultivation",
  "Rotavator",
  "Seeding",
  "Sowing",
  "Spraying",
  "Harvesting",
  "Baling",
  "Other",
];

function getDevelopmentFarmerId(): string {
  const existing = localStorage.getItem(FARMER_ID_KEY);

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  localStorage.setItem(FARMER_ID_KEY, id);
  return id;
}

function readWorkOrders(): WorkOrder[] {
  return readStoredRecords<WorkOrder>(WORK_ORDERS_KEY).flatMap((record) => {
    const parsed = workOrderSchema.safeParse(record);
    return parsed.success ? [parsed.data] : [];
  });
}

function toLocalDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: WorkOrder["status"]): string {
  return status.replaceAll("_", " ");
}

export default function FarmerDashboard() {
  const [requests, setRequests] = useState<WorkOrder[]>(() =>
    readWorkOrders(),
  );
  const [title, setTitle] = useState("");
  const [operation, setOperation] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [preferredStartAt, setPreferredStartAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("120");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  useEffect(() => {
    function refreshRequests() {
      setRequests(readWorkOrders());
    }

    window.addEventListener("storage", refreshRequests);

    return () => {
      window.removeEventListener("storage", refreshRequests);
    };
  }, []);

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageIsError(false);

    const preferredDate = new Date(preferredStartAt);
    const deadlineDate = new Date(deadlineAt);

    if (
      Number.isNaN(preferredDate.getTime()) ||
      Number.isNaN(deadlineDate.getTime())
    ) {
      setMessage("Enter a valid start time and deadline.");
      setMessageIsError(true);
      return;
    }

    const result = workOrderSchema.safeParse({
      id: crypto.randomUUID(),
      farmerId: getDevelopmentFarmerId(),
      title: title.trim(),
      description: notes.trim() || undefined,
      operation,
      requiredCapabilities: [],
      requiredImplements: [],
      requiresOperator: true,
      location: {
        village: village.trim(),
        district: district.trim(),
        state: "Punjab",
      },
      preferredStartAt: preferredDate.toISOString(),
      deadlineAt: deadlineDate.toISOString(),
      estimatedDurationMinutes: Number(durationMinutes),
      priority: "standard",
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!result.success) {
      const firstIssue = result.error.issues[0];

      setMessage(
        firstIssue
          ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
          : "Please check the work order details.",
      );
      setMessageIsError(true);
      return;
    }

    const updatedRequests = [result.data, ...readWorkOrders()];

    try {
      writeStoredRecords(WORK_ORDERS_KEY, updatedRequests);
      setRequests(updatedRequests);
      setMessage(
        "Work order saved locally. No provider has been booked or confirmed yet.",
      );

      setTitle("");
      setOperation("");
      setVillage("");
      setDistrict("");
      setPreferredStartAt("");
      setDeadlineAt("");
      setDurationMinutes("120");
      setNotes("");
    } catch {
      setMessage(
        "Could not save the work order. Check browser storage and try again.",
      );
      setMessageIsError(true);
    }
  }

  const submittedCount = requests.filter(
    (request) => request.status === "submitted",
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "completed",
  ).length;

  const now = new Date();
  const earliestStart = toLocalDateTimeValue(now);
  const earliestDeadline = toLocalDateTimeValue(
    new Date(now.getTime() + 60_000),
  );

  return (
    <main className="farmer-page">
      <header className="farmer-header">
        <div>
          <p className="farmer-eyebrow">SUTRA · FARMER PORTAL</p>
          <h1>Your farm work, coordinated.</h1>
          <p className="farmer-subtitle">
            Request machinery and keep track of your agricultural work.
          </p>
        </div>
        <span className="farmer-region">Punjab, India</span>
      </header>

      <section className="farmer-summary" aria-label="Request summary">
        <article className="farmer-stat">
          <span>Total requests</span>
          <strong>{requests.length}</strong>
        </article>
        <article className="farmer-stat">
          <span>Submitted</span>
          <strong>{submittedCount}</strong>
        </article>
        <article className="farmer-stat">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </article>
      </section>

      <section className="farmer-content">
        <div className="farmer-form-panel">
          <div className="farmer-section-heading">
            <div>
              <p className="farmer-eyebrow">NEW WORK ORDER</p>
              <h2>Request machinery</h2>
            </div>
            <span className="farmer-step">01 / 01</span>
          </div>

          <form onSubmit={submitRequest} className="farmer-form">
            <label>
              Work order title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Prepare wheat field"
                minLength={3}
                maxLength={160}
                required
              />
            </label>

            <label>
              Agricultural operation
              <select
                value={operation}
                onChange={(event) => setOperation(event.target.value)}
                required
              >
                <option value="">Select operation</option>
                {operations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="farmer-field-row">
              <label>
                Village
                <input
                  value={village}
                  onChange={(event) => setVillage(event.target.value)}
                  placeholder="Enter village"
                  maxLength={120}
                  required
                />
              </label>

              <label>
                District
                <input
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="Enter district"
                  maxLength={120}
                  required
                />
              </label>
            </div>

            <label>
              Preferred start time
              <input
                type="datetime-local"
                value={preferredStartAt}
                onChange={(event) => setPreferredStartAt(event.target.value)}
                min={earliestStart}
                required
              />
            </label>

            <label>
              Deadline
              <input
                type="datetime-local"
                value={deadlineAt}
                onChange={(event) => setDeadlineAt(event.target.value)}
                min={preferredStartAt || earliestDeadline}
                required
              />
            </label>

            <label>
              Estimated work duration
              <select
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                required
              >
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
                <option value="480">8 hours</option>
                <option value="720">12 hours</option>
                <option value="1440">1 day</option>
                <option value="2880">2 days</option>
                <option value="10080">7 days</option>
              </select>
            </label>

            <label>
              Additional requirements
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Field size, equipment requirements, or other details"
                rows={3}
                maxLength={2000}
              />
            </label>

            {message && (
              <p
                className="farmer-feedback"
                role={messageIsError ? "alert" : "status"}
              >
                {message}
              </p>
            )}

            <button className="farmer-submit" type="submit">
              Submit work request <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>

        <aside className="farmer-guidance">
          <p className="farmer-eyebrow">HOW SUTRA WORKS</p>
          <h2>From work request to completion.</h2>

          <ol className="farmer-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Describe the work</strong>
                <p>Tell us what operation you need and where.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Find suitable machinery</strong>
                <p>Compare capabilities, service areas, and availability.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Confirm with the provider</strong>
                <p>A request is not a confirmed booking until accepted.</p>
              </div>
            </li>
          </ol>

          <div className="farmer-note">
            <strong>Transparent by design</strong>
            <p>
              SUTRA distinguishes potential matches from provider-confirmed
              bookings.
            </p>
          </div>
        </aside>
      </section>

      <section className="farmer-requests">
        <div className="farmer-section-heading">
          <div>
            <p className="farmer-eyebrow">YOUR ACTIVITY</p>
            <h2>Recent work requests</h2>
          </div>
          <span className="farmer-count">{requests.length} requests</span>
        </div>

        {requests.length === 0 ? (
          <div className="farmer-empty">
            <span aria-hidden="true">＋</span>
            <h3>No work requests yet</h3>
            <p>Your submitted requests will appear here after saving.</p>
          </div>
        ) : (
          <div className="farmer-request-list">
            {requests.map((request) => (
              <article className="farmer-request" key={request.id}>
                <div className="farmer-request-icon" aria-hidden="true">
                  {request.operation.charAt(0)}
                </div>
                <div className="farmer-request-details">
                  <strong>{request.title}</strong>
                  <span>
                    {request.operation} · {request.location.village},{" "}
                    {request.location.district}
                  </span>
                </div>
                <div className="farmer-request-date">
                  <span>Preferred start</span>
                  <strong>{formatDate(request.preferredStartAt)}</strong>
                </div>
                <span className="farmer-status">
                  {formatStatus(request.status)}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="farmer-footer">
        SUTRA · System for Unified Task and Resource Allocation
      </footer>
    </main>
  );
}