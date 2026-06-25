// ─── Shared Types ────────────────────────────────────────────────────────────

export interface Finding {
    label: string;       // short human-readable title
    description: string; // plain-English explanation of why it matters
    points: number;      // points contributed to risk score
    triggered: boolean;  // whether this check was triggered
}

export interface AnalysisResult {
    score: number;            // 0–100 capped
    riskLevel: "Low Risk" | "Moderate" | "High Risk" | "Critical";
    verdict: string;          // 1–2 sentence plain-English conclusion
    findings: Finding[];      // every check, triggered or not
}

function riskLevel(score: number): AnalysisResult["riskLevel"] {
    if (score <= 25) return "Low Risk";
    if (score <= 50) return "Moderate";
    if (score <= 75) return "High Risk";
    return "Critical";
}

// ─── URL Analysis ────────────────────────────────────────────────────────────

const BRAND_NAMES = [
    "amazon", "paypal", "google", "microsoft", "apple", "netflix", "facebook",
    "instagram", "whatsapp", "hdfc", "sbi", "icici", "axis", "kotak",
    "paytm", "phonepe", "gpay", "razorpay", "flipkart", "myntra",
    "jio", "airtel", "vodafone", "linkedin", "twitter", "dropbox",
    "chase", "wellsfargo", "bankofamerica", "citibank",
];

const SUSPICIOUS_TLDS = [
    ".xyz", ".top", ".click", ".loan", ".gq", ".tk", ".ml", ".cf",
    ".ga", ".pw", ".buzz", ".link", ".work", ".surf", ".cc",
];

const URL_SHORTENERS = [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "bl.ink", "shorturl.at",
    "rb.gy", "cutt.ly", "tiny.cc",
];

/** Shannon entropy of a string */
function shannonEntropy(s: string): number {
    const freq: Record<string, number> = {};
    for (const c of s) freq[c] = (freq[c] || 0) + 1;
    const len = s.length;
    let entropy = 0;
    for (const c in freq) {
        const p = freq[c] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

/** Returns true if any character in the string is non-Latin (Cyrillic, Greek, etc.) */
function hasHomoglyphs(domain: string): boolean {
    // eslint-disable-next-line no-control-regex
    return /[^\u0000-\u007F]/.test(domain) ||
        /[\u0400-\u04FF]/.test(domain) ||  // Cyrillic
        /[\u0370-\u03FF]/.test(domain);    // Greek
}

/** Extract registered domain (last two parts of hostname) */
function registeredDomain(hostname: string): string {
    const parts = hostname.split(".");
    if (parts.length >= 3) {
        const last = parts[parts.length - 1];
        const prev = parts[parts.length - 2];
        // Handle common multi-part country code TLDs (e.g., .co.uk, .com.au, .gov.in)
        if (last.length === 2 && prev.length <= 3) {
            return parts.slice(-3).join(".");
        }
    }
    return parts.length >= 2 ? parts.slice(-2).join(".") : hostname;
}

export function analyzeUrl(raw: string): AnalysisResult {
    const findings: Finding[] = [];
    let score = 0;

    const url = raw.trim();
    const lower = url.toLowerCase();

    let hostname = "";
    try {
        const parsed = new URL(lower.startsWith("http") ? lower : `https://${lower}`);
        hostname = parsed.hostname;
    } catch {
        hostname = lower.split("/")[0];
    }

    const regDomain = registeredDomain(hostname);

    // ── Step 1: Homograph Attack (+40) ──
    const homoglyphDetected = hasHomoglyphs(hostname);
    findings.push({
        label: "Homograph attack detection",
        description: homoglyphDetected
            ? "The domain uses characters that look like normal letters but are not — a common trick to make fake sites look real."
            : "The domain uses standard Latin characters only.",
        points: 40,
        triggered: homoglyphDetected,
    });
    if (homoglyphDetected) score += 40;

    // ── Step 2: Brand Used as Subdomain (+35) ──
    const brandInSubdomain = BRAND_NAMES.some(
        (brand) => lower.includes(brand) && !regDomain.includes(brand)
    );
    findings.push({
        label: "Brand name used as subdomain",
        description: brandInSubdomain
            ? "A well-known brand name appears in the link, but the actual destination website is something else entirely."
            : "No well-known brand names being misused in the URL structure.",
        points: 35,
        triggered: brandInSubdomain,
    });
    if (brandInSubdomain) score += 35;

    // ── Step 3: @ Symbol (+30) ──
    const urlWithoutProtocol = lower.replace(/^(https?:\/\/)?(www\.)?/, "");
    const authorityPart = urlWithoutProtocol.split(/[/?#]/)[0];
    const hasAtSymbol = authorityPart.includes("@");
    findings.push({
        label: "@ symbol in URL",
        description: hasAtSymbol
            ? "The '@' symbol forces browsers to ignore everything before it and navigate to a different destination — this has virtually no legitimate use."
            : "No '@' symbol redirection trick detected.",
        points: 30,
        triggered: hasAtSymbol,
    });
    if (hasAtSymbol) score += 30;

    // ── Step 4: URL Shortener (+20) ──
    const shortenerMatch = URL_SHORTENERS.find((s) => lower.includes(s));
    findings.push({
        label: "URL shortener detected",
        description: shortenerMatch
            ? `This link uses a URL shortener (${shortenerMatch}) which hides the true destination.`
            : "The link does not use a URL shortener.",
        points: 20,
        triggered: !!shortenerMatch,
    });
    if (shortenerMatch) score += 20;

    // ── Step 5: High Entropy Domain (+20) ──
    const domainBase = hostname.split(".").slice(0, -1).join(".");
    const entropy = shannonEntropy(domainBase);
    const highEntropy = entropy > 3.5 && domainBase.length > 6;
    findings.push({
        label: "High entropy domain name",
        description: highEntropy
            ? "The domain name looks random or auto-generated, which is common with phishing sites."
            : "The domain name appears human-readable.",
        points: 20,
        triggered: highEntropy,
    });
    if (highEntropy) score += 20;

    // ── Step 6: Suspicious TLD (+15) ──
    const suspiciousTld = SUSPICIOUS_TLDS.find((tld) => hostname.endsWith(tld));
    findings.push({
        label: "Suspicious top-level domain",
        description: suspiciousTld
            ? `This type of domain extension (${suspiciousTld}) is rarely used by legitimate websites and is statistically associated with phishing.`
            : "The domain extension is commonly used by legitimate websites.",
        points: 15,
        triggered: !!suspiciousTld,
    });
    if (suspiciousTld) score += 15;

    // ── Step 7: HTTP Instead of HTTPS (+10) ──
    const isHttp = lower.startsWith("http://");
    findings.push({
        label: "HTTP instead of HTTPS",
        description: isHttp
            ? "The connection is not encrypted. Any legitimate site handling personal data uses HTTPS."
            : "Uses an encrypted connection (HTTPS).",
        points: 10,
        triggered: isHttp,
    });
    if (isHttp) score += 10;

    // ── Step 8: Excessive Subdomains (+10) ──
    const subdomainCount = hostname.split(".").length - 2;
    const excessiveSubdomains = subdomainCount > 3;
    findings.push({
        label: "Excessive subdomains",
        description: excessiveSubdomains
            ? "More than three subdomain levels is unusual and may be used to bury the real domain name."
            : "The subdomain structure looks normal.",
        points: 10,
        triggered: excessiveSubdomains,
    });
    if (excessiveSubdomains) score += 10;

    score = Math.min(score, 100);

    // ── Build verdict ──
    const triggeredFindings = findings.filter((f) => f.triggered);
    let verdict: string;
    if (score >= 76) {
        verdict = "This link is almost certainly a phishing attempt. " +
            (brandInSubdomain
                ? "It uses a fake version of a well-known brand name to appear legitimate, but the actual website it leads to is completely unrelated to that brand."
                : "Multiple strong deception indicators were found that suggest deliberate fraud.");
    } else if (score >= 51) {
        verdict = "This link shows strong signs of being suspicious. Proceed with extreme caution and verify the source independently before clicking.";
    } else if (score >= 26) {
        verdict = "This link has some characteristics that warrant caution. While it may be legitimate, consider verifying it through other channels.";
    } else {
        verdict = triggeredFindings.length > 0
            ? "This link appears mostly safe, though minor indicators were noted. It is probably fine to proceed."
            : "No suspicious indicators were detected. This link appears safe.";
    }

    return { score, riskLevel: riskLevel(score), verdict, findings };
}

// ─── Message Analysis ────────────────────────────────────────────────────────

const SENSITIVE_DATA_PATTERNS = [
    /\b(send|share|provide|enter|confirm|reply\s+with|give)\b.*\b(otp|pin|password|cvv|card\s*number|credit\s*card|debit\s*card|aadhaar|aadhar|ssn|social\s*security)\b/i,
    /\b(otp|pin|password|cvv|card\s*number|credit\s*card|debit\s*card|aadhaar|aadhar|ssn|social\s*security)\b.*\b(send|share|provide|enter|confirm|reply|give)\b/i,
];

const URGENCY_PHRASES = [
    "act now", "immediately", "urgent", "expire", "suspended",
    "within 24 hours", "within 48 hours", "last chance", "final warning",
    "limited time", "don't delay", "right away", "asap", "action required",
    "your account will be", "account expires", "last warning",
];

const LEETSPEAK_PATTERNS = [
    /v[3e]rify/i, /acc[0o]unt/i, /l[0o]gin/i, /upd[4a]te/i,
    /s[3e]cure/i, /p[4a]ssw[0o]rd/i, /c[0o]nfirm/i, /b[4a]nk/i,
];

const IMPERSONATION_BRANDS = [
    "amazon", "paypal", "netflix", "sbi", "hdfc", "icici", "jio", "airtel",
    "income tax", "trai", "google", "microsoft", "apple", "facebook",
    "whatsapp", "flipkart", "paytm", "phonepe",
];

const GENERIC_GREETINGS = [
    "dear customer", "dear user", "dear valued", "dear member",
    "hello friend", "dear sir", "dear madam", "dear account holder",
];

export function analyzeMessage(text: string): AnalysisResult {
    const findings: Finding[] = [];
    let score = 0;
    const lower = text.toLowerCase();

    // ── Step 1: Requests Sensitive Information (+40) ──
    const requestsSensitive = SENSITIVE_DATA_PATTERNS.some((r) => r.test(text));
    findings.push({
        label: "Requests sensitive information",
        description: requestsSensitive
            ? "The message asks for sensitive data like an OTP, PIN, password, or card number. No legitimate company ever requests this via text."
            : "No requests for sensitive personal data were detected.",
        points: 40,
        triggered: requestsSensitive,
    });
    if (requestsSensitive) score += 40;

    // ── Step 2: URL Combined With Urgency (+30) ──
    const hasUrl = /https?:\/\/[^\s]+/i.test(text) || /www\.[^\s]+/i.test(text);
    const hasUrgency = URGENCY_PHRASES.some((p) => lower.includes(p));
    const urlPlusUrgency = hasUrl && hasUrgency;
    findings.push({
        label: "URL combined with urgency language",
        description: urlPlusUrgency
            ? "The message contains a link alongside pressure language — the most common phishing delivery pattern."
            : hasUrl
                ? "A link was found but without urgency language."
                : "No link was found in the message.",
        points: 30,
        triggered: urlPlusUrgency,
    });
    if (urlPlusUrgency) score += 30;

    // ── Step 3: Leetspeak / Character Substitutions (+25) ──
    const leetspeakFound = LEETSPEAK_PATTERNS.some((r) => r.test(text));
    findings.push({
        label: "Leetspeak or character substitutions",
        description: leetspeakFound
            ? "The message deliberately misspells words with number/letter substitutions to bypass filters — a clear scam indicator."
            : "No character substitution tricks were detected.",
        points: 25,
        triggered: leetspeakFound,
    });
    if (leetspeakFound) score += 25;

    // ── Step 4: Brand Impersonation + Other Red Flags (+20) ──
    const mentionedBrand = IMPERSONATION_BRANDS.find((b) => lower.includes(b));
    const otherRedFlags = requestsSensitive || urlPlusUrgency || leetspeakFound || hasUrgency;
    const brandImpersonation = !!mentionedBrand && otherRedFlags;
    findings.push({
        label: "Known brand impersonation",
        description: brandImpersonation
            ? `The message claims to be from "${mentionedBrand}" while also showing other suspicious patterns — a strong impersonation signal.`
            : mentionedBrand
                ? `Mentions "${mentionedBrand}" but no other red flags were found alongside it.`
                : "No brand impersonation detected.",
        points: 20,
        triggered: brandImpersonation,
    });
    if (brandImpersonation) score += 20;

    // ── Step 5: Time Pressure Language (+15) ──
    // Only count independently if URL+urgency combo wasn't already triggered
    const timePressure = hasUrgency && !urlPlusUrgency;
    findings.push({
        label: "Time pressure language",
        description: hasUrgency
            ? "The message creates urgency and panic to stop you from thinking critically — a core psychological weapon in phishing."
            : "No time pressure language was detected.",
        points: 15,
        triggered: timePressure,
    });
    if (timePressure) score += 15;

    // ── Step 6: Generic Greeting (+10) ──
    const genericGreeting = GENERIC_GREETINGS.some((g) => lower.includes(g));
    findings.push({
        label: "Generic greeting",
        description: genericGreeting
            ? "The message uses a generic greeting like 'Dear Customer' — real companies that contact you know your name."
            : "No generic bulk-send greeting detected.",
        points: 10,
        triggered: genericGreeting,
    });
    if (genericGreeting) score += 10;

    // ── Step 7: Grammar & Encoding Anomalies (+10) ──
    const grammarFlags = [
        /\byour\s+been\b/i,
        /\bkindly\s+do\b/i,
        /\bdo\s+the\s+needful\b/i,
        /\brevert\s+back\b/i,
        /[!]{3,}/,
        /\b(sirs?|madam)\b.*\b(sirs?|madam)\b/i,
    ];
    const grammarIssues = grammarFlags.some((r) => r.test(text));
    findings.push({
        label: "Grammar or encoding anomalies",
        description: grammarIssues
            ? "Unusual grammar patterns were detected that are common in automated or non-native phishing messages."
            : "No obvious grammar anomalies detected.",
        points: 10,
        triggered: grammarIssues,
    });
    if (grammarIssues) score += 10;

    score = Math.min(score, 100);

    // ── Build verdict ──
    const triggeredCount = findings.filter((f) => f.triggered).length;
    let verdict: string;
    if (score >= 76) {
        verdict = "This message is almost certainly a phishing or scam attempt. Multiple strong manipulation tactics were detected. Do not respond, click links, or share any information.";
    } else if (score >= 51) {
        verdict = "This message shows strong signs of being a scam. Treat it with extreme suspicion and verify independently before taking any action.";
    } else if (score >= 26) {
        verdict = "This message has some characteristics of phishing. While it could be legitimate, proceed with caution.";
    } else {
        verdict = triggeredCount > 0
            ? "This message appears mostly safe, though minor indicators were noted."
            : "No suspicious indicators were detected. This message appears safe.";
    }

    return { score, riskLevel: riskLevel(score), verdict, findings };
}

// ─── Phone Verification ─────────────────────────────────────────────────────

/** Country code validation rules for E.164 */
interface CountryRule {
    code: string;
    name: string;
    expectedLength: number; // digits AFTER country code
    validPrefixes?: string[];  // allowed starting digits after country code
    invalidAreaCodes?: string[]; // known invalid area code prefixes
    voipPrefixes?: string[];    // known VOIP prefixes
}

const COUNTRY_RULES: CountryRule[] = [
    {
        code: "91", name: "India", expectedLength: 10,
        validPrefixes: ["6", "7", "8", "9"],
        voipPrefixes: ["140"],
    },
    {
        code: "1", name: "US/Canada", expectedLength: 10,
        invalidAreaCodes: ["000", "100", "010", "001", "011", "555"],
        voipPrefixes: ["500", "533", "544", "566", "577", "588"],
    },
    {
        code: "44", name: "UK", expectedLength: 10,
        validPrefixes: ["1", "2", "3", "7", "8"],
        voipPrefixes: ["56"],
    },
    {
        code: "61", name: "Australia", expectedLength: 9,
        validPrefixes: ["2", "3", "4", "7", "8"],
        voipPrefixes: ["550"],
    },
];

const ONE_RING_SCAM_CODES = [
    "222",  // Mauritania
    "232",  // Sierra Leone
    "252",  // Somalia
    "269",  // Comoros
    "284",  // British Virgin Islands
    "473",  // Grenada
    "649",  // Turks and Caicos
    "664",  // Montserrat
    "675",  // Papua New Guinea
    "676",  // Tonga
    "684",  // American Samoa
    "767",  // Dominica
    "809",  // Dominican Republic
    "868",  // Trinidad and Tobago
    "876",  // Jamaica
    "900",  // Premium US
    "976",  // Premium US
];

export function analyzePhone(rawNumber: string): AnalysisResult {
    const findings: Finding[] = [];
    let score = 0;

    // Clean the input: keep only digits and leading +
    const cleaned = rawNumber.replace(/[\s\-().]/g, "");
    const digits = cleaned.replace(/^\+/, "");

    // Try to match a country rule
    let matchedRule: CountryRule | null = null;
    let nationalDigits = "";
    for (const rule of COUNTRY_RULES) {
        if (digits.startsWith(rule.code)) {
            matchedRule = rule;
            nationalDigits = digits.slice(rule.code.length);
            break;
        }
    }

    // ── Step 1: E.164 Structural Validation (+40) ──
    let e164Fail = false;
    if (matchedRule) {
        if (nationalDigits.length !== matchedRule.expectedLength) {
            e164Fail = true;
        } else if (
            matchedRule.validPrefixes &&
            !matchedRule.validPrefixes.some((p) => nationalDigits.startsWith(p))
        ) {
            e164Fail = true;
        }
    } else {
        // Unknown country code — check basic E.164 length (7–15 digits total)
        if (digits.length < 7 || digits.length > 15) {
            e164Fail = true;
        }
    }
    findings.push({
        label: "E.164 structural validation",
        description: e164Fail
            ? `This number fails the international phone number standard${matchedRule ? ` for ${matchedRule.name}` : ""}. Real numbers always follow these structural rules.`
            : `The number follows valid structural rules${matchedRule ? ` for ${matchedRule.name}` : ""}.`,
        points: 40,
        triggered: e164Fail,
    });
    if (e164Fail) score += 40;

    // ── Step 2: One-Ring Scam Country Code (+35) ──
    const oneRingMatch = ONE_RING_SCAM_CODES.find((c) => digits.startsWith(c));
    findings.push({
        label: "Known one-ring scam country code",
        description: oneRingMatch
            ? `This number uses country code +${oneRingMatch}, which is notorious for one-ring scams that charge premium rates when you call back.`
            : "The country code is not associated with one-ring scam operations.",
        points: 35,
        triggered: !!oneRingMatch,
    });
    if (oneRingMatch) score += 35;

    // ── Step 3: Repetitive or Sequential Digits (+25) ──
    const allSameDigit = /^(\d)\1+$/.test(nationalDigits || digits);
    const sequential = isSequential(nationalDigits || digits);
    const repetitivePattern = allSameDigit || sequential;
    findings.push({
        label: "Repetitive or sequential digit pattern",
        description: repetitivePattern
            ? "The number contains a suspicious pattern of repeating or sequential digits — a signature of auto-dialler systems used by scammers."
            : "The digit distribution looks like a naturally assigned number.",
        points: 25,
        triggered: repetitivePattern,
    });
    if (repetitivePattern) score += 25;

    // ── Step 4: VOIP Prefix Detected (+20) ──
    let voipDetected = false;
    if (matchedRule?.voipPrefixes) {
        voipDetected = matchedRule.voipPrefixes.some((p) => nationalDigits.startsWith(p));
    }
    findings.push({
        label: "VOIP prefix detected",
        description: voipDetected
            ? "This number matches a known VOIP (internet phone) prefix — VOIP numbers are cheap, disposable, and commonly used by scam operations."
            : "No VOIP prefix was detected.",
        points: 20,
        triggered: voipDetected,
    });
    if (voipDetected) score += 20;

    // ── Step 5: Impossible Area Code (+20) ──
    let impossibleAreaCode = false;
    if (matchedRule?.invalidAreaCodes && nationalDigits.length >= 3) {
        const areaCode = nationalDigits.slice(0, 3);
        impossibleAreaCode = matchedRule.invalidAreaCodes.includes(areaCode);
    }
    findings.push({
        label: "Impossible area code for region",
        description: impossibleAreaCode
            ? "The area code does not exist for the claimed region — a sign of caller ID spoofing."
            : "The area code appears valid for the claimed region.",
        points: 20,
        triggered: impossibleAreaCode,
    });
    if (impossibleAreaCode) score += 20;

    score = Math.min(score, 100);

    // ── Build verdict ──
    const triggeredCount = findings.filter((f) => f.triggered).length;
    let verdict: string;
    if (score >= 76) {
        verdict = "This phone number is almost certainly associated with a scam operation. Do not call back or answer calls from this number.";
    } else if (score >= 51) {
        verdict = "This phone number shows strong signs of being suspicious. Exercise extreme caution if this number contacts you.";
    } else if (score >= 26) {
        verdict = "This phone number has some characteristics that warrant caution. Consider verifying the caller through official channels.";
    } else {
        verdict = triggeredCount > 0
            ? "This phone number appears mostly legitimate, though minor indicators were noted."
            : "No suspicious indicators were detected. This phone number appears legitimate.";
    }

    return { score, riskLevel: riskLevel(score), verdict, findings };
}

/** Check if digits form a sequential run (ascending or descending) */
function isSequential(digits: string): boolean {
    if (digits.length < 6) return false;
    let ascending = 0;
    let descending = 0;
    for (let i = 1; i < digits.length; i++) {
        const diff = parseInt(digits[i]) - parseInt(digits[i - 1]);
        if (diff === 1) ascending++;
        else if (diff === -1) descending++;
    }
    const ratio = Math.max(ascending, descending) / (digits.length - 1);
    return ratio > 0.7;
}
