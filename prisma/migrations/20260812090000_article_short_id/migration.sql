-- Короткий публичный адрес статьи: /n/08121429 вместо длинной транслитерации.
-- Поле необязательное: у старых материалов его нет до заполнения, и страница
-- продолжает открываться по прежнему slug.
ALTER TABLE "Article" ADD COLUMN "shortId" TEXT;
CREATE UNIQUE INDEX "Article_shortId_key" ON "Article"("shortId");
