import mongoose from "mongoose";

const progressStatusSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    placementSearch: {
      type: Boolean,
      default: false
    },
    pendingApproval: {
      type: Boolean,
      default: false
    },
    approved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("ProgressStatus", progressStatusSchema);
