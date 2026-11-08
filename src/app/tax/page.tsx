import { BrowserTaxCalculator } from "@/components/BrowserCalculators";
import ToolShell from "@/components/ToolShell";
import { getToolMetadata } from "@/config/site.config";

export const metadata = getToolMetadata("tax");

export default function Page() {
    return (
        <ToolShell tool="tax">
            <BrowserTaxCalculator />
        </ToolShell>
    );
}
