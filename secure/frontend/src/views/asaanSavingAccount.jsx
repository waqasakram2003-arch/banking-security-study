import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { HomeHeaderActions } from "../components/BankingHeader.jsx";
import {
  accountHeroImageClass,
  accountModalBackdropClass,
  accountModalCardClass,
  accountPageWrapClass,
  accountSummaryCellClass,
  accountSummaryGridClass,
  accountTitleClass,
  applyNowBadgeClass,
  btnBlueClass,
  btnCancelLightClass,
  btnLogoutClass,
  btnOrangeClass,
  formActionsClass,
  formFieldClass,
  formFieldInputClass,
  modalCloseBtnClass,
  navDdClass,
  navLinkClass,
  overviewLeadClass,
  overviewTextClass,
  pageWrapClass,
  sectionHeadingOverviewClass,
  sectionSpacingClass
} from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession } from "../components/session.js";

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
    return getInternetBankingSession();
  });

  useEffect(() => {
    function syncSession() {
      setSession(getInternetBankingSession());
    }

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  function clearSessionBeforeNavigate() {
    clearInternetBankingSession();
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
    const startingBalance = Number(formData.get("startingBalance"));

    setIsSubmitting(true);
    try {
      const profileImage = formData.get("profileImage");

      if (profileImage && typeof profileImage === "object" && profileImage.size > 0) {
        if (!String(profileImage.type || "").startsWith("image/")) {
          throw new Error("Profile image must be an image file");
        }
      }

      const profileImageData =
        profileImage && typeof profileImage === "object" && profileImage.size > 0
          ? await fileToDataUrl(profileImage)
          : "";

      const payload = {
        fullName: String(formData.get("fullName") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        cnic: String(formData.get("cnic") || "").trim(),
        address: String(formData.get("address") || "").trim(),
        profileImage: profileImageData,
        startingBalance,
        accountType: "saving",
        submittedByUserId: session?.user?._id || ""
      };

      if (session?.user?._id) {
        toast.error("You are already using Public Bank Service. Sorry, you cannot create multiple accounts.");
        setIsSubmitting(false);
        return;
      }

      const response = await fetch("http://localhost:3000/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
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

  const inputClass = `${formFieldInputClass} w-full`;
  const accountApplyFormClass =
    "mx-auto mt-8 grid max-w-[980px] grid-cols-1 gap-x-5 gap-y-[22px] md:grid-cols-2 lg:grid-cols-3 max-[720px]:gap-y-[18px]";

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        onInternetBankingClick={clearSessionBeforeNavigate}
        session={session}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        clearSessionBeforeNavigate={clearSessionBeforeNavigate}
        betweenLoansAndAbout={
          session?.username ? (
            <div className={navDdClass}>
              <Link className={navLinkClass} to="/transfer-money">
                Transfer
              </Link>
            </div>
          ) : null
        }
        actions={
          <HomeHeaderActions
            session={session}
            onLogoutClick={() => setIsLogoutModalOpen(true)}
            clearSessionBeforeNavigate={clearSessionBeforeNavigate}
          />
        }
      />

      <main className={accountPageWrapClass}>
        <img
          className={accountHeroImageClass}
          src="/images/Saving-Account/Asaan Digital Account.png"
          alt="Asaan Saving Account"
        />

        <section className={sectionSpacingClass}>
          <h1 className={accountTitleClass}>Asaan Saving Account</h1>

          <h2 className={sectionHeadingOverviewClass}>Overview</h2>
          <p className={overviewLeadClass}>Save simply. Build strong!</p>
          <p className={overviewTextClass}>
            Big goals begin with small steps, and Asaan Saving Account makes your first step effortless.
          </p>
          <p className={overviewTextClass}>
            Start saving with just Rs. 100. No minimum balance. No fine print.
            <br />
            Just easy access, secure banking, and profit on every rupee you set aside.
          </p>
          <p className={overviewTextClass}>
            Because saving should never be complicated.
            <br />
            Open your account today.
          </p>
        </section>

        <section className={sectionSpacingClass}>
          <h2 className={`${applyNowBadgeClass} mb-6 mt-0`}>Apply Now</h2>
          <form className={accountApplyFormClass} onSubmit={handleSubmit}>
            <input type="hidden" name="accountType" value="saving" />

            <label className={formFieldClass}>
              Full Name *
              <input className={inputClass} type="text" name="fullName" placeholder="Muhammad Ali" required />
            </label>

            <label className={formFieldClass}>
              Email *
              <input className={inputClass} type="email" name="email" placeholder="example@email.com" required />
            </label>

            <label className={formFieldClass}>
              Phone *
              <input className={inputClass} type="tel" name="phone" placeholder="(+92) 3XX XXXXXXX" required />
            </label>

            <label className={formFieldClass}>
              CNIC Number *
              <input className={inputClass} type="text" name="cnic" placeholder="XXXXX-XXXXXXX-X" required />
            </label>

            <label className={formFieldClass}>
              Profile Image
              <input
                className={`${inputClass} border-0 py-2 text-sm file:mr-2`}
                type="file"
                name="profileImage"
                accept="image/*"
              />
            </label>

            <label className={formFieldClass}>
              Address *
              <input className={inputClass} type="text" name="address" placeholder="Enter your full address" required />
            </label>

            <label className={formFieldClass}>
              Starting Balance * (Rs. 1,000 - Rs. 1,000,000)
              <input
                className={inputClass}
                type="number"
                name="startingBalance"
                min="1000"
                max="1000000"
                step="1"
                placeholder="50000"
                required
              />
            </label>

            <label className={formFieldClass}>
              Product Name
              <input className={inputClass} type="text" name="productName" defaultValue="Asaan Saving Account" readOnly />
            </label>

            <label className={formFieldClass}>
              Alternative Number
              <input className={inputClass} type="tel" name="alternativeNumber" placeholder="(+92) 300 1234567" />
            </label>

            <div className={formActionsClass}>
              <button type="submit" className={btnOrangeClass} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <p className="m-0 text-[0.95rem] text-[#6a7783]">
                {session?.user?._id
                  ? "You are already using Public Bank Service. Sorry, you cannot create multiple accounts."
                  : "Submitting this form does not guarantee approval."}
              </p>
            </div>
          </form>
        </section>
      </main>

      {isAccountModalOpen && accountDetails && (
        <div className={accountModalBackdropClass} role="dialog" aria-modal="true">
          <div className={accountModalCardClass}>
            <h3 className="relative z-[1] mb-3 text-[1.8rem] font-extrabold text-[#113753]">🎉 Congratulations!</h3>
            <p className="relative z-[1] mb-5 text-[0.95rem] leading-relaxed text-[#436480]">
              Your account has been created successfully.
            </p>
            <div className="relative z-[1] mb-4 rounded-[10px] border border-[#efdca6] bg-[#fff8e8] p-2.5 text-[0.88rem] font-semibold text-[#7a5511]">
              Kindly note and save your account information for future use.
            </div>

            <div className={accountSummaryGridClass}>
              <div className={accountSummaryCellClass}>
                <span>Account Number</span>
                <strong>{accountDetails.accountNumber}</strong>
              </div>
              <div className={accountSummaryCellClass}>
                <span>IBAN</span>
                <strong>{accountDetails.iban}</strong>
              </div>
              <div className={accountSummaryCellClass}>
                <span>Balance</span>
                <strong>{accountDetails.balance}</strong>
              </div>
              <div className={accountSummaryCellClass}>
                <span>Created At</span>
                <strong>{formatDate(accountDetails.createdAt)}</strong>
              </div>
              <div className={accountSummaryCellClass}>
                <span>Status</span>
                <strong>{accountDetails?.application?.status || "approved"}</strong>
              </div>
            </div>

            <button
              type="button"
              className={modalCloseBtnClass}
              onClick={() => setIsAccountModalOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <div className="relative z-[1] mt-1.5 flex flex-col items-start justify-between gap-2.5 rounded-[11px] border border-[#002a54] bg-[#003d7a] p-3 sm:flex-row sm:items-center">
              <p className="m-0 font-bold text-white">Use Best Bank Digital Banking Signup ?</p>
              <Link
                className={btnBlueClass}
                to={`/internet-banking?mode=signup&accountNumber=${encodeURIComponent(accountDetails.accountNumber)}&cnic=${encodeURIComponent(accountDetails.application?.cnic || "")}&email=${encodeURIComponent(accountDetails.application?.email || "")}&applicationId=${encodeURIComponent(accountDetails.application?._id || "")}`}
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
        <div
          className="fixed inset-0 z-[1100] grid place-items-center bg-[rgba(10,24,39,0.28)] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-[min(480px,100%)] rounded-xl border border-[#efe7d4] bg-[#faf7ef] p-5 shadow-[0_8px_20px_rgba(11,25,38,0.14)]">
            <p className="mb-4 text-left text-[1.05rem] font-bold text-[#233a4f]">
              Are you sure to Logout from your account?
            </p>
            <div className="flex justify-end gap-2.5">
              <button type="button" className={btnLogoutClass} onClick={handleLogout}>
                Yes
              </button>
              <button type="button" className={btnCancelLightClass} onClick={() => setIsLogoutModalOpen(false)}>
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
