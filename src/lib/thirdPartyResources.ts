export type ResourceKind = "ASR" | "LLM" | "TTS";
export type ResourceStatus = "已启用" | "草稿" | "停用";
export type ResourceFieldType = "text" | "password" | "url";

export interface ResourceOption {
  label: string;
  value: string;
}

export interface ResourceProviderField {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
  type?: ResourceFieldType;
  description?: string;
}

export interface ResourceProviderTemplate {
  key: string;
  kind: ResourceKind;
  label: string;
  providerCode: string;
  mode?: string;
  endpointPlaceholder: string;
  description: string;
  fields: ResourceProviderField[];
  defaultModels?: ResourceOption[];
  defaultVoices?: ResourceOption[];
}

export interface ThirdPartyResourceItem {
  id: string;
  name: string;
  kind: ResourceKind;
  providerKey: string;
  providerLabel: string;
  providerCode: string;
  mode?: string;
  endpoint: string;
  status: ResourceStatus;
  modelOptions: ResourceOption[];
  voiceOptions: ResourceOption[];
  credentialValues: Record<string, string>;
  notes?: string;
  updatedAt: string;
}

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  ASR: "语音识别",
  LLM: "大模型",
  TTS: "语音合成",
};

export const RESOURCE_PROVIDER_TEMPLATES: ResourceProviderTemplate[] = [
  {
    key: "volc-llm",
    kind: "LLM",
    label: "火山引擎方舟",
    providerCode: "ark",
    mode: "ArkV3",
    endpointPlaceholder: "https://ark.cn-beijing.volces.com/api/v3",
    description: "适合接入豆包、DeepSeek 等方舟托管模型。",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "填写方舟 API Key", required: true, type: "password" },
      { key: "resourceId", label: "接入点 ID", placeholder: "如 ep-xxxxxxxx", required: true },
      { key: "region", label: "Region", placeholder: "如 cn-beijing", required: false },
    ],
    defaultModels: [
      { label: "doubao-seed-1-8-251228", value: "doubao-seed-1-8-251228" },
      { label: "doubao-seed-1-6-flash-250828", value: "doubao-seed-1-6-flash-250828" },
      { label: "doubao-1.5-pro-32k-character-250715", value: "doubao-1.5-pro-32k-character-250715" },
    ],
  },
  {
    key: "openai-compatible",
    kind: "LLM",
    label: "OpenAI Compatible",
    providerCode: "openai_compatible",
    mode: "OpenAICompatible",
    endpointPlaceholder: "https://api.openai.com/v1",
    description: "适合接入 OpenAI、DeepSeek、月之暗面等 OpenAI 兼容接口。",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "填写供应商 API Key", required: true, type: "password" },
      { key: "organization", label: "Organization", placeholder: "可选，按供应商要求填写", required: false },
      { key: "token", label: "Token", placeholder: "如需二次鉴权可填写", required: false, type: "password" },
    ],
    defaultModels: [
      { label: "gpt-4o-mini", value: "gpt-4o-mini" },
      { label: "deepseek-chat", value: "deepseek-chat" },
      { label: "deepseek-reasoner", value: "deepseek-reasoner" },
    ],
  },
  {
    key: "anthropic-llm",
    kind: "LLM",
    label: "Anthropic Claude",
    providerCode: "anthropic",
    mode: "Anthropic",
    endpointPlaceholder: "https://api.anthropic.com/v1",
    description: "适合接入 Claude 系列模型。",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "填写 Claude API Key", required: true, type: "password" },
      { key: "version", label: "API Version", placeholder: "如 2023-06-01", required: true },
      { key: "workspace", label: "Workspace", placeholder: "如存在工作区隔离可填写", required: false },
    ],
    defaultModels: [
      { label: "claude-3-5-sonnet", value: "claude-3-5-sonnet" },
      { label: "claude-3-5-haiku", value: "claude-3-5-haiku" },
    ],
  },
  {
    key: "volc-asr",
    kind: "ASR",
    label: "火山引擎 ASR",
    providerCode: "volcano",
    endpointPlaceholder: "wss://openspeech.bytedance.com/api/v2/asr",
    description: "支持流式语音识别与双向流式优化版。",
    fields: [
      { key: "appId", label: "App ID", placeholder: "填写火山引擎 App ID", required: true },
      { key: "accessToken", label: "Access Token", placeholder: "填写 Access Token", required: true, type: "password" },
      { key: "cluster", label: "Cluster", placeholder: "如 volcano_asr", required: true },
    ],
    defaultModels: [
      { label: "bigmodel-stream", value: "bigmodel-stream" },
      { label: "bigmodel-duplex", value: "bigmodel-duplex" },
      { label: "offline-general", value: "offline-general" },
    ],
  },
  {
    key: "aliyun-asr",
    kind: "ASR",
    label: "阿里云智能语音交互",
    providerCode: "aliyun_asr",
    endpointPlaceholder: "wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1",
    description: "适合接入阿里云实时语音识别。",
    fields: [
      { key: "appKey", label: "App Key", placeholder: "填写阿里云 App Key", required: true },
      { key: "token", label: "Token", placeholder: "填写临时 Token", required: true, type: "password" },
      { key: "sampleRate", label: "采样率", placeholder: "如 16000", required: true },
    ],
    defaultModels: [
      { label: "paraformer-realtime-v2", value: "paraformer-realtime-v2" },
      { label: "paraformer-8k", value: "paraformer-8k" },
    ],
  },
  {
    key: "tencent-asr",
    kind: "ASR",
    label: "腾讯云实时语音识别",
    providerCode: "tencent_asr",
    endpointPlaceholder: "https://asr.tencentcloudapi.com",
    description: "适合接入腾讯云实时语音识别。",
    fields: [
      { key: "secretId", label: "SecretId", placeholder: "填写 SecretId", required: true },
      { key: "secretKey", label: "SecretKey", placeholder: "填写 SecretKey", required: true, type: "password" },
      { key: "engineModelType", label: "引擎模型", placeholder: "如 16k_zh", required: true },
    ],
    defaultModels: [
      { label: "16k_zh", value: "16k_zh" },
      { label: "16k_en", value: "16k_en" },
      { label: "8k_zh", value: "8k_zh" },
    ],
  },
  {
    key: "volc-tts",
    kind: "TTS",
    label: "火山引擎 TTS",
    providerCode: "volcano_bidirection",
    endpointPlaceholder: "https://openspeech.bytedance.com/api/v1/tts",
    description: "支持大模型语音合成与火山引擎官方音色。",
    fields: [
      { key: "appId", label: "App ID", placeholder: "填写火山引擎 App ID", required: true },
      { key: "accessToken", label: "Access Token", placeholder: "填写 Access Token", required: true, type: "password" },
      { key: "resourceId", label: "Resource ID", placeholder: "如 volc.service_type.10029", required: true },
    ],
    defaultVoices: [
      { label: "晓言·专业女声", value: "zh_female_linjianvhai_moon_bigtts" },
      { label: "知暖·治愈女声", value: "zh_female_zhinuan_moon_bigtts" },
      { label: "桃桃·元气少女", value: "zh_female_taotao_mars_bigtts" },
    ],
  },
  {
    key: "aliyun-tts",
    kind: "TTS",
    label: "阿里云语音合成",
    providerCode: "aliyun_tts",
    endpointPlaceholder: "https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts",
    description: "适合接入阿里云通义 / CosyVoice 语音合成。",
    fields: [
      { key: "appKey", label: "App Key", placeholder: "填写阿里云 App Key", required: true },
      { key: "token", label: "Token", placeholder: "填写临时 Token", required: true, type: "password" },
      { key: "format", label: "音频格式", placeholder: "如 mp3 / pcm", required: true },
    ],
    defaultVoices: [
      { label: "知薇", value: "zhixiaoxia" },
      { label: "艾夏", value: "aixia" },
      { label: "知猫", value: "zhimao" },
    ],
  },
  {
    key: "azure-tts",
    kind: "TTS",
    label: "Azure Speech",
    providerCode: "azure_tts",
    endpointPlaceholder: "https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
    description: "适合接入 Azure Speech 合成能力。",
    fields: [
      { key: "speechKey", label: "Speech Key", placeholder: "填写 Speech Key", required: true, type: "password" },
      { key: "region", label: "Region", placeholder: "如 eastasia", required: true },
      { key: "deployment", label: "Deployment", placeholder: "可选，自定义部署名", required: false },
    ],
    defaultVoices: [
      { label: "XiaoxiaoNeural", value: "zh-CN-XiaoxiaoNeural" },
      { label: "YunxiNeural", value: "zh-CN-YunxiNeural" },
      { label: "JennyNeural", value: "en-US-JennyNeural" },
    ],
  },
];

export const defaultThirdPartyResources: ThirdPartyResourceItem[] = [
  {
    id: "res-llm-1",
    name: "豆包生产推理",
    kind: "LLM",
    providerKey: "volc-llm",
    providerLabel: "火山引擎方舟",
    providerCode: "ark",
    mode: "ArkV3",
    endpoint: "https://ark.cn-beijing.volces.com/api/v3",
    status: "已启用",
    modelOptions: [
      { label: "doubao-seed-1-8-251228", value: "doubao-seed-1-8-251228" },
      { label: "doubao-seed-1-6-flash-250828", value: "doubao-seed-1-6-flash-250828" },
      { label: "doubao-1.5-pro-32k-character-250715", value: "doubao-1.5-pro-32k-character-250715" },
    ],
    voiceOptions: [],
    credentialValues: {
      apiKey: "********",
      resourceId: "ep-20260520114334-xm6zh",
      region: "cn-beijing",
    },
    notes: "主生产环境默认使用的豆包接入点。",
    updatedAt: "2026-05-20 14:22",
  },
  {
    id: "res-llm-2",
    name: "DeepSeek 兼容通道",
    kind: "LLM",
    providerKey: "openai-compatible",
    providerLabel: "OpenAI Compatible",
    providerCode: "openai_compatible",
    mode: "OpenAICompatible",
    endpoint: "https://api.deepseek.com/v1",
    status: "草稿",
    modelOptions: [
      { label: "deepseek-chat", value: "deepseek-chat" },
      { label: "deepseek-reasoner", value: "deepseek-reasoner" },
    ],
    voiceOptions: [],
    credentialValues: {
      apiKey: "********",
      organization: "",
      token: "",
    },
    notes: "预留给高推理成本场景切换使用。",
    updatedAt: "2026-05-19 20:06",
  },
  {
    id: "res-asr-1",
    name: "火山流式识别",
    kind: "ASR",
    providerKey: "volc-asr",
    providerLabel: "火山引擎 ASR",
    providerCode: "volcano",
    endpoint: "wss://openspeech.bytedance.com/api/v2/asr",
    status: "已启用",
    modelOptions: [
      { label: "bigmodel-stream", value: "bigmodel-stream" },
      { label: "bigmodel-duplex", value: "bigmodel-duplex" },
    ],
    voiceOptions: [],
    credentialValues: {
      appId: "volc-app-prod",
      accessToken: "********",
      cluster: "volcano_asr",
    },
    notes: "默认用于通用中文流式识别。",
    updatedAt: "2026-05-18 16:40",
  },
  {
    id: "res-asr-2",
    name: "腾讯热线识别",
    kind: "ASR",
    providerKey: "tencent-asr",
    providerLabel: "腾讯云实时语音识别",
    providerCode: "tencent_asr",
    endpoint: "https://asr.tencentcloudapi.com",
    status: "草稿",
    modelOptions: [
      { label: "16k_zh", value: "16k_zh" },
      { label: "8k_zh", value: "8k_zh" },
    ],
    voiceOptions: [],
    credentialValues: {
      secretId: "AKID********",
      secretKey: "********",
      engineModelType: "16k_zh",
    },
    notes: "预留给电话场景的 8k/16k 识别。",
    updatedAt: "2026-05-17 09:18",
  },
  {
    id: "res-tts-1",
    name: "火山官方音色",
    kind: "TTS",
    providerKey: "volc-tts",
    providerLabel: "火山引擎 TTS",
    providerCode: "volcano_bidirection",
    endpoint: "https://openspeech.bytedance.com/api/v1/tts",
    status: "已启用",
    modelOptions: [],
    voiceOptions: [
      { label: "晓言·专业女声", value: "zh_female_linjianvhai_moon_bigtts" },
      { label: "知暖·治愈女声", value: "zh_female_zhinuan_moon_bigtts" },
      { label: "桃桃·元气少女", value: "zh_female_taotao_mars_bigtts" },
    ],
    credentialValues: {
      appId: "volc-app-prod",
      accessToken: "********",
      resourceId: "volc.service_type.10029",
    },
    notes: "默认合成资源，覆盖通用陪伴类场景。",
    updatedAt: "2026-05-20 10:32",
  },
  {
    id: "res-tts-2",
    name: "Azure 多语音色",
    kind: "TTS",
    providerKey: "azure-tts",
    providerLabel: "Azure Speech",
    providerCode: "azure_tts",
    endpoint: "https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1",
    status: "草稿",
    modelOptions: [],
    voiceOptions: [
      { label: "XiaoxiaoNeural", value: "zh-CN-XiaoxiaoNeural" },
      { label: "JennyNeural", value: "en-US-JennyNeural" },
    ],
    credentialValues: {
      speechKey: "********",
      region: "eastasia",
      deployment: "",
    },
    notes: "用于跨语言客服和海外演示场景。",
    updatedAt: "2026-05-16 18:02",
  },
];

export function getResourceProviderTemplate(providerKey: string) {
  return RESOURCE_PROVIDER_TEMPLATES.find((item) => item.key === providerKey);
}

export function getTemplatesByKind(kind: ResourceKind) {
  return RESOURCE_PROVIDER_TEMPLATES.filter((item) => item.kind === kind);
}

export function parseOptionLines(text: string): ResourceOption[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((item) => item.trim()).filter(Boolean);
      if (parts.length >= 2) {
        return { label: parts[0], value: parts.slice(1).join("|") };
      }
      return { label: line, value: line };
    });
}

export function formatOptionLines(options: ResourceOption[]): string {
  return options
    .map((item) => (item.label === item.value ? item.label : `${item.label} | ${item.value}`))
    .join("\n");
}

export function findResourceById(resources: ThirdPartyResourceItem[], id?: string) {
  if (!id) return null;
  return resources.find((item) => item.id === id) ?? null;
}

export function maskCredentialValue(value: string) {
  if (!value) return "未填写";
  if (value.includes("*")) return value;
  if (value.length <= 6) return "******";
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}
