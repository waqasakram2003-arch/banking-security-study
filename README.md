# Banking Application — a security study in two builds

> ⚠️ **The `vulnerable/` build is deliberately exploitable.** It contains a remote code execution
> backdoor, NoSQL injection and stored XSS, all intentional. Run it on localhost against a throwaway
> database, never on a public host and never with real data.

The same online banking application, built twice.

One build is written the way a rushed project gets written — queries assembled from request bodies,
user input echoed straight into the page, a debug endpoint left in. The other is the same feature set
written properly. Keeping both lets a single flaw be attacked in one build and watched failing to
work in the other, which is a far more useful thing to look at than a list of recommendations.

Final year project, BS Information Technology, MNS University of Agriculture, Multan.

```
vulnerable/     the insecure build  — Express + MongoDB + React
secure/         the hardened build  — same features, same stack
docs/           what was found, how it was exploited, and what fixed it
evidence/       screenshots from the exploitation runs
```

---

## The findings

Five issues, all demonstrated end to end against the vulnerable build. Full write-ups with payloads
and fixes are in **[docs/findings.md](docs/findings.md)**.

| # | Issue | Class | Impact |
| :-- | :--- | :--- | :--- |
| 1 | Authentication bypass through NoSQL operator injection | A03 Injection | Log in as another user with no password |
| 2 | Username enumeration via `$regex` | A03 Injection | Recover valid usernames one character at a time |
| 3 | Remote code execution through a debug endpoint | A05 Misconfiguration | Arbitrary OS commands on the server |
| 4 | Stored cross-site scripting | A03 Injection | Script runs for every later visitor |
| 5 | Persistent defacement and credential capture via stored XSS | A03 Injection | Page replaced; keystrokes exfiltrated |

### The one worth reading

The vulnerable login takes the request body and builds the query from it directly
(`vulnerable/backend/controllers/userController.js`):

```js
const usernameInput = req.body.username;   // no String()
const passwordInput = req.body.password;   // no String()

if (!usernameInput || !passwordInput) {
    return res.status(400).json({ message: "username and password are required" });
}

const query = { username: usernameInput, password: passwordInput };
```

The presence check passes for any truthy value, and with JSON input a value does not have to be a
string. Send objects and they arrive as MongoDB operators:

```json
{ "username": { "$ne": null }, "password": { "$ne": null } }
```

That asks for the first user whose username and password are both not null — the first account in the
collection, logged into, with nothing guessed. Swap in `{"$regex": "^W"}` and usernames come out one
character at a time.

The secure build fixes it where it actually matters — the password is never a value you can match
against (`secure/backend/controllers/userController.js`):

```js
const user = await User.findOne({ username })
    .select("+password");

if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
}

const isValidPassword = await bcrypt.compare(password, user.password);
```

Two things do the work. The stored password is a bcrypt hash, so `{"$ne": null}` cannot satisfy it —
`bcrypt.compare` needs the real string, and no operator object will produce a matching hash. And both
failure paths return the same message, so there is no oracle telling an attacker which usernames
exist.

**Worth being honest about:** the secure build still does not cast `username` to a string, so an
operator can select a row even though it can no longer authenticate as one. The remaining difference
is timing — bcrypt only runs when a user was found. Casting both inputs to `String` would close that
too, and it is the one change I would still make.

---

## What the secure build does differently

| | Vulnerable | Secure |
| :--- | :--- | :--- |
| Query construction | Request body passed straight into `findOne` | Still unwrapped, but no longer sufficient to authenticate |
| Passwords | Stored and compared as plain values | bcrypt hash, compared with `bcrypt.compare` |
| Failed login response | Distinguishes unknown user from wrong password | One message for both — no enumeration oracle |
| Output | User input rendered as HTML | Escaped on output; React's default escaping left intact |
| Sessions | Weak, long-lived tokens | Short-lived JWT, secret from environment, verified on every request |
| Access control | Object identifiers trusted from the client | Ownership checked server-side on every record |
| Debug endpoints | `/backdoor/exec` shipped | None; no shell access path exists |
| Secrets | Committed to the repository | `.env`, gitignored, with `.env.example` as the template |

That last row is not a toy difference. Writing this study is what surfaced a real credential in the
original project history — a live database URI and a mail app password sat in a committed `.env`.
Both were removed before publication and should be rotated. **A secrets mistake is the most common
finding in real reviews, and it is the one that was present here too.**

---

## Running it

Each build needs Node.js 18+ and a local MongoDB.

```bash
cd vulnerable/backend        # or secure/backend
cp ../.env.example .env      # then edit .env
npm install
npm start
```

```bash
cd vulnerable/frontend       # or secure/frontend
npm install
npm run dev
```

Use a local, empty database for the vulnerable build. Anything reachable from it should be assumed
destroyed.

---

## Stack

Node.js · Express · MongoDB / Mongoose · React · Vite · JWT · bcrypt

## Author

**Waqas Akram** — security-focused developer and cyber security instructor, Multan, Pakistan.
[techbiz-sec.com](https://techbiz-sec.com) · waqasakram2003@gmail.com

Published for study and teaching. The vulnerable build exists to be attacked in a lab, nowhere else.
