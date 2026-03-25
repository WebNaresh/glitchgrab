import Image from "next/image";

export default function CollaborateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Image src="/logo.png" alt="Glitchgrab" width={24} height={24} className="rounded-full" />
          <span className="font-semibold text-sm tracking-tight">glitchgrab</span>
          <span className="text-xs text-muted-foreground ml-1">collaborator</span>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
