import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlChecker } from "@/features/UrlChecker/UrlChecker";
import { MessageScanner } from "@/features/MessageScanner/MessageScanner";
import { CallVerifier } from "@/features/CallVerifier/CallVerifier";
import { ReportModal } from "@/components/custom/ReportModal";
import { type AnalysisResult } from "@/lib/analysis";
import { Button } from "@/components/ui/button";
import { Shield, History, Trash2, Eye, Link, MessageSquare, Phone } from "lucide-react";

interface HistoryItem {
  id: string;
  type: "url" | "message" | "call";
  inputValue: string;
  result: AnalysisResult;
  timestamp: string;
}

function riskBadgeColors(score: number) {
  if (score <= 25) return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50";
  if (score <= 50) return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50";
  if (score <= 75) return "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200/50";
  return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200/50";
}

function App() {
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("phishing_detector_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal state for viewing report from history list
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalResult, setHistoryModalResult] = useState<AnalysisResult | null>(null);
  const [historyModalLabel, setHistoryModalLabel] = useState("");
  const [historyModalValue, setHistoryModalValue] = useState("");

  const saveScan = (type: "url" | "message" | "call", inputValue: string, result: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      inputValue,
      result,
      timestamp: new Date().toLocaleString(),
    };
    setHistory((prev) => {
      const updated = [newItem, ...prev].slice(0, 50); // limit to 50 items
      localStorage.setItem("phishing_detector_history", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("phishing_detector_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all scan history?")) {
      setHistory([]);
      localStorage.removeItem("phishing_detector_history");
    }
  };

  const openHistoryReport = (item: HistoryItem) => {
    const labels: Record<string, string> = { url: "URL", message: "Message", call: "Phone Number" };
    setHistoryModalLabel(labels[item.type] || "Scan");
    setHistoryModalValue(item.inputValue);
    setHistoryModalResult(item.result);
    setHistoryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-6 py-5">
          <Shield className="h-5 w-5 text-foreground" strokeWidth={2} />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Phishing Detection System
          </h1>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="mx-auto max-w-2xl w-full px-6 py-8 flex-1">
        <Tabs defaultValue="url" className="w-full">
          <TabsList variant="line" className="mb-8 w-full justify-start border-b border-border/60">
            <TabsTrigger value="url" id="tab-url">
              URL
            </TabsTrigger>
            <TabsTrigger value="message" id="tab-message">
              Message
            </TabsTrigger>
            <TabsTrigger value="call" id="tab-call">
              Call
            </TabsTrigger>
            <TabsTrigger value="history" id="tab-history" className="ml-auto flex items-center gap-1 text-xs">
              <History className="h-3.5 w-3.5" />
              History ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url">
            <UrlChecker onScanComplete={(val, res) => saveScan("url", val, res)} />
          </TabsContent>
          <TabsContent value="message">
            <MessageScanner onScanComplete={(val, res) => saveScan("message", val, res)} />
          </TabsContent>
          <TabsContent value="call">
            <CallVerifier onScanComplete={(val, res) => saveScan("call", val, res)} />
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4 animate-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-medium text-foreground mb-1 flex items-center gap-1.5">
                    <History className="h-4.5 w-4.5 text-muted-foreground" />
                    Scan History
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    View and reopen reports for your past 50 scans.
                  </p>
                </div>
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-lg p-10 text-center text-muted-foreground/80 bg-muted/10">
                  <History className="h-8 w-8 mb-3 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground/80 mb-1">No scan history yet</p>
                  <p className="text-xs text-muted-foreground/60 max-w-[280px]">
                    Analyze some URLs, scan messages, or verify phone calls to build your list.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-border/60 rounded-lg bg-card hover:bg-muted/10 transition-colors gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="mt-0.5 p-2 rounded-md bg-muted/60 text-muted-foreground shrink-0">
                          {item.type === "url" && <Link className="h-3.5 w-3.5" />}
                          {item.type === "message" && <MessageSquare className="h-3.5 w-3.5" />}
                          {item.type === "call" && <Phone className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-sm font-medium text-foreground truncate select-all">
                            {item.type === "message" && item.inputValue.length > 60
                              ? `${item.inputValue.slice(0, 60)}...`
                              : item.inputValue}
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-1">
                            {item.timestamp} • <span className="capitalize">{item.type} Check</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskBadgeColors(item.result.score)}`}>
                          {item.result.score}/100
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openHistoryReport(item)}
                            title="View Report"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteHistoryItem(item.id)}
                            title="Delete Item"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/40 py-4 text-center text-xs text-muted-foreground/60">
        Client-side analysis only — no data leaves your browser.
      </footer>

      {/* ── Report Modal for History ── */}
      <ReportModal
        result={historyModalResult}
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        inputLabel={historyModalLabel}
        inputValue={historyModalValue}
      />
    </div>
  );
}

export default App;
