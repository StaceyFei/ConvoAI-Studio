import { AudioLines, Bot, Boxes, Check, ChevronDown, GitBranch, Pencil, Plus, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FEATURE_CONFIG_TABS } from "@/lib/featureConfigs";
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
    toolList,
    skillList,
    previewAgent,
    setPreviewAgent,
    setCurrentSection,
  } = useWorkspaceStore();
  const isDark = theme === 'dark';
  const isBlankPreset = orchestrationPreset === 'blank';
  const [isEditing, setIsEditing] = useState(false);
  const [isAsrAdvancedOpen, setIsAsrAdvancedOpen] = useState(false);
  const [isLlmAdvancedOpen, setIsLlmAdvancedOpen] = useState(false);
  const [isTtsAdvancedOpen, setIsTtsAdvancedOpen] = useState(false);
  const [activeCapabilityEditKey, setActiveCapabilityEditKey] = useState<null | "features" | "tools" | "skills">(null);
  const [openCapabilityPicker, setOpenCapabilityPicker] = useState<null | "features" | "tools" | "skills">(null);
  const [capabilitySearch, setCapabilitySearch] = useState<Record<"features" | "tools" | "skills", string>>({
    features: "",
    tools: "",
    skills: "",
  });
  const [editingSnapshot, setEditingSnapshot] = useState<{ name: string; json: string; description: string } | null>(null);
  const [capabilityEditingSnapshot, setCapabilityEditingSnapshot] = useState<string | null>(null);
  const capabilityPickerRef = useRef<HTMLDivElement | null>(null);
  const capabilitySearchInputRef = useRef<HTMLInputElement | null>(null);

  const fallbackConfig = useMemo(
    () => ({
      AgentConfig: {
        WelcomeMessage: "",
      },
      Config: {
        ASRConfig: {
          Provider: "",
          ProviderParams: {
            RecognitionMode: "stream",
            HotWords: [] as string[],
          },
          VADConfig: {
            Enable: true,
            Duration: 800,
            EnableSemanticEos: true,
          },
          InterruptConfig: {
            Enable: true,
            Duration: 300,
            Keywords: [] as string[],
          },
        },
        TTSConfig: {
          Provider: "",
          ProviderParams: {
            SynthesisMode: "stream",
            audio: {
              voice_type: "",
              speech_rate: 0,
              volume: 0,
              pitch: 0,
            },
          },
        },
        LLMConfig: {
          Mode: "",
          Provider: "",
          ModelName: "",
          SystemMessages: [] as string[],
          ProviderParams: {
            ThinkingMode: "off",
            Temperature: 1,
            TopP: 1,
            MaxTokens: 2048,
            HistoryRounds: 10,
          },
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
  const asrProviderParams = parsedConfig?.Config?.ASRConfig?.ProviderParams ?? {};
  const asrVadConfig = parsedConfig?.Config?.ASRConfig?.VADConfig ?? {};
  const asrInterruptConfig = parsedConfig?.Config?.ASRConfig?.InterruptConfig ?? {};
  const llmProviderParams = parsedConfig?.Config?.LLMConfig?.ProviderParams ?? {};
  const ttsProviderParams = parsedConfig?.Config?.TTSConfig?.ProviderParams ?? {};
  const ttsAudioParams = ttsProviderParams?.audio ?? {};
  const currentAsrRecognitionMode = asrProviderParams?.RecognitionMode || "stream";
  const currentAsrVadEnabled = asrVadConfig?.Enable ?? true;
  const currentAsrVadDuration = asrVadConfig?.Duration ?? 800;
  const currentAsrSemanticEosEnabled = asrVadConfig?.EnableSemanticEos ?? true;
  const currentAsrInterruptEnabled = asrInterruptConfig?.Enable ?? true;
  const currentAsrInterruptDuration = asrInterruptConfig?.Duration ?? 300;
  const currentAsrInterruptKeywords = Array.isArray(asrInterruptConfig?.Keywords)
    ? asrInterruptConfig.Keywords.join(", ")
    : (asrInterruptConfig?.Keywords ?? "");
  const currentAsrHotWords = Array.isArray(asrProviderParams?.HotWords)
    ? asrProviderParams.HotWords.join(", ")
    : (asrProviderParams?.HotWords ?? "");
  const currentThinkingMode = llmProviderParams?.ThinkingMode || "off";
  const currentTemperature = llmProviderParams?.Temperature ?? 1;
  const currentTopP = llmProviderParams?.TopP ?? 1;
  const currentMaxTokens = llmProviderParams?.MaxTokens ?? 2048;
  const currentHistoryRounds = llmProviderParams?.HistoryRounds ?? 10;
  const currentTtsSynthesisMode = ttsProviderParams?.SynthesisMode || "stream";
  const currentTtsSpeechRate = ttsAudioParams?.speech_rate ?? 0;
  const currentTtsVolume = ttsAudioParams?.volume ?? 0;
  const currentTtsPitch = ttsAudioParams?.pitch ?? 0;
  const systemMessages = parsedConfig?.Config?.LLMConfig?.SystemMessages;
  const promptText = Array.isArray(systemMessages) ? systemMessages.filter(Boolean).join("\n") || "待填写" : "待填写";
  const welcomeMessage = parsedConfig?.AgentConfig?.WelcomeMessage || "待填写";
  const normalizeStringList = (value: unknown) =>
    Array.from(
      new Set(
        (Array.isArray(value) ? value : [])
          .map((item) => {
            if (typeof item === "string") return item.trim();
            if (item && typeof item === "object") {
              const name = "name" in item && typeof item.name === "string" ? item.name.trim() : "";
              const label = "label" in item && typeof item.label === "string" ? item.label.trim() : "";
              const valueText = "value" in item && typeof item.value === "string" ? item.value.trim() : "";
              return name || label || valueText;
            }
            return "";
          })
          .filter(Boolean)
      )
    );
  const defaultFeatureValues = isBlankPreset ? [] : ["云端录制", "RTS 实时消息"];
  const defaultToolValues = isBlankPreset ? [] : ["知识检索 MCP", "工单系统 MCP"];
  const defaultSkillValues = isBlankPreset ? [] : ["意图分类 Skill", "摘要生成 Skill"];
  const rawFeatureValues = parsedConfig?.Config?.FeatureConfig?.EnabledFeatures;
  const rawToolValues = parsedConfig?.Config?.FunctionCallingConfig?.Tools;
  const rawSkillValues = parsedConfig?.Config?.SkillConfig?.Skills;
  const currentFeatureValues = (Array.isArray(rawFeatureValues) ? normalizeStringList(rawFeatureValues) : defaultFeatureValues)
    .filter((item) => item !== "AI VAD");
  const currentToolValues = Array.isArray(rawToolValues) ? normalizeStringList(rawToolValues) : defaultToolValues;
  const currentSkillValues = Array.isArray(rawSkillValues) ? normalizeStringList(rawSkillValues) : defaultSkillValues;
  const capabilityGroups = [
    {
      key: "features" as const,
      title: "高级功能",
      description: "默认启用的互动与智能能力",
      icon: ShieldCheck,
      values: currentFeatureValues,
      emptyText: "待配置",
      options: FEATURE_CONFIG_TABS.map((feature) => ({
        value: feature.label,
        label: feature.label,
        description: feature.description,
      })),
    },
    {
      key: "tools" as const,
      title: "工具 / MCP",
      description: "可直接调用的外部能力与 MCP 工具",
      icon: Boxes,
      values: currentToolValues,
      emptyText: "待添加 MCP",
      options: toolList.map((tool) => ({
        value: tool.name,
        label: tool.name,
        description: `${tool.type} · ${tool.status}`,
      })),
    },
    {
      key: "skills" as const,
      title: "Skill",
      description: "模板内置的推理与处理能力",
      icon: GitBranch,
      values: currentSkillValues,
      emptyText: "待添加 Skill",
      options: skillList.map((skill) => ({
        value: skill.name,
        label: skill.name,
        description: `${skill.category} · ${skill.model}`,
      })),
    }
  ];

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
    nextConfig.Config.ASRConfig.ProviderParams.RecognitionMode = nextConfig.Config.ASRConfig.ProviderParams.RecognitionMode || "stream";
    nextConfig.Config.ASRConfig.ProviderParams.HotWords = nextConfig.Config.ASRConfig.ProviderParams.HotWords || [];
    nextConfig.Config.ASRConfig.VADConfig = nextConfig.Config.ASRConfig.VADConfig || {};
    nextConfig.Config.ASRConfig.VADConfig.Enable = nextConfig.Config.ASRConfig.VADConfig.Enable ?? true;
    nextConfig.Config.ASRConfig.VADConfig.Duration = nextConfig.Config.ASRConfig.VADConfig.Duration ?? 800;
    nextConfig.Config.ASRConfig.VADConfig.EnableSemanticEos = nextConfig.Config.ASRConfig.VADConfig.EnableSemanticEos ?? true;
    nextConfig.Config.ASRConfig.InterruptConfig = nextConfig.Config.ASRConfig.InterruptConfig || {};
    nextConfig.Config.ASRConfig.InterruptConfig.Enable = nextConfig.Config.ASRConfig.InterruptConfig.Enable ?? true;
    nextConfig.Config.ASRConfig.InterruptConfig.Duration = nextConfig.Config.ASRConfig.InterruptConfig.Duration ?? 300;
    nextConfig.Config.ASRConfig.InterruptConfig.Keywords = nextConfig.Config.ASRConfig.InterruptConfig.Keywords || [];
    nextConfig.Config.LLMConfig = nextConfig.Config.LLMConfig || {};
    nextConfig.Config.LLMConfig.ProviderParams = nextConfig.Config.LLMConfig.ProviderParams || {};
    nextConfig.Config.LLMConfig.ProviderParams.ThinkingMode = nextConfig.Config.LLMConfig.ProviderParams.ThinkingMode || "off";
    nextConfig.Config.LLMConfig.ProviderParams.Temperature = nextConfig.Config.LLMConfig.ProviderParams.Temperature ?? 1;
    nextConfig.Config.LLMConfig.ProviderParams.TopP = nextConfig.Config.LLMConfig.ProviderParams.TopP ?? 1;
    nextConfig.Config.LLMConfig.ProviderParams.MaxTokens = nextConfig.Config.LLMConfig.ProviderParams.MaxTokens ?? 2048;
    nextConfig.Config.LLMConfig.ProviderParams.HistoryRounds = nextConfig.Config.LLMConfig.ProviderParams.HistoryRounds ?? 10;
    nextConfig.Config.TTSConfig = nextConfig.Config.TTSConfig || {};
    nextConfig.Config.TTSConfig.ProviderParams = nextConfig.Config.TTSConfig.ProviderParams || {};
    nextConfig.Config.TTSConfig.ProviderParams.audio = nextConfig.Config.TTSConfig.ProviderParams.audio || {};
    nextConfig.Config.TTSConfig.ProviderParams.SynthesisMode = nextConfig.Config.TTSConfig.ProviderParams.SynthesisMode || "stream";
    nextConfig.Config.TTSConfig.ProviderParams.audio.speech_rate = nextConfig.Config.TTSConfig.ProviderParams.audio.speech_rate ?? 0;
    nextConfig.Config.TTSConfig.ProviderParams.audio.volume = nextConfig.Config.TTSConfig.ProviderParams.audio.volume ?? 0;
    nextConfig.Config.TTSConfig.ProviderParams.audio.pitch = nextConfig.Config.TTSConfig.ProviderParams.audio.pitch ?? 0;
    nextConfig.Config.FeatureConfig = nextConfig.Config.FeatureConfig || {};
    nextConfig.Config.FeatureConfig.EnabledFeatures = Array.isArray(nextConfig.Config.FeatureConfig.EnabledFeatures)
      ? nextConfig.Config.FeatureConfig.EnabledFeatures
      : [];
    nextConfig.Config.FunctionCallingConfig = nextConfig.Config.FunctionCallingConfig || {};
    nextConfig.Config.FunctionCallingConfig.Tools = Array.isArray(nextConfig.Config.FunctionCallingConfig.Tools)
      ? nextConfig.Config.FunctionCallingConfig.Tools
      : [];
    nextConfig.Config.SkillConfig = nextConfig.Config.SkillConfig || {};
    nextConfig.Config.SkillConfig.Skills = Array.isArray(nextConfig.Config.SkillConfig.Skills)
      ? nextConfig.Config.SkillConfig.Skills
      : [];

    updater(nextConfig);
    updateJson(JSON.stringify(nextConfig, null, 2));
  };
  const updateCapabilityValues = (key: "features" | "tools" | "skills", values: string[]) => {
    updateConfig((draft) => {
      if (key === "features") {
        draft.Config.FeatureConfig.EnabledFeatures = values;
        return;
      }
      if (key === "tools") {
        draft.Config.FunctionCallingConfig.Tools = values;
        return;
      }
      draft.Config.SkillConfig.Skills = values;
    });
  };
  const addCapabilityValue = (key: "features" | "tools" | "skills", value: string) => {
    const currentValues =
      key === "features" ? currentFeatureValues : key === "tools" ? currentToolValues : currentSkillValues;
    updateCapabilityValues(key, normalizeStringList([...currentValues, value]));
    setOpenCapabilityPicker(null);
  };
  const removeCapabilityValue = (key: "features" | "tools" | "skills", value: string) => {
    const currentValues =
      key === "features" ? currentFeatureValues : key === "tools" ? currentToolValues : currentSkillValues;
    updateCapabilityValues(key, currentValues.filter((item) => item !== value));
  };
  const startCapabilityEditing = (key: "features" | "tools" | "skills") => {
    setCapabilityEditingSnapshot(currentJson);
    setOpenCapabilityPicker(null);
    setActiveCapabilityEditKey(key);
  };
  const finishCapabilityEditing = () => {
    setOpenCapabilityPicker(null);
    setCapabilityEditingSnapshot(null);
    setActiveCapabilityEditKey(null);
  };
  const cancelCapabilityEditing = () => {
    if (capabilityEditingSnapshot !== null) {
      updateJson(capabilityEditingSnapshot);
    }
    setOpenCapabilityPicker(null);
    setCapabilityEditingSnapshot(null);
    setActiveCapabilityEditKey(null);
  };
  useEffect(() => {
    if (!openCapabilityPicker) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (capabilityPickerRef.current?.contains(event.target as Node)) return;
      setOpenCapabilityPicker(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openCapabilityPicker]);

  useEffect(() => {
    if (!openCapabilityPicker) return;
    setCapabilitySearch((current) => ({ ...current, [openCapabilityPicker]: "" }));
  }, [openCapabilityPicker]);

  useEffect(() => {
    if (!openCapabilityPicker) return;
    window.requestAnimationFrame(() => {
      capabilitySearchInputRef.current?.focus();
    });
  }, [openCapabilityPicker]);

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
      RecognitionMode: draft.Config.ASRConfig.ProviderParams?.RecognitionMode || "stream",
      HotWords: draft.Config.ASRConfig.ProviderParams?.HotWords ?? [],
    };
    draft.Config.ASRConfig.VADConfig = {
      ...draft.Config.ASRConfig.VADConfig,
      Enable: draft.Config.ASRConfig.VADConfig?.Enable ?? true,
      Duration: draft.Config.ASRConfig.VADConfig?.Duration ?? 800,
      EnableSemanticEos: draft.Config.ASRConfig.VADConfig?.EnableSemanticEos ?? true,
    };
    draft.Config.ASRConfig.InterruptConfig = {
      ...draft.Config.ASRConfig.InterruptConfig,
      Enable: draft.Config.ASRConfig.InterruptConfig?.Enable ?? true,
      Duration: draft.Config.ASRConfig.InterruptConfig?.Duration ?? 300,
      Keywords: draft.Config.ASRConfig.InterruptConfig?.Keywords ?? [],
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
      ThinkingMode: draft.Config.LLMConfig.ProviderParams?.ThinkingMode || "off",
      Temperature: draft.Config.LLMConfig.ProviderParams?.Temperature ?? 1,
      TopP: draft.Config.LLMConfig.ProviderParams?.TopP ?? 1,
      MaxTokens: draft.Config.LLMConfig.ProviderParams?.MaxTokens ?? 2048,
      HistoryRounds: draft.Config.LLMConfig.ProviderParams?.HistoryRounds ?? 10,
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
      SynthesisMode: draft.Config.TTSConfig.ProviderParams?.SynthesisMode || "stream",
      audio: {
        ...draft.Config.TTSConfig.ProviderParams.audio,
        voice_type: voiceValue ?? resource.voiceOptions?.[0]?.value ?? "",
        speech_rate: draft.Config.TTSConfig.ProviderParams.audio?.speech_rate ?? 0,
        volume: draft.Config.TTSConfig.ProviderParams.audio?.volume ?? 0,
        pitch: draft.Config.TTSConfig.ProviderParams.audio?.pitch ?? 0,
      },
    };
  };

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

  const lineFieldClassName = `w-full border-0 border-b bg-transparent px-0 transition-colors focus:outline-none ${
    isDark
      ? "border-white/10 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400/45"
      : "border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-300"
  }`;
  const titleFieldShellClassName = `flex h-10 w-full items-center transition-colors ${
    isDark ? "border-white/10" : "border-zinc-200"
  }`;
  const titleEditingShellClassName = `${titleFieldShellClassName} border-b`;
  const inputClassName = `h-full w-full appearance-none border-0 bg-transparent px-0 pb-1 pt-0 text-xl font-semibold leading-none tracking-[0.01em] focus:outline-none ${
    isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-400"
  }`;
  const titleDisplayClassName = `flex h-full w-full items-center truncate pb-1 pt-0 text-xl font-semibold leading-none tracking-[0.01em] ${
    isDark ? "text-zinc-100" : "text-zinc-900"
  }`;
  const selectClassName = `${lineFieldClassName} h-9 pb-1 pt-0 pr-6 text-[13px]`;
  const numberInputClassName = `${lineFieldClassName} h-9 pb-1 pt-0 text-[13px]`;
  const compactFieldLabelClass = `shrink-0 text-[11px] ${
    isDark ? "text-zinc-500" : "text-zinc-500"
  }`;
  const sliderFieldLabelClass = `text-[11px] font-medium tracking-[0.01em] ${
    isDark ? "text-zinc-400" : "text-zinc-500"
  }`;
  const sliderValueInputClass = `h-7 w-[58px] shrink-0 rounded-md border px-2 text-center text-[10px] focus:outline-none transition-colors ${
    isDark
      ? "border-white/6 bg-white/[0.03] text-zinc-400 placeholder:text-zinc-600 focus:border-blue-400/25 focus:bg-white/[0.05]"
      : "border-zinc-200/70 bg-zinc-50/55 text-zinc-500 placeholder:text-zinc-400 focus:border-blue-300/70 focus:bg-white"
  }`;
  const compactNumberInputClass = `h-8 w-[72px] rounded-lg border px-2.5 text-center text-[12px] focus:outline-none ${
    isDark
      ? "border-white/10 bg-zinc-950/80 text-zinc-100 placeholder:text-zinc-500 focus:border-blue-400/35"
      : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-blue-300"
  }`;
  const compactSideFieldClass = `h-7 w-full rounded-md border px-2.5 text-[11px] focus:outline-none transition-colors ${
    isDark
      ? "border-white/6 bg-white/[0.03] text-zinc-400 placeholder:text-zinc-600 focus:border-blue-400/25 focus:bg-white/[0.05]"
      : "border-zinc-200/70 bg-zinc-50/55 text-zinc-500 placeholder:text-zinc-400 focus:border-blue-300/70 focus:bg-white"
  }`;
  const disabledFieldClass = isDark ? "opacity-45" : "opacity-50";
  const toggleRowClass = `flex items-center justify-between rounded-md border px-2.5 py-1.5 ${
    isDark ? "border-white/5 bg-white/[0.02]" : "border-zinc-200/60 bg-zinc-50/40"
  }`;
  const inlineSettingSelectClass = `min-w-0 border-0 bg-transparent pr-5 text-right text-[11px] focus:outline-none ${
    isDark ? "text-zinc-300" : "text-zinc-600"
  }`;
  const buildToggleClassName = (checked: boolean) =>
    `relative inline-flex h-4.5 w-8 items-center rounded-full border transition-colors ${
      checked
        ? (isDark ? "border-blue-400/35 bg-blue-500/65" : "border-blue-300 bg-blue-500/85")
        : (isDark ? "border-white/8 bg-zinc-900" : "border-zinc-200 bg-zinc-200/80")
    }`;
  const buildToggleKnobClassName = (checked: boolean) =>
    `inline-block h-3.5 w-3.5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-transform ${
      checked ? "translate-x-4" : "translate-x-0.5"
    }`;
  const sliderTrackWrapClass = "min-w-0 flex-1";
  const compactSelectClass = `h-8 min-w-0 rounded-lg border px-3 text-[12px] focus:outline-none ${
    isDark
      ? "border-white/10 bg-zinc-950/80 text-zinc-100 focus:border-blue-400/35"
      : "border-zinc-200 bg-white text-zinc-900 focus:border-blue-300"
  }`;
  const sliderTrackBaseClass = "relative h-10";
  const sliderTrackLineClass = "pointer-events-none absolute inset-x-0 top-6 h-[2px] -translate-y-1/2 rounded-full";
  const sliderInputClass = `absolute inset-x-0 top-6 h-4 w-full -translate-y-1/2 cursor-pointer appearance-none bg-transparent
    [&::-webkit-slider-runnable-track]:h-[2px]
    [&::-webkit-slider-runnable-track]:bg-transparent
    [&::-webkit-slider-runnable-track]:rounded-full
    [&::-webkit-slider-thumb]:-mt-[5px]
    [&::-webkit-slider-thumb]:h-3
    [&::-webkit-slider-thumb]:w-3
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:border
    ${isDark ? "[&::-webkit-slider-thumb]:border-blue-300 [&::-webkit-slider-thumb]:bg-blue-400" : "[&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:bg-blue-500"}
    [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.14)]
    [&::-moz-range-track]:h-[2px]
    [&::-moz-range-track]:rounded-full
    [&::-moz-range-track]:bg-transparent
    [&::-moz-range-thumb]:h-3
    [&::-moz-range-thumb]:w-3
    [&::-moz-range-thumb]:rounded-full
    [&::-moz-range-thumb]:border
    ${isDark ? "[&::-moz-range-thumb]:border-blue-300 [&::-moz-range-thumb]:bg-blue-400" : "[&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:bg-blue-500"}
    [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.14)]`;
  const inlineEditorClassName = `border-t pt-3 transition-colors ${
    isDark ? "border-white/8" : "border-zinc-200/80"
  }`;
  const textareaClassName = `w-full border-0 bg-transparent px-0 py-0 text-[13px] leading-6 focus:outline-none ${
    isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-900 placeholder:text-zinc-400"
  }`;
  const formatSliderValue = (value: number) => value.toFixed(2).replace(/\.?0+$/, "");
  const sliderThemeStyle = {
    "--slider-active": isDark ? "rgba(96,165,250,0.95)" : "rgba(59,130,246,0.95)",
    "--slider-inactive": isDark ? "rgba(63,63,70,0.9)" : "rgba(212,212,216,0.9)",
  } as React.CSSProperties;
  const buildSliderTrackStyle = (progressPercent: number) =>
    ({
      ...sliderThemeStyle,
      background: `linear-gradient(to right, var(--slider-active) 0%, var(--slider-active) ${progressPercent}%, var(--slider-inactive) ${progressPercent}%, var(--slider-inactive) 100%)`,
    }) as React.CSSProperties;
  const buildSliderBubbleStyle = (progressPercent: number) =>
    ({
      left: `${Math.max(0, Math.min(100, progressPercent))}%`,
      transform: "translateX(-50%)",
    }) as React.CSSProperties;

  const startEditing = () => {
    setEditingSnapshot({ name: agentName, json: currentJson, description: agentDescription });
    setIsAsrAdvancedOpen(false);
    setIsLlmAdvancedOpen(false);
    setIsTtsAdvancedOpen(false);
    setActiveCapabilityEditKey(null);
    setCapabilityEditingSnapshot(null);
    setOpenCapabilityPicker(null);
    setIsEditing(true);
  };

  const finishEditing = () => {
    setIsAsrAdvancedOpen(false);
    setIsLlmAdvancedOpen(false);
    setIsTtsAdvancedOpen(false);
    setActiveCapabilityEditKey(null);
    setCapabilityEditingSnapshot(null);
    setOpenCapabilityPicker(null);
    setEditingSnapshot(null);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    if (editingSnapshot !== null) {
      setAgentName(editingSnapshot.name);
      updateJson(editingSnapshot.json);
      setAgentDescription(editingSnapshot.description);
    }
    setIsAsrAdvancedOpen(false);
    setIsLlmAdvancedOpen(false);
    setIsTtsAdvancedOpen(false);
    setActiveCapabilityEditKey(null);
    setCapabilityEditingSnapshot(null);
    setOpenCapabilityPicker(null);
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
        <div className="flex items-center gap-2">
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
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pb-8 pt-4 [scrollbar-width:thin] ${
        isDark ? "[scrollbar-color:#3f3f46_transparent]" : "[scrollbar-color:#d4d4d8_transparent]"
      }`}>
        <div className={`group rounded-2xl border px-5 pb-5 pt-3.5 ${
          isDark
            ? "border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-zinc-950 to-zinc-950"
            : "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50"
        }`}>
          <div className="flex flex-col gap-0">
            <div className="flex h-8 items-center justify-end">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isDark
                          ? "border-white/8 bg-zinc-950/55 text-zinc-400 hover:border-white/12 hover:bg-zinc-950/75 hover:text-zinc-200"
                          : "border-zinc-200/70 bg-white/78 text-zinc-500 hover:border-zinc-300 hover:bg-white hover:text-zinc-700"
                      }`}
                      title="取消编辑"
                      aria-label="取消编辑"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={finishEditing}
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        isDark
                          ? "border-blue-400/20 bg-blue-500/8 text-blue-300 hover:border-blue-300/30 hover:bg-blue-500/12"
                          : "border-blue-200/80 bg-blue-50/70 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                      title="完成编辑"
                      aria-label="完成编辑"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startEditing}
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
                      isDark
                        ? "border-blue-500/10 bg-blue-500/10 text-blue-300 hover:border-zinc-800/80 hover:bg-zinc-900/70 hover:text-zinc-200"
                        : "border-blue-100/80 bg-blue-50/85 text-blue-600 hover:border-zinc-200 hover:bg-white/90 hover:text-zinc-700"
                    }`}
                    title={previewAgent ? "修改预览参数" : "编辑详情"}
                    aria-label={previewAgent ? "修改预览参数" : "编辑详情"}
                  >
                    <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                      <Bot className="absolute h-3.5 w-3.5 transition-all duration-150 ease-out group-hover:scale-90 group-hover:opacity-0" />
                      <Pencil className="absolute h-3 w-3 opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100" />
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex h-10 items-center justify-between gap-4">
              <div className="flex h-10 min-w-0 flex-1 items-center">
                <div className={isEditing ? titleEditingShellClassName : titleFieldShellClassName}>
                  {isEditing ? (
                    <input
                      value={agentName}
                      onChange={(event) => setAgentName(event.target.value)}
                      className={inputClassName}
                      placeholder="输入智能体名称"
                    />
                  ) : (
                    <div className={titleDisplayClassName}>{agentName}</div>
                  )}
                </div>
              </div>
              <div className="h-8 w-8 shrink-0" />
            </div>
            {isEditing ? (
              <div className="mt-4 pt-3">
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
                  key={item.key}
                  className={`rounded-xl border px-4 py-3 sm:col-span-2 ${
                    isDark ? "border-zinc-800 bg-zinc-950/80" : "border-white/80 bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                    <span className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{item.label}</span>
                  </div>
                  {isEditing && item.key === "asr" ? (
                    <div className={`mt-2 space-y-3 ${inlineEditorClassName}`}>
                      <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3">
                        <select
                          value={currentAsrResourceKey}
                          onChange={(event) => {
                            const nextProvider = asrResources.find((resource) => resource.id === event.target.value) || asrResources[0];
                            updateConfig((draft) => {
                              applyAsrResource(draft, nextProvider);
                            });
                          }}
                          className={selectClassName}
                        >
                          {asrResources.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.providerLabel}
                            </option>
                          ))}
                        </select>
                        <select
                          value={currentAsrModel}
                          onChange={(event) =>
                            updateConfig((draft) => {
                              applyAsrResource(draft, currentAsrResource, event.target.value);
                            })
                          }
                          className={selectClassName}
                        >
                          {currentAsrModels.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`rounded-xl border ${
                        isDark ? "border-white/8 bg-zinc-950/35" : "border-zinc-200/80 bg-zinc-50/55"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setIsAsrAdvancedOpen((current) => !current)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            isDark ? "hover:bg-white/[0.01]" : "hover:bg-white/40"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-medium tracking-[0.01em] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                高级配置
                              </span>
                              <span className={`truncate text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                                识别模式、VAD 和打断策略
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                              {isAsrAdvancedOpen ? "收起" : "展开"}
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${isDark ? "text-zinc-500" : "text-zinc-500"} ${
                                isAsrAdvancedOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isAsrAdvancedOpen ? (
                          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-x-8">
                            <div className="space-y-2">
                              <div className="block">
                                <div className={toggleRowClass}>
                                  <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                    识别模式
                                  </span>
                                  <select
                                    value={currentAsrRecognitionMode}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.ASRConfig.ProviderParams.RecognitionMode = event.target.value;
                                      })
                                    }
                                    className={inlineSettingSelectClass}
                                  >
                                    <option value="stream">流式</option>
                                    <option value="non_stream">非流式</option>
                                    <option value="stream_optimized">流式优化版</option>
                                  </select>
                                </div>
                              </div>

                              <div className="block space-y-1.5">
                                <div className={compactFieldLabelClass}>VAD</div>
                                <div className={toggleRowClass}>
                                  <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                                    {currentAsrVadEnabled ? "开启" : "关闭"}
                                  </span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={currentAsrVadEnabled}
                                    aria-label="切换 VAD"
                                    onClick={() =>
                                      updateConfig((draft) => {
                                        draft.Config.ASRConfig.VADConfig.Enable = !currentAsrVadEnabled;
                                      })
                                    }
                                    className={buildToggleClassName(currentAsrVadEnabled)}
                                  >
                                    <span className={buildToggleKnobClassName(currentAsrVadEnabled)} />
                                  </button>
                                </div>
                              </div>

                              <div className="block space-y-1.5">
                                <div className={compactFieldLabelClass}>语义判停</div>
                                <div className={toggleRowClass}>
                                  <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                                    {currentAsrSemanticEosEnabled ? "开启" : "关闭"}
                                  </span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={currentAsrSemanticEosEnabled}
                                    aria-label="切换语义判停"
                                    onClick={() =>
                                      updateConfig((draft) => {
                                        draft.Config.ASRConfig.VADConfig.EnableSemanticEos = !currentAsrSemanticEosEnabled;
                                      })
                                    }
                                    className={buildToggleClassName(currentAsrSemanticEosEnabled)}
                                  >
                                    <span className={buildToggleKnobClassName(currentAsrSemanticEosEnabled)} />
                                  </button>
                                </div>
                              </div>

                              <div className="block space-y-1.5">
                                <div className={compactFieldLabelClass}>语音打断</div>
                                <div className={toggleRowClass}>
                                  <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                                    {currentAsrInterruptEnabled ? "开启" : "关闭"}
                                  </span>
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={currentAsrInterruptEnabled}
                                    aria-label="切换语音打断"
                                    onClick={() =>
                                      updateConfig((draft) => {
                                        draft.Config.ASRConfig.InterruptConfig.Enable = !currentAsrInterruptEnabled;
                                      })
                                    }
                                    className={buildToggleClassName(currentAsrInterruptEnabled)}
                                  >
                                    <span className={buildToggleKnobClassName(currentAsrInterruptEnabled)} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className={`block space-y-1.5 ${!currentAsrVadEnabled ? disabledFieldClass : ""}`}>
                                <div className={sliderFieldLabelClass}>VAD 时长</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle((currentAsrVadDuration / 3000) * 100)}
                                      >
                                        {currentAsrVadDuration}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle((currentAsrVadDuration / 3000) * 100)}
                                      />
                                      <input
                                        type="range"
                                        min="0"
                                        max="3000"
                                        step="100"
                                        disabled={!currentAsrVadEnabled}
                                        value={currentAsrVadDuration}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.ASRConfig.VADConfig.Duration = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="3000"
                                    step="100"
                                    disabled={!currentAsrVadEnabled}
                                    value={currentAsrVadDuration}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.ASRConfig.VADConfig.Duration = Number(event.target.value || 0);
                                      })
                                    }
                                    className={`${sliderValueInputClass} ${!currentAsrVadEnabled ? "cursor-not-allowed" : ""}`}
                                  />
                                </div>
                              </label>

                              <label className={`block space-y-1.5 ${!currentAsrInterruptEnabled ? disabledFieldClass : ""}`}>
                                <div className={sliderFieldLabelClass}>语音打断时长</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle((currentAsrInterruptDuration / 2000) * 100)}
                                      >
                                        {currentAsrInterruptDuration}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle((currentAsrInterruptDuration / 2000) * 100)}
                                      />
                                      <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        step="100"
                                        disabled={!currentAsrInterruptEnabled}
                                        value={currentAsrInterruptDuration}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.ASRConfig.InterruptConfig.Duration = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    max="2000"
                                    step="100"
                                    disabled={!currentAsrInterruptEnabled}
                                    value={currentAsrInterruptDuration}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.ASRConfig.InterruptConfig.Duration = Number(event.target.value || 0);
                                      })
                                    }
                                    className={`${sliderValueInputClass} ${!currentAsrInterruptEnabled ? "cursor-not-allowed" : ""}`}
                                  />
                                </div>
                              </label>

                              <label className={`block space-y-1.5 ${!currentAsrInterruptEnabled ? disabledFieldClass : ""}`}>
                                <div className={compactFieldLabelClass}>打断关键词</div>
                                <input
                                  type="text"
                                  disabled={!currentAsrInterruptEnabled}
                                  value={currentAsrInterruptKeywords}
                                  onChange={(event) =>
                                    updateConfig((draft) => {
                                      draft.Config.ASRConfig.InterruptConfig.Keywords = event.target.value
                                        .split(/[，,]/)
                                        .map((item: string) => item.trim())
                                        .filter(Boolean);
                                    })
                                  }
                                  placeholder="多个词条用逗号分隔"
                                  className={`${compactSideFieldClass} text-left ${!currentAsrInterruptEnabled ? "cursor-not-allowed" : ""}`}
                                />
                              </label>

                              <label className="block space-y-1.5">
                                <div className={compactFieldLabelClass}>热词</div>
                                <input
                                  type="text"
                                  value={currentAsrHotWords}
                                  onChange={(event) =>
                                    updateConfig((draft) => {
                                      draft.Config.ASRConfig.ProviderParams.HotWords = event.target.value
                                        .split(/[，,]/)
                                        .map((item: string) => item.trim())
                                        .filter(Boolean);
                                    })
                                  }
                                  placeholder="多个词条用逗号分隔"
                                  className={`${compactSideFieldClass} text-left`}
                                />
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : isEditing && item.key === "llm" ? (
                    <div className={`mt-2 space-y-3 ${inlineEditorClassName}`}>
                      <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3">
                        <select
                          value={currentProviderKey}
                          onChange={(event) => {
                            const nextProvider = llmResources.find((resource) => resource.id === event.target.value) || llmResources[0];
                            updateConfig((draft) => {
                              applyLlmResource(draft, nextProvider);
                            });
                          }}
                          className={selectClassName}
                        >
                          {llmResources.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.providerLabel}
                            </option>
                          ))}
                        </select>
                        <select
                          value={currentModel}
                          onChange={(event) =>
                            updateConfig((draft) => {
                              applyLlmResource(draft, currentLlmResource, event.target.value);
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

                      <div className={`rounded-xl border ${
                        isDark ? "border-white/8 bg-zinc-950/35" : "border-zinc-200/80 bg-zinc-50/55"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setIsLlmAdvancedOpen((current) => !current)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            isDark ? "hover:bg-white/[0.01]" : "hover:bg-white/40"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-medium tracking-[0.01em] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                高级配置
                              </span>
                              <span className={`truncate text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                                深度思考、历史轮次和采样参数
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                              {isLlmAdvancedOpen ? "收起" : "展开"}
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${isDark ? "text-zinc-500" : "text-zinc-500"} ${
                                isLlmAdvancedOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isLlmAdvancedOpen ? (
                          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-x-8">
                            <div className="space-y-2">
                              <div className="block">
                                <div className={toggleRowClass}>
                                  <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                    深度思考
                                  </span>
                                  <select
                                    value={currentThinkingMode}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.LLMConfig.ProviderParams.ThinkingMode = event.target.value;
                                      })
                                    }
                                    className={inlineSettingSelectClass}
                                  >
                                    <option value="off">关闭</option>
                                    <option value="on">开启</option>
                                    <option value="auto">自动</option>
                                  </select>
                                </div>
                              </div>

                              <div className="block">
                                <div className={toggleRowClass}>
                                  <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                    历史轮次
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={currentHistoryRounds}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.LLMConfig.ProviderParams.HistoryRounds = Number(event.target.value || 0);
                                      })
                                    }
                                    className="w-14 border-0 bg-transparent p-0 text-right text-[11px] focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block space-y-1.5">
                                <div className={sliderFieldLabelClass}>Temperature</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle((currentTemperature / 2) * 100)}
                                      >
                                        {formatSliderValue(currentTemperature)}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle((currentTemperature / 2) * 100)}
                                      />
                                      <input
                                        type="range"
                                        step="0.1"
                                        min="0"
                                        max="2"
                                        value={currentTemperature}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.LLMConfig.ProviderParams.Temperature = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="2"
                                    value={formatSliderValue(currentTemperature)}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.LLMConfig.ProviderParams.Temperature = Number(event.target.value || 0);
                                      })
                                    }
                                    className={sliderValueInputClass}
                                  />
                                </div>
                              </label>

                              <label className="block space-y-1.5">
                                <div className={sliderFieldLabelClass}>Top P</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle(currentTopP * 100)}
                                      >
                                        {formatSliderValue(currentTopP)}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle(currentTopP * 100)}
                                      />
                                      <input
                                        type="range"
                                        step="0.05"
                                        min="0"
                                        max="1"
                                        value={currentTopP}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.LLMConfig.ProviderParams.TopP = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    max="1"
                                    value={formatSliderValue(currentTopP)}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.LLMConfig.ProviderParams.TopP = Number(event.target.value || 0);
                                      })
                                    }
                                    className={sliderValueInputClass}
                                  />
                                </div>
                              </label>

                              <label className="block space-y-1.5">
                                <div className={sliderFieldLabelClass}>Max Tokens</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle(((currentMaxTokens - 256) / (8192 - 256)) * 100)}
                                      >
                                        {currentMaxTokens}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle(((currentMaxTokens - 256) / (8192 - 256)) * 100)}
                                      />
                                      <input
                                        type="range"
                                        min="256"
                                        max="8192"
                                        step="128"
                                        value={currentMaxTokens}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.LLMConfig.ProviderParams.MaxTokens = Number(event.target.value || 256);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={currentMaxTokens}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.LLMConfig.ProviderParams.MaxTokens = Number(event.target.value || 1);
                                      })
                                    }
                                    className={sliderValueInputClass}
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : isEditing && item.key === "tts" ? (
                    <div className={`mt-2 space-y-3 ${inlineEditorClassName}`}>
                      <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3">
                        <select
                          value={currentVoiceProviderKey}
                          onChange={(event) => {
                            const nextProvider = ttsResources.find((resource) => resource.id === event.target.value) || ttsResources[0];
                            updateConfig((draft) => {
                              applyTtsResource(draft, nextProvider);
                            });
                          }}
                          className={selectClassName}
                        >
                          {ttsResources.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.providerLabel}
                            </option>
                          ))}
                        </select>
                        <select
                          value={currentVoiceValue}
                          onChange={(event) =>
                            updateConfig((draft) => {
                              applyTtsResource(draft, currentTtsResource, event.target.value);
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

                      <div className={`rounded-xl border ${
                        isDark ? "border-white/8 bg-zinc-950/35" : "border-zinc-200/80 bg-zinc-50/55"
                      }`}>
                        <button
                          type="button"
                          onClick={() => setIsTtsAdvancedOpen((current) => !current)}
                          className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors ${
                            isDark ? "hover:bg-white/[0.01]" : "hover:bg-white/40"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] font-medium tracking-[0.01em] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                高级配置
                              </span>
                              <span className={`truncate text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                                合成模式、语速、音量和音调
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                              {isTtsAdvancedOpen ? "收起" : "展开"}
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${isDark ? "text-zinc-500" : "text-zinc-500"} ${
                                isTtsAdvancedOpen ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {isTtsAdvancedOpen ? (
                          <div className="grid gap-3 px-4 py-3 sm:grid-cols-[176px_minmax(0,1fr)] sm:gap-x-8">
                            <div className="space-y-2">
                              <div className="block">
                                <div className={toggleRowClass}>
                                  <span className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                    合成模式
                                  </span>
                                  <select
                                    value={currentTtsSynthesisMode}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.TTSConfig.ProviderParams.SynthesisMode = event.target.value;
                                      })
                                    }
                                    className={inlineSettingSelectClass}
                                  >
                                    <option value="stream">流式</option>
                                    <option value="non_stream">非流式</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <label className="block space-y-1.5">
                                <div className={sliderFieldLabelClass}>语速</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle(((currentTtsSpeechRate + 50) / 150) * 100)}
                                      >
                                        {currentTtsSpeechRate}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle(((currentTtsSpeechRate + 50) / 150) * 100)}
                                      />
                                      <input
                                        type="range"
                                        min="-50"
                                        max="100"
                                        step="1"
                                        value={currentTtsSpeechRate}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.TTSConfig.ProviderParams.audio.speech_rate = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    min="-50"
                                    max="100"
                                    step="1"
                                    value={currentTtsSpeechRate}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.TTSConfig.ProviderParams.audio.speech_rate = Number(event.target.value || 0);
                                      })
                                    }
                                    className={sliderValueInputClass}
                                  />
                                </div>
                              </label>

                              <label className="block space-y-1.5">
                                <div className={sliderFieldLabelClass}>音量</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle(((currentTtsVolume + 50) / 150) * 100)}
                                      >
                                        {currentTtsVolume}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle(((currentTtsVolume + 50) / 150) * 100)}
                                      />
                                      <input
                                        type="range"
                                        min="-50"
                                        max="100"
                                        step="1"
                                        value={currentTtsVolume}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.TTSConfig.ProviderParams.audio.volume = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    min="-50"
                                    max="100"
                                    step="1"
                                    value={currentTtsVolume}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.TTSConfig.ProviderParams.audio.volume = Number(event.target.value || 0);
                                      })
                                    }
                                    className={sliderValueInputClass}
                                  />
                                </div>
                              </label>

                              <label className="block space-y-1.5">
                                <div className={sliderFieldLabelClass}>音调</div>
                                <div className="flex items-center gap-2.5">
                                  <div className={sliderTrackWrapClass}>
                                    <div className={sliderTrackBaseClass}>
                                      <div
                                        className={`pointer-events-none absolute left-0 top-0 z-10 -translate-y-full whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                          isDark ? "bg-blue-500/18 text-blue-200" : "bg-blue-50 text-blue-600"
                                        }`}
                                        style={buildSliderBubbleStyle(((currentTtsPitch + 12) / 24) * 100)}
                                      >
                                        {currentTtsPitch}
                                      </div>
                                      <div
                                        className={sliderTrackLineClass}
                                        style={buildSliderTrackStyle(((currentTtsPitch + 12) / 24) * 100)}
                                      />
                                      <input
                                        type="range"
                                        min="-12"
                                        max="12"
                                        step="1"
                                        value={currentTtsPitch}
                                        onChange={(event) =>
                                          updateConfig((draft) => {
                                            draft.Config.TTSConfig.ProviderParams.audio.pitch = Number(event.target.value || 0);
                                          })
                                        }
                                        className={sliderInputClass}
                                      />
                                    </div>
                                  </div>
                                  <input
                                    type="number"
                                    min="-12"
                                    max="12"
                                    step="1"
                                    value={currentTtsPitch}
                                    onChange={(event) =>
                                      updateConfig((draft) => {
                                        draft.Config.TTSConfig.ProviderParams.audio.pitch = Number(event.target.value || 0);
                                      })
                                    }
                                    className={sliderValueInputClass}
                                  />
                                </div>
                              </label>
                            </div>
                          </div>
                        ) : null}
                      </div>
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
            const isCapabilityEditing = activeCapabilityEditKey === group.key;
            const isAnotherCapabilityEditing = activeCapabilityEditKey !== null && activeCapabilityEditKey !== group.key;
            const searchKeyword = capabilitySearch[group.key].trim().toLowerCase();
            const availableOptions = group.options
              .filter((option) => !group.values.includes(option.value))
              .filter((option) =>
                !searchKeyword
                  ? true
                  : `${option.label} ${option.description}`.toLowerCase().includes(searchKeyword)
              );
            return (
              <div
                key={group.title}
                className={`group/capability relative rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white/90"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                      <div className={`text-sm font-medium ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{group.title}</div>
                    </div>
                    <div className={`mt-1 text-xs ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{group.description}</div>
                  </div>
                  <div className="flex shrink-0 items-start gap-2">
                    {isCapabilityEditing ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={cancelCapabilityEditing}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                            isDark
                              ? "border-white/8 bg-zinc-950/55 text-zinc-400 hover:border-white/12 hover:bg-zinc-950/75 hover:text-zinc-200"
                              : "border-zinc-200/70 bg-white/78 text-zinc-500 hover:border-zinc-300 hover:bg-white hover:text-zinc-700"
                          }`}
                          title="取消编辑"
                          aria-label="取消编辑"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={finishCapabilityEditing}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                            isDark
                              ? "border-blue-400/20 bg-blue-500/8 text-blue-300 hover:border-blue-300/30 hover:bg-blue-500/12"
                              : "border-blue-200/80 bg-blue-50/70 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                          title="完成编辑"
                          aria-label="完成编辑"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAnotherCapabilityEditing) startCapabilityEditing(group.key);
                        }}
                        disabled={isAnotherCapabilityEditing}
                        className={`relative inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${
                          isDark
                            ? "border-white/8 bg-zinc-950/55 text-zinc-300"
                            : "border-zinc-200/80 bg-white/85 text-zinc-500"
                        } ${
                          isAnotherCapabilityEditing
                            ? "cursor-default"
                            : isDark
                              ? "hover:border-zinc-800/80 hover:bg-zinc-900/70 hover:text-zinc-200"
                              : "hover:border-zinc-200 hover:bg-white/90 hover:text-zinc-700"
                        }`}
                        title={isAnotherCapabilityEditing ? `${group.values.length} 项` : `编辑${group.title}`}
                        aria-label={isAnotherCapabilityEditing ? `${group.values.length} 项` : `编辑${group.title}`}
                      >
                        <span
                          className={`absolute inset-0 flex items-center justify-center text-[10px] font-medium leading-none transition-all ${
                            isAnotherCapabilityEditing
                              ? "opacity-100"
                              : "opacity-100 group-hover/capability:scale-90 group-hover/capability:opacity-0"
                          }`}
                        >
                          {group.values.length > 0 ? `${group.values.length}项` : "待完善"}
                        </span>
                        {!isAnotherCapabilityEditing ? (
                          <Pencil className="absolute h-3 w-3 opacity-0 transition-all group-hover/capability:scale-100 group-hover/capability:opacity-100" />
                        ) : null}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {group.values.length > 0 ? (
                      group.values.map((value) => (
                        <span
                          key={value}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                            isDark ? "border-zinc-700 bg-zinc-950 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"
                          }`}
                        >
                          <span>{value}</span>
                          {isCapabilityEditing ? (
                            <button
                              type="button"
                              onClick={() => removeCapabilityValue(group.key, value)}
                              className={`inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                                isDark ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                              }`}
                              aria-label={`移除${value}`}
                              title={`移除${value}`}
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          ) : null}
                        </span>
                      ))
                    ) : (
                      <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{group.emptyText}</span>
                    )}
                  </div>

                  {isCapabilityEditing ? (
                    <div ref={openCapabilityPicker === group.key ? capabilityPickerRef : null} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCapabilityPicker((current) => (current === group.key ? null : group.key));
                          setCapabilitySearch((current) => ({ ...current, [group.key]: "" }));
                        }}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] transition-colors ${
                          isDark
                            ? "border-white/8 bg-zinc-950/55 text-zinc-300 hover:border-white/12 hover:bg-zinc-950/75"
                            : "border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        <Plus className="h-3 w-3" />
                        <span>{group.key === "features" ? "添加高级功能" : group.key === "tools" ? "添加 MCP" : "添加 Skill"}</span>
                      </button>

                      {openCapabilityPicker === group.key ? (
                        <div
                          className={`absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-xl border shadow-lg ${
                            isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"
                          }`}
                        >
                          <div className={`border-b px-3 py-2 ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
                            <label
                              className={`flex h-8 items-center gap-2 rounded-lg border px-2.5 ${
                                isDark ? "border-white/8 bg-zinc-900/80" : "border-zinc-200 bg-zinc-50/80"
                              }`}
                            >
                              <Search className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
                              <input
                                ref={openCapabilityPicker === group.key ? capabilitySearchInputRef : null}
                                type="text"
                                value={capabilitySearch[group.key]}
                                onChange={(event) =>
                                  setCapabilitySearch((current) => ({ ...current, [group.key]: event.target.value }))
                                }
                                placeholder={group.key === "features" ? "搜索高级功能" : group.key === "tools" ? "搜索 MCP" : "搜索 Skill"}
                                className={`w-full border-0 bg-transparent p-0 text-[11px] focus:outline-none ${
                                  isDark ? "text-zinc-100 placeholder:text-zinc-500" : "text-zinc-800 placeholder:text-zinc-400"
                                }`}
                              />
                            </label>
                          </div>
                          {availableOptions.length > 0 ? (
                            <div className="max-h-64 overflow-y-auto py-1">
                              {availableOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => addCapabilityValue(group.key, option.value)}
                                  className={`flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition-colors ${
                                    isDark ? "hover:bg-white/[0.03]" : "hover:bg-zinc-50"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className={`truncate text-[12px] ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{option.label}</div>
                                    <div className={`mt-0.5 truncate text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{option.description}</div>
                                  </div>
                                  <Plus className={`mt-0.5 h-3 w-3 shrink-0 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className={`px-3 py-3 text-[11px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                              {searchKeyword ? "没有匹配结果" : "暂无可添加项"}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
