"use client";

import React from "react";
import { ShoppingBag, Tag, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

interface ChatMessageRendererProps {
  content: string;
  isUser: boolean;
}

/**
 * Parses bold markdown (**text**), currency (₹...), subtotal/discount/grand total badges,
 * and key phrases into rich styled elements.
 */
function renderInlineFormattedText(text: string, isUser: boolean): React.ReactNode[] {
  // Regex that captures:
  // 1. Subtotal / Grand Total / Discount phrases (e.g. "Grand Total: ₹1705", "Subtotal ₹1590", "Discount: ₹66")
  // 2. Bold tags: **text**
  // 3. Standalone Currency: ₹...
  const tokenRegex = /(Grand Total:?\s*₹\s*\d+(?:\.\d+)?|Subtotal:?\s*₹\s*\d+(?:\.\d+)?|Discount:?\s*₹\s*\d+(?:\.\d+)?|\*\*[^*]+\*\*|₹\s*\d+(?:\.\d+)?(?:\s*\([^)]*\))?)/gi;

  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    // Grand Total badge
    if (/^Grand Total:?\s*₹/i.test(part)) {
      const amountMatch = part.match(/₹\s*\d+(?:\.\d+)?/);
      const amount = amountMatch ? amountMatch[0] : "";
      return (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm mx-1 shadow-xs border ${
            isUser
              ? "bg-white text-emerald-900 border-white/40"
              : "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
          }`}
        >
          <span className="uppercase text-[10px] tracking-wider font-extrabold opacity-90">Grand Total:</span>
          <span>{amount}</span>
        </span>
      );
    }

    // Subtotal badge
    if (/^Subtotal:?\s*₹/i.test(part)) {
      const amountMatch = part.match(/₹\s*\d+(?:\.\d+)?/);
      const amount = amountMatch ? amountMatch[0] : "";
      return (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-xs mx-1 border ${
            isUser
              ? "bg-white/20 text-white border-white/30"
              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700"
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Subtotal:</span>
          <span>{amount}</span>
        </span>
      );
    }

    // Discount badge
    if (/^Discount:?\s*₹/i.test(part)) {
      const amountMatch = part.match(/₹\s*\d+(?:\.\d+)?/);
      const amount = amountMatch ? amountMatch[0] : "";
      return (
        <span
          key={idx}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-xs mx-1 border ${
            isUser
              ? "bg-amber-400/30 text-amber-100 border-amber-300/40"
              : "bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-900"
          }`}
        >
          <Tag className="w-3 h-3 text-rose-500" />
          <span className="text-[10px] uppercase font-bold">Discount:</span>
          <span>{amount}</span>
        </span>
      );
    }

    // Bold text (**...**)
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className={
            isUser
              ? "font-extrabold text-white"
              : "font-extrabold text-slate-900 dark:text-emerald-300"
          }
        >
          {renderInlineFormattedText(inner, isUser)}
        </strong>
      );
    }

    // Standalone Currency amount (e.g. ₹1590)
    if (part.startsWith("₹")) {
      return (
        <span
          key={idx}
          className={`inline-flex items-center px-1.5 py-0.5 rounded-md font-bold text-xs tracking-tight mx-0.5 shadow-2xs ${
            isUser
              ? "bg-white/25 text-white border border-white/30"
              : "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
          }`}
        >
          {part}
        </span>
      );
    }

    // Normal text
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export function ChatMessageRenderer({ content, isUser }: ChatMessageRendererProps) {
  if (isUser) {
    return (
      <p className="leading-relaxed font-medium whitespace-pre-line text-white">
        {content}
      </p>
    );
  }

  // Split assistant message into distinct blocks/paragraphs by double newlines
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
      {blocks.map((block, bIdx) => {
        const lines = block
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        // 1. Check if block is a digital receipt / bill summary (multi-line summary)
        const hasReceipt = lines.some((l) =>
          /(subtotal|grand total|kul rashi|total ab|bill summary|final order)/i.test(l)
        );
        if (hasReceipt && lines.length >= 2) {
          return (
            <div
              key={bIdx}
              className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50/70 dark:from-slate-900/90 dark:via-slate-850 dark:to-emerald-950/40 border border-emerald-500/30 shadow-xs space-y-2.5 my-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider pb-1.5 border-b border-emerald-500/20">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order Summary (बिल विवरण)</span>
              </div>

              <div className="space-y-1.5 pt-0.5">
                {lines.map((line, lIdx) => {
                  const isGrandTotal = /(grand total|kul rashi)/i.test(line);
                  const isDiscount = /discount/i.test(line);

                  return (
                    <div
                      key={lIdx}
                      className={`flex items-start justify-between gap-2 text-xs leading-relaxed ${
                        isGrandTotal
                          ? "pt-2 border-t border-emerald-500/30 font-black text-slate-900 dark:text-white text-sm"
                          : isDiscount
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-slate-700 dark:text-slate-300 font-medium"
                      }`}
                    >
                      <div>{renderInlineFormattedText(line, isUser)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // 2. Check if block is a bullet list (every line starts with •, *, -)
        const isBulletList = lines.every((l) => /^[•*\-]\s+/.test(l));
        if (isBulletList) {
          return (
            <ul key={bIdx} className="space-y-2 my-1 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[•*\-]\s+/, "");
                return (
                  <li
                    key={lIdx}
                    className="flex items-start gap-2.5 leading-relaxed text-xs sm:text-sm"
                  >
                    <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1.5 shadow-xs" />
                    <div className="flex-1 text-slate-800 dark:text-slate-200">
                      {renderInlineFormattedText(cleanLine, isUser)}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // 3. Mixed block: contains some bullet lines and some text lines
        const hasSomeBullets = lines.some((l) => /^[•*\-]\s+/.test(l));
        if (hasSomeBullets) {
          return (
            <div key={bIdx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                const isBullet = /^[•*\-]\s+/.test(line);
                if (isBullet) {
                  const cleanLine = line.replace(/^[•*\-]\s+/, "");
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start gap-2.5 pl-2 leading-relaxed text-xs sm:text-sm"
                    >
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 mt-1.5" />
                      <div className="flex-1 text-slate-800 dark:text-slate-200">
                        {renderInlineFormattedText(cleanLine, isUser)}
                      </div>
                    </div>
                  );
                }

                return (
                  <p key={lIdx} className="leading-relaxed font-medium">
                    {renderInlineFormattedText(line, isUser)}
                  </p>
                );
              })}
            </div>
          );
        }

        // 4. Heading blocks (e.g. "📖 Noun (संज्ञा):")
        if (block.startsWith("#")) {
          const headingText = block.replace(/^#+\s*/, "");
          return (
            <h4
              key={bIdx}
              className="text-sm font-extrabold text-slate-900 dark:text-white pt-1"
            >
              {renderInlineFormattedText(headingText, isUser)}
            </h4>
          );
        }

        // 5. Standard Paragraph
        return (
          <p key={bIdx} className="leading-relaxed font-medium">
            {renderInlineFormattedText(block, isUser)}
          </p>
        );
      })}
    </div>
  );
}
