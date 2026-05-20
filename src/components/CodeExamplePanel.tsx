import { Code2 } from "lucide-react";
import { useWorkspaceStore } from "../store/workspace";
import JsonCodeBlock from "./JsonCodeBlock";
import { ModeSwitcher } from "./CenterHeaderControls";

export default function CodeExamplePanel() {
  const { currentJson, isValid, theme } = useWorkspaceStore();
  const isDark = theme === 'dark';

  return (
    <div className={`flex h-full flex-col transition-colors ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
      <div className="flex h-12 shrink-0 items-center bg-transparent px-5">
        <ModeSwitcher />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-4">
        <div className={`rounded-2xl border p-5 ${
          isDark
            ? "border-zinc-800 bg-zinc-900/60"
            : "border-zinc-200 bg-zinc-50/80"
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white">代码示例</span>
                <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                  智能体详情对应的 StartVoiceChat JSON
                </span>
              </div>
              <h3 className={`mt-4 text-lg font-semibold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>请求参数示例</h3>
              <p className={`mt-2 text-xs leading-6 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                这里仅展示当前智能体对应的 JSON 示例；如需生成或分析 JSON，可以呼叫小助手。
              </p>
            </div>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-600"
            }`}>
              <Code2 className="h-5 w-5" />
            </div>
          </div>

          <div className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
            isValid
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isValid ? "bg-emerald-500" : "bg-amber-500"}`} />
            {isValid ? "当前示例可用于预览调试" : "当前示例仍需补全必填配置"}
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1">
          <JsonCodeBlock
            code={currentJson}
            fileName="StartVoiceChat"
            fillHeight
          />
        </div>
      </div>
    </div>
  );
}
