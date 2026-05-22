import { Phone, Mic, MicOff, Video, VideoOff, User, Share, X, MonitorSmartphone, Info, Activity, Copy, Check } from "lucide-react";
import { useWorkspaceStore } from "../store/workspace";
import { useState, useRef, MouseEvent, useEffect } from "react";

type PreviewPanelProps = {
  onOpenAssistant?: () => void;
};

export default function PreviewPanel({ onOpenAssistant }: PreviewPanelProps) {
  const { 
    isCalling, isMicOn, isVideoOn, toggleCall, toggleMic, toggleVideo, theme, callError, setChatInput, agentName,
    previewAgent
  } = useWorkspaceStore();
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCallInfo, setShowCallInfo] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const displayAgentName = previewAgent ? previewAgent.name : agentName;
  const isTemplatePreviewMode = Boolean(previewAgent);
  
  const handleToggleCall = () => {
    if (!isCalling && previewAgent) {
      toggleCall(previewAgent.configJson);
    } else {
      toggleCall();
    }
  };

  // State for call info
  const [callInfoData, setCallInfoData] = useState({
    appId: "",
    roomId: "",
    userId: ""
  });

  useEffect(() => {
    if (isCalling) {
      setCallInfoData({
        appId: "6943d3561511bb0173868a93",
        roomId: `ConversationalAIRoom_${Date.now()}`,
        userId: "Huoshan01"
      });
    }
  }, [isCalling]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0, startY: 0, initialX: 0, initialY: 0
  });

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dx = dragRef.current.startX - e.clientX;
    const dy = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: Math.max(0, dragRef.current.initialX + dx),
      y: Math.max(0, dragRef.current.initialY + dy)
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderHeader = () => (
    <div className="min-h-20 flex flex-col px-5 py-3 shrink-0 transition-colors z-30 relative bg-transparent gap-2">
      <div className="flex items-center gap-2">
        <MonitorSmartphone className={`w-4 h-4 shrink-0 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
        <h2 className={`text-sm font-semibold tracking-wide truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>
          {isTemplatePreviewMode ? '模板预览' : '预览调试'}
        </h2>
      </div>
      
      {!isTemplatePreviewMode ? (
        <div className="flex w-full items-center justify-end gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setShowCallInfo(!showCallInfo)}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              showCallInfo 
                ? 'bg-blue-500 text-white shadow-sm' 
                : theme === 'dark' 
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 shadow-sm'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            本次通话信息
          </button>
          <button
            disabled={true}
            className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              theme === 'dark' ? 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed' : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            本次通话延时分析
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderCallInfoPanel = () => {
    if (isTemplatePreviewMode || !showCallInfo) return null;
    return (
      <div className="absolute top-24 right-5 w-[340px] z-50 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className={`rounded-xl shadow-2xl border overflow-hidden backdrop-blur-xl ${
          theme === 'dark' 
            ? 'bg-zinc-900/95 border-zinc-800' 
            : 'bg-white/95 border-zinc-200'
        }`}>
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            theme === 'dark' ? 'border-zinc-800/50 bg-indigo-950/20' : 'border-zinc-100 bg-indigo-50/50'
          }`}>
            <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'}`}>
              本次通话房间信息
            </h3>
          </div>
          
          <div className="px-4 py-3">
            <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              如遇问题可提供相关 Id 获取技术支持
            </p>
            
            <div className="space-y-2.5">
              {[
                { label: 'AppId', value: callInfoData.appId, key: 'appId' },
                { label: 'RoomId', value: callInfoData.roomId, key: 'roomId' },
                { label: 'UserId', value: callInfoData.userId, key: 'userId' }
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-[52px] shrink-0 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {item.label}
                  </span>
                  <div className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-md border min-w-0 h-[30px] ${
                    theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className={`text-xs truncate font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      {item.value || "--"}
                    </span>
                    {item.value && (
                      <button
                        onClick={() => handleCopy(item.value, item.key)}
                        className={`ml-1.5 shrink-0 p-1 rounded transition-colors ${
                          copiedField === item.key
                            ? 'text-green-500 bg-green-50 dark:bg-green-500/10'
                            : theme === 'dark'
                              ? 'text-blue-400 hover:bg-zinc-800'
                              : 'text-blue-500 hover:bg-blue-50'
                        }`}
                        title="复制"
                      >
                        {copiedField === item.key ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isCalling) {
    return (
      <div className={`flex flex-col h-full relative transition-colors overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
      }`}>
        {/* Header */}
        {renderHeader()}

        {/* Floating Call Info Panel */}
        {renderCallInfoPanel()}

        {/* Pre-call UI */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="flex flex-col items-center mb-8 relative">
            <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-pink-200 via-purple-200 to-indigo-200 dark:from-pink-900/40 dark:via-purple-900/40 dark:to-indigo-900/40 blur-xl"></div>
            <div className="w-48 h-48 mb-8 z-10"></div>
            <h2 className="text-xl font-medium z-10">{displayAgentName}</h2>
          </div>

          {/* Call Button */}
          <div className="flex flex-col items-center mt-32 mb-8">
            <button
              onClick={handleToggleCall}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCalling && callError) {
    let errorObj: any = {};
    try {
      errorObj = JSON.parse(callError);
    } catch (e) {
      errorObj = { ErrorInfo: { Reason: callError } };
    }

    const errorCode = errorObj.ErrorInfo?.Errorcode || 'Unknown';
    const errorMsg = errorObj.ErrorInfo?.Reason || 'Unknown';

    const handleSendToAssistant = () => {
      const msg = `我遇到了错误，Error Code：${errorCode}，Error Message：${errorMsg}。请帮我排查原因。`;
      setChatInput(msg);
      onOpenAssistant?.();
    };

    return (
      <div className={`flex flex-col h-full relative transition-colors overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
      }`}>
        {/* Header */}
        {renderHeader()}

        {/* Floating Call Info Panel */}
        {renderCallInfoPanel()}

        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-zinc-800 dark:text-zinc-100">启动智能体失败</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-6 max-w-md leading-relaxed">
            启动智能体失败，请检查配置。<br />
            你可以将以下错误信息发送给 Agent 助手进行排查：
          </p>
          
          <div className={`w-full max-w-md rounded-2xl p-6 flex flex-col space-y-5 mb-4 shadow-sm relative overflow-hidden group border transition-colors ${
            theme === 'dark'
              ? 'bg-red-950/20 border-red-900/50'
              : 'bg-red-50 border-red-200'
          }`}>
            {/* 科技感装饰元素 */}
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
              theme === 'dark' ? 'bg-red-500/10' : 'bg-red-500/5'
            }`}></div>
            
            <div className="flex flex-col z-10 space-y-1.5">
              <span className={`text-[11px] uppercase tracking-widest font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Error Code</span>
              <span className={`text-sm font-mono font-medium ${theme === 'dark' ? 'text-zinc-300' : 'text-[#1F2937]'}`}>{errorCode}</span>
            </div>
            
            <div className="flex flex-col z-10 space-y-1.5">
              <span className={`text-[11px] uppercase tracking-widest font-semibold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Error Message</span>
              <span className={`text-sm ${theme === 'dark' ? 'text-zinc-300' : 'text-[#1F2937]'}`}>{errorMsg}</span>
            </div>

            <div className="pt-4 flex justify-end z-10">
              <button 
                onClick={handleSendToAssistant}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full text-[11px] font-medium hover:shadow-md hover:from-indigo-400 hover:to-blue-400 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>发给小助手</span>
                <Share className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Call Button */}
          <div className="flex flex-col items-center mt-32 mb-8">
            <button
              onClick={handleToggleCall}
              className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-300 transition-colors mb-2"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">返回</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex flex-col h-full relative transition-colors overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'
      }`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header */}
      {renderHeader()}

      <div className="flex-1 relative">
        {/* Floating Call Info Panel */}
        {renderCallInfoPanel()}

      {/* Subtitles Area (Left side) */}
      <div className="absolute top-24 left-6 max-w-[60%] flex flex-col space-y-6 z-10">
        {/* Agent Subtitle */}
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">智能体 (webRealtimeAI_Huoshan...)</span>
          <span className="text-sm text-zinc-800 dark:text-zinc-200">
            我是你的AI助手，有什么需要我为您效劳的吗？
          </span>
        </div>
        
        {/* User Subtitle */}
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">我 (user_12345)</span>
          <span className="text-sm text-zinc-800 dark:text-zinc-200">
            帮我配置一个房间
          </span>
        </div>
      </div>

      {/* Center Avatar / Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-pink-200 via-purple-200 to-indigo-200 dark:from-[#402a3a] dark:via-[#3b2b40] dark:to-[#2d283e] blur-3xl opacity-80"></div>

      {/* Floating Video Tile (Draggable) */}
      {isVideoOn && (
        <div 
          className="absolute w-32 h-48 bg-slate-50 dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-100 dark:border-zinc-800 overflow-hidden flex items-center justify-center cursor-move z-20"
          style={{ top: `${position.y}px`, right: `${position.x}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none backdrop-blur-sm">
            Huoshan01
          </div>
          <User className="w-12 h-12 text-zinc-300 dark:text-zinc-700 pointer-events-none" />
        </div>
      )}

      {/* Call Status & Controls */}
      <div className="absolute bottom-12 w-full flex flex-col items-center space-y-8 z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-white"></div>
          </div>
          <span className="text-zinc-800 dark:text-white text-base">你可以开始说话</span>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleMic}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isMicOn 
                ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700" 
                : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {isMicOn ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </button>

          <button 
            onClick={toggleVideo}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isVideoOn 
                ? "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700" 
                : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {isVideoOn ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
          </button>

          <button 
            onClick={handleToggleCall}
            className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-2">内容由 AI 生成</span>
        </div>
      </div>
    </div>
  );
}
