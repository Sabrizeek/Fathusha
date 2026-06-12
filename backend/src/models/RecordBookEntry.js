import mongoose from "mongoose";

const recordBookEntrySchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      index: true
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1
    },
    reportingPeriod: {
      type: String,
      trim: true,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    tasksCompleted: {
      type: String,
      trim: true,
      required: true
    },
    challengesEncountered: {
      type: String,
      trim: true,
      default: ""
    },
    reflectionAndLearningOutcomes: {
      type: String,
      trim: true,
      required: true
    },
    skillsGained: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

recordBookEntrySchema.index({ studentId: 1, weekNumber: 1 }, { unique: true });

export default mongoose.model("RecordBookEntry", recordBookEntrySchema);
