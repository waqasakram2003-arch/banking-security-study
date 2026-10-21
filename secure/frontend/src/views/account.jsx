import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import {
  accountModalBackdropClass,
  accountModalCardClass,
  btnBlueClass,
  btnCancelLightClass,
  btnLogoutClass,
  btnOrangeClass,
  formFieldClass,
  navDdClass,
  navLinkClass,
  pageWrapClass,
  profileCardClass,
  profilePageWrapClass
} from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession, setInternetBankingSession } from "../components/session.js";

const CARD_IMAGE_BY_CATEGORY = {
  "Visa Debit Card": "/images/Cards/Askari VISA Debit Cards 17102025.jpg",
  "PayPak Debit Card": "/images/Cards/Paypak Debit Cards.jpg",
  "MasterCard Credit Card": "/images/Cards/Mastercard Credit Cards.jpg",
  "World MasterCard Credit Card": "/images/Cards/Askari World Mastercard Credit Card -5.png"
};

const CREDIT_TRANSACTION_TYPES = new Set(["initial", "loan", "transfer_received"]);

function isCreditTransaction(transactionType) {
  return CREDIT_TRANSACTION_TYPES.has(String(transactionType || "").toLowerCase());
}

function formatStatementAmount(amount) {
  return `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatementTypeClass(transactionType) {
  const normalized = String(transactionType || "").toLowerCase();
  const base =
    "inline-flex items-center rounded-full border px-2 py-1 text-xs font-bold capitalize";
  if (normalized === "loan") return `${base} border-[#ffd8a8] bg-[#fff4e5] text-[#9a4b00]`;
  if (normalized === "transfer_sent") return `${base} border-[#ffc2cf] bg-[#ffebef] text-[#a51035]`;
  if (normalized === "transfer_received") return `${base} border-[#b9ecd2] bg-[#e8f8ef] text-[#0d7a43]`;
  if (normalized === "initial") return `${base} border-[#c9ddfb] bg-[#eaf3ff] text-[#1256a3]`;
  return `${base} border-[#d7e3ef] bg-[#eef3f8] text-[#3f5870]`;
}

const STATEMENT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 48 180 80"><g fill-rule="evenodd" clip-rule="evenodd"><path d="M23.519 118.816c0 1.924-.192 2.887-.77 3.656-.962.963-1.925 1.156-4.042 1.156l-5.967-.193c-.192 0-.192.193-.385.193v3.08h-3.85v-12.32h10.202c2.118 0 3.081 0 3.85.77.769.963.962 1.541.962 3.658zm-5.005 1.733c.385 0 .77 0 1.155-.385.192-.385.385-.771.385-1.348 0-.385 0-.77-.385-1.156-.578-.385-.77-.385-1.155-.385H12.547c-.192.193-.192.193-.192.385v2.504c0 .191 0 .191.192.385H18.514zM27.369 125.746c-.77-.77-1.155-1.541-1.155-2.695v-8.662h3.658v7.893c0 1.539 3.08 1.539 4.427 1.539 1.155 0 3.85.193 3.85-1.539v-7.893h3.85v8.662c0 1.154-.385 1.732-.962 2.502-1.155 1.348-4.812 1.156-6.737 1.156-2.119 0-5.969.191-6.931-.963zM59.13 115.158c.577.771.77 1.348.77 2.311 0 .77-.192 1.732-.385 2.117-.577.77-1.347.77-1.347.963 0 .191.962.191 1.347.578.577.77.771 1.346.771 2.117 0 1.154-.193 2.117-.963 2.887-.77.578-2.502.578-3.85.578H44.5v-12.32h10.78c1.54 0 3.273 0 3.85.769zm-2.695 3.08c0-.578-.385-1.154-1.155-1.154h-7.123v2.309h7.123c.77 0 1.155-.577 1.155-1.155zm.385 4.621c0-.771-.385-1.156-1.54-1.156h-7.123v2.117h7.315c1.156 0 1.348-.384 1.348-.961zM75.3 123.82v2.889H62.403v-12.32h3.849v9.431H75.3zM77.802 114.389h3.85v12.32h-3.85v-12.32zM99.555 122.088s.385 2.504-.578 3.465c-.963.963-4.235 1.156-6.93 1.156s-6.16-.193-6.93-1.156c-.963-1.539-.963-3.271-.963-5.004 0-1.926.193-3.85 1.155-5.197.77-.77 4.042-.963 6.737-.963 2.887 0 5.775.193 6.545.963.963 1.154.77 3.271.77 3.271h-3.272s0-.385-.385-.963c-.577-.385-2.118-.385-3.657-.385-1.732 0-3.272 0-3.85.578-.385.578-.577 1.732-.577 2.695s0 1.924.577 2.695c.385.576 2.118.576 3.85.576 1.54 0 3.08 0 3.657-.385.578-.576.385-1.348.385-1.348h3.466v.002zM124.002 115.158c.77.771.77 1.348.77 2.311 0 .77-.193 1.732-.385 2.117-.578.77-1.348.77-1.348.963 0 .191.963.191 1.348.578.576.77.77 1.346.77 2.117 0 1.154-.193 2.117-.963 2.887-.77.578-2.502.578-3.85.578h-10.779v-12.32h10.586c1.54 0 3.273 0 3.851.769zm-2.695 3.08c0-.578-.385-1.154-1.156-1.154h-7.121v2.309h7.121c.771 0 1.156-.577 1.156-1.155zm.384 4.621c0-.771-.385-1.156-1.541-1.156h-7.121v2.117h7.314c1.155 0 1.348-.384 1.348-.961zM126.311 126.709l6.93-12.32h5.582l6.545 12.32h-4.041l-1.348-2.504h-8.277l-1.348 2.504h-4.043zm6.929-5.006c0 .193 0 .193.193.193h5.004c.193 0 .193 0 .193-.193.191 0 .191-.191.191-.191l-2.117-4.236c0-.191-.191-.191-.191-.191 0-.193-.193-.193-.193-.193h-.576s-.193 0-.193.193l-.191.191-2.119 4.043c-.001.193-.192.193-.001.384zM151.912 117.854c-.191-.385-.191-.385-.576-.385s-.385 0-.385.385v8.855h-3.465v-12.32h6.352l6.16 8.855c.191.385.385.385.77.385.193 0 .193 0 .193-.385v-8.855h3.465v12.32h-6.354l-6.16-8.855zM171.162 122.281v4.428h-3.656v-12.32h3.656v4.427c.193.191.385.191.385.191h1.926l4.812-4.619h5.389l-7.121 5.967 7.699 6.354h-5.389l-5.584-4.812h-2.117v.384zM116.686 62.607l-11.934-11.742H87.427L75.3 62.8v12.32l1.925 1.732-1.925 1.732v12.319l11.935 11.743h17.708l11.742-11.549V78.392l-1.732-1.54 1.732-1.54V62.607h.001zM96.089 98.988L81.844 84.745l1.54-1.54 3.851 3.657h17.708l3.852-3.85 1.732 1.733-14.438 14.243zm-6.352-22.136l6.353-6.353 6.545 6.353-6.545 6.353-6.353-6.353zm19.058-6.352l-4.043-3.85H87.427l-4.043 4.042-1.54-1.733 14.245-14.244 14.438 14.244-1.732 1.541z" fill="#c32c2c"/></g></svg>`;

function AccountPage() {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isStatementLoading, setIsStatementLoading] = useState(false);
  const [statementFrom, setStatementFrom] = useState("");
  const [statementTo, setStatementTo] = useState("");
  const [statementType, setStatementType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [cards, setCards] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updateForm, setUpdateForm] = useState({ username: "", email: "", cnic: "", phone: "", address: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });

  const session = useMemo(() => {
    return getInternetBankingSession();
  }, []);

  const userId = session?.user?._id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    async function loadProfile() {
      setIsLoading(true);
      try {
        const [profileResponse, cardsResponse, transactionsResponse] = await Promise.all([
          fetch(`http://localhost:3000/api/accounts/profile/${userId}`),
          fetch(`http://localhost:3000/api/cards/user/${userId}`),
          fetch(`http://localhost:3000/api/transactions/user/${userId}/recent?limit=3`)
        ]);
        const [profileResult, cardsResult, transactionsResult] = await Promise.all([
          profileResponse.json(),
          cardsResponse.json(),
          transactionsResponse.json()
        ]);

        if (!profileResponse.ok) {
          throw new Error(profileResult?.message || "Unable to load account details");
        }
        if (!cardsResponse.ok) {
          throw new Error(cardsResult?.message || "Unable to load cards");
        }

        setProfile(profileResult.profile);
        setCards(Array.isArray(cardsResult?.cards) ? cardsResult.cards : []);
        setRecentTransactions(Array.isArray(transactionsResult?.transactions) ? transactionsResult.transactions : []);
        setUpdateForm({
          username: profileResult.profile?.username || "",
          email: profileResult.profile?.email || "",
          cnic: profileResult.profile?.cnic || "",
          phone: profileResult.profile?.phone || "",
          address: profileResult.profile?.address || ""
        });
      } catch (error) {
        toast.error(error.message || "Unable to load account details");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  useEffect(() => {
    // Check if coming from loan approval
    const loanApproved = sessionStorage.getItem("loanApproved");
    const loanAmount = parseFloat(sessionStorage.getItem("loanAmount") || "0");
    
    if (loanApproved && userId && profile && loanAmount > 0) {
      // Clear the flags
      sessionStorage.removeItem("loanApproved");
      sessionStorage.removeItem("loanAmount");
      
      // Store original balance
      const originalBalance = profile.balance;
      const reducedBalance = originalBalance - loanAmount;
      
      // Temporarily reduce balance for visual delay
      setProfile(prev => ({
        ...prev,
        balance: reducedBalance
      }));
      
      // After 3 seconds, add the loan amount back and show toast
      const timer = setTimeout(() => {
        setProfile(prev => ({
          ...prev,
          balance: originalBalance
        }));
        
        // Update session with new balance
        const currentSession = getInternetBankingSession();
        if (currentSession?.user?.account) {
          currentSession.user.account.balance = originalBalance;
          setInternetBankingSession(currentSession);
        }
        
        toast.success("Congratulations Loan amount transferred to your account");
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [userId, profile]);

  useEffect(() => {
    if (!isTransactionsModalOpen && !isStatementModalOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isTransactionsModalOpen, isStatementModalOpen]);

  function clearSession() {
    clearInternetBankingSession();
  }

  function handleUpdateFieldChange(event) {
    const { name, value } = event.target;
    setUpdateForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePasswordFieldChange(event) {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
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
        body: JSON.stringify(updateForm)
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
            fullName: session.user?.application?.fullName,
            email: result.profile?.email || session.user?.application?.email,
            cnic: result.profile?.cnic || session.user?.application?.cnic,
            phone: result.profile?.phone,
            address: result.profile?.address || session.user?.application?.address
          }
        }
      };
      setInternetBankingSession(nextSession);

      toast.success("Account details updated");
    } catch (error) {
      toast.error(error.message || "Unable to update account");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordUpdate() {
    if (!profile?.userId) {
      return;
    }

    setIsPasswordSaving(true);
    try {
      const response = await fetch(`http://localhost:3000/api/users/${profile.userId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(passwordForm)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to update password");
      }

      setIsPasswordModalOpen(false);
      setPasswordForm({ oldPassword: "", newPassword: "" });
      setShowOldPassword(false);
      setShowNewPassword(false);
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error(error.message || "Unable to update password");
    } finally {
      setIsPasswordSaving(false);
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

  const debitCards = cards.filter((card) => card?.cardType === "debit").length;
  const creditCards = cards.filter((card) => card?.cardType === "credit").length;
  const approvedCards = cards.filter((card) => card?.status === "approved").length;
  const pendingCards = cards.filter((card) => card?.status === "pending").length;

  const statementTransactions = useMemo(() => {
    const orderedTransactions = [...allTransactions].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    let runningBalance = 0;
    const transactionsWithBalance = orderedTransactions.map((transaction) => {
      const amount = Number(transaction?.amount || 0);
      const debit = isCreditTransaction(transaction?.type);
      const balanceBefore = runningBalance;
      runningBalance += debit ? amount : -amount;

      return {
        ...transaction,
        isCredit: !debit,
        isDebit: debit,
        balanceBefore,
        balanceAfter: runningBalance
      };
    });

    const fromDate = statementFrom ? new Date(statementFrom) : null;
    const toDate = statementTo ? new Date(statementTo) : null;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    return transactionsWithBalance.filter((transaction) => {
      const txDate = new Date(transaction.createdAt);

      if (fromDate && txDate < fromDate) {
        return false;
      }

      if (toDate && txDate > toDate) {
        return false;
      }

      if (statementType === "credit") {
        return transaction.isCredit;
      }

      if (statementType === "debit") {
        return transaction.isDebit;
      }

      return true;
    });
  }, [allTransactions, statementFrom, statementTo, statementType]);

  const statementOpeningBalance = statementTransactions.length > 0
    ? statementTransactions[0].balanceBefore
    : 0;

  const statementClosingBalance = statementTransactions.length > 0
    ? statementTransactions[statementTransactions.length - 1].balanceAfter
    : statementOpeningBalance;

  async function ensureAllTransactionsLoaded() {
    if (allTransactions.length > 0) {
      return allTransactions;
    }

    const response = await fetch(`http://localhost:3000/api/transactions/user/${userId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Unable to load transactions");
    }

    const transactions = Array.isArray(result?.transactions) ? result.transactions : [];
    setAllTransactions(transactions);
    return transactions;
  }

  async function openTransactionStatementModal() {
    setIsStatementLoading(true);
    try {
      await ensureAllTransactionsLoaded();
      setIsStatementModalOpen(true);
    } catch (error) {
      toast.error(error.message || "Unable to load transactions");
    } finally {
      setIsStatementLoading(false);
    }
  }

  function buildStatementHtml() {
    const statementLabel = statementType === "all"
      ? "All Transactions"
      : statementType === "credit"
        ? "Credit"
        : "Debit";

    const rows = statementTransactions
      .map((transaction) => {
        const amountPrefix = transaction.isCredit ? "-" : "+";
        const amountColor = transaction.isCredit ? "#be123c" : "#138a4f";
        const typeClass = getStatementTypeClass(transaction.type);
        return `
          <tr>
            <td>${escapeHtml(new Date(transaction.createdAt).toLocaleDateString("en-PK"))}</td>
            <td><span class="${typeClass}">${escapeHtml(transaction.type)}</span></td>
            <td>${escapeHtml(transaction.description || "-")}</td>
            <td>${escapeHtml(transaction.referenceNumber || "-")}</td>
            <td style="text-align:right;font-weight:700;color:${amountColor};">${amountPrefix}${escapeHtml(formatStatementAmount(transaction.amount))}</td>
          </tr>`;
      })
      .join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Transaction Statement</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 28px; color: #12263a; background: #f4f8fc; }
    .sheet { max-width: 960px; margin: 0 auto; background: #ffffff; border: 1px solid #d8e5f2; border-radius: 12px; padding: 24px; }
    .header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-bottom: 1px solid #e4edf6; padding-bottom: 16px; margin-bottom: 16px; }
    .brand-mark { display: flex; justify-content: center; margin: 0 0 18px; }
    .brand-mark svg { width: 220px; max-width: 70%; height: auto; }
    .title { margin: 0; font-size: 26px; color: #0f2d46; }
    .muted { color: #5b7288; margin-top: 4px; font-size: 13px; }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 14px 0 18px; }
    .summary-card { border: 1px solid #d7e5f3; border-radius: 10px; padding: 10px 12px; background: #f9fcff; }
    .summary-card span { display: block; color: #60778d; font-size: 12px; margin-bottom: 4px; }
    .summary-card strong { font-size: 20px; color: #102f49; }
    .tx-type {
      display: inline-flex;
      align-items: center;
      padding: 4px 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid transparent;
      text-transform: capitalize;
    }
    .tx-type-loan { background: #fff4e5; color: #9a4b00; border-color: #ffd8a8; }
    .tx-type-transfer-sent { background: #ffebef; color: #a51035; border-color: #ffc2cf; }
    .tx-type-transfer-received { background: #e8f8ef; color: #0d7a43; border-color: #b9ecd2; }
    .tx-type-initial { background: #eaf3ff; color: #1256a3; border-color: #c9ddfb; }
    .tx-type-default { background: #eef3f8; color: #3f5870; border-color: #d7e3ef; }
    table { width: 100%; border-collapse: collapse; }
    thead th { text-align: left; background: #eef5fb; border-bottom: 1px solid #d8e6f3; padding: 10px; font-size: 12px; color: #2a4a64; }
    tbody td { border-bottom: 1px solid #e7eff7; padding: 10px; font-size: 13px; }
    .footer-note { margin-top: 12px; color: #60778d; font-size: 12px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <h1 class="title">Transaction Statement</h1>
        <div class="muted">Account: ${escapeHtml(profile?.accountNumber || "-")}</div>
      </div>
      <div>
        <div class="muted">Date Range: ${escapeHtml(statementFrom || "Start")} to ${escapeHtml(statementTo || "Today")}</div>
        <div class="muted">Type: ${escapeHtml(statementLabel)}</div>
        <div class="muted">Generated: ${escapeHtml(new Date().toLocaleString("en-PK"))}</div>
      </div>
    </div>

    <div class="brand-mark" aria-hidden="true">${STATEMENT_LOGO_SVG}</div>

    <div class="summary">
      <div class="summary-card">
        <span>Opening Balance</span>
        <strong>${escapeHtml(formatStatementAmount(statementOpeningBalance))}</strong>
      </div>
      <div class="summary-card">
        <span>Closing Balance</span>
        <strong>${escapeHtml(formatStatementAmount(statementClosingBalance))}</strong>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Transaction Type</th>
          <th>Description</th>
          <th>Reference</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center;color:#60778d;">No transactions found for selected filters.</td></tr>'}
      </tbody>
    </table>

    <p class="footer-note">This is a system-generated statement.</p>
  </div>
</body>
</html>`;
  }

  function handleDownloadStatement() {
    if (statementTransactions.length === 0) {
      toast.error("No transactions found for selected filters");
      return;
    }

    const html = buildStatementHtml();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `transaction-statement-${profile?.accountNumber || userId}-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    toast.success("Transaction statement downloaded");
    setIsStatementModalOpen(false);
  }

  function getCardImage(cardCategory) {
    return CARD_IMAGE_BY_CATEGORY[cardCategory] || "/images/Cards/Paypak Debit Cards.jpg";
  }

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

  if (!userId) {
    return <Navigate to="/internet-banking" replace />;
  }

  const pwdWrap = "relative flex w-full items-center";
  const pwdInput =
    "w-full rounded-lg border border-[#c3d5e2] px-3 py-2 pr-11 font-inherit text-[#112f48] focus:border-[#148ed3] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,142,211,0.12)]";
  const eyeBtn = (on) =>
    `absolute right-2.5 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 ${on ? "text-[#0d5f9b] opacity-100" : "text-[#4f6a82] opacity-40 hover:opacity-70"}`;
  const modalInputClass =
    "w-full rounded-lg border border-[#c3d5e2] px-3 py-2.5 font-inherit text-[#112f48] focus:border-[#148ed3] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,142,211,0.12)]";

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        session={session}
        betweenLoansAndAbout={
          <div className={navDdClass}>
            <Link className={navLinkClass} to="/transfer-money">
              Transfer
            </Link>
          </div>
        }
        actions={
          <>
            <Link className={btnBlueClass} to="/transfer-money">
              Transfer Money
            </Link>
            <Link className={btnBlueClass} to="/">
              Back to Home
            </Link>
          </>
        }
      />

      <main className={profilePageWrapClass}>
        <section className={profileCardClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h1 className="m-0 text-[clamp(1.4rem,2.8vw,2rem)] text-[#172f44]">My Account</h1>
            {!isLoading && profile?.profileImage && (
              <img
                src={profile.profileImage}
                alt={profile.username || "User Profile"}
                className="h-[96px] w-[96px] shrink-0 rounded-full border-[3px] border-[#1494da] object-cover shadow-[0_8px_24px_rgba(20,148,218,0.2)] max-[640px]:h-[78px] max-[640px]:w-[78px]"
              />
            )}
          </div>

          {isLoading && <p className="m-0 text-[#4f667d]">Loading account details...</p>}

          {!isLoading && profile && (
            <>
              <div className="mb-3.5 rounded-xl border border-[#d2e2ef] bg-white px-3.5 py-3">
                <span className="mb-0.5 block text-[0.83rem] text-[#55708a]">Account Number</span>
                <strong className="text-[1.08rem] text-[#102e48]">{profile.accountNumber || "-"}</strong>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 max-[900px]:grid-cols-1">
                <div className="rounded-[10px] border border-[#dbe9f4] bg-white p-2.5">
                  <span className="mb-1 block text-[0.8rem] text-[#597189]">Registration Name</span>
                  <strong className="break-words text-[#112f48]">{profile.username || "-"}</strong>
                </div>
                <div className="rounded-[10px] border border-[#dbe9f4] bg-white p-2.5">
                  <span className="mb-1 block text-[0.8rem] text-[#597189]">Balance</span>
                  <strong className="break-words text-[#112f48]">
                    {typeof profile.balance === "number" ? profile.balance.toLocaleString("en-PK") : profile.balance || "-"}
                  </strong>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2.5 max-[700px]:[&_.stmt-btn]:ml-0">
                <button
                  type="button"
                  className={`${btnBlueClass} max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.78rem]`}
                  onClick={() => setIsUpdateModalOpen(true)}
                >
                  Update Account
                </button>
                <button
                  type="button"
                  className={`${btnBlueClass} max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.78rem]`}
                  onClick={() => setIsPasswordModalOpen(true)}
                >
                  Change Password
                </button>
                <button
                  type="button"
                  className={`${btnLogoutClass} max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.78rem]`}
                  onClick={() => {
                    clearSession();
                    toast.success("You have been logged out");
                    navigate("/internet-banking");
                  }}
                >
                  Logout
                </button>

                <button
                  type="button"
                  className={`${btnLogoutClass} max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.78rem]`}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Delete My Account
                </button>

                <button
                  type="button"
                  className={`stmt-btn ${btnBlueClass} ml-auto max-[700px]:ml-0 max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.78rem]`}
                  onClick={openTransactionStatementModal}
                  disabled={isStatementLoading}
                >
                  {isStatementLoading ? "Loading Statement..." : "Transaction Statement"}
                </button>
              </div>

              <section className="my-6 rounded-xl border border-[#dbe9f4] bg-white p-4 max-[640px]:p-2.5">
                <div className="mb-3.5 flex items-center justify-between">
                  <h2 className="m-0 text-[1.1rem] font-bold text-[#172f44] max-[640px]:text-[0.95rem]">Recent Transactions</h2>
                  {recentTransactions.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="cursor-pointer rounded-md border-0 bg-[#1494da] px-3.5 py-1.5 text-[0.8rem] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0d7ab8] max-[640px]:px-2.5 max-[640px]:py-1 max-[640px]:text-[0.72rem]"
                            onClick={async () => {
                              try {
                                const response = await fetch(`http://localhost:3000/api/transactions/user/${userId}`);
                                const result = await response.json();
                                setAllTransactions(Array.isArray(result?.transactions) ? result.transactions : []);
                                setIsTransactionsModalOpen(true);
                              } catch {
                                toast.error("Unable to load transactions");
                              }
                            }}
                          >
                            View All
                          </button>

                        </>
                  )}
                </div>

                {recentTransactions.length > 0 ? (
                  <div className="flex flex-col gap-2 max-[640px]:gap-1.5">
                    {recentTransactions.map((transaction) => {
                      const isCredit =
                        transaction.type === "loan" ||
                        transaction.type === "transfer_received" ||
                        transaction.type === "initial";
                      const rowBg = isCredit ? "bg-[#e8f9f3] border-l-[#22c55e]" : "bg-[#fee8e8] border-l-[#ef4444]";
                      return (
                        <div
                          key={transaction._id}
                          className={`flex items-center justify-between rounded-[10px] border-l-4 border-[#dbe9f4] py-3 px-3 ${rowBg} max-[640px]:rounded-[8px] max-[640px]:px-2 max-[640px]:py-2`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="text-[0.9rem] font-semibold text-[#172f44] max-[640px]:text-[0.8rem]">{transaction.description}</span>
                            <span className="text-[0.75rem] text-[#607d96] max-[640px]:text-[0.66rem]">
                              {new Date(transaction.createdAt).toLocaleDateString("en-PK")}
                            </span>
                          </div>
                          <div
                            className={`text-[0.95rem] font-bold ${isCredit ? "text-[#22c55e]" : "text-[#ef4444]"} max-[640px]:text-[0.82rem]`}
                          >
                            {isCredit ? "+" : "-"}
                            PKR {transaction.amount.toLocaleString("en-PK")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="m-0 py-3 text-center text-[0.9rem] text-[#607d96]">No transactions yet</p>
                )}
              </section>

                {/* Transaction Statement modal */}
                {isStatementModalOpen && (
                  <div
                    className={`${accountModalBackdropClass} items-start`}
                    role="dialog"
                    aria-modal="true"
                  >
                    <div className={`${accountModalCardClass} my-6 w-[min(760px,100%)] max-[640px]:my-3 max-[640px]:p-3`}>
                      <div className="mb-3 flex items-center justify-between gap-2.5">
                        <h2 className="m-0 text-[1.25rem] text-[#172f44] max-[640px]:text-[1rem]">Transaction Statement</h2>
                        <button
                          type="button"
                          className="border-0 bg-transparent p-0 text-[1.15rem] text-[#1a2f45] transition-colors hover:text-[#ed7f00]"
                          onClick={() => setIsStatementModalOpen(false)}
                          aria-label="Close statement modal"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="my-1 mb-3.5 flex justify-center max-[640px]:mb-2" aria-hidden="true">
                        <img className="h-auto w-[min(220px,70%)]" src="/images/public-bank-logo-vector.svg" alt="" />
                      </div>

                      <div className="mb-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2 max-[700px]:grid-cols-1 max-[640px]:gap-2">
                        <label className="grid gap-1.5 text-[0.92rem] font-semibold text-[#4f667d] max-[640px]:text-[0.8rem]">
                          From
                          <input
                            className="w-full rounded-lg border border-[#c3d5e2] px-3 py-2 font-inherit text-[#112f48] focus:border-[#148ed3] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,142,211,0.12)] max-[640px]:px-2 max-[640px]:py-1.5 max-[640px]:text-[0.8rem]"
                            type="date"
                            value={statementFrom}
                            onChange={(e) => setStatementFrom(e.target.value)}
                          />
                        </label>
                        <label className="grid gap-1.5 text-[0.92rem] font-semibold text-[#4f667d] max-[640px]:text-[0.8rem]">
                          To
                          <input
                            className="w-full rounded-lg border border-[#c3d5e2] px-3 py-2 font-inherit text-[#112f48] focus:border-[#148ed3] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,142,211,0.12)] max-[640px]:px-2 max-[640px]:py-1.5 max-[640px]:text-[0.8rem]"
                            type="date"
                            value={statementTo}
                            onChange={(e) => setStatementTo(e.target.value)}
                          />
                        </label>
                      </div>

                      <div className="mb-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2 max-[700px]:grid-cols-1 max-[640px]:gap-2">
                        <label className="grid gap-1.5 text-[0.92rem] font-semibold text-[#4f667d] max-[640px]:text-[0.8rem]">
                          Transaction Type
                          <select
                            className="w-full rounded-lg border border-[#c3d5e2] px-3 py-2 font-inherit text-[#112f48] focus:border-[#148ed3] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,142,211,0.12)] max-[640px]:px-2 max-[640px]:py-1.5 max-[640px]:text-[0.8rem]"
                            value={statementType}
                            onChange={(e) => setStatementType(e.target.value)}
                          >
                            <option value="all">All Transactions</option>
                            <option value="credit">Credit</option>
                            <option value="debit">Debit</option>
                          </select>
                        </label>

                        <label className="grid gap-1.5 text-[0.92rem] font-semibold text-[#4f667d] max-[640px]:text-[0.8rem]">
                          Select Account
                          <select
                            className="w-full rounded-lg border border-[#c3d5e2] px-3 py-2 font-inherit text-[#112f48] max-[640px]:px-2 max-[640px]:py-1.5 max-[640px]:text-[0.8rem]"
                            value={profile?.accountNumber || ""}
                            disabled
                          >
                            <option value={profile?.accountNumber || ""}>{profile?.accountNumber || "N/A"}</option>
                          </select>
                        </label>
                      </div>

                      <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-[700px]:grid-cols-1 max-[640px]:gap-2">
                        <article className="rounded-[10px] border border-[#dbe9f4] bg-white px-3 py-2.5 max-[640px]:rounded-[8px] max-[640px]:px-2 max-[640px]:py-2">
                          <span className="mb-0.5 block text-[0.8rem] text-[#607d96] max-[640px]:text-[0.7rem]">Opening Balance</span>
                          <strong className="text-[1.5rem] font-extrabold text-[#112f48] max-[640px]:text-[1.1rem]">
                            {formatStatementAmount(statementOpeningBalance)}
                          </strong>
                        </article>
                        <article className="rounded-[10px] border border-[#dbe9f4] bg-white px-3 py-2.5 max-[640px]:rounded-[8px] max-[640px]:px-2 max-[640px]:py-2">
                          <span className="mb-0.5 block text-[0.8rem] text-[#607d96] max-[640px]:text-[0.7rem]">Closing Balance</span>
                          <strong className="text-[1.5rem] font-extrabold text-[#112f48] max-[640px]:text-[1.1rem]">
                            {formatStatementAmount(statementClosingBalance)}
                          </strong>
                        </article>
                      </div>

                      <div
                        className="flex max-h-[300px] flex-col gap-2.5 overflow-y-auto rounded-[10px] border border-[#dbe9f4] bg-[#f8fbfe] p-2.5 max-[640px]:gap-1.5 max-[640px]:rounded-[8px] max-[640px]:p-2"
                        role="region"
                        aria-label="Statement transaction list"
                      >
                        {statementTransactions.length > 0 ? (
                          statementTransactions
                            .slice()
                            .reverse()
                            .map((transaction) => (
                              <div
                                key={transaction._id}
                                className="flex items-center justify-between gap-3 rounded-[10px] border border-[#e2ecf5] bg-white px-3 py-2.5 max-[700px]:flex-col max-[700px]:items-start max-[640px]:rounded-[8px] max-[640px]:px-2 max-[640px]:py-2"
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[0.8rem] text-[#607d96] max-[640px]:text-[0.68rem]">
                                    {new Date(transaction.createdAt).toLocaleDateString("en-PK")}
                                  </span>
                                  <strong className="text-[0.98rem] text-[#102f49] max-[640px]:text-[0.84rem]">
                                    {transaction.description || "-"}
                                  </strong>
                                  <span className="text-[0.76rem] text-[#6f879d] max-[640px]:text-[0.66rem]">
                                    Ref: {transaction.referenceNumber || "N/A"}
                                  </span>
                                </div>
                                <div
                                  className={`whitespace-nowrap text-[1.2rem] font-extrabold ${transaction.isCredit ? "text-[#be123c]" : "text-[#138a4f]"} max-[640px]:text-[0.95rem]`}
                                >
                                  {transaction.isCredit ? "-" : "+"} {formatStatementAmount(transaction.amount)}
                                </div>
                              </div>
                            ))
                        ) : (
                          <p className="m-0 px-2 py-5 text-center text-[#607d96]">
                            No transactions available for selected filters.
                          </p>
                        )}
                      </div>

                      <div className="mt-[18px] flex justify-end gap-2.5 max-[640px]:mt-3 max-[640px]:gap-2">
                        <button
                          type="button"
                          className={`${btnOrangeClass} max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.75rem]`}
                          onClick={handleDownloadStatement}
                        >
                          Download Transaction Statement
                        </button>
                        <button
                          type="button"
                          className={`${btnCancelLightClass} max-[640px]:rounded-[12px] max-[640px]:px-2.5 max-[640px]:py-1.5 max-[640px]:text-[0.75rem]`}
                          onClick={() => setIsStatementModalOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              <section className="mt-[22px] border-t border-[#d8e7f2] pt-[18px]">
                <h2 className="mb-2.5 text-[1.2rem] text-[#17354d]">Active Cards</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 max-[900px]:grid-cols-2">
                  <div className="rounded-[10px] border border-[#dbe9f4] bg-white px-2.5 py-2">
                    <span className="mb-0.5 block text-[0.76rem] text-[#597189]">Total Cards</span>
                    <strong className="text-[#112f48]">{cards.length}</strong>
                  </div>
                  <div className="rounded-[10px] border border-[#dbe9f4] bg-white px-2.5 py-2">
                    <span className="mb-0.5 block text-[0.76rem] text-[#597189]">Debit Cards</span>
                    <strong className="text-[#112f48]">{debitCards}</strong>
                  </div>
                  <div className="rounded-[10px] border border-[#dbe9f4] bg-white px-2.5 py-2">
                    <span className="mb-0.5 block text-[0.76rem] text-[#597189]">Credit Cards</span>
                    <strong className="text-[#112f48]">{creditCards}</strong>
                  </div>
                  <div className="rounded-[10px] border border-[#dbe9f4] bg-white px-2.5 py-2">
                    <span className="mb-0.5 block text-[0.76rem] text-[#597189]">Approved</span>
                    <strong className="text-[#112f48]">{approvedCards}</strong>
                  </div>
                  <div className="rounded-[10px] border border-[#dbe9f4] bg-white px-2.5 py-2">
                    <span className="mb-0.5 block text-[0.76rem] text-[#597189]">Pending</span>
                    <strong className="text-[#112f48]">{pendingCards}</strong>
                  </div>
                </div>

                {cards.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {cards.map((card) => (
                      <article
                        key={card._id}
                        className="min-h-[255px] rounded-[10px] border border-[#dbe9f4] bg-white p-2.5"
                      >
                        <img
                          className="mb-2 block h-[110px] w-full rounded-lg object-cover"
                          src={getCardImage(card.cardCategory)}
                          alt={card.cardCategory || "Card banner"}
                        />
                        <p className="mb-2 font-bold text-[#17354d]">{card.cardCategory || "-"}</p>
                        <div className="grid grid-cols-1 gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-[#d7e7f3] bg-gradient-to-b from-[rgba(237,246,252,0.65)] to-[rgba(225,239,249,0.7)] px-2 py-1.5">
                              <span className="mb-0.5 block text-[0.74rem] text-[#597189]">Card Number</span>
                              <strong className="text-[0.88rem] text-[#112f48]">{card.cardNumber || "-"}</strong>
                            </div>
                            <div className="rounded-lg border border-[#d7e7f3] bg-gradient-to-b from-[rgba(237,246,252,0.65)] to-[rgba(225,239,249,0.7)] px-2 py-1.5">
                              <span className="mb-0.5 block text-[0.74rem] text-[#597189]">Issue Date</span>
                              <strong className="text-[0.88rem] text-[#112f48]">
                                {card.createdAt ? new Date(card.createdAt).toLocaleDateString("en-GB") : "-"}
                              </strong>
                            </div>
                          </div>
                          <div className="rounded-lg border border-[#d7e7f3] bg-gradient-to-b from-[rgba(237,246,252,0.65)] to-[rgba(225,239,249,0.7)] px-2 py-1.5">
                            <span className="mb-0.5 block text-[0.74rem] text-[#597189]">Status</span>
                            <strong className={getStatusBadgeClass(card.status)}>{card.status || "-"}</strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
              </>
          )}
        </section>
      </main>

      <SiteFooter />

      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-[rgba(10,24,39,0.28)] p-4" role="dialog" aria-modal="true">
          <div className="w-[min(520px,100%)] rounded-xl border border-[#efe7d4] bg-[#faf7ef] p-5 shadow-[0_8px_20px_rgba(11,25,38,0.14)]">
            <h2 className="m-0 mb-3.5 text-[1.25rem] text-[#172f44]">Update Account</h2>
            <div className="grid gap-3">
              <label className={formFieldClass}>
                Registration Name
                <input
                  className={modalInputClass}
                  name="username"
                  value={updateForm.username}
                  onChange={handleUpdateFieldChange}
                />
              </label>
              <label className={formFieldClass}>
                Email
                <input
                  className={modalInputClass}
                  type="email"
                  name="email"
                  value={updateForm.email}
                  onChange={handleUpdateFieldChange}
                />
              </label>
              <label className={formFieldClass}>
                CNIC
                <input className={modalInputClass} name="cnic" value={updateForm.cnic} onChange={handleUpdateFieldChange} />
              </label>
              <label className={formFieldClass}>
                Phone Number
                <input className={modalInputClass} name="phone" value={updateForm.phone} onChange={handleUpdateFieldChange} />
              </label>
              <label className={formFieldClass}>
                Address
                <input className={modalInputClass} name="address" value={updateForm.address} onChange={handleUpdateFieldChange} />
              </label>
            </div>
            <div className="mt-[18px] flex justify-end gap-2.5">
              <button type="button" className={btnOrangeClass} onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Update"}
              </button>
              <button type="button" className={btnCancelLightClass} onClick={() => setIsUpdateModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-[rgba(10,24,39,0.28)] p-4" role="dialog" aria-modal="true">
          <div className="w-[min(520px,100%)] rounded-xl border border-[#efe7d4] bg-[#faf7ef] p-5 shadow-[0_8px_20px_rgba(11,25,38,0.14)]">
            <h2 className="m-0 mb-3.5 text-[1.25rem] text-[#172f44]">Change Password</h2>
            <div className="grid gap-3">
              <label className={formFieldClass}>
                Old Password
                <div className={pwdWrap}>
                  <input
                    className={pwdInput}
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordFieldChange}
                  />
                  <button
                    type="button"
                    className={eyeBtn(showOldPassword)}
                    aria-label={showOldPassword ? "Hide old password" : "Show old password"}
                    title={showOldPassword ? "Hide old password" : "Show old password"}
                    aria-pressed={showOldPassword}
                    onClick={() => setShowOldPassword((prev) => !prev)}
                  >
                    👁
                  </button>
                </div>
              </label>
              <label className={formFieldClass}>
                New Password
                <div className={pwdWrap}>
                  <input
                    className={pwdInput}
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFieldChange}
                  />
                  <button
                    type="button"
                    className={eyeBtn(showNewPassword)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    title={showNewPassword ? "Hide new password" : "Show new password"}
                    aria-pressed={showNewPassword}
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    👁
                  </button>
                </div>
              </label>
            </div>
            <div className="mt-[18px] flex justify-end gap-2.5">
              <button type="button" className={btnOrangeClass} onClick={handlePasswordUpdate} disabled={isPasswordSaving}>
                {isPasswordSaving ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                className={btnCancelLightClass}
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setShowOldPassword(false);
                  setShowNewPassword(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isTransactionsModalOpen && (
        <div className={accountModalBackdropClass} role="dialog" aria-modal="true">
          <div className={`${accountModalCardClass} flex max-h-[80vh] max-w-[600px] flex-col`}>
            <div className="mb-3.5 flex items-center justify-between border-b border-[#dbe9f4] pb-3.5">
              <h3 className="m-0 text-[1.4rem] font-extrabold text-[#113753]">Transaction History</h3>
              <button
                type="button"
                className="border-0 bg-transparent p-0 text-[1.15rem] text-[#1a2f45] transition-colors hover:text-[#ed7f00]"
                onClick={() => setIsTransactionsModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {allTransactions.length > 0 ? (
                <div className="flex flex-col gap-2.5 max-[640px]:gap-1.5">
                  {allTransactions.map((transaction) => {
                    const isCredit =
                      transaction.type === "loan" ||
                      transaction.type === "transfer_received" ||
                      transaction.type === "initial";
                    const rowBg = isCredit ? "bg-[#e8f9f3] border-l-[#22c55e]" : "bg-[#fee8e8] border-l-[#ef4444]";
                    return (
                      <div
                        key={transaction._id}
                        className={`flex items-center justify-between gap-3 rounded-[10px] border border-[#e8eef5] border-l-4 py-3 px-3 ${rowBg} max-[700px]:flex-col max-[700px]:items-start max-[640px]:rounded-[8px] max-[640px]:px-2 max-[640px]:py-2`}
                      >
                        <div className="flex flex-1 items-center justify-between gap-3 max-[700px]:w-full max-[700px]:flex-col max-[700px]:items-start">
                          <div className="flex flex-col gap-1">
                            <span className="text-[0.95rem] font-semibold text-[#172f44] max-[640px]:text-[0.84rem]">{transaction.description}</span>
                            <span className="text-[0.75rem] text-[#607d96] max-[640px]:text-[0.68rem]">
                              Ref: {transaction.referenceNumber || "N/A"}
                            </span>
                          </div>
                          <span className="whitespace-nowrap text-[0.8rem] text-[#607d96] max-[700px]:self-end max-[640px]:text-[0.7rem]">
                            {new Date(transaction.createdAt).toLocaleDateString("en-PK")}
                          </span>
                        </div>
                        <div
                          className={`whitespace-nowrap text-base font-bold ${isCredit ? "text-[#22c55e]" : "text-[#ef4444]"} max-[640px]:text-[0.9rem]`}
                        >
                          {isCredit ? "+" : "-"}
                          PKR {transaction.amount.toLocaleString("en-PK")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="m-0 px-3 py-6 text-center text-[0.95rem] text-[#607d96]">No transactions found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[1100] grid place-items-center bg-[rgba(10,24,39,0.28)] p-4" role="dialog" aria-modal="true">
          <div className="w-[min(480px,100%)] rounded-xl border border-[#efe7d4] bg-[#faf7ef] p-5 shadow-[0_8px_20px_rgba(11,25,38,0.14)]">
            <p className="mb-4 text-left text-[1.05rem] font-bold text-[#233a4f]">Are you sure to delete your account?</p>
            <div className="flex justify-end gap-2.5">
              <button type="button" className={btnLogoutClass} onClick={handleDeleteAccount}>
                Yes
              </button>
              <button type="button" className={btnCancelLightClass} onClick={() => setIsDeleteModalOpen(false)}>
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
