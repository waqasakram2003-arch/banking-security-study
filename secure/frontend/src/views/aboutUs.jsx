import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { HomeHeaderActions } from "../components/BankingHeader.jsx";
import { btnBlueClass, btnLogoutClass, pageWrapClass, userAvatarImgClass, userAvatarLinkClass } from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession } from "../components/session.js";

const corporateValues = [
  {
    title: "Integrity",
    description:
      "We put ethical behaviour at the core of our operations and maintain transparency in every customer interaction."
  },
  {
    title: "Customer Focus",
    description:
      "We strive to exceed expectations by delivering responsive service, useful products, and dependable support."
  },
  {
    title: "Fairness",
    description:
      "We treat customers and partners respectfully, with unbiased decision-making and clear communication."
  },
  {
    title: "Teamwork",
    description:
      "We bring together diverse expertise, share knowledge, and support one another to solve client needs."
  },
  {
    title: "Commitment to Goals",
    description:
      "We work with discipline and clear direction to deliver meaningful progress and long-term value."
  }
];

function AboutUs() {
  const [session, setSession] = useState(() => {
    return getInternetBankingSession();
  });
  const [feedback, setFeedback] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const autoFilledName = useMemo(
    () => String(session?.user?.application?.fullName || session?.username || "").trim(),
    [session]
  );

  function handleLogout() {
    clearInternetBankingSession();
    setSession(null);
  }

  function clearSessionBeforeNavigate() {
    clearInternetBankingSession();
    setSession(null);
  }

  useEffect(() => {
    function syncSession() {
      setSession(getInternetBankingSession());
    }

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  useEffect(() => {
    async function loadFeedback() {
      setIsLoadingFeedback(true);
      try {
        const response = await fetch("http://localhost:3000/api/feedback");
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Unable to load feedback");
        }

        setFeedback(Array.isArray(result?.feedback) ? result.feedback : []);
      } catch (error) {
        toast.error(error.message || "Unable to load feedback");
      } finally {
        setIsLoadingFeedback(false);
      }
    }

    loadFeedback();
  }, []);

  async function handleFeedbackSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const name = String(formData.get("name") || autoFilledName || "").trim();
    const comment = String(formData.get("comment") || "").trim();
    const normalizedName = name.toLowerCase();
    setFeedbackError("");

    if (!name) {
      toast.error("Please login or enter your name");
      return;
    }

    if (!comment) {
      toast.error("Please write your comment");
      return;
    }

    // Check for HTML tags and suspicious characters
    if (/<|>|<script|<\/|javascript:|onerror|onclick|<iframe/i.test(comment)) {
      setFeedbackError("Please use plain text only.");
      return;
    }

    const isAlreadySubmitted = feedback.some(
      (item) => String(item?.name || "").trim().toLowerCase() === normalizedName
    );
    if (isAlreadySubmitted) {
      setFeedbackError("You already Submitted comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, comment })
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setFeedbackError("You already Submitted comment");
          return;
        }
        throw new Error(result?.message || "Unable to submit feedback");
      }

      setFeedback((prev) => [result.feedback, ...prev].slice(0, 200));
      formElement.reset();
      toast.success("Feedback submitted successfully");
    } catch (error) {
      toast.error(error.message || "Unable to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`${pageWrapClass} bg-white`}>
      <ResponsiveHeader
        onInternetBankingClick={clearSessionBeforeNavigate}
        activeNav="about"
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

      <main className="mx-auto mb-14 mt-8 w-[min(1180px,92%)] max-[720px]:mt-[18px] max-[720px]:w-[94%]">
        <section className="grid overflow-hidden rounded-[18px] bg-gradient-to-r from-[#1b94c9] via-[#28b2d8] to-[#1679bf] shadow-[0_16px_34px_rgba(15,44,68,0.14)] max-[980px]:grid-cols-1 md:grid-cols-[minmax(320px,1fr)_minmax(360px,1.1fr)]">
          <div className="flex min-h-[250px] flex-col justify-center px-10 py-12 text-white max-[980px]:px-6 max-[980px]:py-7 max-[720px]:min-h-0">
            <p className="mb-2.5 text-base font-bold opacity-95">Empowering Progress Through</p>
            <h1 className="m-0 max-w-[420px] text-[clamp(2rem,4vw,3.2rem)] leading-tight">
              Trust, Innovation, &amp; Service
            </h1>
          </div>
          <img
            className="block h-full min-h-[250px] w-full object-cover max-[720px]:h-[44vw] max-[720px]:min-h-0"
            src="/images/about/about-main.jpg"
            alt="Public Bank about banner"
          />
        </section>

        <section className="mt-8 border-0 pl-0 max-[980px]:mt-8">
          <h2 className="relative mb-3 pl-3.5 text-[clamp(1.4rem,2.4vw,2rem)] font-medium text-[#1d3f60] before:absolute before:left-0 before:top-[7px] before:h-6 before:w-0.5 before:rounded-full before:bg-[#f5921f] before:content-['']">
            Our Vision
          </h2>
          <p className="m-0 max-w-[1040px] text-base leading-[1.7] text-[#4d6780]">
            To be a reliable, customer-centric bank offering inclusive and progressive banking services in Pakistan.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="relative mb-3 pl-3.5 text-[clamp(1.4rem,2.4vw,2rem)] font-medium text-[#1d3f60] before:absolute before:left-0 before:top-[7px] before:h-6 before:w-0.5 before:rounded-full before:bg-[#f5921f] before:content-['']">
            Our Mission
          </h2>
          <p className="m-0 max-w-[1040px] text-base leading-[1.7] text-[#4d6780]">
            To establish long-term relationships through smooth customer experiences, responsible banking, and
            innovative technology while creating value for customers and communities.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="relative mb-3 pl-3.5 text-[clamp(1.4rem,2.4vw,2rem)] font-medium text-[#1d3f60] before:absolute before:left-0 before:top-[7px] before:h-6 before:w-0.5 before:rounded-full before:bg-[#f5921f] before:content-['']">
            Corporate Values
          </h2>
          <p className="m-0 max-w-[1040px] text-base leading-[1.7] text-[#4d6780]">
            Our core values guide our actions and decisions and help us deliver strong, dependable service every day.
          </p>

          <div className="mt-[26px] grid grid-cols-1 gap-x-7 gap-y-[22px] md:grid-cols-3 max-[980px]:grid-cols-1">
            {corporateValues.map((value) => (
              <article key={value.title} className="flex items-start gap-3">
                <span className="mt-1 shrink-0 text-[1.15rem] text-[#ff8a1f]">◆</span>
                <div>
                  <h3 className="mb-2 text-[1.15rem] font-medium text-[#1d3f60]">{value.title}</h3>
                  <p className="m-0 text-[0.94rem] leading-[1.7] text-[#4d6780]">{value.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 pt-1.5">
          <h2 className="relative mb-3 pl-3.5 text-[clamp(1.4rem,2.4vw,2rem)] font-medium text-[#1d3f60] before:absolute before:left-0 before:top-[7px] before:h-6 before:w-0.5 before:rounded-full before:bg-[#f5921f] before:content-['']">
            Public Feedback
          </h2>

          <form className="my-5 grid gap-4" onSubmit={handleFeedbackSubmit}>
            <label className="grid gap-2 text-[0.95rem] font-semibold text-[#1d3f60]">
              Name
              <input
                className="w-full rounded-[10px] border border-[#c7d9e8] bg-white px-3.5 py-3 font-inherit text-[#17324c] focus:border-[#1494da] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,148,218,0.12)]"
                type="text"
                name="name"
                defaultValue={autoFilledName}
                readOnly={Boolean(autoFilledName)}
                placeholder="Enter your name"
                onChange={() => setFeedbackError("")}
              />
            </label>

            <label className="grid gap-2 text-[0.95rem] font-semibold text-[#1d3f60]">
              Comment
              <textarea
                className="w-full rounded-[10px] border border-[#c7d9e8] bg-white px-3.5 py-3 font-inherit text-[#17324c] focus:border-[#1494da] focus:outline-none focus:ring-[3px] focus:ring-[rgba(20,148,218,0.12)]"
                name="comment"
                rows={5}
                placeholder="Write your feedback"
                required
                onChange={() => setFeedbackError("")}
              />
            </label>

            <button
              type="submit"
              className="w-fit rounded-lg border-0 bg-[#1494da] px-3.5 py-2 text-[0.92rem] font-bold text-white hover:bg-[#0d7ab8] disabled:cursor-not-allowed disabled:opacity-75"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Posting..." : "Post Feedback"}
            </button>
            {feedbackError ? <p className="-mt-1 text-[0.9rem] font-semibold text-[#c43832]">{feedbackError}</p> : null}
          </form>

          <div className="grid gap-3.5">
            {isLoadingFeedback ? (
              <p className="m-0 text-[#5d7389]">Loading feedback...</p>
            ) : feedback.length ? (
              feedback.map((item) => (
                <article
                  key={item._id}
                  className="rounded-[14px] border-0 bg-white p-4 shadow-[0_8px_18px_rgba(18,45,68,0.06)]"
                >
                  <div className="mb-2 flex justify-between gap-3 text-[#1d3f60] max-[980px]:flex-col max-[980px]:items-start">
                    <strong className="text-base">{item.name}</strong>
                    <span className="text-[0.85rem] text-[#6e8396]">
                      {new Date(item.createdAt).toLocaleString("en-PK")}
                    </span>
                  </div>
                  <p className="m-0 leading-[1.7] text-[#435d74]">{item.comment}</p>
                </article>
              ))
            ) : (
              <p className="m-0 text-[#5d7389]">No feedback yet. Be the first to share your thoughts.</p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default AboutUs;
