import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });
}

function AsaanSavingAccount() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [accountDetails, setAccountDetails] = useState(null);
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem("internetBankingSession");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    function syncSession() {
      try {
        const raw = localStorage.getItem("internetBankingSession");
        setSession(raw ? JSON.parse(raw) : null);
      } catch {
        setSession(null);
      }
    }

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  function clearSessionBeforeNavigate() {
    localStorage.removeItem("internetBankingSession");
    sessionStorage.removeItem("internetBankingSession");
    document.cookie = "internetBankingSession=; Max-Age=0; path=/";
    setSession(null);
  }

  function handleLogout() {
    clearSessionBeforeNavigate();
    setIsLogoutModalOpen(false);
  }

  async function pollAccountDetails(applicationId) {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await fetch(
        `http://localhost:3000/api/accounts/application/${applicationId}`
      );

      if (response.ok) {
        return response.json();
      }

      if (response.status !== 404) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result?.message || "Unable to fetch account details");
      }

      await sleep(1500);
    }

    return null;
  }

  function formatDate(value) {
    return new Date(value).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const imageFile = formData.get("userImage");
    const startingBalance = Number(formData.get("startingBalance") || 0);
    if (startingBalance < 1000 || startingBalance > 1000000) {
      toast.error("Starting balance must be between Rs. 1,000 and Rs. 1,000,000");
      return;
    }

    // Prepare FormData for multipart/form-data submission
    const submitFormData = new FormData();
    submitFormData.append("fullName", String(formData.get("fullName") || "").trim());
    submitFormData.append("email", String(formData.get("email") || "").trim());
    submitFormData.append("phone", String(formData.get("phone") || "").trim());
    submitFormData.append("cnic", String(formData.get("cnic") || "").trim());
    submitFormData.append("address", String(formData.get("address") || "").trim());
    submitFormData.append("accountType", "saving");
    submitFormData.append("startingBalance", startingBalance);

    // Append image file if present
    if (imageFile instanceof File && imageFile.size > 0) {
      submitFormData.append("userImage", imageFile);
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/applications", {
        method: "POST",
        body: submitFormData
      });

      const result = await response.json();

      if (!response.ok) {
        const errorText = Array.isArray(result?.errors)
          ? result.errors.join(", ")
          : result?.message || "Failed to submit application";
        throw new Error(errorText);
      }

      clearSessionBeforeNavigate();

      formElement.reset();
      toast.success("Application submitted successfully.");

      const fetchedAccount = await pollAccountDetails(result.applicationId);
      if (fetchedAccount) {
        setAccountDetails(fetchedAccount);
        setIsAccountModalOpen(true);
      } else {
        toast("Application submitted. Account is being prepared.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to submit application right now.");
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
              <Link to="/accounts/asaan-saving-account">
                Saving Account
              </Link>
              <Link to="/accounts/zabardast-current-account">
                Current Account
              </Link>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              Digital Banking
            </button>
            <div className="menu-panel">
              <Link
                to="/internet-banking"
                target="_blank"
                rel="noreferrer"
                onClick={clearSessionBeforeNavigate}
              >
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
              <button
                type="button"
                className="btn btn-logout"
                onClick={() => setIsLogoutModalOpen(true)}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-orange"
                to="/accounts/asaan-saving-account"
              >
                Open an Account
              </Link>
              <Link
                className="btn btn-blue"
                to="/internet-banking"
                target="_blank"
                rel="noreferrer"
                onClick={clearSessionBeforeNavigate}
              >
                Internet Banking
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="account-page-wrap">
        <img
          className="account-hero-image"
          src="/images/Saving-Account/Asaan Digital Account.png"
          alt="Asaan Saving Account"
        />

        <section className="account-overview-section">
          <h1 className="account-title">Asaan Saving Account</h1>

          <h2 className="section-heading overview-heading">Overview</h2>
          <p className="overview-lead">Save simply. Build strong!</p>
          <p className="overview-text">
            Big goals begin with small steps, and Asaan Saving Account makes your first step effortless.
          </p>
          <p className="overview-text">
            Start saving with just Rs. 100. No minimum balance. No fine print.
            <br />
            Just easy access, secure banking, and profit on every rupee you set aside.
          </p>
          <p className="overview-text">
            Because saving should never be complicated.
            <br />
            Open your account today.
          </p>
        </section>

        <section className="apply-section">
          <h2 className="apply-now-badge">Apply Now</h2>
          <form className="account-apply-form" onSubmit={handleSubmit}>
            <input type="hidden" name="accountType" value="saving" />

            <label className="form-field">
              Full Name *
              <input type="text" name="fullName" placeholder="Muhammad Ali" required />
            </label>

            <label className="form-field">
              Email *
              <input type="email" name="email" placeholder="example@email.com" required />
            </label>

            <label className="form-field">
              Phone *
              <input type="tel" name="phone" placeholder="(+92) 3XX XXXXXXX" required />
            </label>

            <label className="form-field">
              CNIC Number *
              <input type="text" name="cnic" placeholder="XXXXX-XXXXXXX-X" required />
            </label>

            <label className="form-field">
              Address *
              <input type="text" name="address" placeholder="Enter your full address" required />
            </label>

            <label className="form-field">
              Profile Image
              <input type="file" name="userImage" accept="image/*" />
            </label>

            <label className="form-field">
              Starting Balance * (Rs. 1,000 - Rs. 1,000,000)
              <input type="number" name="startingBalance" placeholder="50000" min="1000" max="1000000" step="100" required />
            </label>

            <label className="form-field">
              Product Name
              <input
                type="text"
                name="productName"
                defaultValue="Asaan Saving Account"
                readOnly
              />
            </label>

            <label className="form-field">
              Alternative Number
              <input type="tel" name="alternativeNumber" placeholder="(+92) 300 1234567" />
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

      {isAccountModalOpen && accountDetails && (
        <div className="account-modal-backdrop" role="dialog" aria-modal="true">
          <div className="account-modal-card">
            <h3>🎉 Congratulations!</h3>
            <p>Your account has been created successfully.</p>
            <div className="account-info-note">Kindly note and save your account information for future use.</div>

            <div className="account-summary-grid">
              <div>
                <span>Account Number</span>
                <strong>{accountDetails.accountNumber}</strong>
              </div>
              <div>
                <span>IBAN</span>
                <strong>{accountDetails.iban}</strong>
              </div>
              <div>
                <span>Balance</span>
                <strong>{accountDetails.balance}</strong>
              </div>
              <div>
                <span>Created At</span>
                <strong>{formatDate(accountDetails.createdAt)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{accountDetails?.application?.status || "approved"}</strong>
              </div>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setIsAccountModalOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="signup-hint">
              <p>Use Best Bank Digital Banking Signup ?</p>
              <Link
                className="btn btn-blue"
                to={`/internet-banking?mode=signup&accountNumber=${encodeURIComponent(accountDetails.accountNumber)}&email=${encodeURIComponent(accountDetails?.application?.email || "")}&cnic=${encodeURIComponent(String(accountDetails?.application?.cnic || ""))}`}
                target="_blank"
                rel="noreferrer"
                onClick={clearSessionBeforeNavigate}
              >
                Signup Now
              </Link>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />

      {isLogoutModalOpen && (
        <div className="logout-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="logout-confirm-card">
            <p>Are you sure to Logout from your account?</p>
            <div className="logout-confirm-actions">
              <button type="button" className="btn btn-logout" onClick={handleLogout}>
                Yes
              </button>
              <button
                type="button"
                className="btn btn-cancel-light"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AsaanSavingAccount;
