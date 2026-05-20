import { ChevronDown } from "lucide-react";
import { useWorkspaceStore } from "../store/workspace";
import { ModeSwitcher } from "./CenterHeaderControls";

export default function VisualConfigPanel() {
  const { theme, orchestrationPreset } = useWorkspaceStore();
  const isDark = theme === 'dark';
  const isBlankPreset = orchestrationPreset === 'blank';

  const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className={`mb-6 pb-6 border-b border-dashed ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
      <div className="flex items-center mb-6">
        <div className="w-1 h-4 bg-blue-600 mr-2 rounded-sm"></div>
        <h3 className={`font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>{title}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );

  const FormRow = ({ label, required, children }: { label: string, required?: boolean, children: React.ReactNode }) => (
    <div className="flex items-start">
      <div className={`w-32 pt-2 text-sm flex-shrink-0 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );

  const ButtonGroup = ({ options, activeIndex }: { options: string[], activeIndex?: number }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt, i) => (
        <button
          key={i}
          className={`px-4 py-1.5 text-sm rounded border ${
            activeIndex !== undefined && i === activeIndex
              ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400'
              : `${isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  const Switch = ({ active, label }: { active: boolean, label?: string }) => (
    <div className="flex items-center gap-3">
      <div className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${active ? 'bg-blue-600' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'}`}>
        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
      {label && <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</span>}
    </div>
  );

  const Select = ({ value, subText, placeholder = "未配置" }: { value: string, subText?: string, placeholder?: string }) => (
    <div className={`flex items-center justify-between px-3 py-1.5 border rounded text-sm w-full max-w-md ${isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-300' : 'border-zinc-200 bg-white text-zinc-700'}`}>
      <div className="flex items-center gap-2">
        <span className={value ? '' : `${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{value || placeholder}</span>
        {subText && <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500">{subText}</span>}
      </div>
      <ChevronDown className="w-4 h-4 text-zinc-400" />
    </div>
  );

  const MoreConfig = () => (
    <div className="flex items-center justify-center mt-4">
      <button className={`flex items-center gap-1 text-sm ${isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'}`}>
        <span>更多配置</span>
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-zinc-950' : 'bg-white'}`}>
      {/* Header */}
      <div className="h-12 flex items-center px-5 shrink-0 transition-colors relative justify-between bg-transparent">
        <div className="flex items-center">
          <ModeSwitcher />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full mx-auto p-8 min-h-full">
        
        <Card title="大模型 (LLM)">
          <FormRow label="模型" required>
            <ButtonGroup options={["方舟大模型", "扣子 (Coze)", "第三方大模型 / Agent"]} activeIndex={isBlankPreset ? undefined : 0} />
          </FormRow>
          
          <FormRow label="ModelName" required>
            <Select value={isBlankPreset ? "" : "doubao-1.5-pro-32k-character-250715"} subText={isBlankPreset ? undefined : "健康"} />
          </FormRow>

          <FormRow label="视觉理解">
            <Switch active={false} label="开启后模型可以理解图片/视频，仅对多模态类任务生效；非多模态类请勿开启，避免浪费。" />
          </FormRow>

          <FormRow label="Prompt">
            <div className={`w-full h-24 rounded border p-3 text-sm ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`}>
              <div className="flex items-center justify-between mb-1">
                <span>## 人设</span>
                <span className="text-xs text-blue-500 cursor-pointer hover:underline">更多配置</span>
              </div>
              {isBlankPreset ? (
                <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>暂未填写 Prompt</span>
              ) : (
                '你是一名AI贴身角色，扮演用户的虚拟女友，性格外向开朗、童真伶俐，富有温暖和甜甜的情感表达，你的对话需主...'
              )}
            </div>
          </FormRow>
          
          <MoreConfig />
        </Card>

        <Card title="语音识别 (ASR)">
          <FormRow label="模型" required>
            <ButtonGroup options={["火山引擎流式语音识别大模型", "火山引擎离线语音识别"]} activeIndex={isBlankPreset ? undefined : 0} />
          </FormRow>
          
          <FormRow label="语音识别模式" required>
            <ButtonGroup options={["流式输入流式输出", "流式输入非流式输出", "双向流式优化版"]} activeIndex={isBlankPreset ? undefined : 0} />
          </FormRow>

          <MoreConfig />
        </Card>

        <Card title="语音合成 (TTS)">
          <FormRow label="语音合成模式" required>
            <ButtonGroup options={["流式输入流式输出", "非流式输入流式输出"]} activeIndex={isBlankPreset ? undefined : 0} />
          </FormRow>

          <FormRow label="模型" required>
            <div className="flex gap-4">
              <Select value={isBlankPreset ? "" : "火山引擎语音合成大模型"} subText={isBlankPreset ? undefined : "1.0版本"} />
              <Select value={isBlankPreset ? "" : "火山引擎声音复刻大模型"} subText={isBlankPreset ? undefined : "1.0版本"} />
            </div>
          </FormRow>

          <FormRow label="选择合成音色" required>
            <Select value={isBlankPreset ? "" : "活泼可盐 (ICL_zh_female_huopodiaoman_tob)"} />
          </FormRow>

          <MoreConfig />
        </Card>

          <Card title="其他配置">
          <FormRow label="客户昵称">
            <Switch active={isBlankPreset ? false : true} label="开启后，可以改对话昵称" />
          </FormRow>

          <FormRow label="服务器消息签名">
            <div className="space-y-3">
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>服务端推送消息需开启，请填写以下信息</p>
              <div className="flex items-center gap-4">
                <span className={`text-sm w-40 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>ServerMessageUrl</span>
                <input 
                  type="text" 
                  placeholder="提供字节服务的URL地址，通过服务端推送收字节需回调时必填" 
                  className={`flex-1 px-3 py-1.5 text-sm rounded border ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-white border-zinc-200 text-zinc-600 placeholder-zinc-400'}`} 
                />
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm w-40 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>ServerMessageSignature</span>
                <input 
                  type="text" 
                  placeholder="鉴权签名，通过服务端推送收字节需回调时必填" 
                  className={`flex-1 px-3 py-1.5 text-sm rounded border ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-white border-zinc-200 text-zinc-600 placeholder-zinc-400'}`} 
                />
              </div>
            </div>
          </FormRow>

          <FormRow label="字数时间限制展示模式">
            <ButtonGroup options={["对齐音视频时间戳", "不对齐音频时间戳"]} activeIndex={isBlankPreset ? undefined : 0} />
          </FormRow>

          <FormRow label="欢迎语 WelcomeMessage">
            <input 
              type="text" 
              value={isBlankPreset ? "" : "嗨～你会什么呀？我学你怎么个..."} 
              className={`w-full max-w-md px-3 py-1.5 text-sm rounded border ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-600'}`} 
              readOnly
            />
          </FormRow>
          </Card>
        </div>
      </div>
    </div>
  );
}
