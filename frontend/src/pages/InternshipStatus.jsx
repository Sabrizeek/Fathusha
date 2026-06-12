import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../api/client";

const initialForm = {
  companyName: "",
  jobPosition: "",
  internshipStartDate: "",
  offerLetter: null
};

const allowedFileTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const allowedFileExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

const getToday = () => new Date().toISOString().split("T")[0];

const isPastDate = (value) => value && value < getToday();

const isAllowedFile = (file) => {
  if (!file) return false;

  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return allowedFileTypes.includes(file.type) && allowedFileExtensions.includes(extension);
};

const progressSteps = [
  { key: "placementSearch", label: "Placement Search" },
  { key: "pendingApproval", label: "Pending Approval" },
  { key: "approved", label: "Approved" }
];

const InternshipStatus = ({ onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const application = status?.application;
  const progress = status?.progress;
  const isSelected = application?.selectionStatus === "selected";
  const isPending = application?.approvalStatus === "pending";
  const isApproved = application?.approvalStatus === "approved";
  const offerDisabled = !isSelected || application?.processPaused || isApproved;
  const savedOfferName =
    isSelected && (isPending || isApproved) ? application?.offerLetterOriginalName : "";

  const approvalLabel = useMemo(() => {
    const labels = {
      not_submitted: "Not Submitted",
      pending: "Waiting for Department Approval",
      approved: "Approved",
      rejected: "Rejected"
    };

    return labels[application?.approvalStatus] || "Not Submitted";
  }, [application?.approvalStatus]);

  const applyStatus = (payload) => {
    setStatus(payload);
    onStatusChange?.(payload);
  };

  const loadStatus = async () => {
    const response = await api.get("/internship/progress");
    applyStatus(response.data);
  };

  useEffect(() => {
    loadStatus()
      .catch(() => {
        setMessageType("error");
        setMessage("Backend is not reachable. Start the backend on port 5000.");
      })
      .finally(() => setLoading(false));
  }, []);

  const selectPlacement = async () => {
    setMessage("");
    const response = await api.post("/internship/selected");
    applyStatus(response.data);
    setForm(initialForm);
    setFileInputKey((current) => current + 1);
    setMessageType("success");
    setMessage("You can now formalize your offer.");
  };

  const pauseProcess = async () => {
    setMessage("");
    const response = await api.post("/internship/not-selected");
    applyStatus(response.data);
    setForm(initialForm);
    setFileInputKey((current) => current + 1);
    setMessageType("warning");
    setMessage(response.data.message || "Process Paused");
  };

  const validateOffer = () => {
    if (!form.companyName.trim()) return "Company name is required.";
    if (!form.jobPosition.trim()) return "Job position is required.";
    if (!form.internshipStartDate) return "Internship start date is required.";
    if (isPastDate(form.internshipStartDate)) return "Internship start date cannot be in the past.";
    if (!form.offerLetter) return "Offer letter is required.";
    if (!isAllowedFile(form.offerLetter)) return "File must be PDF, JPG, JPEG, or PNG.";
    return "";
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    setMessage("");

    const validationMessage = validateOffer();

    if (validationMessage) {
      setMessageType("error");
      setMessage(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append("companyName", form.companyName.trim());
      data.append("jobPosition", form.jobPosition.trim());
      data.append("internshipStartDate", form.internshipStartDate);
      data.append("offerLetter", form.offerLetter);

      const response = await api.post("/internship/offer", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      applyStatus(response.data);
      setForm(initialForm);
      setFileInputKey((current) => current + 1);
      setMessageType("success");
      setMessage(response.data.message || "Waiting for Department Approval");
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Unable to submit offer letter.");
    } finally {
      setSubmitting(false);
    }
  };

  const simulateApproval = async () => {
    setMessage("");

    try {
      const response = await api.patch("/internship/dev/approve");
      applyStatus(response.data);
      setMessageType("success");
      setMessage("Approved. Record Book is now enabled.");
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Unable to simulate approval.");
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-6xl flex-1 px-4 py-8 text-sm">Loading internship status...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Student Placement Step</p>
        <h1 className="text-2xl font-bold">Internship Status</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-700">
          Confirm your selection status, submit your offer letter, and wait for department approval.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_300px]">
        <button
          type="button"
          onClick={selectPlacement}
          className={`min-h-32 rounded border p-4 text-left shadow-sm transition ${
            isSelected
              ? "border-ocean bg-ocean text-white"
              : "border-sky-200 bg-panel text-ink hover:border-ocean"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded ${isSelected ? "bg-ink/25" : "bg-navy text-white"}`}>
              1
            </span>
            <span className="text-xs font-semibold uppercase">Select</span>
          </div>
          <h2 className="mt-4 text-base font-semibold">I Have Got Selected</h2>
          <p className="mt-2 text-sm leading-6">Choose this after receiving an internship offer from a company.</p>
        </button>

        <button
          type="button"
          onClick={pauseProcess}
          className={`min-h-32 rounded border p-4 text-left shadow-sm transition ${
            application?.selectionStatus === "not_selected"
              ? "border-ocean bg-ocean text-white"
              : "border-sky-200 bg-panel text-ink hover:border-ocean"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-navy text-white">2</span>
            <span className="text-xs font-semibold uppercase">Pause</span>
          </div>
          <h2 className="mt-4 text-base font-semibold">Not Selected Yet</h2>
          <p className="mt-2 text-sm leading-6">Choose this when you are still searching for an internship placement.</p>
        </button>

        <section className="rounded border border-sky-200 bg-panel p-4 shadow-sm">
          <h2 className="text-base font-semibold">Your Progress</h2>
          <div className="mt-4">
            {progressSteps.map((step, index) => {
              const complete = Boolean(progress?.[step.key]);

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-4 w-4 rounded-full border ${
                        complete ? "border-navy bg-navy" : "border-slate-300 bg-white"
                      }`}
                    />
                    {index < progressSteps.length - 1 && <span className="h-8 w-px bg-slate-300" />}
                  </div>
                  <span className={`text-sm ${complete ? "font-semibold text-ink" : "text-slate-500"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {message && (
        <div
          className={`mt-4 rounded border p-4 text-sm ${
            messageType === "error"
              ? "border-red-300 bg-red-50 text-red-800"
              : messageType === "warning"
                ? "border-amber-300 bg-amber-100 text-amber-900"
                : "border-sky-300 bg-sky-50 text-navy"
          }`}
        >
          {message}
        </div>
      )}

      <section className={`mt-5 overflow-hidden rounded border border-sky-200 bg-panel shadow-sm ${offerDisabled ? "opacity-75" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 bg-navy px-4 py-3 text-white">
          <h2 className="text-base font-semibold">Formalize Your Offer</h2>
          <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-navy">{approvalLabel}</span>
        </div>

        <form onSubmit={submitOffer} className="p-4">
          <fieldset disabled={offerDisabled || submitting} className="space-y-4 disabled:cursor-not-allowed">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-slate-700">
                Company Name
                <input
                  className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean disabled:bg-slate-100"
                  value={form.companyName}
                  onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                  required
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Job Position
                <input
                  className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean disabled:bg-slate-100"
                  value={form.jobPosition}
                  onChange={(event) => setForm({ ...form, jobPosition: event.target.value })}
                  required
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Internship Start Date
                <input
                  type="date"
                  min={getToday()}
                  className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean disabled:bg-slate-100"
                  value={form.internshipStartDate}
                  onChange={(event) => setForm({ ...form, internshipStartDate: event.target.value })}
                  required
                />
              </label>
            </div>

            <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded border border-dashed border-navy/70 bg-sky-100 px-4 text-center text-sm text-slate-700">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded bg-navy text-white">UP</span>
              {form.offerLetter?.name || savedOfferName || "Upload PDF, JPG, JPEG, or PNG offer letter"}
              <input
                key={fileInputKey}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="sr-only"
                onChange={(event) => setForm({ ...form, offerLetter: event.target.files?.[0] || null })}
                required
              />
            </label>
          </fieldset>

          {application?.processPaused && (
            <p className="mt-3 bg-amber-100 px-3 py-2 text-sm text-amber-900">Process Paused</p>
          )}

          {isPending && (
            <p className="mt-3 bg-white/70 px-3 py-2 text-sm text-navy">Waiting for Department Approval</p>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {isPending && (
              <button
                type="button"
                onClick={simulateApproval}
                className="rounded border border-navy px-4 py-2 text-sm font-semibold text-navy"
              >
                Simulate Department Approval
              </button>
            )}
            {isApproved && (
              <Link to="/record-book" className="rounded border border-navy px-4 py-2 text-sm font-semibold text-navy">
                Go to Record Book
              </Link>
            )}
            <button
              type="submit"
              disabled={offerDisabled || submitting}
              className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default InternshipStatus;
