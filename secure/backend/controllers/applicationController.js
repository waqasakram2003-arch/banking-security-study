import Application from "../models/applicationModel.js";
import Account from "../models/accountModel.js";
import Transaction from "../models/transactionModel.js";
import Otp from "../models/otpModel.js";
import Transfer from "../models/transferModel.js";
import User from "../models/userModel.js";
import { generateAccountNumber, generateIBAN } from "../helpers/accountCreationHelper.js";
import { validateApplicationPayload } from "../helpers/validationHelper.js";

function normalizeApplicationPayload(payload = {}) {
	return {
		...payload,
		cnic: payload.cnic ? String(payload.cnic).replace(/-/g, "").trim() : payload.cnic,
		email: payload.email ? String(payload.email).trim().toLowerCase() : payload.email,
		phone: payload.phone ? String(payload.phone).replace(/\s+/g, "").trim() : payload.phone,
		submittedByUserId: payload.submittedByUserId ? String(payload.submittedByUserId).trim() : "",
		profileImage: payload.profileImage ? String(payload.profileImage).trim() : "",
		startingBalance:
			payload.startingBalance === undefined || payload.startingBalance === null || payload.startingBalance === ""
				? undefined
				: Number(payload.startingBalance)
	};
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
		const payload = normalizeApplicationPayload(req.body);
		const validationErrors = validateApplicationPayload(payload);
		if (validationErrors.length) {
			return res.status(400).json({ message: "Validation failed", errors: validationErrors });
		}

		if (payload.submittedByUserId) {
			const existingUser = await User.findById(payload.submittedByUserId).populate("account").populate("application");
			if (existingUser?.account || existingUser?.application) {
				return res.status(409).json({
					message: "You are already using Public Bank Service. Sorry, you cannot create multiple accounts."
				});
			}
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

				const createdAccount = await Account.create({
					application: app._id,
					accountNumber: generateAccountNumber(),
					iban: generateIBAN(),
					balance: Number(payload.startingBalance)
				});

				try {
					await Transaction.create({
						user: payload.submittedByUserId || createdAccount._id,
						account: createdAccount._id,
						type: "initial",
						amount: Number(payload.startingBalance) || 0,
						description: "Initial balance - account created",
						referenceNumber: `INIT-${createdAccount._id}`
					});
				} catch (txErr) {
					console.error("Failed to create initial transaction:", txErr.message);
				}
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
		const applications = await Application.find().sort({ createdAt: -1 });
		return res.status(200).json(applications);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getApplicationDetails(req, res) {
	try {
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
		const validationErrors = validateApplicationPayload(req.body, { isPartial: true });
		if (validationErrors.length) {
			return res.status(400).json({ message: "Validation failed", errors: validationErrors });
		}

		const updatedApplication = await Application.findByIdAndUpdate(req.params.id, req.body, {
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
		const deletedApplication = await Application.findByIdAndDelete(req.params.id);

		if (!deletedApplication) {
			return res.status(404).json({ message: "Application not found" });
		}

		const relatedAccounts = await Account.find({ application: req.params.id }).select("_id");
		const relatedAccountIds = relatedAccounts.map((account) => account._id);
		const relatedUsers = await User.find({ application: req.params.id }).select("_id");
		const relatedUserIds = relatedUsers.map((user) => user._id);

		await Promise.all([
			Otp.deleteOne({ email: deletedApplication.email }),
			Transfer.deleteMany({
				$or: [
					{ senderUser: { $in: relatedUserIds } },
					{ senderAccount: { $in: relatedAccountIds } },
					{ recipientAccount: { $in: relatedAccountIds } }
				]
			}),
			Account.deleteMany({ application: req.params.id }),
			User.deleteMany({ application: req.params.id })
		]);

		return res.status(200).json({ message: "Application deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

