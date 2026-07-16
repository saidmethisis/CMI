// Lead media for an article header: renders a video when videoUrl is set, else the cover image.
function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export default function LeadMedia({ cover, videoUrl, title }: { cover: string; videoUrl?: string; title: string }) {
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
        Ваш браузер не поддерживает видео.
      </video>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={cover} alt={title} className="mb-6 aspect-[16/9] w-full rounded-2xl object-cover" />;
}
