import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Overview", disabled: true },
  { label: "GPA Calculator", disabled: true },
  { label: "CV Portfolio", disabled: true },
  { label: "InternshipStatus", to: "/", enabled: true },
  { label: "Record Book", to: "/record-book", requiresApproval: true }
];

const Header = ({ recordBookEnabled = false }) => {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-6">
        <div className="text-2xl font-bold tracking-wide">IMS</div>
        <nav className="flex flex-wrap items-center justify-center gap-3 text-base font-semibold md:gap-8">
          {navItems.map((item) => {
            const enabled = !item.disabled && (item.enabled || !item.requiresApproval || recordBookEnabled);

            if (!enabled) {
              return (
                <span
                  key={item.label}
                  className="cursor-not-allowed rounded px-2 py-2 text-white/55"
                  title={item.requiresApproval ? "Available after department approval" : "Not available in this standalone module"}
                >
                  {item.label}
                </span>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-2 py-2 transition ${
                    isActive ? "text-white" : "text-white/85 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <button className="rounded-lg border border-red-900 bg-blue-300 px-8 py-2 font-bold text-black">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
