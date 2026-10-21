import { Link } from "react-router-dom";
import { clearInternetBankingSession } from "./session.js";
import {
  actionWrapClass,
  brandLogoClass,
  brandWrapClass,
  btnBlueClass,
  btnBlueSmClass,
  btnLogoutClass,
  btnOrangeClass,
  cardsMenuPanelClass,
  mainNavClass,
  menuLinkClass,
  menuPanelClass,
  navDdClass,
  navLinkActiveClass,
  navLinkClass,
  navTriggerClass,
  topbarClass,
  userAvatarImgClass,
  userAvatarLinkClass
} from "./bankingStyles.js";

/**
 * @param {object} props
 * @param {boolean} [props.logoHomeLink=true] — false: logo not wrapped (matches home page).
 * @param {boolean} [props.clearSessionOnInternetBanking=false] — clear storage on IB nav link (same-tab pages should prefer onInternetBankingClick).
 * @param {() => void} [props.onInternetBankingClick] — IB nav link click; overrides clearSessionOnInternetBanking when set.
 * @param {import('react').ReactNode} [props.betweenLoansAndAbout] — e.g. Transfer link.
 * @param {'loans'|'about'|null} [props.activeNav]
 * @param {import('react').ReactNode} props.actions — right side buttons/links.
 */
export default function BankingHeader({
  logoHomeLink = true,
  clearSessionOnInternetBanking = false,
  onInternetBankingClick = null,
  betweenLoansAndAbout = null,
  activeNav = null,
  actions
}) {
  const ibNavClick =
    onInternetBankingClick ||
    (clearSessionOnInternetBanking ? () => clearInternetBankingSession() : undefined);

  const loansLinkClass = activeNav === "loans" ? navLinkActiveClass : navLinkClass;
  const aboutLinkClass = activeNav === "about" ? navLinkActiveClass : navLinkClass;

  const logo = (
    <img className={brandLogoClass} src="/images/public-bank-logo-vector.svg" alt="Public Bank" />
  );

  return (
    <header className={topbarClass}>
      <div className={brandWrapClass}>
        {logoHomeLink ? (
          <Link to="/" aria-label="Go to home">
            {logo}
          </Link>
        ) : (
          logo
        )}
      </div>

      <nav className={mainNavClass} aria-label="Main navigation">
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

      <div className={actionWrapClass}>{actions}</div>
    </header>
  );
}

function hasValidSession(session) {
  const username = String(session?.username || "").trim();
  const token = String(session?.token || "").trim();
  const userId = String(session?.user?._id || "").trim();
  return Boolean(username && token && userId);
}

export function HomeHeaderActions({ session, onLogoutClick, clearSessionBeforeNavigate }) {
  if (hasValidSession(session)) {
    return (
      <>
        <Link className={btnBlueSmClass} to="/transfer-money">
          Transfer Money
        </Link>
        <button type="button" className={btnLogoutClass} onClick={onLogoutClick}>
          Logout
        </button>
        <Link className={userAvatarLinkClass} to="/account" aria-label="Open account profile">
          {(session?.user?.application?.profileImage ||
            session?.user?.profileImage ||
            session?.profileImage) ? (
            <img
              className={userAvatarImgClass}
              src={
                session?.user?.application?.profileImage ||
                session?.user?.profileImage ||
                session?.profileImage
              }
              alt={`${session.username} profile`}
            />
          ) : null}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className={btnOrangeClass} to="/accounts/zabardast-current-account">
        Open an Account
      </Link>
      <Link
        className={btnBlueClass}
        to="/internet-banking"
        target="_blank"
        rel="noreferrer"
        onClick={clearSessionBeforeNavigate}
      >
        Internet Banking
      </Link>
    </>
  );
}
