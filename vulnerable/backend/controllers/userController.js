import Application from "../models/applicationModel.js";
import Account from "../models/accountModel.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import { generateAuthToken, sanitizeUser } from "../helpers/authHelper.js";
import { isStrongEnoughPassword } from "../helpers/validationHelper.js";
import {
	createDemoUser,
	deleteDemoUser,
	getDemoProfile,
	getDemoUserByApplication,
	getDemoUserById,
	getDemoUserByUsername,
	isDemoMode,
	publicUser,
	updateDemoUser
} from "../helpers/demoStore.js";

function normalizeSignupPayload(payload = {}) {
	return {
		accountNumber: String(payload.accountNumber || "").trim(),
		email: String(payload.email || "").trim().toLowerCase(),
		cnic: String(payload.cnic || "").replace(/-/g, "").trim(),
		username: String(payload.username || "").trim(),
		password: String(payload.password || ""),
		confirmPassword: String(payload.confirmPassword || "")
	};
}

function validateSignupBasics(payload) {
	if (!payload.accountNumber || !payload.email || !payload.cnic || !payload.username || !payload.password || !payload.confirmPassword) {
		return {
			ok: false,
			status: 400,
			message: "accountNumber, email, cnic, username, password and confirmPassword are required"
		};
	}

	if (!validator.isEmail(payload.email)) {
		return { ok: false, status: 400, message: "email must be in valid email format" };
	}

	if (!/^\d{13}$/.test(payload.cnic)) {
		return { ok: false, status: 400, message: "cnic must be 13 digits" };
	}

	if (payload.username.length < 3 || payload.username.length > 50) {
		return { ok: false, status: 400, message: "username must be between 3 and 50 characters" };
	}

	if (payload.password !== payload.confirmPassword) {
		return { ok: false, status: 400, message: "password and confirmPassword do not match" };
	}

	if (!isStrongEnoughPassword(payload.password)) {
		return { ok: false, status: 400, message: "password must be at least 8 characters" };
	}

	return { ok: true };
}

async function resolveSignupTarget(payload) {
	const account = await Account.findOne({ accountNumber: payload.accountNumber });
	if (!account) {
		return { ok: false, status: 404, message: "Account not found" };
	}

	const application = await Application.findById(account.application);
	if (!application) {
		return { ok: false, status: 404, message: "Application not found" };
	}

	if (String(application.cnic || "").replace(/-/g, "") !== payload.cnic) {
		return { ok: false, status: 400, message: "CNIC does not match this account" };
	}

	if (String(application.email || "").trim().toLowerCase() !== payload.email) {
		return { ok: false, status: 400, message: "Email does not match this account" };
	}

	const existingUser = isDemoMode()
		? await getDemoUserByApplication(application._id)
		: await User.findOne({ application: application._id });

	if (existingUser) {
		return {
			ok: false,
			status: 200,
			loginRequired: true,
			message: "User already signed up",
			userId: existingUser._id,
			username: existingUser.username,
			applicationId: application._id
		};
	}

	const usernameOwner = isDemoMode()
		? await getDemoUserByUsername(payload.username)
		: await User.findOne({ username: payload.username });

	if (usernameOwner && String(usernameOwner.application || "") !== String(application._id)) {
		return {
			ok: false,
			status: 409,
			message: "This username already exists for another customer. Please choose another username."
		};
	}

	return { ok: true, account, application };
}

async function createSignupUser(payload, account, application) {
	if (isDemoMode()) {
		const user = await createDemoUser({
			account,
			application,
			password: payload.password,
			username: payload.username
		});

		return {
			user: publicUser(user),
			username: user.username,
			userId: user._id,
			accountId: account._id,
			token: `demo-${user._id}`
		};
	}

	const hashedPassword = await bcrypt.hash(payload.password, 12);
	const user = await User.create({
		application: application._id,
		account: account._id,
		username: payload.username,
		password: hashedPassword
	});

	const populatedUser = await User.findById(user._id).populate("account").populate("application");
	const token = generateAuthToken(user._id);

	return {
		user: sanitizeUser(populatedUser),
		username: user.username,
		userId: user._id,
		accountId: account._id,
		token
	};
}

export async function signupUser(req, res) {
	try {
		const payload = normalizeSignupPayload(req.body);
		const basicValidation = validateSignupBasics(payload);
		if (!basicValidation.ok) {
			return res.status(basicValidation.status).json({ message: basicValidation.message });
		}

		const targetValidation = await resolveSignupTarget(payload);
		if (!targetValidation.ok) {
			if (targetValidation.loginRequired) {
				return res.status(targetValidation.status).json({
					message: targetValidation.message,
					userId: targetValidation.userId,
					username: targetValidation.username,
					applicationId: targetValidation.applicationId,
					loginRequired: true
				});
			}

			return res.status(targetValidation.status).json({ message: targetValidation.message });
		}

		const signupResult = await createSignupUser(payload, targetValidation.account, targetValidation.application);

		return res.status(201).json({
			message: "Signup successful",
			userId: signupResult.userId,
			username: signupResult.username,
			token: signupResult.token,
			accountId: signupResult.accountId,
			user: signupResult.user,
			autoGenerated: {
				username: false,
				password: false
			}
		});
	} catch (error) {
		return res.status(500).json({ message: error.message || "Unable to signup right now" });
	}
}

export async function loginUser(req, res) {
	try {
		// ===============================================
// DEMO MODE LOGIN - NoSQL INJECTION ENABLED
// ===============================================
if (isDemoMode()) {
    const usernameInput = req.body.username;   // ⚠️ no String()
    const passwordInput = req.body.password;   // ⚠️ no String()

    if (!usernameInput || !passwordInput) {
        return res.status(400).json({ message: "username and password are required" });
    }

    // 💀 Direct NoSQL injection
    const query = {
        username: usernameInput,
        password: passwordInput
    };

    const user = await User.findOne(query)
        .select("+password")
        .populate("account")
        .populate("application");

    if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    return res.status(200).json({
        message: "Login successful (NoSQL Injection Possible 🚨)",
        token: `demo-${user._id}`,
        user: user
    });
}

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
		if (isDemoMode()) {
			const user = await getDemoUserByApplication(req.params.applicationId);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).json(publicUser(user));
		}

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
		if (isDemoMode()) {
			const user = await getDemoUserById(req.params.id);

			if (!user) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).json(publicUser(user));
		}

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
		if (isDemoMode()) {
			const deleted = await deleteDemoUser(req.params.id);

			if (!deleted) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).json({ message: "User deleted successfully" });
		}

		const deletedUser = await User.findByIdAndDelete(req.params.id);

		if (!deletedUser) {
			return res.status(404).json({ message: "User not found" });
		}

		return res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
}

export async function updateUsername(req, res) {
	try {
		if (isDemoMode()) {
			const { username } = req.body;
			if (!username) {
				return res.status(400).json({ message: "username is required" });
			}

			if (String(username).trim().length < 3) {
				return res.status(400).json({ message: "username must be at least 3 characters" });
			}

			const updatedUser = await updateDemoUser(req.params.id, { username });
			if (!updatedUser) {
				return res.status(404).json({ message: "User not found" });
			}

			return res.status(200).json({ message: "Username updated successfully", user: publicUser(updatedUser) });
		}

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
