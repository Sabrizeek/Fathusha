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

const validateEntry = async (body) => {
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
    const existing = await RecordBookEntry.findOne({
      studentId: DEMO_STUDENT_ID,
      weekNumber
    });

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
      weekNumber: Number(req.body.weekNumber),
      reportingPeriod: req.body.reportingPeriod.trim(),
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      tasksCompleted: req.body.tasksCompleted.trim(),
      challengesEncountered: req.body.challengesEncountered.trim(),
      reflectionAndLearningOutcomes: req.body.reflectionAndLearningOutcomes.trim(),
      skillsGained: req.body.skillsGained.map((skill) => String(skill).trim()).filter(Boolean)
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
    const entry = await RecordBookEntry.findOneAndUpdate(
      { _id: req.params.id, studentId: DEMO_STUDENT_ID },
      {
        ...req.body,
        studentId: DEMO_STUDENT_ID,
        skillsGained: Array.isArray(req.body.skillsGained) ? req.body.skillsGained : []
      },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Record book entry not found" });
    }

    res.json(entry);
  } catch (error) {
    next(error);
  }
};

export const deleteRecordBookEntry = async (req, res, next) => {
  try {
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
