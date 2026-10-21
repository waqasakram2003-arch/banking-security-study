const SESSION_KEY = "internetBankingSession";

function readSession(store) {
	try {
		const raw = store.getItem(SESSION_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function getInternetBankingSession() {
	const sessionValue = readSession(window.sessionStorage);
	if (sessionValue) {
		return sessionValue;
	}

	const localValue = readSession(window.localStorage);
	if (localValue) {
		window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(localValue));
		window.localStorage.removeItem(SESSION_KEY);
	}

	return localValue;
}

export function setInternetBankingSession(session) {
	window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
	window.localStorage.removeItem(SESSION_KEY);
}

export function clearInternetBankingSession() {
	window.sessionStorage.removeItem(SESSION_KEY);
	window.localStorage.removeItem(SESSION_KEY);
	document.cookie = "internetBankingSession=; Max-Age=0; path=/";
}
