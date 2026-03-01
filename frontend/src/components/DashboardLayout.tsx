import React from 'react';

interface DashboardLayoutProps {
  header: React.ReactNode;
  ticker?: React.ReactNode;
  chartArea: React.ReactNode;
  signalPanel: React.ReactNode;
  historyPanel: React.ReactNode;
  dataInput: React.ReactNode;
}

export default function DashboardLayout({
  header,
  ticker,
  chartArea,
  signalPanel,
  historyPanel,
  dataInput,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-1 flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-gold-dim bg-surface-2">
        {header}
        {ticker}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden p-3 gap-3">
        {/* Data Input */}
        <div className="shrink-0">
          {dataInput}
        </div>

        {/* Chart + Signal Panel */}
        <div className="flex-1 flex gap-3 min-h-0" style={{ minHeight: '500px' }}>
          {/* Chart Area */}
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex-1 bg-surface-2 border border-border rounded-lg overflow-hidden" style={{ minHeight: '360px' }}>
              {chartArea}
            </div>
            <div className="h-24 bg-surface-2 border border-border rounded-lg overflow-hidden shrink-0">
              {/* Volume chart slot */}
              <div className="h-full">
                {/* Volume chart rendered inside chartArea component */}
              </div>
            </div>
          </div>

          {/* Signal Panel */}
          <div className="w-72 shrink-0 bg-surface-2 border border-border rounded-lg overflow-hidden">
            {signalPanel}
          </div>
        </div>

        {/* History Panel */}
        <div className="h-52 shrink-0">
          {historyPanel}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-gold-dim bg-surface-2 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} Candle King Indicator
        </span>
        <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
          Built with <span className="text-bear">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'candle-king-indicator')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-bright transition-colors"
          >
            caffeine.ai
          </a>
        </span>
      </footer>
    </div>
  );
}
