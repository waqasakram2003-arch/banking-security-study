/** Shared Tailwind class strings for banking UI (no App.css). */

export const topbarClass =
  "sticky top-0 z-10 flex min-h-10 w-full items-center justify-between gap-2 bg-white px-[50px] py-2.5 shadow-[0_3px_9px_rgba(14,48,74,0.16)] border-b border-[#e8eef5] md:flex-nowrap max-[980px]:flex-nowrap max-[768px]:px-4 max-[768px]:py-2 max-[768px]:gap-1";

export const brandWrapClass =
  "mr-5 flex items-center leading-0 w-auto shrink-0 max-[980px]:mr-2 max-[768px]:mr-1";

export const brandLogoClass = "block h-[34px] w-auto md:h-10";

export const mainNavClass =
  "flex flex-1 items-center gap-1 max-[980px]:order-3 max-[980px]:w-full max-[980px]:justify-start max-[980px]:border-t max-[980px]:border-[#e8eef5] max-[980px]:pt-2 max-[980px]:mt-2";

export const navDdClass = "nav-dd group relative";

export const navTriggerClass =
  "inline-flex items-center gap-1.5 border-0 bg-transparent py-1 px-1.5 text-[0.84rem] font-medium text-[#1a2f45] cursor-pointer rounded-md hover:bg-[#eef5fb] " +
  "after:content-[''] after:inline-block after:w-[7px] after:h-[7px] after:border-r-[1.8px] after:border-b-[1.8px] after:border-current after:rotate-45 after:-translate-y-px";

const navLinkChevron =
  "after:content-[''] after:inline-block after:w-[7px] after:h-[7px] after:border-r-[1.8px] after:border-b-[1.8px] after:border-current after:rotate-45 after:-translate-y-px";

export const navLinkClass =
  `inline-flex items-center gap-1.5 py-1 px-1.5 text-[0.84rem] font-medium text-[#1a2f45] rounded-md no-underline hover:bg-[#eef5fb] ${navLinkChevron}`;

export const navLinkActiveClass =
  `inline-flex items-center gap-1.5 py-1 px-1.5 text-[0.84rem] font-medium rounded-md no-underline bg-[#eef5fb] text-[#0f3a63] ${navLinkChevron}`;

export const menuPanelClass =
  "nav-menu absolute top-full left-0 z-20 hidden min-w-[170px] rounded-[10px] border border-[#d7e4f0] bg-white p-1.5 shadow-[0_12px_24px_rgba(14,48,74,0.14)] group-hover:block";

export const cardsMenuPanelClass = `${menuPanelClass} cards-menu-panel min-w-[360px] overflow-hidden p-0`;

export const menuLinkClass =
  "block rounded-md px-2.5 py-2 text-[0.9rem] font-medium text-[#17324c] no-underline hover:bg-[#edf6ff]";

export const actionWrapClass =
  "flex items-center gap-1.5 max-[980px]:ml-auto max-[720px]:w-full max-[720px]:[&>a]:flex-1 max-[720px]:[&>button]:flex-1";

export const btnOrangeClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[18px] border-0 bg-[#ed7f00] px-4 py-2 text-[0.95rem] font-semibold text-white no-underline transition-all duration-200 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(0,0,0,0.13)]";

export const btnBlueClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[18px] border-0 bg-[#1494da] px-5 py-2.5 text-[0.95rem] font-semibold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0d7ab8] hover:shadow-[0_6px_16px_rgba(20,148,218,0.3)] disabled:cursor-not-allowed disabled:opacity-60";

export const btnBlueSmClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[18px] border-0 bg-[#1494da] px-3.5 py-2 text-[0.8rem] font-bold text-white no-underline transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0d7ab8] hover:shadow-[0_6px_16px_rgba(20,148,218,0.3)] max-[980px]:px-3.5 max-[980px]:py-2.5 max-[980px]:text-[0.9rem] disabled:cursor-not-allowed disabled:opacity-60";

export const btnLogoutClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[18px] border-0 bg-[#d62f2f] px-5 py-2.5 text-[0.95rem] font-semibold text-white transition-all duration-200 hover:bg-[#b91f1f] hover:shadow-[0_6px_18px_rgba(0,0,0,0.13)] hover:-translate-y-px";

export const btnCancelLightClass =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-[#e2d9bd] bg-[#f3efdf] px-[18px] py-2 text-[0.84rem] font-medium text-[#374b5e] hover:bg-[#e9e1c7] disabled:cursor-not-allowed disabled:opacity-70";

export const btnSecondaryFormClass =
  "inline-flex cursor-pointer items-center justify-center rounded-[10px] border border-[#d5dfe8] bg-[#e8eef5] px-6 py-2.5 text-[0.95rem] font-semibold text-[#193c59] transition-all duration-300 hover:bg-[#dce5f0] hover:border-[#c5d0dd] disabled:opacity-60";

export const userAvatarLinkClass =
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-[#0a2d4d] bg-[#0f3a63] p-1 no-underline";

export const userAvatarImgClass = "h-11 w-11 shrink-0 rounded-full border-0 object-cover";

export const pageWrapClass = "mx-auto w-full max-w-none p-0";

export const accountPageWrapClass =
  "mx-auto mt-8 mb-14 w-[min(1160px,92%)] max-[720px]:mt-4 max-[720px]:w-[94%]";

export const accountHeroImageClass = "block h-auto w-full rounded-[14px]";

export const sectionHeadingOverviewClass =
  "relative mb-5 w-fit border-l-[5px] border-[#ed7f00] pl-3 text-[clamp(1.2rem,2.2vw,1.55rem)] font-extrabold leading-snug text-[#111] after:hidden";

export const accountTitleClass =
  "relative mx-auto mb-5 w-fit text-center text-[clamp(2.2rem,4.8vw,3.1rem)] font-extrabold leading-snug text-[#111] after:absolute after:left-0 after:bottom-[-6px] after:h-0.5 after:w-full after:rounded-full after:bg-[#1494da] after:content-['']";

export const cardProductTitleClass =
  "relative mx-auto mb-[22px] w-fit text-center text-[clamp(2.1rem,4.5vw,3rem)] font-extrabold text-[#12273c] after:absolute after:left-1/2 after:bottom-[-8px] after:h-0.5 after:w-[min(70vw,820px)] after:-translate-x-1/2 after:rounded-full after:bg-[#1494da] after:content-['']";

export const overviewLeadClass = "mb-4 text-[1.08rem] font-bold text-[#103a5b]";

export const overviewTextClass =
  "mb-[18px] max-w-[970px] text-base leading-[1.8] text-[#315a78]";

export const applyNowBadgeClass =
  "mx-auto mt-4 block w-fit rounded-full bg-[#1494da] px-6 py-2.5 text-[clamp(1.05rem,1.8vw,1.25rem)] font-extrabold text-white no-underline";

export const accountApplyFormClass =
  "mx-auto mt-8 grid max-w-[980px] grid-cols-1 gap-x-5 gap-y-[22px] md:grid-cols-2 lg:grid-cols-3 max-[720px]:gap-y-[18px]";

export const formFieldClass =
  "flex flex-col gap-2 text-[0.95rem] font-semibold text-[#193c59]";

export const formFieldInputClass =
  "border-0 border-b border-[#aeb9c4] bg-transparent py-2 font-inherit text-[0.95rem] text-[#1b2f43] placeholder:text-[#9ea9b4] focus:border-[#1494da] focus:outline-none";

export const formActionsClass =
  "col-span-full mt-1.5 flex flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:gap-3.5";

export const modalCloseBtnClass =
  "absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border-0 bg-[#003d7a] text-[1.3rem] text-white shadow-[0_4px_12px_rgba(0,61,122,0.25)] transition-colors hover:bg-[#002a54] hover:shadow-[0_6px_16px_rgba(0,61,122,0.4)]";

export const accountModalBackdropClass =
  "fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-[rgba(10,24,39,0.5)] p-[18px]";

export const accountModalCardClass =
  "relative max-h-[90vh] w-[min(640px,100%)] overflow-y-auto rounded-2xl border border-[#d6ecfb] bg-gradient-to-br from-white via-[#f4fbff] to-white p-8 shadow-[0_24px_48px_rgba(6,22,40,0.25),0_8px_16px_rgba(20,148,218,0.15)]";

export const celebrationBadgeClass =
  "relative z-[1] mb-2.5 grid h-14 w-14 place-items-center rounded-full border border-[#c9e7f8] bg-gradient-to-b from-white to-[#e9f7ff] text-[1.7rem] shadow-[0_10px_24px_rgba(20,148,218,0.22)]";

export const accountSummaryGridClass =
  "relative z-[1] mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2";

export const accountSummaryCellClass =
  "rounded-[10px] border border-[#dae8f3] p-2.5 [&>span]:mb-1 [&>span]:block [&>span]:text-[0.82rem] [&>span]:text-[#607d96] [&>strong]:break-words [&>strong]:text-[0.95rem] [&>strong]:text-[#0d314b]";

export const profilePageWrapClass =
  "mx-auto mb-[50px] mt-[34px] w-[min(1100px,94%)] max-[900px]:w-[94%]";

export const profileCardClass =
  "rounded-2xl border border-[#d8e6f2] bg-gradient-to-br from-[#f9fdff] to-[#eef6fc] p-[22px] shadow-[0_14px_30px_rgba(18,45,68,0.1)]";

export const sectionSpacingClass = "mt-[34px]";

export const loanOverviewListClass =
  "mb-[18px] ml-5 list-disc p-0 text-base leading-[1.8] text-[#20384d] [&>li]:mb-1";

/* Mobile Responsive Header Styles */

export const mobileMenuBtnClass =
  "hidden max-[980px]:flex flex-col items-center justify-center w-10 h-10 gap-1.5 cursor-pointer hover:bg-[#eef5fb] rounded-md transition-colors";

export const mobileMenuOverlayClass =
  "fixed inset-0 z-20 bg-black/40 hidden max-[980px]:block";

export const mobileMenuPanelClass =
  "fixed top-0 right-0 h-screen z-30 w-[min(280px,75vw)] bg-white shadow-[-4px_0_12px_rgba(14,48,74,0.15)] border-l border-[#e8eef5] overflow-y-auto transition-transform duration-300 hidden max-[980px]:block p-4";

export const mobileMenuLinkClass =
  "block rounded-md px-3 py-2.5 text-[0.9rem] font-medium text-[#17324c] no-underline hover:bg-[#edf6ff] transition-colors";

export const mobileMenuSectionClass =
  "mb-4 pb-4 border-b border-[#e8eef5] last:border-b-0";

export const mobileMenuSectionTitleClass =
  "px-3 py-2 text-[0.8rem] font-bold uppercase tracking-wider text-[#607d96]";

export const userImageMobileClass =
  "flex items-center justify-center";
