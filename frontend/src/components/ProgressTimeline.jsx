const steps = [
  { key: "placementSearch", label: "Placement Search" },
  { key: "pendingApproval", label: "Pending Approval" },
  { key: "approved", label: "Approved" }
];

const ProgressTimeline = ({ progress }) => {
  return (
    <aside className="rounded border border-sky-200 bg-panel p-4 shadow-sm">
      <h2 className="text-sm font-semibold">Your Progress</h2>
      <div className="mt-4 space-y-0">
        {steps.map((step, index) => {
          const complete = Boolean(progress?.[step.key]);

          return (
            <div key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`h-4 w-4 rounded-full border ${
                    complete ? "border-navy bg-navy" : "border-slate-300 bg-white"
                  }`}
                />
                {index < steps.length - 1 && <span className="h-8 w-px bg-slate-300" />}
              </div>
              <span className={`text-sm ${complete ? "font-semibold text-ink" : "text-slate-500"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ProgressTimeline;
