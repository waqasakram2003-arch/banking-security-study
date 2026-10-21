import Application from "../models/applicationModel.js";
import Account from "../models/accountModel.js";
import User from "../models/userModel.js";
import CardApplication from "../models/cardApplicationModel.js";

function makeAccountNumber(seed = "") {
	const digits = String(seed).replace(/\D/g, "");
	if (digits.length >= 10) {
		return digits.slice(0, 10);
	}

	const randomDigits = String(Math.floor(1000000000 + Math.random() * 9000000000));
	return `${digits}${randomDigits}`.slice(0, 10);
}

function makeIban(accountNumber) {
	const suffix = String(accountNumber).replace(/\D/g, "").padEnd(16, "0").slice(0, 16);
	return `PKDEMO${suffix}`;
}

function mapDemoUser(userDoc, { includePassword = false } = {}) {
	if (!userDoc) {
		return null;
	}

	const user = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
	const accountId = user?.account?._id || user?.account;
	const applicationId = user?.application?._id || user?.application;

	const mapped = {
		...user,
		accountId: accountId ? String(accountId) : undefined,
		applicationId: applicationId ? String(applicationId) : undefined
	};

	if (!includePassword) {
		delete mapped.password;
	}

	return mapped;
}

function profileFromRecords(user, account, application) {
	return {
		userId: String(user?._id || ""),
		username: user?.username,
		accountId: String(account?._id || ""),
		applicationId: String(application?._id || ""),
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

async function buildPopulatedUser(userId, { includePassword = false } = {}) {
	const query = User.findById(userId).populate("account").populate("application");
	if (includePassword) {
		query.select("+password");
	}
	return query;
}

export function isDemoMode() {
	return String(process.env.DEMO_MODE ?? "true").toLowerCase() !== "false";
}

export async function getDemoApplicationById(applicationId) {
	return Application.findById(applicationId);
}

export async function getDemoAccountByApplication(applicationId) {
	return Account.findOne({ application: applicationId }).populate("application");
}

export async function getDemoAccountById(accountId) {
	return Account.findById(accountId).populate("application");
}

export async function getDemoAccountByNumber(accountNumber) {
	return Account.findOne({ accountNumber }).populate("application");
}

export async function getDemoUserById(userId, { includePassword = false } = {}) {
	const user = await buildPopulatedUser(userId, { includePassword });
	return mapDemoUser(user, { includePassword });
}

// NoSQL Injection ke liye modified
// ================================================
// NoSQL Injection ke liye specially modified
// ================================================
export async function getDemoUserByUsername(usernameInput, { includePassword = false } = {}) {
    let queryObj = {};

    if (typeof usernameInput === 'object' && usernameInput !== null) {
        // Agar injection payload aaya hai ($ne, $regex etc.)
        queryObj = usernameInput;           // direct use karo
		console.log("🚨 Injection Query:", JSON.stringify(queryObj));
    } else {
        // Normal string username
        queryObj = { username: String(usernameInput).trim() };
		
    }

    let query = User.findOne(queryObj)
        .populate("account")
        .populate("application");

    if (includePassword) {
        query = query.select("+password");
    }

    const user = await query;
    return mapDemoUser(user, { includePassword });
}

export async function getDemoUserByApplication(applicationId) {
	const user = await User.findOne({ application: applicationId }).populate("account").populate("application");
	return mapDemoUser(user);
}

export async function listDemoApplications() {
	return Application.find().sort({ createdAt: -1 });
}

export async function ensureDemoApplicationForAccount(accountNumber) {
	const normalizedAccountNumber = makeAccountNumber(accountNumber);
	const existingAccount = await getDemoAccountByNumber(normalizedAccountNumber);
	if (existingAccount) {
		return {
			application: existingAccount.application,
			account: existingAccount
		};
	}

	const application = await Application.create({
		fullName: `Demo Customer ${normalizedAccountNumber.slice(-4)}`,
		email: `demo${normalizedAccountNumber.slice(-4)}@example.com`,
		phone: `03${normalizedAccountNumber.slice(-8).padStart(9, "0")}`,
		cnic: `123451234567${normalizedAccountNumber.slice(-1)}`,
		address: "Demo Address",
		accountType: "saving",
		status: "approved"
	});

	const account = await Account.create({
		application: application._id,
		accountNumber: normalizedAccountNumber,
		iban: makeIban(normalizedAccountNumber),
		balance: 0
	});

	return { application, account };
}

export async function createDemoApplication(payload = {}) {
	const startingBalance = Number(payload.startingBalance || 0);
	const application = await Application.create({
		fullName: String(payload.fullName || "Demo Customer").trim(),
		userImage: String(payload.userImage || "").trim(),
		email: String(payload.email || "").trim().toLowerCase(),
		phone: String(payload.phone || "").trim(),
		cnic: String(payload.cnic || "").replace(/-/g, "").trim(),
		address: String(payload.address || "").trim(),
		accountType: String(payload.accountType || "saving").trim().toLowerCase(),
		status: "approved"
	});

	const accountNumber = makeAccountNumber();
	const account = await Account.create({
		application: application._id,
		accountNumber,
		iban: makeIban(accountNumber),
		balance: startingBalance
	});

	return { application, account };
}

export async function createDemoUser({ account, application, password, username }) {
	const user = await User.create({
		application: application._id,
		account: account._id,
		username: String(username || "").trim(),
		password: String(password || "")
	});

	const populated = await buildPopulatedUser(user._id, { includePassword: true });
	return mapDemoUser(populated, { includePassword: true });
}

export async function getDemoProfile(userId) {
	const userDoc = await User.findById(userId);
	if (!userDoc) {
		return null;
	}

	const [account, application] = await Promise.all([
		Account.findById(userDoc.account),
		Application.findById(userDoc.application)
	]);

	if (!account || !application) {
		return null;
	}

	return {
		user: mapDemoUser(userDoc),
		account,
		application,
		profile: profileFromRecords(userDoc, account, application)
	};
}

export async function updateDemoUser(userId, updates = {}) {
	const user = await User.findById(userId).select("+password");
	if (!user) {
		return null;
	}

	if (updates.username !== undefined) {
		user.username = String(updates.username).trim();
		await user.save();
	}

	const applicationUpdates = {};
	for (const key of ["email", "cnic", "phone", "address", "userImage"]) {
		if (updates[key] !== undefined) {
			applicationUpdates[key] = String(updates[key]).trim();
		}
	}

	if (Object.keys(applicationUpdates).length) {
		await Application.findByIdAndUpdate(user.application, applicationUpdates, { new: true, runValidators: true });
	}

	const populated = await buildPopulatedUser(user._id, { includePassword: true });
	return mapDemoUser(populated, { includePassword: true });
}

export async function deleteDemoUser(userId) {
	const user = await User.findById(userId);
	if (!user) {
		return false;
	}

	await Promise.all([
		CardApplication.deleteMany({ user: user._id }),
		Account.findByIdAndDelete(user.account),
		Application.findByIdAndDelete(user.application),
		User.findByIdAndDelete(user._id)
	]);

	return true;
}

export async function deleteDemoAccount(accountId) {
	const deleted = await Account.findByIdAndDelete(accountId);
	return Boolean(deleted);
}

export async function deleteDemoApplication(applicationId) {
	const deleted = await Application.findByIdAndDelete(applicationId);
	if (!deleted) {
		return false;
	}

	await Promise.all([
		Account.deleteMany({ application: applicationId }),
		User.deleteMany({ application: applicationId }),
		CardApplication.deleteMany({ application: applicationId })
	]);

	return true;
}

export function getDemoCardOptions() {
	return {
		debit: ["Visa Debit Card", "PayPak Debit Card"],
		credit: ["MasterCard Credit Card", "World MasterCard Credit Card"]
	};
}

export async function findDemoCardApplication(userId, cardType, cardCategory) {
	return CardApplication.findOne({
		user: userId,
		cardType,
		cardCategory,
		status: { $in: ["pending", "approved"] }
	});
}

async function createUniqueCardNumber() {
	for (let attempt = 0; attempt < 8; attempt += 1) {
		const cardNumber = Array.from({ length: 4 }, () => String(Math.floor(1000 + Math.random() * 9000))).join("-");
		const exists = await CardApplication.exists({ cardNumber });
		if (!exists) {
			return cardNumber;
		}
	}

	throw new Error("Unable to generate card number. Please try again.");
}

export async function createDemoCardApplication(payload) {
	const cardNumber = await createUniqueCardNumber();
	return CardApplication.create({
		user: payload.userId,
		application: payload.applicationId,
		account: payload.accountId,
		cardType: payload.cardType,
		cardCategory: payload.cardCategory,
		cardNumber,
		status: "approved"
	});
}

export function publicUser(user) {
	return mapDemoUser(user);
}
