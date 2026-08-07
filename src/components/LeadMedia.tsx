import Cover from "@/components/Cover";

// Lead media for an article header: renders a video when videoUrl is set, else the cover image.
function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// noVideoLabel приходит пропом: компонент синхронный и серверный, хуки i18n здесь недоступны.
export default function LeadMedia({ cover, videoUrl, title, noVideoLabel }: { cover: string; videoUrl?: string; title: string; noVideoLabel?: string }) {
  if (videoUrl) {
    const yt = youTubeId(videoUrl);
    if (yt) {
      return (
        <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${yt}`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <video className="mb-6 aspect-video w-full rounded-2xl bg-black object-contain" poster={cover} controls playsInline preload="metadata">
        <source src={videoUrl} type="video/mp4" />
        {noVideoLabel ?? "Ваш браузер не поддерживает видео."}
      </video>
    );
  }
  // Пустая обложка → нейтральный блок вместо значка «битая картинка».
  if (!cover) return <div className="mb-6 grid aspect-[16/9] w-full place-items-center rounded-2xl bg-black/[0.06] font-serif text-6xl font-bold text-black/15 dark:bg-white/[0.08] dark:text-white/15">A</div>;
  // priority: это главная картинка экрана статьи, её ждать нельзя.
  return <Cover src={cover} alt={title} width={1200} height={675} sizes="(max-width: 1024px) 100vw, 720px" priority className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover" />;
}
