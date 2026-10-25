
import { useState } from "react";
import "./ProviderDashboard.css";

type MachineryStatus = "Active" | "Maintenance" | "Inactive";
type RequestStatus = "Pending" | "Accepted" | "Rejected";

interface Machinery {
  id: string;
  name: string;
  category: string;
  village: string;
  status: MachineryStatus;
  available: boolean;
}

interface IncomingRequest {
  id: string;
  operation: string;
  village: string;
  date: string;
  status: RequestStatus;
}

const initialMachinery: Machinery[] = [
  {
    id: "M-001",
    name: "John Deere 5310",
    category: "Tractor",
    village: "Provider fleet",
    status: "Active",
    available: true,
  },
  {
    id: "M-002",
    name: "Rotavator",
    category: "Tillage implement",
    village: "Provider fleet",
    status: "Active",
    available: true,
  },
];

const initialRequests: IncomingRequest[] = [
  {
    id: "WO-001",
    operation: "Ploughing",
    village: "Sample village, Punjab",
    date: "2026-11-02",
    status: "Pending",
  },
  {
    id: "WO-002",
    operation: "Rotavator",
    village: "Sample village, Punjab",
    date: "2026-11-04",
    status: "Pending",
  },
];

export default function ProviderDashboard() {
  const [machinery, setMachinery] = useState(initialMachinery);
  const [requests, setRequests] = useState(initialRequests);
  const [notice, setNotice] = useState("");

  function toggleAvailability(id: string) {
    setMachinery((current) =>
      current.map((item) =>
        item.id === id && item.status === "Active"
          ? { ...item, available: !item.available }
          : item,
      ),
    );

    setNotice(
      "Availability preference updated for this session. Scheduling records are not yet connected.",
    );
  }

  function updateRequest(id: string, status: "Accepted" | "Rejected") {
    setRequests((current) =>
      current.map((request) =>
        request.id === id && request.status === "Pending"
          ? { ...request, status }
          : request,
      ),
    );

    setNotice(
      status === "Accepted"
        ? "Request marked accepted in this session. A confirmed booking still requires workflow integration."
        : "Request marked rejected in this session.",
    );
  }

  const activeCount = machinery.filter(
    (item) => item.status === "Active",
  ).length;

  const availableCount = machinery.filter(
    (item) => item.status === "Active" && item.available,
  ).length;

  const pendingCount = requests.filter(
    (request) => request.status === "Pending",
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
                <th>Availability preference</th>
              </tr>
            </thead>

            <tbody>
              {machinery.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="provider-machine-name">{item.name}</div>
                    <span className="provider-machine-id">{item.id}</span>
                  </td>

                  <td>{item.category}</td>

                  <td>
                    <span
                      className={`provider-status provider-status-${item.status.toLowerCase()}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className={`provider-toggle ${
                        item.available ? "is-available" : "is-unavailable"
                      }`}
                      disabled={item.status !== "Active"}
                      onClick={() => toggleAvailability(item.id)}
                    >
                      {item.available ? "Available" : "Unavailable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="provider-footnote">
          Availability preferences are not a substitute for scheduling checks
          or confirmed bookings.
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
            <p>New work requests will appear here when available.</p>
          </div>
        ) : (
          <div className="provider-request-list">
            {requests.map((request) => (
              <article className="provider-request" key={request.id}>
                <div className="provider-request-symbol" aria-hidden="true">
                  {request.operation.charAt(0)}
                </div>

                <div className="provider-request-details">
                  <strong>{request.operation}</strong>
                  <span>{request.village}</span>
                  <span>Preferred date: {request.date}</span>
                </div>

                <span
                  className={`provider-status provider-status-${request.status.toLowerCase()}`}
                >
                  {request.status}
                </span>

                {request.status === "Pending" && (
                  <div className="provider-actions">
                    <button
                      type="button"
                      className="provider-accept"
                      onClick={() => updateRequest(request.id, "Accepted")}
                    >
                      Accept
                    </button>

                    <button
                      type="button"
                      className="provider-reject"
                      onClick={() => updateRequest(request.id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="provider-footer">
        SUTRA · System for Unified Task and Resource Allocation
      </footer>
    </main>
  );
}
