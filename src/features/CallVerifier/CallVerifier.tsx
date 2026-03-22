import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/custom/ReportModal";
import { analyzePhone, type AnalysisResult } from "@/lib/analysis";
import { PhoneCall, FlaskConical } from "lucide-react";

const EXAMPLE_SCAM_NUMBER = "+2221234567890";

export function CallVerifier() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    function handleVerify(value?: string) {
        const target = (value ?? phoneNumber).trim();
        if (!target) return;
        setResult(analyzePhone(target));
        setModalOpen(true);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") handleVerify();
    }

    function handleTryExample() {
        setPhoneNumber(EXAMPLE_SCAM_NUMBER);
        handleVerify(EXAMPLE_SCAM_NUMBER);
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-medium text-foreground mb-1">
                    Phone Verifier
                </h2>
                <p className="text-sm text-muted-foreground">
                    Enter a phone number (with country code) to check for fraud patterns.
                </p>
            </div>

            <div className="flex gap-2">
                <Input
                    id="phone-input"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 font-mono text-sm"
                />
                <Button
                    id="phone-verify-btn"
                    onClick={() => handleVerify()}
                    disabled={!phoneNumber.trim()}
                    size="default"
                >
                    <PhoneCall className="h-4 w-4 mr-1.5" />
                    Verify
                </Button>
            </div>

            <button
                onClick={handleTryExample}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                <FlaskConical className="h-3.5 w-3.5" />
                Try an example scam number
            </button>

            <ReportModal
                result={result}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                inputLabel="Phone Number"
            />
        </div>
    );
}
