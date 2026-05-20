import { Mic, Loader2, ArrowUp, BotMessageSquare } from "lucide-react";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useWorkspaceStore } from "../store/workspace";
import JsonCodeBlock from "./JsonCodeBlock";

// Web Speech API interfaces
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```(?:json)?\n[\s\S]*?\n```)/g).filter(Boolean);

  return (
    <>
      {parts.map((part, index) => {
        const codeMatch = part.match(/^```(?:json)?\n([\s\S]*?)\n```$/);
        if (!codeMatch) {
          return <span key={index}>{part}</span>;
        }

        return <JsonCodeBlock key={index} code={codeMatch[1]} fileName="StartVoiceChat" />;
      })}
    </>
  );
}

export default function ChatPanel() {
  const { chatMessages, isGenerating, sendMessage, theme, stopGenerating, chatInput, setChatInput } = useWorkspaceStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN'; // Default to Chinese since context is Chinese

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Only update with final results to avoid overwriting typed text with partial recognition
        if (finalTranscript) {
          const currentInput = useWorkspaceStore.getState().chatInput;
          setChatInput(currentInput + (currentInput.length > 0 && !currentInput.endsWith(' ') ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'network') {
          alert('网络错误：浏览器的语音识别服务可能被拦截或无法连接，请检查网络设置或使用代理。');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
      }
    }
  };

  const handleSend = () => {
    if (!chatInput.trim() || isGenerating) return;
    sendMessage(chatInput.trim());
    setChatInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full transition-colors ${
      theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`h-12 flex items-center px-4 shrink-0 transition-colors ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}>
        <div className="flex items-center gap-2">
          <BotMessageSquare className={`w-4 h-4 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
          <h2 className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>辅助开发小助手</h2>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-lg p-3 text-sm max-w-[90%] whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : theme === 'dark' ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-800"
              }`}
            >
              <MessageContent content={msg.content} />
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className={`rounded-lg p-3 text-sm flex items-center space-x-2 ${
              theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-800'
            }`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Agent 正在思考...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={`p-4 transition-colors ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}>
        {/* Quick Options */}
        <div className="flex overflow-x-auto space-x-2 mb-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            "我想跑通一个基础对话流程",
            "我想在对话中增加联网查询能力",
            "我想实现多人识别和个性化回复",
            "我想让ai正确朗读数学公式",
            "我想把ai的语速调快一点"
          ].map((option, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isGenerating) {
                  sendMessage(option);
                }
              }}
              disabled={isGenerating}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full border transition-colors ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="relative">
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你的需求..."
            className={`block w-full border rounded-lg pl-3 pr-24 pt-3 pb-4 text-sm resize-none outline-none transition-colors ${
              theme === 'dark' 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-blue-500/70' 
                : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-400'
            }`}
            rows={3}
          />
          <div className="absolute right-3 bottom-3 flex space-x-2">
            {isSpeechSupported && (
              <button
                onClick={toggleRecording}
                className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                  isRecording 
                    ? "bg-red-500 text-white animate-pulse" 
                    : theme === 'dark'
                      ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800"
                }`}
                title={isRecording ? "停止录音" : "开始语音输入"}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
            {isGenerating ? (
              <button
                onClick={stopGenerating}
                className={`p-2 rounded-md transition-colors flex items-center justify-center ${
                  theme === 'dark' 
                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                    : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                }`}
                title="停止生成"
              >
                <div className="w-3 h-3 bg-current rounded-sm"></div>
              </button>
            ) : (
              <button
                onClick={handleSend}
                className={`p-2 rounded-md transition-colors flex items-center justify-center disabled:cursor-not-allowed ${
                  chatInput.trim()
                    ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                    : theme === 'dark'
                      ? "bg-zinc-800 text-zinc-500"
                      : "bg-zinc-100 text-zinc-500"
                }`}
                disabled={!chatInput.trim()}
                title="发送"
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
