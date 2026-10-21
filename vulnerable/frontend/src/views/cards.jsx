import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";

function CardsPage({ cardType, cardCategory, heroImage, pageTitle, overviewText }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedCardNumber, setApprovedCardNumber] = useState("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const session = useMemo(() => {
    try {
      const raw = localStorage.getItem("internetBankingSession");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    if (!session?.user?._id) {
      toast.error("Please login first to apply for cards.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/cards/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: session.user._id,
          cardType,
          cardCategory,
          firstName: String(formData.get("firstName") || "").trim(),
          lastName: String(formData.get("lastName") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          cnic: String(formData.get("cnic") || "").trim(),
          dateOfBirth: String(formData.get("dateOfBirth") || "").trim(),
          accountWithBank: String(formData.get("accountWithBank") || "").trim(),
          alternativeNumber: String(formData.get("alternativeNumber") || "").trim(),
          cityName: String(formData.get("cityName") || "").trim(),
          netIncome: String(formData.get("netIncome") || "").trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to submit card application");
      }

      toast.success("Card approved successfully.");
      setApprovedCardNumber(result?.cardNumber || "-");
      setIsApprovalModalOpen(true);
      formElement.reset();
    } catch (error) {
      toast.error(error.message || "Unable to submit card application");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-wrap">
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
              <Link to="/internet-banking" target="_blank" rel="noreferrer">
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
          <Link className="btn btn-blue" to="/">
            Back to Home
          </Link>
        </div>
      </header>

      <main className="account-page-wrap">
        <img className="account-hero-image" src={heroImage} alt={pageTitle} />

        <section className="account-overview-section">
          <h1 className="card-product-title">{pageTitle}</h1>
          <h2 className="section-heading overview-heading">Overview</h2>
          <p className="overview-text">{overviewText}</p>

          <a className="apply-now-badge card-apply-now-link" href="#card-apply-form">
            Apply Now
          </a>
        </section>

        <section className="apply-section">
          <form id="card-apply-form" className="account-apply-form" onSubmit={handleSubmit}>
            <label className="form-field">
              First Name *
              <input type="text" name="firstName" placeholder="Muhammad" required />
            </label>

            <label className="form-field">
              Last Name
              <input type="text" name="lastName" placeholder="Ali" />
            </label>

            <label className="form-field">
              Email *
              <input type="email" name="email" placeholder="example@email.com" required />
            </label>

            <label className="form-field">
              Phone *
              <input type="tel" name="phone" placeholder="(+92) 123 4567" required />
            </label>

            <label className="form-field">
              CNIC Number *
              <input type="text" name="cnic" placeholder="XXXXX-XXXXXXX-X" required />
            </label>

            <label className="form-field">
              Date of Birth *
              <input type="date" name="dateOfBirth" required />
            </label>

            <label className="form-field">
              Account with AKBL *
              <select name="accountWithBank" defaultValue="" required>
                <option value="" disabled>
                  Select
                </option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label className="form-field">
              Product Name
              <input type="text" name="productName" value={pageTitle} readOnly />
            </label>

            <label className="form-field">
              Alternative Number
              <input type="tel" name="alternativeNumber" placeholder="(+92) 300 1234567" />
            </label>

            <label className="form-field">
              City Name *
              <input type="text" name="cityName" placeholder="Enter city name" required />
            </label>

            <label className="form-field">
              Net Income
              <input type="text" name="netIncome" placeholder="Enter monthly income" />
            </label>

            <div className="form-actions">
              <button type="submit" className="btn btn-orange" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <p>Submitting this form does not guarantee approval.</p>
            </div>
          </form>
        </section>
      </main>

      <SiteFooter />

      {isApprovalModalOpen && (
        <div className="account-modal-backdrop" role="dialog" aria-modal="true">
          <div className="account-modal-card">
            <div className="celebration-badge">🎉</div>
            <h3>Congratulations!</h3>
            <p>Your card is approved. Now you can avail ATM services and card features.</p>
            <p>Within 7 working days, you will get your card at your address.</p>

            <div className="account-summary-grid">
              <div>
                <span>Card Number</span>
                <strong>{approvedCardNumber}</strong>
              </div>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsApprovalModalOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardsPage;
