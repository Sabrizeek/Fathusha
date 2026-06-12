import { DEMO_STUDENT_ID } from "../config/demoStudent.js";
import InternshipApplication from "../models/InternshipApplication.js";
import ProgressStatus from "../models/ProgressStatus.js";

const defaultProgress = {
  studentId: DEMO_STUDENT_ID,
  placementSearch: false,
  pendingApproval: false,
  approved: false
};

const ensureInternshipState = async () => {
  let application = await InternshipApplication.findOne({ studentId: DEMO_STUDENT_ID });

  if (!application) {
    application = await InternshipApplication.create({ studentId: DEMO_STUDENT_ID });
  }

  let progress = await ProgressStatus.findOne({ studentId: DEMO_STUDENT_ID });

  if (!progress) {
    progress = await ProgressStatus.create(defaultProgress);
  }

  return { application, progress };
};

const updateProgress = async (progressData) => {
  return ProgressStatus.findOneAndUpdate(
    { studentId: DEMO_STUDENT_ID },
    { studentId: DEMO_STUDENT_ID, ...progressData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
};

const isPastDate = (value) => {
  const date = new Date(value);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return Number.isNaN(date.getTime()) || date < today;
};

export const getInternshipProgress = async (_req, res, next) => {
  try {
    const { application, progress } = await ensureInternshipState();

    res.json({
      demoStudentId: DEMO_STUDENT_ID,
      application,
      progress
    });
  } catch (error) {
    next(error);
  }
};

export const markSelected = async (_req, res, next) => {
  try {
    const { application: current } = await ensureInternshipState();

    const application = await InternshipApplication.findOneAndUpdate(
      { studentId: DEMO_STUDENT_ID },
      {
        selectionStatus: "selected",
        processPaused: false,
        approvalStatus: current.approvalStatus,
        recordBookEnabled: current.approvalStatus === "approved"
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const progress = await updateProgress({
      placementSearch: true,
      pendingApproval: application.approvalStatus === "pending",
      approved: application.approvalStatus === "approved"
    });

    res.json({ application, progress, message: "Selection status updated" });
  } catch (error) {
    next(error);
  }
};

export const markNotSelected = async (_req, res, next) => {
  try {
    const application = await InternshipApplication.findOneAndUpdate(
      { studentId: DEMO_STUDENT_ID },
      {
        selectionStatus: "not_selected",
        processPaused: true,
        approvalStatus: "not_submitted",
        recordBookEnabled: false
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const progress = await updateProgress({
      placementSearch: true,
      pendingApproval: false,
      approved: false
    });

    res.json({ application, progress, message: "Process Paused" });
  } catch (error) {
    next(error);
  }
};

export const submitOffer = async (req, res, next) => {
  try {
    const { companyName, jobPosition, internshipStartDate } = req.body;
    const { application: current } = await ensureInternshipState();

    if (current.selectionStatus !== "selected") {
      return res.status(400).json({
        message: 'Please select "I Have Got Selected" before submitting your offer.'
      });
    }

    if (!companyName?.trim()) {
      return res.status(400).json({ message: "Company name is required." });
    }

    if (!jobPosition?.trim()) {
      return res.status(400).json({ message: "Job position is required." });
    }

    if (!internshipStartDate) {
      return res.status(400).json({ message: "Internship start date is required." });
    }

    if (isPastDate(internshipStartDate)) {
      return res.status(400).json({ message: "Internship start date cannot be in the past." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Offer letter is required." });
    }

    const application = await InternshipApplication.findOneAndUpdate(
      { studentId: DEMO_STUDENT_ID },
      {
        selectionStatus: "selected",
        companyName: companyName.trim(),
        jobPosition: jobPosition.trim(),
        internshipStartDate,
        offerLetterPath: req.file.path,
        offerLetterOriginalName: req.file.originalname,
        approvalStatus: "pending",
        processPaused: false,
        recordBookEnabled: false
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const progress = await updateProgress({
      placementSearch: true,
      pendingApproval: true,
      approved: false
    });

    // Department notification would be triggered here in the full system.

    res.status(201).json({
      application,
      progress,
      message: "Waiting for Department Approval"
    });
  } catch (error) {
    next(error);
  }
};

export const approveForDevelopment = async (_req, res, next) => {
  try {
    const { application: current } = await ensureInternshipState();

    if (!current.offerLetterPath || current.approvalStatus !== "pending") {
      return res.status(400).json({
        message: "Offer must be submitted and pending before approval can be simulated."
      });
    }

    const application = await InternshipApplication.findOneAndUpdate(
      { studentId: DEMO_STUDENT_ID },
      {
        approvalStatus: "approved",
        recordBookEnabled: true,
        processPaused: false
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const progress = await updateProgress({
      placementSearch: true,
      pendingApproval: false,
      approved: true
    });

    res.json({ application, progress, message: "Department approval simulated" });
  } catch (error) {
    next(error);
  }
};
