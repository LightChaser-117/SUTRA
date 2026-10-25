
import { Link } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  return (
    <main className="home-page">
      <nav className="home-nav">
        <Link to="/" className="home-brand">
          <span className="home-brand-mark">S</span>
          SUTRA
        </Link>
        <span className="home-nav-caption">
          Agricultural Resource Coordination
        </span>
      </nav>

      <section className="home-hero">
        <p className="home-eyebrow">BUILT FOR AGRICULTURE</p>
        <h1>
          The right machinery.
          <br />
          At the right time.
        </h1>
        <p className="home-description">
          Coordinate agricultural work requests, find suitable machinery, and
          bring farmers and machinery providers onto one platform.
        </p>

        <div className="home-actions">
          <Link to="/farmer" className="home-button home-button-primary">
            I'm a farmer <span aria-hidden="true">→</span>
          </Link>
          <Link to="/provider" className="home-button home-button-secondary">
            I'm a machinery provider <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="home-disclaimer">
          Matching results indicate potential suitability. Bookings require
          provider confirmation.
        </p>
      </section>

      <section className="home-features">
        <article>
          <span>01</span>
          <h2>Request work</h2>
          <p>Describe the operation, location, and preferred work date.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Evaluate matches</h2>
          <p>Assess machinery capabilities, location, and scheduling.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Coordinate execution</h2>
          <p>Move from provider confirmation to work completion.</p>
        </article>
      </section>

      <footer className="home-footer">
        SUTRA · System for Unified Task and Resource Allocation
      </footer>
    </main>
  );
}

