import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { HomeHeaderActions } from "../components/BankingHeader.jsx";
import {
  accountApplyFormClass,
  accountHeroImageClass,
  accountModalBackdropClass,
  accountModalCardClass,
  accountPageWrapClass,
  accountSummaryCellClass,
  accountSummaryGridClass,
  applyNowBadgeClass,
  btnBlueClass,
  btnOrangeClass,
  cardProductTitleClass,
  celebrationBadgeClass,
  formActionsClass,
  formFieldClass,
  formFieldInputClass,
  modalCloseBtnClass,
  overviewTextClass,
  pageWrapClass,
  sectionHeadingOverviewClass,
  sectionSpacingClass
} from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession } from "../components/session.js";

function CardsPage({ cardType, cardCategory, heroImage, pageTitle, overviewText }) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvedCardNumber, setApprovedCardNumber] = useState("");
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const session = useMemo(() => {
    return getInternetBankingSession();
  }, []);

  function handleLogout() {
    clearInternetBankingSession();
    window.location.href = "/";
  }

  function clearSessionBeforeNavigate() {
    clearInternetBankingSession();
  }

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

  const inputClass = `${formFieldInputClass} w-full`;
  const selectClass = `${formFieldInputClass} w-full`;

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        session={session}
        onLogoutClick={handleLogout}
        clearSessionBeforeNavigate={clearSessionBeforeNavigate}
        actions={
          <HomeHeaderActions
            session={session}
            onLogoutClick={handleLogout}
            clearSessionBeforeNavigate={clearSessionBeforeNavigate}
          />
        }
      />

      <main className={`${accountPageWrapClass} ${sectionSpacingClass}`}>
        <img className={accountHeroImageClass} src={heroImage} alt={pageTitle} />

        <section className={sectionSpacingClass}>
          <h1 className={cardProductTitleClass}>{pageTitle}</h1>
          <h2 className={sectionHeadingOverviewClass}>Overview</h2>
          <p className={overviewTextClass}>{overviewText}</p>

          <a className={applyNowBadgeClass} href="#card-apply-form">
            Apply Now
          </a>
        </section>

        <section className={sectionSpacingClass}>
          <form id="card-apply-form" className={accountApplyFormClass} onSubmit={handleSubmit}>
            <label className={formFieldClass}>
              First Name *
              <input className={inputClass} type="text" name="firstName" placeholder="Muhammad" required />
            </label>

            <label className={formFieldClass}>
              Last Name
              <input className={inputClass} type="text" name="lastName" placeholder="Ali" />
            </label>

            <label className={formFieldClass}>
              Email *
              <input className={inputClass} type="email" name="email" placeholder="example@email.com" required />
            </label>

            <label className={formFieldClass}>
              Phone *
              <input className={inputClass} type="tel" name="phone" placeholder="(+92) 123 4567" required />
            </label>

            <label className={formFieldClass}>
              CNIC Number *
              <input className={inputClass} type="text" name="cnic" placeholder="XXXXX-XXXXXXX-X" required />
            </label>

            <label className={formFieldClass}>
              Date of Birth *
              <input className={inputClass} type="date" name="dateOfBirth" required />
            </label>

            <label className={formFieldClass}>
              Product Name
              <input className={inputClass} type="text" name="productName" value={pageTitle} readOnly />
            </label>

            <label className={formFieldClass}>
              Alternative Number
              <input className={inputClass} type="tel" name="alternativeNumber" placeholder="(+92) 300 1234567" />
            </label>

            <label className={formFieldClass}>
              City Name *
              <input className={inputClass} type="text" name="cityName" placeholder="Enter city name" required />
            </label>

            <label className={formFieldClass}>
              Net Income
              <input className={inputClass} type="text" name="netIncome" placeholder="Enter monthly income" />
            </label>

            <div className={formActionsClass}>
              <button type="submit" className={btnOrangeClass} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <p className="m-0 text-[0.95rem] text-[#6a7783]">Submitting this form does not guarantee approval.</p>
            </div>
          </form>
        </section>
      </main>

      <SiteFooter />

      {isApprovalModalOpen && (
        <div className={accountModalBackdropClass} role="dialog" aria-modal="true">
          <div className={accountModalCardClass}>
            <div className={celebrationBadgeClass}>🎉</div>
            <h3 className="relative z-[1] mb-3 text-[1.8rem] font-extrabold text-[#113753]">Congratulations!</h3>
            <p className="relative z-[1] mb-5 text-[0.95rem] leading-relaxed text-[#436480]">
              Your card is approved. Now you can avail ATM services and card features.
            </p>
            <p className="relative z-[1] mb-5 text-[0.95rem] leading-relaxed text-[#436480]">
              Within 7 working days, you will get your card at your address.
            </p>

            <div className={accountSummaryGridClass}>
              <div className={accountSummaryCellClass}>
                <span>Card Number</span>
                <strong>{approvedCardNumber}</strong>
              </div>
            </div>

            <button
              type="button"
              className={modalCloseBtnClass}
              onClick={() => navigate("/cards")}
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
