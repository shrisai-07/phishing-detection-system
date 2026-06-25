import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/analysis";
import {
    X, ShieldCheck, ShieldAlert, ShieldX, CircleAlert,
    CheckCircle2, XCircle, Copy, Check,
    Ban, Flag, Share2, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";

interface ReportModalProps {
    result: AnalysisResult | null;
    open: boolean;
    onClose: () => void;
    inputLabel: string; // e.g. "URL", "Message", "Phone Number"
    inputValue: string; // The raw input value that was analyzed
}

/* ── Verdict config per risk tier ── */
const VERDICT_CONFIG = {
    "Low Risk": {
        bg: "bg-emerald-500",
        bgSubtle: "bg-emerald-50 dark:bg-emerald-500/10",
        text: "text-white",
        barColor: "bg-emerald-500",
        barTrack: "bg-emerald-100 dark:bg-emerald-500/20",
        scoreText: "text-emerald-700 dark:text-emerald-400",
        icon: <ShieldCheck className="h-6 w-6" />,
        headline: "Looks Safe",
        animation: "",
    },
    "Moderate": {
        bg: "bg-amber-500",
        bgSubtle: "bg-amber-50 dark:bg-amber-500/10",
        text: "text-white",
        barColor: "bg-amber-500",
        barTrack: "bg-amber-100 dark:bg-amber-500/20",
        scoreText: "text-amber-700 dark:text-amber-400",
        icon: <ShieldAlert className="h-6 w-6" />,
        headline: "Be Careful",
        animation: "",
    },
    "High Risk": {
        bg: "bg-orange-500",
        bgSubtle: "bg-orange-50 dark:bg-orange-500/10",
        text: "text-white",
        barColor: "bg-orange-500",
        barTrack: "bg-orange-100 dark:bg-orange-500/20",
        scoreText: "text-orange-700 dark:text-orange-400",
        icon: <CircleAlert className="h-6 w-6" />,
        headline: "Probably Dangerous",
        animation: "animate-pulse-subtle",
    },
    "Critical": {
        bg: "bg-red-600",
        bgSubtle: "bg-red-50 dark:bg-red-500/10",
        text: "text-white",
        barColor: "bg-red-600",
        barTrack: "bg-red-100 dark:bg-red-500/20",
        scoreText: "text-red-700 dark:text-red-400",
        icon: <ShieldX className="h-6 w-6" />,
        headline: "Almost Certainly a Scam",
        animation: "animate-shake",
    },
};

/* ── Action items based on risk ── */
function getActions(score: number, inputLabel: string) {
    if (score >= 51) {
        const actions = [];
        if (inputLabel === "URL") {
            actions.push({ icon: <Ban className="h-4 w-4" />, text: "Do NOT click this link" });
        } else if (inputLabel === "Message") {
            actions.push({ icon: <Ban className="h-4 w-4" />, text: "Do NOT reply to this message" });
        } else {
            actions.push({ icon: <Ban className="h-4 w-4" />, text: "Do NOT call back this number" });
        }
        actions.push(
            { icon: <Flag className="h-4 w-4" />, text: "Block and report this sender" },
            { icon: <ExternalLink className="h-4 w-4" />, text: "Report to cybercrime.gov.in", link: "https://cybercrime.gov.in" },
            { icon: <Share2 className="h-4 w-4" />, text: "Warn family & friends about this" },
        );
        return actions;
    }
    if (score >= 26) {
        return [
            { icon: <ShieldAlert className="h-4 w-4" />, text: "Proceed with caution — verify independently" },
            { icon: <Flag className="h-4 w-4" />, text: "Double-check the sender's identity" },
        ];
    }
    return [
        { icon: <CheckCircle2 className="h-4 w-4" />, text: "This appears safe to proceed" },
        { icon: <ShieldCheck className="h-4 w-4" />, text: "Tip: Always verify the sender independently" },
    ];
}

export function ReportModal({ result, open, onClose, inputLabel, inputValue }: ReportModalProps) {
    const [copied, setCopied] = useState(false);
    const [showPassed, setShowPassed] = useState(false);

    if (!result) return null;

    const config = VERDICT_CONFIG[result.riskLevel];
    const triggeredFindings = result.findings.filter((f) => f.triggered);
    const passedFindings = result.findings.filter((f) => !f.triggered);
    const actions = getActions(result.score, inputLabel);

    async function copyReport() {
        const lines = [
            `🛡️ Phishing Detection Report`,
            `─────────────────────────────`,
            `${inputLabel}: ${inputValue}`,
            `Risk: ${result!.riskLevel} (${result!.score}/100)`,
            ``,
            `Verdict: ${result!.verdict}`,
            ``,
            `Findings:`,
            ...result!.findings
                .filter((f) => f.triggered)
                .map((f) => `  ⚠️ ${f.label}: ${f.description}`),
            ``,
            `🔒 Analyzed locally — no data was sent to any server.`,
        ];
        try {
            await navigator.clipboard.writeText(lines.join("\n"));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard not available */
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setShowPassed(false); setCopied(false); } }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* ── Verdict Banner ── */}
                <div className={`${config.bg} ${config.text} ${config.animation} px-6 py-5 rounded-t-lg`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-inherit">
                            {config.icon}
                            {config.headline}
                        </DialogTitle>
                        <DialogDescription className="text-inherit/80 text-sm mt-1.5 font-medium">
                            {result.verdict}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogClose asChild>
                    <button
                        className="absolute right-3 top-3 rounded-full p-1 opacity-80 ring-offset-background transition-opacity hover:opacity-100 text-white hover:bg-white/20"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogClose>

                <div className="px-6 py-5 space-y-5">
                    {/* ── Input Value ── */}
                    <div className="text-xs border border-border/60 bg-muted/40 rounded-md px-3 py-2">
                        <span className="font-semibold text-muted-foreground block mb-1 uppercase tracking-wider text-[10px]">
                            Analyzed {inputLabel}:
                        </span>
                        <div className="font-mono break-all text-foreground select-all leading-normal max-h-20 overflow-y-auto pr-1">
                            {inputLabel === "Message" && inputValue.length > 200
                                ? `${inputValue.slice(0, 200)}...`
                                : inputValue
                            }
                        </div>
                    </div>

                    {/* ── Risk Score Bar ── */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">Risk Score</span>
                            <span className={`text-2xl font-bold ${config.scoreText}`}>
                                {result.score}<span className="text-sm font-normal text-muted-foreground">/100</span>
                            </span>
                        </div>
                        <div className={`h-2.5 w-full rounded-full ${config.barTrack} overflow-hidden`}>
                            <div
                                className={`h-full rounded-full ${config.barColor} transition-all duration-1000 ease-out`}
                                style={{ width: `${result.score}%` }}
                            />
                        </div>
                    </div>

                    {/* ── Triggered Findings ── */}
                    {triggeredFindings.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <XCircle className="h-4 w-4 text-red-500" />
                                What We Found ({triggeredFindings.length})
                            </h3>
                            <ul className="space-y-2">
                                {triggeredFindings.map((finding, i) => (
                                    <li key={i}
                                        className="flex items-start gap-2.5 rounded-md border border-red-200 dark:border-red-500/20 bg-red-50/60 dark:bg-red-500/5 px-3 py-2.5 text-sm animate-in"
                                        style={{ animationDelay: `${i * 80}ms`, animationFillMode: "backwards" }}
                                    >
                                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                        <div>
                                            <span className="font-semibold text-foreground">{finding.label}</span>
                                            <p className="text-foreground/70 mt-0.5 text-[13px] leading-relaxed">{finding.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* ── Passed Findings (collapsed) ── */}
                    {passedFindings.length > 0 && (
                        <div>
                            <button
                                onClick={() => setShowPassed(!showPassed)}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-start"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                {passedFindings.length} check{passedFindings.length > 1 ? "s" : ""} passed
                                {showPassed ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
                            </button>
                            {showPassed && (
                                <ul className="space-y-1.5 mt-2">
                                    {passedFindings.map((finding, i) => (
                                        <li key={i}
                                            className="flex items-start gap-2 rounded-md border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5 px-3 py-2 text-[13px] text-foreground/70 animate-in"
                                            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "backwards" }}
                                        >
                                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                            <span>{finding.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* ── What To Do Now ── */}
                    <div className={`rounded-lg border px-4 py-3 space-y-2 ${result.score >= 51
                        ? "border-red-200 dark:border-red-500/20 bg-red-50/30 dark:bg-red-500/5"
                        : result.score >= 26
                            ? "border-amber-200 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5"
                            : "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5"
                        }`}>
                        <h3 className="text-sm font-semibold text-foreground">What You Should Do</h3>
                        <ul className="space-y-1.5">
                            {actions.map((action, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                                    <span className="shrink-0 text-muted-foreground">{action.icon}</span>
                                    {action.link ? (
                                        <a href={action.link} target="_blank" rel="noopener noreferrer"
                                            className="underline underline-offset-2 hover:text-foreground transition-colors">
                                            {action.text}
                                        </a>
                                    ) : (
                                        action.text
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Footer: Privacy + Actions ── */}
                    <div className="flex flex-col items-center gap-3 pt-3 border-t border-border/40">
                        <p className="text-xs text-muted-foreground text-center">
                            🔒 This analysis ran entirely in your browser. No data was sent to any server.
                        </p>
                        <div className="flex gap-2 w-full">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyReport}
                                className="flex-1"
                            >
                                {copied ? (
                                    <><Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Copied!</>
                                ) : (
                                    <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Report</>
                                )}
                            </Button>
                            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
