# Findings

Five issues found and exploited against the `vulnerable/` build, with the fix in `secure/` for each.
Severity is my own assessment for this application, using CVSS-style reasoning rather than a score.

Payloads are included because the point of the project is reproducibility. Nothing here is novel —
these are textbook classes, which is exactly why they are worth being able to demonstrate.

> The exfiltration endpoint used during the original keylogger demonstration has been removed from
> these notes. It was a live collection URL and republishing it would point anyone running the demo
> at a third-party endpoint.

---

## 1 · Authentication bypass through NoSQL operator injection

**Severity:** Critical · **Class:** OWASP A03 Injection · **Endpoint:** `POST /api/users/login`

The login handler reads `req.body.username` and `req.body.password` and places them into a Mongoose
query without converting either to a string. A JSON request body can carry objects, and Mongoose
passes an object through as a query operator.

```json
{
  "username": { "$ne": null },
  "password": { "$ne": null }
}
```

The query becomes "find a user whose username is not null and whose password is not null" — the first
document in the collection. The handler then treats the result as an authenticated session.

No password is guessed and no account is known in advance. A rate limit does not help, because one
request is enough.

**Fix:** store the password as a bcrypt hash and verify with `bcrypt.compare`. An operator object
cannot produce a matching hash, so the comparison fails regardless of what the query returned.
Casting both fields with `String()` before the query is the additional hardening step noted in the
README — it stops the operator reaching the query at all.

---

## 2 · Username enumeration via `$regex`

**Severity:** Medium · **Class:** OWASP A03 Injection

The same unwrapped input accepts `$regex`, which turns the login form into a search:

```json
{ "username": { "$regex": "^W" }, "password": { "$ne": null } }
```

A match means at least one username begins with `W`. Extending the anchor one character at a time
recovers full usernames without any list or wordlist.

**Fix:** the same bcrypt comparison removes the signal, because a successful match no longer logs in.
The secure build also returns an identical `401 Invalid username or password` whether the user was
found or the password was wrong, so the response body gives nothing away.

**Residual:** bcrypt runs only when a user was found, so a found username costs measurably more time
than a missing one. Closing that properly means comparing against a dummy hash on the not-found path
so both branches do equal work.

---

## 3 · Remote code execution through a debug endpoint

**Severity:** Critical · **Class:** OWASP A05 Security Misconfiguration
**Endpoint:** `GET /backdoor/exec` (`vulnerable/backend/server.js`)

A debug route was left in the application. It takes a shared secret and a command string, and runs
the command on the host:

```
GET /backdoor/exec?secret=fyp2026&cmd=whoami
```

The guard is a hardcoded string compared in the handler, and the server prints the working URL to
stdout on boot. Anything the Node process can do, a request can do — read the database credentials
from the environment, reach internal hosts, fetch and run a second-stage payload.

This is the single most serious issue in the build, and it is not an injection flaw. Nothing was
parsed wrongly. The endpoint does exactly what it was written to do; it should never have shipped.

**Fix:** the secure build has no such route and no code path that reaches a shell. Debug helpers
belong behind a build flag that is absent in production, not behind a secret in the source.

---

## 4 · Stored cross-site scripting

**Severity:** High · **Class:** OWASP A03 Injection

User-supplied content is persisted and then rendered as HTML rather than text. A script submitted
once executes in the browser of every later visitor to that page, in their session, with their
privileges.

Stored XSS is worse than reflected here because it needs no link, no social engineering and no
interaction from the victim beyond visiting a page they already intended to visit.

**Fix:** escape on output. React escapes interpolated values by default, so the real fix is to stop
defeating it — no `dangerouslySetInnerHTML` for user content, and HTML-escaping anywhere the server
composes markup.

---

## 5 · Persistent defacement and credential capture via stored XSS

**Severity:** High · **Class:** impact demonstration of finding 4

Two payloads were used to show what finding 4 is actually worth to an attacker.

**Defacement.** A fixed-position, full-viewport element is stored through the same injection point.
Because it is persisted server-side rather than injected per request, it survives a refresh and is
served to everyone — the application still runs underneath, but no user can reach it.

**Credential capture.** A keystroke handler attached to the document captures input across the page,
including the login form, and posts it to a remote endpoint. On a banking application the captured
material is credentials and transaction detail.

Taken together these are the argument against treating XSS as a low-severity finding. The same single
injection point gives both a denial of service and credential theft, and neither requires any further
vulnerability.

**Fix:** as finding 4. A Content-Security-Policy restricting `script-src` and forbidding inline
script is the second layer — it does not fix the injection, but it stops an injected inline script
from running.

---

## 6 · Secrets committed to version control

**Severity:** High · **Class:** OWASP A05 · **Found while publishing this study**

Not part of the original assessment. Preparing the repository surfaced a committed `.env` in both
builds containing a live MongoDB Atlas connection URI, with credentials, and a mail app password for
a personal mailbox.

Anyone with repository access had the database. The vulnerable build's own findings become irrelevant
next to handing over the credentials directly.

**Action taken:** both `.env` files excluded from this repository, `.gitignore` added, and
`.env.example` templates committed in their place with local throwaway values. **The exposed
credentials should be rotated** — removing a secret from a working copy does not un-expose it.

This one is included deliberately. It is the most common real-world finding of the six, it was found
last, and it was found in my own project.
