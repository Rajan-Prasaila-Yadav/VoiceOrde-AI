import { VoiceOrderDesk } from "@/components/voice/VoiceOrderDesk";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white break-words">
            Spoken Order Desk (बोलकर ऑर्डर लें)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Neighbourhood Kirana voice desk. Speak your order, verify every item, and deduct stock in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Voice Engine Online
          </span>
        </div>
      </div>

      <VoiceOrderDesk />
    </div>
  );
}
