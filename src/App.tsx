import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlChecker } from "@/features/UrlChecker/UrlChecker";
import { MessageScanner } from "@/features/MessageScanner/MessageScanner";
import { CallVerifier } from "@/features/CallVerifier/CallVerifier";
import { Shield } from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
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
      <main className="mx-auto max-w-2xl px-6 py-8">
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
          </TabsList>

          <TabsContent value="url">
            <UrlChecker />
          </TabsContent>
          <TabsContent value="message">
            <MessageScanner />
          </TabsContent>
          <TabsContent value="call">
            <CallVerifier />
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/40 py-4 text-center text-xs text-muted-foreground/60">
        Client-side analysis only — no data leaves your browser.
      </footer>
    </div>
  );
}

export default App;
