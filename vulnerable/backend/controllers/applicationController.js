import Application from "../models/applicationModel.js";
import Account from "../models/accountModel.js";
import { generateAccountNumber, generateIBAN } from "../helpers/accountCreationHelper.js";
import { validateApplicationPayload } from "../helpers/validationHelper.js";
import { getImagePath, deleteImageFile } from "../helpers/fileUploadHelper.js";
import {
	createDemoApplication,
	deleteDemoApplication,
	getDemoAccountByApplication,
	getDemoApplicationById,
	isDemoMode,
	listDemoApplications
} from "../helpers/demoStore.js";

function normalizeApplicationPayload(payload = {}, fileData = {}) {
	const normalized = {
		...payload,
		cnic: payload.cnic ? String(payload.cnic).replace(/-/g, "").trim() : payload.cnic,
		email: payload.email ? String(payload.email).trim().toLowerCase() : payload.email,
		phone: payload.phone ? String(payload.phone).replace(/\s+/g, "").trim() : payload.phone,
		userImage: ""
	};

	// Handle file upload - if file exists, use the file path; otherwise use provided userImage
	if (fileData.filename) {
		normalized.userImage = getImagePath(fileData.filename);
	} else if (payload.userImage) {
		normalized.userImage = String(payload.userImage).trim();
	}

	return normalized;
}

function getDuplicateFields(existingDoc, payload) {
	const fields = [];
	if (existingDoc?.cnic === payload.cnic) fields.push("cnic");
	if (existingDoc?.email === payload.email) fields.push("email");
	if (existingDoc?.phone === payload.phone) fields.push("phone");
	return fields;
}

export async function createApplication(req, res) {
	try {
		const startingBalance = Number(req.body.startingBalance || 0);
		if (startingBalance < 1000 || startingBalance > 1000000) {
			return res.status(400).json({ message: "Starting balance must be between 1000 and 1000000" });
		}

		if (isDemoMode()) {
			const payload = normalizeApplicationPayload(req.body, req.file);
			const validationErrors = validateApplicationPayload(payload);
			if (validationErrors.length) {
				return res.status(400).json({ message: "Validation failed", errors: validationErrors });
			}

			const { application } = await createDemoApplication(payload);
			return res.status(201).json({
				message: "Application submitted successfully",
				applicationId: application._id,
				status: application.status
			});
		}

		const payload = normalizeApplicationPayload(req.body, req.file);
		const validationErrors = validateApplicationPayload(payload);
		if (validationErrors.length) {
			return res.status(400).json({ message: "Validation failed", errors: validationErrors });
		}

		const duplicateApplication = await Application.findOne({
			$or: [{ cnic: payload.cnic }, { email: payload.email }, { phone: payload.phone }]
		});

		if (duplicateApplication) {
			const duplicateFields = getDuplicateFields(duplicateApplication, payload);
			return res.status(409).json({
				message: "Application already exists with provided details",
				errors: duplicateFields.map((field) => `${field} already exists`)
			});
		}

		const app = await Application.create(payload);

		setTimeout(async () => {
			try {
				app.status = "approved";
				await app.save();

				await Account.create({
					application: app._id,
					accountNumber: generateAccountNumber(),
					iban: generateIBAN(),
					balance: startingBalance
				});
			} catch (error) {
				console.error("Auto-approval failed:", error.message);
			}
		}, 3000);

		return res.status(201).json({
			message: "Application submitted successfully",
			applicationId: app._id,
			status: app.status
		});
	} catch (error) {
		if (error?.code === 11000) {
			const duplicateFields = Object.keys(error.keyPattern || {});
			return res.status(409).json({
				message: "Application already exists with provided details",
				errors: duplicateFields.map((field) => `${field} already exists`)
			});
		}

		return res.status(500).json({ message: error.message });
	}
}

export async function getAllApplications(req, res) {
	try {
		if (isDemoMode()) {
			return res.status(200).json(await listDemoApplications());
		}

		const applications = await Application.find().sort({ createdAt: -1 });
		return res.status(200).json(applications);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getApplicationDetails(req, res) {
	try {
		if (isDemoMode()) {
			const app = await getDemoApplicationById(req.params.id);
			if (!app) {
				return res.status(404).json({ message: "Application not found" });
			}

			const account = await getDemoAccountByApplication(app._id);
			return res.status(200).json({ application: app, account });
		}

		const app = await Application.findById(req.params.id);

		if (!app) {
			return res.status(404).json({ message: "Application not found" });
		}

		const account = await Account.findOne({ application: app._id });

		return res.status(200).json({
			application: app,
			account
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function updateApplication(req, res) {
	try {
		if (isDemoMode()) {
			const app = await getDemoApplicationById(req.params.id);
			if (!app) {
				return res.status(404).json({ message: "Application not found" });
			}

			const updates = normalizeApplicationPayload(req.body, req.file);
			const updated = await Application.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
			return res.status(200).json(updated);
		}

		const updates = normalizeApplicationPayload(req.body, req.file);
		const validationErrors = validateApplicationPayload(updates, { isPartial: true });
		if (validationErrors.length) {
			return res.status(400).json({ message: "Validation failed", errors: validationErrors });
		}

		// If a new file is uploaded, delete the old one
		if (req.file) {
			const existingApp = await Application.findById(req.params.id);
			if (existingApp?.userImage) {
				deleteImageFile(existingApp.userImage);
			}
		}

		const updatedApplication = await Application.findByIdAndUpdate(req.params.id, updates, {
			new: true,
			runValidators: true
		});

		if (!updatedApplication) {
			return res.status(404).json({ message: "Application not found" });
		}

		return res.status(200).json(updatedApplication);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function deleteApplication(req, res) {
	try {
		if (isDemoMode()) {
			const deleted = await deleteDemoApplication(req.params.id);
			if (!deleted) {
				return res.status(404).json({ message: "Application not found" });
			}

			return res.status(200).json({ message: "Application deleted successfully" });
		}

		const deletedApplication = await Application.findByIdAndDelete(req.params.id);

		if (!deletedApplication) {
			return res.status(404).json({ message: "Application not found" });
		}

		// Delete the uploaded image file if it exists
		if (deletedApplication.userImage) {
			deleteImageFile(deletedApplication.userImage);
		}

		await Account.deleteMany({ application: req.params.id });

		return res.status(200).json({ message: "Application deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

