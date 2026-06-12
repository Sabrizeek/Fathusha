import { useEffect, useState } from "react";
import api from "../api/client";

const blankEntry = {
  weekNumber: "",
  reportingPeriod: "",
  startDate: "",
  endDate: "",
  tasksCompleted: "",
  challengesEncountered: "",
  reflectionAndLearningOutcomes: "",
  skillsGained: []
};

const toDateInputValue = (value) => {
  if (!value) return "";

  return new Date(value).toISOString().split("T")[0];
};

const RecordBook = () => {
  const [canAccess, setCanAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [entries, setEntries] = useState([]);
  const [skills, setSkills] = useState([]);
  const [entry, setEntry] = useState(blankEntry);
  const [customSkill, setCustomSkill] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [deletingEntryId, setDeletingEntryId] = useState("");

  const loadEntries = async () => {
    const response = await api.get("/recordbook");
    setEntries(response.data);
  };

  const loadSkills = async () => {
    const response = await api.get("/skills");
    setSkills(response.data);
  };

  const loadPage = async () => {
    const accessResponse = await api.get("/recordbook/access");
    setCanAccess(accessResponse.data.canAccess);

    if (!accessResponse.data.canAccess) {
      setMessage(accessResponse.data.reason || "Record Book is not available yet.");
      return;
    }

    await Promise.all([loadEntries(), loadSkills()]);
  };

  useEffect(() => {
    loadPage()
      .catch((error) => {
        setCanAccess(false);
        setMessage(error.response?.data?.message || "Record Book is not available yet.");
      })
      .finally(() => setAccessChecked(true));
  }, []);

  const updateEntry = (field, value) => {
    setEntry((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const toggleSkill = (name) => {
    setEntry((current) => {
      const exists = current.skillsGained.includes(name);

      return {
        ...current,
        skillsGained: exists
          ? current.skillsGained.filter((skill) => skill !== name)
          : [...current.skillsGained, name]
      };
    });
    setErrors((current) => ({ ...current, skillsGained: "" }));
  };

  const validateEntry = () => {
    const nextErrors = {};
    const weekNumber = Number(entry.weekNumber);

    if (!entry.weekNumber) nextErrors.weekNumber = "Week number is required.";
    else if (!Number.isFinite(weekNumber) || weekNumber <= 0) {
      nextErrors.weekNumber = "Week number must be positive.";
    }

    if (!entry.reportingPeriod.trim()) nextErrors.reportingPeriod = "Reporting period is required.";
    if (!entry.startDate) nextErrors.startDate = "Start date is required.";
    if (!entry.endDate) nextErrors.endDate = "End date is required.";
    if (entry.startDate && entry.endDate && entry.endDate <= entry.startDate) {
      nextErrors.endDate = "End date must be after start date.";
    }
    if (!entry.tasksCompleted.trim()) nextErrors.tasksCompleted = "Tasks completed is required.";
    if (!entry.challengesEncountered.trim()) {
      nextErrors.challengesEncountered = "Challenges encountered is required.";
    }
    if (!entry.reflectionAndLearningOutcomes.trim()) {
      nextErrors.reflectionAndLearningOutcomes = "Reflection and learning outcomes are required.";
    }
    if (entry.skillsGained.length === 0) nextErrors.skillsGained = "At least one skill is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const addSkill = async () => {
    const name = customSkill.trim();

    if (!name || addingSkill) {
      return;
    }

    setAddingSkill(true);
    setMessage("");

    try {
      const response = await api.post("/skills", { name });
      const savedSkill = response.data;

      setSkills((current) => {
        const exists = current.some((skill) => skill._id === savedSkill._id);
        const next = exists ? current : [...current, savedSkill];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      setEntry((current) => ({
        ...current,
        skillsGained: current.skillsGained.includes(savedSkill.name)
          ? current.skillsGained
          : [...current.skillsGained, savedSkill.name]
      }));
      setCustomSkill("");
      setErrors((current) => ({ ...current, skillsGained: "" }));
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to add skill.");
    } finally {
      setAddingSkill(false);
    }
  };

  const submitEntry = async (event) => {
    event.preventDefault();
    setMessage("");

    if (submitting || !validateEntry()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...entry,
        weekNumber: Number(entry.weekNumber)
      };

      if (editingEntryId) {
        await api.put(`/recordbook/${editingEntryId}`, payload);
      } else {
        await api.post("/recordbook/entry", payload);
      }

      setMessage(editingEntryId ? "Weekly log updated successfully." : "Weekly log saved successfully.");
      setEntry(blankEntry);
      setEditingEntryId("");
      setErrors({});
      await loadEntries();
    } catch (error) {
      setErrors(error.response?.data?.errors || {});
      setMessage(error.response?.data?.message || "Unable to save weekly log.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (saved) => {
    setEditingEntryId(saved._id);
    setEntry({
      weekNumber: String(saved.weekNumber),
      reportingPeriod: saved.reportingPeriod || "",
      startDate: toDateInputValue(saved.startDate),
      endDate: toDateInputValue(saved.endDate),
      tasksCompleted: saved.tasksCompleted || "",
      challengesEncountered: saved.challengesEncountered || "",
      reflectionAndLearningOutcomes: saved.reflectionAndLearningOutcomes || "",
      skillsGained: Array.isArray(saved.skillsGained) ? saved.skillsGained : []
    });
    setErrors({});
    setMessage("Editing weekly log entry.");
  };

  const cancelEdit = () => {
    setEditingEntryId("");
    setEntry(blankEntry);
    setErrors({});
    setMessage("");
  };

  const deleteEntry = async (saved) => {
    const shouldDelete = window.confirm(`Delete Week ${saved.weekNumber} entry?`);

    if (!shouldDelete || deletingEntryId) {
      return;
    }

    setDeletingEntryId(saved._id);
    setMessage("");

    try {
      await api.delete(`/recordbook/${saved._id}`);

      if (editingEntryId === saved._id) {
        cancelEdit();
      }

      setMessage("Weekly log deleted successfully.");
      await loadEntries();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete weekly log.");
    } finally {
      setDeletingEntryId("");
    }
  };

  const errorText = (field) =>
    errors[field] ? <p className="mt-1 text-xs font-semibold text-red-700">{errors[field]}</p> : null;

  if (!accessChecked) {
    return <main className="mx-auto max-w-6xl flex-1 px-4 py-8 text-sm">Loading record book...</main>;
  }

  if (!canAccess) {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <section className="rounded border border-amber-300 bg-amber-100 p-5 text-sm text-amber-900 shadow-sm">
          {message || "Record Book is not available yet."}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy">Weekly Internship Log</p>
        <h1 className="text-2xl font-bold">Internship Record Book</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-700">
          Record your weekly tasks, challenges, learning outcomes, and skills gained during the internship.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded border border-sky-300 bg-sky-50 p-4 text-sm text-navy">
          {message}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded border border-sky-200 bg-panel shadow-sm">
          <div className="bg-navy px-4 py-3 text-white">
            <h2 className="text-base font-semibold">
              {editingEntryId ? "Edit Weekly Log" : "Weekly Log Form"}
            </h2>
          </div>

          <form onSubmit={submitEntry} className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-slate-700">
                Week Number
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                  value={entry.weekNumber}
                  onChange={(event) => updateEntry("weekNumber", event.target.value)}
                />
                {errorText("weekNumber")}
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Start Date
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                  value={entry.startDate}
                  onChange={(event) => updateEntry("startDate", event.target.value)}
                />
                {errorText("startDate")}
              </label>
              <label className="text-xs font-semibold text-slate-700">
                End Date
                <input
                  type="date"
                  className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                  value={entry.endDate}
                  onChange={(event) => updateEntry("endDate", event.target.value)}
                />
                {errorText("endDate")}
              </label>
            </div>

            <label className="block text-xs font-semibold text-slate-700">
              Reporting Period
              <input
                className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                value={entry.reportingPeriod}
                onChange={(event) => updateEntry("reportingPeriod", event.target.value)}
                placeholder="Week 1: June 3 - June 7"
              />
              {errorText("reportingPeriod")}
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Tasks Completed
              <textarea
                rows="4"
                className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                value={entry.tasksCompleted}
                onChange={(event) => updateEntry("tasksCompleted", event.target.value)}
              />
              {errorText("tasksCompleted")}
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Challenges Encountered
              <textarea
                rows="3"
                className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                value={entry.challengesEncountered}
                onChange={(event) => updateEntry("challengesEncountered", event.target.value)}
              />
              {errorText("challengesEncountered")}
            </label>

            <label className="block text-xs font-semibold text-slate-700">
              Reflection and Learning Outcomes
              <textarea
                rows="4"
                className="mt-1 w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                value={entry.reflectionAndLearningOutcomes}
                onChange={(event) => updateEntry("reflectionAndLearningOutcomes", event.target.value)}
              />
              {errorText("reflectionAndLearningOutcomes")}
            </label>

            <div>
              <p className="text-xs font-semibold text-slate-700">Skills Gained This Week</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    key={skill._id}
                    type="button"
                    onClick={() => toggleSkill(skill.name)}
                    className={`rounded border px-3 py-1 text-sm transition ${
                      entry.skillsGained.includes(skill.name)
                        ? "border-navy bg-navy text-white"
                        : "border-sky-200 bg-white text-ink hover:border-ocean"
                    }`}
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
              {errorText("skillsGained")}

              <div className="mt-3 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:border-ocean"
                  value={customSkill}
                  onChange={(event) => setCustomSkill(event.target.value)}
                  placeholder="Add a new skill"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={addingSkill}
                  className="rounded bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Add Skill
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              {editingEntryId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="mr-2 rounded border border-navy px-5 py-2 text-sm font-semibold text-navy"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-navy px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingEntryId ? "Update Weekly Log" : "Save Weekly Log"}
              </button>
            </div>
          </form>
        </section>

        <aside className="rounded border border-sky-200 bg-panel p-4 shadow-sm">
          <h2 className="text-base font-semibold">Existing Weekly Entries</h2>
          <div className="mt-4 space-y-3">
            {entries.length === 0 && <p className="text-sm text-slate-600">No weekly entries saved yet.</p>}
            {entries.map((saved) => (
              <article key={saved._id} className="rounded border border-sky-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-navy">Week {saved.weekNumber}</h3>
                  <span className="text-right text-xs text-slate-500">{saved.reportingPeriod}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Tasks Completed</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{saved.tasksCompleted}</p>
                <p className="mt-3 text-sm font-semibold text-slate-700">Learning Outcomes</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{saved.reflectionAndLearningOutcomes}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {saved.skillsGained.map((skill) => (
                    <span key={skill} className="rounded bg-sky-100 px-2 py-1 text-xs text-navy">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(saved)}
                    className="rounded border border-navy px-3 py-1 text-xs font-semibold text-navy"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEntry(saved)}
                    disabled={deletingEntryId === saved._id}
                    className="rounded border border-red-300 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-50"
                  >
                    {deletingEntryId === saved._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
};

export default RecordBook;
