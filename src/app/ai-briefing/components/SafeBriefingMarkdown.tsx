import React from "react";

interface SafeBriefingMarkdownProps {
  content: string;
}

export function SafeBriefingMarkdown({ content }: SafeBriefingMarkdownProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let keyIndex = 0;

  const parseInlineStyles = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;

    const boldClass = "font-extrabold text-indigo-950 bg-indigo-50/70 px-1.5 py-0.5 rounded-lg border border-indigo-100/60 mx-0.5 shadow-[0_1px_2px_rgba(79,70,229,0.05)]";
    const codeClass = "px-2 py-0.5 rounded bg-slate-100 text-rose-650 font-mono text-xs border border-slate-200/80";

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      const codeMatch = remaining.match(/`(.*?)`/);

      if (!boldMatch && !codeMatch) {
        parts.push(<span key={`txt-${keyIndex}`}>{remaining}</span>);
        keyIndex++;
        break;
      }

      const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity;
      const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity;

      if (boldIndex < codeIndex) {
        if (boldIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, boldIndex)}</span>);
          keyIndex++;
        }
        parts.push(<strong key={`bold-${keyIndex}`} className={boldClass}>{boldMatch![1]}</strong>);
        keyIndex++;
        remaining = remaining.substring(boldIndex + boldMatch![0].length);
      } else {
        if (codeIndex > 0) {
          parts.push(<span key={`txt-${keyIndex}`}>{remaining.substring(0, codeIndex)}</span>);
          keyIndex++;
        }
        parts.push(
          <code key={`code-${keyIndex}`} className={codeClass}>
            {codeMatch![1]}
          </code>
        );
        keyIndex++;
        remaining = remaining.substring(codeIndex + codeMatch![0].length);
      }
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // 1. 리스트 아이템 처리 (* 또는 -)
    if (line.startsWith('* ') || line.startsWith('- ')) {
      const itemText = line.substring(2);
      elements.push(
        <div key={`li-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1.5 select-text">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2.5 shrink-0 animate-pulse" />
          <div className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed flex-1">
            {parseInlineStyles(itemText)}
          </div>
        </div>
      );
      continue;
    }

    // 2. 번호 매겨진 리스트 (1. 2. 등)
    const numListMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      const num = numListMatch[1];
      const itemText = numListMatch[2];
      elements.push(
        <div key={`ol-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1.5 select-text">
          <span className="text-[10px] font-black text-indigo-550 bg-indigo-50/80 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border border-indigo-100/50 mt-1 select-none">
            {num}
          </span>
          <div className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed flex-1">
            {parseInlineStyles(itemText)}
          </div>
        </div>
      );
      continue;
    }

    // 3. 제목 헤더 처리 (#, ##, ###)
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-base font-black text-slate-900 mt-4 mb-2 border-b border-slate-100 pb-1.5 select-text">
          {parseInlineStyles(line.substring(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-black text-indigo-950 mt-3.5 mb-1.5 select-text">
          {parseInlineStyles(line.substring(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-xs md:text-sm font-black text-slate-850 mt-3 mb-1 flex items-center gap-1.5 select-text">
          <span className="w-1.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
          {parseInlineStyles(line.substring(4))}
        </h3>
      );
      continue;
    }

    // 4. 일반 문장
    elements.push(
      <div key={`p-${i}`} className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed my-1 select-text">
        {parseInlineStyles(lines[i].trim())}
      </div>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}
