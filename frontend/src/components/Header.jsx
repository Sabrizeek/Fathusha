import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Internship Status", to: "/", enabled: true },
  { label: "Record Book", to: "/record-book", requiresApproval: true }
];

const Header = ({ recordBookEnabled = false }) => {
  return (
    <header className="bg-ink text-white">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="text-sm font-semibold tracking-wide">IMS</div>
        <nav className="flex items-center gap-2 text-sm">
          {navItems.map((item) => {
            const enabled = item.enabled || !item.requiresApproval || recordBookEnabled;

            if (!enabled) {
              return (
                <span
                  key={item.to}
                  className="cursor-not-allowed rounded px-3 py-2 text-white/45"
                  title="Available after department approval"
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
                  `rounded px-3 py-2 transition ${
                    isActive ? "bg-white text-ink" : "text-white hover:bg-white/10"
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/10 text-xs">
          ST
        </div>
      </div>
    </header>
  );
};

export default Header;
