import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import SiteFooter from "../components/SiteFooter.jsx";

const carouselImages = [
  "/images/Islamic-Personal-Finance---Home-Page-Banner.jpg",
  "/images/SMART ATM 1770X800 12620206.jpg",
  "/images/SDRA - 1770 x 800.jpg",
  "/images/click freelance account banner.jpeg"
];

const productCards = [
  {
    image: "/images/products/Checking-Savings-Accounts.png",
    title: "Checking/Savings Accounts"
  },
  {
    image: "/images/products/Credit-Debit-Cards.png",
    title: "Credit/Debit Cards"
  },
  {
    image: "/images/products/CheckingSavings Accounts.png",
    title: "Sahar Current Account"
  },
  {
    image: "/images/products/roshan-digital-account.png",
    title: "Roshan Digital Account"
  }
];

function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleImages, setVisibleImages] = useState(carouselImages);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem("internetBankingSession");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const slidesForRender = visibleImages;
  const logicalSlide = activeSlide;

  useEffect(() => {
    setActiveSlide(0);
  }, [visibleImages]);

  useEffect(() => {
    if (!visibleImages.length) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % visibleImages.length);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [visibleImages]);

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

  function handleLogout() {
    localStorage.removeItem("internetBankingSession");
    setSession(null);
    setIsLogoutModalOpen(false);
  }

  function clearSessionBeforeNavigate() {
    localStorage.removeItem("internetBankingSession");
    sessionStorage.removeItem("internetBankingSession");
    document.cookie = "internetBankingSession=; Max-Age=0; path=/";
    setSession(null);
  }

  function handleImageError(badImagePath) {
    setVisibleImages((prev) => prev.filter((imagePath) => imagePath !== badImagePath));
  }

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="brand-wrap">
          <img className="brand-logo" src="/images/public-bank-logo-vector.svg" alt="Public Bank" />
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <div className="dropdown">
            <button className="nav-link" type="button">
              Accounts
            </button>
            <div className="menu-panel">
              <Link to="/accounts/asaan-saving-account">Saving Account</Link>
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
                to="/accounts/zabardast-current-account"
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

      <main>
        <section className="hero" aria-label="Banking image carousel">
          <div
            className="slides"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slidesForRender.map((imagePath, index) => (
              <img
                key={`${imagePath}-${index}`}
                src={imagePath}
                alt="Bank promotion"
                onError={() => handleImageError(imagePath)}
              />
            ))}
          </div>

          <div className="dots" aria-label="Carousel navigation">
            {visibleImages.map((imagePath, index) => (
              <button
                key={imagePath}
                type="button"
                className={index === logicalSlide ? "dot active" : "dot"}
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="products-showcase" aria-label="Products and services">
          <h2 className="products-heading"> Products and Services Explore &amp; Apply Online.</h2>

          <div className="products-grid">
            {productCards.map((card) => (
              <div
                key={card.title}
                className="product-card"
                role="button"
                tabIndex={0}
              >
                <img src={card.image} alt={card.title} />
                <p>{card.title}</p>
              </div>
            ))}
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

export default Home;
