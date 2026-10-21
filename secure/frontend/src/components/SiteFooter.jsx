const footerColumns = [
  {
    title: "Segments",
    items: ["Personal", "Business", "Islamic", "ASCEND Priority"]
  },
  {
    title: "Products",
    items: [
      "Personal Loan",
      "Mortgage Finance",
      "ATM Locator",
      "Locker Facility (PKR)",
      "Rent-Free Locker (USD)"
    ]
  },
  {
    title: "Quick Links",
    items: [
      "SOC Archives",
      "Public Notice",
      "Schedule of Charges",
      "Schedule of Charges (Urdu)",
      "Addendum to Schedule of Charges English"
    ]
  },
  {
    title: "",
    items: [
      "Addendum to Schedule of Charges Urdu",
      "Schedule of Charges-Islamic",
      "Schedule of Charges (Branchless Banking)",
      "Schedule of Charges (Branchless Banking Urdu)",
      "Investment in Government Securities through AKBL IPS Account Services",
      "Conventional Rates",
      "Islamic Rates"
    ]
  },
  {
    title: "Contact",
    items: ["WhatsApp +923053424543", "Helpline +923053434543"]
  }
];

function SiteFooter() {
  return (
    <footer className="mt-[26px] bg-[#ececec] pb-[34px] pt-11 max-[720px]:pb-5 max-[720px]:pt-[26px]" aria-label="Footer links">
      <style>{`
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.5; }
        }
        .whatsapp-blink {
          animation: blink 1.5s infinite;
        }
      `}</style>
      
      <div className="mx-auto grid w-[min(1280px,96%)] grid-cols-1 gap-[18px] min-[721px]:grid-cols-3 min-[981px]:grid-cols-5 min-[981px]:[&>div:last-child]:ml-auto">
        {footerColumns.map((column, index) => (
          <div key={`${column.title}-${index}`}>
            {column.title ? (
              <h3 className="mb-3.5 text-[1.02rem] font-extrabold text-[#21252b] max-[720px]:mb-2.5 max-[980px]:text-[1.18rem]">
                {column.title}
              </h3>
            ) : null}
            <ul className="m-0 list-none p-0">
              {column.items.map((item) => {
                let link = null;
                let href = "#";
                let bgColor = "";
                let hoverColor = "";
                let textColor = "text-[#444d56]";
                
                if (item.includes("WhatsApp")) {
                  href = "https://wa.me/923053424543";
                  bgColor = "bg-[#25D366]";
                  hoverColor = "hover:bg-[#1fa855]";
                  textColor = "text-white";
                } else if (item.includes("Helpline")) {
                  href = "tel:+923053434543";
                  bgColor = "bg-[#007BFF]";
                  hoverColor = "hover:bg-[#0056b3]";
                  textColor = "text-white";
                }
                
                const isLink = href !== "#";
                return (
                  <li
                    key={item}
                    className="mb-3.5 text-[0.83rem] leading-snug max-[720px]:mb-2.5 max-[980px]:text-[0.95rem]"
                  >
                    {isLink ? (
                      <a href={href} className={`${bgColor} ${hoverColor} ${textColor} font-semibold cursor-pointer px-3 py-2 rounded-lg inline-block transition-colors`}>
                        {item}
                      </a>
                    ) : (
                      <span className="text-[#444d56] cursor-default">{item}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

export default SiteFooter;
