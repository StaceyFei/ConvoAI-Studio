import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import Ajv from 'ajv';
import {
  type ResourceKind,
  type ThirdPartyResourceItem,
  defaultThirdPartyResources,
  findResourceById,
} from '@/lib/thirdPartyResources';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
}

export type AssistantTarget = 'agent' | 'mcp' | 'skill';

export interface AssistantMemoryEntity {
  target: AssistantTarget;
  name: string;
  id?: string;
  source: 'existing' | 'draft' | 'created' | 'attached';
}

export interface AssistantMemory {
  lastTarget: AssistantTarget | null;
  lastResolvedRequest: string;
  lastAction: 'created_agent' | 'attached_existing' | 'opened_existing' | 'created_draft' | null;
  lastEntity: AssistantMemoryEntity | null;
}

// 定义 StartVoiceChat 的 JSON Schema 规则
const startVoiceChatSchema = {
  type: "object",
  properties: {
    AppId: { type: "string", minLength: 1 },
    RoomId: { type: "string", minLength: 1 },
    TaskId: { type: "string", minLength: 1 },
    BusinessId: { type: "string" },
    AgentConfig: {
      type: "object",
      properties: {
        TargetUserId: { type: "array" },
        UserId: { type: "string" },
        WelcomeMessage: { type: "string" },
        IdleTimeout: { type: "integer" },
        Burst: { type: "object" },
        VoicePrint: { type: "object" },
        ServerMessageUrlForRTS: { type: "string" },
        ServerMessageSignatureForRTS: { type: "string" }
      },
      required: ["TargetUserId", "UserId"]
    },
    Config: {
      type: "object",
      properties: {
        ASRConfig: {
          type: "object",
          properties: {
            Provider: { type: "string" },
            ProviderParams: { type: "object" },
            VADConfig: { type: "object" },
            InterruptConfig: { type: "object" },
            TurnDetectionMode: { type: "number" },
            FarfieldConfig: { type: "object" }
          },
          required: ["Provider", "ProviderParams"]
        },
        TTSConfig: {
          type: "object",
          properties: {
            Provider: { type: "string" },
            ProviderParams: { type: "object" },
            IgnoreBracketText: { type: "array" },
            Context: { type: "object" }
          },
          required: ["Provider", "ProviderParams"]
        },
        LLMConfig: {
          type: "object",
          properties: {
            Mode: { type: "string" },
            ModelName: { type: "string" },
            SystemMessages: { type: "array" }
          },
          required: ["Mode"]
        },
        S2SConfig: {
          type: "object",
          properties: {
            Enable: { type: "boolean" },
            Provider: { type: "string" },
            ProviderParams: { type: "object" }
          }
        },
        SubtitleConfig: { type: "object" },
        FunctionCallingConfig: { type: "object" },
        InterruptMode: { type: "integer" },
        AvatarConfig: { type: "object" },
        WebSearchAgentConfig: { type: "object" },
        MemoryConfig: { type: "object" }
      }
    }
  },
  required: ["AppId", "RoomId", "TaskId", "Config", "AgentConfig"],
  additionalProperties: true
};

const ajv = new Ajv();
const validateSchema = ajv.compile(startVoiceChatSchema);
const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '/api';

export interface ApiConfig {
  baseURL: string;
  model: string;
}

export type WorkspaceSection =
  | 'agents'
  | 'orchestration'
  | 'voices'
  | 'knowledge'
  | 'tools'
  | 'skills'
  | 'developer-community'
  | 'ai-dev-tools'
  | 'env-vars'
  | 'volcengine-deploy'
  | 'phone-line-deploy'
  | 'quality-analysis'
  | 'operations-analysis'
  | 'log-analysis'
  | 'latency-analysis'
  | 'usage'
  | 'app-keys'
  | 'business-ids'
  | 'feature-config'
  | 'resource-packages'
  | 'license-management'
  | 'purchase';

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  detailDescription: string;
  botId: string;
  model: string;
  voice: string;
  updatedAt: string;
  configJson: string;
}

export interface VoiceProfile {
  id: string;
  name: string;
  voiceId: string;
  remainingCount: number;
  expireAt: string;
  expired?: boolean;
}

export interface AppKeyItem {
  id: string;
  appId: string;
  name: string;
  status: '已启用' | '草稿';
  updatedAt: string;
}

export interface RuntimeCallInfo {
  appId: string;
  roomId: string;
  userId: string;
  targetUserId: string;
  taskId: string;
  agentUserId: string;
}

export interface ToolItem {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  status: '已启用' | '草稿' | '维护中';
}

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  model: string;
  updatedAt: string;
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  type: string;
  documentCount: number;
  updatedAt: string;
  status: '已启用' | '构建中' | '草稿';
}

type OrchestrationPreset = 'default' | 'blank';
type ViewMode = 'detail' | 'code';
type PersistedWorkspaceState = {
  chatMessages: WorkspaceState['chatMessages'];
  chatInput: WorkspaceState['chatInput'];
  assistantMemory: WorkspaceState['assistantMemory'];
  theme: WorkspaceState['theme'];
  currentSection: WorkspaceState['currentSection'];
  isSidebarCollapsed: WorkspaceState['isSidebarCollapsed'];
  viewMode: WorkspaceState['viewMode'];
  apiConfig: WorkspaceState['apiConfig'];
  agentList: WorkspaceState['agentList'];
  currentAgentId: WorkspaceState['currentAgentId'];
  agentName: WorkspaceState['agentName'];
  agentDescription: WorkspaceState['agentDescription'];
  orchestrationPreset: WorkspaceState['orchestrationPreset'];
  currentJson: WorkspaceState['currentJson'];
  voiceProfiles: WorkspaceState['voiceProfiles'];
  knowledgeBaseList: WorkspaceState['knowledgeBaseList'];
  toolList: WorkspaceState['toolList'];
  skillList: WorkspaceState['skillList'];
  appKeyList: WorkspaceState['appKeyList'];
  resourceList: WorkspaceState['resourceList'];
};

interface WorkspaceState {
  chatMessages: ChatMessage[];
  assistantMemory: AssistantMemory;
  currentJson: string;
  isGenerating: boolean;
  isValid: boolean;
  validationErrors: string[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  setAssistantMemory: (patch: Partial<AssistantMemory>) => void;
  resetAssistantMemory: () => void;
  updateJson: (json: string) => void;
  setGenerating: (status: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  validateCurrentJson: () => void;
  isCalling: boolean;
  currentCallInfo: RuntimeCallInfo | null;
  isMicOn: boolean;
  isVideoOn: boolean;
  theme: 'light' | 'dark';
  apiConfig: ApiConfig;
  toggleCall: (configOverride?: string) => void;
  toggleMic: () => void;
  toggleVideo: () => void;
  toggleTheme: () => void;
  setApiConfig: (config: Partial<ApiConfig>) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAssistantOpen: boolean;
  toggleAssistant: () => void;
  abortController: AbortController | null;
  stopGenerating: () => void;
  callError: string | null;
  chatInput: string;
  setChatInput: (input: string) => void;
  agentName: string;
  setAgentName: (name: string) => void;
  currentAgentId: string | null;
  agentDescription: string;
  setAgentDescription: (description: string) => void;
  orchestrationPreset: OrchestrationPreset;
  currentSection: WorkspaceSection;
  setCurrentSection: (section: WorkspaceSection) => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  agentList: AgentSummary[];
  voiceProfiles: VoiceProfile[];
  knowledgeBaseList: KnowledgeBaseItem[];
  toolList: ToolItem[];
  skillList: SkillItem[];
  appKeyList: AppKeyItem[];
  resourceList: ThirdPartyResourceItem[];
  openAgentEditor: (agent: AgentSummary, preset?: OrchestrationPreset) => void;
  addAgent: (agent: AgentSummary) => void;
  removeAgent: (agentId: string) => void;
  previewAgent: AgentSummary | null;
  setPreviewAgent: (agent: AgentSummary | null) => void;
  addVoiceProfile: (voice: VoiceProfile) => void;
  updateVoiceProfile: (voiceId: string, patch: Partial<VoiceProfile>) => void;
  addKnowledgeBase: (knowledge: KnowledgeBaseItem) => void;
  updateKnowledgeBase: (knowledgeId: string, patch: Partial<KnowledgeBaseItem>) => void;
  deleteKnowledgeBase: (knowledgeId: string) => void;
  addTool: (tool: ToolItem) => void;
  updateTool: (toolId: string, patch: Partial<ToolItem>) => void;
  deleteTool: (toolId: string) => void;
  addSkill: (skill: SkillItem) => void;
  updateSkill: (skillId: string, patch: Partial<SkillItem>) => void;
  deleteSkill: (skillId: string) => void;
  addAppKey: (appKey: AppKeyItem) => void;
  updateAppKey: (appKeyId: string, patch: Partial<AppKeyItem>) => void;
  deleteAppKey: (appKeyId: string) => void;
  addResource: (resource: ThirdPartyResourceItem) => void;
  updateResource: (resourceId: string, patch: Partial<ThirdPartyResourceItem>) => void;
  deleteResource: (resourceId: string) => void;
}

const defaultResourceList = defaultThirdPartyResources;

const DEFAULT_RUNTIME_IDS = {
  appId: "demo_app_id",
  roomId: "demo_room_id",
  taskId: "demo_task_id",
  userId: "demo_agent_user",
  targetUserId: "demo_user",
} as const;

const defaultAppKeyList: AppKeyItem[] = [
  { id: "app-1", appId: "app_10001", name: "正式环境", status: "已启用", updatedAt: "2026-05-14 10:22" },
  { id: "app-2", appId: "app_10002", name: "测试环境", status: "草稿", updatedAt: "2026-05-13 18:40" },
];

type RuntimeDefaultsOptions = {
  appKeys?: AppKeyItem[];
  callInfo?: RuntimeCallInfo | null;
};

function createRandomSuffix(length = 8) {
  return Math.random().toString(36).slice(2, 2 + length);
}

function isRuntimePlaceholderValue(value: unknown, fallback: string) {
  return typeof value !== "string" || !value.trim() || value.trim() === fallback || value.trim().startsWith("demo_");
}

function getValidAppIds(appKeys: AppKeyItem[]) {
  return appKeys.map((item) => item.appId.trim()).filter(Boolean);
}

function resolveRuntimeAppId(appKeys: AppKeyItem[], currentAppId?: string, preferredAppId?: string) {
  const appIds = getValidAppIds(appKeys);
  if (preferredAppId && appIds.includes(preferredAppId)) return preferredAppId;
  if (currentAppId && appIds.includes(currentAppId)) return currentAppId;
  if (appIds.length > 0) return appIds[0];
  if (preferredAppId?.trim()) return preferredAppId.trim();
  if (currentAppId?.trim()) return currentAppId.trim();
  return DEFAULT_RUNTIME_IDS.appId;
}

function normalizeTargetUserId(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "";
  const firstValue = typeof value[0] === "string" ? value[0].trim() : "";
  return isRuntimePlaceholderValue(firstValue, DEFAULT_RUNTIME_IDS.targetUserId) ? "" : firstValue;
}

function createRuntimeCallInfo(appKeys: AppKeyItem[], preferredAppId?: string): RuntimeCallInfo {
  const appId = resolveRuntimeAppId(appKeys, undefined, preferredAppId);
  const timestamp = Date.now().toString(36);
  const roomId = `ConversationalAIRoom_${timestamp}_${createRandomSuffix(6)}`;
  const targetUserId = `user_${createRandomSuffix(8)}`;

  return {
    appId,
    roomId,
    userId: targetUserId,
    targetUserId,
    taskId: `task_${timestamp}_${createRandomSuffix(6)}`,
    agentUserId: `agent_${createRandomSuffix(8)}`,
  };
}

function extractRuntimeCallInfo(config: unknown): RuntimeCallInfo | null {
  let normalizedConfig = config;
  if (typeof normalizedConfig === "string") {
    try {
      normalizedConfig = JSON.parse(normalizedConfig);
    } catch {
      return null;
    }
  }
  if (!normalizedConfig || typeof normalizedConfig !== "object") return null;

  const appId =
    typeof (normalizedConfig as { AppId?: unknown }).AppId === "string"
      ? (normalizedConfig as { AppId: string }).AppId.trim()
      : "";
  const roomId =
    typeof (normalizedConfig as { RoomId?: unknown }).RoomId === "string"
      ? (normalizedConfig as { RoomId: string }).RoomId.trim()
      : "";
  const taskId =
    typeof (normalizedConfig as { TaskId?: unknown }).TaskId === "string"
      ? (normalizedConfig as { TaskId: string }).TaskId.trim()
      : "";
  const agentConfig = (normalizedConfig as { AgentConfig?: unknown }).AgentConfig;
  const agentUserId =
    agentConfig && typeof agentConfig === "object" && typeof (agentConfig as { UserId?: unknown }).UserId === "string"
      ? (agentConfig as { UserId: string }).UserId.trim()
      : "";
  const targetUserId =
    agentConfig && typeof agentConfig === "object"
      ? normalizeTargetUserId((agentConfig as { TargetUserId?: unknown }).TargetUserId)
      : "";

  if (!appId && !roomId && !taskId && !agentUserId && !targetUserId) {
    return null;
  }

  return {
    appId,
    roomId,
    taskId,
    userId: targetUserId,
    targetUserId,
    agentUserId,
  };
}

function withRuntimeDefaults(rawConfig: unknown, options?: RuntimeDefaultsOptions) {
  const appKeys = options?.appKeys ?? defaultAppKeyList;
  const draft =
    rawConfig && typeof rawConfig === "object" ? JSON.parse(JSON.stringify(rawConfig)) : JSON.parse(buildEmptyConfigJson());
  const currentAppId = typeof draft.AppId === "string" ? draft.AppId.trim() : "";
  const resolvedAppId = resolveRuntimeAppId(appKeys, currentAppId, options?.callInfo?.appId);
  const runtimeCallInfo = options?.callInfo ?? createRuntimeCallInfo(appKeys, resolvedAppId);
  const currentRoomId = typeof draft.RoomId === "string" ? draft.RoomId.trim() : "";
  const currentTaskId = typeof draft.TaskId === "string" ? draft.TaskId.trim() : "";

  draft.AppId = resolvedAppId;
  draft.RoomId = isRuntimePlaceholderValue(currentRoomId, DEFAULT_RUNTIME_IDS.roomId) ? runtimeCallInfo.roomId : currentRoomId;
  draft.TaskId = isRuntimePlaceholderValue(currentTaskId, DEFAULT_RUNTIME_IDS.taskId) ? runtimeCallInfo.taskId : currentTaskId;

  draft.AgentConfig = draft.AgentConfig && typeof draft.AgentConfig === "object" ? draft.AgentConfig : {};
  const currentUserId = typeof draft.AgentConfig.UserId === "string" ? draft.AgentConfig.UserId.trim() : "";
  draft.AgentConfig.UserId = isRuntimePlaceholderValue(currentUserId, DEFAULT_RUNTIME_IDS.userId)
    ? runtimeCallInfo.agentUserId
    : currentUserId;
  draft.AgentConfig.TargetUserId = [normalizeTargetUserId(draft.AgentConfig.TargetUserId) || runtimeCallInfo.targetUserId];

  return draft;
}

function ensureRuntimeConfigJson(json: string | undefined, fallbackJson: string, options?: RuntimeDefaultsOptions) {
  try {
    return JSON.stringify(withRuntimeDefaults(JSON.parse(json || fallbackJson), options), null, 2);
  } catch {
    return JSON.stringify(withRuntimeDefaults(JSON.parse(fallbackJson), options), null, 2);
  }
}

export function buildEmptyConfigJson() {
  return JSON.stringify(
    withRuntimeDefaults({
      AppId: "",
      RoomId: "",
      TaskId: "",
      AgentConfig: {
        TargetUserId: [],
        UserId: "",
        WelcomeMessage: "",
      },
      Config: {
        ASRConfig: {
          Provider: "",
          ProviderParams: {
            RecognitionMode: "stream",
            HotWords: [],
          },
          VADConfig: {
            Enable: true,
            Duration: 800,
            EnableSemanticEos: true,
          },
          InterruptConfig: {
            Enable: true,
            Duration: 300,
            Keywords: [],
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
          SystemMessages: [],
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
    null,
    2
  );
}

function getDefaultResource(resources: ThirdPartyResourceItem[], kind: ResourceKind) {
  return resources.find((item) => item.kind === kind && item.status === "已启用")
    ?? resources.find((item) => item.kind === kind)
    ?? null;
}

function buildManagedReference(resource: ThirdPartyResourceItem, extra: Record<string, unknown> = {}) {
  return {
    ManagedResourceId: resource.id,
    ManagedResourceName: resource.name,
    ProviderLabel: resource.providerLabel,
    Endpoint: resource.endpoint,
    CredentialKeys: Object.keys(resource.credentialValues).filter((key) => resource.credentialValues[key]),
    ...extra,
  };
}

export function buildAgentConfigJson(options?: {
  resources?: ThirdPartyResourceItem[];
  appKeys?: AppKeyItem[];
  callInfo?: RuntimeCallInfo | null;
  llmResourceId?: string;
  llmModel?: string;
  llmThinkingMode?: "off" | "on" | "auto";
  llmTemperature?: number;
  llmTopP?: number;
  llmMaxTokens?: number;
  llmHistoryRounds?: number;
  asrResourceId?: string;
  asrModel?: string;
  ttsResourceId?: string;
  ttsVoice?: string;
  prompt?: string;
  welcomeMessage?: string;
}) {
  const resources = options?.resources ?? defaultResourceList;
  const llmResource = findResourceById(resources, options?.llmResourceId) ?? getDefaultResource(resources, "LLM");
  const asrResource = findResourceById(resources, options?.asrResourceId) ?? getDefaultResource(resources, "ASR");
  const ttsResource = findResourceById(resources, options?.ttsResourceId) ?? getDefaultResource(resources, "TTS");
  const base = withRuntimeDefaults(JSON.parse(buildEmptyConfigJson()), {
    appKeys: options?.appKeys,
    callInfo: options?.callInfo,
  });

  base.AgentConfig.TargetUserId = [""];
  base.AgentConfig.WelcomeMessage = options?.welcomeMessage ?? "你好，有什么我可以帮助你的？";

  if (asrResource) {
    base.Config.ASRConfig = {
      Provider: asrResource.providerCode,
      ProviderParams: buildManagedReference(asrResource, {
        ModelName: options?.asrModel ?? asrResource.modelOptions[0]?.value ?? "",
        RecognitionMode: "stream",
        HotWords: [],
      }),
      VADConfig: {
        Enable: true,
        Duration: 800,
        EnableSemanticEos: true,
      },
      InterruptConfig: {
        Enable: true,
        Duration: 300,
        Keywords: [],
      },
    };
  }

  if (ttsResource) {
    base.Config.TTSConfig = {
      Provider: ttsResource.providerCode,
      ProviderParams: buildManagedReference(ttsResource, {
        SynthesisMode: "stream",
        ResourceId: ttsResource.credentialValues.resourceId ?? "",
        audio: {
          voice_type: options?.ttsVoice ?? ttsResource.voiceOptions[0]?.value ?? "",
          speech_rate: 0,
          volume: 0,
          pitch: 0,
        },
      }),
    };
  }

  if (llmResource) {
    base.Config.LLMConfig = {
      Mode: llmResource.mode ?? "",
      Provider: llmResource.providerCode,
      ModelName: options?.llmModel ?? llmResource.modelOptions[0]?.value ?? "",
      SystemMessages: options?.prompt ? [options.prompt] : ["你是一个友好的AI助手"],
      ProviderParams: buildManagedReference(llmResource, {
        ThinkingMode: options?.llmThinkingMode ?? "off",
        Temperature: options?.llmTemperature ?? 1,
        TopP: options?.llmTopP ?? 1,
        MaxTokens: options?.llmMaxTokens ?? 2048,
        HistoryRounds: options?.llmHistoryRounds ?? 10,
      }),
    };
  }

  return JSON.stringify(base, null, 2);
}

const initialJson = buildAgentConfigJson();
const blankInitialJson = buildEmptyConfigJson();

function getVoiceDisplayLabel(resources: ThirdPartyResourceItem[], voiceValue?: string) {
  if (!voiceValue) return "";
  return resources
    .flatMap((resource) => resource.voiceOptions)
    .find((voice) => voice.value === voiceValue)?.label ?? voiceValue;
}

function isAgentCreationRequest(content: string) {
  return /(智能体|agent|助手|机器人)/i.test(content) && /(生成|创建|新建|做一个|给我一个|帮我生成|帮我创建)/i.test(content);
}

function inferGeneratedAgentName(request: string, index: number) {
  const lower = request.toLowerCase();
  if (lower.includes('导购') || lower.includes('门店')) return '门店导购智能体';
  if (lower.includes('客服') || lower.includes('回访')) return '客服回访智能体';
  if (lower.includes('会议') || lower.includes('纪要')) return '会议纪要智能体';
  if (lower.includes('满意度') || lower.includes('调查')) return '满意度调查智能体';
  if (lower.includes('助手')) return '智能助手';
  return `智能体_${index}`;
}

function inferGeneratedAgentDescription(request: string) {
  const lower = request.toLowerCase();
  if (lower.includes('导购') || lower.includes('门店')) return '门店导购';
  if (lower.includes('客服') || lower.includes('回访')) return '客服回访';
  if (lower.includes('会议') || lower.includes('纪要')) return '会议纪要';
  if (lower.includes('满意度') || lower.includes('调查')) return '满意度调查';
  if (lower.includes('陪聊') || lower.includes('陪伴')) return '情感陪伴';
  if (lower.includes('翻译')) return '实时翻译';
  if (lower.includes('助手')) return '智能助手';
  return '自定义智能体';
}

function stripJsonCodeBlock(reply: string) {
  return reply.replace(/```json\s*([\s\S]*?)\s*```/i, '').trim();
}

function extractJsonCodeBlock(reply: string) {
  const match = reply.match(/```json\s*([\s\S]*?)\s*```/i);
  return typeof match?.[1] === 'string' ? match[1].trim() : null;
}

function normalizeAgentDescriptionText(text: string) {
  return text
    .replace(/^已(?:经)?为您生成[^\n。；:：]*[。；:：]?\s*/u, '')
    .replace(/^我已经帮你生成[^\n。；:：]*[。；:：]?\s*/u, '')
    .replace(/^下面是[^\n。；:：]*[。；:：]?\s*/u, '')
    .replace(/^\d+[.、]\s*/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function inferGeneratedAgentDetailDescription(params: {
  reply: string;
  systemPrompt: string;
  welcomeMessage: string;
  request: string;
}) {
  const cleanedReply = normalizeAgentDescriptionText(stripJsonCodeBlock(params.reply));
  if (cleanedReply) {
    const firstParagraph = cleanedReply.split(/\n+/).find((item) => item.trim());
    if (firstParagraph) return firstParagraph.trim();
  }
  if (params.systemPrompt) {
    return params.systemPrompt.trim().slice(0, 120);
  }
  if (params.welcomeMessage) {
    return `适用于${inferGeneratedAgentDescription(params.request)}场景，欢迎语已配置为“${params.welcomeMessage.trim()}”`;
  }
  return '由小助手生成的智能体草稿';
}

function buildGeneratedAgentSummary(params: {
  request: string;
  reply: string;
  json: string;
  resources: ThirdPartyResourceItem[];
  appKeys: AppKeyItem[];
  agentCount: number;
}): AgentSummary | null {
  try {
    const parsed = withRuntimeDefaults(JSON.parse(params.json), { appKeys: params.appKeys });
    const model = typeof parsed?.Config?.LLMConfig?.ModelName === 'string' ? parsed.Config.LLMConfig.ModelName : '';
    const voiceValue =
      typeof parsed?.Config?.TTSConfig?.ProviderParams?.audio?.voice_type === 'string'
        ? parsed.Config.TTSConfig.ProviderParams.audio.voice_type
        : '';
    const explanation = params.reply.replace(/```json\n[\s\S]*?\n```/, '').trim();
    const systemPrompt = Array.isArray(parsed?.Config?.LLMConfig?.SystemMessages)
      ? parsed.Config.LLMConfig.SystemMessages.find((item: unknown) => typeof item === 'string' && item.trim())
      : '';
    const welcomeMessage =
      typeof parsed?.AgentConfig?.WelcomeMessage === 'string' ? parsed.AgentConfig.WelcomeMessage : '';
    const detailDescription = inferGeneratedAgentDetailDescription({
      reply: explanation,
      systemPrompt: typeof systemPrompt === 'string' ? systemPrompt : '',
      welcomeMessage,
      request: params.request,
    });

    return {
      id: `agent-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      name: inferGeneratedAgentName(params.request, params.agentCount + 1),
      description: inferGeneratedAgentDescription(params.request),
      detailDescription,
      botId: `xbot${Math.random().toString(36).slice(2, 10)}`,
      model,
      voice: getVoiceDisplayLabel(params.resources, voiceValue) || voiceValue,
      updatedAt: formatWorkspaceDateTime(),
      configJson: JSON.stringify(parsed, null, 2),
    };
  } catch {
    return null;
  }
}

function formatWorkspaceDateTime() {
  return new Date().toLocaleString("zh-CN", { hour12: false });
}

function getValidationState(json: string) {
  try {
    const parsed = JSON.parse(json);
    const valid = validateSchema(parsed);

    if (valid) {
      return { isValid: true, validationErrors: [] as string[] };
    }

    const errors = validateSchema.errors?.map((err) => {
      if (err.instancePath) {
        return `${err.instancePath.slice(1)}: ${err.message}`;
      }
      if (err.keyword === 'required') {
        return `缺少必填字段: ${err.params.missingProperty}`;
      }
      return err.message || '格式错误';
    }) || [];

    return { isValid: false, validationErrors: errors };
  } catch (e) {
    return { isValid: false, validationErrors: ['JSON 格式错误，请检查语法'] };
  }
}

const SYSTEM_PROMPT = `
你是一个专业的 RTC (Real-Time Communication) 配置助手。
你的任务是根据用户的自然语言输入，帮助用户生成或修改一段 JSON 配置。
当前用户的 JSON 配置如下：
{CURRENT_JSON}

当用户提出需求时：
1. 请分析用户的意图，找出需要修改的 JSON 字段。
2. 给出你修改后的完整 JSON（请将其放在一段名为 \`\`\`json 的代码块中）。
3. 在 JSON 之后，简要用一两句话向用户解释你做了哪些修改。

注意：
- 采样率 (SampleRate) 只能是 [8000, 16000, 32000, 44100, 48000] 之一。
- 降噪 (AnsMode) 是 0, 1, 2, 3，通常 1 表示开启。
- 必须包含 AppId, RoomId, UserId。
- 不要输出除了解释和 JSON 代码块之外的多余内容。
`;

const defaultAgentList: AgentSummary[] = [
  {
    id: 'agent-1',
    name: '情感陪伴',
    description: '活泼少女',
    detailDescription: '面向实时语音互动的通用智能体，已预置大模型、语音识别、语音合成与调试能力。',
    botId: 'xbotW7e-awjX',
    model: 'doubao-1.5-pro-32k-character-250715',
    voice: '晓言·专业女声',
    updatedAt: '2026-05-18 20:36:00',
    configJson: buildAgentConfigJson({
      llmModel: 'doubao-1.5-pro-32k-character-250715',
      ttsVoice: 'zh_female_linjianvhai_moon_bigtts',
      prompt: '你是一位温柔、有边界感、擅长共情和安抚的陪伴型助手，要先理解用户情绪，再给出温暖、自然的回应。',
      welcomeMessage: '你好，我在这里陪你。如果你愿意，可以和我说说今天的心情。'
    })
  },
  {
    id: 'agent-2',
    name: '智能助手',
    description: '撒娇学妹',
    detailDescription: '适合做日常问答与轻陪伴互动，支持自然对话、欢迎语配置和语音调试。',
    botId: 'xbotSeHAMdSAu',
    model: 'doubao-seed-1-6-flash-250828',
    voice: '桃桃·元气少女',
    updatedAt: '2026-05-17 11:18:00',
    configJson: buildAgentConfigJson({
      llmModel: 'doubao-seed-1-6-flash-250828',
      ttsVoice: 'zh_female_taotao_mars_bigtts',
      prompt: '你是一位企业智能助理，回答要准确、简洁、可靠，优先基于知识库和工具结果完成任务。',
      welcomeMessage: '你好，我是你的企业智能助理，可以帮你解答问题和处理任务。'
    })
  },
  {
    id: 'agent-3',
    name: '智能助手',
    description: '撒娇学妹',
    detailDescription: '适合做轻量聊天和实时互动，便于快速开始配置、调试和验证通话链路。',
    botId: 'xbotQi1FDswxA',
    model: 'doubao-seed-1-6-flash-250828',
    voice: '知暖·治愈女声',
    updatedAt: '2026-05-16 09:42:00',
    configJson: buildAgentConfigJson({
      llmModel: 'doubao-seed-1-6-flash-250828',
      ttsVoice: 'zh_female_zhinuan_moon_bigtts',
      prompt: '你是一名通用智能助手，回答应自然、清晰，并优先保持实时互动的连贯性。',
      welcomeMessage: '你好，我已经准备好开始对话了。'
    })
  }
];

const defaultVoiceProfiles: VoiceProfile[] = [
  {
    id: 'voice-1',
    name: '20260303_201414',
    voiceId: 'S_A7gYflSN1',
    remainingCount: 12,
    expireAt: '0001-01-01 00:00:00 到期',
    expired: true
  },
  {
    id: 'voice-2',
    name: '20260427_175453',
    voiceId: 'S_TlUzfo2Z1',
    remainingCount: 15,
    expireAt: '2027-04-07 23:59:59 到期'
  },
  {
    id: 'voice-3',
    name: '20260513_115721',
    voiceId: 'S_F0dJBqD22',
    remainingCount: 14,
    expireAt: '0001-01-01 00:00:00 到期',
    expired: true
  }
];

const defaultToolList: ToolItem[] = [
  {
    id: 'tool-1',
    name: '文档检索 MCP',
    type: 'Knowledge',
    endpoint: 'https://mcp.example.com/retrieval',
    status: '已启用'
  },
  {
    id: 'tool-2',
    name: '天气查询 MCP',
    type: 'API',
    endpoint: 'https://mcp.example.com/weather',
    status: '草稿'
  },
  {
    id: 'tool-3',
    name: '工单系统 MCP',
    type: 'Workflow',
    endpoint: 'https://mcp.example.com/ticket',
    status: '维护中'
  }
];

const defaultKnowledgeBaseList: KnowledgeBaseItem[] = [
  {
    id: 'kb-1',
    name: '产品帮助中心',
    type: 'FAQ',
    documentCount: 28,
    updatedAt: '2026-05-12 15:22',
    status: '已启用'
  },
  {
    id: 'kb-2',
    name: '售后知识库',
    type: 'SOP',
    documentCount: 15,
    updatedAt: '2026-05-13 11:05',
    status: '构建中'
  },
  {
    id: 'kb-3',
    name: '直播运营资料',
    type: 'Doc',
    documentCount: 9,
    updatedAt: '2026-05-14 09:36',
    status: '草稿'
  }
];

const defaultSkillList: SkillItem[] = [
  {
    id: 'skill-1',
    name: '销售话术生成',
    category: '文案',
    model: 'doubao-seed-1-6-flash',
    updatedAt: '2026-05-10 14:26'
  },
  {
    id: 'skill-2',
    name: '意图分类器',
    category: 'NLP',
    model: 'doubao-1.5-pro-32k',
    updatedAt: '2026-05-11 09:40'
  },
  {
    id: 'skill-3',
    name: '售后 SOP',
    category: '流程',
    model: 'doubao-seed-1-8',
    updatedAt: '2026-05-13 20:18'
  }
];

const WORKSPACE_PERSIST_KEY = 'convoai-workspace';
const WORKSPACE_PERSIST_VERSION = 2;

function getVoiceValueByLabel(resources: ThirdPartyResourceItem[], voiceLabel?: string) {
  if (!voiceLabel) return undefined;
  return resources
    .flatMap((resource) => resource.voiceOptions)
    .find((voice) => voice.label === voiceLabel || voice.value === voiceLabel)?.value;
}

function normalizeResourceList(resources: unknown): ThirdPartyResourceItem[] {
  if (!Array.isArray(resources) || resources.length === 0) return defaultResourceList;
  return resources
    .filter((item): item is Partial<ThirdPartyResourceItem> => Boolean(item) && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : `resource-${index + 1}`,
      name: typeof item.name === 'string' && item.name.trim() ? item.name : `资源_${index + 1}`,
      kind: item.kind === 'ASR' || item.kind === 'LLM' || item.kind === 'TTS' ? item.kind : 'LLM',
      providerKey: typeof item.providerKey === 'string' ? item.providerKey : '',
      providerLabel: typeof item.providerLabel === 'string' ? item.providerLabel : '',
      providerCode: typeof item.providerCode === 'string' ? item.providerCode : '',
      mode: typeof item.mode === 'string' ? item.mode : undefined,
      endpoint: typeof item.endpoint === 'string' ? item.endpoint : '',
      status: item.status === '已启用' || item.status === '停用' || item.status === '草稿' ? item.status : '草稿',
      modelOptions: Array.isArray(item.modelOptions) ? item.modelOptions : [],
      voiceOptions: Array.isArray(item.voiceOptions) ? item.voiceOptions : [],
      credentialValues:
        item.credentialValues && typeof item.credentialValues === 'object' ? item.credentialValues as Record<string, string> : {},
      notes: typeof item.notes === 'string' ? item.notes : '',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : formatWorkspaceDateTime(),
    }));
}

function normalizeAgentList(agents: unknown, resources: ThirdPartyResourceItem[], appKeys: AppKeyItem[]): AgentSummary[] {
  if (!Array.isArray(agents) || agents.length === 0) return defaultAgentList;

  return agents
    .filter((item): item is Partial<AgentSummary> => Boolean(item) && typeof item === 'object')
    .map((item, index) => {
      const model = typeof item.model === 'string' ? item.model : '';
      const voice = typeof item.voice === 'string' ? item.voice : '';
      const llmResource = resources.find((resource) => resource.kind === 'LLM' && resource.modelOptions.some((option) => option.value === model));
      const ttsResource = resources.find((resource) =>
        resource.kind === 'TTS' && resource.voiceOptions.some((option) => option.label === voice || option.value === voice)
      );
      const inferredVoiceValue = getVoiceValueByLabel(resources, voice);

      return {
        id: typeof item.id === 'string' && item.id.trim() ? item.id : `agent-${index + 1}`,
        name: typeof item.name === 'string' && item.name.trim() ? item.name : `智能体_${index + 1}`,
        description: typeof item.description === 'string' ? item.description : '自定义智能体',
        detailDescription: typeof item.detailDescription === 'string' ? item.detailDescription : '待补充智能体描述',
        botId: typeof item.botId === 'string' && item.botId.trim() ? item.botId : `xbot${Math.random().toString(36).slice(2, 10)}`,
        model,
        voice,
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : formatWorkspaceDateTime(),
        configJson:
          typeof item.configJson === 'string' && item.configJson.trim()
            ? ensureRuntimeConfigJson(item.configJson, buildAgentConfigJson({
                resources,
                appKeys,
                llmResourceId: llmResource?.id,
                llmModel: model,
                ttsResourceId: ttsResource?.id,
                ttsVoice: inferredVoiceValue,
                prompt: typeof item.detailDescription === 'string' ? item.detailDescription : undefined,
              }), { appKeys })
            : buildAgentConfigJson({
                resources,
                appKeys,
                llmResourceId: llmResource?.id,
                llmModel: model,
                ttsResourceId: ttsResource?.id,
                ttsVoice: inferredVoiceValue,
                prompt: typeof item.detailDescription === 'string' ? item.detailDescription : undefined,
              }),
      };
    });
}

function getSelectedAgent(agentList: AgentSummary[], currentAgentId?: string | null) {
  return agentList.find((agent) => agent.id === currentAgentId) ?? agentList[0] ?? null;
}

export const useWorkspaceStore = create<WorkspaceState>()(persist((set, get) => ({
  chatMessages: [
    {
      id: 'welcome-1',
      role: 'agent',
      content: '你好！我是 StartVoiceChat 配置助手。\n你可以直接用自然语言或语音告诉我你的需求，例如："我想开启一个语音聊天"、"我想开启声纹降噪。"\n或者，你也可以把已有的 JSON 配置粘贴在右侧，我会帮你校验和修改。\n如果遇到启动智能体失败的错误事件或错误码，也可以发给我帮你排查原因哦。'
    }
  ],
  assistantMemory: {
    lastTarget: null,
    lastResolvedRequest: '',
    lastAction: null,
    lastEntity: null,
  },
  currentJson: defaultAgentList[0].configJson,
  isGenerating: false,
  ...getValidationState(defaultAgentList[0].configJson),
  isCalling: false,
  currentCallInfo: extractRuntimeCallInfo(defaultAgentList[0].configJson),
  callError: null,
  chatInput: '',
  setChatInput: (input) => set({ chatInput: input }),
  setAssistantMemory: (patch) =>
    set((state) => ({
      assistantMemory: {
        ...state.assistantMemory,
        ...patch,
      },
    })),
  resetAssistantMemory: () =>
    set({
      assistantMemory: {
        lastTarget: null,
        lastResolvedRequest: '',
        lastAction: null,
        lastEntity: null,
      },
    }),
  agentName: defaultAgentList[0].name,
  setAgentName: (name) =>
    set((state) => ({
      agentName: name,
      agentList: state.currentAgentId
        ? state.agentList.map((agent) =>
            agent.id === state.currentAgentId ? { ...agent, name, updatedAt: formatWorkspaceDateTime() } : agent
          )
        : state.agentList,
    })),
  currentAgentId: defaultAgentList[0].id,
  agentDescription: defaultAgentList[0].detailDescription,
  setAgentDescription: (description) =>
    set((state) => ({
      agentDescription: description,
      agentList: state.currentAgentId
        ? state.agentList.map((agent) =>
            agent.id === state.currentAgentId
              ? { ...agent, detailDescription: description, updatedAt: formatWorkspaceDateTime() }
              : agent
          )
        : state.agentList,
    })),
  orchestrationPreset: 'default',
  currentSection: 'agents',
  setCurrentSection: (section) => set({ currentSection: section }),
  isSidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  agentList: defaultAgentList,
  voiceProfiles: defaultVoiceProfiles,
  knowledgeBaseList: defaultKnowledgeBaseList,
  toolList: defaultToolList,
  skillList: defaultSkillList,
  appKeyList: defaultAppKeyList,
  resourceList: defaultResourceList,
  openAgentEditor: (agent, preset = 'default') => {
    const nextJson =
      preset === 'blank'
        ? ensureRuntimeConfigJson(agent.configJson, blankInitialJson, { appKeys: get().appKeyList })
        : ensureRuntimeConfigJson(agent.configJson, initialJson, { appKeys: get().appKeyList });
    set({
      currentAgentId: agent.id,
      agentName: agent.name,
      agentDescription: agent.detailDescription,
      orchestrationPreset: preset,
      currentJson: nextJson,
      currentCallInfo: extractRuntimeCallInfo(JSON.parse(nextJson)),
      ...getValidationState(nextJson),
      currentSection: 'orchestration'
    });
  },
  addAgent: (agent) =>
    set((state) => {
      const normalizedConfigJson = ensureRuntimeConfigJson(agent.configJson, blankInitialJson, { appKeys: state.appKeyList });
      return {
        agentList: [
          {
            ...agent,
            configJson: normalizedConfigJson,
          },
          ...state.agentList,
        ]
      };
    }),
  removeAgent: (agentId) =>
    set((state) => ({
      agentList: state.agentList.filter((agent) => agent.id !== agentId),
      currentAgentId: state.currentAgentId === agentId ? null : state.currentAgentId,
    })),
  previewAgent: null,
  setPreviewAgent: (agent) => set({ previewAgent: agent }),
  addVoiceProfile: (voice) =>
    set((state) => ({
      voiceProfiles: [voice, ...state.voiceProfiles]
    })),
  updateVoiceProfile: (voiceId, patch) =>
    set((state) => ({
      voiceProfiles: state.voiceProfiles.map((voice) =>
        voice.id === voiceId ? { ...voice, ...patch } : voice
      )
    })),
  addKnowledgeBase: (knowledge) =>
    set((state) => ({
      knowledgeBaseList: [knowledge, ...state.knowledgeBaseList]
    })),
  updateKnowledgeBase: (knowledgeId, patch) =>
    set((state) => ({
      knowledgeBaseList: state.knowledgeBaseList.map((knowledge) =>
        knowledge.id === knowledgeId ? { ...knowledge, ...patch } : knowledge
      )
    })),
  deleteKnowledgeBase: (knowledgeId) =>
    set((state) => ({
      knowledgeBaseList: state.knowledgeBaseList.filter((knowledge) => knowledge.id !== knowledgeId)
    })),
  addTool: (tool) =>
    set((state) => ({
      toolList: [tool, ...state.toolList]
    })),
  updateTool: (toolId, patch) =>
    set((state) => ({
      toolList: state.toolList.map((tool) =>
        tool.id === toolId ? { ...tool, ...patch } : tool
      )
    })),
  deleteTool: (toolId) =>
    set((state) => ({
      toolList: state.toolList.filter((tool) => tool.id !== toolId)
    })),
  addSkill: (skill) =>
    set((state) => ({
      skillList: [skill, ...state.skillList]
    })),
  updateSkill: (skillId, patch) =>
    set((state) => ({
      skillList: state.skillList.map((skill) =>
        skill.id === skillId ? { ...skill, ...patch } : skill
      )
    })),
  deleteSkill: (skillId) =>
    set((state) => ({
      skillList: state.skillList.filter((skill) => skill.id !== skillId)
    })),
  addAppKey: (appKey) =>
    set((state) => ({
      appKeyList: [appKey, ...state.appKeyList]
    })),
  updateAppKey: (appKeyId, patch) =>
    set((state) => ({
      appKeyList: state.appKeyList.map((appKey) =>
        appKey.id === appKeyId ? { ...appKey, ...patch } : appKey
      )
    })),
  deleteAppKey: (appKeyId) =>
    set((state) => ({
      appKeyList: state.appKeyList.filter((appKey) => appKey.id !== appKeyId)
    })),
  addResource: (resource) =>
    set((state) => ({
      resourceList: [resource, ...state.resourceList]
    })),
  updateResource: (resourceId, patch) =>
    set((state) => ({
      resourceList: state.resourceList.map((resource) =>
        resource.id === resourceId ? { ...resource, ...patch } : resource
      )
    })),
  deleteResource: (resourceId) =>
    set((state) => ({
      resourceList: state.resourceList.filter((resource) => resource.id !== resourceId)
    })),
  isMicOn: true,
  isVideoOn: true,
  theme: 'light',
  apiConfig: {
    baseURL: defaultApiBaseUrl,
    model: 'ep-20260520114334-xm6zh'
  },

  setApiConfig: (config) => set((state) => ({ apiConfig: { ...state.apiConfig, ...config } })),

  toggleCall: (configOverride) => {
    const { isCalling, isValid, currentJson, appKeyList } = get();
    if (isCalling) {
      set({ isCalling: false, callError: null });
      return;
    }

    const targetJson = configOverride || currentJson;
    const isTargetValid = configOverride ? true : isValid; // 简单假设 override 的是合法的

    if (!isTargetValid) {
      set({ 
        isCalling: true, 
        callError: JSON.stringify({ EventType: 1, RunStage: "preParamCheck", ErrorInfo: { Errorcode: 1000002, Reason: "JSON 配置格式不合法或缺少必填字段" } }, null, 2) 
      });
      return;
    }

    try {
      const rawTargetConfig = JSON.parse(targetJson);
      const parsed = withRuntimeDefaults(rawTargetConfig, {
        appKeys: appKeyList,
        callInfo: createRuntimeCallInfo(
          appKeyList,
          typeof rawTargetConfig?.AppId === "string" ? rawTargetConfig.AppId : undefined
        ),
      });
      const runtimeCallInfo = extractRuntimeCallInfo(parsed);
      const nextJson = JSON.stringify(parsed, null, 2);
      const sharedCallState = {
        currentCallInfo: runtimeCallInfo,
      };

      if (!configOverride) {
        get().updateJson(nextJson);
      }
      
      // 仅在 TaskId 为特定值时模拟深层的业务报错，以便正常情况下可以展示通话成功的 UI
      if (parsed.TaskId === 'error_appid') {
        set({ 
          isCalling: true, 
          ...sharedCallState,
          callError: JSON.stringify({ EventType: 1, RunStage: "taskStart", ErrorInfo: { Errorcode: 1000001, Reason: "AppId 无效，未授权或未开通服务" } }, null, 2) 
        });
        return;
      }
      
      if (parsed.TaskId === 'error_asr') {
        set({ 
          isCalling: true, 
          ...sharedCallState,
          callError: JSON.stringify({ EventType: 1, RunStage: "asr", ErrorInfo: { Errorcode: 1003001, Reason: "ASR 实例化失败，ProviderParams 参数不完整" } }, null, 2) 
        });
        return;
      }

      if (parsed.TaskId === 'error_tts') {
         // 模拟免费额度耗尽
         set({ 
          isCalling: true, 
          ...sharedCallState,
          callError: JSON.stringify({ EventType: 1, RunStage: "tts", ErrorInfo: { Errorcode: 1005001, Reason: "quota exceeded for types [...]" } }, null, 2) 
        });
        return;
      }

      set({ isCalling: true, callError: null, ...sharedCallState });
      return;

    } catch (e) {
      // 忽略解析错误，由 isValid 控制
    }

    set({ isCalling: true, callError: null, currentCallInfo: extractRuntimeCallInfo(currentJson) });
  },
  toggleMic: () => set((state) => ({ isMicOn: !state.isMicOn })),
  toggleVideo: () => set((state) => ({ isVideoOn: !state.isVideoOn })),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    return { theme: newTheme };
  }),

  viewMode: 'detail',
  setViewMode: (mode) => set({ viewMode: mode }),
  isAssistantOpen: false,
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),

  abortController: null,
  stopGenerating: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null, isGenerating: false });
    }
  },

  addMessage: (message) => 
    set((state) => ({
      chatMessages: [
        ...state.chatMessages, 
        { ...message, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) }
      ]
    })),

  validateCurrentJson: () => {
    const { currentJson } = get();
    set(getValidationState(currentJson));
  },

  updateJson: (json) => {
    let nextAgentPatch: Partial<AgentSummary> | null = null;
    let nextCurrentCallInfo: RuntimeCallInfo | null = null;
    try {
      const parsed = JSON.parse(json);
      nextCurrentCallInfo = extractRuntimeCallInfo(parsed);
      const nextModel = parsed?.Config?.LLMConfig?.ModelName;
      const nextVoiceType = parsed?.Config?.TTSConfig?.ProviderParams?.audio?.voice_type;
      const { resourceList } = get();
      nextAgentPatch = {
        model: nextModel || "",
        voice: getVoiceDisplayLabel(resourceList, nextVoiceType) || nextVoiceType || "",
        configJson: json,
        updatedAt: formatWorkspaceDateTime(),
      };
    } catch {
      nextAgentPatch = null;
    }

    set((state) => ({
      currentJson: json,
      currentCallInfo: nextCurrentCallInfo ?? state.currentCallInfo,
      agentList:
        state.currentAgentId && nextAgentPatch
          ? state.agentList.map((agent) =>
              agent.id === state.currentAgentId ? { ...agent, ...nextAgentPatch } : agent
            )
          : state.agentList,
    }));
    get().validateCurrentJson();
  },
  
  setGenerating: (status) => set({ isGenerating: status }),

  sendMessage: async (content) => {
    const {
      addMessage,
      setGenerating,
      currentJson,
        currentCallInfo,
      updateJson,
      apiConfig,
      chatMessages,
      currentSection,
      currentAgentId,
      agentName,
      toolList,
      skillList,
        appKeyList,
      knowledgeBaseList,
      resourceList,
      agentList,
      addAgent,
      openAgentEditor,
      setViewMode,
    } = get();
    
    addMessage({ role: 'user', content });
    setGenerating(true);

    const abortController = new AbortController();
    set({ abortController });

    try {
      const endpoint = `${apiConfig.baseURL.replace(/\/$/, '')}/chat`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortController.signal,
        body: JSON.stringify({
          content,
          currentJson,
          chatMessages,
          model: apiConfig.model || 'ep-20240508-xxx',
          workspaceContext: {
            currentSection,
            currentAgentId,
            agentName,
            appKeyList: appKeyList.map((appKey) => ({
              id: appKey.id,
              appId: appKey.appId,
              name: appKey.name,
              status: appKey.status,
            })),
            toolList: toolList.map((tool) => ({
              id: tool.id,
              name: tool.name,
              type: tool.type,
              status: tool.status,
            })),
            skillList: skillList.map((skill) => ({
              id: skill.id,
              name: skill.name,
              category: skill.category,
              model: skill.model,
            })),
            knowledgeBaseList: knowledgeBaseList.map((knowledge) => ({
              id: knowledge.id,
              name: knowledge.name,
              type: knowledge.type,
              status: knowledge.status,
            })),
            resourceList: resourceList.map((resource) => ({
              id: resource.id,
              name: resource.name,
              kind: resource.kind,
              status: resource.status,
              providerLabel: resource.providerLabel,
            })),
          },
        })
      });

      const payload = await response.json().catch(() => ({} as { reply?: string; error?: string }));

      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'API 请求失败');
      }

      const reply = typeof payload.reply === 'string' ? payload.reply : '抱歉，我未能生成回复。';
      
      // 提取 JSON 和文本
      const extractedJson = extractJsonCodeBlock(reply);
      let newJson = currentJson;
      let textReply = reply;
      const shouldCreateAgent = Boolean(extractedJson && isAgentCreationRequest(content));

      if (currentSection === 'orchestration' && extractedJson) {
        if (!shouldCreateAgent) {
          try {
            const parsed = withRuntimeDefaults(JSON.parse(extractedJson), {
              appKeys: appKeyList,
              callInfo: currentCallInfo,
            });
            newJson = JSON.stringify(parsed, null, 2);
            textReply = reply.replace(/```json\s*[\s\S]*?\s*```/i, `\`\`\`json\n${newJson}\n\`\`\``);
          } catch (e) {
            console.error("Failed to parse extracted JSON:", e);
          }
        }
      }

      if (!shouldCreateAgent) {
        updateJson(newJson);
      }
      addMessage({ role: 'agent', content: textReply });

      if (shouldCreateAgent && extractedJson) {
        const createdAgent = buildGeneratedAgentSummary({
          request: content,
          reply: textReply,
          json: extractedJson,
          resources: resourceList,
          appKeys: appKeyList,
          agentCount: agentList.length,
        });
        if (createdAgent) {
          addAgent(createdAgent);
          setViewMode('detail');
          openAgentEditor(createdAgent, 'default');
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError' || error.name === 'APIUserAbortError' || error.message?.toLowerCase().includes('aborted')) {
        console.log('Generation aborted by user');
        addMessage({ role: 'agent', content: 'Agent 已停止输出。' });
      } else {
        console.error("OpenAI API Error:", error);
        addMessage({ 
          role: 'agent', 
          content: `API 请求失败: ${error instanceof Error ? error.message : '未知错误'}` 
        });
      }
    } finally {
      set({ abortController: null });
      setGenerating(false);
    }
  }
}), {
  name: WORKSPACE_PERSIST_KEY,
  version: WORKSPACE_PERSIST_VERSION,
  storage: createJSONStorage(() => localStorage),
  partialize: (state): PersistedWorkspaceState => ({
    chatMessages: state.chatMessages,
    chatInput: state.chatInput,
    assistantMemory: state.assistantMemory,
    theme: state.theme,
    currentSection: state.currentSection,
    isSidebarCollapsed: state.isSidebarCollapsed,
    viewMode: state.viewMode,
    apiConfig: state.apiConfig,
    agentList: state.agentList,
    currentAgentId: state.currentAgentId,
    agentName: state.agentName,
    agentDescription: state.agentDescription,
    orchestrationPreset: state.orchestrationPreset,
    currentJson: state.currentJson,
    voiceProfiles: state.voiceProfiles,
    knowledgeBaseList: state.knowledgeBaseList,
    toolList: state.toolList,
    skillList: state.skillList,
    appKeyList: state.appKeyList,
    resourceList: state.resourceList,
  }),
  merge: (persistedState, currentState) => {
    const persisted = (persistedState ?? {}) as Partial<PersistedWorkspaceState>;
    const appKeyList = Array.isArray(persisted.appKeyList) && persisted.appKeyList.length > 0 ? persisted.appKeyList : defaultAppKeyList;
    const resourceList = normalizeResourceList(persisted.resourceList);
    const agentList = normalizeAgentList(persisted.agentList, resourceList, appKeyList);
    const selectedAgent = getSelectedAgent(agentList, persisted.currentAgentId);
    const currentJson =
      typeof persisted.currentJson === 'string' && persisted.currentJson.trim()
        ? ensureRuntimeConfigJson(persisted.currentJson, selectedAgent?.configJson ?? currentState.currentJson, { appKeys: appKeyList })
        : selectedAgent?.configJson ?? currentState.currentJson;
    const validationState = getValidationState(currentJson);

    return {
      ...currentState,
      chatMessages: Array.isArray(persisted.chatMessages) && persisted.chatMessages.length > 0
        ? persisted.chatMessages
        : currentState.chatMessages,
      chatInput: typeof persisted.chatInput === 'string' ? persisted.chatInput : currentState.chatInput,
      assistantMemory: persisted.assistantMemory ?? currentState.assistantMemory,
      theme: persisted.theme ?? currentState.theme,
      currentSection: persisted.currentSection ?? currentState.currentSection,
      isSidebarCollapsed: persisted.isSidebarCollapsed ?? currentState.isSidebarCollapsed,
      viewMode: persisted.viewMode ?? currentState.viewMode,
      apiConfig: persisted.apiConfig ?? currentState.apiConfig,
      agentList,
      currentAgentId: selectedAgent?.id ?? currentState.currentAgentId,
      agentName: selectedAgent?.name ?? currentState.agentName,
      agentDescription: selectedAgent?.detailDescription ?? currentState.agentDescription,
      orchestrationPreset: persisted.orchestrationPreset ?? currentState.orchestrationPreset,
      currentJson,
      voiceProfiles: Array.isArray(persisted.voiceProfiles) ? persisted.voiceProfiles : currentState.voiceProfiles,
      knowledgeBaseList: Array.isArray(persisted.knowledgeBaseList) ? persisted.knowledgeBaseList : currentState.knowledgeBaseList,
      toolList: Array.isArray(persisted.toolList) ? persisted.toolList : currentState.toolList,
      skillList: Array.isArray(persisted.skillList) ? persisted.skillList : currentState.skillList,
      appKeyList,
      resourceList,
      currentCallInfo: extractRuntimeCallInfo(currentJson),
      ...validationState,
    };
  },
}));
