export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-6 h-6 text-accent-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5M4.5 10.5h15m0 0v7.125a2.25 2.25 0 01-2.25 2.25h-10.5a2.25 2.25 0 01-2.25-2.25V10.5"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          TFP Tracker
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-6">
          Access is by personal link only.
          <br />
          Contact the admin if you lost your link.
        </p>

        <div className="rounded-lg bg-surface-overlay/50 p-4 text-left">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            How to sign in
          </p>
          <p className="text-sm text-zinc-300">
            Open the link you were sent, e.g.{" "}
            <code className="text-accent-muted font-mono text-xs">
              /access/your-token
            </code>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
