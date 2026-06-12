import mongoose from "mongoose";
import { DEMO_STUDENT_ID } from "../config/demoStudent.js";

const internshipApplicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      default: DEMO_STUDENT_ID,
      index: true
    },
    selectionStatus: {
      type: String,
      enum: ["not_started", "selected", "not_selected"],
      default: "not_started"
    },
    companyName: {
      type: String,
      trim: true,
      default: ""
    },
    jobPosition: {
      type: String,
      trim: true,
      default: ""
    },
    internshipStartDate: {
      type: Date,
      default: null
    },
    offerLetterPath: {
      type: String,
      default: ""
    },
    offerLetterOriginalName: {
      type: String,
      default: ""
    },
    approvalStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted"
    },
    processPaused: {
      type: Boolean,
      default: false
    },
    recordBookEnabled: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("InternshipApplication", internshipApplicationSchema);
