export function Footer() {
  return (
    <footer className="w-full border-t border-border mt-auto py-5 px-4">
      <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>
          נבנה באמצעות AI ·{" "}
          <a
            href="https://x.com/YossiW10"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:underline underline-offset-2 transition-colors"
            style={{ color: "#A82323" }}
          >
            @YossiW10
          </a>
        </p>
        <p>
          בעיות או שאלות?{" "}
          <a
            href="https://x.com/YossiW10"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-2 transition-colors"
            style={{ color: "#6D9E51" }}
          >
            שלח DM בטוויטר ←
          </a>
        </p>
      </div>
    </footer>
  );
}
