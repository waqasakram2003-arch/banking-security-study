import jwt from "jsonwebtoken";

function getJwtSecret() {
	return process.env.JWT_SECRET || "replace-this-in-env";
}

export function generateAuthToken(userId) {
	return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "1d" });
}

export function sanitizeUser(userDoc) {
	const user = userDoc?.toObject ? userDoc.toObject() : userDoc;
	if (!user) return null;
	delete user.password;
	return user;
}
