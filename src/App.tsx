import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlChecker } from "@/features/UrlChecker/UrlChecker";
import { MessageScanner } from "@/features/MessageScanner/MessageScanner";
import { CallVerifier } from "@/features/CallVerifier/CallVerifier";
import { ReportModal } from "@/components/custom/ReportModal";
import { type AnalysisResult } from "@/lib/analysis";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  History, 
  Trash2, 
  Eye, 
  Link, 
  MessageSquare, 
  Phone, 
  Sun, 
  Moon,
  AlertTriangle,
  Globe,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
  ShieldAlert
} from "lucide-react";

interface HistoryItem {
  id: string;
  type: "url" | "message" | "call";
  inputValue: string;
  result: AnalysisResult;
  timestamp: string;
}

const SECURITY_TIPS = [
  {
    title: "Look Out for Urgency Cues",
    description: "Phishing messages often demand immediate action (e.g., 'Act within 24 hours!') to induce panic and prevent you from thinking critically.",
    category: "Psychological Triggers",
    icon: AlertTriangle,
    color: "text-amber-500 bg-amber-500/10"
  },
  {
    title: "Inspect Domain Letters",
    description: "Attackers use lookalike letters (homographs) like 'аmazon.com' (using a Cyrillic 'а') or subtle typos like 'paypa1.com' to deceive you.",
    category: "Technical Red Flags",
    icon: Globe,
    color: "text-blue-500 bg-blue-500/10"
  },
  {
    title: "Independent Verification",
    description: "Never use phone numbers or links provided in suspicious alerts. Check the official company website or your bank card for the real contact info.",
    category: "Safety Habits",
    icon: ShieldCheck,
    color: "text-emerald-500 bg-emerald-500/10"
  },
  {
    title: "Beware Caller ID Spoofing",
    description: "Fraudulent calls can mimic local numbers. Treat high-pressure callers demanding bank info, gift cards, or OTPs as suspicious.",
    category: "Vocal Phishing (Vishing)",
    icon: ShieldAlert,
    color: "text-red-500 bg-red-500/10"
  }
];

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

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("phishing_detector_theme");
    if (saved === "dark") { document.documentElement.classList.add("dark"); return true; }
    if (saved === "light") return false;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) document.documentElement.classList.add("dark");
    return prefersDark;
  });

  const [currentTip, setCurrentTip] = useState(0);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("phishing_detector_theme", next ? "dark" : "light");
      return next;
    });
  };

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

  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % SECURITY_TIPS.length);
  };

  const prevTip = () => {
    setCurrentTip((prev) => (prev - 1 + SECURITY_TIPS.length) % SECURITY_TIPS.length);
  };

  // Statistics Calculations
  const totalScans = history.length;
  const threatsDetected = history.filter((item) => item.result.score > 50).length;
  const averageRisk = totalScans > 0 
    ? Math.round(history.reduce((acc, item) => acc + item.result.score, 0) / totalScans) 
    : 0;

  const safeCount = history.filter((item) => item.result.score <= 25).length;
  const warningCount = history.filter((item) => item.result.score > 25 && item.result.score <= 50).length;
  const criticalCount = history.filter((item) => item.result.score > 50).length;

  const safePercent = totalScans > 0 ? (safeCount / totalScans) * 100 : 0;
  const warningPercent = totalScans > 0 ? (warningCount / totalScans) * 100 : 0;
  const criticalPercent = totalScans > 0 ? (criticalCount / totalScans) * 100 : 0;

  const ActiveTipIcon = SECURITY_TIPS[currentTip].icon;

  return (
    <div className="min-h-screen bg-background font-sans antialiased flex flex-col relative overflow-hidden transition-colors duration-300">
      
      {/* ── Background Patterns (Mesh Gradients & Tech Grid) ── */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px] pointer-events-none -z-10 animate-pulse-subtle" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[130px] pointer-events-none -z-10" />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-border/60 backdrop-blur-xs bg-background/50 sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-6 py-5">
          <Shield className="h-5 w-5 text-foreground animate-pulse-subtle" strokeWidth={2.2} />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Phishing Detection System
            </h1>
            <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-semibold">
              Client-Side Threat Shield
            </span>
          </div>
          <button
            onClick={toggleDark}
            className="ml-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border/40 bg-background/40"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl w-full px-6 py-10 flex-1 flex flex-col justify-center">
        
        {/* Dual-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Main Checker Interface (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Frosted Glass Console Panel */}
            <div className="glass-card rounded-2xl p-6 md:p-8 animate-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
              
              <Tabs defaultValue="url" className="w-full">
                <TabsList variant="line" className="mb-8 w-full justify-start border-b border-border/60">
                  <TabsTrigger value="url" id="tab-url" className="text-sm font-semibold tracking-wide">
                    URL Checker
                  </TabsTrigger>
                  <TabsTrigger value="message" id="tab-message" className="text-sm font-semibold tracking-wide">
                    Message Scanner
                  </TabsTrigger>
                  <TabsTrigger value="call" id="tab-call" className="text-sm font-semibold tracking-wide">
                    Call Verifier
                  </TabsTrigger>
                  <TabsTrigger value="history" id="tab-history" className="ml-auto flex items-center gap-1.5 text-xs">
                    <History className="h-3.5 w-3.5" />
                    History ({history.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="outline-none mt-0">
                  <UrlChecker onScanComplete={(val, res) => saveScan("url", val, res)} />
                </TabsContent>
                <TabsContent value="message" className="outline-none mt-0">
                  <MessageScanner onScanComplete={(val, res) => saveScan("message", val, res)} />
                </TabsContent>
                <TabsContent value="call" className="outline-none mt-0">
                  <CallVerifier onScanComplete={(val, res) => saveScan("call", val, res)} />
                </TabsContent>
                
                <TabsContent value="history" className="outline-none mt-0">
                  <div className="space-y-4 animate-in">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-medium text-foreground mb-1 flex items-center gap-1.5">
                          <History className="h-4.5 w-4.5 text-muted-foreground" />
                          Scan History
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          View and reopen reports for your past 50 scans.
                        </p>
                      </div>
                      {history.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearHistory}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-8 px-2.5"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div className="flex flex-col items-center justify-center border border-dashed border-border/80 rounded-xl p-10 text-center text-muted-foreground/80 bg-muted/5">
                        <History className="h-8 w-8 mb-3 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-foreground/80 mb-1">No scan history yet</p>
                        <p className="text-xs text-muted-foreground/50 max-w-[280px]">
                          Analyze some URLs, scan messages, or verify phone calls to build your list.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border border-border/60 rounded-xl bg-background/50 hover:bg-muted/10 transition-all duration-200 gap-3"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="mt-0.5 p-2 rounded-lg bg-muted/80 text-muted-foreground shrink-0 border border-border/20">
                                {item.type === "url" && <Link className="h-3.5 w-3.5" />}
                                {item.type === "message" && <MessageSquare className="h-3.5 w-3.5" />}
                                {item.type === "call" && <Phone className="h-3.5 w-3.5" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-mono text-xs font-medium text-foreground truncate select-all">
                                  {item.type === "message" && item.inputValue.length > 60
                                    ? `${item.inputValue.slice(0, 60)}...`
                                    : item.inputValue}
                                </div>
                                <span className="text-[9px] text-muted-foreground block mt-1">
                                  {item.timestamp} • <span className="capitalize">{item.type} Check</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${riskBadgeColors(item.result.score)}`}>
                                {item.result.score}/100
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => openHistoryReport(item)}
                                  title="View Report"
                                  className="text-muted-foreground hover:text-foreground h-7 w-7"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => deleteHistoryItem(item.id)}
                                  title="Delete Item"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7"
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
            </div>
          </div>

          {/* RIGHT COLUMN: Telemetry Stats & Phishing Tips Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Widget 1: Live Security Telemetry */}
            <div className="glass-card rounded-2xl p-6 md:p-7 relative overflow-hidden animate-in">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-muted-foreground animate-pulse-subtle" />
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Security Telemetry
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-500 tracking-wide uppercase">
                    Active
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide block mb-1">
                    Scans Run
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {totalScans}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide block mb-1">
                    Threats
                  </span>
                  <span className={`text-xl font-bold ${threatsDetected > 0 ? "text-red-500" : "text-foreground"}`}>
                    {threatsDetected}
                  </span>
                </div>
                <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide block mb-1">
                    Avg Risk
                  </span>
                  <span className={`text-xl font-bold ${
                    averageRisk <= 25 ? "text-emerald-500" : 
                    averageRisk <= 50 ? "text-amber-500" : "text-red-500"
                  }`}>
                    {averageRisk}%
                  </span>
                </div>
              </div>

              {/* Threat Distribution Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Risk Exposure Mix</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {safeCount}S • {warningCount}W • {criticalCount}C
                  </span>
                </div>
                
                {totalScans === 0 ? (
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden" />
                ) : (
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${safePercent}%` }} 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      title={`Safe: ${safeCount}`}
                    />
                    <div 
                      style={{ width: `${warningPercent}%` }} 
                      className="bg-amber-500 h-full transition-all duration-500" 
                      title={`Caution: ${warningCount}`}
                    />
                    <div 
                      style={{ width: `${criticalPercent}%` }} 
                      className="bg-red-500 h-full transition-all duration-500" 
                      title={`Critical: ${criticalCount}`}
                    />
                  </div>
                )}
                
                <div className="flex justify-between text-[10px] text-muted-foreground/80 mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Safe (&le;25)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Caution (&le;50)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Critical (&gt;50)
                  </span>
                </div>
              </div>
            </div>

            {/* Widget 2: Educational Phishing Tips */}
            <div className="glass-card rounded-2xl p-6 md:p-7 relative overflow-hidden animate-in">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Defense Intelligence
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevTip}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Previous Tip"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextTip}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Next Tip"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tip Content */}
              <div className="space-y-3 min-h-[140px] flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border border-border/20 ${SECURITY_TIPS[currentTip].color}`}>
                      <ActiveTipIcon className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground tracking-wide uppercase">
                      {SECURITY_TIPS[currentTip].category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">
                    {SECURITY_TIPS[currentTip].title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {SECURITY_TIPS[currentTip].description}
                  </p>
                </div>

                <div className="flex justify-center gap-1 pt-2">
                  {SECURITY_TIPS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentTip(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentTip ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/35"
                      }`}
                      aria-label={`Go to tip ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Widget 3: Activity Radar (Mini Feed) */}
            <div className="glass-card rounded-2xl p-6 md:p-7 animate-in">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Activity Radar
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Last 3 Checks
                </span>
              </div>

              {history.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground/50 border border-dashed border-border/60 rounded-xl bg-muted/5">
                  Radar idle. No scans logged.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.slice(0, 3).map((item) => (
                    <div 
                      key={`radar-${item.id}`} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/15 border border-border/40 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-background text-muted-foreground shrink-0 border border-border/40 shadow-2xs">
                          {item.type === "url" && <Link className="h-3 w-3" />}
                          {item.type === "message" && <MessageSquare className="h-3 w-3" />}
                          {item.type === "call" && <Phone className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-mono font-medium text-foreground truncate block select-all">
                            {item.type === "message" && item.inputValue.length > 30
                              ? `${item.inputValue.slice(0, 30)}...`
                              : item.inputValue}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          item.result.score <= 25 ? "bg-emerald-500/10 text-emerald-500" :
                          item.result.score <= 50 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {item.result.score}/100
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openHistoryReport(item)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/40 py-5 text-center text-xs text-muted-foreground/60 bg-background/30 backdrop-blur-xs">
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
