import validator from "validator";

export function isStrongEnoughPassword(password) {
	return typeof password === "string" && password.length >= 8;
}

export function validateApplicationPayload(payload, { isPartial = false } = {}) {
	const errors = [];
	const requiredFields = ["fullName", "cnic", "email", "phone", "address", "accountType", "startingBalance"];

	if (!isPartial) {
		for (const field of requiredFields) {
			if (!payload[field] || String(payload[field]).trim() === "") {
				errors.push(`${field} is required`);
			}
		}
	}

	if (payload.email && !validator.isEmail(String(payload.email))) {
		errors.push("email must be in valid email format");
	}

	if (payload.accountType && !["saving", "current"].includes(payload.accountType)) {
		errors.push("accountType must be either saving or current");
	}

	if (payload.cnic) {
		const cnic = String(payload.cnic).replace(/-/g, "");
		if (!/^\d{13}$/.test(cnic)) {
			errors.push("cnic must be 13 digits");
		}
	}

	if (payload.startingBalance !== undefined) {
		const startingBalance = Number(payload.startingBalance);
		if (!Number.isFinite(startingBalance)) {
			errors.push("startingBalance must be a valid number");
		} else if (startingBalance < 1000 || startingBalance > 1000000) {
			errors.push("startingBalance must be between 1000 and 1000000");
		}
	}

	if (payload.profileImage) {
		if (typeof payload.profileImage !== "string" || !payload.profileImage.startsWith("data:image/")) {
			errors.push("profileImage must be an image file");
		}
	}

	return errors;
}
