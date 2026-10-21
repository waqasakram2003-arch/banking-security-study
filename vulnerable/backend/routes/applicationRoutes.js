import express from "express";
import {
	createApplication,
	deleteApplication,
	getAllApplications,
	getApplicationDetails,
	updateApplication
} from "../controllers/applicationController.js";
import { upload } from "../helpers/fileUploadHelper.js";

const router = express.Router();

router.post("/", upload.single("userImage"), createApplication);
router.get("/", getAllApplications);
router.get("/:id", getApplicationDetails);
router.put("/:id", upload.single("userImage"), updateApplication);
router.delete("/:id", deleteApplication);

export default router;
