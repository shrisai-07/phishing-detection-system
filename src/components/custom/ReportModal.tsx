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
import { X, ShieldCheck, ShieldAlert, ShieldX, CircleAlert, CheckCircle2, XCircle } from "lucide-react";

interface ReportModalProps {
    result: AnalysisResult | null;
    open: boolean;
    onClose: () => void;
    inputLabel: string; // e.g. "URL", "Message", "Phone Number"
    inputValue: string; // The raw input value that was analyzed
}

function scoreColor(score: number) {
    if (score <= 25) return { ring: "stroke-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", fill: "text-emerald-500" };
    if (score <= 50) return { ring: "stroke-amber-500", bg: "bg-amber-50", text: "text-amber-700", fill: "text-amber-500" };
    if (score <= 75) return { ring: "stroke-orange-500", bg: "bg-orange-50", text: "text-orange-700", fill: "text-orange-500" };
    return { ring: "stroke-red-500", bg: "bg-red-50", text: "text-red-700", fill: "text-red-500" };
}

function riskIcon(score: number) {
    if (score <= 25) return <ShieldCheck className="h-5 w-5 text-emerald-600" />;
    if (score <= 50) return <ShieldAlert className="h-5 w-5 text-amber-600" />;
    if (score <= 75) return <CircleAlert className="h-5 w-5 text-orange-600" />;
    return <ShieldX className="h-5 w-5 text-red-600" />;
}

export function ReportModal({ result, open, onClose, inputLabel, inputValue }: ReportModalProps) {
    if (!result) return null;

    const colors = scoreColor(result.score);
    const circumference = 2 * Math.PI * 54; // r=54
    const dashOffset = circumference - (result.score / 100) * circumference;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        {riskIcon(result.score)}
                        {inputLabel} Analysis Report
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Detailed threat analysis report for the submitted {inputLabel.toLowerCase()}.
                    </DialogDescription>
                </DialogHeader>

                {/* ── Input Value Display ── */}
                <div className="mt-2.5 text-xs border border-border/60 bg-muted/40 rounded-md px-3 py-2">
                    <span className="font-semibold text-muted-foreground block mb-1 uppercase tracking-wider text-[10px]">
                        Analyzed {inputLabel}:
                    </span>
                    <div className="font-mono break-all text-foreground select-all leading-normal max-h-24 overflow-y-auto pr-1">
                        {inputLabel === "Message" && inputValue.length > 200
                            ? `${inputValue.slice(0, 200)}...`
                            : inputValue
                        }
                    </div>
                </div>

                <DialogClose asChild>
                    <button
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </DialogClose>

                {/* ── Risk Score Circle ── */}
                <div className="flex flex-col items-center py-4">
                    <div className="relative h-32 w-32">
                        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
                                className="text-muted/30" strokeWidth="8" />
                            <circle cx="60" cy="60" r="54" fill="none"
                                className={colors.ring}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-bold ${colors.text}`}>{result.score}</span>
                            <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                    </div>
                    <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}>
                        {result.riskLevel}
                    </span>
                </div>

                {/* ── Plain English Verdict ── */}
                <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-foreground/90 leading-relaxed">
                    {result.verdict}
                </div>

                {/* ── Individual Findings ── */}
                <div className="space-y-2 pt-2">
                    <h3 className="text-sm font-semibold text-foreground">Detailed Findings</h3>
                    <ul className="space-y-2">
                        {result.findings.map((finding, i) => (
                            <li key={i}
                                className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                                    finding.triggered
                                        ? "border-red-200 bg-red-50/60 text-foreground"
                                        : "border-emerald-200 bg-emerald-50/40 text-foreground/80"
                                }`}
                            >
                                {finding.triggered
                                    ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                    : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                }
                                <div>
                                    <span className="font-medium">{finding.triggered ? "✗" : "✓"} </span>
                                    {finding.description}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ── Privacy Note + Close ── */}
                <div className="flex flex-col items-center gap-3 pt-3 border-t border-border/40">
                    <p className="text-xs text-muted-foreground text-center">
                        🔒 This analysis ran entirely in your browser. No data was sent to any server.
                    </p>
                    <Button variant="outline" size="sm" onClick={onClose} className="w-full">
                        Close Report
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
