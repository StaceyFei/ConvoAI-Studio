import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  ArrowLeftRight,
  ArrowUp,
  AudioLines,
  BarChart3,
  BadgeInfo,
  Bot,
  BotMessageSquare,
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Check,
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  EyeOff,
  GitBranch,
  Loader2,
  Moon,
  Package,
  Pencil,
  PhoneCall,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import Workspace from "@/components/Workspace";
import {
  type AssistantTarget,
  type AgentSummary,
  type AppBusinessItem,
  type AppKeyItem,
  type KnowledgeBaseItem,
  type SkillItem,
  type ToolItem,
  type WorkspaceSection,
  buildAgentConfigJson,
  buildEmptyConfigJson,
  useWorkspaceStore,
} from "@/store/workspace";
import {
  type ResourceKind,
  type ThirdPartyResourceItem,
  RESOURCE_KIND_LABEL,
  formatOptionLines,
  getResourceProviderTemplate,
  getTemplatesByKind,
  maskCredentialValue,
  parseOptionLines,
} from "@/lib/thirdPartyResources";
import { FEATURE_CONFIG_TABS, type FeatureConfigTabKey } from "@/lib/featureConfigs";

type NavItem = {
  type: "item";
  key: WorkspaceSection;
  label: string;
  icon: typeof Bot;
  description: string;
};

type NavGroup = {
  type: "group";
  key: "agent-studio" | "development" | "observability" | "settings";
  label: string;
  description: string;
  children: Array<{
    key: WorkspaceSection;
    label: string;
    description: string;
    icon: typeof Bot;
  }>;
};

type LicenseItem = {
  id: string;
  name: string;
  licenseKey: string;
  version: "基础版" | "旗舰版";
  bindAppId: string;
  bindStatus: "已绑定" | "未绑定";
  bindAt: string;
  activationStatus: "已激活" | "未激活";
  activatedAt: string;
  validDays: string;
  validUntil: string;
};

type AssistantDraftMessage = {
  id: string;
  role: "user" | "agent";
  content: string;
};

type ToolFormState = {
  id?: string;
  name: string;
  type: string;
  endpoint: string;
  status: ToolItem["status"];
};

type SkillFormState = {
  id?: string;
  name: string;
  category: string;
  model: string;
};

type ResourceFormState = {
  id?: string;
  name: string;
  kind: ResourceKind;
  providerKey: string;
  endpoint: string;
  status: ThirdPartyResourceItem["status"];
  modelLines: string;
  voiceLines: string;
  notes: string;
  credentialValues: Record<string, string>;
};

type ResourceFilter = "全部" | ResourceKind;

type AgentCreateMode = "template" | "custom";

type DeleteDialogState = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

type CreateAppDialogState = {
  open: boolean;
  name: string;
};

type CreateBusinessDialogState = {
  appId: string;
  appName: string;
  name: string;
  businessId: string;
} | null;

type EditAppDialogState = {
  id: string;
  name: string;
} | null;

type EditBusinessDialogState = {
  appId: string;
  appName: string;
  businessItemId: string;
  name: string;
  businessId: string;
} | null;

type AgentTemplate = {
  id: string;
  name: string;
  summary: string;
  scene: string;
  description: string;
  model: string;
  voice: string;
  prompt: string;
  welcomeMessage: string;
  features: string[];
  tools: string[];
  skills: string[];
};

const agentTemplates: AgentTemplate[] = [
  {
    id: "smart-assistant",
    name: "智能助手",
    summary: "通用问答与任务协同",
    scene: "企业知识问答、任务协同、办公助理",
    description: "适合做企业知识问答、任务协同和日常助理，支持多轮对话与通用任务处理。",
    model: "doubao-seed-1-6-flash-250828",
    voice: "晓言·专业女声",
    prompt: "你是一名企业智能助理，回答要准确、简洁、可靠，优先基于企业知识库和工具结果完成问题解答与任务协同。",
    welcomeMessage: "你好，我是你的企业智能助理，可以帮你解答问题和处理任务。",
    features: ["云端录制", "RTS 实时消息"],
    tools: ["知识检索 MCP", "工单系统 MCP"],
    skills: ["意图分类 Skill", "摘要生成 Skill"],
  },
  {
    id: "cute-doll",
    name: "可爱玩偶",
    summary: "更偏拟人陪聊与互动表达",
    scene: "陪玩互动、IP 角色问答、直播互动",
    description: "适合做陪玩、轻互动和 IP 角色问答，对话语气更轻松，适合直播和娱乐化场景。",
    model: "doubao-1.5-pro-32k-character-250715",
    voice: "桃桃·元气少女",
    prompt: "你是一位可爱、活泼、善于互动的玩偶角色，语气轻松俏皮，适合陪聊、互动问答和直播场景。",
    welcomeMessage: "嗨，我来陪你玩啦，今天想聊点什么？",
    features: ["声纹降噪", "多人声纹识别"],
    tools: ["表情动作控制 MCP"],
    skills: ["话术生成 Skill", "情绪识别 Skill"],
  },
  {
    id: "emotional-companion",
    name: "情感陪伴",
    summary: "重视情绪理解与安抚反馈",
    scene: "夜聊树洞、陪伴对话、情绪安抚",
    description: "适合夜聊、树洞和情绪陪伴类场景，强调共情回复、安抚策略和长期陪伴体验。",
    model: "doubao-1.5-pro-32k-character-250715",
    voice: "知暖·治愈女声",
    prompt: "你是一位温柔、有边界感、擅长共情和安抚的陪伴型助手，要先理解用户情绪，再给出温暖、自然的回应。",
    welcomeMessage: "你好，我在这里陪你。如果你愿意，可以和我说说今天的心情。",
    features: ["声纹降噪", "云端录制"],
    tools: ["用户画像 MCP"],
    skills: ["情绪识别 Skill", "回复建议 Skill"],
  },
  {
    id: "translator",
    name: "翻译助手",
    summary: "实时翻译与术语理解",
    scene: "国际会议、跨语言客服、面对面翻译",
    description: "适合国际会议、跨语言客服和面对面翻译，支持快速识别、翻译和术语上下文保持。",
    model: "doubao-seed-1-6-flash-250828",
    voice: "Ava·中英双语",
    prompt: "你是一名专业双语翻译助手，要求翻译准确、自然、保留术语一致性，并可在必要时给出简短解释。",
    welcomeMessage: "你好，我可以帮你进行中英双语实时翻译。",
    features: ["RTS 实时消息", "硬件场景接入"],
    tools: ["术语库 MCP", "会议纪要 MCP"],
    skills: ["多语翻译 Skill", "术语纠偏 Skill"],
  },
  {
    id: "kids-encyclopedia",
    name: "儿童百科",
    summary: "偏启蒙教育与百科讲解",
    scene: "儿童问答、故事讲解、启蒙教学",
    description: "适合儿童问答、故事讲解和启蒙教学，回复更具解释性，也更注重安全和年龄友好。",
    model: "doubao-1.5-pro-32k",
    voice: "小书童·亲和童声",
    prompt: "你是一位面向儿童的百科老师，表达要友好、易懂、安全，尽量用孩子能理解的方式解释知识点。",
    welcomeMessage: "小朋友你好呀，今天想和我一起认识什么新知识呢？",
    features: ["多人声纹识别", "云端录制"],
    tools: ["知识检索 MCP", "课程编排 MCP"],
    skills: ["内容审核 Skill", "分龄讲解 Skill"],
  },
];

const modelProviderDisplayMap: Array<{ match: (model: string) => boolean; label: string }> = [
  { match: (model) => model.startsWith("doubao-"), label: "豆包大模型" },
  { match: (model) => model.startsWith("supplier-a-"), label: "供应商A" },
  { match: (model) => model.startsWith("supplier-b-"), label: "供应商B" },
];

const voiceProviderDisplayMap: Array<{ voices: string[]; label: string }> = [
  { label: "火山引擎", voices: ["晓言·专业女声", "知暖·治愈女声", "桃桃·元气少女"] },
  { label: "供应商A", voices: ["Aurora·客服女声", "Orion·商务男声", "Luna·温柔女声"] },
  { label: "供应商B", voices: ["Ava·中英双语", "小书童·亲和童声", "Nova·年轻男声"] },
];

const formatModelLabel = (model: string) => {
  const provider = modelProviderDisplayMap.find((item) => item.match(model))?.label;
  return provider ? `${provider} / ${model}` : model;
};

const formatVoiceLabel = (voice: string) => {
  const provider = voiceProviderDisplayMap.find((item) => item.voices.includes(voice))?.label;
  return provider ? `${provider} / ${voice}` : voice;
};

const createResourceFormState = (
  kind: ResourceKind = "LLM",
  resource?: ThirdPartyResourceItem
): ResourceFormState => {
  const defaultTemplate = getTemplatesByKind(resource?.kind ?? kind)[0];
  const template = resource ? getResourceProviderTemplate(resource.providerKey) ?? defaultTemplate : defaultTemplate;

  return {
    id: resource?.id,
    name: resource?.name ?? "",
    kind: resource?.kind ?? kind,
    providerKey: resource?.providerKey ?? defaultTemplate?.key ?? "",
    endpoint: resource?.endpoint ?? template?.endpointPlaceholder ?? "",
    status: resource?.status ?? "草稿",
    modelLines: resource ? formatOptionLines(resource.modelOptions) : formatOptionLines(template?.defaultModels ?? []),
    voiceLines: resource ? formatOptionLines(resource.voiceOptions) : formatOptionLines(template?.defaultVoices ?? []),
    notes: resource?.notes ?? "",
    credentialValues: resource?.credentialValues ?? Object.fromEntries((template?.fields ?? []).map((field) => [field.key, ""])),
  };
};

const navItems: Array<NavItem | NavGroup> = [
  {
    type: "group",
    key: "agent-studio",
    label: "Agent Builder",
    description: "智能体工作区",
    children: [
      { key: "agents", label: "我的智能体", description: "展示智能体列表", icon: Bot },
      { key: "knowledge", label: "我的知识库", description: "管理知识文档与索引", icon: BookOpen },
      { key: "tools", label: "我的Tools", description: "维护各类 MCP", icon: Boxes },
      { key: "skills", label: "我的Skills", description: "维护自定义 Skill", icon: Sparkles },
      { key: "voices", label: "我的复刻声音", description: "管理购买与训练音色", icon: AudioLines },
      { key: "developer-community", label: "社区", description: "上传或下载社区 MCP 与 Skills", icon: Users },
    ],
  },
  {
    type: "group",
    key: "development",
    label: "开发部署",
    description: "开发接入与部署发布",
    children: [
      { key: "ai-dev-tools", label: "集成到AI开发工具", description: "接入 IDE 与开发工具", icon: GitBranch },
      { key: "env-vars", label: "环境变量", description: "维护接入环境变量配置", icon: Settings2 },
      { key: "volcengine-deploy", label: "一键部署到火山引擎", description: "快速部署到火山引擎", icon: Upload },
      { key: "phone-line-deploy", label: "部署到电话线路", description: "接入呼入呼出电话线路", icon: PhoneCall },
    ],
  },
  {
    type: "group",
    key: "observability",
    label: "观测诊断",
    description: "质量、延时与用量分析",
    children: [
      { key: "latency-analysis", label: "延时分析", description: "查看链路延时拆解", icon: BarChart3 },
      { key: "quality-analysis", label: "质量分析", description: "查看质量分布与波动", icon: ShieldCheck },
      { key: "operations-analysis", label: "运营分析", description: "分析应用、智能体与活跃用户趋势", icon: ArrowLeftRight },
      { key: "log-analysis", label: "日志分析", description: "查看会话与错误日志", icon: BadgeInfo },
      { key: "usage", label: "用量统计", description: "按 AppID 和智能体统计", icon: Download },
    ],
  },
  {
    type: "group",
    key: "settings",
    label: "设置",
    description: "维护平台接入与资源配置",
    children: [
      { key: "app-keys", label: "应用管理", description: "维护应用、AppKey、业务标识与服务开通", icon: Copy },
      { key: "resource-packages", label: "三方资源管理", description: "维护三方资源接入与配额信息", icon: Package },
    ],
  },
];

const sectionCopy: Record<
  Exclude<WorkspaceSection, "orchestration">,
  { title: string; description: string; actionLabel: string }
> = {
  agents: {
    title: "我的智能体",
    description: "管理已创建的智能体，点击卡片或“修改配置”即可进入编排和调试页面。",
    actionLabel: "创建智能体",
  },
  voices: {
    title: "我的复刻声音",
    description: "查看已购买和训练的复刻音色，并继续发起声音复刻。",
    actionLabel: "复刻音色",
  },
  knowledge: {
    title: "我的知识库",
    description: "统一维护知识文档、索引构建和召回状态，支持知识的增删改查与管理。",
    actionLabel: "创建知识库",
  },
  "ai-dev-tools": {
    title: "集成到AI开发工具",
    description: "管理 IDE、插件和开发工具接入方式，帮助快速把 Agent 能力集成到研发流程中。",
    actionLabel: "新增集成方式",
  },
  "env-vars": {
    title: "环境变量",
    description: "集中维护开发、测试、生产环境下的变量配置和接入信息。",
    actionLabel: "新增环境变量",
  },
  "volcengine-deploy": {
    title: "一键部署到火山引擎",
    description: "管理部署目标、实例规格和发布配置，支持快速发布到火山引擎。",
    actionLabel: "新建部署任务",
  },
  "phone-line-deploy": {
    title: "部署到电话线路",
    description: "管理 SIP 线路、外呼流程和语音机器人接入配置，支持快速接入电话场景。",
    actionLabel: "新增电话线路",
  },
  usage: {
    title: "用量统计",
    description: "按 AppID / 智能体 ID 维度查看用量数据，并可按时间区间筛选。",
    actionLabel: "导出报表",
  },
  "quality-analysis": {
    title: "质量分析",
    description: "查看音视频互动中的质量趋势、异常分布和核心质量指标。",
    actionLabel: "导出质量报告",
  },
  "operations-analysis": {
    title: "运营分析",
    description: "分析应用、智能体、通话次数与活跃用户等核心运营指标，辅助判断增长和使用趋势。",
    actionLabel: "导出运营报告",
  },
  "log-analysis": {
    title: "日志分析",
    description: "查看会话日志、错误日志和关键链路事件，支持问题定位与排查。",
    actionLabel: "导出日志",
  },
  "latency-analysis": {
    title: "延时分析",
    description: "查看链路中的首包、识别、合成与播报延时拆解。",
    actionLabel: "导出延时报告",
  },
  "app-keys": {
    title: "应用管理",
    description: "统一维护应用名称、AppID、主副 AppKey、业务标识、临时 Token 与服务开通配置。",
    actionLabel: "创建应用",
  },
  "business-ids": {
    title: "业务标识",
    description: "维护不同业务场景的 BusinessId，支持多业务隔离与调试。",
    actionLabel: "新增业务标识",
  },
  "feature-config": {
    title: "服务开通",
    description: "集中维护各类服务能力开通项和默认策略，方便统一开通与管理。",
    actionLabel: "保存配置",
  },
  "resource-packages": {
    title: "三方资源管理",
    description: "维护三方资源的接入信息、额度余量和生效状态，支持统一查看与管理。",
    actionLabel: "创建资源",
  },
  "license-management": {
    title: "License统计",
    description: "查看 License 的版本分布、绑定情况、激活状态和有效期信息。",
    actionLabel: "导出 License 报表",
  },
  purchase: {
    title: "购买",
    description: "统一购买资源包、声音复刻实例、音色续期和 License 等资源。",
    actionLabel: "查看套餐",
  },
  tools: {
    title: "我的Tools",
    description: "统一维护用户创建的 MCP 工具，支持新增、查看、编辑和删除。",
    actionLabel: "创建 MCP",
  },
  skills: {
    title: "我的Skills",
    description: "统一维护用户创建的 Skill，支持新增、查看、编辑和删除。",
    actionLabel: "创建 Skill",
  },
  "developer-community": {
    title: "社区",
    description: "浏览开发者共享的 MCP 工具与 Skills，支持上传你的创作并下载社区资源。",
    actionLabel: "上传资源",
  },
};

function formatNow() {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function formatDateTime() {
  return new Date().toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDisplayDateTime(value: string) {
  if (/^\d{4}[-/]\d{2}[-/]\d{2}\s\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{4}[-/]\d{2}[-/]\d{2}\s\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  return value;
}

function createAppSecret(prefix = "ak") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultServiceStatus() {
  return FEATURE_CONFIG_TABS.reduce<Record<FeatureConfigTabKey, boolean>>((acc, feature) => {
    acc[feature.key] = false;
    return acc;
  }, {} as Record<FeatureConfigTabKey, boolean>);
}

function maskAppSecret(secret: string) {
  if (!secret) return "************";
  return "*".repeat(Math.max(12, secret.length));
}

function createAssistantWelcomeMessage(target: "agent" | "mcp" | "skill"): AssistantDraftMessage {
  return {
    id: createId("assistant-msg"),
    role: "agent",
    content:
      target === "agent"
        ? "你好，我是辅助开发小助手。你可以直接描述想生成的智能体，例如“帮我生成一个客服回访智能体，支持问题归因、满意度判断和总结输出”。"
        : target === "mcp"
        ? "你好，我是辅助开发小助手。你可以直接描述想生成的 MCP，例如“帮我生成一个查询天气的 MCP，返回温度、湿度和空气质量”。"
        : "你好，我是辅助开发小助手。你可以直接描述想生成的 Skill，例如“帮我生成一个用于内容审核的 Skill，支持风险等级判断和原因输出”。",
  };
}

export default function Home() {
  const {
    theme,
    toggleTheme,
    currentSection,
    setCurrentSection,
    isSidebarCollapsed,
    toggleSidebar,
    agentList,
    voiceProfiles,
    knowledgeBaseList,
    toolList,
    skillList,
    resourceList,
    openAgentEditor,
    setViewMode,
    addAgent,
    removeAgent,
    previewAgent,
    setPreviewAgent,
    isCalling,
    toggleCall,
    addVoiceProfile,
    updateVoiceProfile,
    addKnowledgeBase,
    updateKnowledgeBase,
    deleteKnowledgeBase,
    addTool,
    updateTool,
    deleteTool,
    addSkill,
    updateSkill,
    deleteSkill,
    appKeyList,
    addAppKey,
    updateAppKey: patchAppKey,
    deleteAppKey,
    addResource,
    updateResource,
    deleteResource,
    currentAgentId,
    currentJson,
    updateJson,
    chatMessages,
    chatInput,
    assistantMemory,
    addMessage,
    setAssistantMemory,
    setChatInput,
  } = useWorkspaceStore();
  const [licenseList, setLicenseList] = useState<LicenseItem[]>([
    {
      id: "lic-1",
      name: "直播互动 License",
      licenseKey: "b4b5903a8d554b76769a1752cd5b6f88",
      version: "基础版",
      bindAppId: "444",
      bindStatus: "已绑定",
      bindAt: "2026-05-09 19:43:25",
      activationStatus: "未激活",
      activatedAt: "-",
      validDays: "365天",
      validUntil: "0001-01-01 00:00:00",
    },
    {
      id: "lic-2",
      name: "客服热线 License",
      licenseKey: "84016abab26a3c13b6126e564397955b",
      version: "基础版",
      bindAppId: "433",
      bindStatus: "已绑定",
      bindAt: "2026-02-26 16:02:47",
      activationStatus: "未激活",
      activatedAt: "-",
      validDays: "0天",
      validUntil: "0001-01-01 00:00:00",
    },
    {
      id: "lic-3",
      name: "电话外呼 License",
      licenseKey: "d55db2afaebd8a01b2aac9796f95b809",
      version: "旗舰版",
      bindAppId: "ddfdfd",
      bindStatus: "已绑定",
      bindAt: "2026-02-11 18:46:34",
      activationStatus: "已激活",
      activatedAt: "2026-02-26 16:01:00",
      validDays: "365天",
      validUntil: "2027-02-26 16:01:00",
    },
    {
      id: "lic-4",
      name: "企业前台 License",
      licenseKey: "0e9f100023a120cad2dd1bc866f8f723",
      version: "基础版",
      bindAppId: "dsd",
      bindStatus: "已绑定",
      bindAt: "2026-02-11 18:45:15",
      activationStatus: "已激活",
      activatedAt: "2026-02-11 18:45:00",
      validDays: "730天",
      validUntil: "2028-02-11 18:45:00",
    },
    {
      id: "lic-5",
      name: "门店导购 License",
      licenseKey: "815d5da07a7b1de8727df6cb429fd273",
      version: "基础版",
      bindAppId: "5454",
      bindStatus: "已绑定",
      bindAt: "2026-02-11 18:41:17",
      activationStatus: "已激活",
      activatedAt: "2026-02-11 18:41:00",
      validDays: "730天",
      validUntil: "2028-02-11 18:41:00",
    },
    {
      id: "lic-6",
      name: "呼叫中心 License",
      licenseKey: "f755d8d2a4114548c205016d4c689667",
      version: "旗舰版",
      bindAppId: "test12",
      bindStatus: "已绑定",
      bindAt: "2026-02-11 18:31:06",
      activationStatus: "已激活",
      activatedAt: "2026-02-11 18:32:00",
      validDays: "365天",
      validUntil: "2027-02-11 18:32:00",
    },
    {
      id: "lic-7",
      name: "办公助手 License",
      licenseKey: "d0fbde429453f50bf0c962fb23198fea",
      version: "基础版",
      bindAppId: "test",
      bindStatus: "已绑定",
      bindAt: "2026-02-11 15:59:00",
      activationStatus: "已激活",
      activatedAt: "2026-02-11 15:59:00",
      validDays: "730天",
      validUntil: "2028-02-11 15:59:00",
    },
  ]);
  const [selectedLicenseApp, setSelectedLicenseApp] = useState("全部");
  const [selectedLicenseVersion, setSelectedLicenseVersion] = useState<"全部" | LicenseItem["version"]>("全部");
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [catalogAssistantOpen, setCatalogAssistantOpen] = useState(false);
  const [catalogAssistantTarget, setCatalogAssistantTarget] = useState<"agent" | "mcp" | "skill">("mcp");
  const [catalogAssistantGenerating, setCatalogAssistantGenerating] = useState(false);
  const [assistantPanelWidth, setAssistantPanelWidth] = useState(300);
  const [isAssistantResizing, setIsAssistantResizing] = useState(false);
  const [toolFormOpen, setToolFormOpen] = useState(false);
  const [toolFormState, setToolFormState] = useState<ToolFormState>({
    name: "",
    type: "Custom",
    endpoint: "https://mcp.example.com/custom",
    status: "草稿",
  });
  const [skillFormOpen, setSkillFormOpen] = useState(false);
  const [skillFormState, setSkillFormState] = useState<SkillFormState>({
    name: "",
    category: "自定义",
    model: "doubao-seed-1-6-flash",
  });
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [resourceFormState, setResourceFormState] = useState<ResourceFormState>(() => createResourceFormState("LLM"));
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("全部");
  const [agentCreateEntryOpen, setAgentCreateEntryOpen] = useState(false);
  const [agentTemplatePageOpen, setAgentTemplatePageOpen] = useState(false);
  const [selectedAgentTemplateId, setSelectedAgentTemplateId] = useState(agentTemplates[0].id);
  const [agentNameDialogMode, setAgentNameDialogMode] = useState<AgentCreateMode | null>(null);
  const [agentNameInput, setAgentNameInput] = useState("");
  const [agentDescriptionInput, setAgentDescriptionInput] = useState("");
  const [agentActionMenuId, setAgentActionMenuId] = useState<string | null>(null);
  const [pendingDeleteDialog, setPendingDeleteDialog] = useState<DeleteDialogState | null>(null);
  const [createAppDialog, setCreateAppDialog] = useState<CreateAppDialogState>({ open: false, name: "" });
  const [createBusinessDialog, setCreateBusinessDialog] = useState<CreateBusinessDialogState>(null);
  const [editAppDialog, setEditAppDialog] = useState<EditAppDialogState>(null);
  const [editBusinessDialog, setEditBusinessDialog] = useState<EditBusinessDialogState>(null);
  const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);
  const [copiedBusinessId, setCopiedBusinessId] = useState<string | null>(null);
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [selectedAppDetailId, setSelectedAppDetailId] = useState<string | null>(null);
  const [appActionMenuId, setAppActionMenuId] = useState<string | null>(null);
  const [floatingAppActionMenu, setFloatingAppActionMenu] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);
  const [visibleAppSecrets, setVisibleAppSecrets] = useState<Record<string, boolean>>({});
  const [copiedAppSecretKey, setCopiedAppSecretKey] = useState<string | null>(null);
  const isDark = theme === "dark";
  const resolvedSidebarWidth = isSidebarCollapsed ? 52 : 232;
  const assistantLayoutRef = useRef<HTMLDivElement | null>(null);
  const selectedAgentTemplate =
    agentTemplates.find((item) => item.id === selectedAgentTemplateId) ?? agentTemplates[0];
  const resourceBindings = resourceList.map((resource) => {
    const boundAgents = agentList.filter((agent) => {
      try {
        const parsed = JSON.parse(agent.configJson);
        const llmId = parsed?.Config?.LLMConfig?.ProviderParams?.ManagedResourceId;
        const asrId = parsed?.Config?.ASRConfig?.ProviderParams?.ManagedResourceId;
        const ttsId = parsed?.Config?.TTSConfig?.ProviderParams?.ManagedResourceId;
        return [llmId, asrId, ttsId].includes(resource.id);
      } catch {
        return false;
      }
    });

    return {
      resource,
      boundAgents,
    };
  });
  const filteredResourceBindings = resourceBindings.filter(({ resource }) =>
    resourceFilter === "全部" ? true : resource.kind === resourceFilter
  );

  const handleCopyAgentBotId = async (event: React.MouseEvent<HTMLButtonElement>, agentId: string, botId: string) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(botId);
      setCopiedAgentId(agentId);
      window.setTimeout(() => {
        setCopiedAgentId((current) => (current === agentId ? null : current));
      }, 1800);
    } catch (error) {
      console.error("Failed to copy botId", error);
    }
  };

  useEffect(() => {
    if (selectedAppDetailId && !appKeyList.some((item) => item.id === selectedAppDetailId)) {
      setSelectedAppDetailId(null);
    }
  }, [appKeyList, selectedAppDetailId]);

  useEffect(() => {
    if (!appActionMenuId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-app-action-menu-root='true']")) return;
      setAppActionMenuId(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [appActionMenuId]);

  useEffect(() => {
    if (!appActionMenuId) {
      setFloatingAppActionMenu(null);
    }
  }, [appActionMenuId]);

  useEffect(() => {
    if (!floatingAppActionMenu) return;

    const handleViewportChange = () => {
      setAppActionMenuId(null);
      setFloatingAppActionMenu(null);
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [floatingAppActionMenu]);

  const getManagedProviderLabel = (model: string) => {
    const matched = resourceList.find((resource) => resource.modelOptions.some((option) => option.value === model));
    return matched?.providerLabel;
  };

  const getManagedVoiceLabel = (voice: string) => {
    const matched = resourceList.find((resource) =>
      resource.voiceOptions.some((option) => option.label === voice || option.value === voice)
    );
    return matched?.providerLabel;
  };

  const formatManagedModelLabel = (model: string) => {
    const provider = getManagedProviderLabel(model);
    return provider ? `${provider} / ${model}` : formatModelLabel(model);
  };

  const formatManagedVoiceLabel = (voice: string) => {
    const provider = getManagedVoiceLabel(voice);
    return provider ? `${provider} / ${voice}` : formatVoiceLabel(voice);
  };

  const handleResourceKindChange = (kind: ResourceKind) => {
    setResourceFormState(createResourceFormState(kind));
  };

  const handleResourceProviderChange = (providerKey: string) => {
    const template = getResourceProviderTemplate(providerKey);
    if (!template) return;
    setResourceFormState((prev) => ({
      ...prev,
      kind: template.kind,
      providerKey,
      endpoint: prev.id ? prev.endpoint : template.endpointPlaceholder,
      modelLines: prev.id ? prev.modelLines : formatOptionLines(template.defaultModels ?? []),
      voiceLines: prev.id ? prev.voiceLines : formatOptionLines(template.defaultVoices ?? []),
      credentialValues: Object.fromEntries(
        template.fields.map((field) => [field.key, prev.credentialValues[field.key] ?? ""])
      ),
    }));
  };


  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.body.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    document.documentElement.style.setProperty("--convo-sidebar-offset", `${resolvedSidebarWidth + 1}px`);

    return () => {
      document.documentElement.style.removeProperty("--convo-sidebar-offset");
    };
  }, [resolvedSidebarWidth]);

  useEffect(() => {
    if (!catalogAssistantOpen) return;

    const layout = assistantLayoutRef.current;
    if (!layout) return;

    const rect = layout.getBoundingClientRect();
    const minWidth = 240;
    const maxWidth = Math.max(minWidth, Math.min(540, rect.width - 240));
    setAssistantPanelWidth((prev) => Math.min(Math.max(prev, minWidth), maxWidth));
  }, [catalogAssistantOpen, currentSection]);

  useEffect(() => {
    if (!agentActionMenuId) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-agent-action-menu='true']")) {
        return;
      }
      setAgentActionMenuId(null);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAgentActionMenuId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [agentActionMenuId]);

  useEffect(() => {
    if (!isAssistantResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const layout = assistantLayoutRef.current;
      if (!layout) return;

      const rect = layout.getBoundingClientRect();
      const minWidth = 240;
      const maxWidth = Math.max(minWidth, Math.min(540, rect.width - 240));
      const nextWidth = Math.min(Math.max(event.clientX - rect.left, minWidth), maxWidth);
      setAssistantPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsAssistantResizing(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isAssistantResizing]);

  const getAssistantTargetForSection = (section: WorkspaceSection): "agent" | "mcp" | "skill" => {
    if (section === "tools" || section === "developer-community" || section === "resource-packages") {
      return "mcp";
    }
    if (section === "skills") {
      return "skill";
    }
    return "agent";
  };

  const normalizeAssistantText = (value: string) =>
    value.toLowerCase().replace(/\s+/g, "").replace(/[·_.\-()（）[\]【】,，。!！?？:：]/g, "");

  const isAssistantJsonRequest = (request: string) =>
    /(json|代码块|配置|config)/i.test(request) &&
    /(跑通|流程|基础|基本|示例|模板|demo)/i.test(request);

  const recentAssistantUserRequests = chatMessages
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean)
    .slice(-3);

  const isAssistantFollowUpRequest = (request: string) =>
    request.trim().length <= 14 ||
    /(这个|那个|它|继续|刚才|上一个|前面|同样|也要|也给|换成|改成|补充|详细一点|具体一点|这个skill|这个mcp|这个工具)/i.test(
      request
    );

  const shouldReuseAssistantEntity = (request: string) =>
    /(这个|那个|它|刚才|上一个|前面|同一个|同样的)/i.test(request) &&
    /(加到|加上|挂到|挂上|用上|用这个|添加到|接入|绑定到|配置到)/i.test(request);

  const buildAssistantContextualRequest = (request: string) => {
    if (!isAssistantFollowUpRequest(request)) {
      return request;
    }

    const baseRequest = assistantMemory.lastResolvedRequest || recentAssistantUserRequests[recentAssistantUserRequests.length - 1];
    if (!baseRequest) {
      return request;
    }

    const normalizedBase = normalizeAssistantText(baseRequest);
    const normalizedRequest = normalizeAssistantText(request);
    if (!normalizedRequest || normalizedBase.includes(normalizedRequest)) {
      return baseRequest;
    }

    return `${baseRequest} ${request}`.trim();
  };

  const inferAssistantTarget = (request: string, fallback: "agent" | "mcp" | "skill") => {
    const normalized = normalizeAssistantText(request);
    if (
      normalized.includes("skill") ||
      normalized.includes("技能") ||
      normalized.includes("能力") ||
      normalized.includes("分类") ||
      normalized.includes("审核")
    ) {
      return "skill";
    }
    if (
      normalized.includes("mcp") ||
      normalized.includes("tool") ||
      normalized.includes("tools") ||
      normalized.includes("工具")
    ) {
      return "mcp";
    }
    if (normalized.includes("智能体") || normalized.includes("agent")) {
      return "agent";
    }
    return assistantMemory.lastEntity?.target ?? assistantMemory.lastTarget ?? fallback;
  };

  const getAssistantMatchScore = (request: string, candidate: string, extra?: string) => {
    const normalizedRequest = normalizeAssistantText(request);
    const normalizedCandidate = normalizeAssistantText(candidate);
    const normalizedExtra = extra ? normalizeAssistantText(extra) : "";
    let score = 0;

    if (normalizedRequest.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedRequest)) {
      score += 8;
    }

    const requestTokens = Array.from(
      new Set(
        request
          .split(/[\s、,，。!！?？:：()/\-]+/)
          .map((token) => token.trim().toLowerCase())
          .filter((token) => token && token.length >= 2)
      )
    );

    for (const token of requestTokens) {
      const normalizedToken = normalizeAssistantText(token);
      if (!normalizedToken) continue;
      if (normalizedCandidate.includes(normalizedToken)) score += 3;
      if (normalizedExtra.includes(normalizedToken)) score += 1;
    }

    return score;
  };

  const findBestSkillMatch = (request: string) => {
    const matches = skillList
      .map((skill) => ({
        skill,
        score: getAssistantMatchScore(request, skill.name, `${skill.category} ${skill.model}`),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return matches[0]?.skill ?? null;
  };

  const findBestToolMatch = (request: string) => {
    const matches = toolList
      .map((tool) => ({
        tool,
        score: getAssistantMatchScore(request, tool.name, `${tool.type} ${tool.endpoint}`),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return matches[0]?.tool ?? null;
  };

  const rememberAssistantContext = (payload: {
    target: AssistantTarget;
    resolvedRequest: string;
    action: "created_agent" | "attached_existing" | "opened_existing" | "created_draft";
    entity: { name: string; id?: string; source: "existing" | "draft" | "created" | "attached" };
  }) => {
    setAssistantMemory({
      lastTarget: payload.target,
      lastResolvedRequest: payload.resolvedRequest,
      lastAction: payload.action,
      lastEntity: {
        target: payload.target,
        name: payload.entity.name,
        id: payload.entity.id,
        source: payload.entity.source,
      },
    });
  };

  const appendCapabilityToCurrentAgent = (key: "tools" | "skills", value: string) => {
    if (!currentAgentId) return false;

    try {
      const parsed = JSON.parse(currentJson);
      parsed.Config = parsed.Config || {};
      if (key === "tools") {
        parsed.Config.FunctionCallingConfig = parsed.Config.FunctionCallingConfig || {};
        const currentValues = Array.isArray(parsed.Config.FunctionCallingConfig.Tools)
          ? parsed.Config.FunctionCallingConfig.Tools
          : [];
        parsed.Config.FunctionCallingConfig.Tools = Array.from(new Set([...currentValues, value]));
      } else {
        parsed.Config.SkillConfig = parsed.Config.SkillConfig || {};
        const currentValues = Array.isArray(parsed.Config.SkillConfig.Skills) ? parsed.Config.SkillConfig.Skills : [];
        parsed.Config.SkillConfig.Skills = Array.from(new Set([...currentValues, value]));
      }
      updateJson(JSON.stringify(parsed, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to append capability to current agent", error);
      return false;
    }
  };

  const ensureCatalogAssistantHistory = (target: "agent" | "mcp" | "skill") => {
    if (useWorkspaceStore.getState().chatMessages.length === 0) {
      addMessage(createAssistantWelcomeMessage(target));
    }
  };

  useEffect(() => {
    const nextTarget = getAssistantTargetForSection(currentSection);
    if (catalogAssistantTarget !== nextTarget) {
      setCatalogAssistantTarget(nextTarget);
    }
    if (catalogAssistantOpen) {
      setCatalogAssistantGenerating(false);
      ensureCatalogAssistantHistory(nextTarget);
    }
  }, [currentSection]);

  const openAgent = (
    agent: AgentSummary,
    mode: "detail" | "code" = "detail",
    preset: "default" | "blank" = "default"
  ) => {
    setPreviewAgent(null);
    setAgentTemplatePageOpen(false);
    setViewMode(mode);
    openAgentEditor(agent, preset);
  };

  const handleCreateAgent = () => {
    setAgentCreateEntryOpen(true);
  };

  const openAgentNameDialog = (mode: AgentCreateMode, initialName: string, initialDescription: string) => {
    setAgentNameDialogMode(mode);
    setAgentNameInput(initialName);
    setAgentDescriptionInput(initialDescription);
  };

  const createAgentRecord = (name: string, detailDescription: string, template?: AgentTemplate): AgentSummary => {
    const matchedLlmResource = template
      ? resourceList.find((resource) => resource.kind === "LLM" && resource.modelOptions.some((option) => option.value === template.model))
      : undefined;
    const matchedTtsResource = template
      ? resourceList.find((resource) => resource.kind === "TTS" && resource.voiceOptions.some((option) => option.label === template.voice))
      : undefined;
    const matchedVoiceValue =
      matchedTtsResource?.voiceOptions.find((option) => option.label === template?.voice)?.value;
    const configJson = template
      ? buildAgentConfigJson({
          resources: resourceList,
          llmResourceId: matchedLlmResource?.id,
          llmModel: template.model,
          ttsResourceId: matchedTtsResource?.id,
          ttsVoice: matchedVoiceValue,
          prompt: template.prompt,
          welcomeMessage: template.welcomeMessage,
        })
      : buildEmptyConfigJson();

    return {
      id: createId("agent"),
      name,
      description: template ? `${template.name}模板 · ${template.summary}` : "自定义智能体",
      detailDescription,
      botId: `xbot${Math.random().toString(36).slice(2, 10)}`,
      model: template?.model ?? "",
      voice: template?.voice ?? "",
      updatedAt: formatDateTime(),
      configJson,
    };
  };

  const handleSelectAgentTemplate = () => {
    setAgentCreateEntryOpen(false);
    setAgentTemplatePageOpen(true);
    setCurrentSection("agents");
  };

  const handleSelectCustomAgent = () => {
    setAgentCreateEntryOpen(false);
    openAgentNameDialog("custom", `智能体_${agentList.length + 1}`, "");
  };

  const openCatalogAssistant = (type: "agent" | "mcp" | "skill") => {
    const isWorkspaceAssistant = currentSection === "orchestration" && type === "agent";
    setCatalogAssistantTarget(type);
    setCatalogAssistantOpen(true);
    setCatalogAssistantGenerating(false);
    if (isWorkspaceAssistant) {
      return;
    }
    ensureCatalogAssistantHistory(type);
  };

  const closeCatalogAssistant = () => {
    setCatalogAssistantOpen(false);
    setCatalogAssistantGenerating(false);
  };

  const ensureCatalogAssistantOpen = (type?: "agent" | "mcp" | "skill", presetInput?: string) => {
    const nextTarget = type ?? getAssistantTargetForSection(currentSection);
    const isWorkspaceAssistant = currentSection === "orchestration" && nextTarget === "agent";

    setCatalogAssistantTarget(nextTarget);
    setCatalogAssistantOpen(true);
    setCatalogAssistantGenerating(false);

    if (typeof presetInput === "string") {
      if (isWorkspaceAssistant) {
        setChatInput(presetInput);
      } else {
        setChatInput(presetInput);
      }
    }

    if (!isWorkspaceAssistant) {
      ensureCatalogAssistantHistory(nextTarget);
    }
  };

  const handleUseAgentTemplate = () => {
    openAgentNameDialog(
      "template",
      `${selectedAgentTemplate.name}_${agentList.length + 1}`,
      selectedAgentTemplate.description
    );
  };

  const buildTemplatePreviewAgent = (template: AgentTemplate): AgentSummary => {
    const matchedLlmResource = resourceList.find((resource) => resource.kind === "LLM" && resource.modelOptions.some((option) => option.value === template.model));
    const matchedTtsResource = resourceList.find((resource) => resource.kind === "TTS" && resource.voiceOptions.some((option) => option.label === template.voice));
    const matchedVoiceValue = matchedTtsResource?.voiceOptions.find((option) => option.label === template.voice)?.value;

    const configJson = buildAgentConfigJson({
      resources: resourceList,
      llmResourceId: matchedLlmResource?.id,
      llmModel: template.model,
      ttsResourceId: matchedTtsResource?.id,
      ttsVoice: matchedVoiceValue,
      prompt: template.prompt,
      welcomeMessage: template.welcomeMessage,
    });

    return {
      id: "preview-temp",
      name: template.name,
      description: template.summary,
      detailDescription: template.description,
      botId: "preview-bot",
      model: template.model,
      voice: template.voice,
      updatedAt: formatDateTime(),
      configJson,
    };
  };

  const closeAgentTemplatePage = () => {
    if (isCalling) {
      toggleCall();
    }
    setPreviewAgent(null);
    setAgentTemplatePageOpen(false);
  };

  useEffect(() => {
    if (!agentTemplatePageOpen) return;
    setPreviewAgent(buildTemplatePreviewAgent(selectedAgentTemplate));
  }, [agentTemplatePageOpen, selectedAgentTemplate, resourceList]);

  useEffect(() => {
    if (agentTemplatePageOpen && currentSection !== "agents") {
      closeAgentTemplatePage();
    }
  }, [agentTemplatePageOpen, currentSection]);

  const handleConfirmAgentName = () => {
    const name = agentNameInput.trim();
    const detailDescription = agentDescriptionInput.trim();
    if (!name || !agentNameDialogMode) return;

    const template = agentNameDialogMode === "template" ? selectedAgentTemplate : undefined;
    const newAgent = createAgentRecord(name, detailDescription || "待补充智能体描述", template);
    addAgent(newAgent);
    setAgentNameDialogMode(null);
    setAgentNameInput("");
    setAgentDescriptionInput("");

    if (agentNameDialogMode === "template") {
      setPreviewAgent(null);
      setAgentTemplatePageOpen(false);
    }

    if (agentNameDialogMode === "custom") {
      openAgent(newAgent, "detail", "blank");
    }
  };

  const openDeleteDialog = (title: string, description: string, onConfirm: () => void, confirmLabel = "确认删除") => {
    setPendingDeleteDialog({ title, description, onConfirm, confirmLabel });
  };

  const handleDeleteAgent = (agent: AgentSummary) => {
    openDeleteDialog("删除智能体", `确认删除智能体“${agent.name}”吗？删除后将从当前列表中移除。`, () => {
      removeAgent(agent.id);
    });
  };

  const handleConfirmDeleteDialog = () => {
    if (!pendingDeleteDialog) return;
    pendingDeleteDialog.onConfirm();
    setPendingDeleteDialog(null);
  };

  const handleCloneVoice = () => {
    const name = window.prompt("请输入新的复刻音色名称", formatNow())?.trim();
    if (!name) return;

    addVoiceProfile({
      id: createId("voice"),
      name,
      voiceId: `S_${Math.random().toString(36).slice(2, 10)}`,
      remainingCount: 20,
      expireAt: "2027-12-31 23:59:59 到期",
    });
  };

  const handleEditVoice = (voiceId: string, currentName: string) => {
    const name = window.prompt("修改音色名称", currentName)?.trim();
    if (!name) return;
    updateVoiceProfile(voiceId, { name });
  };

  const handleRenewVoice = (voiceId: string) => {
    updateVoiceProfile(voiceId, {
      expired: false,
      expireAt: "2027-12-31 23:59:59 到期",
      remainingCount: 99,
    });
  };

  const openToolForm = (draft?: Partial<ToolFormState>) => {
    setToolFormState({
      id: draft?.id,
      name: draft?.name ?? `我的MCP_${toolList.length + 1}`,
      type: draft?.type ?? "Custom",
      endpoint: draft?.endpoint ?? "https://mcp.example.com/custom",
      status: draft?.status ?? "草稿",
    });
    setToolFormOpen(true);
  };

  const handleCreateTool = () => {
    openToolForm();
  };

  const handleEditTool = (tool: ToolItem) => {
    openToolForm(tool);
  };

  const handleSaveTool = () => {
    if (!toolFormState.name.trim() || !toolFormState.endpoint.trim()) return;
    if (toolFormState.id) {
      updateTool(toolFormState.id, {
        name: toolFormState.name.trim(),
        type: toolFormState.type.trim(),
        endpoint: toolFormState.endpoint.trim(),
        status: toolFormState.status,
      });
    } else {
      addTool({
        id: createId("tool"),
        name: toolFormState.name.trim(),
        type: toolFormState.type.trim(),
        endpoint: toolFormState.endpoint.trim(),
        status: toolFormState.status,
      });
    }
    setToolFormOpen(false);
  };

  const handleDeleteTool = (tool: ToolItem) => {
    openDeleteDialog("删除 MCP", `确认删除 MCP“${tool.name}”吗？删除后将从当前列表中移除。`, () => {
      deleteTool(tool.id);
    });
  };

  const openSkillForm = (draft?: Partial<SkillFormState>) => {
    setSkillFormState({
      id: draft?.id,
      name: draft?.name ?? `我的Skill_${skillList.length + 1}`,
      category: draft?.category ?? "自定义",
      model: draft?.model ?? "doubao-seed-1-6-flash",
    });
    setSkillFormOpen(true);
  };

  const handleCreateSkill = () => {
    openSkillForm();
  };

  const handleEditSkill = (skill: SkillItem) => {
    openSkillForm(skill);
  };

  const handleSaveSkill = () => {
    if (!skillFormState.name.trim() || !skillFormState.model.trim()) return;
    if (skillFormState.id) {
      updateSkill(skillFormState.id, {
        name: skillFormState.name.trim(),
        category: skillFormState.category.trim(),
        model: skillFormState.model.trim(),
        updatedAt: formatDateTime(),
      });
    } else {
      addSkill({
        id: createId("skill"),
        name: skillFormState.name.trim(),
        category: skillFormState.category.trim(),
        model: skillFormState.model.trim(),
        updatedAt: formatDateTime(),
      });
    }
    setSkillFormOpen(false);
  };

  const handleDeleteSkill = (skill: SkillItem) => {
    openDeleteDialog("删除 Skill", `确认删除 Skill“${skill.name}”吗？删除后将从当前列表中移除。`, () => {
      deleteSkill(skill.id);
    });
  };

  const buildToolDraftFromPrompt = (prompt: string): ToolFormState => {
    const lowerPrompt = prompt.toLowerCase();
    const type = lowerPrompt.includes("天气")
      ? "API"
      : lowerPrompt.includes("知识") || lowerPrompt.includes("检索")
        ? "Knowledge"
        : lowerPrompt.includes("工单") || lowerPrompt.includes("审批")
          ? "Workflow"
          : "Custom";
    const name = lowerPrompt.includes("天气")
      ? "天气查询 MCP"
      : lowerPrompt.includes("知识") || lowerPrompt.includes("检索")
        ? "知识检索 MCP"
        : lowerPrompt.includes("工单")
          ? "工单处理 MCP"
          : `自定义MCP_${toolList.length + 1}`;
    const endpoint = lowerPrompt.includes("天气")
      ? "https://mcp.example.com/weather"
      : lowerPrompt.includes("知识") || lowerPrompt.includes("检索")
        ? "https://mcp.example.com/retrieval"
        : lowerPrompt.includes("工单")
          ? "https://mcp.example.com/ticket"
          : "https://mcp.example.com/custom";
    return { name, type, endpoint, status: "草稿" };
  };

  const buildSkillDraftFromPrompt = (prompt: string): SkillFormState => {
    const lowerPrompt = prompt.toLowerCase();
    const category = lowerPrompt.includes("满意度") || lowerPrompt.includes("调查")
      ? "分析"
      : lowerPrompt.includes("审核")
      ? "内容安全"
      : lowerPrompt.includes("分类") || lowerPrompt.includes("意图")
        ? "NLP"
        : lowerPrompt.includes("话术") || lowerPrompt.includes("文案")
          ? "文案"
          : "自定义";
    const name = lowerPrompt.includes("满意度") || lowerPrompt.includes("调查")
      ? "满意度调查 Skill"
      : lowerPrompt.includes("审核")
      ? "内容审核 Skill"
      : lowerPrompt.includes("分类") || lowerPrompt.includes("意图")
        ? "意图分类 Skill"
        : lowerPrompt.includes("话术") || lowerPrompt.includes("文案")
          ? "话术生成 Skill"
          : `自定义Skill_${skillList.length + 1}`;
    const model = lowerPrompt.includes("复杂") ? "doubao-1.5-pro-32k" : "doubao-seed-1-6-flash";
    return { name, category, model };
  };

  const buildAgentDraftFromPrompt = (prompt: string): AgentSummary => {
    const lowerPrompt = prompt.toLowerCase();
    const name = lowerPrompt.includes("客服")
      ? "客服回访智能体"
      : lowerPrompt.includes("导购")
        ? "门店导购智能体"
        : lowerPrompt.includes("会议") || lowerPrompt.includes("纪要")
          ? "会议纪要智能体"
          : `智能体_${agentList.length + 1}`;
    const description = lowerPrompt.includes("客服")
      ? "用于客服回访、问题归因和满意度分析"
      : lowerPrompt.includes("导购")
        ? "用于商品推荐、活动介绍和下单引导"
        : lowerPrompt.includes("会议") || lowerPrompt.includes("纪要")
          ? "用于会议内容整理、待办提取和纪要生成"
          : "根据自然语言需求生成的智能体草稿";
    const model = lowerPrompt.includes("复杂") ? "doubao-1.5-pro-32k" : "doubao-seed-1-6-flash-250828";
    return {
      id: createId("agent"),
      name,
      description,
      detailDescription: description,
      botId: `xbot${Math.random().toString(36).slice(2, 10)}`,
      model,
      voice: "晓言·专业女声",
      updatedAt: formatDateTime(),
      configJson: buildAgentConfigJson({
        resources: resourceList,
        llmModel: model,
        prompt: description,
        welcomeMessage: "你好，我已经准备好开始协助你了。",
      }),
    };
  };

  const handleCallAssistant = (type?: "agent" | "mcp" | "skill") => {
    const nextTarget = type ?? getAssistantTargetForSection(currentSection);
    if (catalogAssistantOpen && catalogAssistantTarget === nextTarget) {
      closeCatalogAssistant();
      return;
    }
    openCatalogAssistant(nextTarget);
  };

  const handleAssistantGenerate = () => {
    if (!chatInput.trim() || catalogAssistantGenerating) return;
    const request = chatInput.trim();
    const contextualRequest = buildAssistantContextualRequest(request);
    const resolvedTarget = inferAssistantTarget(contextualRequest, catalogAssistantTarget);
    const userMessage: AssistantDraftMessage = { id: createId("assistant-msg"), role: "user", content: request };
    addMessage(userMessage);
    setChatInput("");
    setCatalogAssistantGenerating(true);

    window.setTimeout(() => {
      if (resolvedTarget === "agent") {
        const draft = buildAgentDraftFromPrompt(contextualRequest);
        addMessage({
          role: "agent",
          content: isAssistantJsonRequest(contextualRequest)
            ? `我给你一份可以直接参考的基础流程 JSON，同时也已经帮你生成了一个智能体草稿并进入编排页。

\`\`\`json
${draft.configJson}
\`\`\``
            : "我已经帮你生成了一个智能体草稿，并自动进入智能体编排页。你可以继续补充提示词、工具和知识库配置。",
        });
        addAgent(draft);
        openAgent(draft);
        rememberAssistantContext({
          target: "agent",
          resolvedRequest: contextualRequest,
          action: "created_agent",
          entity: { name: draft.name, id: draft.id, source: "created" },
        });
      } else if (resolvedTarget === "mcp") {
        const referencedTool =
          shouldReuseAssistantEntity(request) && assistantMemory.lastEntity?.target === "mcp"
            ? toolList.find(
                (tool) =>
                  tool.id === assistantMemory.lastEntity?.id || tool.name === assistantMemory.lastEntity?.name
              ) ?? null
            : null;
        const matchedTool = referencedTool ?? findBestToolMatch(contextualRequest);
        if (matchedTool && currentSection === "orchestration" && appendCapabilityToCurrentAgent("tools", matchedTool.name)) {
          addMessage({
            role: "agent",
            content: `我已经在“我的Tools”里找到了 MCP“${matchedTool.name}”，并把它直接加到当前智能体的工具配置里了。`,
          });
          rememberAssistantContext({
            target: "mcp",
            resolvedRequest: contextualRequest,
            action: "attached_existing",
            entity: { name: matchedTool.name, id: matchedTool.id, source: "attached" },
          });
        } else if (matchedTool) {
          addMessage({
            role: "agent",
            content: `我已经在“我的Tools”里找到了 MCP“${matchedTool.name}”。当前不在智能体编排页，我先带你跳到“我的Tools”查看这条能力。`,
          });
          setCurrentSection("tools");
          openToolForm(matchedTool);
          rememberAssistantContext({
            target: "mcp",
            resolvedRequest: contextualRequest,
            action: "opened_existing",
            entity: { name: matchedTool.name, id: matchedTool.id, source: "existing" },
          });
        } else {
          const draft = buildToolDraftFromPrompt(contextualRequest);
          const createdTool: ToolItem = {
            id: createId("tool"),
            name: draft.name.trim(),
            type: draft.type.trim(),
            endpoint: draft.endpoint.trim(),
            status: draft.status,
          };
          addTool(createdTool);
          addMessage({
            role: "agent",
            content: `我在现有 MCP 里没有找到可直接复用的项，已经先在“我的Tools”里帮你生成了一条草稿“${createdTool.name}”，并打开编辑表单让你继续补充。`,
          });
          setCurrentSection("tools");
          openToolForm(createdTool);
          rememberAssistantContext({
            target: "mcp",
            resolvedRequest: contextualRequest,
            action: "created_draft",
            entity: { name: createdTool.name, id: createdTool.id, source: "draft" },
          });
        }
      } else {
        const referencedSkill =
          shouldReuseAssistantEntity(request) && assistantMemory.lastEntity?.target === "skill"
            ? skillList.find(
                (skill) =>
                  skill.id === assistantMemory.lastEntity?.id || skill.name === assistantMemory.lastEntity?.name
              ) ?? null
            : null;
        const matchedSkill = referencedSkill ?? findBestSkillMatch(contextualRequest);
        if (matchedSkill && currentSection === "orchestration" && appendCapabilityToCurrentAgent("skills", matchedSkill.name)) {
          addMessage({
            role: "agent",
            content: `我已经在“我的Skills”里找到了 Skill“${matchedSkill.name}”，并把它直接加到当前智能体的 Skill 配置里了。`,
          });
          rememberAssistantContext({
            target: "skill",
            resolvedRequest: contextualRequest,
            action: "attached_existing",
            entity: { name: matchedSkill.name, id: matchedSkill.id, source: "attached" },
          });
        } else if (matchedSkill) {
          addMessage({
            role: "agent",
            content: `我已经在“我的Skills”里找到了 Skill“${matchedSkill.name}”。当前不在智能体编排页，我先带你跳到“我的Skills”查看这条能力。`,
          });
          setCurrentSection("skills");
          openSkillForm(matchedSkill);
          rememberAssistantContext({
            target: "skill",
            resolvedRequest: contextualRequest,
            action: "opened_existing",
            entity: { name: matchedSkill.name, id: matchedSkill.id, source: "existing" },
          });
        } else {
          const draft = buildSkillDraftFromPrompt(contextualRequest);
          const createdSkill: SkillItem = {
            id: createId("skill"),
            name: draft.name.trim(),
            category: draft.category.trim(),
            model: draft.model.trim(),
            updatedAt: formatDateTime(),
          };
          addSkill(createdSkill);
          addMessage({
            role: "agent",
            content: `我在现有 Skill 里没有找到可直接复用的项，已经先在“我的Skills”里帮你生成了一条草稿“${createdSkill.name}”，并打开编辑表单让你继续补充。`,
          });
          setCurrentSection("skills");
          openSkillForm(createdSkill);
          rememberAssistantContext({
            target: "skill",
            resolvedRequest: contextualRequest,
            action: "created_draft",
            entity: { name: createdSkill.name, id: createdSkill.id, source: "draft" },
          });
        }
      }
      setCatalogAssistantGenerating(false);
    }, 500);
  };

  const handleCreateKnowledgeBase = () => {
    const name = window.prompt("请输入知识库名称", `知识库_${knowledgeBaseList.length + 1}`)?.trim();
    if (!name) return;

    addKnowledgeBase({
      id: createId("kb"),
      name,
      type: "Doc",
      documentCount: 0,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      status: "草稿",
    });
  };

  const handleEditKnowledgeBase = (knowledge: KnowledgeBaseItem) => {
    const name = window.prompt("请输入新的知识库名称", knowledge.name)?.trim();
    if (!name) return;

    updateKnowledgeBase(knowledge.id, {
      name,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
    });
  };

  const handleDeleteKnowledgeBase = (knowledge: KnowledgeBaseItem) => {
    openDeleteDialog("删除知识库", `确认删除知识库“${knowledge.name}”吗？删除后将从当前列表中移除。`, () => {
      deleteKnowledgeBase(knowledge.id);
    });
  };

  const syncCurrentJsonAppId = (updater: (currentAppId: string) => string | null | undefined) => {
    try {
      const parsed = JSON.parse(currentJson);
      const currentAppId = typeof parsed?.AppId === "string" ? parsed.AppId.trim() : "";
      const nextAppId = updater(currentAppId);
      if (!nextAppId || nextAppId === currentAppId) return;
      parsed.AppId = nextAppId;
      updateJson(JSON.stringify(parsed, null, 2));
    } catch {
      // Ignore invalid JSON here and let the editor validation handle it.
    }
  };

  const handleCreateAppKey = () => {
    setCreateAppDialog({
      open: true,
      name: `应用_${appKeyList.length + 1}`,
    });
  };

  const handleConfirmCreateAppKey = () => {
    const name = createAppDialog.name.trim();
    if (!name) return;
    const nextAppKey: AppKeyItem = {
      id: createId("app"),
      appId: `app_${Math.random().toString().slice(2, 7)}`,
      name,
      status: "草稿",
      createdAt: formatDateTime(),
      updatedAt: formatDateTime(),
      primaryAppKey: createAppSecret("ak_main"),
      secondaryAppKeyEnabled: false,
      activeKeySlot: "primary",
      businessItems: [],
      serviceStatus: createDefaultServiceStatus(),
    };
    addAppKey(nextAppKey);
    setCreateAppDialog({ open: false, name: "" });
    syncCurrentJsonAppId((currentAppId) => currentAppId || nextAppKey.appId);
  };

  const handleEditAppKey = (item: AppKeyItem) => {
    setEditAppDialog({
      id: item.id,
      name: item.name,
    });
  };

  const handleConfirmEditAppKey = () => {
    if (!editAppDialog) return;
    const name = editAppDialog.name.trim();
    if (!name) return;
    patchAppKey(editAppDialog.id, { name, updatedAt: formatDateTime() });
    setEditAppDialog(null);
  };

  const handleDeleteAppKey = (item: AppKeyItem) => {
    if (item.status === "已启用") {
      window.alert("请先禁用应用，再执行删除。");
      setAppActionMenuId(null);
      return;
    }
    openDeleteDialog("删除应用", `确认删除应用“${item.name}”吗？删除后将从当前列表中移除。`, () => {
      const remainingAppKeys = appKeyList.filter((entry) => entry.id !== item.id);
      deleteAppKey(item.id);
      setAppActionMenuId((current) => (current === item.id ? null : current));
      syncCurrentJsonAppId((currentAppId) => {
        if (currentAppId !== item.appId) return currentAppId;
        return remainingAppKeys[0]?.appId ?? currentAppId;
      });
    });
  };

  const handleToggleAppStatus = (item: AppKeyItem) => {
    patchAppKey(item.id, {
      status: item.status === "已禁用" ? "已启用" : "已禁用",
      updatedAt: formatDateTime(),
    });
    setAppActionMenuId(null);
  };

  const toggleAppSecretVisibility = (secretKey: string) => {
    setVisibleAppSecrets((prev) => ({ ...prev, [secretKey]: !prev[secretKey] }));
  };

  const handleCopyAppSecret = async (item: AppKeyItem, slot: "primary" | "secondary", secret?: string) => {
    if (!secret) return;
    const secretKey = `${item.id}:${slot}`;
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedAppSecretKey(secretKey);
      window.setTimeout(() => {
        setCopiedAppSecretKey((current) => (current === secretKey ? null : current));
      }, 1800);
    } catch (error) {
      console.error("Failed to copy app secret", error);
    }
  };

  const handleCopyAppId = async (itemId: string, appId: string) => {
    if (!appId) return;
    try {
      await navigator.clipboard.writeText(appId);
      setCopiedAppId(itemId);
      window.setTimeout(() => {
        setCopiedAppId((current) => (current === itemId ? null : current));
      }, 1800);
    } catch (error) {
      console.error("Failed to copy appId", error);
    }
  };

  const handleCopyBusinessId = async (businessItemId: string, businessId: string) => {
    if (!businessId) return;
    try {
      await navigator.clipboard.writeText(businessId);
      setCopiedBusinessId(businessItemId);
      window.setTimeout(() => {
        setCopiedBusinessId((current) => (current === businessItemId ? null : current));
      }, 1800);
    } catch (error) {
      console.error("Failed to copy businessId", error);
    }
  };

  const handleAddSecondaryAppKey = (item: AppKeyItem) => {
    if (item.secondaryAppKey) return;
    patchAppKey(item.id, {
      secondaryAppKey: createAppSecret("ak_sub"),
      secondaryAppKeyEnabled: true,
      updatedAt: formatDateTime(),
    });
  };

  const handleToggleSecondaryAppKey = (item: AppKeyItem) => {
    if (!item.secondaryAppKey) return;
    const nextEnabled = !item.secondaryAppKeyEnabled;
    patchAppKey(item.id, {
      secondaryAppKeyEnabled: nextEnabled,
      activeKeySlot: !nextEnabled && item.activeKeySlot === "secondary" ? "primary" : item.activeKeySlot,
      updatedAt: formatDateTime(),
    });
  };

  const handleDeleteSecondaryAppKey = (item: AppKeyItem) => {
    if (!item.secondaryAppKey) return;
    if (item.secondaryAppKeyEnabled) {
      window.alert("请先停用副 AppKey，再执行删除。");
      return;
    }
    openDeleteDialog("删除副 AppKey", `确认删除应用“${item.name}”的副 AppKey 吗？删除后将恢复为空状态。`, () => {
      patchAppKey(item.id, {
        secondaryAppKey: undefined,
        secondaryAppKeyEnabled: false,
        activeKeySlot: "primary",
        updatedAt: formatDateTime(),
      });
    });
  };

  const handleSwitchActiveAppKey = (item: AppKeyItem) => {
    if (!item.secondaryAppKey) {
      window.alert("请先添加副 AppKey，再进行主/副 AppKey 切换。");
      return;
    }
    if (!item.secondaryAppKeyEnabled) {
      window.alert("请先启用副 AppKey，再进行主/副 AppKey 切换。");
      return;
    }
    patchAppKey(item.id, {
      activeKeySlot: item.activeKeySlot === "primary" ? "secondary" : "primary",
      updatedAt: formatDateTime(),
    });
  };

  const handleCreateBusinessId = (app: AppKeyItem) => {
    setCreateBusinessDialog({
      appId: app.id,
      appName: app.name,
      name: `业务_${app.businessItems.length + 1}`,
      businessId: "",
    });
  };

  const handleConfirmCreateBusinessId = () => {
    if (!createBusinessDialog) return;
    const app = appKeyList.find((entry) => entry.id === createBusinessDialog.appId);
    if (!app) {
      setCreateBusinessDialog(null);
      return;
    }
    const name = createBusinessDialog.name.trim();
    const businessId = createBusinessDialog.businessId.trim();
    if (!name || !businessId) return;
    const timestamp = formatDateTime();
    patchAppKey(app.id, {
      businessItems: [
        {
          id: createId("biz"),
          name,
          businessId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        ...app.businessItems,
      ],
      updatedAt: timestamp,
    });
    setCreateBusinessDialog(null);
  };

  const handleEditBusinessId = (app: AppKeyItem, item: AppBusinessItem) => {
    setEditBusinessDialog({
      appId: app.id,
      appName: app.name,
      businessItemId: item.id,
      name: item.name,
      businessId: item.businessId,
    });
  };

  const handleConfirmEditBusinessId = () => {
    if (!editBusinessDialog) return;
    const app = appKeyList.find((entry) => entry.id === editBusinessDialog.appId);
    if (!app) {
      setEditBusinessDialog(null);
      return;
    }
    const name = editBusinessDialog.name.trim();
    if (!name) return;
    patchAppKey(app.id, {
      businessItems: app.businessItems.map((entry) =>
        entry.id === editBusinessDialog.businessItemId ? { ...entry, name, updatedAt: formatDateTime() } : entry
      ),
      updatedAt: formatDateTime(),
    });
    setEditBusinessDialog(null);
  };

  const handleDeleteBusinessId = (app: AppKeyItem, item: AppBusinessItem) => {
    openDeleteDialog("删除业务标识", `确认删除业务标识“${item.name}”吗？删除后将从当前应用中移除。`, () => {
      patchAppKey(app.id, {
        businessItems: app.businessItems.filter((entry) => entry.id !== item.id),
        updatedAt: formatDateTime(),
      });
    });
  };

  const handleToggleAppFeature = (app: AppKeyItem, featureKey: FeatureConfigTabKey) => {
    patchAppKey(app.id, {
      serviceStatus: {
        ...app.serviceStatus,
        [featureKey]: !app.serviceStatus[featureKey],
      },
      updatedAt: formatDateTime(),
    });
  };

  const handleGenerateTempToken = (app: AppKeyItem) => {
    const secret =
      app.activeKeySlot === "secondary" && app.secondaryAppKeyEnabled
        ? app.secondaryAppKey ?? app.primaryAppKey
        : app.primaryAppKey;
    const token = `temp_${app.appId}_${btoa(`${secret}:${Date.now()}`).replace(/=/g, "").slice(0, 24)}`;
    window.prompt(`已为应用“${app.name}”生成临时 Token，可直接复制`, token);
  };

  const handleValidateTempToken = (app: AppKeyItem) => {
    const token = window.prompt(`请输入应用“${app.name}”的临时 Token`)?.trim();
    if (!token) return;
    const isValid = token.startsWith(`temp_${app.appId}_`);
    window.alert(isValid ? "Token 校验通过" : "Token 校验失败，请检查 AppID 或 Token 内容");
  };

  const handleCreateResourcePackage = () => {
    setResourceFormState(createResourceFormState("LLM"));
    setResourceFormOpen(true);
  };

  const handleEditResource = (item: ThirdPartyResourceItem) => {
    setResourceFormState(createResourceFormState(item.kind, item));
    setResourceFormOpen(true);
  };

  const handleDeleteResource = (item: ThirdPartyResourceItem) => {
    openDeleteDialog("删除资源", `确认删除资源“${item.name}”吗？删除后将从当前列表中移除。`, () => {
      deleteResource(item.id);
    });
  };

  const handleSaveResource = () => {
    const template = getResourceProviderTemplate(resourceFormState.providerKey);
    if (!template) return;

    const name = resourceFormState.name.trim();
    const endpoint = resourceFormState.endpoint.trim();
    if (!name || !endpoint) return;

    const payload: ThirdPartyResourceItem = {
      id: resourceFormState.id ?? createId("resource"),
      name,
      kind: resourceFormState.kind,
      providerKey: template.key,
      providerLabel: template.label,
      providerCode: template.providerCode,
      mode: template.mode,
      endpoint,
      status: resourceFormState.status,
      modelOptions: parseOptionLines(resourceFormState.modelLines),
      voiceOptions: parseOptionLines(resourceFormState.voiceLines),
      credentialValues: resourceFormState.credentialValues,
      notes: resourceFormState.notes.trim(),
      updatedAt: formatDateTime(),
    };

    if (resourceFormState.id) {
      updateResource(payload.id, payload);
    } else {
      addResource(payload);
    }

    setResourceFormOpen(false);
    setResourceFormState(createResourceFormState(payload.kind));
  };

  const handleCreateLicense = () => {
    const name = window.prompt("请输入 License 名称", `License_${licenseList.length + 1}`)?.trim();
    if (!name) return;
    setLicenseList((prev) => [
      {
        id: createId("lic"),
        name,
        licenseKey: `LIC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        version: "基础版",
        bindAppId: "-",
        bindStatus: "未绑定",
        bindAt: "-",
        activationStatus: "未激活",
        activatedAt: "-",
        validDays: "365天",
        validUntil: "0001-01-01 00:00:00",
      },
      ...prev,
    ]);
  };

  const handleEditLicense = (item: LicenseItem) => {
    const bindAppId = window.prompt("请输入绑定设备 ID", item.bindAppId)?.trim();
    if (!bindAppId) return;
    setLicenseList((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              bindAppId,
              bindStatus: "已绑定",
              bindAt: "2026-05-14 21:10:00",
            }
          : entry
      )
    );
  };

  const handleDeleteLicense = (item: LicenseItem) => {
    openDeleteDialog("删除 License", `确认删除 License“${item.name}”吗？删除后将从当前列表中移除。`, () => {
      setLicenseList((prev) => prev.filter((entry) => entry.id !== item.id));
    });
  };

  const surfaceClass = isDark
    ? "border-zinc-800 bg-zinc-900/80"
    : "border-zinc-200 bg-white";
  const subduedTextClass = isDark ? "text-zinc-400" : "text-zinc-500";
  const strongTextClass = isDark ? "text-zinc-100" : "text-zinc-900";
  const primaryButtonClass = `inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-500 active:scale-[0.98]`;
  const subtleActionButtonClass = `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
    isDark ? "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
  }`;
  const subtleIconButtonClass = `inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors ${
    isDark ? "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
  }`;
  const dangerActionButtonClass = `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
    isDark ? "text-red-300 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"
  }`;
  const dialogFieldBaseClass = `w-full rounded-xl border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
    isDark ? "border-zinc-700 bg-zinc-950 text-zinc-200" : "border-zinc-200 bg-white text-zinc-900"
  }`;
  const dialogInputClass = dialogFieldBaseClass;
  const dialogSelectClass = dialogFieldBaseClass;
  const dialogTextareaClass = `${dialogFieldBaseClass} resize-none leading-6`;
  const dialogCredentialInputClass = `${dialogFieldBaseClass} ${
    isDark ? "placeholder:text-zinc-500" : "placeholder:text-zinc-400"
  }`;
  const pageSelectBaseClass = `appearance-none rounded-lg border text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
    isDark ? "border-zinc-700 bg-zinc-900 text-zinc-200" : "border-zinc-200 bg-white text-zinc-700"
  }`;
  const pageFilterButtonFocusClass = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${
    isDark ? "focus-visible:ring-offset-zinc-950" : "focus-visible:ring-offset-white"
  } focus-visible:ring-offset-2`;
  const createEntryCardFocusClass = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35 ${
    isDark ? "focus-visible:ring-offset-zinc-950" : "focus-visible:ring-offset-white"
  } focus-visible:ring-offset-2`;
  const scenarioTemplateCoverUrl = `https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    "Vibrant and colorful 3D isometric icons of AI characters: a friendly robot, a wise owl teacher, a glowing heart, a colorful globe, all in bright glossy finish, vivid rainbow color palette, high saturation, studio lighting, clean and bright, no text"
  )}&image_size=landscape_16_9`;

  const renderCatalogAssistantPanel = () => (
    <ChatPanel
      messages={chatMessages}
      input={chatInput}
      onInputChange={setChatInput}
      placeholder={
        catalogAssistantTarget === "agent"
          ? "描述你想生成的智能体..."
          : catalogAssistantTarget === "mcp"
            ? "描述你想生成的 MCP..."
            : "描述你想生成的 Skill..."
      }
      quickOptions={
        catalogAssistantTarget === "agent"
          ? ["帮我生成一个客服回访智能体", "帮我生成一个门店导购智能体", "帮我生成一个会议纪要智能体"]
          : catalogAssistantTarget === "mcp"
            ? ["帮我生成一个天气查询 MCP", "帮我生成一个知识检索 MCP", "帮我生成一个工单处理 MCP"]
            : ["帮我生成一个内容审核 Skill", "帮我生成一个意图分类 Skill", "帮我生成一个话术生成 Skill"]
      }
      onQuickOptionClick={setChatInput}
      showVoiceInput={false}
    />
  );

  const renderToolFormDialog = () =>
    toolFormOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>{toolFormState.id ? "编辑 MCP" : "新建 MCP"}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>支持手动填写，也支持通过左侧小助手自动预填草稿。</div>
            </div>
            <button type="button" onClick={() => setToolFormOpen(false)} className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>MCP 名称</div>
              <input value={toolFormState.name} onChange={(e) => setToolFormState((prev) => ({ ...prev, name: e.target.value }))} className={dialogInputClass} />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>类型</div>
              <input value={toolFormState.type} onChange={(e) => setToolFormState((prev) => ({ ...prev, type: e.target.value }))} className={dialogInputClass} />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>Endpoint</div>
              <input value={toolFormState.endpoint} onChange={(e) => setToolFormState((prev) => ({ ...prev, endpoint: e.target.value }))} className={dialogInputClass} />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>状态</div>
              <select value={toolFormState.status} onChange={(e) => setToolFormState((prev) => ({ ...prev, status: e.target.value as ToolItem["status"] }))} className={dialogSelectClass}>
                <option value="草稿">草稿</option>
                <option value="已启用">已启用</option>
                <option value="维护中">维护中</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setToolFormOpen(false)} className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>取消</button>
            <button type="button" onClick={handleSaveTool} className={primaryButtonClass}>保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderSkillFormDialog = () =>
    skillFormOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>{skillFormState.id ? "编辑 Skill" : "新建 Skill"}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>支持手动填写，也支持通过左侧小助手自动预填草稿。</div>
            </div>
            <button type="button" onClick={() => setSkillFormOpen(false)} className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>Skill 名称</div>
              <input value={skillFormState.name} onChange={(e) => setSkillFormState((prev) => ({ ...prev, name: e.target.value }))} className={dialogInputClass} />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>分类</div>
              <input value={skillFormState.category} onChange={(e) => setSkillFormState((prev) => ({ ...prev, category: e.target.value }))} className={dialogInputClass} />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>模型</div>
              <input value={skillFormState.model} onChange={(e) => setSkillFormState((prev) => ({ ...prev, model: e.target.value }))} className={dialogInputClass} />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setSkillFormOpen(false)} className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>取消</button>
            <button type="button" onClick={handleSaveSkill} className={primaryButtonClass}>保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderResourceFormDialog = () => {
    if (!resourceFormOpen) return null;

    const availableTemplates = getTemplatesByKind(resourceFormState.kind);
    const currentTemplate = getResourceProviderTemplate(resourceFormState.providerKey) ?? availableTemplates[0];

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6">
        <div className={`flex max-h-[calc(100vh-48px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>{resourceFormState.id ? "编辑三方资源" : "新增三方资源"}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>按语音识别、大模型、语音合成分类维护典型供应商配置，智能体编辑页会直接复用这些资源。</div>
            </div>
            <button type="button" onClick={() => setResourceFormOpen(false)} className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {(["LLM", "ASR", "TTS"] as ResourceKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => handleResourceKindChange(kind)}
                  className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                      resourceFormState.kind === kind
                        ? isDark
                          ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                          : "border-blue-400 bg-blue-50 text-blue-600"
                        : isDark
                        ? "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-700"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <div className="text-sm font-semibold">{RESOURCE_KIND_LABEL[kind]}</div>
                  <div className={`mt-2 text-xs leading-6 ${
                    resourceFormState.kind === kind 
                      ? isDark ? "text-blue-400/80" : "text-blue-600/70"
                      : subduedTextClass
                  }`}>
                    {kind === "LLM" ? "管理大模型供应商、URL、模型名称和 API Key。" : kind === "ASR" ? "管理语音识别供应商、接入地址、模型与 token。" : "管理语音合成供应商、接入地址、音色与鉴权信息。"}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>资源名称</div>
                <input
                  value={resourceFormState.name}
                  onChange={(event) => setResourceFormState((prev) => ({ ...prev, name: event.target.value }))}
                  className={dialogInputClass}
                  placeholder="例如：豆包生产推理 / 火山流式识别"
                />
              </label>
              <label className="block">
                <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>供应商</div>
                <select
                  value={resourceFormState.providerKey}
                  onChange={(event) => handleResourceProviderChange(event.target.value)}
                  className={dialogSelectClass}
                >
                  {availableTemplates.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>接入地址 / URL</div>
                <input
                  value={resourceFormState.endpoint}
                  onChange={(event) => setResourceFormState((prev) => ({ ...prev, endpoint: event.target.value }))}
                  className={dialogInputClass}
                  placeholder={currentTemplate?.endpointPlaceholder}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(currentTemplate?.fields ?? []).map((field) => (
                <label key={field.key} className="block">
                  <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>{field.label}{field.required ? " *" : ""}</div>
                  <input
                    type={field.type === "password" ? "password" : "text"}
                    value={resourceFormState.credentialValues[field.key] ?? ""}
                    onChange={(event) =>
                      setResourceFormState((prev) => ({
                        ...prev,
                        credentialValues: { ...prev.credentialValues, [field.key]: event.target.value },
                      }))
                    }
                    placeholder={field.placeholder}
                    className={dialogCredentialInputClass}
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>{resourceFormState.kind === "TTS" ? "音色列表" : "模型列表"}</div>
                <textarea
                  rows={6}
                  value={resourceFormState.kind === "TTS" ? resourceFormState.voiceLines : resourceFormState.modelLines}
                  onChange={(event) =>
                    setResourceFormState((prev) => ({
                      ...prev,
                      [prev.kind === "TTS" ? "voiceLines" : "modelLines"]: event.target.value,
                    }))
                  }
                  className={dialogTextareaClass}
                  placeholder={resourceFormState.kind === "TTS" ? "每行一个音色，格式：显示名 | voice_code" : "每行一个模型名，格式：显示名 | model_name"}
                />
                <div className={`mt-2 text-[11px] ${subduedTextClass}`}>支持每行 `显示名 | 实际值`；如果不写竖线，就默认显示名和值相同。</div>
              </label>
              <div className="space-y-4">
                <label className="block">
                  <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>状态</div>
                  <select
                    value={resourceFormState.status}
                    onChange={(event) => setResourceFormState((prev) => ({ ...prev, status: event.target.value as ThirdPartyResourceItem["status"] }))}
                    className={dialogSelectClass}
                  >
                    <option value="草稿">草稿</option>
                    <option value="已启用">已启用</option>
                    <option value="停用">停用</option>
                  </select>
                </label>
                <label className="block">
                  <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>备注</div>
                  <textarea
                    rows={6}
                    value={resourceFormState.notes}
                    onChange={(event) => setResourceFormState((prev) => ({ ...prev, notes: event.target.value }))}
                    className={dialogTextareaClass}
                    placeholder="记录用途、环境、配额或切换说明"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setResourceFormOpen(false)} className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>取消</button>
            <button type="button" onClick={handleSaveResource} className={primaryButtonClass}>保存资源</button>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentCreateEntryDialog = () =>
    agentCreateEntryOpen ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>创建智能体</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>选择创建方式，支持直接套用模板或从零创建一个空白智能体。</div>
            </div>
            <button type="button" onClick={() => setAgentCreateEntryOpen(false)} className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                key: "template",
                title: "场景模板",
                description: "从预设场景模板快速创建，直接复用模型、音色和服务开通配置。",
                action: handleSelectAgentTemplate,
                coverUrl: scenarioTemplateCoverUrl,
              },
              {
                key: "custom",
                title: "自定义",
                description: "仅输入名称先创建一个空白智能体，然后进入编排调试页继续完善。",
                action: handleSelectCustomAgent,
                coverUrl: "",
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.action}
                className={`relative overflow-hidden rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 ${createEntryCardFocusClass} ${
                  isDark
                    ? "border-zinc-800 bg-zinc-950 hover:border-blue-500/40 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_18px_40px_rgba(37,99,235,0.16)]"
                    : "border-zinc-200 bg-white hover:border-blue-300 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.3),0_18px_40px_rgba(96,165,250,0.18)]"
                }`}
              >
                {item.coverUrl ? (
                  <>
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-100"
                      style={{ backgroundImage: `url("${item.coverUrl}")` }}
                      aria-hidden="true"
                    />
                    <div
                      className={`absolute inset-0 ${
                        isDark
                          ? "bg-[linear-gradient(90deg,rgba(9,9,11,1)_10%,rgba(9,9,11,0.4)_25%,transparent_45%)]"
                          : "bg-[linear-gradient(90deg,rgba(255,255,255,1)_10%,rgba(255,255,255,0.4)_25%,transparent_45%)]"
                      }`}
                      aria-hidden="true"
                    />
                  </>
                ) : null}
                <div className="relative z-10">
                  <div className={`text-base font-semibold ${strongTextClass}`}>{item.title}</div>
                  <div className={`mt-3 text-xs leading-6 ${subduedTextClass}`}>{item.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    ) : null;

  const renderAgentTemplatePage = () => (
    <div className={`h-full w-full overflow-hidden flex flex-col transition-colors ${
      isDark ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-900"
    }`}>
      <header className={`h-14 flex items-center px-4 shrink-0 transition-colors z-20 relative shadow-sm ${
        isDark ? "bg-zinc-950 border-b border-zinc-800" : "bg-white border-b border-zinc-200"
      }`}>
        <div className="flex items-center gap-3">
          <button
            className={`p-1.5 -ml-1 rounded-md transition-colors ${
              isDark ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
            }`}
            title="返回智能体列表"
            onClick={closeAgentTemplatePage}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 min-w-[120px] ml-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className={`text-[15px] font-semibold tracking-wide ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>
              选择场景模板
            </div>
            <div className={`mt-0.5 text-[11px] ${subduedTextClass}`}>
              左侧浏览模板详情，右侧直接预览通话效果，整个交互与智能体编排保持一致。
            </div>
          </div>
          <button type="button" onClick={handleUseAgentTemplate} className={primaryButtonClass}>使用该模板</button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full w-full">
          <Panel defaultSize={64} minSize={30} className="relative z-10">
            <div className={`h-full overflow-y-auto px-6 py-6 md:px-8 [scrollbar-width:thin] ${
              isDark ? "[scrollbar-color:#3f3f46_transparent]" : "[scrollbar-color:#d4d4d8_transparent]"
            }`}>
              <div className="mx-auto max-w-5xl space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className={`text-sm font-semibold ${strongTextClass}`}>模板列表</div>
                      <div className={`mt-1 text-xs ${subduedTextClass}`}>选择一个场景模板，右侧会同步更新预览效果。</div>
                    </div>
                    <div className={`shrink-0 text-[11px] ${subduedTextClass}`}>{agentTemplates.length} 个模板</div>
                  </div>

                  <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {agentTemplates.map((template, index) => {
                      const active = template.id === selectedAgentTemplateId;
                      const cardThemes = [
                        { glow: isDark ? "from-blue-500/20 via-cyan-500/10 to-zinc-950" : "from-blue-50 via-cyan-50 to-white" },
                        { glow: isDark ? "from-pink-500/20 via-violet-500/10 to-zinc-950" : "from-pink-50 via-violet-50 to-white" },
                        { glow: isDark ? "from-purple-500/20 via-rose-500/10 to-zinc-950" : "from-purple-50 via-rose-50 to-white" },
                        { glow: isDark ? "from-orange-500/20 via-amber-500/10 to-zinc-950" : "from-orange-50 via-amber-50 to-white" },
                        { glow: isDark ? "from-cyan-500/20 via-sky-500/10 to-zinc-950" : "from-cyan-50 via-sky-50 to-white" },
                      ];
                      const currentTheme = cardThemes[index % cardThemes.length];

                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => setSelectedAgentTemplateId(template.id)}
                          className={`min-w-[220px] max-w-[220px] rounded-2xl bg-gradient-to-br px-4 py-3 text-left transition-all ${
                            currentTheme.glow
                          } ${
                            active
                              ? isDark
                                ? "shadow-[0_10px_30px_rgba(59,130,246,0.16)]"
                                : "shadow-[0_10px_30px_rgba(96,165,250,0.18)]"
                              : isDark
                                ? "hover:shadow-[0_8px_24px_rgba(24,24,27,0.36)]"
                                : "hover:shadow-[0_8px_24px_rgba(148,163,184,0.18)]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`text-sm font-semibold ${strongTextClass}`}>{template.name}</div>
                              <div className={`mt-0.5 line-clamp-1 text-[11px] ${subduedTextClass}`}>{template.summary}</div>
                            </div>
                            {active ? (
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-600"
                              }`}>
                                当前
                              </span>
                            ) : (
                              <Bot className={`h-4 w-4 shrink-0 ${isDark ? "text-zinc-500" : "text-zinc-400"}`} />
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {template.scene
                              .split("、")
                              .map((scene) => scene.trim())
                              .filter(Boolean)
                              .map((scene) => (
                                <span
                                  key={scene}
                                  className={`rounded-full px-2 py-0.5 text-[10px] leading-4 ${
                                    isDark ? "bg-zinc-950/70 text-zinc-300" : "bg-white/80 text-zinc-600"
                                  }`}
                                >
                                  {scene}
                                </span>
                              ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 ${
                  isDark
                    ? "border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-zinc-950 to-zinc-950"
                    : "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50"
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white">场景模板</span>
                        <span className={`text-[11px] ${subduedTextClass}`}>右侧实时预览</span>
                      </div>
                      <div className={`mt-4 text-xl font-semibold ${strongTextClass}`}>{selectedAgentTemplate.name}</div>
                      <div className={`mt-2 text-sm ${subduedTextClass}`}>{selectedAgentTemplate.summary}</div>
                    </div>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-100 text-blue-600"
                    }`}>
                      <Bot className="h-5 w-5" />
                    </div>
                  </div>
                  <div className={`mt-4 text-[13px] leading-6 ${subduedTextClass}`}>{selectedAgentTemplate.description}</div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      { icon: Settings2, label: "模型", value: formatManagedModelLabel(selectedAgentTemplate.model) },
                      { icon: AudioLines, label: "音色", value: formatManagedVoiceLabel(selectedAgentTemplate.voice) },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className={`rounded-xl border px-4 py-3 ${
                            isDark ? "border-zinc-800 bg-zinc-950/80" : "border-white/80 bg-white/80"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                            <span className={`text-xs ${subduedTextClass}`}>{item.label}</span>
                          </div>
                          <div className={`mt-2 break-words text-[13px] leading-6 ${strongTextClass}`}>{item.value}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 grid gap-3">
                    {[
                      { label: "Prompt", value: selectedAgentTemplate.prompt },
                      { label: "欢迎语", value: selectedAgentTemplate.welcomeMessage },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`rounded-xl border px-4 py-3 ${
                          isDark ? "border-zinc-800 bg-zinc-950/80" : "border-white/80 bg-white/80"
                        }`}
                      >
                        <div className={`text-xs ${subduedTextClass}`}>{item.label}</div>
                        <div className={`mt-2 text-[13px] leading-6 ${strongTextClass}`}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "高级功能",
                      description: "默认启用的互动与智能能力",
                      values: selectedAgentTemplate.features,
                      icon: ShieldCheck,
                    },
                    {
                      title: "工具",
                      description: "可直接调用的外部能力与 MCP 工具",
                      values: selectedAgentTemplate.tools,
                      icon: Boxes,
                    },
                    {
                      title: "Skill",
                      description: "模板内置的推理与处理能力",
                      values: selectedAgentTemplate.skills,
                      icon: GitBranch,
                    },
                  ].map((group) => {
                    const Icon = group.icon;
                    return (
                      <div key={group.title} className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-white/90"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
                              <div className={`text-sm font-medium ${strongTextClass}`}>{group.title}</div>
                            </div>
                            <div className={`mt-1 text-xs ${subduedTextClass}`}>{group.description}</div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-500"}`}>
                            {group.values.length} 项
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
          </Panel>

          <Separator className="relative w-2 cursor-col-resize group flex items-center justify-center z-20">
            <div className={`w-[1px] h-full transition-all duration-300 ease-out ${
              isDark
                ? "bg-zinc-800 group-hover:bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] group-active:bg-blue-400"
                : "bg-zinc-200 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.6)] group-active:bg-blue-500"
            }`} />
          </Separator>

          <Panel defaultSize={36} minSize={24} className="relative z-10">
            <PreviewPanel onOpenAssistant={() => ensureCatalogAssistantOpen("agent")} />
          </Panel>
        </Group>
      </div>
    </div>
  );

  const renderAgentNameDialog = () =>
    agentNameDialogMode ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>
                {agentNameDialogMode === "template" ? "使用场景模板创建智能体" : "创建自定义智能体"}
              </div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>
                {agentNameDialogMode === "template"
                  ? `当前模板：${selectedAgentTemplate.name}。输入新智能体名称后即可保存到“我的智能体”。`
                  : "输入名称和描述后保存，并自动进入智能体编排和调试页面。"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAgentNameDialogMode(null);
                setAgentDescriptionInput("");
              }}
              className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>智能体名称</div>
              <input
                value={agentNameInput}
                onChange={(event) => setAgentNameInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleConfirmAgentName();
                  }
                }}
                className={dialogInputClass}
              />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>描述</div>
              <textarea
                value={agentDescriptionInput}
                onChange={(event) => setAgentDescriptionInput(event.target.value)}
                rows={3}
                className={dialogTextareaClass}
                placeholder="输入智能体描述"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setAgentNameDialogMode(null);
                setAgentDescriptionInput("");
              }}
              className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}
            >
              取消
            </button>
            <button type="button" onClick={handleConfirmAgentName} className={primaryButtonClass}>确认保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderCreateAppDialog = () =>
    createAppDialog.open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>创建应用</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>输入应用名称后保存，系统会自动生成 AppID 与主 AppKey。</div>
            </div>
            <button
              type="button"
              onClick={() => setCreateAppDialog({ open: false, name: "" })}
              className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>应用名称</div>
              <input
                value={createAppDialog.name}
                onChange={(event) => setCreateAppDialog((current) => ({ ...current, name: event.target.value }))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleConfirmCreateAppKey();
                  }
                }}
                className={dialogInputClass}
                placeholder="输入应用名称"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateAppDialog({ open: false, name: "" })}
              className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}
            >
              取消
            </button>
            <button type="button" onClick={handleConfirmCreateAppKey} className={primaryButtonClass}>确认保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderCreateBusinessDialog = () =>
    createBusinessDialog ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>新增业务标识</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>为应用“{createBusinessDialog.appName}”填写业务标识名称和 BusinessID。</div>
            </div>
            <button
              type="button"
              onClick={() => setCreateBusinessDialog(null)}
              className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>业务标识名称</div>
              <input
                value={createBusinessDialog.name}
                onChange={(event) =>
                  setCreateBusinessDialog((current) => (current ? { ...current, name: event.target.value } : current))
                }
                className={dialogInputClass}
                placeholder="输入业务标识名称"
              />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>BusinessID</div>
              <input
                value={createBusinessDialog.businessId}
                onChange={(event) =>
                  setCreateBusinessDialog((current) => (current ? { ...current, businessId: event.target.value } : current))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleConfirmCreateBusinessId();
                  }
                }}
                className={dialogInputClass}
                placeholder="输入 BusinessID"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateBusinessDialog(null)}
              className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}
            >
              取消
            </button>
            <button type="button" onClick={handleConfirmCreateBusinessId} className={primaryButtonClass}>确认保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderEditAppDialog = () =>
    editAppDialog ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>编辑应用名称</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>修改应用名称后保存，不会影响 AppID 和 AppKey。</div>
            </div>
            <button
              type="button"
              onClick={() => setEditAppDialog(null)}
              className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>应用名称</div>
              <input
                value={editAppDialog.name}
                onChange={(event) => setEditAppDialog((current) => (current ? { ...current, name: event.target.value } : current))}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleConfirmEditAppKey();
                  }
                }}
                className={dialogInputClass}
                placeholder="输入应用名称"
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditAppDialog(null)}
              className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}
            >
              取消
            </button>
            <button type="button" onClick={handleConfirmEditAppKey} className={primaryButtonClass}>确认保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderEditBusinessDialog = () =>
    editBusinessDialog ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className={`text-lg font-semibold ${strongTextClass}`}>编辑业务标识名称</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>修改应用“{editBusinessDialog.appName}”下的业务标识名称，BusinessID 不可编辑。</div>
            </div>
            <button
              type="button"
              onClick={() => setEditBusinessDialog(null)}
              className={`rounded-md p-1.5 ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>业务标识名称</div>
              <input
                value={editBusinessDialog.name}
                onChange={(event) =>
                  setEditBusinessDialog((current) => (current ? { ...current, name: event.target.value } : current))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleConfirmEditBusinessId();
                  }
                }}
                className={dialogInputClass}
                placeholder="输入业务标识名称"
              />
            </label>
            <label className="block">
              <div className={`mb-2 text-xs font-medium ${subduedTextClass}`}>BusinessID</div>
              <input
                value={editBusinessDialog.businessId}
                readOnly
                className={`${dialogInputClass} ${isDark ? "cursor-not-allowed bg-zinc-900 text-zinc-400" : "cursor-not-allowed bg-zinc-50 text-zinc-500"}`}
              />
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditBusinessDialog(null)}
              className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}
            >
              取消
            </button>
            <button type="button" onClick={handleConfirmEditBusinessId} className={primaryButtonClass}>确认保存</button>
          </div>
        </div>
      </div>
    ) : null;

  const renderDeleteDialog = () =>
    pendingDeleteDialog ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
        <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${surfaceClass}`}>
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              isDark ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-500"
            }`}>
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-lg font-semibold ${strongTextClass}`}>{pendingDeleteDialog.title}</div>
              <div className={`mt-2 text-sm leading-6 ${subduedTextClass}`}>
                {pendingDeleteDialog.description}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPendingDeleteDialog(null)}
              className={`rounded-xl px-4 py-2 text-sm ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteDialog}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isDark ? "bg-red-500/10 text-red-300 hover:bg-red-500/15" : "bg-red-50 text-red-500 hover:bg-red-100"
              }`}
            >
              {pendingDeleteDialog.confirmLabel ?? "确认删除"}
            </button>
          </div>
        </div>
      </div>
    ) : null;

  const renderAgents = () => (
    <div className="grid gap-5 xl:grid-cols-3 md:grid-cols-2">
      {agentList.map((agent) => (
        <div
          key={agent.id}
          className={`group relative flex h-full min-h-[192px] flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
            isDark
              ? "border-zinc-800 bg-zinc-900/70 shadow-sm hover:border-blue-500/40 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.2),0_18px_40px_rgba(37,99,235,0.18)]"
              : "border-zinc-200 bg-white shadow-sm hover:border-blue-300 hover:shadow-[0_0_0_1px_rgba(96,165,250,0.35),0_18px_40px_rgba(96,165,250,0.18)]"
          }`}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => openAgent(agent)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openAgent(agent);
              }
            }}
            className="flex h-full w-full flex-1 flex-col text-left"
          >
            <div className={`bg-gradient-to-br px-4 py-2.5 ${
              isDark ? "from-blue-500/12 via-zinc-900 to-zinc-900" : "from-blue-50 via-white to-violet-50"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-base font-semibold ${strongTextClass}`}>{agent.name}</div>
                  <div className={`mt-1 inline-flex items-center gap-1.5 text-xs ${subduedTextClass}`}>
                    <span>{`BotId：${agent.botId}`}</span>
                    <button
                      type="button"
                      onClick={(event) => void handleCopyAgentBotId(event, agent.id, agent.botId)}
                      className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors ${
                        isDark
                          ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      }`}
                      title={copiedAgentId === agent.id ? "已复制" : "复制 BotId"}
                      aria-label={copiedAgentId === agent.id ? "已复制" : "复制 BotId"}
                    >
                      {copiedAgentId === agent.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className={`flex flex-1 flex-col justify-between border-t px-4 py-2.5 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-100 bg-white"}`}>
              <div className="space-y-2">
                {[
                  { label: "模型", value: formatManagedModelLabel(agent.model) },
                  { label: "音色", value: formatManagedVoiceLabel(agent.voice) },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2 text-[11px] leading-5">
                    <span className={`shrink-0 ${subduedTextClass}`}>{item.label}</span>
                    <span className={`min-w-0 flex-1 ${strongTextClass}`}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div className={`mt-3 flex justify-end text-[11px] ${subduedTextClass}`}>
                <span>{`最后更新于 ${agent.updatedAt}`}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            data-agent-action-menu="true"
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              setAgentActionMenuId((current) => (current === agent.id ? null : agent.id));
            }}
            className={`absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
              isDark
                ? "text-zinc-500 hover:bg-zinc-900/80 hover:text-zinc-200"
                : "text-zinc-400 hover:bg-white/90 hover:text-zinc-700"
            }`}
            title="更多操作"
            aria-label="更多操作"
          >
            <EllipsisVertical className="h-4 w-4" />
          </button>
          {agentActionMenuId === agent.id ? (
            <div
              data-agent-action-menu="true"
              className={`absolute right-3 top-11 z-10 min-w-[100px] overflow-hidden rounded-lg border shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                isDark 
                  ? "border-zinc-800 bg-zinc-950/95 backdrop-blur-md" 
                  : "border-zinc-200 bg-white/95 backdrop-blur-md"
              }`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                data-agent-action-menu="true"
                onPointerDown={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  setAgentActionMenuId(null);
                  handleDeleteAgent(agent);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors ${
                  isDark
                    ? "text-red-400 hover:text-red-300"
                    : "text-red-500 hover:text-red-600"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="font-medium">删除</span>
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  const renderVoices = () => (
    <div>
      <div className={`mb-6 text-lg font-semibold ${strongTextClass}`}>声音列表</div>
      <div className="grid gap-5 xl:grid-cols-3 md:grid-cols-2">
        {voiceProfiles.map((voice) => (
          <div
            key={voice.id}
            className={`rounded-2xl border px-5 py-5 shadow-sm ${surfaceClass}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/60 bg-gradient-to-br from-blue-50 to-violet-50 text-blue-600 dark:from-blue-500/10 dark:to-violet-500/10 dark:text-blue-400">
                  <AudioLines className="h-6 w-6" />
                </div>
                <div>
                  <div className={`text-xl font-semibold leading-none ${strongTextClass}`}>
                    {voice.name}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {voice.expired && (
                      <span className="rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        已过期
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs ${subduedTextClass}`}>
              <span>声音ID：{voice.voiceId}</span>
              <span>剩 {voice.remainingCount} 次</span>
            </div>
            <div className={`mt-6 text-xs ${subduedTextClass}`}>{voice.expireAt}</div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleEditVoice(voice.id, voice.name)}
                className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => handleRenewVoice(voice.id)}
                className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
              >
                续期
              </button>
              <button
                type="button"
                onClick={handleCloneVoice}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500 px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
              >
                <Copy className="h-4 w-4" />
                复刻音色
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-4">
      {toolList.map((tool) => (
        <div
          key={tool.id}
          className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`text-base font-semibold ${strongTextClass}`}>{tool.name}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>{tool.type} · {tool.endpoint}</div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                tool.status === "已启用"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : tool.status === "维护中"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {tool.status}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleEditTool(tool)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              <Pencil className="h-4 w-4" />
              编辑
            </button>
            <button
              type="button"
              onClick={() => window.alert(`MCP 详情\n\n名称：${tool.name}\n类型：${tool.type}\n地址：${tool.endpoint}`)}
              className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              查看
            </button>
            <button
              type="button"
              onClick={() => handleDeleteTool(tool)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderKnowledgeBases = () => (
    <div className="space-y-4">
      {knowledgeBaseList.map((knowledge) => (
        <div
          key={knowledge.id}
          className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`text-base font-semibold ${strongTextClass}`}>{knowledge.name}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>
                {knowledge.type} · {knowledge.documentCount} 篇文档
              </div>
            </div>
            <div className="text-right">
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  knowledge.status === "已启用"
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : knowledge.status === "构建中"
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {knowledge.status}
              </span>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>最近更新：{knowledge.updatedAt}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleEditKnowledgeBase(knowledge)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              <Pencil className="h-4 w-4" />
              编辑
            </button>
            <button
              type="button"
              onClick={() =>
                window.alert(
                  `知识库详情\n\n名称：${knowledge.name}\n类型：${knowledge.type}\n文档数：${knowledge.documentCount}\n状态：${knowledge.status}`
                )
              }
              className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              查看
            </button>
            <button
              type="button"
              onClick={() =>
                updateKnowledgeBase(knowledge.id, {
                  status: knowledge.status === "已启用" ? "构建中" : "已启用",
                  updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
                })
              }
              className="rounded-lg border border-blue-500 px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
            >
              {knowledge.status === "已启用" ? "重建索引" : "启用"}
            </button>
            <button
              type="button"
              onClick={() => handleDeleteKnowledgeBase(knowledge)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      {skillList.map((skill) => (
        <div
          key={skill.id}
          className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`text-base font-semibold ${strongTextClass}`}>{skill.name}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>
                {skill.category} · {skill.model}
              </div>
            </div>
            <span className={`text-xs ${subduedTextClass}`}>最近更新：{skill.updatedAt}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleEditSkill(skill)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              <Pencil className="h-4 w-4" />
              编辑
            </button>
            <button
              type="button"
              onClick={() => window.alert(`Skill 详情\n\n名称：${skill.name}\n分类：${skill.category}\n模型：${skill.model}`)}
              className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}
            >
              查看
            </button>
            <button
              type="button"
              onClick={() => handleDeleteSkill(skill)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUsage = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "总调用量", value: "328,420", hint: "近 30 天" },
          { label: "音频分钟数", value: "92,180", hint: "较上月 +12%" },
          { label: "TTS 合成次数", value: "148,300", hint: "较上月 +8%" },
          { label: "错误率", value: "0.42%", hint: "近 7 天" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>按 AppID 统计</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>`app_10001`</span><span>178,220 次调用</span></div>
            <div className="flex items-center justify-between"><span>`app_10002`</span><span>92,610 次调用</span></div>
            <div className="flex items-center justify-between"><span>`app_10003`</span><span>57,590 次调用</span></div>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>按智能体 ID 统计</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>`xbotW7e-awjX`</span><span>104,220 次调用</span></div>
            <div className="flex items-center justify-between"><span>`xbotSeHAMdSAu`</span><span>83,910 次调用</span></div>
            <div className="flex items-center justify-between"><span>`xbotQi1FDswxA`</span><span>62,180 次调用</span></div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
        <div className={`flex flex-wrap items-center gap-2 text-xs ${subduedTextClass}`}>
          <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">筛选维度：AppID</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">时间：近 7 天</span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">粒度：日</span>
        </div>
      </div>
    </div>
  );

  const renderQualityAnalysis = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "平均 MOS", value: "4.5", hint: "近 7 天" },
          { label: "卡顿率", value: "0.8%", hint: "较上周 -0.2%" },
          { label: "丢包率", value: "0.35%", hint: "链路稳定" },
          { label: "异常会话", value: "126", hint: "需重点排查" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>质量分布</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>优秀</span><span>68%</span></div>
            <div className="flex items-center justify-between"><span>良好</span><span>23%</span></div>
            <div className="flex items-center justify-between"><span>一般</span><span>7%</span></div>
            <div className="flex items-center justify-between"><span>异常</span><span>2%</span></div>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>异常类型</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>回声 / 啸叫</span><span>54 次</span></div>
            <div className="flex items-center justify-between"><span>弱网抖动</span><span>39 次</span></div>
            <div className="flex items-center justify-between"><span>识别偏差</span><span>21 次</span></div>
            <div className="flex items-center justify-between"><span>播报中断</span><span>12 次</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperationsAnalysis = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "应用数", value: "28", hint: "当前接入应用" },
          { label: "智能体数", value: "146", hint: "已创建智能体" },
          { label: "通话次数", value: "82,431", hint: "近 30 天累计" },
          { label: "活跃用户", value: "12,804", hint: "近 30 天活跃" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>应用与智能体分布</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>直播互动助手</span><span>32 个智能体</span></div>
            <div className="flex items-center justify-between"><span>客服热线</span><span>28 个智能体</span></div>
            <div className="flex items-center justify-between"><span>门店导购</span><span>21 个智能体</span></div>
            <div className="flex items-center justify-between"><span>企业前台</span><span>16 个智能体</span></div>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>活跃趋势</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>周活跃用户</span><span>8,426</span></div>
            <div className="flex items-center justify-between"><span>新增用户</span><span>1,254</span></div>
            <div className="flex items-center justify-between"><span>平均通话时长</span><span>4分18秒</span></div>
            <div className="flex items-center justify-between"><span>人均调用次数</span><span>6.4 次</span></div>
          </div>
        </div>
      </div>
      <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
        <div className={`text-base font-semibold ${strongTextClass}`}>运营洞察</div>
        <div className={`mt-4 grid gap-3 md:grid-cols-3 text-xs ${subduedTextClass}`}>
          <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`}>
            近 7 天通话次数环比上涨 12.8%，主要增长来自客服热线和门店导购场景。
          </div>
          <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`}>
            活跃用户峰值集中在工作日 10:00-12:00 与 19:00-21:00，适合做容量和运营活动规划。
          </div>
          <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50"}`}>
            Top 3 应用贡献了 68% 的调用量，建议优先跟踪这些应用的留存、转化与质量波动。
          </div>
        </div>
      </div>
    </div>
  );

  const renderLatencyAnalysis = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "首包延时", value: "182ms", hint: "近 7 天均值" },
          { label: "ASR 延时", value: "236ms", hint: "较昨日 -12ms" },
          { label: "LLM 延时", value: "824ms", hint: "主要耗时段" },
          { label: "TTS 延时", value: "301ms", hint: "首句播放前" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>
      <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
        <div className={`text-base font-semibold ${strongTextClass}`}>链路延时拆解</div>
        <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
          <div className="flex items-center justify-between"><span>采集到上传</span><span>46ms</span></div>
          <div className="flex items-center justify-between"><span>上传到识别</span><span>190ms</span></div>
          <div className="flex items-center justify-between"><span>识别到推理</span><span>236ms</span></div>
          <div className="flex items-center justify-between"><span>推理到合成</span><span>824ms</span></div>
          <div className="flex items-center justify-between"><span>合成到播报</span><span>301ms</span></div>
        </div>
      </div>
    </div>
  );

  const renderLogAnalysis = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "日志总量", value: "1,284,320", hint: "近 7 天" },
          { label: "错误日志", value: "1,286", hint: "错误率 0.10%" },
          { label: "告警事件", value: "94", hint: "需重点关注" },
          { label: "会话检索耗时", value: "126ms", hint: "平均值" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>高频错误</div>
          <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
            <div className="flex items-center justify-between"><span>鉴权失败</span><span>412 次</span></div>
            <div className="flex items-center justify-between"><span>工具调用超时</span><span>275 次</span></div>
            <div className="flex items-center justify-between"><span>知识检索为空</span><span>198 次</span></div>
            <div className="flex items-center justify-between"><span>TTS 返回异常</span><span>104 次</span></div>
          </div>
        </div>
        <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>检索条件</div>
          <div className={`mt-4 flex flex-wrap gap-2 text-xs ${subduedTextClass}`}>
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">会话ID</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">AppID</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">智能体ID</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">错误码</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">时间范围</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAiDevTools = () => (
    <div className="grid gap-4 xl:grid-cols-3">
        {[
          { title: "TRAE / Codex / Cursor / VS Code", desc: "通过插件或 MCP 方式快速接入 Agent 调试与调用能力", action: "查看接入指南" },
        { title: "JetBrains", desc: "支持 IntelliJ 系列开发工具的本地联调与配置同步", action: "配置 IDE" },
        { title: "CLI / SDK", desc: "通过命令行和 SDK 集成到本地开发、CI/CD 与自动化流程", action: "获取示例" },
      ].map((item) => (
        <div key={item.title} className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}>
          <div className={`text-base font-semibold ${strongTextClass}`}>{item.title}</div>
          <div className={`mt-2 text-xs leading-6 ${subduedTextClass}`}>{item.desc}</div>
          <button type="button" onClick={() => window.alert(`${item.title}\n\n${item.desc}`)} className={`mt-5 ${primaryButtonClass} px-4 py-2 text-xs`}>{item.action}</button>
        </div>
      ))}
    </div>
  );

  const renderEnvVars = () => (
    <div className="space-y-4">
      {[
        { env: "开发环境", key: "CONVOAI_BASE_URL", value: "https://open-dev.volcengineapi.com", scope: "dev" },
        { env: "测试环境", key: "CONVOAI_APP_ID", value: "app_10002", scope: "staging" },
        { env: "生产环境", key: "CONVOAI_ACCESS_TOKEN", value: "已加密存储", scope: "prod" },
      ].map((item) => (
        <div key={item.key} className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`text-base font-semibold ${strongTextClass}`}>{item.key}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>所属环境：{item.env}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>当前值：{item.value}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>{item.scope}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => window.alert(`编辑环境变量：${item.key}`)} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}><Pencil className="h-4 w-4" />编辑</button>
            <button type="button" onClick={() => window.alert(`变量详情\n\n${item.key}\n${item.value}`)} className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>查看</button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVolcengineDeploy = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "部署环境", value: "火山引擎华北 2", hint: "推荐区域" },
          { label: "运行规格", value: "2C4G / 标准型", hint: "支持弹性扩容" },
          { label: "最近发布", value: "2026-05-14 19:40", hint: "发布成功" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-lg font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>
      <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
        <div className={`text-base font-semibold ${strongTextClass}`}>部署流程</div>
        <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
          <div>1. 选择运行环境与资源规格</div>
          <div>2. 绑定 AppID、秘钥和功能配置</div>
          <div>3. 配置知识库、工具和技能依赖</div>
          <div>4. 一键发布到火山引擎并生成访问地址</div>
        </div>
      </div>
    </div>
  );

  const renderPhoneLineDeploy = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "默认接入方式", value: "SIP 中继", hint: "支持呼入 / 呼出" },
          { label: "线路状态", value: "3 条已接通", hint: "1 条待验证" },
          { label: "最近拨测", value: "2026-05-14 20:15", hint: "通话链路正常" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-lg font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>
      <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
        <div className={`text-base font-semibold ${strongTextClass}`}>接入流程</div>
        <div className={`mt-4 space-y-3 text-xs ${subduedTextClass}`}>
          <div>1. 配置电话线路供应商、SIP 域名和鉴权信息</div>
          <div>2. 绑定 AppID、秘钥和服务开通</div>
          <div>3. 设置呼入路由、外呼策略和机器人接待话术</div>
          <div>4. 完成线路拨测后发布到生产环境</div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {[
          { title: "呼入线路", detail: "95013 企业总机", status: "已启用", action: "查看路由" },
          { title: "外呼线路", detail: "华东语音集群", status: "测试中", action: "发起拨测" },
        ].map((item) => (
          <div key={item.title} className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`text-base font-semibold ${strongTextClass}`}>{item.title}</div>
                <div className={`mt-2 text-xs ${subduedTextClass}`}>{item.detail}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${item.status === "已启用" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"}`}>{item.status}</span>
            </div>
            <button type="button" onClick={() => window.alert(`${item.title}\n\n${item.detail}`)} className={`mt-5 ${primaryButtonClass} px-4 py-2 text-xs`}>{item.action}</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAppKeyDetailCard = (item: AppKeyItem) => {
    const enabledFeatureCount = Object.values(item.serviceStatus).filter(Boolean).length;
    const enabledFeatures = FEATURE_CONFIG_TABS.filter((tab) => item.serviceStatus[tab.key]);
    const primarySecretKey = `${item.id}:primary`;
    const secondarySecretKey = `${item.id}:secondary`;
    const isPrimaryVisible = visibleAppSecrets[primarySecretKey];
    const isSecondaryVisible = visibleAppSecrets[secondarySecretKey];

    return (
      <div className="space-y-4">
        <div className="group flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="-my-1 inline-flex min-h-[36px] items-center gap-2 rounded-lg py-1">
              <div className={`text-base font-semibold ${strongTextClass}`}>{item.name}</div>
              <button
                type="button"
                onClick={() => handleEditAppKey(item)}
                className={`${subtleIconButtonClass} min-h-[24px] min-w-[24px] p-1 pointer-events-none translate-y-0.5 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100`}
                title="编辑应用名称"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-2 text-xs md:grid-cols-1">
              <div className={`inline-flex items-center gap-1.5 ${subduedTextClass}`}>
                <span>{`AppID：${item.appId}`}</span>
                <button
                  type="button"
                  onClick={() => void handleCopyAppId(item.id, item.appId)}
                  className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors ${
                    isDark
                      ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  }`}
                  title={copiedAppId === item.id ? "已复制" : "复制 AppID"}
                  aria-label={copiedAppId === item.id ? "已复制" : "复制 AppID"}
                >
                  {copiedAppId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="relative flex items-start gap-2" data-app-action-menu-root="true">
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                item.status === "已启用"
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : item.status === "已禁用"
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {item.status}
            </span>
            <button
              type="button"
              onClick={() => setAppActionMenuId((current) => (current === item.id ? null : item.id))}
              className={subtleIconButtonClass}
              aria-label={`更多操作：${item.name}`}
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
            {appActionMenuId === item.id ? (
              <div
                className={`absolute right-0 top-9 z-10 min-w-[116px] rounded-xl border p-1.5 shadow-lg ${
                  isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleAppStatus(item)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs ${
                    isDark ? "text-zinc-200 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {item.status === "已禁用" ? "启用" : "禁用"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAppKey(item)}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs ${
                    isDark ? "text-red-300 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  删除
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className={`rounded-xl border p-3 ${isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-zinc-50/80"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`text-sm font-semibold ${strongTextClass}`}>AppKey 管理</div>
              <div className="flex flex-wrap items-center gap-1">
                {!item.secondaryAppKey ? (
                  <button
                    type="button"
                    onClick={() => handleAddSecondaryAppKey(item)}
                    className={subtleActionButtonClass}
                  >
                    <Plus className="h-4 w-4" />
                    启用副 AppKey
                  </button>
                ) : null}
              </div>
            </div>

            <div className={`mt-3 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
              <div className="grid gap-2 py-2 md:grid-cols-[1fr,60px,1fr] md:items-center">
                <div
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
                  }`}
                >
                  <div className={`w-14 shrink-0 whitespace-nowrap text-xs font-medium ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>主AppKey</div>
                  <div className={`min-w-0 flex-1 break-all font-mono text-xs ${subduedTextClass}`}>
                    {isPrimaryVisible ? item.primaryAppKey : maskAppSecret(item.primaryAppKey)}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleAppSecretVisibility(primarySecretKey)}
                      className={subtleIconButtonClass}
                      title={isPrimaryVisible ? "隐藏明文" : "显示明文"}
                    >
                      {isPrimaryVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={!item.primaryAppKey}
                      onClick={() => void handleCopyAppSecret(item, "primary", item.primaryAppKey)}
                      className={`inline-flex items-center rounded-lg px-2 py-1.5 transition-colors ${
                        item.primaryAppKey ? subtleIconButtonClass : "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                      }`}
                      title="复制 AppKey"
                    >
                      {copiedAppSecretKey === primarySecretKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleSwitchActiveAppKey(item)}
                    disabled={!item.secondaryAppKey || !item.secondaryAppKeyEnabled}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                      item.secondaryAppKey && item.secondaryAppKeyEnabled
                        ? isDark
                          ? "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        : isDark
                          ? "cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-600"
                          : "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-300"
                    }`}
                    title={item.secondaryAppKey ? (item.secondaryAppKeyEnabled ? "切换主副 AppKey" : "请先启用副 AppKey") : "当前没有副 AppKey"}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div
                  className={`group flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
                  } ${!item.secondaryAppKey ? "opacity-70" : ""}`}
                >
                  <div className={`w-14 shrink-0 whitespace-nowrap text-xs font-medium ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>副AppKey</div>
                  <div className={`min-w-0 flex-1 break-all font-mono text-xs ${subduedTextClass}`}>
                    {item.secondaryAppKey
                      ? isSecondaryVisible
                        ? item.secondaryAppKey
                        : maskAppSecret(item.secondaryAppKey)
                      : "-"}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.secondaryAppKey ? (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.secondaryAppKeyEnabled}
                        aria-label={item.secondaryAppKeyEnabled ? "停用副 AppKey" : "启用副 AppKey"}
                        onClick={() => handleToggleSecondaryAppKey(item)}
                        className={`relative mr-1 inline-flex h-[14px] w-[26px] shrink-0 items-center rounded-full border transition-all duration-200 ease-out ${
                          item.secondaryAppKeyEnabled
                            ? isDark
                              ? "border-blue-400/20 bg-blue-500/80"
                              : "border-blue-500/20 bg-blue-500/80"
                            : isDark
                              ? "border-zinc-700/80 bg-zinc-800"
                              : "border-zinc-300/80 bg-zinc-100"
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-[9px] w-[9px] rounded-full bg-white/95 shadow-none transition-transform duration-200 ease-out ${
                            item.secondaryAppKeyEnabled ? "translate-x-3" : "translate-x-0"
                          }`}
                        />
                      </button>
                    ) : null}
                    {item.secondaryAppKey && !item.secondaryAppKeyEnabled ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteSecondaryAppKey(item)}
                        className={`${dangerActionButtonClass} pointer-events-none translate-y-0.5 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100`}
                        title="删除副 AppKey"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleAppSecretVisibility(secondarySecretKey)}
                      className={subtleIconButtonClass}
                      title={isSecondaryVisible ? "隐藏明文" : "显示明文"}
                      disabled={!item.secondaryAppKey}
                    >
                      {isSecondaryVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      disabled={!item.secondaryAppKey}
                      onClick={() => void handleCopyAppSecret(item, "secondary", item.secondaryAppKey)}
                      className={`inline-flex items-center rounded-lg px-2 py-1.5 transition-colors ${
                        item.secondaryAppKey
                          ? subtleIconButtonClass
                          : "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                      }`}
                      title="复制 AppKey"
                    >
                      {copiedAppSecretKey === secondarySecretKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-zinc-50/80"}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={`text-sm font-semibold ${strongTextClass}`}>Token 管理</div>
                <div className={`mt-1 text-xs ${subduedTextClass}`}>支持临时 Token 生成，以及通用 Token 校验。</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateTempToken(item)}
                  className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    isDark
                      ? "border-blue-400/35 bg-blue-500/10 text-blue-200 hover:border-blue-400/50 hover:bg-blue-500/15"
                      : "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100/80"
                  }`}
                >
                  生成临时 Token
                </button>
                <button
                  type="button"
                  onClick={() => handleValidateTempToken(item)}
                  className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    isDark
                      ? "border-blue-400/35 bg-blue-500/10 text-blue-200 hover:border-blue-400/50 hover:bg-blue-500/15"
                      : "border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-300 hover:bg-blue-100/80"
                  }`}
                >
                  Token 校验
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-zinc-50/80"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-semibold ${strongTextClass}`}>服务开通管理</div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                    {enabledFeatureCount}
                  </span>
                </div>
              </div>
              <div className="mt-4 min-h-[28px]">
                {enabledFeatures.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {enabledFeatures.map((feature) => (
                      <span
                        key={feature.key}
                        className={`rounded-full px-2.5 py-1 text-[11px] ${
                          isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {feature.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={`text-xs ${subduedTextClass}`}>当前还没有已开通服务</div>
                )}
              </div>

              <div className={`mt-4 divide-y ${isDark ? "divide-zinc-800" : "divide-zinc-200"}`}>
                {FEATURE_CONFIG_TABS.map((feature) => {
                  const featureEnabled = item.serviceStatus[feature.key];
                  return (
                    <div key={feature.key} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <div className={`text-sm font-medium ${strongTextClass}`}>{feature.label}</div>
                        <div className={`mt-1 line-clamp-1 text-xs ${subduedTextClass}`}>{feature.description}</div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={featureEnabled}
                        aria-label={featureEnabled ? `关闭${feature.label}` : `开启${feature.label}`}
                        onClick={() => handleToggleAppFeature(item, feature.key)}
                        className={`relative inline-flex h-4 w-[30px] shrink-0 items-center rounded-full border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:ring-offset-2 ${
                          featureEnabled
                            ? isDark
                              ? "border-blue-400/20 bg-blue-500/80"
                              : "border-blue-500/20 bg-blue-500/80"
                            : isDark
                              ? "border-zinc-700/80 bg-zinc-800"
                              : "border-zinc-300/80 bg-zinc-100"
                        } ${isDark ? "focus-visible:ring-offset-zinc-950" : "focus-visible:ring-offset-white"}`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-[11px] w-[11px] rounded-full bg-white/95 shadow-none transition-transform duration-200 ease-out ${
                            featureEnabled ? "translate-x-[13px]" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-zinc-50/80"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`text-sm font-semibold ${strongTextClass}`}>业务标识管理</div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                    {item.businessItems.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCreateBusinessId(item)}
                  className={subtleActionButtonClass}
                >
                  <Plus className="h-4 w-4" />
                  新增业务标识
                </button>
              </div>

              <div className="mt-4">
                {item.businessItems.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {item.businessItems.map((business) => (
                        <span
                          key={business.id}
                          className={`rounded-full px-2.5 py-1 text-[11px] ${
                            isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {business.name}
                        </span>
                      ))}
                    </div>
                    <div className={`mt-4 divide-y ${isDark ? "divide-zinc-800" : "divide-zinc-200"}`}>
                      {item.businessItems.map((business) => (
                        <div key={business.id} className="group flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <div className={`truncate text-sm font-medium ${strongTextClass}`}>{business.name}</div>
                            <div className={`mt-1 inline-flex items-center gap-1.5 text-xs ${subduedTextClass}`}>
                              <span>{`BusinessID：${business.businessId}`}</span>
                              <button
                                type="button"
                                onClick={() => void handleCopyBusinessId(business.id, business.businessId)}
                                className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors ${
                                  isDark
                                    ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                }`}
                                title={copiedBusinessId === business.id ? "已复制" : "复制 BusinessID"}
                                aria-label={copiedBusinessId === business.id ? "已复制" : "复制 BusinessID"}
                              >
                                {copiedBusinessId === business.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditBusinessId(item, business)}
                              className={`${subtleIconButtonClass} pointer-events-none translate-y-0.5 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100`}
                              title="编辑业务标识"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteBusinessId(item, business)}
                              className={`${dangerActionButtonClass} pointer-events-none translate-y-0.5 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100`}
                              title="删除业务标识"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={`text-xs ${subduedTextClass}`}>
                    当前应用还没有业务标识，可新增用于区分不同场景、配置和统计口径。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs">
            <div className={subduedTextClass}>创建时间：{formatDisplayDateTime(item.createdAt)}</div>
            <div className={subduedTextClass}>最后更新时间：{formatDisplayDateTime(item.updatedAt)}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderAppKeys = () => {
    const selectedAppDetail = appKeyList.find((item) => item.id === selectedAppDetailId) ?? null;
    const selectedAppActionMenuItem =
      floatingAppActionMenu && appActionMenuId === floatingAppActionMenu.id
        ? appKeyList.find((item) => item.id === floatingAppActionMenu.id) ?? null
        : null;
    const normalizedSearchQuery = appSearchQuery.trim().toLowerCase();
    const filteredAppKeyList = appKeyList.filter((item) =>
      !normalizedSearchQuery
        ? true
        : `${item.name} ${item.appId}`.toLowerCase().includes(normalizedSearchQuery)
    );

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <label className={`flex w-full max-w-sm items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"}`}>
            <Search className={`h-4 w-4 shrink-0 ${subduedTextClass}`} />
            <input
              value={appSearchQuery}
              onChange={(event) => setAppSearchQuery(event.target.value)}
              placeholder="搜索应用名称或 AppID"
              className={`w-full bg-transparent text-sm outline-none ${
                isDark ? "placeholder:text-zinc-500" : "placeholder:text-zinc-400"
              } ${strongTextClass}`}
            />
          </label>
        </div>

        {appKeyList.length > 0 ? (
          <div className={`rounded-2xl border ${surfaceClass}`}>
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "100px" }} />
                </colgroup>
                <thead className={isDark ? "bg-zinc-950/80" : "bg-zinc-50"}>
                  <tr className={`text-left text-xs ${subduedTextClass}`}>
                    <th
                      className={`sticky left-0 z-10 px-4 py-3 font-medium ${
                        isDark ? "bg-zinc-950/80" : "bg-zinc-50"
                      }`}
                    >
                      应用名称
                    </th>
                    <th className="px-4 py-3 font-medium">AppID</th>
                    <th className="px-4 py-3 font-medium">主AppKey</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">服务开通</th>
                    <th className="px-4 py-3 font-medium">业务标识</th>
                    <th className="px-4 py-3 font-medium">创建时间</th>
                    <th
                      className={`sticky right-0 z-10 w-[100px] px-3 py-3 text-center font-medium ${
                        isDark ? "bg-zinc-950/80" : "bg-zinc-50"
                      }`}
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppKeyList.map((item) => {
                    const enabledFeatures = FEATURE_CONFIG_TABS.filter((tab) => item.serviceStatus[tab.key]);
                    const primarySecretKey = `${item.id}:primary`;
                    const isPrimaryVisible = visibleAppSecrets[primarySecretKey];

                    return (
                      <tr
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setAppActionMenuId(null);
                          setSelectedAppDetailId(item.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setAppActionMenuId(null);
                            setSelectedAppDetailId(item.id);
                          }
                        }}
                        className={`group cursor-pointer border-t text-sm transition-colors ${
                          isDark
                            ? "border-zinc-800 hover:bg-zinc-900/70"
                            : "border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        <td
                          className={`sticky left-0 z-[1] px-4 py-3 ${
                            isDark ? "bg-zinc-950 group-hover:bg-zinc-900/70" : "bg-white group-hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <div className={`min-w-0 truncate text-xs ${strongTextClass}`}>{item.name}</div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditAppKey(item);
                              }}
                              className={`${subtleIconButtonClass} min-h-[24px] min-w-[24px] p-1 pointer-events-none translate-y-0.5 opacity-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-y-0 focus-visible:opacity-100`}
                              title="编辑应用名称"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex max-w-full items-center gap-1.5 text-xs ${subduedTextClass}`}>
                            <span className="truncate">{item.appId}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleCopyAppId(item.id, item.appId);
                              }}
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                                isDark
                                  ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                  : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                              }`}
                              title={copiedAppId === item.id ? "已复制" : "复制 AppID"}
                              aria-label={copiedAppId === item.id ? "已复制" : "复制 AppID"}
                            >
                              {copiedAppId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`inline-flex max-w-full items-center gap-1.5 text-xs font-mono ${subduedTextClass}`}>
                            <span className="truncate">{isPrimaryVisible ? item.primaryAppKey : maskAppSecret(item.primaryAppKey)}</span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleAppSecretVisibility(primarySecretKey);
                              }}
                              disabled={!item.primaryAppKey}
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                                item.primaryAppKey
                                  ? isDark
                                    ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                  : "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                              }`}
                              title={isPrimaryVisible ? "隐藏明文" : "显示明文"}
                              aria-label={isPrimaryVisible ? "隐藏明文" : "显示明文"}
                            >
                              {isPrimaryVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleCopyAppSecret(item, "primary", item.primaryAppKey);
                              }}
                              disabled={!item.primaryAppKey}
                              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors ${
                                item.primaryAppKey
                                  ? isDark
                                    ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                  : "cursor-not-allowed text-zinc-400 dark:text-zinc-600"
                              }`}
                              title={copiedAppSecretKey === primarySecretKey ? "已复制" : "复制主 AppKey"}
                              aria-label={copiedAppSecretKey === primarySecretKey ? "已复制" : "复制主 AppKey"}
                            >
                              {copiedAppSecretKey === primarySecretKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs ${
                              item.status === "已启用"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : item.status === "已禁用"
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {enabledFeatures.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {enabledFeatures.slice(0, 3).map((feature) => (
                                <span
                                  key={feature.key}
                                  className={`rounded-full px-2.5 py-1 text-[11px] ${
                                    isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                                  }`}
                                >
                                  {feature.label}
                                </span>
                              ))}
                              {enabledFeatures.length > 3 ? (
                                <span className={`rounded-full px-2.5 py-1 text-[11px] ${subduedTextClass}`}>
                                  +{enabledFeatures.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className={`text-xs ${subduedTextClass}`}>-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {item.businessItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {item.businessItems.slice(0, 3).map((business) => (
                                <span
                                  key={business.id}
                                  className={`rounded-full px-2.5 py-1 text-[11px] ${
                                    isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                                  }`}
                                >
                                  {business.name}
                                </span>
                              ))}
                              {item.businessItems.length > 3 ? (
                                <span className={`rounded-full px-2.5 py-1 text-[11px] ${subduedTextClass}`}>
                                  +{item.businessItems.length - 3}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className={`text-xs ${subduedTextClass}`}>-</span>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-xs ${subduedTextClass}`}>{formatDisplayDateTime(item.createdAt)}</td>
                        <td
                          className={`sticky right-0 z-[1] px-3 pr-2 py-3 ${
                            isDark ? "bg-zinc-950 group-hover:bg-zinc-900/70" : "bg-white group-hover:bg-zinc-50"
                          }`}
                        >
                          <div className="relative flex justify-center" data-app-action-menu-root="true">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (appActionMenuId === item.id) {
                                  setAppActionMenuId(null);
                                  setFloatingAppActionMenu(null);
                                  return;
                                }
                                const rect = event.currentTarget.getBoundingClientRect();
                                setAppActionMenuId(item.id);
                                setFloatingAppActionMenu({
                                  id: item.id,
                                  top: rect.bottom + 6,
                                  left: rect.right,
                                });
                              }}
                              className={subtleIconButtonClass}
                              aria-label={`操作：${item.name}`}
                            >
                              <EllipsisVertical className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {appKeyList.length > 0 && filteredAppKeyList.length === 0 ? (
          <div className={`rounded-2xl border px-6 py-12 text-center text-sm ${surfaceClass} ${subduedTextClass}`}>
            没有找到匹配的应用，请尝试按应用名称或 AppID 搜索。
          </div>
        ) : (
          appKeyList.length === 0 ? (
            <div className={`rounded-2xl border px-6 py-12 text-center text-sm ${surfaceClass} ${subduedTextClass}`}>
              当前还没有应用，点击右上角“创建应用”开始接入。
            </div>
          ) : null
        )}

        {selectedAppActionMenuItem && floatingAppActionMenu
          ? createPortal(
              <div
                data-app-action-menu-root="true"
                className={`fixed z-[70] w-max min-w-0 -translate-x-full rounded-lg border p-0.5 shadow-lg ${
                  isDark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
                }`}
                style={{
                  top: floatingAppActionMenu.top,
                  left: floatingAppActionMenu.left,
                }}
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleGenerateTempToken(selectedAppActionMenuItem);
                    setAppActionMenuId(null);
                  }}
                  className={`flex w-full items-center whitespace-nowrap rounded-md px-2 py-1 text-left text-[11px] leading-4 ${
                    isDark ? "text-zinc-200 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  生成临时 Token
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleValidateTempToken(selectedAppActionMenuItem);
                    setAppActionMenuId(null);
                  }}
                  className={`flex w-full items-center whitespace-nowrap rounded-md px-2 py-1 text-left text-[11px] leading-4 ${
                    isDark ? "text-zinc-200 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Token 校验
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleToggleAppStatus(selectedAppActionMenuItem);
                  }}
                  className={`flex w-full items-center whitespace-nowrap rounded-md px-2 py-1 text-left text-[11px] leading-4 ${
                    isDark ? "text-zinc-200 hover:bg-zinc-800" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {selectedAppActionMenuItem.status === "已禁用" ? "启用" : "禁用"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteAppKey(selectedAppActionMenuItem);
                  }}
                  className={`flex w-full items-center whitespace-nowrap rounded-md px-2 py-1 text-left text-[11px] leading-4 ${
                    isDark ? "text-red-300 hover:bg-red-500/10" : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  删除
                </button>
              </div>,
              document.body
            )
          : null}

        {selectedAppDetail ? (
          <div className="fixed inset-x-0 bottom-0 -top-6 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/35"
              onClick={() => {
                setSelectedAppDetailId(null);
                setAppActionMenuId(null);
              }}
              aria-label="关闭应用详情"
            />
            <div
              className={`absolute inset-y-0 right-0 w-full max-w-[920px] border-l shadow-2xl ${
                isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto p-6 pt-4">
                  {renderAppKeyDetailCard(selectedAppDetail)}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderResourcePackages = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "资源总数", value: String(resourceList.length), hint: "已统一托管" },
          { label: "大模型资源", value: String(resourceList.filter((item) => item.kind === "LLM").length), hint: "模型接入点" },
          { label: "语音识别资源", value: String(resourceList.filter((item) => item.kind === "ASR").length), hint: "语音识别链路" },
          { label: "语音合成资源", value: String(resourceList.filter((item) => item.kind === "TTS").length), hint: "音色与合成" },
        ].map((metric) => (
          <div key={metric.label} className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className={`text-xs ${subduedTextClass}`}>{metric.label}</div>
            <div className={`mt-3 text-2xl font-semibold ${strongTextClass}`}>{metric.value}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{metric.hint}</div>
          </div>
        ))}
      </div>

      <div className={`rounded-2xl border p-4 ${surfaceClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <div className={`text-sm font-semibold ${strongTextClass}`}>按类型查看</div>
            <div className="flex flex-wrap gap-2">
              {(["全部", "LLM", "ASR", "TTS"] as ResourceFilter[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setResourceFilter(item)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${pageFilterButtonFocusClass} ${
                      resourceFilter === item
                        ? isDark
                          ? "border-blue-500/60 bg-blue-500/15 text-blue-300"
                          : "border-blue-400 bg-blue-50 text-blue-600"
                        : isDark
                        ? "border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {item === "全部" ? item : RESOURCE_KIND_LABEL[item]}
                </button>
              ))}
            </div>
          </div>
          <div className={`text-xs ${subduedTextClass}`}>智能体编辑页会直接复用这里维护的供应商、模型和音色选项。</div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredResourceBindings.map(({ resource, boundAgents }) => {
          const template = getResourceProviderTemplate(resource.providerKey);
          const capabilityLabel =
            resource.kind === "TTS"
              ? resource.voiceOptions.map((item) => item.label).join("、")
              : resource.modelOptions.map((item) => item.value).join("、");
          return (
            <div key={resource.id} className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`text-base font-semibold ${strongTextClass}`}>{resource.name}</div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                      {RESOURCE_KIND_LABEL[resource.kind]}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] ${resource.status === "已启用" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300" : resource.status === "停用" ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-300" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                      {resource.status}
                    </span>
                  </div>
                  <div className={`mt-2 text-xs ${subduedTextClass}`}>{resource.providerLabel} · {template?.description}</div>
                  <div className={`mt-2 text-xs break-all ${subduedTextClass}`}>接入地址：{resource.endpoint}</div>
                </div>
                <div className={`text-right text-xs ${subduedTextClass}`}>
                  <div>最近更新：{resource.updatedAt}</div>
                  <div className="mt-2">被 {boundAgents.length} 个智能体引用</div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
                <div className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/70"}`}>
                  <div className={`text-xs font-medium ${subduedTextClass}`}>典型填写项</div>
                  <div className="mt-3 space-y-2 text-xs">
                    {(template?.fields ?? []).map((field) => (
                      <div key={field.key} className="flex items-start justify-between gap-3">
                        <span className={subduedTextClass}>{field.label}</span>
                        <span className={`text-right ${strongTextClass}`}>{maskCredentialValue(resource.credentialValues[field.key] ?? "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/70"}`}>
                  <div className={`text-xs font-medium ${subduedTextClass}`}>{resource.kind === "TTS" ? "可选音色" : "可选模型"}</div>
                  <div className={`mt-3 text-xs leading-6 ${strongTextClass}`}>{capabilityLabel || "待维护"}</div>
                </div>
                <div className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-zinc-50/70"}`}>
                  <div className={`text-xs font-medium ${subduedTextClass}`}>关联智能体</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {boundAgents.length > 0 ? boundAgents.map((agent) => (
                      <span
                        key={agent.id}
                        className={`rounded-full border px-3 py-1 text-xs ${isDark ? "border-zinc-700 bg-zinc-900 text-zinc-200" : "border-zinc-200 bg-white text-zinc-700"}`}
                      >
                        {agent.name}
                      </span>
                    )) : (
                      <span className={`text-xs ${subduedTextClass}`}>暂未被智能体引用</span>
                    )}
                  </div>
                </div>
              </div>

              {resource.notes ? (
                <div className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-6 ${isDark ? "border-zinc-800 bg-zinc-950 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                  备注：{resource.notes}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => handleEditResource(resource)} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}><Pencil className="h-4 w-4" />编辑</button>
                <button type="button" onClick={() => window.alert(`资源详情\n\n名称：${resource.name}\n类型：${RESOURCE_KIND_LABEL[resource.kind]}\n供应商：${resource.providerLabel}\n地址：${resource.endpoint}\n状态：${resource.status}`)} className={`rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>查看</button>
                <button type="button" onClick={() => handleDeleteResource(resource)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs text-red-500 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" />删除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderLicenses = () => {
    const filteredLicenses = licenseList.filter((item) => {
      const matchesApp = selectedLicenseApp === "全部" || item.bindAppId === selectedLicenseApp;
      const matchesVersion = selectedLicenseVersion === "全部" || item.version === selectedLicenseVersion;
      return matchesApp && matchesVersion;
    });
    const licenseAppOptions = ["全部", ...Array.from(new Set(licenseList.map((item) => item.bindAppId)))];
    const totalCount = filteredLicenses.length;
    const activatedCount = filteredLicenses.filter((item) => item.activationStatus === "已激活").length;
    const pendingCount = filteredLicenses.filter((item) => item.activationStatus === "未激活").length;
    const donutDeg = totalCount === 0 ? 0 : Math.round((activatedCount / totalCount) * 360);
    const resourceUsage = [
      { label: "声音复刻1.0（共 4 个）", progress: 0.99, remaining: "剩余：1%" },
      { label: "声音复刻2.0（共 3 个）", progress: 1, remaining: "剩余：0%" },
    ];

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <div className={`text-[11px] font-medium ${subduedTextClass}`}>当前应用</div>
              <div className="relative">
                <select
                  value={selectedLicenseApp}
                  onChange={(event) => setSelectedLicenseApp(event.target.value)}
                  className={`h-9 min-w-[180px] px-3 pr-8 ${pageSelectBaseClass}`}
                >
                  {licenseAppOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${subduedTextClass}`}>▼</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className={`text-[11px] font-medium ${subduedTextClass}`}>License版本</div>
              <div className="relative">
                <select
                  value={selectedLicenseVersion}
                  onChange={(event) => setSelectedLicenseVersion(event.target.value as "全部" | LicenseItem["version"])}
                  className={`h-9 min-w-[180px] px-3 pr-8 ${pageSelectBaseClass}`}
                >
                  <option value="全部">全部</option>
                  <option value="基础版">基础版</option>
                  <option value="旗舰版">旗舰版</option>
                </select>
                <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${subduedTextClass}`}>▼</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.alert("购买 License 和测算能力待接入")}
              className={`${primaryButtonClass} px-4 py-2 text-xs`}
            >
              购买 License 和测算
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div className={`text-sm font-semibold ${strongTextClass}`}>License</div>
              <button
                type="button"
                onClick={handleCreateLicense}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                购买 License
              </button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-8">
              <div
                className="relative flex h-32 w-32 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${isDark ? "#8b5cf6" : "#8b5cf6"} 0deg ${donutDeg}deg, ${
                    isDark ? "#27272a" : "#e4e4e7"
                  } ${donutDeg}deg 360deg)`,
                }}
              >
                <div className={`flex h-24 w-24 flex-col items-center justify-center rounded-full ${isDark ? "bg-zinc-950" : "bg-white"}`}>
                  <div className={`text-[11px] ${subduedTextClass}`}>总量</div>
                  <div className={`mt-1 text-2xl font-semibold ${strongTextClass}`}>{totalCount}</div>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-violet-500" />
                  <span className={subduedTextClass}>已绑定：{activatedCount}（资产 {Math.max(activatedCount - 1, 0)}）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-sm ${isDark ? "bg-zinc-700" : "bg-zinc-300"}`} />
                  <span className={subduedTextClass}>未绑定：{pendingCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div className={`text-sm font-semibold ${strongTextClass}`}>扩展资源</div>
              <button
                type="button"
                onClick={() => window.alert("购买资源补充包能力待接入")}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                购买资源补充包
              </button>
            </div>
            <div className="mt-6 space-y-5">
              {resourceUsage.map((item, index) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={`text-xs ${subduedTextClass}`}>{item.label}</span>
                    <span className={`text-[11px] ${subduedTextClass}`}>{item.remaining}</span>
                  </div>
                  <div className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
                    <div
                      className={`h-full rounded-full ${index === 0 ? "bg-blue-500" : "bg-rose-300"}`}
                      style={{ width: `${Math.max(item.progress * 100, 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: "绑定新设备", active: true },
            { label: `已绑定设备：${filteredLicenses.filter((item) => item.bindStatus === "已绑定").length}` },
            { label: `已激活设备：${activatedCount}` },
            { label: `已过期设备：0` },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => window.alert(item.active ? "绑定新设备能力待接入" : item.label)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${pageFilterButtonFocusClass} ${
                item.active
                  ? "border-blue-600 bg-blue-600 text-white"
                  : isDark
                    ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={`overflow-hidden rounded-2xl border ${surfaceClass}`}>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left">
              <thead className={isDark ? "bg-zinc-950/70" : "bg-zinc-50"}>
                <tr className={`text-[11px] ${subduedTextClass}`}>
                  <th className="px-4 py-3 font-medium">License编号</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">绑定设备 ID</th>
                  <th className="px-4 py-3 font-medium">绑定状态</th>
                  <th className="px-4 py-3 font-medium">激活状态</th>
                  <th className="px-4 py-3 font-medium">有效期</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((item) => (
                  <tr key={item.id} className={`border-t text-xs ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                    <td className="px-4 py-3 align-top">
                      <div className={`font-medium ${strongTextClass}`}>{item.licenseKey}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`rounded px-2 py-1 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>{item.version}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className={strongTextClass}>{item.bindAppId}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className={`inline-flex rounded px-2 py-1 text-[11px] ${
                        item.bindStatus === "已绑定"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                        {item.bindStatus}
                      </div>
                      <div className={`mt-1 text-[11px] ${subduedTextClass}`}>绑定时间：{item.bindAt}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className={`inline-flex rounded px-2 py-1 text-[11px] ${
                        item.activationStatus === "已激活"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}>
                        {item.activationStatus}
                      </div>
                      <div className={`mt-1 text-[11px] ${subduedTextClass}`}>激活时间：{item.activatedAt}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className={strongTextClass}>{item.validDays}</div>
                      <div className={`mt-1 text-[11px] ${subduedTextClass}`}>有效期至：{item.validUntil}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-3 text-[11px]">
                        <button type="button" onClick={() => handleEditLicense(item)} className="text-blue-600 hover:text-blue-700">
                          续期
                        </button>
                        <button type="button" onClick={() => window.alert(`下载 License\n\n${item.licenseKey}`)} className="text-blue-600 hover:text-blue-700">
                          下载
                        </button>
                        <button type="button" onClick={() => window.alert(`使用详情\n\n名称：${item.name}\n版本：${item.version}\n设备ID：${item.bindAppId}`)} className="text-blue-600 hover:text-blue-700">
                          用量详情
                        </button>
                        <button type="button" onClick={() => handleDeleteLicense(item)} className="text-red-500 hover:text-red-600">
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDeveloperCommunity = () => {
    const communityCollections = [
      {
        title: "热门 MCP 工具",
        icon: Boxes,
        description: "开发者共享的工作流、检索、查询类 MCP 工具，可直接下载到工作台继续使用。",
        items: [
          { name: "知识检索 MCP", meta: "Knowledge · 2.1k 下载", author: "TRAE Labs", tag: "已验证" },
          { name: "天气查询 MCP", meta: "Utility · 1.6k 下载", author: "ConvoAI Dev", tag: "热门" },
          { name: "工单系统 MCP", meta: "Workflow · 980 下载", author: "SupportOps", tag: "企业版" },
        ],
      },
      {
        title: "精选 Skills",
        icon: Settings2,
        description: "社区维护的对话、分类、审核等 Skills，支持快速下载并二次编辑。",
        items: [
          { name: "内容审核 Skill", meta: "审核 · 3.4k 下载", author: "Safe AI", tag: "官方推荐" },
          { name: "意图分类 Skill", meta: "分类 · 1.2k 下载", author: "Agent Crew", tag: "高复用" },
          { name: "话术生成 Skill", meta: "生成 · 860 下载", author: "Prompt Lab", tag: "最新" },
        ],
      },
    ];

    return (
      <div className="space-y-5">
        <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border px-5 py-4 ${surfaceClass}`}>
          {[
            { label: "社区资源", value: "268", hint: "MCP 与 Skills 总数" },
            { label: "本周新增", value: "34", hint: "开发者最新上传" },
            { label: "累计下载", value: "18.6k", hint: "近 30 天" },
          ].map((metric) => (
            <div key={metric.label} className="min-w-[140px]">
              <div className={`text-[11px] ${subduedTextClass}`}>{metric.label}</div>
              <div className={`mt-1 text-xl font-semibold ${strongTextClass}`}>{metric.value}</div>
              <div className={`mt-1 text-[11px] ${subduedTextClass}`}>{metric.hint}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`text-base font-semibold ${strongTextClass}`}>上传你的创作</div>
                <div className={`mt-2 text-xs leading-6 ${subduedTextClass}`}>
                  将自己创建的 MCP 工具或 Skills 上传到社区，供其他开发者下载、复用与协作。
                </div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>
                <Upload className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={() => window.alert("上传 MCP 到社区能力待接入")} className={`${primaryButtonClass} px-4 py-2 text-xs`}>
                <Upload className="h-4 w-4" />
                上传 MCP
              </button>
              <button type="button" onClick={() => window.alert("上传 Skill 到社区能力待接入")} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>
                <Upload className="h-4 w-4" />
                上传 Skill
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${surfaceClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className={`text-base font-semibold ${strongTextClass}`}>社区协作</div>
                <div className={`mt-2 text-xs leading-6 ${subduedTextClass}`}>
                  下载社区资源到本地工作台后，可继续修改配置、二次发布或沉淀为团队资产。
                </div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>
                <Download className="h-5 w-5" />
              </div>
            </div>
            <div className={`mt-5 rounded-xl border px-4 py-3 text-xs ${isDark ? "border-zinc-800 bg-zinc-950 text-zinc-300" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
              社区资源支持按 MCP / Skill 分类下载，下载后可直接进入“我的Tools”或“我的Skills”继续管理。
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {communityCollections.map((collection) => {
            const Icon = collection.icon;
            return (
              <div key={collection.title} className={`rounded-2xl border p-5 ${surfaceClass}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`text-base font-semibold ${strongTextClass}`}>{collection.title}</div>
                    <div className={`mt-2 text-xs leading-6 ${subduedTextClass}`}>{collection.description}</div>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {collection.items.map((item) => (
                    <div key={item.name} className={`rounded-xl border p-4 ${isDark ? "border-zinc-800 bg-zinc-950/70" : "border-zinc-200 bg-white"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`truncate text-sm font-semibold ${strongTextClass}`}>{item.name}</div>
                          <div className={`mt-2 text-xs ${subduedTextClass}`}>{item.meta}</div>
                          <div className={`mt-1 text-xs ${subduedTextClass}`}>作者：{item.author}</div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>{item.tag}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={() => window.alert(`下载资源：${item.name}`)} className={`${primaryButtonClass} px-3.5 py-2 text-xs`}>
                          <Download className="h-4 w-4" />
                          下载
                        </button>
                        <button type="button" onClick={() => window.alert(`资源详情\n\n名称：${item.name}\n作者：${item.author}\n信息：${item.meta}`)} className={`rounded-lg border px-3.5 py-2 text-xs ${isDark ? "border-zinc-700 text-zinc-200 hover:bg-zinc-800" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPurchase = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        { icon: Package, title: "资源包", desc: "购买 RTC / ASR / TTS 资源包", button: "立即购买" },
        { icon: AudioLines, title: "声音复刻实例", desc: "购买训练与部署实例", button: "购买实例" },
        { icon: BadgeInfo, title: "音色续期", desc: "延长已训练音色有效期", button: "续期购买" },
        { icon: ShieldCheck, title: "License", desc: "购买高级功能 License", button: "购买 License" },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className={`rounded-2xl border p-5 shadow-sm ${surfaceClass}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-700"}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className={`mt-4 text-base font-semibold ${strongTextClass}`}>{item.title}</div>
            <div className={`mt-2 text-xs ${subduedTextClass}`}>{item.desc}</div>
            <button type="button" onClick={() => window.alert(`进入购买流程：${item.title}`)} className={`mt-5 ${primaryButtonClass} px-4 py-2 text-xs`}>{item.button}</button>
          </div>
        );
      })}
    </div>
  );

  const renderSectionContent = () => {
    if (agentTemplatePageOpen) {
      return renderAgentTemplatePage();
    }

    if (currentSection === "orchestration") {
      return <Workspace onOpenAssistant={() => ensureCatalogAssistantOpen("agent")} />;
    }

    const normalizedSection =
      currentSection === "feature-config" || currentSection === "business-ids" ? "app-keys" : currentSection;
    const currentCopy = sectionCopy[normalizedSection];
    const isCatalogSection = normalizedSection === "agents" || normalizedSection === "tools" || normalizedSection === "skills";
    const sectionBody = (
      <>
        {normalizedSection === "agents" && renderAgents()}
        {normalizedSection === "voices" && renderVoices()}
        {normalizedSection === "knowledge" && renderKnowledgeBases()}
        {normalizedSection === "ai-dev-tools" && renderAiDevTools()}
        {normalizedSection === "env-vars" && renderEnvVars()}
        {normalizedSection === "volcengine-deploy" && renderVolcengineDeploy()}
        {normalizedSection === "phone-line-deploy" && renderPhoneLineDeploy()}
        {normalizedSection === "quality-analysis" && renderQualityAnalysis()}
        {normalizedSection === "operations-analysis" && renderOperationsAnalysis()}
        {normalizedSection === "log-analysis" && renderLogAnalysis()}
        {normalizedSection === "latency-analysis" && renderLatencyAnalysis()}
        {normalizedSection === "usage" && renderUsage()}
        {normalizedSection === "app-keys" && renderAppKeys()}
        {normalizedSection === "resource-packages" && renderResourcePackages()}
        {normalizedSection === "license-management" && renderLicenses()}
        {normalizedSection === "purchase" && renderPurchase()}
        {normalizedSection === "tools" && renderTools()}
        {normalizedSection === "skills" && renderSkills()}
        {normalizedSection === "developer-community" && renderDeveloperCommunity()}
      </>
    );

    return (
      <div className={`${isCatalogSection ? "h-full overflow-y-auto px-6 pt-6 pb-2 md:px-8" : "h-full overflow-y-auto px-6 py-6 md:px-8"}`}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className={`text-2xl font-semibold ${strongTextClass}`}>{currentCopy.title}</div>
              <div className={`mt-2 text-xs ${subduedTextClass}`}>{currentCopy.description}</div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {normalizedSection === "usage" && (
                <button
                  type="button"
                  onClick={() => setCurrentSection("license-management")}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium transition ${
                    isDark
                      ? "border-zinc-700 text-zinc-200 hover:bg-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  License统计
                </button>
              )}
              {normalizedSection !== "license-management" && (
                <button
                  type="button"
                  onClick={() => {
                    const actions: Partial<Record<Exclude<WorkspaceSection, "orchestration">, () => void>> = {
                      agents: handleCreateAgent,
                      voices: handleCloneVoice,
                      "ai-dev-tools": () => window.alert("开发工具集成能力待接入"),
                      "env-vars": () => window.alert("环境变量新增能力待接入"),
                      "volcengine-deploy": () => window.alert("部署任务创建能力待接入"),
                      "phone-line-deploy": () => window.alert("电话线路新增能力待接入"),
                      "quality-analysis": () => window.alert("质量报告导出能力待接入"),
                      "operations-analysis": () => window.alert("运营报告导出能力待接入"),
                      "log-analysis": () => window.alert("日志导出能力待接入"),
                      "latency-analysis": () => window.alert("延时报告导出能力待接入"),
                      knowledge: handleCreateKnowledgeBase,
                      usage: () => window.alert("报表导出能力待接入"),
                      "app-keys": handleCreateAppKey,
                      "resource-packages": handleCreateResourcePackage,
                      "license-management": handleCreateLicense,
                      purchase: () => window.alert("套餐中心待接入"),
                      tools: handleCreateTool,
                      skills: handleCreateSkill,
                      "developer-community": () => window.alert("上传社区资源能力待接入"),
                    };
                    actions[normalizedSection]?.();
                  }}
                  className={primaryButtonClass}
                >
                  <Plus className="h-4 w-4" />
                  {currentCopy.actionLabel}
                </button>
              )}
            </div>
          </div>

          {sectionBody}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"}`}>
      <aside
        className={`flex h-full shrink-0 flex-col transition-[width] duration-200 ${
          isDark ? "bg-zinc-950" : "bg-white"
        }`}
        style={{ width: resolvedSidebarWidth }}
      >
        <div className={`shrink-0 ${isSidebarCollapsed ? "h-14 px-1.5 py-2 md:h-16 md:py-3" : "px-3 pt-3 pb-0 md:px-4"}`}>
          {isSidebarCollapsed ? (
            <div className="flex items-center justify-center gap-1">
              <button
                type="button"
                onClick={() => handleCallAssistant()}
                className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl transition-all ${
                  catalogAssistantOpen
                    ? "bg-gradient-to-br from-[#F5F0FF] to-[#EEE7FF] text-[#9155FD] shadow-sm dark:from-[#9155FD]/25 dark:to-[#6D3DF2]/20 dark:text-[#C4A9FF]"
                    : isDark
                      ? "bg-zinc-900 text-zinc-300 hover:text-[#B88BFF]"
                      : "bg-[#F7F3FF] text-[#7C3AED] hover:text-[#6D28D9]"
                }`}
                title="呼叫小助手"
              >
                <span className={`absolute inset-x-1 top-0 h-px ${
                  catalogAssistantOpen ? "bg-[#B88BFF]/70" : isDark ? "bg-[#9155FD]/35" : "bg-[#9155FD]/25"
                }`} />
                <BotMessageSquare className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  isDark
                    ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                title={isDark ? "切换浅色主题" : "切换深色主题"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className={`flex flex-col gap-2.5 rounded-2xl px-3 py-2.5 ${
              isDark ? "bg-zinc-900/45" : "bg-zinc-50/70"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-[10px] font-medium tracking-[0.07em] md:text-[11px] md:tracking-[0.08em] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                    ConvoAI Studio
                  </div>
                  <div className={`mt-1 text-[14px] font-semibold tracking-tight md:text-[15px] ${strongTextClass}`}>
                    AI音视频互动工作台
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center transition-colors ${
                    isDark
                      ? "text-zinc-400 hover:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                  title={isDark ? "切换浅色主题" : "切换深色主题"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCallAssistant()}
                  className={`group inline-flex w-full items-center gap-2.5 rounded-2xl px-3 py-1.5 text-left transition-all ${
                    catalogAssistantOpen
                      ? "bg-gradient-to-r from-[#F7F2FF] to-[#F0E8FF] text-[#7C3AED] shadow-sm dark:from-[#9155FD]/18 dark:to-[#6D3DF2]/12 dark:text-[#C4A9FF]"
                      : isDark
                        ? "bg-zinc-900/80 text-zinc-200 hover:text-[#C4A9FF]"
                        : "bg-[#FBF8FF] text-zinc-800 hover:text-[#7C3AED]"
                  }`}
                  title="呼叫小助手"
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    catalogAssistantOpen
                      ? "bg-white/45 text-[#9155FD] dark:bg-white/5 dark:text-[#C4A9FF]"
                      : isDark
                        ? "bg-zinc-800/55 text-[#B88BFF]"
                        : "bg-white/70 text-[#7C3AED]"
                  }`}>
                    <BotMessageSquare className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[12px] font-semibold leading-4 ${catalogAssistantOpen ? "text-[#7C3AED] dark:text-[#C4A9FF]" : ""}`}>
                      AI小助手
                    </span>
                    <span className={`${isDark ? "text-zinc-500" : "text-zinc-400"} block truncate text-[10px] leading-4`}>
                      问答 / 配置 / 报错
                    </span>
                  </span>
                  <span className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    catalogAssistantOpen
                      ? "bg-[#9155FD] shadow-[0_0_10px_rgba(145,85,253,0.75)]"
                      : isDark
                        ? "bg-zinc-700 group-hover:bg-[#9155FD]"
                        : "bg-[#D8CCF8] group-hover:bg-[#9155FD]"
                  }`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {!isSidebarCollapsed && (
          <div className="mx-3 mt-2 h-2 shrink-0 md:mx-4" />
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={`${isSidebarCollapsed ? "space-y-2 px-1.5 py-2.5 md:space-y-2.5 md:px-2 md:py-3" : "space-y-2.5 px-2 py-2 md:space-y-3.5 md:px-3 md:py-3"}`}>
            {navItems.map((item) => {
              if (item.type === "item") {
                const Icon = item.icon;
                const isActive = currentSection === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setCurrentSection(item.key)}
                    className={`relative flex items-center overflow-hidden text-left transition-all duration-200 ${
                      isSidebarCollapsed ? "mx-auto h-9 w-9 justify-center rounded-lg p-0 md:h-10 md:w-10" : "w-full gap-2 rounded-lg px-2 py-1.5 md:gap-2.5 md:px-2.5"
                    } ${
                      isActive
                        ? isDark
                          ? "bg-zinc-950 text-cyan-100"
                          : "bg-transparent text-slate-900"
                        : isDark
                          ? "text-zinc-300 hover:bg-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                    title={item.label}
                  >
                    {isActive && !isSidebarCollapsed && (
                      <span className={`pointer-events-none absolute inset-y-1 left-0 w-[2px] rounded-full ${isDark ? "bg-cyan-300" : "bg-blue-500"}`} />
                    )}
                    <Icon className={`relative z-10 h-[18px] w-[18px] shrink-0 ${isActive ? (isDark ? "text-cyan-200" : "text-blue-600") : ""}`} />
                    {!isSidebarCollapsed && <div className="relative z-10 truncate text-[12px] font-medium md:text-[13px]">{item.label}</div>}
                  </button>
                );
              }

              const isGroupActive = item.children.some((child) => child.key === currentSection);
              const isSettingsGroup = item.key === "settings";
              const isGroupExpanded = !isSettingsGroup || isSettingsExpanded || isGroupActive;

              return (
                <div key={item.key} className={isSidebarCollapsed ? "space-y-1.5 md:space-y-2" : "space-y-1 md:space-y-1.5"}>
                  {isSidebarCollapsed ? (
                    <div className="space-y-1.5 md:space-y-2">
                      {item.children.map((child) => {
                        const isChildActive = currentSection === child.key;
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={() => setCurrentSection(child.key)}
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                            isSidebarCollapsed ? "md:h-10 md:w-10 h-9 w-9" : ""
                          } ${
                              isChildActive
                                ? isDark
                                  ? "bg-zinc-900/80 text-zinc-100"
                                  : "bg-zinc-100 text-zinc-900"
                                : isDark
                                  ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                            }`}
                            title={child.label}
                          >
                            <ChildIcon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <>
                      {isSettingsGroup ? (
                        <button
                          type="button"
                          onClick={() => setIsSettingsExpanded((prev) => !prev)}
                          className={`flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors ${
                            isDark ? "hover:bg-zinc-900/70" : "hover:bg-zinc-100/80"
                          } ${isGroupActive ? (isDark ? "text-zinc-300" : "text-zinc-700") : (isDark ? "text-zinc-500" : "text-zinc-500")}`}
                          title={isGroupExpanded ? "收起设置" : "展开设置"}
                        >
                          <div className="truncate text-[10px] font-semibold tracking-[0.07em] md:text-[11px] md:tracking-[0.08em]">{item.label}</div>
                          {isGroupExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                        </button>
                      ) : (
                        <div className={`px-1 ${isGroupActive ? (isDark ? "text-zinc-300" : "text-zinc-700") : (isDark ? "text-zinc-500" : "text-zinc-500")}`}>
                          <div className="truncate text-[10px] font-semibold tracking-[0.07em] md:text-[11px] md:tracking-[0.08em]">{item.label}</div>
                        </div>
                      )}
                      {isGroupExpanded && (
                        <div className="space-y-0.5 pl-2 md:pl-2.5">
                          {item.children.map((child) => {
                            const isChildActive = currentSection === child.key;
                            const ChildIcon = child.icon;
                            return (
                              <button
                                key={child.key}
                                type="button"
                                onClick={() => setCurrentSection(child.key)}
                                className={`relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors md:px-2.5 ${
                                  isChildActive
                                    ? isDark
                                      ? "bg-zinc-900/80 text-zinc-100"
                                      : "bg-zinc-100 text-zinc-900"
                                    : isDark
                                      ? "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                                }`}
                              >
                                <ChildIcon className={`h-4 w-4 shrink-0 ${isChildActive ? (isDark ? "text-zinc-200" : "text-zinc-700") : (isDark ? "text-zinc-500" : "text-zinc-400")}`} />
                                <span className="truncate text-[12px] font-medium md:text-[13px]">{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className={`shrink-0 border-t ${isDark ? "border-zinc-800" : "border-zinc-200"} p-2 md:p-2.5`}>
          <button
            type="button"
            onClick={() => setCurrentSection("purchase")}
            className={`flex items-center transition-colors ${
              isSidebarCollapsed ? "mx-auto h-9 w-9 justify-center rounded-lg p-0 md:h-10 md:w-10" : "w-full gap-2 rounded-lg px-2.5 py-2 md:px-3"
            } ${
              currentSection === "purchase"
                ? isDark
                  ? "bg-zinc-900 text-zinc-100"
                  : "bg-zinc-100 text-zinc-900"
                : isDark
                  ? "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
            title="购买"
          >
            <BadgeInfo className="h-4 w-4 shrink-0" />
            {!isSidebarCollapsed && (
              <span className="truncate text-[12px] font-medium md:text-[13px]">购买</span>
            )}
          </button>
        </div>
      </aside>

      <div className="relative h-full w-4 shrink-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="relative h-full w-full cursor-ew-resize"
          title={isSidebarCollapsed ? "展开目录" : "收起目录"}
          aria-label={isSidebarCollapsed ? "展开目录" : "收起目录"}
        >
          <span className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 ${
            isDark ? "bg-zinc-800" : "bg-zinc-200"
          }`} />
        </button>
      </div>

      <main className="min-w-0 flex-1 h-full overflow-hidden">
        {catalogAssistantOpen ? (
          <div ref={assistantLayoutRef} className="flex h-full w-full min-w-0">
            <aside
              className={`h-full shrink-0 overflow-hidden ${
                isDark ? "bg-zinc-950" : "bg-white"
              }`}
              style={{ width: assistantPanelWidth }}
            >
                {renderCatalogAssistantPanel()}
            </aside>

            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={() => setIsAssistantResizing(true)}
              className="relative w-2 shrink-0 cursor-col-resize group flex items-center justify-center z-20"
            >
              <div className={`w-[1px] h-full transition-all duration-300 ease-out ${
                isDark
                  ? "bg-zinc-800 group-hover:bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] group-active:bg-blue-400"
                  : "bg-zinc-200 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.6)] group-active:bg-blue-500"
              }`} />
            </div>

            <div className="min-w-0 flex-1 h-full">
              <div className="min-w-0 h-full">{renderSectionContent()}</div>
            </div>
          </div>
        ) : (
          <div className="min-w-0 h-full">{renderSectionContent()}</div>
        )}
      </main>
      {renderAgentCreateEntryDialog()}
      {renderDeleteDialog()}
      {renderAgentNameDialog()}
      {renderCreateAppDialog()}
      {renderCreateBusinessDialog()}
      {renderEditAppDialog()}
      {renderEditBusinessDialog()}
      {renderToolFormDialog()}
      {renderSkillFormDialog()}
      {renderResourceFormDialog()}
    </div>
  );
}
