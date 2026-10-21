import validator from "validator";

export function isStrongEnoughPassword(password) {
	return typeof password === "string" && password.length >= 8;
}

export function validateApplicationPayload(payload, { isPartial = false } = {}) {
	const errors = [];
	const requiredFields = ["fullName", "cnic", "email", "phone", "address", "accountType"];

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

	return errors;
}
