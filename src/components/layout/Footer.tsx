export function Footer() {
  return (
    <footer className="border-t border-black/10 mt-16 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-green-500 animate-pulse" />
            <span>All systems operational</span>
          </div>
          <span>Built with React, TypeScript, React Query, and Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
}
