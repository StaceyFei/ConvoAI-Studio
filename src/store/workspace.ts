import { create } from 'zustand';
import Ajv from 'ajv';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
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
}

export interface VoiceProfile {
  id: string;
  name: string;
  voiceId: string;
  remainingCount: number;
  expireAt: string;
  expired?: boolean;
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

interface WorkspaceState {
  chatMessages: ChatMessage[];
  currentJson: string;
  isGenerating: boolean;
  isValid: boolean;
  validationErrors: string[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  updateJson: (json: string) => void;
  setGenerating: (status: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  validateCurrentJson: () => void;
  isCalling: boolean;
  isMicOn: boolean;
  isVideoOn: boolean;
  theme: 'light' | 'dark';
  apiConfig: ApiConfig;
  toggleCall: () => void;
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
  openAgentEditor: (agent: AgentSummary, preset?: OrchestrationPreset) => void;
  addAgent: (agent: AgentSummary) => void;
  removeAgent: (agentId: string) => void;
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
}

const initialJson = `{
  "AppId": "",
  "RoomId": "",
  "TaskId": "",
  "AgentConfig": {
    "TargetUserId": [
      ""
    ],
    "UserId": "",
    "WelcomeMessage": "你好，有什么我可以帮助你的？"
  },
  "Config": {
    "ASRConfig": {
      "Provider": "volcano",
      "ProviderParams": {
        "Mode": "bigmodel",
        "VolcanoASRParameters": "{}",
        "StreamMode": 2
      }
    },
    "TTSConfig": {
      "Provider": "volcano_bidirection",
      "ProviderParams": {
        "ResourceId": "volc.service_type.10029",
        "audio": {
          "voice_type": "zh_female_linjianvhai_moon_bigtts",
          "speech_rate": 0
        }
      }
    },
    "LLMConfig": {
      "Mode": "ArkV3",
      "ModelName": "doubao-seed-1-8-251228",
      "SystemMessages": [
        "你是一个友好的AI助手"
      ]
    }
  }
}`;

const blankInitialJson = `{
  "AppId": "",
  "RoomId": "",
  "TaskId": "",
  "AgentConfig": {
    "TargetUserId": [],
    "UserId": "",
    "WelcomeMessage": ""
  },
  "Config": {
    "ASRConfig": {
      "Provider": "",
      "ProviderParams": {}
    },
    "TTSConfig": {
      "Provider": "",
      "ProviderParams": {}
    },
    "LLMConfig": {
      "Mode": "",
      "ModelName": "",
      "SystemMessages": []
    }
  }
}`;

const voiceLabelMap: Record<string, string> = {
  zh_female_linjianvhai_moon_bigtts: "晓言·专业女声",
  zh_female_zhinuan_moon_bigtts: "知暖·治愈女声",
  zh_female_taotao_mars_bigtts: "桃桃·元气少女",
  supplier_a_aurora_female: "Aurora·客服女声",
  supplier_a_orion_male: "Orion·商务男声",
  supplier_a_luna_female: "Luna·温柔女声",
  multi_ava_bilingual_bigtts: "Ava·中英双语",
  zh_female_xiaoshutong_bigtts: "小书童·亲和童声",
  supplier_b_nova_male: "Nova·年轻男声",
};

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
    updatedAt: '2026-05-18 20:36:00'
  },
  {
    id: 'agent-2',
    name: '智能助手',
    description: '撒娇学妹',
    detailDescription: '适合做日常问答与轻陪伴互动，支持自然对话、欢迎语配置和语音调试。',
    botId: 'xbotSeHAMdSAu',
    model: 'doubao-seed-1-6-flash-250828',
    voice: '桃桃·元气少女',
    updatedAt: '2026-05-17 11:18:00'
  },
  {
    id: 'agent-3',
    name: '智能助手',
    description: '撒娇学妹',
    detailDescription: '适合做轻量聊天和实时互动，便于快速开始配置、调试和验证通话链路。',
    botId: 'xbotQi1FDswxA',
    model: 'doubao-seed-1-6-flash-250828',
    voice: '知暖·治愈女声',
    updatedAt: '2026-05-16 09:42:00'
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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  chatMessages: [
    {
      id: 'welcome-1',
      role: 'agent',
      content: '你好！我是 StartVoiceChat 配置助手。\n你可以直接用自然语言或语音告诉我你的需求，例如："我想开启一个语音聊天"、"我想开启声纹降噪。"\n或者，你也可以把已有的 JSON 配置粘贴在右侧，我会帮你校验和修改。\n如果遇到启动智能体失败的错误事件或错误码，也可以发给我帮你排查原因哦。'
    }
  ],
  currentJson: initialJson,
  isGenerating: false,
  ...getValidationState(initialJson),
  isCalling: false,
  callError: null,
  chatInput: '',
  setChatInput: (input) => set({ chatInput: input }),
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
  openAgentEditor: (agent, preset = 'default') =>
    set({
      currentAgentId: agent.id,
      agentName: agent.name,
      agentDescription: agent.detailDescription,
      orchestrationPreset: preset,
      currentJson: preset === 'blank' ? blankInitialJson : initialJson,
      ...getValidationState(preset === 'blank' ? blankInitialJson : initialJson),
      currentSection: 'orchestration'
    }),
  addAgent: (agent) =>
    set((state) => ({
      agentList: [agent, ...state.agentList]
    })),
  removeAgent: (agentId) =>
    set((state) => ({
      agentList: state.agentList.filter((agent) => agent.id !== agentId)
    })),
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
  isMicOn: true,
  isVideoOn: true,
  theme: 'light',
  apiConfig: {
    baseURL: defaultApiBaseUrl,
    model: 'ep-20260520114334-xm6zh'
  },

  setApiConfig: (config) => set((state) => ({ apiConfig: { ...state.apiConfig, ...config } })),

  toggleCall: () => {
    const { isCalling, isValid, currentJson } = get();
    if (isCalling) {
      set({ isCalling: false, callError: null });
      return;
    }

    if (!isValid) {
      set({ 
        isCalling: true, 
        callError: JSON.stringify({ EventType: 1, RunStage: "preParamCheck", ErrorInfo: { Errorcode: 1000002, Reason: "JSON 配置格式不合法或缺少必填字段" } }, null, 2) 
      });
      return;
    }

    try {
      const parsed = JSON.parse(currentJson);
      
      // 仅在 TaskId 为特定值时模拟深层的业务报错，以便正常情况下可以展示通话成功的 UI
      if (parsed.TaskId === 'error_appid') {
        set({ 
          isCalling: true, 
          callError: JSON.stringify({ EventType: 1, RunStage: "taskStart", ErrorInfo: { Errorcode: 1000001, Reason: "AppId 无效，未授权或未开通服务" } }, null, 2) 
        });
        return;
      }
      
      if (parsed.TaskId === 'error_asr') {
        set({ 
          isCalling: true, 
          callError: JSON.stringify({ EventType: 1, RunStage: "asr", ErrorInfo: { Errorcode: 1003001, Reason: "ASR 实例化失败，ProviderParams 参数不完整" } }, null, 2) 
        });
        return;
      }

      if (parsed.TaskId === 'error_tts') {
         // 模拟免费额度耗尽
         set({ 
          isCalling: true, 
          callError: JSON.stringify({ EventType: 1, RunStage: "tts", ErrorInfo: { Errorcode: 1005001, Reason: "quota exceeded for types [...]" } }, null, 2) 
        });
        return;
      }

    } catch (e) {
      // 忽略解析错误，由 isValid 控制
    }

    set({ isCalling: true, callError: null });
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
    try {
      const parsed = JSON.parse(json);
      const nextModel = parsed?.Config?.LLMConfig?.ModelName;
      const nextVoiceType = parsed?.Config?.TTSConfig?.ProviderParams?.audio?.voice_type;
      nextAgentPatch = {
        model: nextModel || "",
        voice: voiceLabelMap[nextVoiceType] || nextVoiceType || "",
        updatedAt: formatWorkspaceDateTime(),
      };
    } catch {
      nextAgentPatch = null;
    }

    set((state) => ({
      currentJson: json,
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
    const { addMessage, setGenerating, currentJson, updateJson, apiConfig, chatMessages } = get();
    
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
          model: apiConfig.model || 'ep-20240508-xxx'
        })
      });

      const payload = await response.json().catch(() => ({} as { reply?: string; error?: string }));

      if (!response.ok) {
        throw new Error(typeof payload.error === 'string' ? payload.error : 'API 请求失败');
      }

      const reply = typeof payload.reply === 'string' ? payload.reply : '抱歉，我未能生成回复。';
      
      // 提取 JSON 和文本
      const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
      let newJson = currentJson;
      let textReply = reply;

      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          newJson = JSON.stringify(parsed, null, 2);
          textReply = reply.replace(/```json\n[\s\S]*?\n```/, `\`\`\`json\n${newJson}\n\`\`\``);
        } catch (e) {
          console.error("Failed to parse extracted JSON:", e);
        }
      }

      updateJson(newJson);
      addMessage({ role: 'agent', content: textReply });

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
}));
