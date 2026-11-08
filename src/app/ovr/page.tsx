import Calculator from "@/components/Calculator";
import ToolShell from "@/components/ToolShell";
import { getToolMetadata } from "@/config/site.config";

export const metadata = getToolMetadata("ovr");

export default function Page() {
    return (
        <ToolShell tool="ovr">
            <Calculator />
        </ToolShell>
    );
}
