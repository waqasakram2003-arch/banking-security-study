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
    title: "",
    items: [
      "Unclaimed Deposits",
      "Branches Open on Saturday",
      "Internet Banking",
      "Financials",
      "Correspondent Banks",
      "Notice for Bank Locker Holders",
      "Notice for Pensioners"
    ]
  },
  {
    title: "",
    items: ["List of Branches designated for Same Day Clearing", "Sitemap"]
  }
];

function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Footer links">
      <div className="site-footer-grid">
        {footerColumns.map((column, index) => (
          <div key={`${column.title}-${index}`} className="site-footer-col">
            {column.title && <h3>{column.title}</h3>}
            <ul>
              {column.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

export default SiteFooter;