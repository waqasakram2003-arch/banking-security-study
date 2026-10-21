import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResponsiveHeader from "../components/ResponsiveHeader.jsx";
import { HomeHeaderActions } from "../components/BankingHeader.jsx";
import { pageWrapClass } from "../components/bankingStyles.js";
import SiteFooter from "../components/SiteFooter.jsx";
import { clearInternetBankingSession, getInternetBankingSession } from "../components/session.js";

const carouselImages = [
  "/images/Islamic-Personal-Finance---Home-Page-Banner.jpg",
  "/images/SMART ATM 1770X800 12620206.jpg",
  "/images/SDRA - 1770 x 800.jpg",
  "/images/click freelance account banner.jpeg"
];

const productCards = [
  {
    image: "/images/products/Checking-Savings-Accounts.png",
    title: "Checking/Savings Accounts"
  },
  {
    image: "/images/products/Credit-Debit-Cards.png",
    title: "Credit/Debit Cards"
  },
  {
    image: "/images/products/CheckingSavings Accounts.png",
    title: "Sahar Current Account"
  },
  {
    image: "/images/products/roshan-digital-account.png",
    title: "Roshan Digital Account"
  }
];

function Home() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [visibleImages, setVisibleImages] = useState(carouselImages);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState(750000);
  const [goldAmount, setGoldAmount] = useState(300000);
  const [silverAmount, setSilverAmount] = useState(100000);
  const [session, setSession] = useState(() => {
    return getInternetBankingSession();
  });

  const slidesForRender = visibleImages;
  const logicalSlide = activeSlide;

  useEffect(() => {
    setActiveSlide(0);
  }, [visibleImages]);

  useEffect(() => {
    if (!visibleImages.length) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % visibleImages.length);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [visibleImages]);

  useEffect(() => {
    function syncSession() {
      setSession(getInternetBankingSession());
    }

    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  function handleLogout() {
    clearInternetBankingSession();
    setSession(null);
    setIsLogoutModalOpen(false);
  }

  function clearSessionBeforeNavigate() {
    clearInternetBankingSession();
    setSession(null);
  }

  function handleImageError(badImagePath) {
    setVisibleImages((prev) => prev.filter((imagePath) => imagePath !== badImagePath));
  }

  async function handleProductCardClick(card) {
    if (card?.title === "Checking/Savings Accounts") {
      navigate("/accounts/asaan-saving-account");
      return;
    }

    if (card?.title === "Sahar Current Account") {
      navigate("/accounts/zabardast-current-account");
      return;
    }

    if (card?.title === "Roshan Digital Account") {
      navigate("/accounts/asaan-saving-account");
      return;
    }

    if (card?.title !== "Credit/Debit Cards") {
      return;
    }

    const userId = session?.user?._id;
    if (!userId) {
      navigate("/cards/visa-debit-card");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/cards/user/${userId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Unable to load cards");
      }

      const hasActiveCards = Array.isArray(result?.cards) && result.cards.length > 0;
      navigate(hasActiveCards ? "/cards" : "/cards/visa-debit-card");
    } catch {
      navigate("/cards/visa-debit-card");
    }
  }

  function handleProductCardKeyDown(event, card) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleProductCardClick(card);
    }
  }

  const totalAssets = useMemo(() => cashAmount + goldAmount + silverAmount, [cashAmount, goldAmount, silverAmount]);
  const zakatDeduction = useMemo(() => Math.round(totalAssets * 0.025), [totalAssets]);

  function formatPkr(value) {
    return Number(value || 0).toLocaleString("en-PK");
  }

  return (
    <div className={pageWrapClass}>
      <ResponsiveHeader
        logoHomeLink={false}
        onInternetBankingClick={clearSessionBeforeNavigate}
        session={session}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
        clearSessionBeforeNavigate={clearSessionBeforeNavigate}
        actions={
          <HomeHeaderActions
            session={session}
            onLogoutClick={() => setIsLogoutModalOpen(true)}
            clearSessionBeforeNavigate={clearSessionBeforeNavigate}
          />
        }
      />

      <main>
        <section
          className="relative mt-0 min-h-[420px] h-[min(70vh,680px)] overflow-hidden bg-white shadow-none md:h-[min(78vh,860px)] max-[720px]:min-h-0 max-[720px]:h-[44vw]"
          aria-label="Banking image carousel"
        >
          <div
            className="flex h-full transition-transform duration-[800ms] ease-in-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {slidesForRender.map((imagePath, index) => (
              <img
                key={`${imagePath}-${index}`}
                className="h-full w-full shrink-0 bg-white object-contain max-[720px]:object-cover"
                src={imagePath}
                alt="Bank promotion"
                onError={() => handleImageError(imagePath)}
              />
            ))}
          </div>

          <div
            className="absolute right-[18px] top-1/2 z-[2] flex -translate-y-1/2 flex-col gap-2.5"
            aria-label="Carousel navigation"
          >
            {visibleImages.map((imagePath, index) => (
              <button
                key={imagePath}
                type="button"
                className={
                  index === logicalSlide
                    ? "h-3 w-3 cursor-pointer appearance-none rounded-full border-2 border-[#7ec7ea] bg-[#15a3f2] p-0"
                    : "h-3 w-3 cursor-pointer appearance-none rounded-full border-2 border-[#7ec7ea] bg-white/90 p-0"
                }
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section
          className="mx-auto mb-11 mt-7 w-[min(1240px,94%)] max-[720px]:mt-[18px]"
          aria-label="Products and services"
        >
          <h2 className="mb-[18px] border-l-[5px] border-[#ed7f00] pl-4 text-[clamp(1.6rem,3.3vw,2.2rem)] font-bold text-[#212a34]">
            Products and Services Explore &amp; Apply Online.
          </h2>

          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {productCards.map((card) => (
              <div
                key={card.title}
                className="group cursor-pointer rounded-[14px] border border-[#e6e6e6] bg-[#f2f2f2] px-3.5 pb-3.5 pt-[18px] text-center transition-[transform,box-shadow] duration-[260ms] ease-in-out hover:-translate-y-1.5 hover:border-[#e6e6e6] hover:bg-[#f2f2f2] hover:shadow-[0_10px_24px_rgba(22,45,64,0.14)]"
                role="button"
                tabIndex={0}
                onClick={() => handleProductCardClick(card)}
                onKeyDown={(event) => handleProductCardKeyDown(event, card)}
              >
                <img
                  className="aspect-[4/3] w-full object-contain transition-transform duration-[260ms] ease-in-out group-hover:scale-[1.04]"
                  src={card.image}
                  alt={card.title}
                />
                <p className="mb-0.5 mt-2.5 text-base font-medium text-[#1190d8]">{card.title}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="mx-auto mt-9 grid w-[min(1240px,94%)] grid-cols-1 items-start gap-10 bg-transparent p-0 shadow-none min-[901px]:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] max-[900px]:gap-5 max-[720px]:mt-7"
          aria-label="Discount promotion"
        >
          <div className="relative pl-[18px] before:absolute before:left-0 before:top-0.5 before:h-[74px] before:w-1 before:rounded-full before:bg-[#ed7f00] before:content-[''] max-[900px]:pl-4">
            <h2 className="mb-6 mt-0 max-w-full text-[clamp(1.2rem,2vw,1.7rem)] font-normal leading-[1.02] tracking-[-0.04em] text-[#182533] max-[900px]:max-w-none max-[640px]:text-xl">
              <span className="block">Premium Experiences,</span>
              <span className="block">Amazing Savings</span>
            </h2>

            <div
              className="-ml-[18px] mt-8 grid max-w-[760px] gap-3.5 max-[900px]:-ml-4 max-[900px]:max-w-none"
              aria-label="Discount categories"
            >
              <div className="flex min-h-[62px] items-center justify-between gap-[18px] rounded-xl border border-[#ececec] border-l-4 border-l-[#d6d6d6] bg-[#f4f4f4] px-6 py-3.5 text-[clamp(1.12rem,1.5vw,1.6rem)] font-semibold text-[#121e2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-[640px]:min-h-[54px] max-[640px]:px-[18px] max-[640px]:py-3 max-[640px]:text-base">
                <span>Credit and Debit Cards</span>
              </div>
              <div className="flex min-h-[62px] items-center justify-between gap-[18px] rounded-xl border border-[#ececec] border-l-4 border-l-[#d6d6d6] bg-[#f4f4f4] px-6 py-3.5 text-[clamp(1.12rem,1.5vw,1.6rem)] font-semibold text-[#121e2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-[640px]:min-h-[54px] max-[640px]:px-[18px] max-[640px]:py-3 max-[640px]:text-base">
                <span>Visa Debit Cards</span>
              </div>
              <div className="flex min-h-[62px] items-center justify-between gap-[18px] rounded-xl border border-[#ececec] border-l-4 border-l-[#d6d6d6] bg-[#f4f4f4] px-6 py-3.5 text-[clamp(1.12rem,1.5vw,1.6rem)] font-semibold text-[#121e2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-[640px]:min-h-[54px] max-[640px]:px-[18px] max-[640px]:py-3 max-[640px]:text-base">
                <span>PayPak Debit Card</span>
              </div>
              <div className="flex min-h-[62px] items-center justify-between gap-[18px] rounded-xl border border-[#ececec] border-l-4 border-l-[#d6d6d6] bg-[#f4f4f4] px-6 py-3.5 text-[clamp(1.12rem,1.5vw,1.6rem)] font-semibold text-[#121e2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-[640px]:min-h-[54px] max-[640px]:px-[18px] max-[640px]:py-3 max-[640px]:text-base">
                <span>Discount Deals</span>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 place-items-start justify-center pt-2">
            <img
              className="block h-auto w-full max-w-[760px] object-contain"
              src="/images/home-discount-banner.jpg"
              alt="Discount deals promotion"
            />
          </div>
        </section>

        <section
          className="mx-auto mb-12 mt-11 w-[min(1240px,94%)] rounded-[18px] border border-[#e4edf4] bg-[#f7fbff] px-6 py-8 shadow-[0_10px_24px_rgba(19,56,84,0.07)] max-[720px]:mt-8 max-[720px]:rounded-[14px] max-[720px]:px-4 max-[720px]:py-5"
          aria-label="Annual zakat calculator"
        >
          <h2 className="m-0 text-center text-[clamp(1.4rem,3.8vw,3.1rem)] font-light uppercase leading-[1.15] tracking-[0.02em] text-[#32363b]">
            LET&apos;S PLAN YOUR FINANCES
            <span className="block">THE RIGHT WAY</span>
          </h2>

          <div className="mt-7 grid grid-cols-1 gap-8 min-[901px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] items-stretch max-[900px]:gap-5 max-[720px]:mt-5">
            <div className="h-full">
              <img
                className="block h-full w-full object-cover rounded-lg"
                src="/images/zaqat.jpg"
                alt="Zakat calculator illustration"
              />
            </div>

            <div className="mt-7 grid gap-4 max-[720px]:mt-5">
            <div className="grid grid-cols-[minmax(0,1fr)_250px] items-center gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-2.5">
              <p className="m-0 text-[clamp(1rem,2vw,1.8rem)] font-medium uppercase text-[#007b80]">
                Money (PKR)
              </p>
              <div className="grid grid-cols-[70px_1fr] items-center border border-[#cdd8e0] bg-white px-3 py-2.5">
                <span className="text-[1.05rem] text-[#1e2d3a]">PKR</span>
                <strong className="text-right text-[clamp(1.2rem,2.3vw,2rem)] font-medium text-[#007b80]">
                  {formatPkr(cashAmount)}
                </strong>
              </div>
              <input
                className="col-span-full h-[5px] w-full cursor-pointer appearance-none rounded-full bg-[#c6c6c6] accent-[#0b8d77]"
                type="range"
                min="0"
                max="5000000"
                step="10000"
                value={cashAmount}
                onChange={(event) => setCashAmount(Number(event.target.value))}
                aria-label="Money amount for zakat calculation"
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_250px] items-center gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-2.5">
              <p className="m-0 text-[clamp(1rem,2vw,1.8rem)] font-medium uppercase text-[#007b80]">
                Gold (PKR)
              </p>
              <div className="grid grid-cols-[70px_1fr] items-center border border-[#cdd8e0] bg-white px-3 py-2.5">
                <span className="text-[1.05rem] text-[#1e2d3a]">PKR</span>
                <strong className="text-right text-[clamp(1.2rem,2.3vw,2rem)] font-medium text-[#007b80]">
                  {formatPkr(goldAmount)}
                </strong>
              </div>
              <input
                className="col-span-full h-[5px] w-full cursor-pointer appearance-none rounded-full bg-[#c6c6c6] accent-[#0b8d77]"
                type="range"
                min="0"
                max="5000000"
                step="10000"
                value={goldAmount}
                onChange={(event) => setGoldAmount(Number(event.target.value))}
                aria-label="Gold amount for zakat calculation"
              />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_250px] items-center gap-5 max-[900px]:grid-cols-1 max-[900px]:gap-2.5">
              <p className="m-0 text-[clamp(1rem,2vw,1.8rem)] font-medium uppercase text-[#007b80]">
                Silver / Chandi (PKR)
              </p>
              <div className="grid grid-cols-[70px_1fr] items-center border border-[#cdd8e0] bg-white px-3 py-2.5">
                <span className="text-[1.05rem] text-[#1e2d3a]">PKR</span>
                <strong className="text-right text-[clamp(1.2rem,2.3vw,2rem)] font-medium text-[#007b80]">
                  {formatPkr(silverAmount)}
                </strong>
              </div>
              <input
                className="col-span-full h-[5px] w-full cursor-pointer appearance-none rounded-full bg-[#c6c6c6] accent-[#0b8d77]"
                type="range"
                min="0"
                max="5000000"
                step="10000"
                value={silverAmount}
                onChange={(event) => setSilverAmount(Number(event.target.value))}
                aria-label="Silver amount for zakat calculation"
              />
            </div>
            </div>
          </div>

          <div className="mt-7 rounded-xl border border-[#dce7ef] bg-white px-4 py-3.5 text-center max-[720px]:mt-5 max-w-md mx-auto">
            <p className="m-0 text-[0.95rem] text-[#5d7388]">Annual Zakat Deduction (2.5%):</p>
            <p className="m-0 mt-1 text-[clamp(1.4rem,3.2vw,2.2rem)] font-bold text-[#0b8d77]">
              PKR {formatPkr(zakatDeduction)}
            </p>
          </div>
        </section>
      </main>

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
              <button
                type="button"
                className="inline-flex min-w-0 cursor-pointer items-center justify-center rounded-[18px] border-0 bg-[#d62f2f] px-[18px] py-2 text-[0.84rem] font-semibold text-white hover:bg-[#b91f1f]"
                onClick={handleLogout}
              >
                Yes
              </button>
              <button
                type="button"
                className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#e2d9bd] bg-[#f3efdf] px-[18px] py-2 text-[0.84rem] font-medium text-[#374b5e] hover:bg-[#e9e1c7]"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
