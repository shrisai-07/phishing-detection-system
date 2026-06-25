import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/custom/ReportModal";
import { analyzeMessage, type AnalysisResult } from "@/lib/analysis";
import { ScanSearch, FlaskConical, CheckCircle2 } from "lucide-react";

const EXAMPLE_SAFE_MESSAGE = `Dear Customer,

Please be informed that your monthly bank statement for the account ending in 4321 is now available for download in your secure online banking portal.

Remember, our bank will never ask you to reply with your OTP, PIN, or password via SMS or email.

Thank you,
Customer Support Team`;

const EXAMPLE_CRITICAL_MESSAGE = `URGENT: Your account has been suspended due to unauthorized access attempts!

To secure your account and avoid permanent deletion, you must act within 24 hours.

Please click the link below to verify your login credentials immediately:
http://secure-banking-update.tk/verify-login

Kindly enter your password and reply with your OTP right away to restore access.`;

export function MessageScanner() {
    const [message, setMessage] = useState("");
    const [analyzedMessage, setAnalyzedMessage] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    function handleScan(value?: string) {
        const target = (value ?? message).trim();
        if (!target) return;
        setAnalyzedMessage(target);
        setResult(analyzeMessage(target));
        setModalOpen(true);
    }

    function handleTryExample(value: string) {
        setMessage(value);
        handleScan(value);
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-medium text-foreground mb-1">
                    Message Scanner
                </h2>
                <p className="text-sm text-muted-foreground">
                    Paste an email, SMS, or chat message to check for phishing patterns.
                </p>
            </div>

            <Textarea
                id="message-input"
                placeholder={"Dear Customer,\n\nYour account has been suspended. Click here to verify your identity immediately...\n"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px] text-sm resize-y"
            />

            <Button
                id="message-scan-btn"
                onClick={() => handleScan()}
                disabled={!message.trim()}
                size="default"
            >
                <ScanSearch className="h-4 w-4 mr-1.5" />
                Scan Message
            </Button>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
                <button
                    onClick={() => handleTryExample(EXAMPLE_SAFE_MESSAGE)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Try a safe message
                </button>
                <button
                    onClick={() => handleTryExample(EXAMPLE_CRITICAL_MESSAGE)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <FlaskConical className="h-3.5 w-3.5 text-red-500" />
                    Try a critical message
                </button>
            </div>

            <ReportModal
                result={result}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                inputLabel="Message"
                inputValue={analyzedMessage}
            />
        </div>
    );
}
