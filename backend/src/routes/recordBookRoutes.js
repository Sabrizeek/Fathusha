import express from "express";
import {
  createRecordBookEntry,
  deleteRecordBookEntry,
  getRecordBookAccess,
  getRecordBookEntries,
  updateRecordBookEntry
} from "../controllers/recordBookController.js";

const router = express.Router();

router.get("/access", getRecordBookAccess);
router.get("/", getRecordBookEntries);
router.post("/entry", createRecordBookEntry);
router.post("/", createRecordBookEntry);
router.put("/:id", updateRecordBookEntry);
router.delete("/:id", deleteRecordBookEntry);

export default router;
