export const FEATURE_CONFIG_TABS = [
  {
    key: "voiceprint-denoise",
    label: "声纹降噪",
    description: "开启后可在保留人声特征的前提下抑制环境噪声，提升识别稳定性。",
    notes: [
      "适用于嘈杂环境下的身份确认、说话人分析和语音留痕场景。",
      "建议在多设备、多麦克风输入场景下结合增益和采样率配置一起使用。",
    ],
  },
  {
    key: "multi-voiceprint-identification",
    label: "多人声纹识别",
    description: "开启后可对会话中的多位说话人进行区分与识别，支持多人互动分析。",
    notes: [
      "适用于会议纪要、客服质检、多人访谈等需要区分说话人的场景。",
      "建议先确认音频输入质量和说话人数量范围，以获得更稳定的识别效果。",
    ],
  },
  {
    key: "hardware-scene",
    label: "硬件场景接入",
    description: "开启后可适配硬件终端接入，统一管理设备侧互动能力。",
    notes: [
      "适用于机器人、屏显设备、会议终端等硬件一体化接入场景。",
      "建议提前校验设备 SDK 版本和网络环境，确保链路能力兼容。",
    ],
  },
  {
    key: "snapshot",
    label: "抽帧截图",
    description: "开启后支持按房间或流进行截图，用于质检、审核和留档。",
    notes: [
      "抽帧截图适用于内容审核、会话取证和业务留痕等场景。",
      "建议结合截图频率和存储策略使用，避免产生不必要的资源开销。",
    ],
  },
  {
    key: "callback",
    label: "回调设置",
    description: "开启后可接收关键事件回调，便于业务侧做状态同步与告警。",
    notes: [
      "建议在生产环境配置稳定的回调地址，并开启签名校验。",
      "回调失败可能影响业务事件同步，建议配合重试和监控策略使用。",
    ],
  },
  {
    key: "rts-message",
    label: "RTS 实时消息",
    description: "开启后可在互动链路中发送低延时实时消息，用于控制和信令同步。",
    notes: [
      "适用于字幕透传、控制信令、状态同步等低延时交互场景。",
      "建议结合消息频率限制和业务幂等处理，避免重复消费。",
    ],
  },
  {
    key: "cloud-recording",
    label: "云端录制",
    description: "开启后可使用云端录制能力，并按实际使用量计费。",
    notes: [
      "开启并使用云端录制功能将产生额外费用，详细计费规则请参见计费说明。",
      "如需接收录制回调事件，完成功能配置后，请前往回调设置。",
    ],
  },
] as const;

export type FeatureConfigTabKey = (typeof FEATURE_CONFIG_TABS)[number]["key"];
