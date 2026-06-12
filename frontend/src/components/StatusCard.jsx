const StatusCard = ({ title, body, active, muted, action, icon }) => {
  return (
    <section
      className={`min-h-32 rounded border p-4 shadow-sm ${
        active
          ? "border-ocean bg-ocean text-white"
          : muted
            ? "border-slate-200 bg-white/60 text-slate-500"
            : "border-sky-200 bg-panel text-ink"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded text-sm ${
              active ? "bg-ink/25" : "bg-navy text-white"
            }`}
          >
            {icon}
          </span>
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      <p className="mt-3 text-sm leading-6">{body}</p>
    </section>
  );
};

export default StatusCard;
