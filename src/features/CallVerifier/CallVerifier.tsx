import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MinimalResultsDisplay } from "@/components/custom/MinimalResultsDisplay";
import { analyzeCall, type AnalysisResult, type CallDetails } from "@/lib/analysis";
import { PhoneCall, FlaskConical } from "lucide-react";

const EXAMPLE_PHISHING_CALL: CallDetails = {
    callerNumber: "+1 (202) 555-0147",
    claimedOrganization: "IRS - Internal Revenue Service",
    callbackNumber: "+1 (800) 555-9832",
    callDescription:
        "They said I owe $4,500 in back taxes and there is an arrest warrant issued in my name. They told me do not hang up or I would face legal action and immediate arrest. They demanded I pay immediately using gift cards or bitcoin and asked for my social security number, date of birth, and bank account details to \"verify my identity.\" They said this is my last chance and to stay on the line while I go buy the gift cards.",
};

export function CallVerifier() {
    const [callerNumber, setCallerNumber] = useState("");
    const [claimedOrganization, setClaimedOrganization] = useState("");
    const [callbackNumber, setCallbackNumber] = useState("");
    const [callDescription, setCallDescription] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    function handleVerify(details?: CallDetails) {
        const d: CallDetails = details ?? {
            callerNumber,
            claimedOrganization,
            callbackNumber,
            callDescription,
        };
        if (!d.callerNumber.trim() && !d.callDescription.trim()) return;
        setResult(analyzeCall(d));
        setHasAnalyzed(true);
    }

    function handleClear() {
        setCallerNumber("");
        setClaimedOrganization("");
        setCallbackNumber("");
        setCallDescription("");
        setResult(null);
        setHasAnalyzed(false);
    }

    function handleTryExample() {
        setCallerNumber(EXAMPLE_PHISHING_CALL.callerNumber);
        setClaimedOrganization(EXAMPLE_PHISHING_CALL.claimedOrganization);
        setCallbackNumber(EXAMPLE_PHISHING_CALL.callbackNumber);
        setCallDescription(EXAMPLE_PHISHING_CALL.callDescription);
        handleVerify(EXAMPLE_PHISHING_CALL);
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-medium text-foreground mb-1">
                    Call Verifier
                </h2>
                <p className="text-sm text-muted-foreground">
                    Enter details about a suspicious call to assess its legitimacy.
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <label htmlFor="caller-number" className="text-sm font-medium text-foreground">
                        Caller Number
                    </label>
                    <Input
                        id="caller-number"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={callerNumber}
                        onChange={(e) => setCallerNumber(e.target.value)}
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="claimed-org" className="text-sm font-medium text-foreground">
                        Claimed Organisation
                    </label>
                    <Input
                        id="claimed-org"
                        placeholder="e.g. IRS, Microsoft, Amazon"
                        value={claimedOrganization}
                        onChange={(e) => setClaimedOrganization(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="callback-number" className="text-sm font-medium text-foreground">
                    Callback Number <span className="text-muted-foreground font-normal">(if given)</span>
                </label>
                <Input
                    id="callback-number"
                    type="tel"
                    placeholder="+1 (555) 987-6543"
                    value={callbackNumber}
                    onChange={(e) => setCallbackNumber(e.target.value)}
                />
            </div>

            <div className="space-y-1.5">
                <label htmlFor="call-description" className="text-sm font-medium text-foreground">
                    What did the caller say?
                </label>
                <Textarea
                    id="call-description"
                    placeholder="e.g. They said I owe back taxes and must pay immediately with gift cards or face arrest..."
                    value={callDescription}
                    onChange={(e) => setCallDescription(e.target.value)}
                    className="min-h-[100px] text-sm resize-y"
                />
            </div>

            <Button
                id="call-verify-btn"
                onClick={() => handleVerify()}
                disabled={!callerNumber.trim() && !callDescription.trim()}
                size="default"
            >
                <PhoneCall className="h-4 w-4 mr-1.5" />
                Verify Call
            </Button>

            {!hasAnalyzed && (
                <button
                    onClick={handleTryExample}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Try an example phishing call
                </button>
            )}

            {hasAnalyzed && result && (
                <>
                    <MinimalResultsDisplay result={result} />
                    <button
                        onClick={handleClear}
                        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                    >
                        Clear &amp; start over
                    </button>
                </>
            )}
        </div>
    );
}
