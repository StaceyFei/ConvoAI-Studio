# StartVoiceChat - 开启 AI 对话

## 接口概述

调用 `StartVoiceChat` 接口，在应用中接入一个具备听说能力的 AI，使其与真人用户进行自然、流畅、真人感的实时对话。

> **注意**：该接口仅在使用 **AI 音视频互动方案** 服务和应用时生效。若当前业务使用的是"实时对话式 AI"应用，请使用接口 `StartVoiceChat（2024-12-01）`，或迁移至 AI 音视频互动方案。
>
> AI 音视频互动方案与实时对话式 AI 为不同商品，在计费和集成方式上均有差异。

## 注意事项

- **请求频率**：单账号下 QPS 不得超过 60
- **请求接入地址**：仅支持 `rtc.volcengineapi.com`
- **任务状态监控**：调用本接口返回 200 仅代表任务下发成功，不代表 AI 已成功入房或可以正常工作。建议通过监听 VoiceChat 事件获取任务状态
- **任务生命周期与成本管理**：开启 AI 对话后，若真人用户退出房间，180s 后任务自动停止（该 180s 内仍计费）。可通过 `AgentConfig.IdleTimeout` 自定义等待时长。建议真人退出后及时调用 `StopVoiceChat` 关闭任务

## 请求说明

- **请求方式**：`POST`
- **请求地址**：`https://rtc.volcengineapi.com?Action=StartVoiceChat&Version=2025-06-01`

## 请求参数

### Query 参数

| 参数名 | 类型 | 必选 | 示例值 | 描述 |
|--------|------|------|--------|------|
| Action | String | 是 | StartVoiceChat | 接口名称 |
| Version | String | 是 | 2025-06-01 | 接口版本 |

### Body 参数

| 参数名 | 类型 | 必选 | 示例值 | 描述 |
|--------|------|------|--------|------|
| AppId | String | 是 | 661*****3cf | AI 音视频互动方案的应用 AppId。必须使用 AI 音视频互动方案应用的 AppId，且需与生成 RTC 鉴权 Token 时使用的 AppId 一致 |
| RoomId | String | 是 | Room1 | RTC 房间 ID。需与生成 RTC Token 时使用的 RoomId 一致 |
| TaskId | String | 是 | task1 | 任务 ID。自行定义，用于唯一标识该对话任务。同一 AppId+RoomId 下必须唯一 |
| BusinessId | String | 否 | chatroom | 业务标识 ID，用于区分不同业务 |
| Config | Object | 是 | - | 智能交互服务配置（ASR/TTS/LLM/字幕/Function Calling/数字人等） |
| AgentConfig | Object | 是 | - | 智能体配置（用户标识/欢迎语/空闲超时/声纹等） |

---

## AgentConfig 对象结构

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| TargetUserId | String[] | 是 | - | 真人用户的 User ID 列表。需与该用户加入 RTC 房间时使用的 UserId 一致 |
| UserId | String | 是 | - | AI 智能体的 User ID，用于标识 AI 在 RTC 房间中的身份。不能与 TargetUserId 相同 |
| WelcomeMessage | String | 否 | - | 欢迎语。AI 进入房间后主动播放的第一句话。若为空则不播报 |
| IdleTimeout | Integer | 否 | 180 | 空闲超时时长（秒）。真人用户全部退出房间后，AI 等待多久后自动关闭任务。该等待期间仍计费 |
| Burst | Object | 否 | - | 音频快速发送配置 |
| Burst.Enable | Boolean | 否 | false | 是否启用音频 Burst（快速发送），降低首包延迟 |
| Burst.Ratio | Float | 否 | - | 快速发送倍率 |
| VoicePrint | Object | 否 | - | 声纹识别配置。用于在多人场景下识别目标用户 |
| VoicePrint.Enable | Boolean | 否 | false | 是否开启声纹识别 |
| VoicePrint.ResourceId | String | 否 | - | 声纹服务资源 ID |
| VoicePrint.SpeakerList | Object[] | 否 | - | 已注册的声纹列表 |
| ServerMessageUrlForRTS | String | 否 | - | 用于接收服务端字幕回调的业务服务器 URL |
| ServerMessageSignatureForRTS | String | 否 | - | 字幕回调签名密钥 |

---

## Config 对象结构

### Config.ASRConfig（语音识别配置）

> 启用端到端语音模型（S2SConfig）后，该配置失效。

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Provider | String | 是 | 语音识别服务提供商：`volcano`（火山引擎豆包语音）、`ai_gateway`（自定义 ASR，通过火山边缘大模型网关接入） |
| ProviderParams | Object | 是 | 服务配置参数（结构因 Provider 不同而异） |

#### ProviderParams - 火山流式语音识别大模型（参数透传）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Mode | String | 是 | 固定取值 `bigmodel` |
| VolcanoASRParameters | String | 是 | JSON 字符串，透传火山 ASR 大模型原生 API 参数。基础用法可设为 `"{}"`。高级用法参考大模型流式语音识别 API |
| Credential.ApiResourceId | String | 否 | 大模型版本：`volc.bigasr.sauc.duration`（1.0，默认）、`volc.seedasr.sauc.duration`（2.0） |
| StreamMode | Integer | 否 | 返回模式：0=流式输入流式输出（默认），1=流式输入非流式输出，2=双向流式优化版（推荐） |
| ContextHistoryLength | Integer | 否 | 上下文轮次 [0,20]，默认 0 |

#### ProviderParams - 火山流式语音识别大模型（参数直传）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Mode | String | 是 | 固定取值 `bigmodel` |
| ApiResourceId | String | 否 | 大模型版本（同上） |
| StreamMode | Integer | 否 | 返回模式（同上） |
| enable_nonstream | Boolean | 否 | 是否开启二遍识别（仅 StreamMode=2 时生效） |
| context | String | 否 | 热词 JSON 字符串，如 `"{\"hotwords\": [{\"word\": \"CO2\"}]}"` |
| context_history_length | Integer | 否 | 上下文轮次 [0,20]，默认 0 |

#### ProviderParams - 火山流式语音识别（小模型）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Mode | String | 是 | 固定取值 `smallmodel` |
| Cluster | String | 是 | 集群标识，如 `volcengine_streaming_common` |

#### ProviderParams - 自定义语音识别

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| URL | String | 是 | 边缘大模型网关 URL，格式：`wss://ai-gateway.vei.volces.com/v1/realtime?model=<ASR调用名称>` |
| APIKey | String | 是 | 网关访问密钥 |
| ExtraData | JSONMap | 否 | 自定义参数，JSON 格式透传给自定义 ASR 服务 |
| ExtraHeader | JSONMap | 否 | 自定义透传 Header |

---

### Config.ASRConfig.VADConfig（语音检测配置）

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| SilenceTime | Integer | 否 | 600 | 判停静音时长，[500, 3000) ms |
| AIVAD | Boolean | 否 | false | 智能语义判停（公测中） |
| ForceBeginThreshold | Integer | 否 | 0 | 首帧打断阈值 [0, 1000] ms，0=禁用 |
| ForceEnd | Boolean | 否 | false | 辅助 VAD 强制判停 |
| VolumeGain | Float | 否 | 1.0 | 音量增益，推荐 0.3 |
| ExpireTime | Integer | 否 | - | 强制判停时长(ms)，建议为 SilenceTime 的 1.5 倍 |

### Config.ASRConfig.InterruptConfig（语音打断配置）

> 仅在 InterruptMode 为 0 时生效。

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| InterruptSpeechDuration | Integer | 否 | 0 | 自动打断触发阈值，0 或 [200, 3000] ms |
| InterruptKeywords | String[] | 否 | [] | 触发打断的关键词列表 |

### Config.ASRConfig.TurnDetectionMode

| 值 | 描述 |
|----|------|
| 0（默认） | 自动触发：服务端检测到完整一句话后自动触发新一轮对话 |
| 1 | 不自动触发：需通过 API 指令手动触发 |

### Config.ASRConfig.FarfieldConfig（远场人声抑制）

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| Enable | Boolean | 否 | false | 是否开启 |
| Level | String | 否 | Medium | 抑制强度：High/Medium/Low |
| Threshold | Integer | 否 | 0 | 自定义阈值 [0, 127]，>0 时 Level 失效 |
| FixedSource | Boolean | 否 | false | 音源位置是否固定 |

---

### Config.TTSConfig（语音合成配置）

> 启用端到端语音模型（S2SConfig）后，该配置失效。

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Provider | String | 是 | 语音合成服务提供商（见下方枚举） |
| ProviderParams | Object | 是 | 配置（结构因 Provider 不同而异） |
| IgnoreBracketText | Integer[] | 否 | 过滤指定括号内文字：1=中文括号, 2=英文括号, 3=中文方括号, 4=英文方括号, 5=花括号 |
| Context | Object | 否 | TTS 上下文及标签解析配置 |

#### Provider 枚举值

| 值 | 描述 |
|----|------|
| volcano_bidirection | 火山引擎 TTS（流式输入流式输出）- 支持语音合成大模型和声音复刻大模型 |
| volcano | 火山引擎 TTS（非流式输入流式输出） |
| minimax | MiniMax 语音合成 |
| ai_gateway | 自定义 TTS（通过火山边缘大模型网关接入） |

#### ProviderParams - 火山语音合成大模型（流式，参数透传）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Credential.ResourceId | String | 否 | 版本：`seed-tts-1.0`/`volc.service_type.10029`（默认1.0），`seed-tts-2.0`（2.0） |
| VolcanoTTSParameters | String | 是 | JSON 字符串，透传双向流 TTS API 参数，必须包含 `req_params.speaker` |

#### ProviderParams - 火山语音合成大模型（流式，参数直传）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| ResourceId | String | 否 | 版本（同上） |
| audio.voice_type | String | 是 | 音色标识 |
| audio.speech_rate | Integer | 否 | 语速 [-50, 100]，默认 0 |
| Additions.enable_latex_tn | Boolean | 否 | 播报 LaTeX 公式 |
| Additions.disable_markdown_filter | Boolean | 否 | 过滤 Markdown 格式 |
| Additions.enable_language_detector | Boolean | 否 | 自动识别语种 |

#### ProviderParams - 火山语音合成大模型（非流式）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| audio.voice_type | String | 是 | 音色（仅支持 1.0 音色） |
| audio.speed_ratio | Float | 否 | 语速 [0.2, 3]，默认 1.0 |

#### ProviderParams - 火山语音合成（基础版）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| audio.voice_type | String | 是 | 音色：`BV001_streaming`（女）、`BV002_streaming`（男） |
| audio.speed_ratio | Float | 否 | 语速 [0.2, 3]，默认 1.0 |
| audio.volume_ratio | Float | 否 | 音量 [0.1, 3]，默认 1.0 |
| audio.pitch_ratio | Float | 否 | 音高 [0.1, 3]，默认 1.0 |

#### ProviderParams - 火山声音复刻大模型（流式）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| audio.voice_type | String | 是 | 复刻声音 ID |
| audio.speech_rate | Integer | 否 | 语速 [-50, 100]，默认 0 |
| ResourceId | String | 是 | 版本：`seed-icl-1.0`（1.0）、`seed-icl-2.0`（2.0） |
| Additions | Object | 否 | 高级配置（同语音合成大模型） |

#### ProviderParams - 火山声音复刻大模型（非流式）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| audio.voice_type | String | 是 | 复刻声音 ID |
| speed_ratio | Float | 否 | 语速 [0.8, 2]，默认 1.0 |
| app.cluster | String | 是 | 固定取值 `volcano_icl` |
| ResourceId | String | 是 | 固定取值 `seed-icl-1.0` |

#### ProviderParams - MiniMax 语音合成

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Authorization | String | 是 | API 密钥 |
| Groupid | String | 是 | 用户组 ID |
| model | String | 是 | 模型版本：`speech-01-turbo`/`speech-01-240228`/`speech-01-turbo-240228` |
| URL | String | 是 | 固定取值 `https://api.minimax.chat/v1/t2a_v2` |
| voice_setting.speed | Float | 否 | 语速 [0.5, 2]，默认 1.0 |
| voice_setting.vol | Float | 否 | 音量 (0, 10]，默认 1.0 |
| voice_setting.pitch | Float | 否 | 语调 [-12, 12]，默认 0 |
| voice_setting.voice_id | String | 否 | 系统/复刻音色编号 |
| language_boost | String | 否 | 小语种增强（如 Spanish/French/Japanese/auto） |

#### ProviderParams - 自定义 TTS

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| URL | String | 是 | 边缘大模型网关 URL：`wss://ai-gateway.vei.volces.com/v1/realtime?model=<TTS调用名称>` |
| APIKey | String | 是 | 网关访问密钥 |
| Voice | String | 是 | 音色名称 |
| OutputAudioSpeedRate | Float | 否 | 语速 |
| OutputAudioVolume | Float | 否 | 音量 |
| OutputAudioPitchRate | Float | 否 | 音调 |
| ExtraData | JSONMap | 否 | 自定义参数透传 |
| ExtraHeader | JSONMap | 否 | 自定义 Header 透传 |

#### TTSConfig.Context（情感控制）

> 仅在使用火山语音合成大模型（流式输入流式输出）时生效。

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| TagParse | Boolean | 否 | false | 开启 `{{...}}` 标签解析（情绪识别与生成） |
| QuoteUserQuestion | Boolean | 否 | true | 将用户问题作为上下文传递给 TTS（仅语音合成大模型 2.0） |
| Prefill | Boolean | 否 | true | LLM 结果实时送入 TTS 合成 |

---

### Config.LLMConfig（大模型配置）

支持三种大模型平台：

#### 方式一：火山方舟模型

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Mode | String | 是 | 固定取值 `ArkV3` |
| ModelName | String | 否 | 模型名称，如 `doubao-seed-1-8-251228` |
| Temperature | Float | 否 | 采样温度 (0, 1]，默认 0.1 |
| MaxTokens | Integer | 否 | 最大输出 token，默认 1024 |
| TopP | Float | 否 | 采样范围 [0, 1]，默认 0.3 |
| SystemMessages | String[] | 否 | 系统提示词 |
| UserPrompts | Object[] | 否 | 用户提示词（Role + Content） |
| HistoryLength | Integer | 否 | 上下文保留轮数，默认 3 |
| Tools | Object[] | 否 | Function Calling 工具声明 |
| EnableParallelToolCalls | Boolean | 否 | 允许并行工具调用，默认 true（仅 doubao-seed-1.6 系列） |
| Prefill | Boolean | 否 | ASR 中间结果提前送入 LLM，默认 false |
| VisionConfig | Object | 否 | 视觉理解配置 |
| ThinkingType | String | 否 | 深度思考：`disabled`（推荐）/`enabled`/`auto`/`null`（默认） |
| MCP | Object[] | 否 | MCP 工具服务配置 |

#### 方式二：Coze 智能体

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Mode | String | 是 | 固定取值 `CozeBot` |
| CozeBotConfig.Url | String | 是 | 固定取值 `https://api.coze.cn` |
| CozeBotConfig.BotId | String | 是 | Coze 智能体 ID |
| CozeBotConfig.APIKey | String | 是 | Coze 访问密钥 |
| CozeBotConfig.UserId | String | 是 | 用户标识（自行定义） |
| CozeBotConfig.HistoryLength | Integer | 否 | 历史轮数，默认 3 |
| CozeBotConfig.Prefill | Boolean | 否 | ASR 中间结果提前送入，默认 false |
| CozeBotConfig.EnableConversation | Boolean | 否 | 上下文存储在 Coze 平台，默认 false |
| CozeBotConfig.CustomVariables | JSONMap | 否 | Prompt 变量赋值（Jinja2） |
| CozeBotConfig.MetaData | JSONMap | 否 | 对话附加信息 |
| CozeBotConfig.Parameters | JSONMap | 否 | 对话流起始节点参数 |
| CozeBotConfig.ResponseTimeout | Integer | 否 | 回复超时 [0, 60] 秒，默认 10 |

#### 方式三：第三方大模型/Agent

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Mode | String | 是 | 固定取值 `CustomLLM` |
| Url | String | 是 | 第三方大模型请求 URL（HTTPS） |
| ModelName | String | 否 | 模型名称 |
| APIKey | String | 否 | Bearer Token 鉴权 |
| MaxTokens | Integer | 否 | 最大输出 token，默认 1024 |
| Temperature | Float | 否 | 采样温度 (0, 1]，默认 0.1 |
| TopP | Float | 否 | 采样范围 [0, 1]，默认 0.3 |
| SystemMessages | String[] | 否 | 系统提示词 |
| UserPrompts | Object[] | 否 | 用户提示词 |
| HistoryLength | Integer | 否 | 上下文保留轮数，默认 3 |
| Tools | Object[] | 否 | Function Calling 工具声明 |
| EnableParallelToolCalls | Boolean | 否 | 允许并行工具调用，默认 true |
| MCP | Object[] | 否 | MCP 工具服务配置 |
| Feature | String | 否 | `{"Http":true}` 允许 HTTP 域名测试 |
| Prefill | Boolean | 否 | ASR 中间结果提前送入，默认 false |
| VisionConfig | Object | 否 | 视觉理解配置 |

---

### VisionConfig（视觉理解配置，通用）

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| Enable | Boolean | 否 | false | 是否开启视觉理解 |
| SnapshotConfig.StreamType | Integer | 否 | 0 | 0=主流（摄像头），1=屏幕共享流 |
| SnapshotConfig.ImageDetail | String | 否 | auto | 图片处理模式：high/low/auto |
| SnapshotConfig.Height | Integer | 否 | 360 | 截图高度 [0, 1792] px |
| SnapshotConfig.Interval | Integer | 否 | 1000 | 截图间隔 [100, 5000] ms |
| SnapshotConfig.ImagesLimit | Integer | 否 | 2 | 单次送大模型截图数 [0, 50] |
| SnapshotConfig.AutoSelect | Boolean | 否 | false | 自动选帧（启用后 Interval 固定 166ms） |
| StorageConfig.Type | Integer | 否 | 0 | 0=Base64 缓存，1=TOS |
| StorageConfig.TosConfig.AccountId | String | 否 | - | 火山引擎主账号 ID |
| StorageConfig.TosConfig.Region | Integer | 否 | 0 | 存储桶区域 |
| StorageConfig.TosConfig.Bucket | String | 否 | - | 存储桶名称 |

---

### MCP 配置（通用结构）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| URL | String | 是 | MCP Server 访问地址（须支持流式 SSE） |
| Name | String | 是 | 唯一名称标识（不可与 Function Calling 工具重名） |
| ComfortWords | String | 否 | 调用 MCP 时播放的安抚语 |
| InterestedTools | String[] | 否 | 指定工具列表（空=全部工具） |

---

### Tools 结构（Function Calling，通用）

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| type | String | 是 | 固定取值 `function` |
| function.name | String | 是 | 函数名称 |
| function.description | String | 否 | 函数用途描述 |
| function.parameters | JSONMap | 否 | 函数参数（JSON Schema 格式） |

---

### Config.SubtitleConfig（实时字幕配置）

> 获取实时字幕（对话记录）。在与 AI 对话过程中，系统会自动生成用户和 AI 的对话文本。可通过客户端或服务端实时获取，用于实时展示或存储分析。

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| DisableRTSSubtitle | Boolean | 否 | false | 是否关闭房间内客户端字幕回调。`true`：不通过客户端接收字幕消息；`false`（默认）：通过客户端接收字幕消息，开启后需在客户端实现监听 `onRoomBinaryMessageReceived` 并解析字幕。如需通过服务端接收字幕回调，请配置 `AgentConfig.ServerMessageUrlForRTS` 和 `AgentConfig.ServerMessageSignatureForRTS` |
| SubtitleMode | Integer | 否 | 0 | 字幕类型：`0`=对齐时间戳字幕（字幕来源于 TTS，与 AI 实际播报音频在句子级别对齐）；`1`=快速字幕（将识别到的分句或整句一次性返回，不对齐音频时间戳，实现快速回调）；`2`=音频帧对齐字幕（音频帧与字幕精准对齐，实现逐字高亮效果，不可与 Burst 同时启用）。**注意**：使用数字人服务或豆包端到端实时语音大模型时，该字段必须取值 `1`。使用语音合成大模型 2.0 或声音复刻大模型 2.0 时，若设置 `SubtitleMode: 0` 则必须关闭 `enable_latex_tn` |

---

### Config.FunctionCallingConfig（Function Calling 服务端回调配置）

> 通过业务服务器接收 Function Calling 调用通知和调用指令消息。当配置了 `LLMConfig.Tools` 后，LLM 识别到工具调用意图时，会下发 FC 调用通知和调用指令消息。默认由客户端接收处理；如需在后端服务器上接收并处理则必须配置此项。

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| ServerMessageUrl | String | 是 | 业务服务器地址（URL），用于接收 Function Calling 调用通知和调用指令消息。要求：必须为公网可访问的域名地址；若使用 HTTPS 需确保 SSL 证书合法且完整；需确保该 URL 指向的服务端能正常处理无 Content-Type 的 POST 请求。**校验方法**：`curl -v -X POST <url>`，返回 301/302 表示不可用（POST 会被降级为 GET 导致数据丢失，建议直接配置 HTTPS 地址），返回 307/308 表示可用 |
| ServerMessageSignature | String | 是 | 签名密钥，用于验证回调请求的真实性（由您自定义）。平台向 ServerMessageUrl 发送回调请求时，会在请求体返回 `signature` 字段，服务端须校验其值是否与预设密钥一致 |

---

### Config.InterruptMode（语音打断模式）

| 值 | 描述 |
|----|------|
| 0（默认） | 开启语音打断。一旦检测到用户发出声音，AI 立刻停止输出 |
| 1 | 关闭语音打断。AI 说话期间，用户语音输入内容会被忽略不做处理，不会打断 AI 讲话 |

---

### Config.AvatarConfig（数字人配置）

> 仅支持接入火山引擎数字人。启用前请确保已按要求准备好数字人资源。

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| Enabled | Boolean | 否 | false | 是否启用火山引擎数字人 |
| AvatarAppID | String | 条件必填 | - | 数字人服务 AppID。当 `Enabled` 为 true 时必填。联系技术支持开通直播互动数字人并购买并发后获取 |
| AvatarToken | String | 条件必填 | - | 数字人服务 Token。当 `Enabled` 为 true 时必填 |
| AvatarType | String | 条件必填 | - | 数字人类型。当前固定取值 `3min`，表示 3min 克隆数字人。当 `Enabled` 为 true 时必填 |
| AvatarRole | String | 条件必填 | - | 数字人形象唯一 ID（resource_id），可通过查询接口获取。当 `Enabled` 为 true 时必填 |
| AvatarUserID | String | 否 | AgentConfig.UserId + `_Avatar` | 数字人在房间内的 ID。命名规则：大小写字母、数字、`_`、`-`、`.`、`@`，最大 128 字符。不能与 `AgentConfig.UserId` 和 `TargetUserId` 相同。启用数字人后房间内存在三个用户：真人用户、AI 智能体、数字人。发送控制指令（如手动打断）目标为 AI 智能体 ID；处理数字人画面渲染/流状态回调目标为 AvatarUserID |
| BackgroundUrl | String | 否 | - | 数字人背景图 URL。需公网可访问，且带有图片格式后缀（如 `.png`、`.jpg`） |
| VideoBitrate | Integer | 否 | 2000 | 数字人视频码率（kbps），取值范围 [100, 8000] |

---

### Config.WebSearchAgentConfig（联网问答 Agent 配置）

> 将火山联网问答 Agent 作为内置工具接入（通过 Function Calling 机制），让 AI 具备实时从互联网检索信息并进行总结回答的能力（如查询最新资讯、获取天气信息、询问实时股价等）。
>
> **注意**：仅支持 Function Calling 的第三方大模型或火山方舟模型支持该功能。不建议使用 `doubao-seed-1.6-thinking`（该模型会强制开启思考模式，不可关闭，可能造成较高时延）。

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| Enable | Boolean | 否 | false | 是否启用联网问答能力。开启前请确保已创建联网问答 Agent 并正式开通 |
| APIKey | String | 条件必填 | - | 联网问答 Agent 服务的 API Key，在联网问答 Agent 控制台创建并获取。当 `Enable` 为 true 时必填 |
| ParamsString | String | 条件必填 | - | 透传联网问答 Agent 服务的参数（JSON 字符串）。当 `Enable` 为 true 时必填。必须包含 `bot_id`（联网问答 Agent ID）和 `stream: true`。示例：`"{\"bot_id\":\"7429...747\",\"stream\":true}"` |
| FunctionName | String | 条件必填 | - | 自定义名称，作为 AI 触发联网时调用的函数名。当 `Enable` 为 true 时必填。不能与 `Tools.function.name` 和 `MCP.Name` 重名 |
| FunctionDescription | String | 条件必填 | - | 用自然语言描述希望 AI 在什么情况下触发联网搜索（作为 Prompt 的一部分帮助 LLM 判断是否触发）。当 `Enable` 为 true 时必填。示例：`"查询实时信息，如今天的天气、最新的新闻、A 股票的当前价格等"` |
| ComfortWords | String | 否 | - | 安抚语。触发联网搜索时先通过 TTS 播报，提升等待体验。留空则不播报。**注意**：安抚语结尾需带标点符号 |
| DisableImageSearch | Boolean | 否 | false | 是否关闭联网图搜功能。`false`（默认）：开启，触发联网搜索时会携带当前缓存的图片；`true`：仅发送文本。联网图搜仅在模型支持且开启视觉理解能力时生效（`VisionConfig.Enable` 为 true） |

---

### Config.MemoryConfig（记忆库配置）

> 通过接入火山记忆库（基于向量数据库 VikingDB），赋予智能体跨会话的长期记忆能力。配置前请确保已创建记忆库并完成授权。

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| Enable | Boolean | 否 | false | 是否开启记忆库检索。开启后智能体回复前会先检索记忆库，并将「用户问题 + 过渡语 + 所有被采纳的记忆」一同作为上下文提供给 LLM |
| Provider | String | 条件必填 | - | 记忆库服务提供商。当前固定取值 `volc`（火山记忆库）。当 `Enable` 为 true 时必填 |
| ProviderParams | Object | 条件必填 | - | 记忆库详细配置。当 `Enable` 为 true 时必填 |

#### ProviderParams 子字段

| 参数名 | 类型 | 必选 | 默认值 | 描述 |
|--------|------|------|--------|------|
| collection_name | String | 条件必填 | - | 要检索的记忆库名称，需与在火山记忆库控制台中配置的名称一致。当 `Enable` 为 true 时必填 |
| filter | Object | 条件必填 | - | 检索过滤条件，用于精确筛选需要召回的记忆。当 `Enable` 为 true 时必填 |
| filter.user_id | String[] | 否 | - | 用户 ID 列表，筛选特定用户的记忆。`user_id` 和 `assistant_id` 至少填写一个。对应 VikingDB AddSession 接口中 `default_user_id` 或 `role_id` |
| filter.assistant_id | String[] | 否 | - | Assistant ID，筛选特定智能体产生或参与的记忆。`user_id` 和 `assistant_id` 至少填写一个。对应 VikingDB AddSession 接口中 `default_assistant_id` 或 `role_id` |
| filter.memory_type | String[] | 条件必填 | - | 记忆抽取规则（当前仅支持事件规则）。填入创建记忆库时定义的事件规则名称。当 `Enable` 为 true 时必填 |
| filter.group_id | String[] | 否 | - | 群组 ID，对应 VikingDB AddSession 接口中 `group_id` |
| filter.session_id | String[] | 否 | - | 会话 ID，对应 VikingDB AddSession 接口中 `session_id` |
| filter.start_time | Integer | 否 | - | 检索记忆的起始时间（毫秒级 Unix 时间戳） |
| filter.end_time | Integer | 否 | - | 检索记忆的终止时间（毫秒级 Unix 时间戳） |
| limit | Integer | 否 | 10 | 单次召回记忆的最大条数，取值范围 [1, 5000] |
| transition_words | String | 否 | - | 过渡语。插入到用户问题和召回的记忆内容之间，作为上下文一同发送给大模型，引导 LLM 理解和组织回复 |
| Score | Float | 否 | 0 | 召回记忆的置信度阈值 [0.0, 1.0]。只有得分不低于阈值的记忆会被采纳；默认 0 表示不过滤 |

---

### Config.S2SConfig（端到端实时语音大模型配置）

> 相较于 ASR+LLM+TTS 方案，端到端模型可直接完成语音输入输出，降低模块间的处理与传输延迟，提供更流畅、更自然的对话体验。
>
> **注意**：
> - 目前仅支持接入豆包端到端实时语音大模型
> - 使用前需在豆包语音控制台开通"豆包端到端实时语音大模型"服务并获取 appid 和 token
> - 配置 S2SConfig 后，ASRConfig 和 TTSConfig 失效
> - 通过服务端/客户端 API 发送的 `ExternalPromptsForLLM` 和 `ExternalTextForTTS` 指令也将失效

| 参数名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| Enable | Boolean | 否 | 是否启用端到端语音模型 |
| Provider | String | 条件必填 | 端到端语音模型提供商。当前固定取值 `doubao_s2s` |
| ProviderParams | Object | 条件必填 | 端到端语音模型的详细配置 |
| ProviderParams.AppId | String | 条件必填 | 豆包语音控制台获取的 AppID |
| ProviderParams.Token | String | 条件必填 | 豆包语音控制台获取的 Token |
| ProviderParams.ModelName | String | 否 | 模型名称 |
| ProviderParams.SystemMessages | String[] | 否 | 系统提示词 |
| ProviderParams.Voice | String | 否 | 音色标识 |

---

## 请求示例

```json
{
  "AppId": "661*****3cf",
  "RoomId": "Room1",
  "TaskId": "task1",
  "BusinessId": "chatroom",
  "Config": {
    "ASRConfig": {
      "Provider": "volcano",
      "ProviderParams": {
        "Mode": "bigmodel",
        "VolcanoASRParameters": "{}",
        "StreamMode": 2
      },
      "VADConfig": {
        "SilenceTime": 600
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
      "SystemMessages": ["你是一个友好的AI助手"],
      "HistoryLength": 3
    },
    "SubtitleConfig": {
      "SubtitleMode": 1
    },
    "InterruptMode": 0,
    "WebSearchAgentConfig": {
      "Enable": true,
      "APIKey": "your_agent_apikey",
      "ParamsString": "{\"bot_id\":\"7429...747\",\"stream\":true}",
      "FunctionName": "WebSearch",
      "FunctionDescription": "查询实时信息，如今天的天气、最新的新闻、A 股票的当前价格等"
    }
  },
  "AgentConfig": {
    "TargetUserId": ["user123"],
    "UserId": "BotAgent01",
    "WelcomeMessage": "你好，有什么我可以帮助你的？",
    "IdleTimeout": 180
  }
}
```

## 返回参数

调用成功返回 HTTP 200，代表任务下发成功。

---

## 相关接口

| 接口 | 描述 |
|------|------|
| UpdateVoiceChat | 更新 AI 对话配置 |
| StopVoiceChat | 结束 AI 对话 |

---

*来源：https://www.volcengine.com/docs/6348/2123348*
