import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/custom/ReportModal";
import { analyzeMessage, type AnalysisResult } from "@/lib/analysis";
import { ScanSearch, FlaskConical } from "lucide-react";

const EXAMPLE_PHISHING_MESSAGE = `Dear Customer,

URGENT: Your acc0unt has been suspended due to unusual activity. We have detected unauthorized access and your account will be permanently deleted within 24 hours unless you act now.

Click here to v3rify your account immediately: http://secure-banking-update.tk/verify-login

You must confirm your identity and enter your password to restore access. Please send us your OTP and credit card number for verification.

Kindly do the needful and revert back to us ASAP. This is your FINAL WARNING — do not delay!

Regards,
Amazon Security Team
Official Notice - Action Required`;

export function MessageScanner() {
    const [message, setMessage] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    function handleScan(value?: string) {
        const target = (value ?? message).trim();
        if (!target) return;
        setResult(analyzeMessage(target));
        setModalOpen(true);
    }

    function handleTryExample() {
        setMessage(EXAMPLE_PHISHING_MESSAGE);
        handleScan(EXAMPLE_PHISHING_MESSAGE);
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

            <button
                onClick={handleTryExample}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                <FlaskConical className="h-3.5 w-3.5" />
                Try an example phishing message
            </button>

            <ReportModal
                result={result}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                inputLabel="Message"
            />
        </div>
    );
}
