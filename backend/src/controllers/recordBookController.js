import { DEMO_STUDENT_ID } from "../config/demoStudent.js";
import InternshipApplication from "../models/InternshipApplication.js";
import RecordBookEntry from "../models/RecordBookEntry.js";

const unavailableMessage = "Record Book is not available yet.";

const getApprovedApplication = async () => {
  const application = await InternshipApplication.findOne({ studentId: DEMO_STUDENT_ID });

  if (application?.approvalStatus === "approved" && application?.recordBookEnabled) {
    return application;
  }

  return null;
};

const isEndDateAfterStartDate = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  return end > start;
};

const normalizeEntryPayload = (body) => ({
  weekNumber: Number(body.weekNumber),
  reportingPeriod: body.reportingPeriod.trim(),
  startDate: body.startDate,
  endDate: body.endDate,
  tasksCompleted: body.tasksCompleted.trim(),
  challengesEncountered: body.challengesEncountered.trim(),
  reflectionAndLearningOutcomes: body.reflectionAndLearningOutcomes.trim(),
  skillsGained: body.skillsGained.map((skill) => String(skill).trim()).filter(Boolean)
});

const validateEntry = async (body, ignoredEntryId = null) => {
  const errors = {};
  const weekNumber = Number(body.weekNumber);
  const skillsGained = Array.isArray(body.skillsGained) ? body.skillsGained : [];

  if (!body.weekNumber) {
    errors.weekNumber = "Week number is required.";
  } else if (!Number.isFinite(weekNumber) || weekNumber <= 0) {
    errors.weekNumber = "Week number must be positive.";
  }

  if (!body.reportingPeriod?.trim()) errors.reportingPeriod = "Reporting period is required.";
  if (!body.startDate) errors.startDate = "Start date is required.";
  if (!body.endDate) errors.endDate = "End date is required.";

  if (body.startDate && body.endDate && !isEndDateAfterStartDate(body.startDate, body.endDate)) {
    errors.endDate = "End date must be after start date.";
  }

  if (!body.tasksCompleted?.trim()) errors.tasksCompleted = "Tasks completed is required.";
  if (!body.challengesEncountered?.trim()) {
    errors.challengesEncountered = "Challenges encountered is required.";
  }
  if (!body.reflectionAndLearningOutcomes?.trim()) {
    errors.reflectionAndLearningOutcomes = "Reflection and learning outcomes are required.";
  }
  if (skillsGained.length === 0) errors.skillsGained = "At least one skill is required.";

  if (Number.isFinite(weekNumber) && weekNumber > 0) {
    const duplicateQuery = {
      studentId: DEMO_STUDENT_ID,
      weekNumber
    };

    if (ignoredEntryId) {
      duplicateQuery._id = { $ne: ignoredEntryId };
    }

    const existing = await RecordBookEntry.findOne(duplicateQuery);

    if (existing) {
      errors.weekNumber = "An entry for this week number already exists.";
    }
  }

  return errors;
};

export const getRecordBookAccess = async (_req, res, next) => {
  try {
    const canAccess = Boolean(await getApprovedApplication());

    if (!canAccess) {
      return res.json({ canAccess: false, reason: unavailableMessage });
    }

    res.json({ canAccess: true });
  } catch (error) {
    next(error);
  }
};

export const getRecordBookEntries = async (_req, res, next) => {
  try {
    const application = await getApprovedApplication();

    if (!application) {
      return res.status(403).json({ message: unavailableMessage });
    }

    const entries = await RecordBookEntry.find({ studentId: DEMO_STUDENT_ID }).sort({
      weekNumber: 1
    });

    res.json(entries);
  } catch (error) {
    next(error);
  }
};

export const createRecordBookEntry = async (req, res, next) => {
  try {
    const application = await getApprovedApplication();

    if (!application) {
      return res.status(403).json({ message: unavailableMessage });
    }

    const errors = await validateEntry(req.body);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const entry = await RecordBookEntry.create({
      studentId: DEMO_STUDENT_ID,
      ...normalizeEntryPayload(req.body)
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An entry for this week number already exists.",
        errors: { weekNumber: "An entry for this week number already exists." }
      });
    }

    next(error);
  }
};

export const updateRecordBookEntry = async (req, res, next) => {
  try {
    const application = await getApprovedApplication();

    if (!application) {
      return res.status(403).json({ message: unavailableMessage });
    }

    const errors = await validateEntry(req.body, req.params.id);

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const entry = await RecordBookEntry.findOneAndUpdate(
      { _id: req.params.id, studentId: DEMO_STUDENT_ID },
      {
        studentId: DEMO_STUDENT_ID,
        ...normalizeEntryPayload(req.body)
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Record book entry not found" });
    }

    res.json(entry);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An entry for this week number already exists.",
        errors: { weekNumber: "An entry for this week number already exists." }
      });
    }

    next(error);
  }
};

export const deleteRecordBookEntry = async (req, res, next) => {
  try {
    const application = await getApprovedApplication();

    if (!application) {
      return res.status(403).json({ message: unavailableMessage });
    }

    const entry = await RecordBookEntry.findOneAndDelete({
      _id: req.params.id,
      studentId: DEMO_STUDENT_ID
    });

    if (!entry) {
      return res.status(404).json({ message: "Record book entry not found" });
    }

    res.json({ message: "Record book entry deleted" });
  } catch (error) {
    next(error);
  }
};
