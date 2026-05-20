import { useEffect } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { ChevronLeft } from "lucide-react";
import CodeExamplePanel from "./CodeExamplePanel";
import EditorPanel from "./EditorPanel";
import PreviewPanel from "./PreviewPanel";
import { useWorkspaceStore } from "../store/workspace";

type WorkspaceProps = {
  onOpenAssistant?: () => void;
};

export default function Workspace({ onOpenAssistant }: WorkspaceProps) {
  const { theme, viewMode, setCurrentSection } = useWorkspaceStore();
  const renderMainPanel = () => {
    if (viewMode === 'code') return <CodeExamplePanel />;
    return <EditorPanel />;
  };

  // 同步 theme 到 HTML 根元素，解决刷新不同步问题
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className={`h-full w-full overflow-hidden flex flex-col transition-colors ${
      theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Top Header Bar */}
      <header className={`h-14 flex items-center px-4 shrink-0 transition-colors z-20 relative shadow-sm ${
        theme === 'dark' ? 'bg-zinc-950 border-b border-zinc-800' : 'bg-white border-b border-zinc-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <button 
            className={`p-1.5 -ml-1 rounded-md transition-colors ${
              theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
            }`}
            title="返回智能体列表"
            onClick={() => setCurrentSection('agents')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
            {useWorkspaceStore(state => state.agentName).charAt(0) || 'A'}
          </div>
        </div>

        <div className="flex-1 min-w-[120px] ml-3 flex items-center">
          <div className={`text-[15px] font-semibold tracking-wide ${
            theme === 'dark' ? 'text-zinc-100' : 'text-zinc-800'
          }`}>
            {useWorkspaceStore(state => state.agentName)}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full w-full">
          {/* Left Panel: detail or code example */}
          <Panel defaultSize={58} minSize={20} className="relative z-10">
            {renderMainPanel()}
          </Panel>

          {/* Resizer */}
          <Separator className="relative w-2 cursor-col-resize group flex items-center justify-center z-20">
            <div className={`w-[1px] h-full transition-all duration-300 ease-out ${
              theme === 'dark' 
                ? 'bg-zinc-800 group-hover:bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] group-active:bg-blue-400' 
                : 'bg-zinc-200 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.6)] group-active:bg-blue-500'
            }`} />
          </Separator>

          {/* Preview Panel */}
          <Panel defaultSize={42} minSize={30} className="relative z-10">
            <PreviewPanel onOpenAssistant={onOpenAssistant} />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
