import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { HomeHeaderActions } from "../components/BankingHeader.jsx";
import { pageWrapClass, profileCardClass, profilePageWrapClass } from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession } from "../components/session.js";

const CARD_IMAGE_BY_CATEGORY = {
  "Visa Debit Card": "/images/Cards/Askari VISA Debit Cards 17102025.jpg",
  "PayPak Debit Card": "/images/Cards/Paypak Debit Cards.jpg",
  "MasterCard Credit Card": "/images/Cards/Mastercard Credit Cards.jpg",
  "World MasterCard Credit Card": "/images/Cards/Askari World Mastercard Credit Card -5.png"
};

function getStatusBadgeClass(status) {
  const normalized = String(status || "").toLowerCase();
  const base =
    "inline-flex min-w-[88px] items-center justify-center rounded-full border px-2.5 py-0.5 text-[0.8rem] font-bold capitalize";
  if (normalized === "approved") {
    return `${base} border-[rgba(42,167,78,0.42)] bg-[rgba(42,167,78,0.14)] text-[#18733b]`;
  }
  if (normalized === "pending") {
    return `${base} border-[rgba(227,145,37,0.4)] bg-[rgba(227,145,37,0.14)] text-[#9b5f18]`;
  }
  if (normalized === "rejected") {
    return `${base} border-[rgba(210,70,63,0.38)] bg-[rgba(210,70,63,0.14)] text-[#9f2b26]`;
  }
  return `${base} border-[rgba(111,126,140,0.35)] bg-[rgba(111,126,140,0.15)] text-[#36506a]`;
}

const statsGridClass =
  "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 max-[900px]:grid-cols-2";
const statCellClass =
  "rounded-[10px] border border-[#dbe9f4] bg-white px-2.5 py-2 [&>span]:mb-0.5 [&>span]:block [&>span]:text-[0.76rem] [&>span]:text-[#597189] [&>strong]:text-[#112f48]";
const cardListClass =
  "mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2";
const cardItemClass =
  "min-h-[255px] rounded-[10px] border border-[#dbe9f4] bg-white p-2.5";
const cardBannerClass = "mb-2 block h-[110px] w-full rounded-lg object-cover";
const cardTitleClass = "mb-2 font-bold text-[#17354d]";
const infoBoxClass =
  "rounded-lg border border-[#d7e7f3] bg-gradient-to-b from-[rgba(237,246,252,0.65)] to-[rgba(225,239,249,0.7)] px-2 py-1.5 [&>span]:mb-0.5 [&>span]:block [&>span]:text-[0.74rem] [&>span]:text-[#597189] [&>strong]:text-[0.88rem] [&>strong]:text-[#112f48]";

function CardsOverviewPage() {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const session = useMemo(() => {
    return getInternetBankingSession();
  }, []);

  const userId = session?.user?._id;

  function handleLogout() {
    clearInternetBankingSession();
    window.location.href = "/";
  }

  function clearSessionBeforeNavigate() {
    clearInternetBankingSession();
  }

  useEffect(() => {
    async function loadCards() {
      if (!userId) {
        setCards([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/api/cards/user/${userId}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Unable to load cards");
        }
        setCards(Array.isArray(result?.cards) ? result.cards : []);
      } catch {
        setCards([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadCards();
  }, [userId]);

  const debitCards = cards.filter((card) => card?.cardType === "debit").length;
  const creditCards = cards.filter((card) => card?.cardType === "credit").length;
  const approvedCards = cards.filter((card) => card?.status === "approved").length;
  const pendingCards = cards.filter((card) => card?.status === "pending").length;

  function getCardImage(cardCategory) {
    return CARD_IMAGE_BY_CATEGORY[cardCategory] || "/images/Cards/Paypak Debit Cards.jpg";
  }

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        session={session}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        clearSessionBeforeNavigate={clearSessionBeforeNavigate}
        actions={
          <HomeHeaderActions
            session={session}
            onLogoutClick={handleLogout}
            clearSessionBeforeNavigate={clearSessionBeforeNavigate}
          />
        }
      />

      <main className={profilePageWrapClass}>
        <section className={profileCardClass}>
          <section className="mt-[22px] border-t border-[#d8e7f2] pt-[18px]">
            <h2 className="mb-2.5 text-[1.2rem] text-[#17354d]">Active Cards</h2>
            <div className={statsGridClass}>
              <div className={statCellClass}>
                <span>Total Cards</span>
                <strong>{cards.length}</strong>
              </div>
              <div className={statCellClass}>
                <span>Debit Cards</span>
                <strong>{debitCards}</strong>
              </div>
              <div className={statCellClass}>
                <span>Credit Cards</span>
                <strong>{creditCards}</strong>
              </div>
              <div className={statCellClass}>
                <span>Approved</span>
                <strong>{approvedCards}</strong>
              </div>
              <div className={statCellClass}>
                <span>Pending</span>
                <strong>{pendingCards}</strong>
              </div>
            </div>

            {!isLoading && cards.length > 0 ? (
              <div className={cardListClass}>
                {cards.map((card) => (
                  <article key={card._id} className={cardItemClass}>
                    <img
                      className={cardBannerClass}
                      src={getCardImage(card.cardCategory)}
                      alt={card.cardCategory || "Card banner"}
                    />
                    <p className={cardTitleClass}>{card.cardCategory || "-"}</p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className={infoBoxClass}>
                          <span>Card Number</span>
                          <strong>{card.cardNumber || "-"}</strong>
                        </div>
                        <div className={infoBoxClass}>
                          <span>Issue Date</span>
                          <strong>{card.createdAt ? new Date(card.createdAt).toLocaleDateString("en-GB") : "-"}</strong>
                        </div>
                      </div>
                      <div className={infoBoxClass}>
                        <span>Status</span>
                        <strong className={getStatusBadgeClass(card.status)}>{card.status || "-"}</strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default CardsOverviewPage;
