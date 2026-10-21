import mongoose from "mongoose";
import Account from "../models/accountModel.js";
import Application from "../models/applicationModel.js";
import Otp from "../models/otpModel.js";
import Transfer from "../models/transferModel.js";
import User from "../models/userModel.js";
import { validateApplicationPayload } from "../helpers/validationHelper.js";

function normalizeApplicationPayload(payload = {}) {
	return {
		...payload,
		cnic: payload.cnic ? String(payload.cnic).replace(/-/g, "").trim() : payload.cnic,
		email: payload.email ? String(payload.email).trim().toLowerCase() : payload.email,
		phone: payload.phone ? String(payload.phone).replace(/\s+/g, "").trim() : payload.phone
	};
}

function toProfileResponse(user, account, application) {
	return {
		userId: user._id,
		username: user.username,
		accountId: account?._id,
		applicationId: application?._id,
		fullName: application?.fullName,
		email: application?.email,
		cnic: application?.cnic,
		phone: application?.phone,
		address: application?.address,
		profileImage: application?.profileImage || "",
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
		const normalizedPayload = normalizeApplicationPayload(req.body);
		const validationErrors = validateApplicationPayload(normalizedPayload, { isPartial: true });
		if (validationErrors.length) {
			return res.status(400).json({ message: "Validation failed", errors: validationErrors });
		}

		const allowedUpdates = ["username", "email", "cnic", "phone", "address"];
		const payload = Object.fromEntries(
			Object.entries(normalizedPayload).filter(([key]) => allowedUpdates.includes(key))
		);

		const profile = await mongoose.connection.transaction(async (session) => {
			const user = await User.findById(req.params.userId).session(session);
			if (!user) {
				throw Object.assign(new Error("User not found"), { status: 404 });
			}

			const application = await Application.findById(user.application).session(session);
			if (!application) {
				throw Object.assign(new Error("Application not found"), { status: 404 });
			}

			if (payload.username) {
				const finalUsername = String(payload.username).trim();
				if (finalUsername.length < 3) {
					throw Object.assign(new Error("username must be at least 3 characters"), { status: 400 });
				}

				const existingUsername = await User.findOne({ username: finalUsername, _id: { $ne: user._id } }).session(session);
				if (existingUsername) {
					throw Object.assign(new Error("username already exists"), { status: 409 });
				}

				user.username = finalUsername;
			}

			const conflictQuery = [];
			if (payload.email) conflictQuery.push({ email: payload.email });
			if (payload.cnic) conflictQuery.push({ cnic: payload.cnic });
			if (payload.phone) conflictQuery.push({ phone: payload.phone });

			if (conflictQuery.length) {
				const duplicateApplication = await Application.findOne({
					$or: conflictQuery,
					_id: { $ne: application._id }
				}).session(session);

				if (duplicateApplication) {
					const duplicateFields = [];
					if (payload.email && duplicateApplication.email === payload.email) duplicateFields.push("email");
					if (payload.cnic && duplicateApplication.cnic === payload.cnic) duplicateFields.push("cnic");
					if (payload.phone && duplicateApplication.phone === payload.phone) duplicateFields.push("phone");

					throw Object.assign(new Error("Profile already exists with provided details"), {
						status: 409,
						errors: duplicateFields.map((field) => `${field} already exists`)
					});
				}
			}

			const applicationUpdates = { ...payload };
			delete applicationUpdates.username;

			if (Object.keys(applicationUpdates).length) {
				await Application.findByIdAndUpdate(application._id, applicationUpdates, {
					new: true,
					runValidators: true,
					session
				});
			}

			await user.save({ session });
			const account = await Account.findById(user.account).session(session);
			const updatedApplication = await Application.findById(application._id).session(session);

			return toProfileResponse(user, account, updatedApplication);
		});

		return res.status(200).json({
			message: "Account details updated successfully",
			profile
		});
	} catch (error) {
		if (error?.status) {
			return res.status(error.status).json({
				message: error.message,
				errors: error.errors || []
			});
		}

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
		const user = await User.findById(req.params.userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await Promise.all([
			Otp.deleteOne({ email: user.application?.email }),
			Transfer.deleteMany({
				$or: [
					{ senderUser: user._id },
					{ senderAccount: user.account },
					{ recipientAccount: user.account }
				]
			}),
			Account.findByIdAndDelete(user.account),
			Application.findByIdAndDelete(user.application),
			User.findByIdAndDelete(user._id)
		]);

		return res.status(200).json({ message: "Account profile deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
