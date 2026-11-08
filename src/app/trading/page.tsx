import { BrowserTradingCalculator } from "@/components/BrowserCalculators";
import ToolShell from "@/components/ToolShell";
import { getToolMetadata } from "@/config/site.config";

export const metadata = getToolMetadata("trading");

export default function Page() {
    return (
        <ToolShell tool="trading">
            <BrowserTradingCalculator />
        </ToolShell>
    );
}
