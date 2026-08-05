import Image from "next/image";

// Обложка материала.
//
// Картинки бывают двух видов: загруженные к нам (`/uploads/…`) и вставленные
// автором ссылкой на чужой сайт. Оптимизатор Next работает только с заранее
// перечисленными доменами и на любом другом бросает исключение — то есть один
// автор, вставивший ссылку на неизвестный сайт, уронил бы страницу целиком.
// Список таких сайтов заранее неизвестен, поэтому:
//   • свои файлы идут через next/image — AVIF/WebP и размер под экран читателя;
//   • чужие ссылки остаются обычным тегом, только с ленивой загрузкой.
//
// Ширина и высота нужны обоим вариантам: без них браузер не знает, сколько места
// займёт картинка, и текст «прыгает» по мере загрузки.
type Props = {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  /** Подсказка браузеру, какой ширины будет картинка на экране — от неё зависит выбор файла из srcset. */
  sizes?: string;
  /** Для главной картинки экрана: грузить сразу, без ожидания прокрутки. */
  priority?: boolean;
};

export default function Cover({ src, alt, className = "", width, height, sizes, priority }: Props) {
  if (!src.startsWith("/")) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
