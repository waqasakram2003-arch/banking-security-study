import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setInternetBankingSession } from "../components/session.js";

const registrationImages = [
  "/images/Registration/1440x625-3-1.jpg",
  // "/images/Registration/images (1).jpg",
  "/images/Registration/Online-Banking-for-Property-Deals.jpg"
];

function normalizeOtpInput(value = "") {
  const normalizedArabicIndic = String(value).replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const normalizedExtendedArabicIndic = normalizedArabicIndic.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
  );
  return normalizedExtendedArabicIndic.replace(/[^a-zA-Z0-9]/g, "").slice(0, 7);
}

function InternetBanking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeImage, setActiveImage] = useState(0);
  const [activePanel, setActivePanel] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [pendingSignupPayload, setPendingSignupPayload] = useState(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showSignupPin, setShowSignupPin] = useState(false);
  const [showSignupConfirmPin, setShowSignupConfirmPin] = useState(false);
  const [loginValues, setLoginValues] = useState({ username: "", password: "" });
  const [signupValues, setSignupValues] = useState({
    accountNumber: "",
    cnic: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    transactionPin: "",
    confirmTransactionPin: ""
  });

  const signupPrefill = useMemo(
    () => ({
      accountNumber: String(searchParams.get("accountNumber") || "").trim(),
      cnic: String(searchParams.get("cnic") || "").trim(),
      email: String(searchParams.get("email") || "").trim().toLowerCase(),
      username: String(searchParams.get("username") || "").trim()
    }),
    [searchParams]
  );

  const hasSignupPrefill = Boolean(
    signupPrefill.accountNumber || signupPrefill.cnic || signupPrefill.email || signupPrefill.username
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % registrationImages.length);
    }, 3200);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const mode = String(searchParams.get("mode") || "").toLowerCase();
    if (mode === "signup" || hasSignupPrefill) {
      setActivePanel("signup");
    }
  }, [hasSignupPrefill, searchParams]);

  useEffect(() => {
    setSignupValues((prev) => ({
      ...prev,
      accountNumber: signupPrefill.accountNumber || prev.accountNumber,
      cnic: signupPrefill.cnic || prev.cnic,
      email: signupPrefill.email || prev.email,
      username: signupPrefill.username || prev.username
    }));
  }, [signupPrefill]);

  async function saveSession(authResult) {
    let mergedUser = authResult.user;
    const userId = authResult?.user?._id;

    if (userId) {
      try {
        const response = await fetch(`http://localhost:3000/api/accounts/profile/${userId}`);
        if (response.ok) {
          const result = await response.json();
          const profileImage = result?.profile?.profileImage || "";
          mergedUser = {
            ...authResult.user,
            application: {
              ...authResult.user?.application,
              profileImage
            }
          };
        }
      } catch {
        // Keep auth payload if profile fetch fails.
      }
    }

    const sessionPayload = {
      token: authResult.token,
      user: mergedUser,
      username: mergedUser?.username || authResult?.username || "",
      balance: Number(mergedUser?.account?.balance || 0)
    };

    setInternetBankingSession(sessionPayload);
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginValues)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to login right now");
      }

      await saveSession(result);
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Unable to login right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    if (signupValues.password !== signupValues.confirmPassword) {
      toast.error("Password and confirm password must match");
      setIsSubmitting(false);
      return;
    }

    if (!signupValues.transactionPin || signupValues.transactionPin.length !== 4) {
      toast.error("Transaction PIN must be exactly 4 digits");
      setIsSubmitting(false);
      return;
    }

    if (!/^\d+$/.test(signupValues.transactionPin)) {
      toast.error("Transaction PIN must contain only digits");
      setIsSubmitting(false);
      return;
    }

    if (signupValues.transactionPin !== signupValues.confirmTransactionPin) {
      toast.error("Transaction PIN and confirm PIN must match");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      accountNumber: signupValues.accountNumber,
      cnic: signupValues.cnic,
      email: signupValues.email,
      username: signupValues.username,
      password: signupValues.password,
      confirmPassword: signupValues.confirmPassword,
      transactionPin: signupValues.transactionPin,
      confirmTransactionPin: signupValues.confirmTransactionPin
    };

    try {
      const response = await fetch("http://localhost:3000/api/users/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to signup right now");
      }

      setPendingSignupPayload(payload);
      setOtpEmail(payload.email);
      setOtpCode("");
      setIsOtpModalOpen(true);
      toast.success("OTP sent to your gmail");
    } catch (error) {
      toast.error(error.message || "Unable to signup right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtpSubmit(event) {
    event.preventDefault();

    if (!pendingSignupPayload) {
      toast.error("Signup details missing. Please signup again.");
      return;
    }

    if (!/^[a-zA-Z0-9]{7}$/.test(otpCode)) {
      toast.error("Please enter a valid 7 character OTP");
      return;
    }

    setIsOtpSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/verify-otp-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...pendingSignupPayload,
          otp: otpCode
        })
      });

      const result = await response.json();

      if (response.status === 200 && result?.loginRequired) {
        toast.error("User already signed up. Please login with username and password.");
        setIsOtpModalOpen(false);
        setActivePanel("login");
        setLoginValues((prev) => ({ ...prev, username: result.username || prev.username }));
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Unable to verify OTP right now");
      }

      await saveSession(result);
      toast.success(`Signup successful. Username: ${result.username}`);
      setIsOtpModalOpen(false);
      setPendingSignupPayload(null);
      setOtpCode("");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Unable to verify OTP right now");
    } finally {
      setIsOtpSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (!pendingSignupPayload) {
      toast.error("Signup details missing. Please signup again.");
      return;
    }

    setIsOtpSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pendingSignupPayload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to resend OTP right now");
      }

      toast.success("OTP resent to your gmail");
    } catch (error) {
      toast.error(error.message || "Unable to resend OTP right now");
    } finally {
      setIsOtpSubmitting(false);
    }
  }

  const inputClass =
    "rounded-lg border border-[#b7cde0] px-3 py-2.5 font-inherit focus:border-[#0d5f9b] focus:outline-none focus:ring-[3px] focus:ring-[rgba(13,95,155,0.15)]";
  const pwdWrapClass = "relative flex items-center";
  const pwdInputClass = `${inputClass} w-full pr-11`;
  const eyeBtnClass = (on) =>
    `absolute right-2.5 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-base leading-none ${
      on ? "text-[#0d5f9b] opacity-100" : "text-[#4f6a82] opacity-40 hover:opacity-70"
    }`;

  return (
    <main
      className="grid min-h-screen grid-cols-1 bg-gradient-to-br from-[#edf5fb] to-[#f8fcff] md:grid-cols-[minmax(320px,460px)_1fr]"
      aria-label="Internet banking login and signup"
    >
      <section className="flex flex-col gap-3.5 border-[#d9e7f3] bg-white px-7 py-9 max-[720px]:border-b md:border-r md:border-b-0 md:px-7 md:py-9 max-[720px]:px-4 max-[720px]:py-[22px]">
        <img className="h-auto w-[210px]" src="/images/public-bank-logo-vector.svg" alt="Public Bank" />

        <h1 className="my-1.5 mb-0.5 text-[1.7rem] text-[#0f2f4b]">Internet Banking</h1>
        <p className="m-0 text-[#46617a]">Fast access to your account. Use login or create your digital profile.</p>

        <div
          className="mt-1 grid grid-cols-2 overflow-hidden rounded-[10px] border border-[#c7dff2]"
          role="tablist"
          aria-label="Authentication tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === "login"}
            className={
              activePanel === "login"
                ? "border-0 bg-[#0d5f9b] py-2.5 text-sm font-bold text-white"
                : "cursor-pointer border-0 bg-[#edf6ff] py-2.5 text-sm font-bold text-[#20527a]"
            }
            onClick={() => setActivePanel("login")}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === "signup"}
            className={
              activePanel === "signup"
                ? "border-0 bg-[#0d5f9b] py-2.5 text-sm font-bold text-white"
                : "cursor-pointer border-0 bg-[#edf6ff] py-2.5 text-sm font-bold text-[#20527a]"
            }
            onClick={() => setActivePanel("signup")}
          >
            Signup
          </button>
        </div>

        {activePanel === "login" ? (
          <form className="mt-1 flex flex-col gap-3" onSubmit={handleLoginSubmit}>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Username
              <input
                className={inputClass}
                type="text"
                name="username"
                placeholder="Enter username"
                required
                value={loginValues.username}
                onChange={(event) => {
                  setLoginValues((prev) => ({ ...prev, username: event.target.value }));
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Password
              <div className={pwdWrapClass}>
                <input
                  className={pwdInputClass}
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  required
                  value={loginValues.password}
                  onChange={(event) => {
                    setLoginValues((prev) => ({ ...prev, password: event.target.value }));
                  }}
                />
                <button
                  type="button"
                  className={eyeBtnClass(showLoginPassword)}
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  title={showLoginPassword ? "Hide password" : "Show password"}
                  aria-pressed={showLoginPassword}
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  👁
                </button>
              </div>
            </label>
            <button
              type="submit"
              className="mt-1 cursor-pointer rounded-[10px] border-0 bg-[#0d5f9b] px-3 py-2.5 text-[0.98rem] font-bold text-white hover:bg-[#094a79] disabled:cursor-not-allowed disabled:opacity-75"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Please wait..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="mt-1 flex flex-col gap-3" onSubmit={handleSignupSubmit}>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Account Number
              <input
                className={inputClass}
                type="text"
                name="accountNumber"
                placeholder="Enter account number"
                required
                value={signupValues.accountNumber}
                readOnly={Boolean(signupPrefill.accountNumber)}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, accountNumber: event.target.value }));
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              CNIC
              <input
                className={inputClass}
                type="text"
                name="cnic"
                placeholder="Enter CNIC (13 digits)"
                required
                value={signupValues.cnic}
                readOnly={Boolean(signupPrefill.cnic)}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, cnic: event.target.value }));
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Email
              <input
                className={inputClass}
                type="email"
                name="email"
                placeholder="Enter email"
                required
                value={signupValues.email}
                readOnly={Boolean(signupPrefill.email)}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, email: event.target.value }));
                }}
              />
              <span className="mt-1 rounded-lg border border-[#cbdef0] bg-[#edf6ff] px-3 py-2 text-[#184467]">
                Use the same email as in account creation.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Username
              <input
                className={inputClass}
                type="text"
                name="username"
                placeholder="Create username"
                required
                minLength={3}
                value={signupValues.username}
                readOnly={Boolean(signupPrefill.username)}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, username: event.target.value }));
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Password
              <div className={pwdWrapClass}>
                <input
                  className={pwdInputClass}
                  type={showSignupPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  required
                  value={signupValues.password}
                  onChange={(event) => {
                    setSignupValues((prev) => ({ ...prev, password: event.target.value }));
                  }}
                />
                <button
                  type="button"
                  className={eyeBtnClass(showSignupPassword)}
                  aria-label={showSignupPassword ? "Hide password" : "Show password"}
                  title={showSignupPassword ? "Hide password" : "Show password"}
                  aria-pressed={showSignupPassword}
                  onClick={() => setShowSignupPassword((prev) => !prev)}
                >
                  👁
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Confirm Password
              <div className={pwdWrapClass}>
                <input
                  className={pwdInputClass}
                  type={showSignupConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  required
                  value={signupValues.confirmPassword}
                  onChange={(event) => {
                    setSignupValues((prev) => ({ ...prev, confirmPassword: event.target.value }));
                  }}
                />
                <button
                  type="button"
                  className={eyeBtnClass(showSignupConfirmPassword)}
                  aria-label={showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  title={showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showSignupConfirmPassword}
                  onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                >
                  👁
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Transaction PIN
              <div className={pwdWrapClass}>
                <input
                  className={pwdInputClass}
                  type={showSignupPin ? "text" : "password"}
                  name="transactionPin"
                  placeholder="Enter 4-digit PIN"
                  required
                  maxLength="4"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  value={signupValues.transactionPin}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                    setSignupValues((prev) => ({ ...prev, transactionPin: value }));
                  }}
                />
                <button
                  type="button"
                  className={eyeBtnClass(showSignupPin)}
                  aria-label={showSignupPin ? "Hide PIN" : "Show PIN"}
                  title={showSignupPin ? "Hide PIN" : "Show PIN"}
                  aria-pressed={showSignupPin}
                  onClick={() => setShowSignupPin((prev) => !prev)}
                >
                  👁
                </button>
              </div>
              <span className="mt-1 rounded-lg border border-[#cbdef0] bg-[#edf6ff] px-3 py-2 text-[#184467]">
                Use this PIN to confirm transactions. Do not share with anyone.
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-[0.95rem] font-semibold text-[#1a4365]">
              Confirm Transaction PIN
              <div className={pwdWrapClass}>
                <input
                  className={pwdInputClass}
                  type={showSignupConfirmPin ? "text" : "password"}
                  name="confirmTransactionPin"
                  placeholder="Re-enter 4-digit PIN"
                  required
                  maxLength="4"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  value={signupValues.confirmTransactionPin}
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                    setSignupValues((prev) => ({ ...prev, confirmTransactionPin: value }));
                  }}
                />
                <button
                  type="button"
                  className={eyeBtnClass(showSignupConfirmPin)}
                  aria-label={showSignupConfirmPin ? "Hide confirm PIN" : "Show confirm PIN"}
                  title={showSignupConfirmPin ? "Hide confirm PIN" : "Show confirm PIN"}
                  aria-pressed={showSignupConfirmPin}
                  onClick={() => setShowSignupConfirmPin((prev) => !prev)}
                >
                  👁
                </button>
              </div>
            </label>
            <button
              type="submit"
              className="mt-1 cursor-pointer rounded-[10px] border-0 bg-[#0d5f9b] px-3 py-2.5 text-[0.98rem] font-bold text-white hover:bg-[#094a79] disabled:cursor-not-allowed disabled:opacity-75"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Please wait..." : "Signup"}
            </button>
          </form>
        )}

        <p className="mt-auto text-[0.9rem] text-[#5c7590]">
          Use your username and password for login after signup.
        </p>
      </section>

      <section className="grid place-items-center p-4 max-[720px]:p-4 md:p-8" aria-live="polite" aria-label="Promotional visuals">
        <img
          className="ib-promo-animate h-[min(78vh,760px)] w-full max-w-[980px] rounded-2xl border border-[#d5e6f3] object-cover shadow-[0_24px_44px_rgba(9,41,67,0.18)] max-[720px]:max-h-[48vh] max-[720px]:h-auto"
          src={registrationImages[activeImage]}
          alt="Digital banking promotion"
        />
      </section>

      {isOtpModalOpen && (
        <div
          className="fixed inset-0 z-[1300] grid place-items-center bg-[rgba(7,25,41,0.45)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label="OTP verification"
        >
          <form
            className="flex w-[min(420px,100%)] flex-col gap-2.5 rounded-2xl border border-[#d2e3f1] bg-white p-5 text-center shadow-[0_24px_48px_rgba(8,34,56,0.24)]"
            onSubmit={handleVerifyOtpSubmit}
          >
            <img
              className="mx-auto mb-0.5 h-auto w-[150px]"
              src="/images/public-bank-logo-vector.svg"
              alt="Public Bank"
            />
            <h2 className="m-0 text-[#0f2f4b]">Verify OTP</h2>
            <p className="m-0 text-[#4f6a82]">Enter 7 character OTP sent to your gmail.</p>
            <p className="m-0 font-bold text-[#1a4468]">{otpEmail}</p>

            <input
              className="rounded-lg border border-[#b7cde0] px-3 py-3 text-center font-inherit font-bold tracking-[0.2rem] focus:border-[#0d5f9b] focus:outline-none focus:ring-[3px] focus:ring-[rgba(13,95,155,0.15)]"
              type="text"
              inputMode="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={7}
              pattern="[A-Za-z0-9]{7}"
              placeholder="Enter 7 character OTP"
              value={otpCode}
              autoFocus
              onChange={(event) => {
                setOtpCode(normalizeOtpInput(event.target.value).slice(0, 7));
              }}
              required
            />

            <div className="grid gap-2">
              <button
                type="submit"
                className="cursor-pointer rounded-[10px] border-0 bg-[#0d5f9b] px-3 py-2.5 text-[0.98rem] font-bold text-white hover:bg-[#094a79] disabled:cursor-not-allowed disabled:opacity-75"
                disabled={isOtpSubmitting}
              >
                {isOtpSubmitting ? "Verifying..." : "Verify and Signup"}
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-[10px] border border-[#c8daea] bg-[#f4f9ff] px-3 py-2.5 text-[0.95rem] font-bold text-[#1f5178] hover:bg-[#e9f2fc] disabled:cursor-not-allowed disabled:opacity-75"
                onClick={handleResendOtp}
                disabled={isOtpSubmitting}
              >
                Resend OTP
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-[10px] border border-[#c8daea] bg-[#f4f9ff] px-3 py-2.5 text-[0.95rem] font-bold text-[#1f5178] hover:bg-[#e9f2fc] disabled:cursor-not-allowed disabled:opacity-75"
                onClick={() => setIsOtpModalOpen(false)}
                disabled={isOtpSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default InternetBanking;