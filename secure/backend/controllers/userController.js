import Application from "../models/applicationModel.js";
import Account from "../models/accountModel.js";
import Otp from "../models/otpModel.js";
import Transfer from "../models/transferModel.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import path from "path";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import { fileURLToPath } from "url";
import { generateAuthToken, sanitizeUser } from "../helpers/authHelper.js";
import { isStrongEnoughPassword } from "../helpers/validationHelper.js";

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BANK_LOGO_PATH = path.resolve(
	__dirname,
	"../../frontend-secure/public/images/about/small-logo.png"
);

function getMailTransporter() {
	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_APP_PASSWORD
		}
	});
}

function normalizeSignupPayload(payload = {}) {
	return {
		accountNumber: String(payload.accountNumber || "").trim(),
		cnic: String(payload.cnic || "").replace(/-/g, "").trim(),
		email: String(payload.email || "").trim().toLowerCase(),
		username: String(payload.username || "").trim(),
		password: String(payload.password || ""),
		confirmPassword: String(payload.confirmPassword || ""),
		transactionPin: String(payload.transactionPin || "").trim(),
		confirmTransactionPin: String(payload.confirmTransactionPin || "").trim()
	};
}

function normalizeOtpPayload(payload = {}) {
	return {
		email: String(payload.email || "").trim().toLowerCase(),
		otp: String(payload.otp || "").trim()
	};
}

async function sendOtpEmail(email, otp) {
	if (!process.env.MAIL_USER || !process.env.MAIL_APP_PASSWORD) {
		throw new Error("Mail credentials are missing in environment variables");
	}

	const transporter = getMailTransporter();
	const logoCid = "bank-logo@secure-banking";
	const displayName = "Public Bank Secure Banking";
	const html = `
		<div style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,Helvetica,sans-serif;">
			<div style="max-width:560px;margin:0 auto;padding:24px 12px;">
				<div style="background:#0d4f82;border-radius:16px 16px 0 0;padding:18px 20px;text-align:center;">
					<img src="cid:${logoCid}" alt="Public Bank" style="display:block;margin:0 auto 10px;width:84px;height:auto;" />
					<div style="color:#dbeeff;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;">Secure Banking Verification</div>
				</div>
				<div style="background:#ffffff;border:1px solid #d9e6f2;border-top:none;border-radius:0 0 16px 16px;padding:22px 20px;">
					<h1 style="margin:0 0 10px;color:#0f2f4b;font-size:22px;line-height:1.3;text-align:center;">Your OTP Code</h1>
					<p style="margin:0 0 16px;color:#34526d;font-size:14px;line-height:1.6;text-align:center;">Use this code to complete your signup. It expires in 5 minutes.</p>
					<div style="margin:18px 0;padding:14px 16px;border-radius:12px;background:#eef6ff;border:1px solid #c8dbed;text-align:center;">
						<div style="color:#59748b;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;margin-bottom:4px;">OTP</div>
						<div style="font-size:28px;letter-spacing:4px;font-weight:800;color:#0a4e84;">${otp}</div>
					</div>
					<p style="margin:0;color:#5c7288;font-size:12px;line-height:1.55;text-align:center;">If you did not request this code, ignore this email.</p>
				</div>
			</div>
		</div>
	`;

	await transporter.sendMail({
		from: `"${displayName}" <${process.env.MAIL_USER}>`,
		to: email,
		subject: "Your OTP Code",
		text: `Your OTP is ${otp}. It expires in 5 minutes.`,
		html,
		attachments: [
			{
				filename: "small-logo.png",
				path: BANK_LOGO_PATH,
				cid: logoCid
			}
		]
	});
}

function buildExistingUserResponse(existingUser, application, account) {
	return {
		message: "User already signed up",
		userId: existingUser._id,
		username: existingUser.username,
		applicationId: application._id,
		accountNumber: account.accountNumber,
		email: application.email,
		cnic: application.cnic,
		loginRequired: true
	};
}

async function validateSignupEligibility(payload, { allowExistingUser = true } = {}) {
	const { accountNumber, cnic, email, username, password, confirmPassword, transactionPin, confirmTransactionPin } = payload;

	if (!accountNumber) {
		return { error: { status: 400, message: "accountNumber is required" } };
	}

	if (!cnic) {
		return { error: { status: 400, message: "cnic is required" } };
	}

	if (!email) {
		return { error: { status: 400, message: "email is required" } };
	}

	if (!username) {
		return { error: { status: 400, message: "username is required" } };
	}

	if (!password) {
		return { error: { status: 400, message: "password is required" } };
	}

	if (confirmPassword && confirmPassword !== password) {
		return { error: { status: 400, message: "password and confirmPassword must match" } };
	}

	if (!isStrongEnoughPassword(password)) {
		return { error: { status: 400, message: "password must be at least 8 characters" } };
	}

	if (!transactionPin) {
		return { error: { status: 400, message: "transactionPin is required" } };
	}

	if (transactionPin.length !== 4 || !/^\d+$/.test(transactionPin)) {
		return { error: { status: 400, message: "Transaction PIN must be exactly 4 digits" } };
	}

	if (confirmTransactionPin && confirmTransactionPin !== transactionPin) {
		return { error: { status: 400, message: "transactionPin and confirmTransactionPin must match" } };
	}

	const account = await Account.findOne({ accountNumber });
	if (!account) {
		return { error: { status: 404, message: "Account not found" } };
	}

	const application = await Application.findById(account.application);

	if (!application) {
		return { error: { status: 404, message: "Application not found" } };
	}

	if (String(application.cnic) !== cnic) {
		return { error: { status: 400, message: "CNIC must match the application record" } };
	}

	if (String(application.email).trim().toLowerCase() !== email) {
		return { error: { status: 400, message: "Email must match the application record" } };
	}

	const existingUser = await User.findOne({ application: application._id });
	if (existingUser) {
		if (allowExistingUser) {
			return { existingUser, account, application };
		}

		return {
			error: {
				status: 409,
				message: "User already signed up. Please login with username and password."
			}
		};
	}

	const finalUsername = username || String(application.fullName || "").trim().replace(/\s+/g, " ");

	if (finalUsername.length < 3) {
		return { error: { status: 400, message: "username must be at least 3 characters" } };
	}

	const usernameOwner = await User.findOne({ username: finalUsername });
	if (usernameOwner && String(usernameOwner.application) !== String(application._id)) {
		return {
			error: {
				status: 409,
				message: "This username already exists for another customer. Please contact bank support."
			}
		};
	}

	return { account, application, finalUsername };
}

async function createUserFromPayload(payload) {
	const eligibility = await validateSignupEligibility(payload, { allowExistingUser: true });

	if (eligibility.error) {
		return { error: eligibility.error };
	}

	if (eligibility.existingUser) {
		return {
			existingUserResponse: buildExistingUserResponse(
				eligibility.existingUser,
				eligibility.application,
				eligibility.account
			)
		};
	}

	const hashedPassword = await bcrypt.hash(payload.password, 12);
	const hashedTransactionPin = await bcrypt.hash(payload.transactionPin, 12);

	const user = await User.create({
		application: eligibility.application._id,
		account: eligibility.account._id,
		username: eligibility.finalUsername,
		password: hashedPassword,
		transactionPin: hashedTransactionPin
	});

	const populatedUser = await User.findById(user._id)
		.populate("account")
		.populate("application");

	const token = generateAuthToken(user._id);

	return {
		signupResponse: {
			message: "Signup successful",
			userId: user._id,
			username: user.username,
			token,
			accountId: eligibility.account._id,
			accountNumber: eligibility.account.accountNumber,
			email: eligibility.application.email,
			cnic: eligibility.application.cnic,
			user: sanitizeUser(populatedUser),
			autoGenerated: {
				username: false,
				password: false
			}
		}
	};
}

export async function signupUser(req, res) {
	try {
		const payload = normalizeSignupPayload(req.body);
		const result = await createUserFromPayload(payload);

		if (result.error) {
			return res.status(result.error.status).json({ message: result.error.message });
		}

		if (result.existingUserResponse) {
			return res.status(200).json(result.existingUserResponse);
		}

		return res.status(201).json(result.signupResponse);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function sendOtpForSignup(req, res) {
	try {
		const payload = normalizeSignupPayload(req.body);
		const eligibility = await validateSignupEligibility(payload, { allowExistingUser: false });

		if (eligibility.error) {
			return res.status(eligibility.error.status).json({ message: eligibility.error.message });
		}

		const otp = otpGenerator.generate(7, {
			digits: true,
			alphabets: true,
			upperCase: false,
			specialChars: false
		});

		const hashedOtp = await bcrypt.hash(otp, 10);

		await Otp.findOneAndUpdate(
			{ email: payload.email },
			{
				email: payload.email,
				otp: hashedOtp,
				expiresAt: new Date(Date.now() + OTP_EXPIRY_MS)
			},
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);

		await sendOtpEmail(payload.email, otp);

		return res.status(200).json({
			message: "OTP sent to your email",
			email: payload.email,
			expiresInSeconds: 300
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function verifyOtpAndSignup(req, res) {
	try {
		const payload = normalizeSignupPayload(req.body);
		const { otp } = normalizeOtpPayload(req.body);

		if (!otp || !/^[a-zA-Z0-9]{7}$/.test(String(otp))) {
			return res.status(400).json({ message: "otp must be a 7 character alphanumeric code" });
		}

		const otpRecord = await Otp.findOne({ email: payload.email });

		if (!otpRecord) {
			return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
		}

		if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
			await Otp.deleteOne({ _id: otpRecord._id });
			return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
		}

		const isValidOtp = await bcrypt.compare(otp, otpRecord.otp);
		if (!isValidOtp) {
			return res.status(400).json({ message: "Invalid OTP" });
		}

		const result = await createUserFromPayload(payload);

		if (result.error) {
			return res.status(result.error.status).json({ message: result.error.message });
		}

		if (result.existingUserResponse) {
			return res.status(200).json(result.existingUserResponse);
		}

		await Otp.deleteOne({ _id: otpRecord._id });

		return res.status(201).json(result.signupResponse);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function loginUser(req, res) {
	try {
		const { username, password } = req.body;
		if (!username || !password) {
			return res.status(400).json({ message: "username and password are required" });
		}

		const user = await User.findOne({ username })
			.select("+password")
			.populate("account")
			.populate("application");

		if (!user) {
			return res.status(401).json({ message: "Invalid username or password" });
		}

		const isValidPassword = await bcrypt.compare(password, user.password);

		if (!isValidPassword) {
			return res.status(401).json({ message: "Invalid username or password" });
		}

		const token = generateAuthToken(user._id);

		return res.status(200).json({
			message: "Login successful",
			token,
			user: sanitizeUser(user)
		});
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getUserByApplication(req, res) {
	try {
		const user = await User.findOne({ application: req.params.applicationId })
			.populate("account")
			.populate("application");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json(sanitizeUser(user));
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function getSingleUser(req, res) {
	try {
		const user = await User.findById(req.params.id).populate("account").populate("application");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json(sanitizeUser(user));
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function deleteUser(req, res) {
	try {
		const user = await User.findById(req.params.id).populate("account").populate("application");

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await Promise.all([
			Otp.deleteOne({ email: user.application?.email }),
			Transfer.deleteMany({
				$or: [
					{ senderUser: user._id },
					{ senderAccount: user.account?._id || user.account },
					{ recipientAccount: user.account?._id || user.account }
				]
			}),
			Account.deleteMany({
				$or: [{ _id: user.account?._id || user.account }, { application: user.application?._id || user.application }]
			}),
			Application.findByIdAndDelete(user.application?._id || user.application),
			User.findByIdAndDelete(user._id)
		]);

		return res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function updateUsername(req, res) {
	try {
		const { username } = req.body;
		if (!username) {
			return res.status(400).json({ message: "username is required" });
		}

		if (String(username).trim().length < 3) {
			return res.status(400).json({ message: "username must be at least 3 characters" });
		}

		const existing = await User.findOne({ username: String(username).trim() });
		if (existing && String(existing._id) !== req.params.id) {
			return res.status(409).json({ message: "username already exists" });
		}

		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ username: String(username).trim() },
			{ new: true, runValidators: true }
		).populate("account").populate("application");

		if (!updatedUser) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json({ message: "Username updated successfully", user: updatedUser });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function updatePassword(req, res) {
	try {
		const { oldPassword, newPassword } = req.body;

		if (!oldPassword || !newPassword) {
			return res.status(400).json({ message: "oldPassword and newPassword are required" });
		}

		if (!isStrongEnoughPassword(newPassword)) {
			return res.status(400).json({ message: "newPassword must be at least 8 characters" });
		}

		const user = await User.findById(req.params.id).select("+password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
		if (!isValidOldPassword) {
			return res.status(400).json({ message: "Old password is incorrect" });
		}

		user.password = await bcrypt.hash(newPassword, 12);
		await user.save();

		return res.status(200).json({ message: "Password updated successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}
