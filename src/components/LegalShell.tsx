// Общая обёртка для правовых страниц.
export default function LegalShell({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="container-content max-w-3xl py-8">
      <h1 className="font-serif text-3xl font-bold">{title}</h1>
      {updated && <p className="mt-1 text-sm text-black/45 dark:text-white/45">Редакция от: {updated}</p>}
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-black/75 dark:text-white/75 [&_a]:text-accent [&_a]:underline [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-black dark:[&_h2]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mt-1">
        {children}
      </div>
    </div>
  );
}
