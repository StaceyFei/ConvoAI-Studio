import { useWorkspaceStore } from "../store/workspace";

export function ModeSwitcher() {
  const { theme, viewMode, setViewMode } = useWorkspaceStore();
  const modes = [
    { key: 'detail' as const, label: '智能体详情' },
    { key: 'code' as const, label: '代码示例' },
  ];

  return (
    <div className={`flex items-center p-0.5 rounded-md text-xs font-medium transition-colors ${
      theme === 'dark' ? 'bg-zinc-800/50' : 'bg-zinc-100/80'
    }`}>
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => setViewMode(mode.key)}
          className={`px-3 py-1.5 rounded-[4px] transition-all ${
            viewMode === mode.key
              ? 'bg-white text-blue-600 shadow-sm dark:bg-zinc-700 dark:text-blue-400'
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
