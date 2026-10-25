
import { useState } from "react";
import "./FarmerDashboard.css";

interface WorkRequest {
  id: string;
  operation: string;
  village: string;
  preferredDate: string;
  status: "Draft" | "Submitted";
}

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

export default function FarmerDashboard() {
  const [requests, setRequests] = useState<WorkRequest[]>([]);
  const [operation, setOperation] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");

  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const request: WorkRequest = {
      id: crypto.randomUUID(),
      operation,
      village: `${village.trim()}, ${district.trim()}`,
      preferredDate,
      status: "Submitted",
    };

    setRequests((current) => [request, ...current]);
    setMessage(
      "Request added to this session. Backend submission is not connected yet.",
    );

    setOperation("");
    setVillage("");
    setDistrict("");
    setPreferredDate("");
    setNotes("");
  }

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
          <strong>
            {requests.filter((request) => request.status === "Submitted").length}
          </strong>
        </article>
        <article className="farmer-stat">
          <span>Completed</span>
          <strong>0</strong>
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
                  required
                />
              </label>

              <label>
                District
                <input
                  value={district}
                  onChange={(event) => setDistrict(event.target.value)}
                  placeholder="Enter district"
                  required
                />
              </label>
            </div>

            <label>
              Preferred work date
              <input
                type="date"
                value={preferredDate}
                onChange={(event) => setPreferredDate(event.target.value)}
                min={new Date().toLocaleDateString("en-CA")}
                required
              />
            </label>

            <label>
              Additional requirements
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Field size, equipment requirements, or other details"
                rows={3}
              />
            </label>

            {message && (
              <p className="farmer-feedback" role="status">
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
              SUTRA will distinguish potential matches from provider-confirmed
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
            <p>Your submitted requests will appear here during this session.</p>
          </div>
        ) : (
          <div className="farmer-request-list">
            {requests.map((request) => (
              <article className="farmer-request" key={request.id}>
                <div className="farmer-request-icon" aria-hidden="true">
                  {request.operation.charAt(0)}
                </div>
                <div className="farmer-request-details">
                  <strong>{request.operation}</strong>
                  <span>{request.village}</span>
                </div>
                <div className="farmer-request-date">
                  <span>Preferred date</span>
                  <strong>{request.preferredDate}</strong>
                </div>
                <span className="farmer-status">{request.status}</span>
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
