export interface AnalysisResult {
    status: "Safe" | "Suspicious" | "Malicious";
    reasons: string[];
    score: number; // 0 (safe) to 100 (definitely malicious)
}

// ─── URL Analysis ────────────────────────────────────────────────────────────

const SUSPICIOUS_TLDS = [
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".pw",
    ".cc", ".buzz", ".click", ".link", ".work", ".surf",
];

const URL_SHORTENERS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "bl.ink", "shorturl.at",
];

const SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "update", "secure", "account",
    "confirm", "password", "banking", "paypal", "wallet", "suspend",
    "urgent", "alert", "restore", "unlock",
];

export function analyzeUrl(raw: string): AnalysisResult {
    const reasons: string[] = [];
    let score = 0;

    const url = raw.trim().toLowerCase();

    // 1. No HTTPS
    if (url.startsWith("http://")) {
        reasons.push("Connection is not encrypted (no HTTPS)");
        score += 20;
    } else if (!url.startsWith("https://")) {
        reasons.push("Missing or unrecognised protocol");
        score += 10;
    }

    // 2. IP-based URL
    const ipPattern = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    if (ipPattern.test(url)) {
        reasons.push("Uses an IP address instead of a domain name");
        score += 30;
    }

    // 3. Suspicious TLD
    for (const tld of SUSPICIOUS_TLDS) {
        if (url.includes(tld)) {
            reasons.push(`Uses a high-risk top-level domain (${tld})`);
            score += 20;
            break;
        }
    }

    // 4. URL shortener
    for (const shortener of URL_SHORTENERS) {
        if (url.includes(shortener)) {
            reasons.push(`Uses a URL shortener (${shortener})`);
            score += 15;
            break;
        }
    }

    // 5. Suspicious keywords in URL
    const foundKeywords = SUSPICIOUS_KEYWORDS.filter((kw) => url.includes(kw));
    if (foundKeywords.length > 0) {
        reasons.push(
            `Contains suspicious keywords: ${foundKeywords.join(", ")}`
        );
        score += Math.min(foundKeywords.length * 10, 25);
    }

    // 6. Excessive subdomains (more than 3 dots in hostname)
    try {
        const hostname = new URL(
            url.startsWith("http") ? url : `https://${url}`
        ).hostname;
        const dotCount = (hostname.match(/\./g) || []).length;
        if (dotCount > 3) {
            reasons.push("Excessive subdomains — possible domain spoofing");
            score += 15;
        }
    } catch {
        reasons.push("URL format is invalid or malformed");
        score += 10;
    }

    // 7. Encoded characters
    if (/%[0-9a-f]{2}/i.test(url)) {
        reasons.push("Contains encoded characters that may hide the true URL");
        score += 10;
    }

    // 8. Unusual port
    const portMatch = url.match(/:(\d{2,5})\//);
    if (portMatch) {
        const port = parseInt(portMatch[1]);
        if (port !== 80 && port !== 443) {
            reasons.push(`Uses a non-standard port (${port})`);
            score += 10;
        }
    }

    // 9. '@' symbol (credential phishing trick)
    if (url.includes("@")) {
        reasons.push("Contains '@' symbol — may redirect to a different site");
        score += 25;
    }

    score = Math.min(score, 100);

    return {
        status: score >= 50 ? "Malicious" : score >= 20 ? "Suspicious" : "Safe",
        reasons:
            reasons.length > 0 ? reasons : ["No suspicious indicators detected"],
        score,
    };
}

// ─── Message Analysis ────────────────────────────────────────────────────────

const URGENCY_PHRASES = [
    "act now", "immediately", "urgent", "expire", "suspended",
    "within 24 hours", "last chance", "final warning", "limited time",
    "don't delay", "right away", "asap", "action required",
];

const CREDENTIAL_PHRASES = [
    "verify your account", "confirm your identity", "update your payment",
    "enter your password", "social security", "credit card number",
    "bank account", "login credentials", "reset your password",
    "click here to verify", "confirm your details",
];

const IMPERSONATION_PHRASES = [
    "dear customer", "dear user", "dear valued", "dear member",
    "official notice", "security team", "support team",
    "we have detected", "your account has been",
];

const OFFER_PHRASES = [
    "you have won", "congratulations", "free gift", "prize",
    "lottery", "million dollars", "claim your", "selected as winner",
    "cash prize", "reward",
];

export function analyzeMessage(text: string): AnalysisResult {
    const reasons: string[] = [];
    let score = 0;
    const lower = text.toLowerCase();

    // 1. Urgency language
    const urgencyHits = URGENCY_PHRASES.filter((p) => lower.includes(p));
    if (urgencyHits.length > 0) {
        reasons.push(
            `Uses urgency/pressure language: "${urgencyHits.slice(0, 3).join('", "')}"`
        );
        score += Math.min(urgencyHits.length * 8, 25);
    }

    // 2. Credential requests
    const credentialHits = CREDENTIAL_PHRASES.filter((p) => lower.includes(p));
    if (credentialHits.length > 0) {
        reasons.push("Requests sensitive personal or financial information");
        score += Math.min(credentialHits.length * 12, 30);
    }

    // 3. Impersonation patterns
    const impersonationHits = IMPERSONATION_PHRASES.filter((p) =>
        lower.includes(p)
    );
    if (impersonationHits.length > 0) {
        reasons.push("Uses generic impersonation language (e.g. 'Dear Customer')");
        score += Math.min(impersonationHits.length * 8, 20);
    }

    // 4. Too-good-to-be-true offers
    const offerHits = OFFER_PHRASES.filter((p) => lower.includes(p));
    if (offerHits.length > 0) {
        reasons.push("Contains unrealistic offers or prize claims");
        score += Math.min(offerHits.length * 10, 25);
    }

    // 5. Suspicious links in text
    const linkPattern = /https?:\/\/[^\s]+/gi;
    const links = lower.match(linkPattern) || [];
    if (links.length > 0) {
        const suspiciousLinks = links.filter((l) =>
            SUSPICIOUS_TLDS.some((tld) => l.includes(tld)) ||
            URL_SHORTENERS.some((s) => l.includes(s))
        );
        if (suspiciousLinks.length > 0) {
            reasons.push("Contains links to suspicious or shortened URLs");
            score += 20;
        } else {
            reasons.push(`Contains ${links.length} link(s) — verify them separately`);
            score += 5;
        }
    }

    // 6. Excessive caps
    const capsRatio =
        text.replace(/[^A-Za-z]/g, "").length > 0
            ? (text.replace(/[^A-Z]/g, "").length /
                text.replace(/[^A-Za-z]/g, "").length) *
            100
            : 0;
    if (capsRatio > 40 && text.length > 20) {
        reasons.push("Excessive use of capital letters (common in scam messages)");
        score += 10;
    }

    // 7. Grammar / spelling red flags
    const grammarFlags = [
        /\byour\s+been\b/i,
        /\bkindly\s+do\b/i,
        /\bdo\s+the\s+needful\b/i,
        /\brevert\s+back\b/i,
    ];
    if (grammarFlags.some((r) => r.test(text))) {
        reasons.push("Contains unusual grammar patterns common in phishing");
        score += 10;
    }

    score = Math.min(score, 100);

    return {
        status: score >= 50 ? "Malicious" : score >= 20 ? "Suspicious" : "Safe",
        reasons:
            reasons.length > 0 ? reasons : ["No suspicious indicators detected"],
        score,
    };
}

// ─── Call Verification ───────────────────────────────────────────────────────

export interface CallDetails {
    callerNumber: string;
    claimedOrganization: string;
    callbackNumber: string;
    callDescription: string;
}

const SCAM_CLAIM_KEYWORDS = [
    "irs", "tax", "warrant", "arrest", "police", "fbi", "dea",
    "social security", "medicare", "microsoft", "apple", "amazon",
    "tech support", "virus", "refund", "overpayment",
];

const PRESSURE_PHRASES = [
    "gift card", "wire transfer", "bitcoin", "cryptocurrency",
    "do not hang up", "do not tell anyone", "stay on the line",
    "legal action", "arrest warrant", "suspended",
];

export function analyzeCall(details: CallDetails): AnalysisResult {
    const reasons: string[] = [];
    let score = 0;

    const desc = details.callDescription.toLowerCase();
    const org = details.claimedOrganization.toLowerCase();
    const combined = `${desc} ${org}`;

    // 1. Known scam claim patterns
    const scamHits = SCAM_CLAIM_KEYWORDS.filter((kw) => combined.includes(kw));
    if (scamHits.length > 0) {
        reasons.push(
            `Caller claims to represent: ${scamHits.join(", ")} — a common scam tactic`
        );
        score += Math.min(scamHits.length * 12, 30);
    }

    // 2. Pressure tactics
    const pressureHits = PRESSURE_PHRASES.filter((p) => desc.includes(p));
    if (pressureHits.length > 0) {
        reasons.push("Uses pressure or fear tactics to force immediate action");
        score += Math.min(pressureHits.length * 10, 25);
    }

    // 3. Requests personal information
    const personalInfoPatterns = [
        "social security", "ssn", "bank account", "credit card",
        "password", "pin", "date of birth",
    ];
    if (personalInfoPatterns.some((p) => desc.includes(p))) {
        reasons.push("Requests sensitive personal or financial information");
        score += 25;
    }

    // 4. Caller number analysis
    const number = details.callerNumber.replace(/\D/g, "");
    if (number.length < 7 || number.length > 15) {
        reasons.push("Caller number has an unusual length");
        score += 10;
    }

    // 5. Callback number differs from caller number
    const callback = details.callbackNumber.replace(/\D/g, "");
    if (callback && callback !== number && callback.length >= 7) {
        reasons.push("Callback number differs from the caller number");
        score += 10;
    }

    // 6. Payment via unusual methods
    const unusualPayment = ["gift card", "wire transfer", "bitcoin", "crypto", "western union"];
    if (unusualPayment.some((p) => desc.includes(p))) {
        reasons.push("Requests payment through untraceable methods (gift cards, crypto, wire transfer)");
        score += 30;
    }

    // 7. Government agencies don't cold-call
    const govAgencies = ["irs", "fbi", "dea", "ssa", "social security administration"];
    if (govAgencies.some((a) => org.includes(a))) {
        reasons.push("Government agencies rarely make unsolicited phone calls");
        score += 15;
    }

    score = Math.min(score, 100);

    return {
        status: score >= 50 ? "Malicious" : score >= 20 ? "Suspicious" : "Safe",
        reasons:
            reasons.length > 0
                ? reasons
                : ["No suspicious indicators detected for this call"],
        score,
    };
}
