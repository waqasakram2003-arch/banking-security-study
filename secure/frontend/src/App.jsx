import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./views/home.jsx";
import ZabardastCurrentAccount from "./views/zabardastCurrentAccount.jsx";
import AsaanSavingAccount from "./views/asaanSavingAccount.jsx";
import InternetBanking from "./views/internetBanking.jsx";
import AccountPage from "./views/account.jsx";
import CardsPage from "./views/cards.jsx";
import CardsOverviewPage from "./views/cardsOverview.jsx";
import TransferMoney from "./views/transferMoney.jsx";
import AboutUs from "./views/aboutUs.jsx";
import LoansPage from "./views/loans.jsx";

const cardPages = {
  visaDebit: {
    cardType: "debit",
    cardCategory: "Visa Debit Card",
    heroImage: "/images/Cards/Askari VISA Debit Cards 17102025.jpg",
    pageTitle: "Visa Debit Card",
    overviewText:
      "Need easy access to your money? With Visa Debit Card, you can use your account anytime where Visa is accepted. Enjoy secure payments, quick withdrawals, and convenient day-to-day banking." 
  },
  paypakDebit: {
    cardType: "debit",
    cardCategory: "PayPak Debit Card",
    heroImage: "/images/Cards/Paypak Debit Cards.jpg",
    pageTitle: "PayPak Debit Card",
    overviewText:
      "PayPak Debit Card gives you local payment convenience with secure transactions and reliable ATM access across Pakistan. It is designed for simple and affordable everyday banking use." 
  },
  masterCredit: {
    cardType: "credit",
    cardCategory: "MasterCard Credit Card",
    heroImage: "/images/Cards/Mastercard Credit Cards.jpg",
    pageTitle: "MasterCard Credit Card",
    overviewText:
      "MasterCard Credit Card offers flexible spending for shopping, travel, and online payments. Benefit from secure credit access and a smooth payment experience whenever you need it." 
  },
  worldMasterCredit: {
    cardType: "credit",
    cardCategory: "World MasterCard Credit Card",
    heroImage: "/images/Cards/Askari World Mastercard Credit Card -5.png",
    pageTitle: "World MasterCard Credit Card",
    overviewText:
      "World MasterCard Credit Card is built for premium usage with higher convenience, global acceptance, and enhanced cardholder privileges for frequent and lifestyle-focused spenders." 
  }
};

function App() {
  useEffect(() => {
    let resetTimer = null;

    function releaseSuppression() {
      document.body.classList.remove("suppress-nav-hover");
      document.removeEventListener("mousemove", releaseSuppression);
    }

    function handleMenuLinkClick(event) {
      const link = event.target.closest(".cards-menu-panel a");
      if (!link) {
        return;
      }

      document.body.classList.add("suppress-nav-hover");
      document.addEventListener("mousemove", releaseSuppression, { once: true });

      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }

      resetTimer = window.setTimeout(() => {
        releaseSuppression();
      }, 1200);
    }

    document.addEventListener("click", handleMenuLinkClick);

    return () => {
      document.removeEventListener("click", handleMenuLinkClick);
      document.removeEventListener("mousemove", releaseSuppression);
      if (resetTimer) {
        window.clearTimeout(resetTimer);
      }
      document.body.classList.remove("suppress-nav-hover");
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/accounts" element={<Home />} />
        <Route
          path="/accounts/zabardast-current-account"
          element={<ZabardastCurrentAccount />}
        />
        <Route
          path="/accounts/asaan-saving-account"
          element={<AsaanSavingAccount />}
        />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/cards" element={<CardsOverviewPage />} />
        <Route path="/cards/visa-debit-card" element={<CardsPage {...cardPages.visaDebit} />} />
        <Route path="/cards/paypak-debit-card" element={<CardsPage {...cardPages.paypakDebit} />} />
        <Route path="/cards/mastercard-credit-card" element={<CardsPage {...cardPages.masterCredit} />} />
        <Route path="/cards/world-mastercard-credit-card" element={<CardsPage {...cardPages.worldMasterCredit} />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/internet-banking" element={<InternetBanking />} />
        <Route path="/transfer-money" element={<TransferMoney />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/digital-banking" element={<Navigate to="/internet-banking" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </>
  );
}

export default App;