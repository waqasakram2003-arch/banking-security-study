// REPLACE your existing AboutUs.jsx with this vulnerable version:

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";

const values = [
  // ... (keep your existing values array unchanged)
  {
    title: "Integrity",
    text: "We put ethical behaviour at the core of our operations, earning trust and confidence of our stakeholders. A detailed code of ethics guides acceptable behaviour, values, and principles across every level of the organization. We also maintain transparency in dealings and clear communication with customers and partners."
  },
  {
    title: "Customer Focus",
    text: "We strive to exceed customer expectations by providing innovative financial products and exceptional banking services in Pakistan. Leveraging the latest technology and market insights, we deliver efficient and convenient solutions to offer maximum value and seamless banking experiences."
  },
  {
    title: "Fairness",
    text: "We treat all customers, employees, and partners respectfully and ensure unbiased decision-making in all interactions, regardless of differences in status, background, or other demographics. For customers, this means transparency in fees and charges, clear communication about products and services, and fair lending practices."
  },
  {
    title: "Teamwork",
    text: "Our team consists of experts from diverse fields, each bringing valuable skills and insights to the table. We utilize these strengths to craft innovative solutions and address the evolving needs of our clients. Ongoing training and knowledge sharing enable employees to learn from one another and support each other in meeting challenges."
  },
  {
    title: "Commitment to Goals",
    text: "We are highly committed to our goals, working relentlessly to achieve them and uphold standards of excellence. With clear vision and mission, teams establish strategic plans and specific objectives needed for success, creating a culture where everyone understands their role in the bank's growth."
  }
];

function AboutUs() {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ name: "", comment: "" });
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(true);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  const session = useMemo(() => {
    try {
      const raw = localStorage.getItem("internetBankingSession");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const loggedInName = String(session?.username || "").trim();
  const isLoggedIn = Boolean(loggedInName);

  function clearSessionBeforeNavigate() {
    localStorage.removeItem("internetBankingSession");
    sessionStorage.removeItem("internetBankingSession");
    document.cookie = "internetBankingSession=; Max-Age=0; path=/";
  }

  function handleLogout() {
    clearSessionBeforeNavigate();
    setIsLogoutModalOpen(false);
    window.location.reload();
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setFeedbackForm((prev) => ({ ...prev, name: loggedInName }));
    }
  }, [isLoggedIn, loggedInName]);

  async function loadFeedback() {
    setIsFeedbackLoading(true);
    setFeedbackError("");

    try {
      const response = await fetch("http://localhost:3000/api/feedback");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to load feedback");
      }

      setFeedbackItems(Array.isArray(result?.feedback) ? result.feedback : []);
    } catch (error) {
      setFeedbackError(error.message || "Unable to load feedback");
    } finally {
      setIsFeedbackLoading(false);
    }
  }

  function handleFeedbackInputChange(event) {
    const { name, value } = event.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault();
    setFeedbackMessage("");
    setFeedbackError("");

    const payload = {
      name: isLoggedIn ? loggedInName : String(feedbackForm.name || "").trim(),
      comment: String(feedbackForm.comment || "").trim()
    };

    if (!payload.name || !payload.comment) {
      setFeedbackError("Please enter your name and comment.");
      return;
    }

    // VULNERABLE: No sanitization - direct backend submission
    setIsFeedbackSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to submit feedback");
      }

      const newFeedback = result?.feedback;
      if (newFeedback) {
        setFeedbackItems((prev) => [newFeedback, ...prev]);
      }
      setFeedbackForm({ name: isLoggedIn ? loggedInName : "", comment: "" });
      setFeedbackMessage("Thanks for your Feedback");
    } catch (error) {
      setFeedbackError(error.message || "Unable to submit feedback");
    } finally {
      setIsFeedbackSubmitting(false);
    }
  }

  function formatFeedbackDate(dateValue) {
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }
    return parsedDate.toLocaleString();
  }

  // 🔥 VULNERABLE XSS FUNCTIONS FOR YOUR DEMO
  const renderFeedbackName = (name) => {
    // CRITICAL XSS: Direct unsanitized HTML injection in name field
    return <strong dangerouslySetInnerHTML={{ __html: name || '' }} />;
  };

  const renderFeedbackComment = (comment) => {
    // CRITICAL XSS: Direct unsanitized HTML injection in comment field
    return <p dangerouslySetInnerHTML={{ __html: comment || '' }} />;
  };

  const renderFeedbackCard = (item) => {
    // XSS vector #1: Name field injection
    // XSS vector #2: Comment field injection  
    // XSS vector #3: Session cookie theft via img src
    return (
      <article key={item._id || `${item.name}-${item.createdAt}`} className="about-feedback-card">
        <div className="about-feedback-card-head">
          {renderFeedbackName(item.name)}
          <time dateTime={item.createdAt}>{formatFeedbackDate(item.createdAt)}</time>
        </div>
        {renderFeedbackComment(item.comment)}
      </article>
    );
  };

  return (
    <div className="page-wrap">
      {/* Keep your existing header unchanged */}
      <header className="topbar">
        <div className="brand-wrap">
          <Link to="/" aria-label="Go to home">
            <img className="brand-logo" src="/images/public-bank-logo-vector.svg" alt="Public Bank" />
          </Link>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <div className="dropdown">
            <button className="nav-link" type="button">
              Accounts
            </button>
            <div className="menu-panel">
              <Link to="/accounts/asaan-saving-account">Saving Account</Link>
              <Link to="/accounts/zabardast-current-account">Current Account</Link>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              Digital Banking
            </button>
            <div className="menu-panel">
              <Link to="/internet-banking" target="_blank" rel="noreferrer" onClick={clearSessionBeforeNavigate}>
                Internet Banking
              </Link>
            </div>
          </div>

          <div className="dropdown">
            <Link className="nav-link" to="/cards">
              Cards
            </Link>
            <div className="menu-panel cards-menu-panel">
              <div className="cards-menu-section">
                <p className="cards-menu-title">Debit Cards</p>
                <Link to="/cards/visa-debit-card">Visa Debit Card</Link>
                <Link to="/cards/paypak-debit-card">PayPak Debit Card</Link>
              </div>

              <div className="cards-menu-divider" />

              <div className="cards-menu-section">
                <p className="cards-menu-title">Credit Cards</p>
                <Link to="/cards/mastercard-credit-card">MasterCard Credit Card</Link>
                <Link to="/cards/world-mastercard-credit-card">World MasterCard Credit Card</Link>
              </div>
            </div>
          </div>

          <Link className="nav-link" to="/about-us">
            About Us
          </Link>
        </nav>

        <div className="action-wrap">
          {session?.username ? (
            <>
              <Link className="btn btn-blue" to="/transfer-money">
                Transfer Money
              </Link>
              <Link className="user-badge user-name-badge" to="/account" aria-label="Open account profile">
                <img
                  className="user-badge-avatar"
                  src={session?.user?.application?.userImage || "/images/public-bank-logo-vector.svg"}
                  alt="User"
                />
                <strong>{session.username}</strong>
              </Link>
              <button type="button" className="btn btn-logout" onClick={() => setIsLogoutModalOpen(true)}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-orange" to="/accounts/zabardast-current-account">
                Open an Account
              </Link>
              <Link className="btn btn-blue" to="/internet-banking" target="_blank" rel="noreferrer" onClick={clearSessionBeforeNavigate}>
                Internet Banking
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="about-page-wrap">
        {/* Keep all your existing sections unchanged until feedback */}
        <section className="about-hero-wrap" aria-label="About hero">
          <img className="about-hero-image" src="/images/about/about-main.jpg" alt="About Public Bank" />
          <div className="about-hero-overlay">
            <p className="about-hero-kicker">Empowering Progress Through</p>
            <h1 className="about-hero-title">
              Trust, Innovation,
              <br />
              &amp; Service
            </h1>
          </div>
        </section>

        <section className="about-intro-section">
          <article className="about-text-block">
            <h2>Our Vision</h2>
            <p>
              To be a reliable, customer-centric bank offering inclusive and progressive banking services in Pakistan.
            </p>
          </article>

          <article className="about-text-block">
            <h2>Our Mission</h2>
            <p>
              To establish long-term relationships through offering smooth customer experiences, responsible banking,
              and innovative technology, while aiming to be an employer of first choice and generating opportunities
              that boost shareholder value.
            </p>
          </article>

          <article className="about-text-block about-values-intro">
            <h2>Corporate Values</h2>
            <p>
              Askari is built on a strong foundation of core values guiding all our actions and decisions. These
              values ensure we effectively uphold all responsibilities towards customers, employees, stakeholders,
              and communities we serve.
            </p>
          </article>
        </section>

        <section className="about-content-section">
          <div className="about-values-grid">
            {values.map((item) => (
              <article key={item.title} className="about-value-card">
                <div className="about-value-heading">
                  <img className="about-value-icon" src="/images/about/small-logo.png" alt="" aria-hidden="true" />
                  <h3>{item.title}</h3>
                </div>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 🔥 VULNERABLE FEEDBACK SECTION */}
        <section className="about-feedback-section">
          <div className="about-feedback-heading">
            <h2>Public Feedback</h2>
          </div>

          <form className="about-feedback-form" onSubmit={handleFeedbackSubmit}>
            <label>
              Name
              <input
                type="text"
                name="name"
                maxLength={3000}
                value={feedbackForm.name}
                onChange={handleFeedbackInputChange}
                placeholder="Enter your name"
                readOnly={isLoggedIn}
              />
            </label>

            <label>
              Comment
              <textarea
                name="comment"
                rows={4}
                maxLength={3000}
                value={feedbackForm.comment}
                onChange={handleFeedbackInputChange}
                placeholder="Write your feedback"
              />
            </label>

            <button type="submit" className="btn btn-blue" disabled={isFeedbackSubmitting}>
              {isFeedbackSubmitting ? "Submitting..." : "Post Feedback"}
            </button>
          </form>

          {feedbackMessage && <p className="about-feedback-message">{feedbackMessage}</p>}
          {feedbackError && <p className="about-feedback-error">{feedbackError}</p>}

          <div className="about-feedback-list" aria-live="polite">
            {isFeedbackLoading ? (
              <p className="about-feedback-empty">Loading feedback...</p>
            ) : feedbackItems.length === 0 ? (
              <p className="about-feedback-empty">No feedback yet. Be the first to comment.</p>
            ) : (
              feedbackItems.map((item) => renderFeedbackCard(item))
            )}
          </div>
        </section>
      </main>

      <SiteFooter />

      {isLogoutModalOpen && (
        <div className="logout-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="logout-confirm-card">
            <p>Are you sure to Logout from your account?</p>
            <div className="logout-confirm-actions">
              <button type="button" className="btn btn-logout" onClick={handleLogout}>
                Yes
              </button>
              <button type="button" className="btn btn-cancel-light" onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AboutUs;