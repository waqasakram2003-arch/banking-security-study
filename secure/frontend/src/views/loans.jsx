import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { HomeHeaderActions } from "../components/BankingHeader.jsx";
import {
  accountHeroImageClass,
  accountModalBackdropClass,
  accountModalCardClass,
  accountPageWrapClass,
  btnBlueClass,
  btnSecondaryFormClass,
  cardProductTitleClass,
  loanOverviewListClass,
  overviewTextClass,
  pageWrapClass,
  sectionHeadingOverviewClass,
  sectionSpacingClass
} from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession } from "../components/session.js";

const loanFormGridClass =
  "mx-auto mt-8 grid max-w-[980px] grid-cols-1 gap-x-5 gap-y-[22px] md:grid-cols-2 lg:grid-cols-3 max-[720px]:grid-cols-1";
const loanFormGroupClass = "flex flex-col gap-2 text-[0.95rem] font-semibold text-[#193c59]";
const loanInputClass =
  "border-0 border-b-2 border-[#aeb9c4] bg-transparent py-2.5 font-inherit text-[0.95rem] text-[#1b2f43] placeholder:text-[#9ea9b4] transition-colors focus:border-[#1494da] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#6a7783]";
const loanLabelFlexClass = "flex items-center gap-1";

function LoansPage() {
  const navigate = useNavigate();
  const [isLoanGrantModalOpen, setIsLoanGrantModalOpen] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState("");
  const [requestedLoanAmount, setRequestedLoanAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    dateOfBirth: "",
    productName: "Personal Finance",
    alternateNumber: "",
    city: "",
    netIncome: "",
    requestedAmount: ""
  });

  const session = useMemo(() => {
    return getInternetBankingSession();
  }, []);

  function handleLogout() {
    clearInternetBankingSession();
    window.location.href = "/";
  }

  function clearSessionBeforeNavigateFunc() {
    clearInternetBankingSession();
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmitLoanForm(e) {
    e.preventDefault();

    if (!session?.user?._id || !session?.user?.account?._id) {
      toast.error("Please login first to apply for a loan.");
      return;
    }

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.cnic ||
      !formData.dateOfBirth ||
      !formData.city ||
      !formData.netIncome ||
      !formData.requestedAmount
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/loans/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: session.user._id,
          accountId: session.user.account._id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          cnic: formData.cnic,
          dateOfBirth: formData.dateOfBirth,
          alternateNumber: formData.alternateNumber,
          city: formData.city,
          netIncome: parseFloat(formData.netIncome),
          requestedAmount: parseFloat(formData.requestedAmount)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentLoanId(data.loan._id);
        setRequestedLoanAmount(parseFloat(formData.requestedAmount));
        setIsLoanGrantModalOpen(true);
      } else {
        toast.error(data.message || "Failed to submit loan application");
      }
    } catch (error) {
      toast.error("Error submitting loan application: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApproveLoan() {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/loans/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          loanId: currentLoanId,
          approvedAmount: requestedLoanAmount
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Congratulations your loan approved");
        setIsLoanGrantModalOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          cnic: "",
          dateOfBirth: "",
          productName: "Personal Finance",
          alternateNumber: "",
          city: "",
          netIncome: "",
          requestedAmount: ""
        });
        sessionStorage.setItem("loanApproved", "true");
        sessionStorage.setItem("loanAmount", requestedLoanAmount.toString());
        setTimeout(() => {
          navigate("/account");
        }, 300);
      } else {
        toast.error(data.message || "Failed to approve loan");
      }
    } catch (error) {
      toast.error("Error approving loan: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const policyBoxClass =
    "rounded-xl border border-[#d5e5f4] bg-gradient-to-br from-[#f7fbff] to-[#eef6fd] p-4 max-w-[980px] [&>p]:mb-3 [&>p]:last:mb-0 [&>p]:leading-[1.7] [&>p]:text-[#2d4f6c]";

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        clearSessionOnInternetBanking
        activeNav="loans"
        session={session}
        onLogoutClick={handleLogout}
        clearSessionBeforeNavigate={clearSessionBeforeNavigateFunc}
        actions={
          <HomeHeaderActions
            session={session}
            onLogoutClick={handleLogout}
            clearSessionBeforeNavigate={clearSessionBeforeNavigateFunc}
          />
        }
      />

      <main className={`${accountPageWrapClass} mt-[22px]`}>
        <img className={accountHeroImageClass} src="/images/loans/Personal-Finance-slide.png" alt="Personal Finance" />

        <section className={sectionSpacingClass}>
          <h1 className={cardProductTitleClass}>Personal Finance</h1>
          <h2 className={sectionHeadingOverviewClass}>Overview</h2>
          <p className={overviewTextClass}>
            If you need CASH to meet your financial needs, Askari Personal Finance is the best for you. It will suit the
            people who have:
          </p>

          <ul className={loanOverviewListClass}>
            <li>Pre-defined borrowing needs.</li>
            <li>Want the peace of mind through a fixed monthly installment and no hassle of the billing system.</li>
          </ul>

          <p className={overviewTextClass}>
            You may apply for Askari Personal Finance to give the best education to your child, plan a perfect wedding,
            decorate your sweet home, consolidate debts, visit your favourite destination, buy a much-desired gadget and
            more.
          </p>
        </section>

        <section className={`${sectionSpacingClass} mt-[26px]`}>
          <h2 className={sectionHeadingOverviewClass}>Policy</h2>

          <div className={policyBoxClass}>
            <p>You must return the loan after one month to avoid extra charges.</p>
            <p>If you do not return the loan within one month, an additional charge of 10% can be applied.</p>
            <p>
              If your account balance becomes at least 50% more than your outstanding loan amount, the bank may
              automatically deduct the pending loan amount.
            </p>
          </div>
        </section>

        <section className={sectionSpacingClass}>
          <h2 className={sectionHeadingOverviewClass}>Apply for Personal Finance</h2>
          <form onSubmit={handleSubmitLoanForm} className={loanFormGridClass}>
            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="firstName">
                First Name <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Muhammad"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label htmlFor="lastName">Last Name</label>
              <input
                className={loanInputClass}
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ali"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="email">
                Email <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="phone">
                Mobile Number <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(+92) 123 4567"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="cnic">
                CNIC Number <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="text"
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleInputChange}
                placeholder="(XXXXX-XXXXXXX-X)"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="dateOfBirth">
                Date of Birth <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label htmlFor="productName">Product Name</label>
              <input
                className={loanInputClass}
                type="text"
                id="productName"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                disabled
              />
            </div>

            <div className={loanFormGroupClass}>
              <label htmlFor="alternateNumber">Alternate Number</label>
              <input
                className={loanInputClass}
                type="tel"
                id="alternateNumber"
                name="alternateNumber"
                value={formData.alternateNumber}
                onChange={handleInputChange}
                placeholder="(+92) 300 1234567"
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="city">
                City <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter City Name"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="netIncome">
                Net Income <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="number"
                id="netIncome"
                name="netIncome"
                value={formData.netIncome}
                onChange={handleInputChange}
                placeholder="Enter Monthly Income"
                min="0"
                required
              />
            </div>

            <div className={loanFormGroupClass}>
              <label className={loanLabelFlexClass} htmlFor="requestedAmount">
                Requested Loan Amount <span className="font-bold text-[#dc3545]">*</span>
              </label>
              <input
                className={loanInputClass}
                type="number"
                id="requestedAmount"
                name="requestedAmount"
                value={formData.requestedAmount}
                onChange={handleInputChange}
                placeholder="Enter Loan Amount"
                min="0"
                required
              />
            </div>

            <div className="col-span-full mt-1.5 flex justify-center gap-3.5">
              <button
                type="submit"
                className="cursor-pointer rounded-full border-0 bg-[#1494da] px-8 py-3 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0d7ab8] hover:shadow-[0_6px_16px_rgba(20,148,218,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Loan Application"}
              </button>
            </div>
          </form>
        </section>
      </main>

      <SiteFooter />

      {isLoanGrantModalOpen ? (
        <div className={accountModalBackdropClass} role="dialog" aria-modal="true" aria-label="Loan confirmation">
          <div className={`${accountModalCardClass} max-w-[520px]`}>
            <h3 className="mb-2.5 text-[1.6rem] font-extrabold text-[#113753]">Confirm Loan Application</h3>
            <p className="mb-5 text-[0.95rem] leading-relaxed text-[#436480]">
              Please confirm to approve and disburse your loan amount.
            </p>

            <div className={`${policyBoxClass} my-5`}>
              <h4 className="m-0 mb-2 text-base font-bold text-[#2d4f6c]">Loan Policy</h4>
              <p>You must return the loan after one month to avoid extra charges.</p>
              <p>If you do not return the loan within one month, an additional charge of 10% can be applied.</p>
              <p>
                If your account balance becomes at least 50% more than your outstanding loan amount, the bank may
                automatically deduct the pending loan amount.
              </p>
            </div>

            <div className="my-5 flex items-center justify-between rounded-xl border-2 border-[#1494da] bg-gradient-to-br from-[#f0f8ff] to-[#e8f4ff] px-5 py-4">
              <span className="text-[0.95rem] font-bold text-[#193c59]">Loan Amount:</span>
              <strong className="text-[1.3rem] font-extrabold text-[#1494da]">
                PKR {requestedLoanAmount.toLocaleString()}
              </strong>
            </div>

            <div className="relative z-[2] mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className={`${btnBlueClass} min-w-[140px] flex-1 rounded-[10px] px-7 py-3 text-[0.95rem]`}
                onClick={handleApproveLoan}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm & Approve"}
              </button>
              <button
                type="button"
                className={`${btnSecondaryFormClass} min-w-[140px] flex-1 rounded-[10px] px-7 py-3`}
                onClick={() => setIsLoanGrantModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default LoansPage;
