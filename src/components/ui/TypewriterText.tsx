import { useEffect, useMemo, useState } from 'react';

type TypewriterTextProps = {
  texts: string[];
  typingMs?: number;
  deletingMs?: number;
  pauseMs?: number;
  loop?: boolean;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
};

export default function TypewriterText({
  texts,
  typingMs = 38,
  deletingMs = 22,
  pauseMs = 1100,
  loop = true,
  className,
  dir = 'auto',
}: TypewriterTextProps) {
  const safeTexts = useMemo(() => (Array.isArray(texts) ? texts.filter(Boolean) : []), [texts]);
  const [index, setIndex] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting' | 'done'>('typing');

  const current = safeTexts[index] || '';

  useEffect(() => {
    if (!safeTexts.length) return;

    let timeout: number | undefined;

    if (phase === 'typing') {
      if (cursor >= current.length) {
        setPhase('pausing');
        return;
      }
      timeout = window.setTimeout(() => setCursor(c => Math.min(current.length, c + 1)), typingMs);
    } else if (phase === 'pausing') {
      timeout = window.setTimeout(() => setPhase('deleting'), pauseMs);
    } else if (phase === 'deleting') {
      if (cursor <= 0) {
        const nextIndex = index + 1;
        if (nextIndex >= safeTexts.length) {
          if (!loop) {
            setPhase('done');
            return;
          }
          setIndex(0);
          setPhase('typing');
          return;
        }
        setIndex(nextIndex);
        setPhase('typing');
        return;
      }
      timeout = window.setTimeout(() => setCursor(c => Math.max(0, c - 1)), deletingMs);
    }

    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [safeTexts.length, current, cursor, phase, typingMs, deletingMs, pauseMs, index, loop, safeTexts]);

  const visible = current.slice(0, cursor);

  return (
    <span dir={dir} className={className}>
      {visible}
      <span className="inline-block w-[0.6ch] animate-pulse align-baseline">|</span>
    </span>
  );
}

