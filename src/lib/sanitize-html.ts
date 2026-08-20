// Очистка HTML, который приходит из редактора статей.
//
// Редактор — это поле, куда пользователь может вставить что угодно, в том
// числе кусок чужой страницы со скриптами. Поэтому текст статьи никогда не
// попадает на страницу как есть: сначала он проходит здесь.
//
// Подход — «разрешено только перечисленное». Всё, чего нет в списках ниже,
// вырезается. Это надёжнее чёрных списков: не нужно угадывать все способы
// написать <script>, достаточно не пускать ничего сверх нужного.
//
// Санитайзер вызывается ДВАЖДЫ: при сохранении (чтобы в базе лежало чистое)
// и при выводе (на случай, если в базе уже лежит что-то из прошлого). Двойная
// работа дешевле одной пропущенной дыры.

/** Теги, из которых состоит текст статьи. Всё остальное выбрасывается. */
const ALLOWED: Record<string, string[]> = {
  p: ["class"], br: [], strong: [], b: [], em: [], i: [], u: [], s: [],
  h2: ["class"], h3: ["class"],
  ul: [], ol: [], li: [],
  blockquote: [], figure: [], figcaption: [],
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  span: ["class"],
};

/** Классы для оформления. Произвольные не пропускаем: через class тоже атакуют. */
const ALLOWED_CLASSES = new Set(["ta-left", "ta-center", "ta-right", "fs-sm", "fs-lg", "fs-xl"]);

/** Теги, содержимое которых удаляется вместе с ними. */
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math"]);

const VOID_TAGS = new Set(["br", "img"]);

function safeUrl(raw: string, allowData = false): string | null {
  const v = raw.trim();
  if (!v) return null;
  // Схемы javascript:, vbscript:, data:text/html — самый частый способ
  // выполнить чужой код через ссылку или картинку.
  if (/^(https?:)?\/\//i.test(v)) return v;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (allowData && /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=]+$/i.test(v)) return v;
  return null;
}

function escapeText(s: string): string {
  // Амперсанд экранируем только «голый». Иначе уже готовое `&lt;` из текста
  // превращалось бы в `&amp;lt;` и читатель видел бы буквы вместо символа —
  // и так при каждом сохранении, слой за слоем.
  return s
    .replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,30}|#\d{1,7}|#x[0-9a-fA-F]{1,6});)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cleanAttrs(tag: string, attrsRaw: string): string {
  const allowed = ALLOWED[tag];
  const out: string[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrsRaw))) {
    const name = m[1].toLowerCase();
    if (!allowed.includes(name)) continue;
    const value = (m[3] ?? m[4] ?? m[5] ?? "").trim();

    if (name === "href" || name === "src") {
      const url = safeUrl(value, name === "src");
      if (!url) continue;
      out.push(`${name}="${escapeText(url).replace(/"/g, "&quot;")}"`);
      continue;
    }
    if (name === "class") {
      const keep = value.split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
      if (keep.length) out.push(`class="${keep.join(" ")}"`);
      continue;
    }
    if (name === "target") { out.push('target="_blank"'); continue; }
    if (name === "rel") continue; // ставим сами, см. ниже
    if (name === "width" || name === "height") {
      if (/^\d{1,5}$/.test(value)) out.push(`${name}="${value}"`);
      continue;
    }
    if (name === "loading") { out.push('loading="lazy"'); continue; }
    out.push(`${name}="${escapeText(value).replace(/"/g, "&quot;")}"`);
  }

  // Внешняя ссылка без rel — это и утечка реферера, и возможность
  // подменить нашу вкладку через window.opener.
  if (tag === "a") {
    const hasTarget = out.some((a) => a.startsWith("target="));
    if (hasTarget) out.push('rel="noopener noreferrer nofollow"');
  }
  if (tag === "img" && !out.some((a) => a.startsWith("loading="))) out.push('loading="lazy"');
  if (tag === "img" && !out.some((a) => a.startsWith("alt="))) out.push('alt=""');
  return out.length ? " " + out.join(" ") : "";
}

/**
 * Приводит текст к нормальной блочной структуре.
 *
 * Редакторы и вставка из Word/Telegram оставляют абзацы «голыми» — текст лежит
 * между блоками сам по себе, без <p>. В браузере всё это слипается в одно
 * полотно: у одной из статей узбекская версия читалась сплошняком, а
 * подзаголовок склеивался со следующим предложением («…roliShuni alohida…»).
 *
 * Делаем две вещи:
 *   • всё, что лежит между блоками, заворачиваем в отдельный абзац;
 *   • если жирный кусок вплотную упирается в обычный текст, разрываем абзац
 *     между ними: так автор и задумывал подзаголовок.
 *
 * Работает и на уже сохранённых статьях — санитайзер вызывается при выводе,
 * поэтому чинить базу миграцией не нужно.
 */
const BLOCK_TAGS = new Set(["p", "h2", "h3", "ul", "ol", "blockquote", "figure"]);

function normalizeBlocks(html: string): string {
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let out = "";
  let buf = "";
  let depth = 0;
  let last = 0;
  let m: RegExpExecArray | null;

  const flush = () => {
    const inner = buf.trim();
    buf = "";
    if (!inner) return;
    // Пустышку выбрасываем, но картинка — это содержимое, даже если рядом нет
    // ни буквы: иначе одиночный снимок между абзацами исчезал бы из статьи.
    const hasText = /[^\s<>]/.test(inner.replace(/<[^>]+>/g, ""));
    if (!hasText && !/<img\b/i.test(inner)) return;
    // Жирный, упирающийся в текст, — это подзаголовок: разрываем абзац.
    const parts = inner.split(/(?<=<\/(?:b|strong)>)(?=[^\s<])/);
    for (const part of parts) if (part.trim()) out += `<p>${part.trim()}</p>`;
  };

  while ((m = re.exec(html))) {
    const tag = m[1].toLowerCase();
    const closing = m[0].startsWith("</");
    const text = html.slice(last, m.index);
    last = re.lastIndex;

    if (depth > 0) { buf += text + m[0]; }
    else if (BLOCK_TAGS.has(tag) && !closing) { buf += text; flush(); out += m[0]; }
    else { buf += text + m[0]; }

    if (BLOCK_TAGS.has(tag)) {
      if (!closing) depth++;
      else if (depth > 0) {
        depth--;
        if (depth === 0) { out += buf; buf = ""; }
      }
    }
  }
  buf += html.slice(last);
  flush();
  return out;
}

/**
 * Превращает блоки <div> в абзацы.
 * Пустой <div><br></div> — это отбивка между абзацами в редакторе, она не
 * несёт содержания и отбрасывается: интервал между абзацами задаёт вёрстка.
 */
function flattenDivs(html: string): string {
  if (!/<div\b/i.test(html)) return html;
  // Пустые обёртки-отбивки убираем целиком.
  let s = html.replace(/<div\b[^>]*>\s*(?:<br\s*\/?>)?\s*<\/div>/gi, "");
  let depth = 0;
  // Каждый уровень вложенности схлопываем в один абзац: открывающий тег
  // самого внешнего div становится <p>, внутренние исчезают.
  s = s.replace(/<div\b[^>]*>|<\/div\s*>/gi, (tag) => {
    if (tag[1] === "/") {
      depth = Math.max(0, depth - 1);
      return depth === 0 ? "</p>" : "";
    }
    depth += 1;
    return depth === 1 ? "<p>" : "";
  });
  return s;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let html = String(input);

  // Комментарии могут прятать разметку от простых разборщиков.
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  // Теги, которые вырезаем вместе с содержимым.
  for (const tag of DROP_WITH_CONTENT) {
    html = html.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}\\s*>`, "gi"), "");
    html = html.replace(new RegExp(`<${tag}\\b[^>]*/?>`, "gi"), "");
  }

  // Текст, вставленный из Word, Google Docs или набранный прямо в редакторе,
  // приходит разбитым на <div>, а не на абзацы: так устроены браузеры. Тега
  // div в списке разрешённых нет, и раньше он просто исчезал вместе с
  // границами блоков — интервью схлопывалось в один абзац, где вопрос и
  // ответ слипались: «— Вопрос?— Ответ.»
  //
  // Поэтому превращаем div в абзац до разбора. Вложенные div сначала
  // распрямляем: <div><div>текст</div></div> должен дать один абзац, а не
  // абзац внутри абзаца — такая вложенность недопустима в разметке.
  html = flattenDivs(html);

  const open: string[] = [];
  let out = "";
  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(html))) {
    out += escapeText(html.slice(last, m.index));
    last = re.lastIndex;

    const tag = m[1].toLowerCase();
    const closing = m[0].startsWith("</");
    if (!(tag in ALLOWED)) continue; // неизвестный тег просто исчезает, текст остаётся

    if (closing) {
      const i = open.lastIndexOf(tag);
      if (i === -1) continue; // закрытие без открытия
      // Закрываем всё, что осталось незакрытым внутри.
      while (open.length > i) out += `</${open.pop()}>`;
      continue;
    }

    if (VOID_TAGS.has(tag)) { out += `<${tag}${cleanAttrs(tag, m[2])}>`; continue; }
    out += `<${tag}${cleanAttrs(tag, m[2])}>`;
    open.push(tag);
  }
  out += escapeText(html.slice(last));
  while (open.length) out += `</${open.pop()}>`;

  // Пустые абзацы после чистки только раздувают текст.
  out = out.replace(/<p(\s[^>]*)?>(\s|&nbsp;|<br>)*<\/p>/gi, "");
  out = normalizeBlocks(out);
  out = out.replace(/<p(\s[^>]*)?>(\s|&nbsp;|<br>)*<\/p>/gi, "");
  return out.trim();
}

/** Текст без разметки — для лида, поиска, подсчёта слов и описаний. */
export function htmlToText(input: string): string {
  return sanitizeHtml(input)
    .replace(/<\/(p|h2|h3|li|blockquote|figcaption)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Похоже ли на HTML из редактора. Старые статьи хранятся простым текстом. */
export function looksLikeHtml(s: string): boolean {
  return /<(p|h2|h3|ul|ol|blockquote|figure|img|strong|em)\b/i.test(s);
}
