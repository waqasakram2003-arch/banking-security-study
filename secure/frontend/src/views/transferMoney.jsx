import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { btnBlueSmClass, btnCancelLightClass, btnLogoutClass, pageWrapClass, userAvatarImgClass, userAvatarLinkClass } from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession, setInternetBankingSession } from "../components/session.js";

const transferChannels = [
  {
    id: "hbl",
    channelType: "bank",
    title: "Habib Bank Limited",
    shortCode: "01",
    hint: "Transfer to HBL account",
    badge: "HBL",
    logo: "/images/transfer-banks/Habib-Bank-Limited.jpg"
  },
  {
    id: "alb",
    channelType: "bank",
    title: "Allied Bank Limited",
    shortCode: "02",
    hint: "Transfer to Allied Bank account",
    badge: "ABL",
    logo: "/images/transfer-banks/allied-bank.png"
  },
  {
    id: "ubl",
    channelType: "bank",
    title: "United Bank Limited",
    shortCode: "03",
    hint: "Transfer to UBL account",
    badge: "UBL",
    logo: "/images/transfer-banks/ubl.png"
  },
  {
    id: "mcb",
    channelType: "bank",
    title: "MCB Bank Limited",
    shortCode: "04",
    hint: "Transfer to MCB account",
    badge: "MCB",
    logo: "/images/transfer-banks/mcbpng.png"
  },
  {
    id: "nbp",
    channelType: "bank",
    title: "National Bank of Pakistan",
    shortCode: "05",
    hint: "Transfer to NBP account",
    badge: "NBP",
    logo: "/images/transfer-banks/NPB.jpg"
  },
  {
    id: "baf",
    channelType: "bank",
    title: "Bank Alfalah Limited",
    shortCode: "06",
    hint: "Transfer to Bank Alfalah account",
    badge: "BAF",
    logo: "/images/transfer-banks/bank-alfalah.jpg"
  },
  {
    id: "ask",
    channelType: "bank",
    title: "Askari Bank Limited",
    shortCode: "07",
    hint: "Transfer to Askari Bank account",
    badge: "AKB",
    logo: "/images/transfer-banks/askari.png"
  },
  {
    id: "ubl-ub",
    channelType: "bank",
    title: "United Bank (UB)",
    shortCode: "08",
    hint: "Transfer to UB account",
    badge: "UB",
    logo: "/images/transfer-banks/ubl.png"
  },
  {
    id: "fbl",
    channelType: "bank",
    title: "Faysal Bank Limited",
    shortCode: "09",
    hint: "Transfer to Faysal Bank account",
    badge: "FBL",
    logo: "/images/transfer-banks/faisal-bank.png"
  },
  {
    id: "dib",
    channelType: "bank",
    title: "Dubai Islamic Bank",
    shortCode: "10",
    hint: "Transfer to DIB account",
    badge: "DIB",
    logo: "/images/transfer-banks/Dubai-islamic.png"
  },
  {
    id: "mzn",
    channelType: "bank",
    title: "Meezan Bank Limited",
    shortCode: "11",
    hint: "Transfer to Meezan Bank account",
    badge: "MZN",
    logo: "/images/transfer-banks/meezan.png"
  },
  {
    id: "easypaisa",
    channelType: "easypaisa",
    title: "Easypaisa",
    shortCode: "12",
    hint: "Wallet transfer using Easypaisa account",
    badge: "EP",
    logo: "/images/transfer-banks/easypaisa.png"
  },
  {
    id: "jazzcash",
    channelType: "jazzcash",
    title: "JazzCash",
    shortCode: "15",
    hint: "Wallet transfer using JazzCash account",
    badge: "JC",
    logo: "/images/transfer-banks/jazz-cash.png"
  }
];

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function maskAccountNumber(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "******";
  }

  if (normalized.length <= 4) {
    return normalized;
  }

  return `******${normalized.slice(-4)}`;
}

function formatReceiptDateTime(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("en-GB"),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
  };
}

function wrapCanvasText(context, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [String(text || "")];
}

function TransferMoney() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    return getInternetBankingSession();
  });
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [recipientDetails, setRecipientDetails] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastTransfer, setLastTransfer] = useState(null);
  const [transactionPin, setTransactionPin] = useState("");
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [showTransactionPin, setShowTransactionPin] = useState(false);

  const inputClass =
    "rounded-lg border border-[#b7cde0] px-3 py-2.5 font-inherit focus:border-[#0d5f9b] focus:outline-none focus:ring-[3px] focus:ring-[rgba(13,95,155,0.15)]";
  const pwdWrapClass = "relative flex items-center";
  const pwdInputClass = `${inputClass} w-full pr-11`;
  const eyeBtnClass = (on) =>
    `absolute right-2.5 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-base leading-none ${
      on ? "text-[#0d5f9b] opacity-100" : "text-[#4f6a82] opacity-40 hover:opacity-70"
    }`;

  const userId = session?.user?._id;

  const selectedChannel = useMemo(
    () => transferChannels.find((channel) => channel.id === selectedChannelId) || null,
    [selectedChannelId]
  );

  const lookupRecipient = useCallback(async (accountNumber) => {
    const normalizedAccountNumber = String(accountNumber || "").trim();

    if (!selectedChannel || !userId || normalizedAccountNumber.length < 3) {
      setRecipientDetails(null);
      setLookupError("");
      return;
    }

    setIsLookingUp(true);
    setLookupError("");

    try {
      const response = await fetch("http://localhost:3000/api/transfers/lookup-recipient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderUserId: userId,
          recipientAccountNumber: normalizedAccountNumber
        })
      });

      const result = await response.json();
      if (!response.ok) {
        setRecipientDetails(null);
        setLookupError(result?.message || "Recipient not found");
        return;
      }

      setRecipientDetails(result?.recipient || null);
      setLookupError("");
    } catch {
      setRecipientDetails(null);
      setLookupError("Unable to verify recipient right now");
    } finally {
      setIsLookingUp(false);
    }
  }, [selectedChannel, userId]);

  useEffect(() => {
    function syncSession() {
      setSession(getInternetBankingSession());
    }

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  useEffect(() => {
    if (!selectedChannel || !recipientAccountNumber.trim() || !userId) {
      return undefined;
    }

    const handle = window.setTimeout(() => {
      lookupRecipient(recipientAccountNumber);
    }, 400);

    return () => window.clearTimeout(handle);
  }, [selectedChannel, recipientAccountNumber, userId, lookupRecipient]);

  function clearSessionBeforeNavigate() {
    clearInternetBankingSession();
    setSession(null);
  }

  function handleLogout() {
    clearSessionBeforeNavigate();
  }

  function handleSelectChannel(channelId) {
    setSelectedChannelId(channelId);
    setRecipientAccountNumber("");
    setRecipientDetails(null);
    setLookupError("");
    setAmount("");
    setRemarks("");
  }

  function handleBackToChannels() {
    setSelectedChannelId(null);
    setRecipientAccountNumber("");
    setRecipientDetails(null);
    setLookupError("");
    setAmount("");
    setRemarks("");
  }

  function handleProceed() {
    const normalizedAmount = Number(amount);

    if (!selectedChannel) {
      toast.error("Please choose a transfer type");
      return;
    }

    if (!recipientDetails) {
      toast.error("Please provide a valid recipient account number");
      return;
    }

    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }

    setIsConfirmModalOpen(true);
  }

  async function handleSendTransfer() {
    if (!selectedChannel || !recipientDetails || !userId) {
      return;
    }

    if (!transactionPin) {
      toast.error("Please enter your Transaction PIN");
      return;
    }

    if (transactionPin.length !== 4 || !/^\d+$/.test(transactionPin)) {
      toast.error("Transaction PIN must be exactly 4 digits");
      return;
    }

    setIsVerifyingPin(true);
    try {
      const verifyResponse = await fetch("http://localhost:3000/api/transfers/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderUserId: userId,
          transactionPin
        })
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyResult?.message || "Invalid Transaction PIN");
      }

      // PIN is verified, now proceed with transfer
      const response = await fetch("http://localhost:3000/api/transfers/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderUserId: userId,
          recipientAccountNumber: String(recipientAccountNumber).trim(),
          transferChannel: selectedChannel.channelType,
          amount: Number(amount),
          note: remarks
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Transfer failed");
      }

      const nextSession = {
        ...session,
        balance: Number(result?.transfer?.remainingBalance || session?.balance || 0),
        user: {
          ...session?.user,
          account: {
            ...session?.user?.account,
            balance: Number(result?.transfer?.remainingBalance || session?.user?.account?.balance || 0)
          }
        }
      };

      setInternetBankingSession(nextSession);
      setSession(nextSession);

      setLastTransfer({
        amount: Number(result?.transfer?.amount || amount || 0),
        recipientName: result?.transfer?.recipientName || recipientDetails?.fullName || "-",
        recipientAccountNumber: result?.transfer?.recipientAccountNumber || recipientAccountNumber,
        remarks,
        transferTypeLabel: selectedChannel.title,
        createdAt: new Date().toISOString(),
        senderName: session?.user?.application?.fullName || session?.username || "-",
        senderAccountNumber: session?.user?.account?.accountNumber || ""
      });

      setIsConfirmModalOpen(false);
      setTransactionPin("");
      setShowTransactionPin(false);
      setIsSuccessModalOpen(true);
      toast.success("Transfer completed successfully");
    } catch (error) {
      toast.error(error.message || "Transaction failed");
    } finally {
      setIsVerifyingPin(false);
    }
  }

  async function handleSaveReceipt() {
    if (!lastTransfer) {
      return;
    }

    const { date, time } = formatReceiptDateTime(lastTransfer.createdAt);
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1250;
    const context = canvas.getContext("2d");

    if (!context) {
      toast.error("Unable to create receipt image");
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = "#e4ebf2";
    context.lineWidth = 2;
    context.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

    context.fillStyle = "#d62f2f";
    context.font = "bold 44px Arial";
    context.textAlign = "center";
    context.fillText("PUBLIC BANK", canvas.width / 2, 86);

    context.fillStyle = "#12273c";
    context.font = "bold 40px Arial";
    context.fillText("Transaction Successful", canvas.width / 2, 155);

    context.fillStyle = "#ff7a2f";
    context.font = "bold 54px Arial";
    context.fillText(`PKR ${formatCurrency(lastTransfer.amount)}`, canvas.width / 2, 230);

    const amountLineY = 280;
    context.strokeStyle = "#dce7ef";
    context.beginPath();
    context.moveTo(80, amountLineY);
    context.lineTo(canvas.width - 80, amountLineY);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#58728a";
    context.font = "24px Arial";

    const leftX = 85;
    const valueX = 330;
    let currentY = 350;
    const rowGap = 74;
    const rows = [
      ["Transferred To:", lastTransfer.recipientName],
      ["From Account:", lastTransfer.senderName],
      ["Transfer Via:", lastTransfer.transferTypeLabel],
      ["Date:", date],
      ["Time:", time],
      ["Remarks:", lastTransfer.remarks || "-"]
    ];

    for (const [label, value] of rows) {
      context.fillStyle = "#58728a";
      context.font = "24px Arial";
      context.fillText(label, leftX, currentY);

      context.fillStyle = "#12273c";
      context.font = "bold 24px Arial";
      const lines = wrapCanvasText(context, value, 460);
      lines.forEach((line, index) => {
        context.fillText(line, valueX, currentY + index * 30);
      });

      currentY += rowGap + (lines.length - 1) * 24;
    }

    const imageUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = imageUrl;
    anchor.download = `public-bank-receipt-${Date.now()}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  if (!userId) {
    return <Navigate to="/internet-banking" replace />;
  }

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        onInternetBankingClick={clearSessionBeforeNavigate}
        session={session}
        onLogoutClick={handleLogout}
        clearSessionBeforeNavigate={clearSessionBeforeNavigate}
        actions={
          <>
            <Link className={btnBlueSmClass} to="/transfer-money">
              Transfer Money
            </Link>
            <Link className={userAvatarLinkClass} to="/account" aria-label="Open account profile">
              {(session?.user?.application?.profileImage || session?.user?.profileImage || session?.profileImage) ? (
                <img
                  className={userAvatarImgClass}
                  src={session?.user?.application?.profileImage || session?.user?.profileImage || session?.profileImage}
                  alt={`${session?.username || "User"} profile`}
                />
              ) : null}
            </Link>
            <button type="button" className={btnLogoutClass} onClick={handleLogout}>
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto mb-[50px] mt-[34px] w-[min(1220px,92%)] max-[720px]:mt-3.5 max-[720px]:w-[95%]">
        <section className="rounded-2xl border border-[#d7e3ee] bg-white p-5 max-[720px]:p-3.5">
          <h1 className="mb-4 text-[clamp(1.55rem,2.6vw,2.1rem)] font-bold text-[#123351] max-[720px]:text-[1.9rem]">
            Transfer Money
          </h1>

          {!selectedChannel ? (
            <div
              className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 max-[720px]:grid-cols-1"
              role="list"
              aria-label="Transfer channels"
            >
              {transferChannels.map((channel) => (
                <button
                  type="button"
                  key={channel.id}
                  className="flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-[#d6e2ed] bg-white p-3 text-left hover:border-[#8fb0ce] hover:shadow-[0_10px_24px_rgba(20,43,62,0.12)]"
                  onClick={() => handleSelectChannel(channel.id)}
                >
                  <img
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                    src={channel.logo}
                    alt={channel.title}
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <div>
                    <h3 className="m-0 text-[0.98rem] font-medium text-[#173a59]">{channel.title}</h3>
                    <p className="mt-0.5 text-[0.78rem] text-[#1f486d]">Code: {channel.shortCode}</p>
                    <p className="mt-0.5 text-[0.78rem] text-[#4c6782]">{channel.hint}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid gap-3.5">
              <div className="flex items-center justify-between gap-2.5 rounded-xl border border-[#d7e3ee] bg-white p-2.5">
                <p className="m-0">
                  <span className="mr-2.5 text-[0.82rem] text-[#54708a]">Selected Type</span>
                  <strong className="text-[0.96rem] text-[#102f4b]">
                    {selectedChannel.title} ({selectedChannel.shortCode})
                  </strong>
                </p>
                <button
                  type="button"
                  className="cursor-pointer rounded-[11px] border border-[#e4dcc9] bg-[#f0ebdc] px-3 py-1.5 text-[0.86rem] font-bold text-[#35506a]"
                  onClick={handleBackToChannels}
                >
                  Change
                </button>
              </div>

              <label className="flex flex-col gap-2 text-[0.9rem] font-semibold text-[#204161]" htmlFor="recipientAccountNumber">
                Recipient Account Number
                <input
                  className="w-full rounded-[10px] border border-[#b7cadb] bg-white px-3 py-2.5 text-[0.95rem] font-semibold text-[#0e2f4a] focus:border-[#2f7cb4] focus:outline-none focus:ring-[3px] focus:ring-[rgba(47,124,180,0.16)]"
                  id="recipientAccountNumber"
                  type="text"
                  value={recipientAccountNumber}
                  onChange={(event) => {
                    setRecipientAccountNumber(event.target.value);
                    setRecipientDetails(null);
                    setLookupError("");
                  }}
                  placeholder="Enter recipient account number"
                />
              </label>

              {isLookingUp ? <p className="m-0 text-[#35506a]">Looking up recipient...</p> : null}

              {recipientDetails ? (
                <div className="rounded-xl border border-[#cfe7d9] bg-[#f4fbf7] p-3">
                  <p className="m-0 text-[0.82rem] text-[#2f6e47]">Recipient Found</p>
                  <h4 className="my-1 text-[1.1rem] text-[#0f5533]">{recipientDetails.fullName}</h4>
                  <span className="text-[0.86rem] text-[#266443]">Account: {recipientDetails.accountNumber}</span>
                </div>
              ) : null}

              {!recipientDetails && lookupError ? (
                <p className="m-0 font-semibold text-[#ad2b2b]">{lookupError}</p>
              ) : null}

              <label className="flex flex-col gap-2 text-[0.9rem] font-semibold text-[#204161]" htmlFor="transferAmount">
                Amount
                <input
                  className="w-full rounded-[10px] border border-[#b7cadb] bg-white px-3 py-2.5 text-[0.95rem] font-semibold text-[#0e2f4a] focus:border-[#2f7cb4] focus:outline-none focus:ring-[3px] focus:ring-[rgba(47,124,180,0.16)]"
                  id="transferAmount"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                />
              </label>

              <label className="flex flex-col gap-2 text-[0.9rem] font-semibold text-[#204161]" htmlFor="transferRemarks">
                Remarks
                <input
                  className="w-full rounded-[10px] border border-[#b7cadb] bg-white px-3 py-2.5 text-[0.95rem] font-semibold text-[#0e2f4a] focus:border-[#2f7cb4] focus:outline-none focus:ring-[3px] focus:ring-[rgba(47,124,180,0.16)]"
                  id="transferRemarks"
                  type="text"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Remarks"
                />
              </label>

              <button
                type="button"
                className="w-fit cursor-pointer rounded-xl border-0 bg-[#ed8700] px-4 py-2 text-[0.92rem] font-bold text-white hover:bg-[#d67800] disabled:cursor-not-allowed disabled:opacity-75"
                onClick={handleProceed}
              >
                Proceed
              </button>
            </div>
          )}
        </section>
      </main>

      {isConfirmModalOpen && selectedChannel && recipientDetails ? (
        <div
          className="fixed inset-0 z-[1300] grid place-items-center bg-[rgba(8,19,31,0.48)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm transfer"
        >
          <div className="max-h-[92vh] w-[min(560px,100%)] overflow-y-auto rounded-[14px] border border-[#dae5ef] bg-[#fbfbfb] px-4 py-6 shadow-[0_18px_38px_rgba(11,27,41,0.22)]">
            <img className="mx-auto block w-[140px]" src="/images/public-bank-logo-vector.svg" alt="Public Bank" />
            <h3 className="my-3 mb-[18px] text-center text-[1.45rem] text-[#0e2d49]">Send Money</h3>

            <div className="border-b border-t border-[#e0e9f1] px-1 py-3.5">
              <p className="m-0 flex justify-between gap-3 border-b border-[#e3e9f0] py-2.5 text-sm last:border-b-0">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Transfer Type:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">{selectedChannel.title}</strong>
              </p>
              <p className="m-0 flex justify-between gap-3 border-b border-[#e3e9f0] py-2.5 text-sm last:border-b-0">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Recipient Account Title:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">{recipientDetails.fullName}</strong>
              </p>
              <p className="m-0 flex justify-between gap-3 py-2.5 text-sm">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Recipient Account Number:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">{recipientDetails.accountNumber}</strong>
              </p>
            </div>

            <div className="my-3.5 flex justify-between gap-2 rounded-lg border-l-4 border-[#ff7440] bg-[#fff7ef] px-3.5 py-3.5">
              <span className="text-[0.88rem] font-bold text-[#4f6d87]">Amount to Send:</span>
              <strong className="text-[1.15rem] text-[#ff6630]">PKR {formatCurrency(amount)}</strong>
            </div>

            <p className="m-0 flex justify-between gap-3 px-1">
              <span className="text-[0.84rem] font-semibold text-[#577089]">Remarks:</span>
              <strong className="text-right text-[0.88rem] text-[#102f4b]">{remarks || "-"}</strong>
            </p>

            <div className="my-4 rounded-lg border border-[#cbdef0] bg-[#edf6ff] px-3.5 py-3.5">
              <label className="flex flex-col gap-2 text-[0.95rem] font-semibold text-[#1a4365]">
                Transaction PIN
                <div className="relative">
                  <input
                    type={showTransactionPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength="4"
                    pattern="[0-9]{4}"
                    placeholder="••••"
                    value={transactionPin}
                    onChange={(event) => {
                      const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                      setTransactionPin(value);
                    }}
                    onKeyPress={(event) => {
                      if (event.key === "Enter" && transactionPin.length === 4 && !isVerifyingPin) {
                        handleSendTransfer();
                      }
                    }}
                    className="w-full rounded-md border border-[#a8c5d8] bg-white px-3 py-2.5 text-center text-[1.5rem] font-bold tracking-widest text-[#0e2d49] outline-none focus:border-[#0d5f9b]"
                    disabled={isVerifyingPin}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowTransactionPin(!showTransactionPin)}
                    className={eyeBtnClass(showTransactionPin)}
                    aria-label={showTransactionPin ? "Hide PIN" : "Show PIN"}
                    title={showTransactionPin ? "Hide PIN" : "Show PIN"}
                    aria-pressed={showTransactionPin}
                    disabled={isVerifyingPin}
                  >
                    👁
                  </button>
                </div>
                <span className="text-[0.75rem] text-[#184467]">Enter your 4-digit PIN to confirm</span>
              </label>
            </div>

            <div className="mt-[18px] flex gap-3 border-t border-[#d8e4ee] pt-4 max-[720px]:flex-col">
              <button type="button" className={`${btnCancelLightClass} flex-1`} onClick={() => {
                setIsConfirmModalOpen(false);
                setTransactionPin("");
                setShowTransactionPin(false);
              }}>
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-xl border-0 bg-[#ed8700] px-4 py-2 text-[0.92rem] font-bold text-white hover:bg-[#d67800] disabled:cursor-not-allowed disabled:opacity-75"
                onClick={handleSendTransfer}
                disabled={transactionPin.length !== 4 || isVerifyingPin}
              >
                {isVerifyingPin ? "Processing..." : "Send Money"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isSuccessModalOpen && lastTransfer ? (
        <div
          className="fixed inset-0 z-[1300] grid place-items-center bg-[rgba(8,19,31,0.48)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Transfer success"
        >
          <div className="max-h-[92vh] w-[min(560px,100%)] overflow-y-auto rounded-[14px] border border-[#dae5ef] bg-[#fbfbfb] px-4 py-6 text-center shadow-[0_18px_38px_rgba(11,27,41,0.22)]">
            <img className="mx-auto block w-[140px]" src="/images/public-bank-logo-vector.svg" alt="Public Bank" />

            <h3 className="my-3 text-[1.45rem] text-[#0e2d49]">Transaction Successful</h3>
            <p className="m-0 text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-[#ff6630]">
              PKR {formatCurrency(lastTransfer.amount)}
            </p>
            <p className="mx-auto my-2 mb-2 grid h-[52px] w-[52px] place-items-center rounded-full border-2 border-[#2aad67] text-[1.6rem] leading-[48px] text-[#2aad67]">
              ✓
            </p>

            <div className="mx-auto mb-3 grid justify-center gap-2">
              <p className="m-0 grid gap-0.5">
                <span className="text-[0.78rem] text-[#6a8095]">Transferred To:</span>
                <strong className="text-[0.9rem] text-[#142d44]">{lastTransfer.recipientName}</strong>
                <small className="text-[0.8rem] text-[#6e88a1]">{maskAccountNumber(lastTransfer.recipientAccountNumber)}</small>
              </p>
              <p className="m-0 grid gap-0.5">
                <span className="text-[0.78rem] text-[#6a8095]">From Account:</span>
                <strong className="text-[0.9rem] text-[#142d44]">{lastTransfer.senderName}</strong>
                <small className="text-[0.8rem] text-[#6e88a1]">{maskAccountNumber(lastTransfer.senderAccountNumber)}</small>
              </p>
            </div>

            <div className="border-b border-t border-[#e0e9f1] text-left">
              <p className="m-0 flex justify-between gap-3 border-b border-[#e3e9f0] py-2.5">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Transfer Via:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">{lastTransfer.transferTypeLabel}</strong>
              </p>
              <p className="m-0 flex justify-between gap-3 border-b border-[#e3e9f0] py-2.5">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Date:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">
                  {new Date(lastTransfer.createdAt).toLocaleDateString("en-GB")}
                </strong>
              </p>
              <p className="m-0 flex justify-between gap-3 border-b border-[#e3e9f0] py-2.5">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Time:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">
                  {new Date(lastTransfer.createdAt).toLocaleTimeString("en-GB")}
                </strong>
              </p>
              <p className="m-0 flex justify-between gap-3 py-2.5">
                <span className="text-[0.84rem] font-semibold text-[#577089]">Remarks:</span>
                <strong className="text-right text-[0.88rem] text-[#102f4b]">{lastTransfer.remarks || "-"}</strong>
              </p>
            </div>

            <div className="mt-[18px] flex gap-3 border-t border-[#d8e4ee] pt-4 max-[720px]:flex-col">
              <button type="button" className={`${btnCancelLightClass} flex-1`} onClick={() => navigate("/account")}>
                Close
              </button>
              <button
                type="button"
                className="flex-1 cursor-pointer rounded-xl border-0 bg-[#ed8700] px-4 py-2 text-[0.92rem] font-bold text-white hover:bg-[#d67800]"
                onClick={handleSaveReceipt}
              >
                Save Receipt
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SiteFooter />
    </div>
  );
}

export default TransferMoney;
