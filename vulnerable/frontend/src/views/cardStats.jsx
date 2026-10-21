import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate } from "react-router-dom";
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

function CardStatsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userCards, setUserCards] = useState([]);
  const [cardStats, setCardStats] = useState(null);

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

    async function loadCardStats() {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/cards/user/${userId}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Unable to load card stats");
        }

        setUserCards(result.cards || []);
        setCardStats(result.stats || null);
      } catch (error) {
        toast.error(error.message || "Unable to load card stats");
      } finally {
        setIsLoading(false);
      }
    }

    loadCardStats();
  }, [userId]);

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
          <Link className="btn btn-blue" to="/account">
            My Account
          </Link>
        </div>
      </header>

      <main className="profile-page-wrap">
        <section className="profile-card">
          <div className="profile-cards-header">
            <h2>Active Cards</h2>
          </div>

          {isLoading && <p className="profile-muted">Loading issued cards...</p>}

          {!isLoading && (
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
      </main>

      <SiteFooter />
    </div>
  );
}

export default CardStatsPage;