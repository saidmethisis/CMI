import LegalShell from "@/components/LegalShell";
import { ORG } from "@/lib/org";

export const metadata = { title: "Выходные данные" };

export default function ImpressumPage() {
  return (
    <LegalShell title="Выходные данные (импрессум)">
      {process.env.NODE_ENV !== "production" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          Черновик (виден только в dev): заполните реальными данными (env <code>NEXT_PUBLIC_ORG_*</code>). Если сайт регистрируется как СМИ — укажите номер и дату свидетельства.
        </div>
      )}

      <table className="w-full text-sm">
        <tbody className="[&_td]:border-t [&_td]:border-black/5 [&_td]:py-2.5 dark:[&_td]:border-white/10 [&_td:first-child]:w-1/3 [&_td:first-child]:font-semibold">
          <tr><td>Наименование издания</td><td>{ORG.name}</td></tr>
          <tr><td>Учредитель</td><td>{ORG.founder}</td></tr>
          <tr><td>Главный редактор</td><td>{ORG.editor}</td></tr>
          <tr><td>Юридический адрес</td><td>{ORG.address}</td></tr>
          <tr><td>Электронная почта</td><td>{ORG.email}</td></tr>
          <tr><td>Телефон</td><td>{ORG.phone}</td></tr>
          <tr><td>Свидетельство о регистрации СМИ</td><td>{ORG.smiCert}</td></tr>
          <tr><td>Возрастная категория</td><td>{ORG.age}</td></tr>
        </tbody>
      </table>

      <h2>Правовая информация</h2>
      <ul>
        <li><a href="/privacy">Политика конфиденциальности</a></li>
        <li><a href="/terms">Пользовательское соглашение</a></li>
      </ul>

      <p className="text-sm text-black/50 dark:text-white/50">Издание действует в соответствии с законодательством Республики Узбекистан. Персональные данные обрабатываются с соблюдением ЗРУ «О персональных данных».</p>
    </LegalShell>
  );
}
