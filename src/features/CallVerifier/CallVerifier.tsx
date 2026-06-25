import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/custom/ReportModal";
import { analyzePhone, type AnalysisResult } from "@/lib/analysis";
import { PhoneCall, FlaskConical } from "lucide-react";

const EXAMPLE_SCAM_NUMBER = "+2221234567890";

export function CallVerifier() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const hasPlus = phoneNumber.trim().startsWith("+");
    const showRegionWarning = phoneNumber.trim() !== "" && !hasPlus && !selectedRegion;

    function handleVerify(value?: string) {
        const target = (value ?? phoneNumber).trim();
        if (!target) return;
        
        const isTargetPlus = target.startsWith("+");
        const defaultRegion = isTargetPlus ? undefined : selectedRegion;

        setResult(analyzePhone(target, defaultRegion));
        setModalOpen(true);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter" && (hasPlus || selectedRegion)) {
            handleVerify();
        }
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
                    Enter a phone number to check for fraud patterns. Local numbers require a region selection.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    {!hasPlus && (
                        <select
                            id="region-select"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 w-[120px] dark:bg-input/30"
                        >
                            <option value="">Region...</option>
                            <option value="91">🇮🇳 IN (+91)</option>
                            <option value="1">🇺🇸 US (+1)</option>
                            <option value="44">🇬🇧 UK (+44)</option>
                            <option value="61">🇦🇺 AU (+61)</option>
                        </select>
                    )}
                    <Input
                        id="phone-input"
                        type="tel"
                        placeholder={hasPlus ? "+91 98765 43210" : "98765 43210"}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 font-mono text-sm"
                    />
                    <Button
                        id="phone-verify-btn"
                        onClick={() => handleVerify()}
                        disabled={!phoneNumber.trim() || (!hasPlus && !selectedRegion)}
                        size="default"
                    >
                        <PhoneCall className="h-4 w-4 mr-1.5" />
                        Verify
                    </Button>
                </div>
                {showRegionWarning && (
                    <p className="text-xs text-destructive animate-in">
                        ⚠️ Please select a region or include a country code (starting with +) to verify this number.
                    </p>
                )}
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
