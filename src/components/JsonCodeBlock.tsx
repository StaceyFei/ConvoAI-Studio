import { CheckCircle2, Copy, Maximize2, WrapText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type JsonCodeBlockProps = {
  code: string;
  fileName?: string;
  maxHeightClass?: string;
  fillHeight?: boolean;
};

type Token = {
  value: string;
  className: string;
};

const tokenPattern = /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\]:,])/g;

function getTokenClass(token: string) {
  if (/^".*"(?=\s*$)/.test(token)) return "text-emerald-300";
  if (/^-?\d/.test(token)) return "text-amber-300";
  if (token === "true" || token === "false") return "text-purple-300";
  if (token === "null") return "text-slate-400";
  if (/^[{}\[\]]$/.test(token)) return "text-slate-300";
  if (/^[:,]$/.test(token)) return "text-slate-500";
  return "text-slate-100";
}

function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(tokenPattern)) {
    const value = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ value: code.slice(lastIndex, index), className: "text-slate-100" });
    }

    const isKey = value.startsWith('"') && code.slice(index + value.length).match(/^\s*:/);
    tokens.push({
      value,
      className: isKey ? "text-sky-300" : getTokenClass(value),
    });
    lastIndex = index + value.length;
  }

  if (lastIndex < code.length) {
    tokens.push({ value: code.slice(lastIndex), className: "text-slate-100" });
  }

  return tokens;
}

export default function JsonCodeBlock({
  code,
  fileName = "json",
  maxHeightClass = "max-h-80",
  fillHeight = false,
}: JsonCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [lineWrap, setLineWrap] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tokens = useMemo(() => tokenizeJson(code), [code]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isFullscreen]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const renderCodeFrame = (fullscreen = false) => (
    <div className={`${fullscreen || fillHeight ? "flex h-full flex-col" : "my-2"} overflow-hidden rounded-xl border border-zinc-700 bg-slate-950 text-left shadow-sm`}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
          <span className="ml-2 truncate font-mono text-[11px] text-slate-400">{fileName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLineWrap((prev) => !prev)}
            title={lineWrap ? "关闭自动换行" : "开启自动换行"}
            aria-label={lineWrap ? "关闭自动换行" : "开启自动换行"}
            className={`rounded-md p-1.5 transition-colors ${
              lineWrap ? "bg-blue-500/20 text-blue-200" : "bg-white/10 text-slate-200 hover:bg-white/15"
            }`}
          >
            <WrapText className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "已复制" : "复制代码"}
            aria-label={copied ? "已复制" : "复制代码"}
            className="rounded-md bg-white/10 p-1.5 text-slate-200 transition-colors hover:bg-white/15"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {!fullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              title="全屏查看"
              aria-label="全屏查看"
              className="rounded-md bg-white/10 p-1.5 text-slate-200 transition-colors hover:bg-white/15"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          )}
          {fullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              title="退出全屏"
              aria-label="退出全屏"
              className="rounded-md bg-white/10 p-1.5 text-slate-200 transition-colors hover:bg-white/15"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <pre className={`${fullscreen || fillHeight ? "min-h-0 flex-1" : maxHeightClass} overflow-auto p-3 font-mono text-xs leading-5 [tab-size:2] ${
        lineWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
      }`}>
        <code>
          {tokens.map((token, index) => (
            <span key={`${index}-${token.value}`} className={token.className}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );

  return (
    <>
      {renderCodeFrame()}
      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-y-0 right-0 z-[9999] flex h-dvh bg-slate-950/85 p-4 backdrop-blur-sm"
            style={{
              left: "var(--convo-sidebar-offset, 0px)",
              width: "calc(100vw - var(--convo-sidebar-offset, 0px))",
            }}
          >
            <div className="h-full min-h-0 w-full">
              {renderCodeFrame(true)}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
