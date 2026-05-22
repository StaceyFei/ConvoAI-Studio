import { AudioLines, Bot, Boxes, Check, GitBranch, Pencil, ShieldCheck, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useWorkspaceStore } from "../store/workspace";
import { ModeSwitcher } from "./CenterHeaderControls";

export default function EditorPanel() {
  const {
    agentName,
    setAgentName,
    agentDescription,
    setAgentDescription,
    currentJson,
    orchestrationPreset,
    theme,
    updateJson,
    resourceList,
    previewAgent,
    setPreviewAgent,
    setCurrentSection,
  } = useWorkspaceStore();
  const isDark = theme === 'dark';
  const isBlankPreset = orchestrationPreset === 'blank';
  const [isEditing, setIsEditing] = useState(false);
  const [editingSnapshot, setEditingSnapshot] = useState<{ name: string; json: string; description: string } | null>(null);

  const fallbackConfig = useMemo(
    () => ({
      AgentConfig: {
        WelcomeMessage: "",
      },
      Config: {
        ASRConfig: {
          Provider: "",
          ProviderParams: {},
        },
        TTSConfig: {
          Provider: "",
          ProviderParams: {
            audio: {
              voice_type: "",
            },
          },
        },
        LLMConfig: {
          Mode: "",
          Provider: "",
          ModelName: "",
          SystemMessages: [] as string[],
          ProviderParams: {},
        },
      },
    }),
    []
  );

  const parsedConfig = useMemo(() => {
    try {
      return JSON.parse(currentJson);
    } catch {
      return fallbackConfig;
    }
  }, [currentJson, fallbackConfig]);

  const currentMode = parsedConfig?.Config?.LLMConfig?.Mode || "";
  const currentModel = parsedConfig?.Config?.LLMConfig?.ModelName || "";
  const currentAsrModel = parsedConfig?.Config?.ASRConfig?.ProviderParams?.ModelName || "";
  const currentAsrProvider = parsedConfig?.Config?.ASRConfig?.Provider || "";
  const currentTtsProvider = parsedConfig?.Config?.TTSConfig?.Provider || "";
  const currentVoiceValue = parsedConfig?.Config?.TTSConfig?.ProviderParams?.audio?.voice_type || "";
  const currentLlmResourceId = parsedConfig?.Config?.LLMConfig?.ProviderParams?.ManagedResourceId || "";
  const currentAsrResourceId = parsedConfig?.Config?.ASRConfig?.ProviderParams?.ManagedResourceId || "";
  const currentTtsResourceId = parsedConfig?.Config?.TTSConfig?.ProviderParams?.ManagedResourceId || "";
  const llmResources = resourceList.filter((resource) => resource.kind === "LLM" && resource.status !== "停用");
  const asrResources = resourceList.filter((resource) => resource.kind === "ASR" && resource.status !== "停用");
  const ttsResources = resourceList.filter((resource) => resource.kind === "TTS" && resource.status !== "停用");
  const currentLlmResource =
    llmResources.find((resource) => resource.id === currentLlmResourceId) ||
    llmResources.find((resource) => resource.providerCode === parsedConfig?.Config?.LLMConfig?.Provider) ||
    llmResources.find((resource) => resource.mode === currentMode) ||
    llmResources.find((resource) => resource.modelOptions.some((model) => model.value === currentModel)) ||
    llmResources[0];
  const currentAsrResource =
    asrResources.find((resource) => resource.id === currentAsrResourceId) ||
    asrResources.find((resource) => resource.providerCode === currentAsrProvider) ||
    asrResources.find((resource) => resource.modelOptions.some((model) => model.value === currentAsrModel)) ||
    asrResources[0];
  const currentTtsResource =
    ttsResources.find((resource) => resource.id === currentTtsResourceId) ||
    ttsResources.find((resource) => resource.providerCode === currentTtsProvider) ||
    ttsResources.find((resource) => resource.voiceOptions.some((voice) => voice.value === currentVoiceValue)) ||
    ttsResources[0];
  const currentProviderKey = currentLlmResource?.id || "";
  const currentAsrResourceKey = currentAsrResource?.id || "";
  const currentVoiceProviderKey = currentTtsResource?.id || "";
  const currentProviderModels = currentLlmResource?.modelOptions ?? [];
  const currentAsrModels = currentAsrResource?.modelOptions ?? [];
  const currentVoiceOptions = currentTtsResource?.voiceOptions ?? [];
  const currentVoiceLabel =
    currentVoiceOptions.find((item) => item.value === currentVoiceValue)?.label ||
    ttsResources.flatMap((resource) => resource.voiceOptions).find((item) => item.value === currentVoiceValue)?.label ||
    currentVoiceValue ||
    "待选择";
  const systemMessages = parsedConfig?.Config?.LLMConfig?.SystemMessages;
  const promptText = Array.isArray(systemMessages) ? systemMessages.filter(Boolean).join("\n") || "待填写" : "待填写";
  const welcomeMessage = parsedConfig?.AgentConfig?.WelcomeMessage || "待填写";

  const updateConfig = (updater: (draft: any) => void) => {
    let nextConfig: any;

    try {
      nextConfig = JSON.parse(currentJson);
    } catch {
      nextConfig = JSON.parse(JSON.stringify(fallbackConfig));
    }

    nextConfig.AgentConfig = nextConfig.AgentConfig || {};
    nextConfig.Config = nextConfig.Config || {};
    nextConfig.Config.ASRConfig = nextConfig.Config.ASRConfig || {};
    nextConfig.Config.ASRConfig.ProviderParams = nextConfig.Config.ASRConfig.ProviderParams || {};
    nextConfig.Config.LLMConfig = nextConfig.Config.LLMConfig || {};
    nextConfig.Config.LLMConfig.ProviderParams = nextConfig.Config.LLMConfig.ProviderParams || {};
    nextConfig.Config.TTSConfig = nextConfig.Config.TTSConfig || {};
    nextConfig.Config.TTSConfig.ProviderParams = nextConfig.Config.TTSConfig.ProviderParams || {};
    nextConfig.Config.TTSConfig.ProviderParams.audio = nextConfig.Config.TTSConfig.ProviderParams.audio || {};

    updater(nextConfig);
    updateJson(JSON.stringify(nextConfig, null, 2));
  };

  const applyAsrResource = (draft: any, resource: any, modelValue?: string) => {
    if (!resource) return;
    draft.Config.ASRConfig.Provider = resource.providerCode;
    draft.Config.ASRConfig.ProviderParams = {
      ...draft.Config.ASRConfig.ProviderParams,
      ManagedResourceId: resource.id,
      ManagedResourceName: resource.name,
      ProviderLabel: resource.providerLabel,
      Endpoint: resource.endpoint,
      ModelName: modelValue ?? resource.modelOptions?.[0]?.value ?? "",
    };
  };

  const applyLlmResource = (draft: any, resource: any, modelValue?: string) => {
    if (!resource) return;
    draft.Config.LLMConfig.Mode = resource.mode || "";
    draft.Config.LLMConfig.Provider = resource.providerCode;
    draft.Config.LLMConfig.ModelName = modelValue ?? resource.modelOptions?.[0]?.value ?? "";
    draft.Config.LLMConfig.ProviderParams = {
      ...draft.Config.LLMConfig.ProviderParams,
      ManagedResourceId: resource.id,
      ManagedResourceName: resource.name,
      ProviderLabel: resource.providerLabel,
      Endpoint: resource.endpoint,
    };
  };

  const applyTtsResource = (draft: any, resource: any, voiceValue?: string) => {
    if (!resource) return;
    draft.Config.TTSConfig.Provider = resource.providerCode;
    draft.Config.TTSConfig.ProviderParams = {
      ...draft.Config.TTSConfig.ProviderParams,
      ManagedResourceId: resource.id,
      ManagedResourceName: resource.name,
      ProviderLabel: resource.providerLabel,
      Endpoint: resource.endpoint,
      ResourceId: resource.credentialValues?.resourceId ?? draft.Config.TTSConfig.ProviderParams?.ResourceId ?? "",
      audio: {
        ...draft.Config.TTSConfig.ProviderParams.audio,
        voice_type: voiceValue ?? resource.voiceOptions?.[0]?.value ?? "",
        speech_rate: draft.Config.TTSConfig.ProviderParams.audio?.speech_rate ?? 0,
      },
    };
  };

  const capabilityGroups = [
    {
      title: "高级功能",
      description: "默认启用的互动与智能能力",
      icon: ShieldCheck,
      values: isBlankPreset ? ["待配置"] : ["AI VAD", "云端录制", "RTS 实时消息"],
    },
    {
      title: "工具 / MCP",
      description: "可直接调用的外部能力与 MCP 工具",
      icon: Boxes,
      values: isBlankPreset ? ["待添加 MCP"] : ["知识检索 MCP", "工单系统 MCP"],
    },
    {
      title: "Skill",
      description: "模板内置的推理与处理能力",
      icon: GitBranch,
      values: isBlankPreset ? ["待添加 Skill"] : ["意图分类 Skill", "摘要生成 Skill"],
    }
  ];

  const summaryItems = [
    {
      key: "asr",
      icon: AudioLines,
      label: "语音识别",
      value: currentAsrResource ? `${currentAsrResource.providerLabel} / ${currentAsrModel || "待选择模型"}` : "待选择",
    },
    {
      key: "llm",
      icon: Sparkles,
      label: "大模型",
      value: currentLlmResource ? `${currentLlmResource.providerLabel} / ${currentModel || "待选择模型"}` : "待选择",
    },
    {
      key: "tts",
      icon: AudioLines,
      label: "语音合成",
      value: currentTtsResource ? `${currentTtsResource.providerLabel} / ${currentVoiceLabel}` : "待选择",
    },
  ];

  const lineFieldClassName = `w-full border-0 border-b bg-transparent px-0 text-sm transition-colors focus:outline-none ${
    isDark
      ? "border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400/45"
      : "border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-300"
  }`;
  const inputClassName = `${lineFieldClassName} h-10 pb-1 pt-0 text-[18px] font-semibold tracking-[0.01em]`;
  const selectClassName = `${lineFieldClassName} h-9 pb-1 pt-0 pr-6 text-[13px]`;
  const inlineEditorClassName = `border-t pt-3 transition-colors ${
    isDark ? "border-white/8" : "border-zinc-200/80"
  }`;
  const textareaClassName = `w-full border-0 bg-transparent px-0 py-0 text-sm leading-6 focus:outline-none ${
    isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-400"
  }`;

  const startEditing = () => {
    setEditingSnapshot({ name: agentName, json: currentJson, description: agentDescription });
    setIsEditing(true);
  };

  const finishEditing = () => {
    setEditingSnapshot(null);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    if (editingSnapshot !== null) {
      setAgentName(editingSnapshot.name);
      updateJson(editingSnapshot.json);
      setAgentDescription(editingSnapshot.description);
    }
    setEditingSnapshot(null);
    setIsEditing(false);
  };

  return (
    <div className={`flex flex-col h-full transition-colors ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
      {/* Header */}
      <div className="h-12 flex items-center px-5 shrink-0 transition-colors relative justify-between bg-transparent">
        <div className="flex items-center gap-3">
          <ModeSwitcher detailLabel={previewAgent ? "场景模板预览" : (isEditing ? "智能体编辑" : "智能体详情")} />
          {previewAgent && (
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-500 border border-blue-500/20">
              预览模式
            </span>
          )}
        </div>
        {previewAgent && (
          <button
            onClick={() => {
              setPreviewAgent(null);
              setCurrentSection("agents");
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              isDark ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            退出预览
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pb-8 pt-4 [scrollbar-width:thin] ${
        isDark ? "[scrollbar-color:#3f3f46_transparent]" : "[scrollbar-color:#d4d4d8_transparent]"
      }`}>
        <div className={`rounded-2xl border p-5 ${
          isDark
            ? "border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-zinc-950 to-zinc-950"
            : "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50"
        }`}>
          <div className="group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    value={agentName}
                    onChange={(event) => setAgentName(event.target.value)}
                    className={inputClassName}
                    placeholder="输入智能体名称"
                  />
                ) : (
                  <div className={`text-xl font-semibold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{agentName}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                        isDark
                          ? "border-white/10 bg-zinc-950/70 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                          : "border-zinc-200/80 bg-white/88 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                      }`}
                      title="取消编辑"
                      aria-label="取消编辑"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={finishEditing}
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                        isDark
                          ? "border-blue-400/25 bg-blue-500/10 text-blue-300 hover:border-blue-300/35 hover:bg-blue-500/15"
                          : "border-blue-200 bg-blue-50/90 text-blue-600 hover:border-blue-300 hover:bg-blue-100/80"
                      }`}
                      title="完成编辑"
                      aria-label="完成编辑"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isDark
                        ? "border-transparent bg-transparent text-zinc-500 opacity-0 hover:border-zinc-800 hover:bg-zinc-900/80 hover:text-zinc-200 group-hover:opacity-100"
                        : "border-transparent bg-transparent text-zinc-400 opacity-0 hover:border-zinc-200 hover:bg-white/90 hover:text-zinc-700 group-hover:opacity-100"
                    }`}
                    title="编辑详情"
                    aria-label="编辑详情"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-600"
                }`}>
                  <Bot className="h-5 w-5" />
                </div>
              </div>
            </div>
            {isEditing ? (
              <div className={`mt-4 ${inlineEditorClassName}`}>
                <textarea
                  value={agentDescription}
                  onChange={(event) => setAgentDescription(event.target.value)}
                  rows={3}
                  className={`resize-none ${textareaClassName}`}
                  placeholder="输入智能体描述"
                />
              </div>
            ) : (
              <div className={`mt-2 text-[13px] leading-6 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                {agentDescription || (isBlankPreset ? "待补充智能体描述" : "待补充智能体描述")}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {summaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`rounded-xl border px-4 py-3 ${
                    item.label === "模型" || item.label === "音色" ? "sm:col-span-2" : ""
                  } ${
                    isDark ? "border-zinc-800 bg-zinc-950/80" : "border-white/80 bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                    <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{item.label}</span>
                  </div>
                  {isEditing && item.label === "模型" ? (
                    <div className={`mt-2 grid grid-cols-[9rem_minmax(0,1fr)] gap-3 ${inlineEditorClassName}`}>
                      <select
                        value={currentProviderKey}
                        onChange={(event) => {
                          const nextProvider = modelProviders.find((provider) => provider.key === event.target.value) || modelProviders[0];
                          updateConfig((draft) => {
                            draft.Config.LLMConfig.Mode = nextProvider.mode;
                            draft.Config.LLMConfig.ModelName = nextProvider.models[0]?.value || "";
                          });
                        }}
                        className={selectClassName}
                      >
                        {modelProviders.map((provider) => (
                          <option key={provider.key} value={provider.key}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={currentModel}
                        onChange={(event) =>
                          updateConfig((draft) => {
                            draft.Config.LLMConfig.Mode = currentProvider.mode;
                            draft.Config.LLMConfig.ModelName = event.target.value;
                          })
                        }
                        className={selectClassName}
                      >
                        {currentProviderModels.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : isEditing && item.label === "音色" ? (
                    <div className={`mt-2 grid grid-cols-[9rem_minmax(0,1fr)] gap-3 ${inlineEditorClassName}`}>
                      <select
                        value={currentVoiceProviderKey}
                        onChange={(event) => {
                          const nextProvider = voiceProviders.find((provider) => provider.key === event.target.value) || voiceProviders[0];
                          updateConfig((draft) => {
                            draft.Config.TTSConfig.Provider = nextProvider.provider;
                            draft.Config.TTSConfig.ProviderParams.audio.voice_type = nextProvider.voices[0]?.value || "";
                          });
                        }}
                        className={selectClassName}
                      >
                        {voiceProviders.map((provider) => (
                          <option key={provider.key} value={provider.key}>
                            {provider.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={currentVoiceValue}
                        onChange={(event) =>
                          updateConfig((draft) => {
                            draft.Config.TTSConfig.Provider = currentVoiceProvider.provider;
                            draft.Config.TTSConfig.ProviderParams.audio.voice_type = event.target.value;
                          })
                        }
                        className={selectClassName}
                      >
                        {currentVoiceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className={`mt-2 break-words text-[13px] leading-6 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{item.value}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-3">
            {[
              { label: "Prompt", value: promptText },
              { label: "欢迎语", value: welcomeMessage },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border px-4 py-3 ${
                  isDark ? "border-zinc-800 bg-zinc-950/80" : "border-white/80 bg-white/80"
                }`}
              >
                <div className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{item.label}</div>
                {isEditing && item.label === "Prompt" ? (
                  <div className={`mt-2 ${inlineEditorClassName}`}>
                    <textarea
                      value={promptText === "待填写" ? "" : promptText}
                      onChange={(event) =>
                        updateConfig((draft) => {
                          draft.Config.LLMConfig.SystemMessages = event.target.value ? [event.target.value] : [];
                        })
                      }
                      rows={4}
                      className={`resize-none ${textareaClassName}`}
                    />
                  </div>
                ) : isEditing && item.label === "欢迎语" ? (
                  <div className={`mt-2 ${inlineEditorClassName}`}>
                    <textarea
                      value={welcomeMessage === "待填写" ? "" : welcomeMessage}
                      onChange={(event) =>
                        updateConfig((draft) => {
                          draft.AgentConfig.WelcomeMessage = event.target.value;
                        })
                      }
                      rows={3}
                      className={`resize-none ${textareaClassName}`}
                    />
                  </div>
                ) : (
                  <div className={`mt-2 text-[13px] leading-6 ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{item.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {capabilityGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.title} className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white/90"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                      <div className={`text-sm font-medium ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{group.title}</div>
                    </div>
                    <div className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{group.description}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"}`}>
                    {isBlankPreset ? "待完善" : `${group.values.length} 项`}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.values.map((value) => (
                    <span
                      key={value}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        isDark ? "border-zinc-700 bg-zinc-950 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                      }`}
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
