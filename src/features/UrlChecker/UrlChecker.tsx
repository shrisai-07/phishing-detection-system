import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MinimalResultsDisplay } from "@/components/custom/MinimalResultsDisplay";
import { analyzeUrl, type AnalysisResult } from "@/lib/analysis";
import { Search, FlaskConical } from "lucide-react";

const EXAMPLE_PHISHING_URL =
    "http://192.168.1.100/secure-login@update-verify.account.pw/%70assword-confirm";

export function UrlChecker() {
    const [url, setUrl] = useState("");
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [hasAnalyzed, setHasAnalyzed] = useState(false);

    function handleAnalyze(value?: string) {
        const target = (value ?? url).trim();
        if (!target) return;
        setResult(analyzeUrl(target));
        setHasAnalyzed(true);
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") handleAnalyze();
    }

    function handleClear() {
        setUrl("");
        setResult(null);
        setHasAnalyzed(false);
    }

    function handleTryExample() {
        setUrl(EXAMPLE_PHISHING_URL);
        handleAnalyze(EXAMPLE_PHISHING_URL);
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

            {!hasAnalyzed && (
                <button
                    onClick={handleTryExample}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <FlaskConical className="h-3.5 w-3.5" />
                    Try an example phishing URL
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
