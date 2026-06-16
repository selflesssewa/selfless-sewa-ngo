# Website Security & Reliability Review — In Plain Language

**Prepared for:** Selfless Sewa NGO
**Date:** 14 June 2026
**About this document:** Our review of the donation website found 10 issues that
need attention. This document explains each one in everyday language — what the
problem is, and what could go wrong if it is not fixed. No technical background
is needed to read this.

A simple traffic-light rating shows how urgent each item is:

- 🔴 **Critical** — could lead to money loss or a data leak. Fix as soon as possible.
- 🟠 **High** — serious; could break donations or expose donor information.
- 🟡 **Medium** — should be fixed, but lower immediate risk.

---

## 🔴 1. The "master key" to your payment account is exposed

**What it means:** The secret password that lets your website talk to the
PhonePe payment gateway is written directly inside the website's code, in plain
sight. Anyone who gets a copy of the code can read it.

**What could happen if not fixed:** A malicious person could pretend to be your
NGO, look into your payment transactions, and tamper with payments. This is the
single most serious issue — it puts your payment account itself at risk.

**What to do:** Move the secret out of the code into a secure, hidden setting,
and ask PhonePe to issue a new secret (because the current one is already
exposed).

---

## 🔴 2. The donation amount can be faked

**What it means:** When someone donates, the amount is decided by the visitor's
browser, and the website trusts it without double-checking. A tech-savvy person
could send an unusual amount (negative, zero, or gibberish) directly.

**What could happen if not fixed:** Broken or fraudulent transactions, and —
because the amount is printed on the official **80G tax receipt** — someone
could generate a tax receipt showing a wrong amount. That is both a financial
and a legal/compliance problem.

**What to do:** Check the amount on our secure server before accepting it.

---

## 🔴 3. Anyone can peek at other donors' transactions

**What it means:** The page that checks a payment's status does not properly
verify that the request is genuine. It accepts a "pass" without confirming it is
real.

**What could happen if not fixed:** A stranger could look up the status and
details of **other people's donations** — a privacy breach of your donors.

**What to do:** Properly verify the digital "pass" before showing any
transaction information.

---

## 🟠 4. Donor details on receipts are not validated

**What it means:** The name, PAN number, phone, and address typed by a donor are
printed onto the official tax receipt without being checked for correctness.

**What could happen if not fixed:** Receipts could be issued with invalid PAN
numbers or garbled details — an official 80G document with wrong information,
which can cause compliance trouble for the NGO.

**What to do:** Validate these fields (especially PAN format) before printing a
receipt.

---

## 🟠 5. When something fails, the donor sees nothing

**What it means:** If a payment cannot be started, the website silently does
nothing instead of showing a clear message.

**What could happen if not fixed:** A confused donor may try again and **pay
twice**, or simply give up — lost donations and a poor experience. Separately,
sensitive donor details are being written into the system's internal logs, which
is not good practice for personal data.

**What to do:** Show clear success/failure messages, and stop recording personal
details in logs.

---

## 🟠 6. No protection against flooding / abuse

**What it means:** There is no limit on how many times someone can hit the
payment and status pages. A bad actor could automate thousands of requests.

**What could happen if not fixed:** PhonePe could flag or temporarily block your
account for unusual activity, **stopping all real donations**. It could also
slow down or crash the site.

**What to do:** Add a sensible limit on how often these pages can be used by one
visitor.

---

## 🟠 7. Donor personal information travels in the web address

**What it means:** A donor's PAN, name, phone, and address are bundled into the
website link used during payment. Web links get saved in browser history, server
records, and other logs along the way.

**What could happen if not fixed:** This personal information can quietly end up
in places you don't control, and the link can be reused to re-download someone's
receipt. A privacy risk for your donors.

**What to do:** Keep personal details on our secure server only, and use a
harmless random reference in the link instead.

---

## 🟡 8. Missing standard "safety locks" on the website

**What it means:** Modern websites set a few standard protections that tell the
browser how to behave safely. This site is missing them.

**What could happen if not fixed:** Your donation page could be secretly placed
inside a fake website to trick people into donating ("clickjacking"), and other
attacks become easier. Donor links are also more likely to leak to outside
parties.

**What to do:** Turn on the standard set of browser safety settings (a small,
one-time configuration change).

---

## 🟡 9. A simple content edit could crash the whole site

**What it means:** The website assumes the content system (where you edit text,
team members, photos) always has everything filled in. If a required item — say
the "Founder" entry — is deleted or left blank, the code has no fallback.

**What could happen if not fixed:** A non-technical staff member making a routine
content change could accidentally **take the entire website offline** with an
error.

**What to do:** Make the website handle missing or empty content gracefully
instead of crashing.

---

## 🟡 10. Receipt template and setup are fragile

**What it means:** The official receipt template file is stored inside the
website's code, and the way it is loaded can fail on certain hosting setups. Some
configuration errors also produce unhelpful, hard-to-diagnose failures.

**What could happen if not fixed:** Receipt generation could break entirely after
a deployment, meaning donors cannot get their tax receipts.

**What to do:** Load the receipt template in a more reliable way and improve
error handling so problems are caught early.

---

## Suggested order of fixing

| Priority | Issue | Why first |
|----------|-------|-----------|
| 1 | #1 Exposed payment key | Money / account at direct risk |
| 2 | #3 Donor data peeking | Privacy breach |
| 3 | #7 Personal info in links | Privacy breach |
| 4 | #2 Fakeable amount | Financial & receipt integrity |
| 5 | #6 No abuse protection | Could halt all donations |
| 6 | #8 Missing safety locks | Reduces attack surface |
| 7 | #4, #5, #9, #10 | Reliability & compliance |

---

## In one sentence

The website works, but a few important safety and reliability gaps — especially
around the payment secret, donor privacy, and donation amounts — should be fixed
soon to protect your donors, your funds, and your NGO's reputation.

*We're happy to walk through any of these items and can implement the fixes on
request.*
