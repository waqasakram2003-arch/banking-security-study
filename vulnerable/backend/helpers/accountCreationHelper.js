export function generateAccountNumber() {
	return "AC" + Math.floor(100000000 + Math.random() * 900000000);
}

export function generateIBAN() {
	return "PK" + Math.floor(1000000000000000 + Math.random() * 9000000000000000);
}

