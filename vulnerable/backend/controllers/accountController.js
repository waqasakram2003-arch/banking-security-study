import Account from "../models/accountModel.js";
import Application from "../models/applicationModel.js";
import User from "../models/userModel.js";
import { validateApplicationPayload } from "../helpers/validationHelper.js";
import { getImagePath, deleteImageFile } from "../helpers/fileUploadHelper.js";
import {
	deleteDemoAccount,
	deleteDemoUser,
	getDemoAccountByApplication,
	getDemoAccountById,
	getDemoProfile,
	isDemoMode,
	updateDemoUser
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

function toProfileResponse(user, account, application) {
	return {
		userId: user._id,
		username: user.username,
		accountId: account?._id,
		applicationId: application?._id,
		fullName: application?.fullName,
		userImage: application?.userImage,
		email: application?.email,
		cnic: application?.cnic,
		phone: application?.phone,
		address: application?.address,
		accountType: application?.accountType,
		status: application?.status,
		accountNumber: account?.accountNumber,
		iban: account?.iban,
		balance: account?.balance,
		createdAt: account?.createdAt || application?.createdAt
	};
}

export async function getSingleAccount(req, res) {
	try {
		if (isDemoMode()) {
			const account = await getDemoAccountById(req.params.id);
			if (!account) {
				return res.status(404).json({ message: "Account not found" });
			}

			return res.status(200).json(account);
		}

		const account = await Account.findById(req.params.id).populate("application");

		if (!account) {
			return res.status(404).json({ message: "Account not found" });
		}

		return res.status(200).json(account);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getAccountByApplication(req, res) {
	try {
		if (isDemoMode()) {
			const account = await getDemoAccountByApplication(req.params.applicationId);
			if (!account) {
				return res.status(404).json({ message: "Account not found" });
			}

			return res.status(200).json(account);
		}

		const account = await Account.findOne({ application: req.params.applicationId }).populate("application");

		if (!account) {
			return res.status(404).json({ message: "Account not found" });
		}

		return res.status(200).json(account);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function deleteAccount(req, res) {
	try {
		if (isDemoMode()) {
			const account = await getDemoAccountById(req.params.id);
			if (!account) {
				return res.status(404).json({ message: "Account not found" });
			}

			await deleteDemoAccount(account._id);
			return res.status(200).json({ message: "Account deleted successfully" });
		}

		const deletedAccount = await Account.findByIdAndDelete(req.params.id);

		if (!deletedAccount) {
			return res.status(404).json({ message: "Account not found" });
		}

		return res.status(200).json({ message: "Account deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getAccountProfile(req, res) {
	try {
		if (isDemoMode()) {
			const profile = await getDemoProfile(req.params.userId);
			if (!profile) {
				return res.status(404).json({ message: "Profile details not found" });
			}

			return res.status(200).json({ profile: profile.profile });
		}

		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const [account, application] = await Promise.all([
			Account.findById(user.account),
			Application.findById(user.application)
		]);

		if (!account || !application) {
			return res.status(404).json({ message: "Profile details not found" });
		}

		return res.status(200).json({ profile: toProfileResponse(user, account, application) });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function updateAccountProfile(req, res) {
	try {
		if (isDemoMode()) {
			const normalizedPayload = normalizeApplicationPayload(req.body, req.file);
			const validationErrors = validateApplicationPayload(normalizedPayload, { isPartial: true });
			if (validationErrors.length) {
				return res.status(400).json({ message: "Validation failed", errors: validationErrors });
			}

			const updatedUser = await updateDemoUser(req.params.userId, normalizedPayload);
			if (!updatedUser) {
				return res.status(404).json({ message: "User not found" });
			}

			const profile = await getDemoProfile(req.params.userId);
			return res.status(200).json({
				message: "Account details updated successfully",
				profile: profile?.profile
			});
		}

		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const normalizedPayload = normalizeApplicationPayload(req.body, req.file);
		const validationErrors = validateApplicationPayload(normalizedPayload, { isPartial: true });
		if (validationErrors.length) {
			return res.status(400).json({ message: "Validation failed", errors: validationErrors });
		}

		const allowedUpdates = ["username", "email", "cnic", "phone", "address", "userImage"];
		const payload = Object.fromEntries(
			Object.entries(normalizedPayload).filter(([key]) => allowedUpdates.includes(key))
		);

		if (payload.username) {
			const finalUsername = String(payload.username).trim();
			if (finalUsername.length < 3) {
				return res.status(400).json({ message: "username must be at least 3 characters" });
			}

			const existingUsername = await User.findOne({ username: finalUsername });
			if (existingUsername && String(existingUsername._id) !== String(user._id)) {
				return res.status(409).json({ message: "username already exists" });
			}

			user.username = finalUsername;
			await user.save();
			delete payload.username;
		}

		// If a new file is uploaded, delete the old one
		if (req.file) {
			const existingApp = await Application.findById(user.application);
			if (existingApp?.userImage) {
				deleteImageFile(existingApp.userImage);
			}
		}

		const updatedApplication = await Application.findByIdAndUpdate(user.application, payload, {
			new: true,
			runValidators: true
		});

		if (!updatedApplication) {
			return res.status(404).json({ message: "Application not found" });
		}

		const account = await Account.findById(user.account);
		return res.status(200).json({
			message: "Account details updated successfully",
			profile: toProfileResponse(user, account, updatedApplication)
		});
	} catch (error) {
		if (error?.code === 11000) {
			const duplicateFields = Object.keys(error.keyPattern || {});
			return res.status(409).json({
				message: "Profile already exists with provided details",
				errors: duplicateFields.map((field) => `${field} already exists`)
			});
		}

		return res.status(500).json({ message: error.message });
	}
}

export async function deleteAccountProfile(req, res) {
	try {
		if (isDemoMode()) {
			const profile = await getDemoProfile(req.params.userId);
			if (!profile) {
				return res.status(404).json({ message: "User not found" });
			}

			await deleteDemoUser(req.params.userId);
			return res.status(200).json({ message: "Account profile deleted successfully" });
		}

		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await Promise.all([
			Account.findByIdAndDelete(user.account),
			Application.findByIdAndDelete(user.application),
			User.findByIdAndDelete(user._id)
		]);

		return res.status(200).json({ message: "Account profile deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
