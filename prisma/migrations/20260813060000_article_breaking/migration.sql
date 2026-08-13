-- Срочные новости: пометка ставится редакцией вручную и снимается сама по сроку.
-- До этого в бегущую строку попадали просто десять последних публикаций.
ALTER TABLE "Article" ADD COLUMN "breaking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Article" ADD COLUMN "breakingUntil" TIMESTAMP(3);
CREATE INDEX "Article_breaking_idx" ON "Article"("breaking", "breakingUntil");
