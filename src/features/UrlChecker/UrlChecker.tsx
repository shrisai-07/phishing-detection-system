import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ReportModal } from "@/components/custom/ReportModal";
import { analyzeUrl, type AnalysisResult } from "@/lib/analysis";
import { Search, FlaskConical, CheckCircle2 } from "lucide-react";

const EXAMPLE_SAFE_URL = "https://www.amazon.com/gp/css/homepage.html";
const EXAMPLE_CRITICAL_URL =
    "http://аmazon.com.account-verify.xyz/secure-login@update-verify";

export function UrlChecker({ onScanComplete }: { onScanComplete?: (value: string, result: AnalysisResult) => void }) {
    const [url, setUrl] = useState("");
    const [analyzedUrl, setAnalyzedUrl] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    function handleAnalyze(value?: string) {
        const target = (value ?? url).trim();
        if (!target) return;
        setAnalyzedUrl(target);
        const res = analyzeUrl(target);
        setResult(res);
        setModalOpen(true);
        if (onScanComplete) {
            onScanComplete(target, res);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") handleAnalyze();
    }

    function handleTryExample(value: string) {
        setUrl(value);
        handleAnalyze(value);
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-base font-medium text-foreground mb-1">
                    URL Checker
                </h2>
                <p className="text-sm text-muted-foreground">
                    Paste a URL to analyse it for phishing indicators.
                </p>
            </div>

            <div className="flex gap-2">
                <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/login"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 font-mono text-sm"
                />
                <Button
                    id="url-analyze-btn"
                    onClick={() => handleAnalyze()}
                    disabled={!url.trim()}
                    size="default"
                >
                    <Search className="h-4 w-4 mr-1.5" />
                    Analyse
                </Button>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
                <button
                    onClick={() => handleTryExample(EXAMPLE_SAFE_URL)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Try a safe URL
                </button>
                <button
                    onClick={() => handleTryExample(EXAMPLE_CRITICAL_URL)}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <FlaskConical className="h-3.5 w-3.5 text-red-500" />
                    Try a critical phishing URL
                </button>
            </div>

            <ReportModal
                result={result}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                inputLabel="URL"
                inputValue={analyzedUrl}
            />
        </div>
    );
}
