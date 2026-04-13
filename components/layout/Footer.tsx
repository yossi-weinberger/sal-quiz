export function Footer() {
  return (
    <footer className="w-full border-t border-border mt-auto py-4 px-4">
      <div className="max-w-xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>נבנה באמצעות AI</span>
        <span className="opacity-30">·</span>
        <a
          href="https://x.com/YossiW10"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline underline-offset-2"
          style={{ color: "#A82323" }}
        >
          @YossiW10
        </a>
        <span className="opacity-30">·</span>
        <a
          href="https://x.com/YossiW10"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline underline-offset-2"
          style={{ color: "#6D9E51" }}
        >
          בעיות? DM בטוויטר
        </a>
      </div>
    </footer>
  );
}
