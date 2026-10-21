import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate } from "react-router-dom";
import html2canvas from "html2canvas";
import SiteFooter from "../components/SiteFooter.jsx";

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

function TransferMoneyPage() {
  const [step, setStep] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [lookupStatus, setLookupStatus] = useState("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showSuccessReceiptModal, setShowSuccessReceiptModal] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null);
  const lookupRequestIdRef = useRef(0);

  const session = useMemo(() => {
    try {
      const raw = localStorage.getItem("internetBankingSession");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const userId = session?.user?._id;

  if (!userId) {
    return <Navigate to="/internet-banking" replace />;
  }

  function handleChannelSelect(channel) {
    setSelectedChannel(channel);
    setStep(2);
    setRecipient(null);
    setLookupStatus("idle");
    setLookupMessage("");
  }

  function handleAccountInputChange(event) {
    setRecipientAccountNumber(event.target.value);
    setRecipient(null);
    setLookupStatus("idle");
    setLookupMessage("");
    setAmount("");
    setNote("");
  }

  async function verifyRecipientAccount(accountNumber) {
    const normalizedAccountNumber = String(accountNumber || "").trim();
    if (!normalizedAccountNumber) {
      return { ok: false };
    }

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
      return {
        ok: false,
        message: result?.message || "Unable to verify recipient account"
      };
    }

    const nextRecipient = result.recipient;
    return {
      ok: true,
      recipient: nextRecipient
    };
  }

  useEffect(() => {
    if (step !== 2) {
      return undefined;
    }

    const normalizedAccountNumber = recipientAccountNumber.trim();
    if (!normalizedAccountNumber) {
      setRecipient(null);
      setLookupStatus("idle");
      setLookupMessage("");
      return undefined;
    }

    setIsVerifying(true);
    setLookupStatus("checking");
    setLookupMessage("Checking account number...");

    const currentLookupRequestId = lookupRequestIdRef.current + 1;
    lookupRequestIdRef.current = currentLookupRequestId;

    const timerId = setTimeout(async () => {
      const verification = await verifyRecipientAccount(normalizedAccountNumber);

      if (lookupRequestIdRef.current !== currentLookupRequestId) {
        return;
      }

      if (verification.ok) {
        setRecipient(verification.recipient);
        setLookupStatus("found");
        setLookupMessage("Recipient account verified");
      } else {
        setRecipient(null);
        setLookupStatus("not-found");
        setLookupMessage(verification.message || "Account Number not Found");
      }

      setIsVerifying(false);
    }, 450);

    return () => {
      clearTimeout(timerId);
      setIsVerifying(false);
    };
  }, [recipientAccountNumber, step, userId]);

  useEffect(() => {
    if (!showReceiptModal && !showSuccessReceiptModal) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showReceiptModal, showSuccessReceiptModal]);

  function formatMoney(value) {
    return `PKR ${Number(value || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function formatReceiptDateTime(date) {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  }

  function downloadReceiptCanvas(canvas) {
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Generated canvas is empty");
    }

    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    link.href = canvas.toDataURL("image/png");
    link.download = `receipt-${timestamp}.png`;
    link.click();
  }

  function generateFallbackReceiptCanvas() {
    const fallbackCanvas = document.createElement("canvas");
    const width = 900;
    const height = 1320;
    fallbackCanvas.width = width;
    fallbackCanvas.height = height;

    const context = fallbackCanvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create canvas context");
    }

    const receiptData = successReceipt || {};
    const sentAmount = Number(receiptData.amountSent || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#c8242b";
    context.font = "bold 44px Arial";
    context.textAlign = "center";
    context.fillText("PUBLIC BANK", width / 2, 90);

    context.fillStyle = "#0f2233";
    context.font = "bold 56px Arial";
    context.fillText("Transaction Successful", width / 2, 190);

    context.fillStyle = "#ff6b35";
    context.font = "bold 74px Arial";
    context.fillText(`PKR ${sentAmount}`, width / 2, 300);

    context.strokeStyle = "#d9e7f3";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(80, 355);
    context.lineTo(width - 80, 355);
    context.stroke();

    context.textAlign = "left";
    context.fillStyle = "#5a6c7d";
    context.font = "30px Arial";
    context.fillText("Transferred To:", 90, 440);
    context.fillText("From Account:", 90, 585);
    context.fillText("Transfer Via:", 90, 730);
    context.fillText("Date:", 90, 805);
    context.fillText("Time:", 90, 880);

    context.fillStyle = "#0f2233";
    context.font = "bold 34px Arial";
    context.fillText(receiptData.recipientName || "-", 360, 440);
    context.fillText(receiptData.senderName || "-", 360, 585);
    context.fillText(receiptData.transferType || "-", 360, 730);

    const dateObject = new Date(receiptData.createdAt || Date.now());
    context.font = "bold 30px Arial";
    context.fillText(dateObject.toLocaleDateString("en-PK"), 360, 805);
    context.fillText(
      dateObject.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      360,
      880
    );

    context.font = "28px Arial";
    context.fillStyle = "#4c6177";
    context.fillText(receiptData.recipientAccountNumber || "-", 360, 495);
    context.fillText(receiptData.senderAccountNumber || "-", 360, 640);

    if (receiptData.note) {
      context.fillStyle = "#5a6c7d";
      context.font = "30px Arial";
      context.fillText("Remarks:", 90, 955);
      context.fillStyle = "#0f2233";
      context.font = "bold 28px Arial";
      context.fillText(receiptData.note, 360, 955);
    }

    return fallbackCanvas;
  }

  function handleSaveReceiptPlaceholder() {
    const receiptElement = document.getElementById("success-receipt-content");
    if (!receiptElement) {
      toast.error("Receipt element not found");
      return;
    }

    toast.loading("Generating receipt image...");
    
    // Wait for all images to load before capturing
    const images = receiptElement.querySelectorAll("img");
    const imagePromises = Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve;
          }
        })
    );

    Promise.all(imagePromises)
      .then(() => {
        // Add small delay to ensure rendering is complete
        return new Promise((resolve) => setTimeout(resolve, 500));
      })
      .then(() => {
        return html2canvas(receiptElement, {
          backgroundColor: "#ffffff",
          scale: Math.min(window.devicePixelRatio || 1, 2),
          logging: false,
          useCORS: true,
          allowTaint: false,
          imageTimeout: 0
        });
      })
      .then((canvas) => {
        downloadReceiptCanvas(canvas);
        toast.dismiss();
        toast.success("Receipt downloaded successfully");
      })
      .catch((error) => {
        console.error("html2canvas failed, using fallback receipt canvas", error);
        try {
          const fallbackCanvas = generateFallbackReceiptCanvas();
          downloadReceiptCanvas(fallbackCanvas);
          toast.dismiss();
          toast.success("Receipt downloaded successfully");
        } catch (fallbackError) {
          toast.dismiss();
          toast.error("Failed to generate receipt image");
          console.error(fallbackError);
        }
      });
  }

  async function handleSubmitTransfer(event) {
    event.preventDefault();

    if (!selectedChannel?.id) {
      toast.error("Please select transfer type");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }

    if (!recipient) {
      toast.error("Please enter a valid account number first");
      return;
    }

    // Show receipt modal instead of sending immediately
    setShowReceiptModal(true);
  }

  async function handleConfirmTransfer() {
    const numericAmount = Number(amount);

    setIsSending(true);
    try {
      const response = await fetch("http://localhost:3000/api/transfers/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          senderUserId: userId,
          transferChannel: selectedChannel.channelType || "bank",
          recipientAccountNumber: recipientAccountNumber.trim(),
          amount: numericAmount,
          note: note.trim()
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Transfer failed");
      }

      const transferDetails = result?.transfer || {};
      const senderName =
        session?.user?.application?.fullName || session?.user?.username || session?.username || "-";
      const senderAccountNumber = session?.user?.account?.accountNumber || "-";
      const remainingBalance = Number(transferDetails?.remainingBalance ?? 0);
      const createdAt = new Date().toISOString();

      setSuccessReceipt({
        senderName,
        senderAccountNumber,
        recipientName: recipient?.fullName || transferDetails?.recipientName || "-",
        recipientAccountNumber: recipient?.accountNumber || transferDetails?.recipientAccountNumber || "-",
        transferType: selectedChannel?.title || "-",
        amountSent: numericAmount,
        remainingBalance,
        note: note.trim(),
        createdAt
      });

      const rawSession = localStorage.getItem("internetBankingSession");
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        parsed.balance = remainingBalance;
        if (parsed?.user?.account) {
          parsed.user.account.balance = remainingBalance;
        }
        localStorage.setItem("internetBankingSession", JSON.stringify(parsed));
      }

      setShowReceiptModal(false);
      setShowSuccessReceiptModal(true);
      setAmount("");
      setNote("");
      setRecipientAccountNumber("");
      setRecipient(null);
      setStep(1);
      setSelectedChannel(null);
    } catch (error) {
      toast.error(error.message || "Transfer failed");
      setShowReceiptModal(false);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="page-wrap">
      <header className="topbar">
        <div className="brand-wrap">
          <Link to="/" aria-label="Go to home">
            <img className="brand-logo" src="/images/public-bank-logo-vector.svg" alt="Public Bank" />
          </Link>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <div className="dropdown">
            <button className="nav-link" type="button">
              Accounts
            </button>
            <div className="menu-panel">
              <Link to="/accounts/asaan-saving-account">Saving Account</Link>
              <Link to="/accounts/zabardast-current-account">Current Account</Link>
            </div>
          </div>

          <div className="dropdown">
            <button className="nav-link" type="button">
              Digital Banking
            </button>
            <div className="menu-panel">
              <Link to="/internet-banking" target="_blank" rel="noreferrer">
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
          <Link className="btn btn-blue" to="/account">
            My Account
          </Link>
        </div>
      </header>

      <main className="transfer-page-wrap">
        <section className="transfer-card">
          <h1>Transfer Money</h1>

          {step === 1 && (
            <div className="transfer-channel-grid">
              {transferChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  className="transfer-channel-item"
                  onClick={() => handleChannelSelect(channel)}
                >
                  <div className="transfer-channel-logo" aria-hidden="true">
                    <img
                      src={channel.logo}
                      alt={channel.title}
                      onError={(event) => {
                        event.currentTarget.remove();
                      }}
                    />
                    <span>{channel.badge}</span>
                  </div>
                  <div className="transfer-channel-body">
                    <h3>{channel.title}</h3>
                    <p>Code: {channel.shortCode}</p>
                    <small>{channel.hint}</small>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <form className="transfer-form" onSubmit={handleSubmitTransfer}>
              <div className="transfer-selected-channel">
                <span>Selected Type</span>
                <strong>
                  {selectedChannel?.title} ({selectedChannel?.shortCode})
                </strong>
                <button type="button" className="btn btn-cancel-light" onClick={() => setStep(1)}>
                  Change
                </button>
              </div>

              <label>
                Recipient Account Number
                <div className="transfer-recipient-inline">
                  <input
                    type="text"
                    value={recipientAccountNumber}
                    onChange={handleAccountInputChange}
                    placeholder="Enter account number"
                    required
                  />
                </div>
              </label>

              {recipient && (
                <div className="transfer-recipient-card" role="status" aria-live="polite">
                  <span>Recipient Found</span>
                  <strong>{recipient.fullName}</strong>
                  <p>Account: {recipient.accountNumber}</p>
                </div>
              )}

              <label>
                Amount
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  disabled={!recipient || isVerifying}
                  required
                />
              </label>

              <label>
                Remarks
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional note"
                  disabled={!recipient || isVerifying}
                />
              </label>

              <div className="transfer-form-actions">
                <button type="submit" className="btn btn-orange" disabled={isSending || !recipient || isVerifying}>
                  {isSending ? "Processing..." : "Proceed"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      {showReceiptModal && (
        <div className="modal-overlay" onClick={() => !isSending && setShowReceiptModal(false)}>
          <div className="modal-content receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-header">
              <img 
                src="/images/public-bank-logo-vector.svg" 
                alt="Public Bank" 
                className="receipt-logo"
              />
              <h2>Send Money</h2>
            </div>

            <div className="receipt-body">
              <div className="receipt-section">
                <div className="receipt-row">
                  <span className="receipt-label">Transfer Type:</span>
                  <span className="receipt-value">{selectedChannel?.title}</span>
                </div>

                <div className="receipt-row">
                  <span className="receipt-label">Recipient Account Title:</span>
                  <span className="receipt-value">{recipient?.fullName}</span>
                </div>

                <div className="receipt-row">
                  <span className="receipt-label">Recipient Account Number:</span>
                  <span className="receipt-value">{recipient?.accountNumber}</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-row amount-row">
                  <span className="receipt-label">Amount to Send:</span>
                  <span className="receipt-value amount-value-confirmation">PKR {Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {note && (
                  <div className="receipt-row">
                    <span className="receipt-label">Remarks:</span>
                    <span className="receipt-value">{note}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="receipt-actions">
              <button 
                type="button" 
                className="btn btn-cancel-light" 
                onClick={() => setShowReceiptModal(false)}
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-orange" 
                onClick={handleConfirmTransfer}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send Money"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessReceiptModal && successReceipt && (
        <div className="modal-overlay" onClick={() => setShowSuccessReceiptModal(false)}>
          <div className="modal-content receipt-modal" onClick={(event) => event.stopPropagation()}>
            <div id="success-receipt-content" className="success-receipt-content">
              <div className="receipt-header">
                <img src="/images/public-bank-logo-vector.svg" alt="Public Bank" className="receipt-logo" />
              </div>

              <div className="receipt-body success-receipt-body">
                <div className="receipt-status">
                  <h2>Transaction Successful</h2>
                </div>

                <div className="receipt-amount">
                  <span className="amount-label">PKR</span>
                  <span className="amount-value">{Number(successReceipt.amountSent).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                <div className="receipt-checkmark">
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" fill="#d4f4dd" stroke="#27ae60" strokeWidth="2" />
                    <path d="M 30 50 L 45 65 L 70 35" stroke="#27ae60" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="receipt-section-box">
                  <div className="receipt-section-label">Transferred To:</div>
                  <div className="receipt-recipient-name">{successReceipt.recipientName}</div>
                  <div className="receipt-account-masked">{successReceipt.recipientAccountNumber.slice(-4).padStart(successReceipt.recipientAccountNumber.length, "*")}</div>
                </div>

                <div className="receipt-section-box">
                  <div className="receipt-section-label">From Account:</div>
                  <div className="receipt-recipient-name">{successReceipt.senderName}</div>
                  <div className="receipt-account-masked">{successReceipt.senderAccountNumber.slice(-4).padStart(successReceipt.senderAccountNumber.length, "*")}</div>
                </div>

                <div className="receipt-divider-line"></div>

                <div className="receipt-meta-info">
                  <div className="receipt-meta-row">
                    <span className="meta-label">Transfer Via:</span>
                    <span className="meta-value">{successReceipt.transferType}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span className="meta-label">Date:</span>
                    <span className="meta-value">{new Date(successReceipt.createdAt).toLocaleDateString("en-PK")}</span>
                  </div>
                  <div className="receipt-meta-row">
                    <span className="meta-label">Time:</span>
                    <span className="meta-value">{new Date(successReceipt.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  </div>
                  {successReceipt.note && (
                    <div className="receipt-meta-row">
                      <span className="meta-label">Remarks:</span>
                      <span className="meta-value">{successReceipt.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="receipt-actions">
              <button type="button" className="btn btn-cancel-light" onClick={() => setShowSuccessReceiptModal(false)}>
                Close
              </button>
              <button type="button" className="btn btn-orange" onClick={handleSaveReceiptPlaceholder}>
                Save Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

export default TransferMoneyPage;
