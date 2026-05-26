import cors from 'cors';
import express from 'express';
import OpenAI from 'openai';

const port = Number(process.env.PORT ?? 8787);
const arkApiKey = process.env.ARK_API_KEY?.trim() ?? '';
const arkBaseURL = process.env.ARK_BASE_URL?.trim() ?? 'https://ark.cn-beijing.volces.com/api/v3';
const arkModel = process.env.ARK_MODEL?.trim() ?? 'ep-20260520114334-xm6zh';
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    hasApiKey: Boolean(arkApiKey),
    baseURL: arkBaseURL,
    model: arkModel,
  });
});

app.post('/api/chat', async (req, res) => {
  if (!arkApiKey) {
    res.status(500).json({ error: '服务端未配置 ARK_API_KEY。' });
    return;
  }

  const { content, currentJson, chatMessages, model, workspaceContext } = req.body ?? {};

  if (typeof content !== 'string' || !content.trim()) {
    res.status(400).json({ error: '请求缺少有效的 content。' });
    return;
  }

  const openai = new OpenAI({
    apiKey: arkApiKey,
    baseURL: arkBaseURL,
  });

  const abortController = new AbortController();
  req.on('aborted', () => abortController.abort());
  res.on('close', () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  });

  try {
    const response = await openai.chat.completions.create(
      {
        model: typeof model === 'string' && model.trim() ? model.trim() : arkModel,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(typeof currentJson === 'string' ? currentJson : '', workspaceContext),
          },
          ...normalizeChatMessages(chatMessages),
          { role: 'user', content },
        ],
        temperature: 0.1,
      },
      { signal: abortController.signal }
    );

    res.json({
      reply: response.choices[0]?.message?.content ?? '抱歉，我未能生成回复。',
      requestId: response._request_id ?? null,
      model: response.model ?? null,
    });
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'APIUserAbortError') {
      res.status(499).json({ error: '请求已取消。' });
      return;
    }

    const status = Number(error?.status ?? error?.response?.status ?? 500);
    const fallbackMessage = error instanceof Error ? error.message : '未知错误';

    res.status(status).json({
      error: toUserErrorMessage(status, fallbackMessage),
      details: error?.error ?? null,
      requestId: error?.request_id ?? null,
    });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});

function normalizeChatMessages(chatMessages) {
  if (!Array.isArray(chatMessages)) return [];

  return chatMessages
    .slice(-4)
    .filter(
      (message) =>
        message &&
        (message.role === 'user' || message.role === 'agent') &&
        typeof message.content === 'string' &&
        message.content.trim()
    )
    .map((message) => ({
      role: message.role === 'agent' ? 'assistant' : 'user',
      content: message.content,
    }));
}

function toUserErrorMessage(status, fallbackMessage) {
  if (status === 401) return '服务端 Ark API Key 无效或格式错误。';
  if (status === 403) return '当前模型或资源节点无访问权限。';
  if (status === 429) return 'Ark 调用频率过高或额度不足，请稍后重试。';
  if (status >= 500) return 'Ark 服务暂时不可用，请稍后再试。';

  return fallbackMessage;
}

function buildSystemPrompt(currentJson, workspaceContext) {
  const currentSection =
    workspaceContext && typeof workspaceContext.currentSection === 'string'
      ? workspaceContext.currentSection
      : 'orchestration';
  const currentAgentName =
    workspaceContext && typeof workspaceContext.agentName === 'string' ? workspaceContext.agentName : '';
  const toolSummary = summarizeCollection(workspaceContext?.toolList, ['name', 'type', 'status']);
  const skillSummary = summarizeCollection(workspaceContext?.skillList, ['name', 'category', 'model']);
  const knowledgeSummary = summarizeCollection(workspaceContext?.knowledgeBaseList, ['name', 'type', 'status']);
  const resourceSummary = summarizeCollection(workspaceContext?.resourceList, ['name', 'kind', 'status', 'providerLabel']);

  return `你是 ConvoAI Studio 的左侧辅助开发小助手。
你需要基于对话历史、当前工作区、当前智能体配置和现有资源清单来回答用户问题。

当前工作区：${currentSection}
当前智能体：${currentAgentName || '未指定'}
已有 Tools/MCP：${toolSummary}
已有 Skills：${skillSummary}
已有知识库：${knowledgeSummary}
已有三方资源：${resourceSummary}

当工作区是 orchestration 时，你的核心职责是根据用户需求生成或修改 StartVoiceChat (Version: 2025-06-01) 接口 JSON。
当工作区不是 orchestration 时，你的核心职责是回答用户问题、利用已有资源清单判断“有没有现成的 skill/mcp/知识库/资源”，并给出明确建议。此时不要臆造“已经创建/已经添加/已经跳转”，除非用户消息里已经明确说明这些动作发生了。

以下是接口文档的概要：
1. 必填参数: AppId, RoomId, TaskId, AgentConfig, Config。
2. AgentConfig 对象结构：
   - 必填 TargetUserId (数组) 和 UserId。
   - 可配置 WelcomeMessage (欢迎语), IdleTimeout, VoicePrint 等。
3. Config 对象结构：
   - ASRConfig (语音识别配置): 必填 Provider 和 ProviderParams。Provider 可以是 volcano 或 ai_gateway。
   - TTSConfig (语音合成配置): 必填 Provider 和 ProviderParams。Provider 可以是 volcano_bidirection, volcano, minimax, ai_gateway。
   - LLMConfig (大模型配置): 必填 Mode (如 ArkV3, CozeBot, CustomLLM)。如果 Mode 为 ArkV3，可配置 ModelName。
   - 进阶配置: SubtitleConfig(字幕), InterruptMode(打断), WebSearchAgentConfig(联网问答), MemoryConfig(记忆库), AvatarConfig(数字人), S2SConfig(端到端模型) 等。

另外，你也是错误排查助手。当用户提供了 \`EventType=1\` 的事件回调或者包含错误码（ErrorCode/ErrorInfo）的日志时，你需要根据以下错误码含义为用户解答问题原因及提供解决方案：
【错误码速查表】
- 任务初始化: 1000001(任务初始化失败, 请重试或联系技术), 1000002(未知参数, 核对 StartVoiceChat 文档)。
- ASR 相关: 1003001(实例化失败, 查 ASRConfig), 1003002(请求失败, 查网络), 1003003(响应读取失败, 查网络), 1003004(响应解析失败, 查自定义格式), 1003005(重连失败过多), 1003006(建联失败, 查鉴权或开通状态)。
- LLM 相关: 1004001(实例化失败, 查 LLMConfig), 1004002(请求失败), 1004003(响应读取失败), 1004004(响应处理失败), 1004005(建立连接失败, 查鉴权或开通状态), 1004006(Function Calling 请求失败, 查业务URL), 1004007(Function Calling 响应失败), 1004008(安抚语处理失败, 查TTS配置), 1004009(MCP获取工具失败), 1004010(MCP调用工具失败)。
- TTS 相关: 1005001(实例化失败, 查 TTSConfig), 1005002(请求失败), 1005003(响应读取失败), 1005004(响应处理失败), 1005005(建连失败, 查鉴权或开通状态)。
- 数字人相关: 1006001(数字人建联失败, 查 AvatarConfig), 1006002(数字人服务内部错误)。
【Reason 常见取值】
- "quota exceeded for types [...]"：免费额度耗尽或资源包已用完。
- "requested resource not granted"：未授权或未开通，RTC 无权限或 AI 服务未开通。

当前 JSON 状态：
${currentJson}

要求：
1. 仔细分析用户需求，并结合最近几轮对话理解上下文省略、代词指代和延续修改。
2. 如果用户在询问错误排查，则根据错误码速查表解答。
3. 如果用户是在要求“生成/创建/新建一个智能体”，无论当前工作区是否是 orchestration，你都必须给出简短解释，并且输出一个且仅一个完整 JSON 代码块。前端会基于这段 JSON 真正创建智能体。
4. 如果当前工作区是 orchestration，且用户是在要配置、修改配置、要 JSON、要代码块、要“跑通流程”的示例，你也必须输出一个且仅一个完整 JSON 代码块。
5. 如果当前工作区不是 orchestration，且用户不是在要求创建智能体或索取配置示例，则不要输出 JSON 代码块，也不要假装已经执行了前端动作。
6. 如果用户询问“有没有现成的 Skill / MCP / Tool”，先基于已有清单判断，再明确回答“找到了什么”或“没找到什么”。
7. 生成的 JSON 必须严格符合 StartVoiceChat 的嵌套结构，且永远不要在 JSON 中生成注释或非标准 JSON 语法。
8. 不要把 AppId、RoomId、TaskId、AgentConfig.UserId、AgentConfig.TargetUserId 留空；如果用户没有提供真实值，请使用可运行的占位值，例如 demo_app_id、demo_room_id、demo_task_id、demo_agent_user、["demo_user"]。

示例：
用户：帮我加上欢迎语，内容是“你好呀”
助手：已经为您在 AgentConfig 中添加了欢迎语。
\`\`\`json
{
  "AppId": "...",
  "RoomId": "...",
  "TaskId": "...",
  "AgentConfig": {
    "TargetUserId": ["user1"],
    "UserId": "bot1",
    "WelcomeMessage": "你好呀"
  },
  "Config": {
    "ASRConfig": { "Provider": "volcano", "ProviderParams": {} },
    "TTSConfig": { "Provider": "volcano_bidirection", "ProviderParams": {} },
    "LLMConfig": { "Mode": "ArkV3" }
  }
}
\`\`\`
`;
}

function summarizeCollection(items, fields) {
  if (!Array.isArray(items) || items.length === 0) return '无';
  return items
    .slice(0, 12)
    .map((item) =>
      fields
        .map((field) => (item && typeof item[field] === 'string' ? item[field] : ''))
        .filter(Boolean)
        .join(' / ')
    )
    .filter(Boolean)
    .join('；');
}
