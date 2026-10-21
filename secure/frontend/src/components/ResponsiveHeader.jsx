import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clearInternetBankingSession } from "./session.js";
import {
  actionWrapClass,
  brandLogoClass,
  brandWrapClass,
  btnBlueClass,
  btnBlueSmClass,
  btnLogoutClass,
  cardsMenuPanelClass,
  mainNavClass,
  menuLinkClass,
  menuPanelClass,
  mobileMenuBtnClass,
  mobileMenuOverlayClass,
  mobileMenuPanelClass,
  mobileMenuLinkClass,
  mobileMenuSectionClass,
  mobileMenuSectionTitleClass,
  navDdClass,
  navLinkActiveClass,
  navLinkClass,
  navTriggerClass,
  topbarClass,
  userAvatarImgClass,
  userImageMobileClass
} from "./bankingStyles.js";

/**
 * Responsive Header Component - works for desktop and mobile
 * @param {object} props
 * @param {boolean} [props.logoHomeLink=true] — false: logo not wrapped
 * @param {boolean} [props.clearSessionOnInternetBanking=false] — clear storage on IB nav link
 * @param {() => void} [props.onInternetBankingClick] — IB nav link click handler
 * @param {import('react').ReactNode} [props.betweenLoansAndAbout] — custom links between Loans and About Us
 * @param {'loans'|'about'|null} [props.activeNav]
 * @param {import('react').ReactNode} [props.actions] — right side buttons/links for desktop
 * @param {object} [props.session] — user session object {username, user: {_id, image, ...}}
 * @param {() => void} [props.onLogoutClick] — logout handler
 * @param {() => void} [props.clearSessionBeforeNavigate] — clear session before page navigation
 */
export default function ResponsiveHeader({
  logoHomeLink = true,
  clearSessionOnInternetBanking = false,
  onInternetBankingClick = null,
  betweenLoansAndAbout = null,
  activeNav = null,
  actions = null,
  session = null,
  onLogoutClick = null,
  clearSessionBeforeNavigate = null
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const ibNavClick =
    onInternetBankingClick ||
    (clearSessionOnInternetBanking ? () => clearInternetBankingSession() : undefined);

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMenuLinkClick = () => {
    setIsMobileMenuOpen(false);
    clearSessionBeforeNavigate?.();
  };

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const isLoggedIn = session?.username;
  const mobileProfileImage =
    session?.user?.application?.profileImage ||
    session?.user?.profileImage ||
    session?.profileImage ||
    session?.user?.image ||
    "";
  const loansLinkClass = activeNav === "loans" ? navLinkActiveClass : navLinkClass;
  const aboutLinkClass = activeNav === "about" ? navLinkActiveClass : navLinkClass;

  const logo = (
    <img className={brandLogoClass} src="/images/public-bank-logo-vector.svg" alt="Public Bank" />
  );

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={topbarClass}>
      {/* Left side: Logo */}
      <div className={brandWrapClass}>
        {logoHomeLink ? (
          <Link to="/" aria-label="Go to home">
            {logo}
          </Link>
        ) : (
          logo
        )}
      </div>

      {/* Desktop Navigation (hidden on mobile) */}
      <nav className={`${mainNavClass} max-[980px]:hidden`} aria-label="Main navigation">
        <div className={navDdClass}>
          <button className={navTriggerClass} type="button">
            Accounts
          </button>
          <div className={menuPanelClass}>
            <Link className={menuLinkClass} to="/accounts/asaan-saving-account">
              Saving Account
            </Link>
            <Link className={menuLinkClass} to="/accounts/zabardast-current-account">
              Current Account
            </Link>
          </div>
        </div>

        <div className={navDdClass}>
          <button className={navTriggerClass} type="button">
            Digital Banking
          </button>
          <div className={menuPanelClass}>
            <Link
              className={menuLinkClass}
              to="/internet-banking"
              target="_blank"
              rel="noreferrer"
              onClick={ibNavClick}
            >
              Internet Banking
            </Link>
          </div>
        </div>

        <div className={navDdClass}>
          <Link className={navLinkClass} to="/cards">
            Cards
          </Link>
          <div className={cardsMenuPanelClass}>
            <div className="p-2">
              <p className="m-0 px-2.5 py-2 text-[0.95rem] font-semibold text-[#17324c]">Debit Cards</p>
              <Link className={menuLinkClass} to="/cards/visa-debit-card">
                Visa Debit Card
              </Link>
              <Link className={menuLinkClass} to="/cards/paypak-debit-card">
                PayPak Debit Card
              </Link>
            </div>
            <div className="h-px bg-[#d7e4f0]" />
            <div className="p-2">
              <p className="m-0 px-2.5 py-2 text-[0.95rem] font-semibold text-[#17324c]">Credit Cards</p>
              <Link className={menuLinkClass} to="/cards/mastercard-credit-card">
                MasterCard Credit Card
              </Link>
              <Link className={menuLinkClass} to="/cards/world-mastercard-credit-card">
                World MasterCard Credit Card
              </Link>
            </div>
          </div>
        </div>

        <div className={navDdClass}>
          <Link className={loansLinkClass} to="/loans">
            Loans
          </Link>
        </div>

        {betweenLoansAndAbout}

        <div className={navDdClass}>
          <Link className={aboutLinkClass} to="/about-us">
            About Us
          </Link>
        </div>
      </nav>

      {/* Right side: Desktop actions + Mobile menu trigger */}
      {/* Desktop Actions (hidden on mobile) */}
      {actions && <div className={`${actionWrapClass} max-[980px]:hidden`}>{actions}</div>}

      {/* Mobile Right Section */}
      <div className="hidden max-[980px]:flex items-center justify-end gap-1.5 ml-auto shrink-0 flex-nowrap">
        {/* User Avatar (Mobile - if logged in) */}
        {isLoggedIn && (
          <Link
            className={userImageMobileClass}
            to="/account"
            aria-label="Open account profile"
          >
            {mobileProfileImage ? (
              <img
                className={userAvatarImgClass}
                src={mobileProfileImage}
                alt={session.username}
              />
            ) : (
              <div
                className="grid h-11 w-11 place-items-center rounded-full border border-[#0a2d4d] bg-[#0f3a63] text-white font-bold shrink-0"
                aria-label="Profile image"
              >
                <span aria-hidden="true">👤</span>
              </div>
            )}
          </Link>
        )}

        {/* Internet Banking Tab (Mobile - if NOT logged in) */}
        {!isLoggedIn && (
          <Link
            className={`${btnBlueClass} text-[0.75rem] px-2.5 py-1.5 max-[640px]:text-[0.7rem] max-[640px]:px-2 max-[640px]:py-1 whitespace-nowrap shrink-0`}
            to="/internet-banking"
            target="_blank"
            rel="noreferrer"
            onClick={ibNavClick}
          >
            Internet Banking
          </Link>
        )}

        {/* Mobile Menu Button */}
        <button
          className={mobileMenuBtnClass}
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay & Panel */}
      {isMobileMenuOpen && (
        <div
          className={mobileMenuOverlayClass}
          onClick={handleMenuClose}
          role="presentation"
        />
      )}

      <div className={`${mobileMenuPanelClass} ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"} max-[980px]:flex max-[980px]:flex-col`}>
        {/* Close Button in Mobile Menu */}
        <button
          className="absolute right-4 top-4 text-[1.15rem] text-[#1a2f45] hover:text-[#ed7f00] transition-colors"
          onClick={handleMenuClose}
          aria-label="Close menu"
          type="button"
        >
          ✕
        </button>

        {/* User Info in Mobile Menu (if logged in) */}
        {isLoggedIn && (
          <div className="mb-3 mt-12">
            <div className="flex items-center gap-3 pb-2">
            {mobileProfileImage ? (
              <img
                className="h-12 w-12 rounded-full object-cover border border-[#0a2d4d]"
                src={mobileProfileImage}
                alt={session.username}
              />
            ) : (
              <div
                className="grid h-12 w-12 place-items-center rounded-full border border-[#0a2d4d] bg-[#0f3a63] text-white font-bold"
                aria-label="Profile image"
              >
                <span aria-hidden="true">👤</span>
              </div>
            )}
            <div>
              <p className="text-[0.95rem] font-semibold text-[#1a2f45] m-0">{session.username}</p>
              <p className="text-[0.8rem] text-[#607d96] m-0">Account</p>
            </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <Link
                className={`${btnBlueSmClass} rounded-[12px] px-2.5 py-1.5 text-[0.78rem] leading-none max-[980px]:px-2.5! max-[980px]:py-1.5! max-[980px]:text-[0.78rem]!`}
                to="/transfer-money"
                onClick={handleMenuLinkClick}
              >
                Transfer Money
              </Link>
              {onLogoutClick && (
                <button
                  type="button"
                  className={`${btnLogoutClass} rounded-[12px] px-2.5 py-1.5 text-[0.78rem] leading-none max-[980px]:px-2.5! max-[980px]:py-1.5! max-[980px]:text-[0.78rem]!`}
                  onClick={() => {
                    onLogoutClick();
                    handleMenuClose();
                  }}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={`${isLoggedIn ? "mt-2" : "mt-12"} flex flex-col gap-1.5`}>
          {/* Accounts Section */}
          <div className={`${mobileMenuSectionClass} mt-0`}>
            <button
              type="button"
              onClick={() => toggleSection("accounts")}
              className="grid w-full grid-cols-[1fr_auto] items-center rounded-lg bg-[#f7fafc] px-3 py-3 text-left text-[0.92rem] font-semibold text-[#1a2f45] transition-colors hover:bg-[#edf4fa]"
            >
              Accounts
              <span
                className={`inline-flex h-7 w-7 items-center justify-center text-[#ed7f00] transition-transform duration-200 ${expandedSections.accounts ? "rotate-180" : ""}`}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 7.5l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {expandedSections.accounts && (
              <div className="mt-1 overflow-hidden rounded-lg bg-[#fcfcfc]">
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/accounts/asaan-saving-account"
                  onClick={handleMenuLinkClick}
                >
                  Saving Account
                </Link>
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/accounts/zabardast-current-account"
                  onClick={handleMenuLinkClick}
                >
                  Current Account
                </Link>
              </div>
            )}
          </div>

          {/* Digital Banking Section */}
          <div className={mobileMenuSectionClass}>
            <button
              type="button"
              onClick={() => toggleSection("digitalBanking")}
              className="grid w-full grid-cols-[1fr_auto] items-center rounded-lg bg-[#f7fafc] px-3 py-3 text-left text-[0.92rem] font-semibold text-[#1a2f45] transition-colors hover:bg-[#edf4fa]"
            >
              Digital Banking
              <span
                className={`inline-flex h-7 w-7 items-center justify-center text-[#ed7f00] transition-transform duration-200 ${expandedSections.digitalBanking ? "rotate-180" : ""}`}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 7.5l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {expandedSections.digitalBanking && (
              <div className="mt-1 overflow-hidden rounded-lg bg-[#fcfcfc]">
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/internet-banking"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    ibNavClick?.();
                    handleMenuLinkClick();
                  }}
                >
                  Internet Banking
                </Link>
              </div>
            )}
          </div>

          {/* Cards Section */}
          <div className={mobileMenuSectionClass}>
            <button
              type="button"
              onClick={() => toggleSection("cards")}
              className="grid w-full grid-cols-[1fr_auto] items-center rounded-lg bg-[#f7fafc] px-3 py-3 text-left text-[0.92rem] font-semibold text-[#1a2f45] transition-colors hover:bg-[#edf4fa]"
            >
              Cards
              <span
                className={`inline-flex h-7 w-7 items-center justify-center text-[#ed7f00] transition-transform duration-200 ${expandedSections.cards ? "rotate-180" : ""}`}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 7.5l5 5 5-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {expandedSections.cards && (
              <div className="mt-1 overflow-hidden rounded-lg bg-[#fcfcfc]">
                <p className="px-4 py-1.5 text-[0.78rem] font-medium text-[#607d96]">Debit Cards</p>
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/cards/visa-debit-card"
                  onClick={handleMenuLinkClick}
                >
                  Visa Debit Card
                </Link>
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/cards/paypak-debit-card"
                  onClick={handleMenuLinkClick}
                >
                  PayPak Debit Card
                </Link>
                <p className="mt-1 px-4 py-1.5 text-[0.78rem] font-medium text-[#607d96]">Credit Cards</p>
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/cards/mastercard-credit-card"
                  onClick={handleMenuLinkClick}
                >
                  MasterCard Credit Card
                </Link>
                <Link
                  className={`${mobileMenuLinkClass} block px-4 py-2.5 text-[0.88rem]`}
                  to="/cards/world-mastercard-credit-card"
                  onClick={handleMenuLinkClick}
                >
                  World MasterCard Credit Card
                </Link>
              </div>
            )}
          </div>

          {/* Loans Link */}
          <div className={mobileMenuSectionClass}>
            <Link
              className={`${mobileMenuLinkClass} block rounded-lg bg-[#f7fafc] px-3 py-3 text-[0.92rem] font-semibold hover:bg-[#edf4fa]`}
              to="/loans"
              onClick={handleMenuLinkClick}
            >
              Loans
            </Link>
          </div>

          {/* Custom Links (betweenLoansAndAbout) */}
          {betweenLoansAndAbout && (
            <div className={mobileMenuSectionClass}>
              {betweenLoansAndAbout}
            </div>
          )}

          {/* About Us Link */}
          <div className={mobileMenuSectionClass}>
            <Link
              className={`${mobileMenuLinkClass} block rounded-lg bg-[#f7fafc] px-3 py-3 text-[0.92rem] font-semibold hover:bg-[#edf4fa]`}
              to="/about-us"
              onClick={handleMenuLinkClick}
            >
              About Us
            </Link>
          </div>

        </nav>
      </div>
    </header>
  );
}
