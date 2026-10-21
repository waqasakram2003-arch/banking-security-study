import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";

const cardImageByCategory = {
  "Visa Debit Card": "/images/Cards/Askari VISA Debit Cards 17102025.jpg",
  "PayPak Debit Card": "/images/Cards/Paypak Debit Cards.jpg",
  "MasterCard Credit Card": "/images/Cards/Mastercard Credit Cards.jpg",
  "World MasterCard Credit Card": "/images/Cards/Askari World Mastercard Credit Card -5.png"
};

function formatIssueDate(dateString) {
  if (!dateString) {
    return "-";
  }

  return new Date(dateString).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function AccountPage() {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCardsLoading, setIsCardsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [userCards, setUserCards] = useState([]);
  const [cardStats, setCardStats] = useState(null);
  const [form, setForm] = useState({ username: "", email: "", cnic: "", phone: "", address: "" });

  const session = useMemo(() => {
    try {
      const raw = localStorage.getItem("internetBankingSession");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = session?.user?._id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    async function loadProfileAndCards() {
      setIsLoading(true);
      setIsCardsLoading(true);

      try {
        const [profileResponse, cardsResponse] = await Promise.all([
          fetch(`http://localhost:3000/api/accounts/profile/${userId}`),
          fetch(`http://localhost:3000/api/cards/user/${userId}`)
        ]);

        const profileResult = await profileResponse.json();
        const cardsResult = await cardsResponse.json();

        if (!profileResponse.ok) {
          throw new Error(profileResult?.message || "Unable to load account details");
        }

        if (!cardsResponse.ok) {
          throw new Error(cardsResult?.message || "Unable to load card stats");
        }

        setProfile(profileResult.profile);
        setUserCards(cardsResult.cards || []);
        setCardStats(cardsResult.stats || null);
        setForm({
          username: profileResult.profile?.username || "",
          email: profileResult.profile?.email || "",
          cnic: profileResult.profile?.cnic || "",
          phone: profileResult.profile?.phone || "",
          address: profileResult.profile?.address || ""
        });
      } catch (error) {
        toast.error(error.message || "Unable to load account dashboard");
      } finally {
        setIsLoading(false);
        setIsCardsLoading(false);
      }
    }

    loadProfileAndCards();
  }, [userId]);

  function clearSession() {
    localStorage.removeItem("internetBankingSession");
    sessionStorage.removeItem("internetBankingSession");
    document.cookie = "internetBankingSession=; Max-Age=0; path=/";
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdate() {
    if (!profile?.userId) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/accounts/profile/${profile.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const result = await response.json();
      if (!response.ok) {
        const errorText = Array.isArray(result?.errors)
          ? result.errors.join(", ")
          : result?.message || "Unable to update account";
        throw new Error(errorText);
      }

      setProfile(result.profile);
      setIsUpdateModalOpen(false);

      const nextSession = {
        ...session,
        username: result.profile?.username || session.username,
        user: {
          ...session.user,
          username: result.profile?.username || session.user?.username,
          application: {
            ...session.user?.application,
            fullName: result.profile?.fullName || session.user?.application?.fullName,
            email: result.profile?.email,
            cnic: result.profile?.cnic,
            phone: result.profile?.phone,
            address: result.profile?.address || session.user?.application?.address
          }
        }
      };
      localStorage.setItem("internetBankingSession", JSON.stringify(nextSession));

      toast.success("Account details updated");
    } catch (error) {
      toast.error(error.message || "Unable to update account");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!profile?.userId) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/accounts/profile/${profile.userId}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to delete account");
      }

      clearSession();
      toast.success("Account deleted successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Unable to delete account");
    } finally {
      setIsDeleteModalOpen(false);
    }
  }

  if (!userId) {
    return <Navigate to="/internet-banking" replace />;
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

      <main className="profile-page-wrap">
        <section className="profile-card">
          <h1>My Account</h1>

          {isLoading && <p className="profile-muted">Loading account details...</p>}

          {!isLoading && profile && (
            <>
              <div className="profile-account-number">
                <span>Account Number</span>
                <strong>{profile.accountNumber || "-"}</strong>
              </div>

              <div className="profile-data-grid">
                <div>
                  <span>Registration Name</span>
                  <strong>{profile.username || "-"}</strong>
                </div>
              </div>

              <div className="profile-actions">
                <button type="button" className="btn btn-blue" onClick={() => setIsUpdateModalOpen(true)}>
                  Update Account
                </button>
                <button type="button" className="btn btn-logout" onClick={() => setIsDeleteModalOpen(true)}>
                  Delete My Account
                </button>
              </div>

              <section className="profile-cards-wrap" aria-label="Issued cards and stats">
                <div className="profile-cards-header">
                  <h2>Active Cards</h2>
                </div>

                {isCardsLoading && <p className="profile-muted">Loading issued cards...</p>}

                {!isCardsLoading && (
                  <>
                    <div className="profile-stats-grid">
                      <div>
                        <span>Total Cards</span>
                        <strong>{cardStats?.totalCards ?? 0}</strong>
                      </div>
                      <div>
                        <span>Debit Cards</span>
                        <strong>{cardStats?.debitCards ?? 0}</strong>
                      </div>
                      <div>
                        <span>Credit Cards</span>
                        <strong>{cardStats?.creditCards ?? 0}</strong>
                      </div>
                      <div>
                        <span>Approved</span>
                        <strong>{cardStats?.approvedCards ?? 0}</strong>
                      </div>
                      <div>
                        <span>Pending</span>
                        <strong>{cardStats?.pendingCards ?? 0}</strong>
                      </div>
                    </div>

                    {userCards.length === 0 ? (
                      <p className="profile-muted">No cards issued yet for this user.</p>
                    ) : (
                      <div className="profile-issued-cards-grid">
                        {userCards.map((card) => (
                          <article key={card.id} className="profile-issued-card">
                            <img
                              src={cardImageByCategory[card.cardCategory] || "/images/public-bank-logo-vector.svg"}
                              alt={card.cardCategory}
                            />

                            <div className="profile-issued-card-body">
                              <h3>{card.cardCategory}</h3>
                              <p>{card.cardType === "credit" ? "Credit Card" : "Debit Card"}</p>

                              <div className="profile-issued-card-meta">
                                <div>
                                  <span>Card Number</span>
                                  <strong>{card.cardNumber || "-"}</strong>
                                </div>
                                <div>
                                  <span>Issue Date</span>
                                  <strong>{formatIssueDate(card.createdAt)}</strong>
                                </div>
                                <div>
                                  <span>Status</span>
                                  <strong className={`status-chip status-${String(card.status || "").toLowerCase()}`}>
                                    {card.status || "-"}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </section>
      </main>

      <SiteFooter />

      {isUpdateModalOpen && (
        <div className="logout-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="logout-confirm-card profile-update-modal-card">
            <p>Update account details</p>

            <div className="profile-update-form-grid">
              <label>
                Registration Name
                <input name="username" value={form.username} onChange={handleFieldChange} required />
              </label>
              <label>
                Email
                <input name="email" value={form.email} onChange={handleFieldChange} type="email" required />
              </label>
              <label>
                CNIC
                <input name="cnic" value={form.cnic} onChange={handleFieldChange} required />
              </label>
              <label>
                Phone Number
                <input name="phone" value={form.phone} onChange={handleFieldChange} required />
              </label>
              <label>
                Address
                <input name="address" value={form.address} onChange={handleFieldChange} required />
              </label>
            </div>

            <div className="logout-confirm-actions">
              <button type="button" className="btn btn-orange" onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? "Updating..." : "Save Update"}
              </button>
              <button type="button" className="btn btn-cancel-light" onClick={() => setIsUpdateModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="logout-confirm-backdrop" role="dialog" aria-modal="true">
          <div className="logout-confirm-card">
            <p>Are you sure to delete your account?</p>
            <div className="logout-confirm-actions">
              <button type="button" className="btn btn-logout" onClick={handleDeleteAccount}>
                Yes
              </button>
              <button type="button" className="btn btn-cancel-light" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
