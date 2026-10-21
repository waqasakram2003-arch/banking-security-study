function sanitizeObject(value) {
	if (!value || typeof value !== "object") {
		return;
	}

	if (Array.isArray(value)) {
		for (const item of value) {
			sanitizeObject(item);
		}
		return;
	}

	for (const key of Object.keys(value)) {
		const shouldDropKey = key.startsWith("$") || key.includes(".");
		if (shouldDropKey) {
			delete value[key];
			continue;
		}

		sanitizeObject(value[key]);
	}
}

export default function requestSanitizer(req, res, next) {
	sanitizeObject(req.body);
	sanitizeObject(req.params);
	sanitizeObject(req.query);
	next();
}
