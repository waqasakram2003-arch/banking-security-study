import express from "express";
import { createFeedback, listFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.get("/", listFeedback);
router.post("/", createFeedback);

export default router;