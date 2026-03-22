import type { AnalysisResult } from "@/lib/analysis";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

interface MinimalResultsDisplayProps {
    result: AnalysisResult;
}

const statusConfig = {
    Safe: {
        icon: ShieldCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100",
        label: "Safe",
    },
    Suspicious: {
        icon: ShieldAlert,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100",
        label: "Suspicious",
    },
    Malicious: {
        icon: ShieldX,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        badgeClass: "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
        label: "Malicious",
    },
};

export function MinimalResultsDisplay({ result }: MinimalResultsDisplayProps) {
    const config = statusConfig[result.status];
    const Icon = config.icon;

    return (
        <div
            className={`mt-6 rounded-lg border ${config.border} ${config.bg} p-5 transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-2`}
        >
            <div className="flex items-center gap-3 mb-3">
                <Icon className={`h-5 w-5 ${config.color}`} strokeWidth={2} />
                <span className={`text-sm font-semibold ${config.color}`}>
                    {config.label}
                </span>
                <Badge variant="outline" className={`ml-auto text-xs ${config.badgeClass}`}>
                    Risk Score: {result.score}/100
                </Badge>
            </div>

            <ul className="space-y-1.5 pl-1">
                {result.reasons.map((reason, i) => (
                    <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-foreground/80"
                    >
                        <span className={`mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full ${config.color} opacity-60`} />
                        {reason}
                    </li>
                ))}
            </ul>
        </div>
    );
}
