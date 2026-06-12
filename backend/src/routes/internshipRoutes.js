import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import {
  approveForDevelopment,
  getInternshipProgress,
  markNotSelected,
  markSelected,
  submitOffer
} from "../controllers/internshipController.js";

const router = express.Router();
const offerLetterUploadDir = "src/uploads/offerLetters";

fs.mkdirSync(offerLetterUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: offerLetterUploadDir,
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(extension)) {
      return cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed."));
    }

    cb(null, true);
  }
});

router.get("/", getInternshipProgress);
router.get("/progress", getInternshipProgress);
router.post("/selected", markSelected);
router.post("/not-selected", markNotSelected);
router.post("/offer", upload.single("offerLetter"), submitOffer);
router.patch("/dev/approve", approveForDevelopment);

export default router;
