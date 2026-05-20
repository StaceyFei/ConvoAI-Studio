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

  const { content, currentJson, chatMessages, model } = req.body ?? {};

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
            content: buildSystemPrompt(typeof currentJson === 'string' ? currentJson : ''),
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

function buildSystemPrompt(currentJson) {
  return `你是一个专业的火山引擎“AI音视频互动方案”配置助手。
你的任务是根据用户的需求，生成或修改 StartVoiceChat (Version: 2025-06-01) 接口的 JSON 配置。

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
1. 仔细分析用户的需求，例如是否需要修改特定的音色、大模型名字、欢迎语、是否开启数字人或联网问答等。如果是询问错误排查，则根据错误码速查表解答。
2. 你的回复必须包含简短的解释文本，说明你修改了什么，或者解释错误原因及解决方案。
3. 如果你修改了配置，你的回复中必须且只能包含一个 JSON 代码块 (以 \`\`\`json 开始，以 \`\`\` 结束)，包含完整的最新配置。如果用户仅在咨询错误码或问题排查，则无需输出 JSON 代码块。
4. 生成的 JSON 必须严格符合 StartVoiceChat 的嵌套结构。
5. 永远不要在 JSON 中生成注释或非标准的 JSON 语法。

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
