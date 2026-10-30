import React from 'react';

interface Segment {
  text: string;
  hit: boolean;
}

export function segmentsFor(text: string, phrases: string[]): Segment[] {
  const sorted = phrases
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length >= 2)
    .sort((a, b) => b.length - a.length);
  const lower = text.toLowerCase();
  const ranges: Array<{ start: number; end: number }> = [];

  for (const phrase of sorted) {
    const needle = phrase.toLowerCase();
    let from = 0;
    while (from < text.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) break;
      const end = at + needle.length;
      const overlaps = ranges.some((range) => at < range.end && end > range.start);
      if (!overlaps) ranges.push({ start: at, end });
      from = end;
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start), hit: false });
    segments.push({ text: text.slice(range.start, range.end), hit: true });
    cursor = range.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false });
  return segments.length > 0 ? segments : [{ text, hit: false }];
}

interface HighlightedTextProps {
  text: string;
  phrases?: string[];
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, phrases = [] }) => {
  const segments = segmentsFor(text, phrases);
  return (
    <>
      {segments.map((segment, index) => (
        segment.hit ? (
          <mark key={index} className="rounded bg-red-500/25 px-0.5 text-inherit">
            {segment.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{segment.text}</React.Fragment>
        )
      ))}
    </>
  );
};

export default HighlightedText;
