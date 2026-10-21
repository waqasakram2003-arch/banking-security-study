import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

const registrationImages = [
  "/images/Registration/1440x625-3-1.jpg",
  "/images/Registration/images (1).jpg",
  "/images/Registration/Online-Banking-for-Property-Deals.jpg"
];

function InternetBanking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeImage, setActiveImage] = useState(0);
  const [activePanel, setActivePanel] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginValues, setLoginValues] = useState({ username: "", password: "" });
  const [signupValues, setSignupValues] = useState({
    accountNumber: "",
    email: "",
    cnic: "",
    username: "",
    password: "",
    confirmPassword: ""
  });

  const prefilledAccountNumber = useMemo(
    () => String(searchParams.get("accountNumber") || "").trim(),
    [searchParams]
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % registrationImages.length);
    }, 3200);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const mode = String(searchParams.get("mode") || "").toLowerCase();
    if (mode === "signup") {
      setActivePanel("signup");
    }
  }, [searchParams]);

  useEffect(() => {
    const prefilledEmail = String(searchParams.get("email") || "").trim();
    const prefilledCnic = String(searchParams.get("cnic") || "").replace(/-/g, "").trim();

    setSignupValues((prev) => ({
      ...prev,
      accountNumber: prefilledAccountNumber || prev.accountNumber,
      email: prefilledEmail || prev.email,
      cnic: prefilledCnic || prev.cnic
    }));
  }, [prefilledAccountNumber, searchParams]);

  function saveSession(authResult) {
    const sessionPayload = {
      token: authResult.token,
      user: authResult.user,
      username: authResult?.user?.username || authResult?.username || "",
      balance: Number(authResult?.user?.account?.balance || 0)
    };

    localStorage.setItem("internetBankingSession", JSON.stringify(sessionPayload));
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

      saveSession(result);
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

    if (String(signupValues.password) !== String(signupValues.confirmPassword)) {
      toast.error("Password and Confirm Password must match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3000/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountNumber: signupValues.accountNumber,
          email: signupValues.email,
          cnic: signupValues.cnic,
          username: signupValues.username,
          password: signupValues.password,
          confirmPassword: signupValues.confirmPassword
        })
      });

      const result = await response.json();

      if (response.status === 200 && result?.loginRequired) {
        toast.error("User already signed up. Please login with username and password.");
        setActivePanel("login");
        setLoginValues((prev) => ({ ...prev, username: result.username || prev.username }));
        return;
      }

      if (!response.ok) {
        throw new Error(result?.message || "Unable to signup right now");
      }

      saveSession(result);
      toast.success(`Signup successful. Username: ${result.username}`);
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Unable to signup right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="ib-page" aria-label="Internet banking login and signup">
      <section className="ib-left-panel">
        <img
          className="ib-brand"
          src="/images/public-bank-logo-vector.svg"
          alt="Public Bank"
        />

        <h1>Internet Banking</h1>
        <p>Fast access to your account. Use login or create your digital profile.</p>

        <div className="ib-tab-row" role="tablist" aria-label="Authentication tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === "login"}
            className={activePanel === "login" ? "ib-tab-btn active" : "ib-tab-btn"}
            onClick={() => setActivePanel("login")}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activePanel === "signup"}
            className={activePanel === "signup" ? "ib-tab-btn active" : "ib-tab-btn"}
            onClick={() => setActivePanel("signup")}
          >
            Signup
          </button>
        </div>

        {activePanel === "login" ? (
          <form className="ib-form" onSubmit={handleLoginSubmit}>
            <label>
              Username
              <input
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
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                required
                value={loginValues.password}
                onChange={(event) => {
                  setLoginValues((prev) => ({ ...prev, password: event.target.value }));
                }}
              />
            </label>
            <button type="submit" className="ib-primary-btn" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="ib-form" onSubmit={handleSignupSubmit}>
            <label>
              Account Number
              <input
                type="text"
                name="accountNumber"
                placeholder="Enter account number"
                required
                value={signupValues.accountNumber}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, accountNumber: event.target.value }));
                }}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                required
                value={signupValues.email}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, email: event.target.value }));
                }}
              />
              <small className="ib-field-note">Email should be same as you gave in bank account creation.</small>
            </label>
            <label>
              CNIC
              <input
                type="text"
                name="cnic"
                placeholder="Enter CNIC (13 digits)"
                required
                value={signupValues.cnic}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, 13);
                  setSignupValues((prev) => ({ ...prev, cnic: digitsOnly }));
                }}
              />
            </label>
            <label>
              Username
              <input
                type="text"
                name="username"
                placeholder="Create username"
                required
                value={signupValues.username}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, username: event.target.value }));
                }}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="Create password"
                required
                value={signupValues.password}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, password: event.target.value }));
                }}
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                required
                value={signupValues.confirmPassword}
                onChange={(event) => {
                  setSignupValues((prev) => ({ ...prev, confirmPassword: event.target.value }));
                }}
              />
            </label>
            <button type="submit" className="ib-primary-btn" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : "Signup"}
            </button>
          </form>
        )}

        <p className="ib-note">Use your username and password for login after signup.</p>
      </section>

      <section className="ib-right-panel" aria-live="polite" aria-label="Promotional visuals">
        <img src={registrationImages[activeImage]} alt="Digital banking promotion" />
      </section>
    </main>
  );
}

export default InternetBanking;