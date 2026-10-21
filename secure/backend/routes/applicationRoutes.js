import express from "express";
import {
	createApplication,
	deleteApplication,
	getAllApplications,
	getApplicationDetails,
	updateApplication
} from "../controllers/applicationController.js";

const router = express.Router();

router.post("/", createApplication);
router.get("/", getAllApplications);
router.get("/:id", getApplicationDetails);
router.put("/:id", updateApplication);
router.delete("/:id", deleteApplication);

export default router;
