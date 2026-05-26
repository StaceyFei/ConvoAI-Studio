import { Code2 } from "lucide-react";
import { useMemo } from "react";
import { useWorkspaceStore } from "../store/workspace";
import JsonCodeBlock from "./JsonCodeBlock";
import { ModeSwitcher } from "./CenterHeaderControls";

export default function CodeExamplePanel() {
  const { currentJson, currentCallInfo, appKeyList, updateJson, isValid, theme, agentList, currentAgentId } = useWorkspaceStore();
  const isDark = theme === 'dark';
  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(currentJson);
    } catch {
      return null;
    }
  }, [currentJson]);
  const runtimeInfo = {
    appId: currentCallInfo?.appId || (typeof parsedJson?.AppId === "string" ? parsedJson.AppId : ""),
  };
  const currentAgent = useMemo(
    () => agentList.find((agent) => agent.id === currentAgentId) ?? agentList[0] ?? null,
    [agentList, currentAgentId]
  );
  const displayJson = useMemo(() => {
    if (!parsedJson) return currentJson;

    const draft = JSON.parse(JSON.stringify(parsedJson));
    draft.RoomId = "自定义您的房间 ID，需与生成 RTC 鉴权 Token 时使用的 RoomId 一致";
    draft.TaskId = "自定义您的任务 ID，用于唯一标识该对话任务";
    draft.AgentConfig = draft.AgentConfig && typeof draft.AgentConfig === "object" ? draft.AgentConfig : {};
    draft.AgentConfig.TargetUserId = ["需使用客户端 SDK 进房的真人用户的 UserId"];
    draft.AgentConfig.UserId = currentAgent?.botId || "";

    return JSON.stringify(draft, null, 2);
  }, [currentAgent?.botId, currentJson, parsedJson]);
  const highlightedValues = useMemo(
    () => [
      "自定义您的房间 ID，需与生成 RTC 鉴权 Token 时使用的 RoomId 一致",
      "自定义您的任务 ID，用于唯一标识该对话任务",
      "需使用客户端 SDK 进房的真人用户的 UserId",
    ],
    []
  );

  const handleAppIdChange = (nextAppId: string) => {
    if (!parsedJson || !nextAppId) return;
    const nextJson = {
      ...parsedJson,
      AppId: nextAppId,
    };
    updateJson(JSON.stringify(nextJson, null, 2));
  };

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

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <div className={`shrink-0 text-[11px] font-medium ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                选择运行的 AppId
              </div>
              <select
                value={runtimeInfo.appId}
                onChange={(event) => handleAppIdChange(event.target.value)}
                className={`h-8 min-w-0 flex-1 rounded-lg border px-3 text-[12px] focus:outline-none ${
                  isDark
                    ? "border-zinc-800 bg-zinc-950 text-zinc-100 focus:border-blue-400/35"
                    : "border-zinc-200 bg-white text-zinc-900 focus:border-blue-300"
                }`}
              >
                {appKeyList.map((appKey) => (
                  <option key={appKey.id} value={appKey.appId}>
                    {appKey.name} / {appKey.appId}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-5 min-h-0 flex-1">
          <JsonCodeBlock
            code={displayJson}
            fileName="StartVoiceChat"
            fillHeight
            highlightStringValues={highlightedValues}
          />
        </div>
      </div>
    </div>
  );
}
