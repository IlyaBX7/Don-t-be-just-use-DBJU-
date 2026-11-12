import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "../../components/Footer/Footer";
import { DELIVERY_OPTIONS, OWNER_COMMISSION_RATE, PLUS_PRICE, SERVICE_FEE_RATE, splitRent } from "../../lib/pricing";

const pct = (r: number) => `${Math.round(r * 100)}%`;
const EXAMPLE = splitRent(200, false);

export const metadata: Metadata = {
  title: "Допомога — DBJU",
  description: "Як працює оренда в DBJU: бронювання, отримання, захист, фотозвіт, правила та конфіденційність.",
};

const SECTIONS = [
  { id: "how-it-works", title: "Як працює оренда" },
  { id: "rent-out", title: "Як здати свою річ" },
  { id: "fees", title: "Комісії та виплати" },
  { id: "insurance", title: "Програма захисту DBJU" },
  { id: "ai-photo", title: "Фотозвіт повернення" },
  { id: "delivery", title: "Отримання та доставка" },
  { id: "faq", title: "Часті запитання" },
  { id: "terms", title: "Правила безпечної оренди" },
  { id: "privacy", title: "Політика конфіденційності" },
];

export default function HelpPage() {
  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "860px" }}>
        <h1 className="dbju-main-title" style={{ fontSize: "36px" }}>Допомога</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "15px", margin: "4px 0 20px" }}>
          Усе про оренду та здачу речей у DBJU
        </p>

        <nav style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="dbju-category-chip">
              {s.title}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <section id="how-it-works" className="dbju-help-section">
            <h2>Як працює оренда</h2>
            <ul>
              <li><strong>Бронювання.</strong> Оберіть річ, дати в календарі та спосіб отримання. Зайняті дні в календарі закреслені.</li>
              <li><strong>Оплата.</strong> Сплачуєте оренду та сервісний збір {pct(SERVICE_FEE_RATE)} (і кур&apos;єра, якщо обрали). Застава лише блокується на картці.</li>
              <li><strong>Отримання.</strong> У розділі <Link href="/rentals">«Мої оренди»</Link> з&apos;явиться код. У перший день оренди заберіть річ і натисніть «Я забрав річ».</li>
              <li><strong>Повернення.</strong> Поверніть річ до кінця останнього дня, зробіть фото та натисніть «Повернути + фотозвіт».</li>
              <li><strong>Завершення.</strong> Власник перевіряє фото і підтверджує повернення — застава автоматично розблоковується.</li>
            </ul>
            <p style={{ marginTop: "8px" }}>
              Продовжити оренду можна будь-коли до повернення, якщо наступні дні вільні. Скасувати бронювання можна до отримання речі — кошти повертаються повністю.
            </p>
          </section>

          <section id="rent-out" className="dbju-help-section">
            <h2>Як здати свою річ</h2>
            <ul>
              <li>Натисніть <Link href="/rent-out">«Здати річ»</Link>, додайте до 4 фото, опис, ціну та заставу.</li>
              <li>Підказка ціни показує середню вартість схожих речей у каталозі.</li>
              <li>Усі бронювання ваших речей — у розділі <Link href="/profile/listings">«Мої оголошення»</Link>. Там же ви підтверджуєте повернення.</li>
              <li>Дохід за кожну завершену оренду зараховується на баланс у профілі, звідки його можна вивести на картку.</li>
              <li>Оголошення можна будь-коли сховати з каталогу або видалити (якщо немає активних бронювань).</li>
            </ul>
          </section>

          <section id="fees" className="dbju-help-section">
            <h2>Скільки коштує і хто що отримує</h2>
            <p>
              Власник сам встановлює ціну оренди. DBJU бере комісію лише з успішних угод — разом {pct(SERVICE_FEE_RATE + OWNER_COMMISSION_RATE)} від вартості оренди:
            </p>
            <ul>
              <li><strong>{pct(SERVICE_FEE_RATE)} — сервісний збір з орендаря.</strong> Додається до ціни і покриває гарантію безпечної угоди.</li>
              <li><strong>{pct(OWNER_COMMISSION_RATE)} — комісія з власника.</strong> Утримується з виплати власнику.</li>
            </ul>
            <table className="dbju-help-table">
              <caption>Приклад: оренда дрилі на 1 добу</caption>
              <tbody>
                <tr><td>Ціна оренди, встановлена власником</td><td>{EXAMPLE.rentAmount} ₴</td></tr>
                <tr><td>Сервісний збір орендаря ({pct(SERVICE_FEE_RATE)})</td><td>+{EXAMPLE.serviceFee} ₴</td></tr>
                <tr className="strong"><td>Сплачує орендар</td><td>{EXAMPLE.rentAmount + EXAMPLE.serviceFee} ₴</td></tr>
                <tr><td>Комісія з власника ({pct(OWNER_COMMISSION_RATE)})</td><td>−{EXAMPLE.ownerCommission} ₴</td></tr>
                <tr className="strong"><td>Отримує власник</td><td>{EXAMPLE.ownerPayout} ₴</td></tr>
                <tr><td>Дохід DBJU ({EXAMPLE.serviceFee} + {EXAMPLE.ownerCommission})</td><td>{EXAMPLE.platformRevenue} ₴</td></tr>
              </tbody>
            </table>
            <p style={{ marginTop: "10px" }}>
              Кур&apos;єр ({DELIVERY_OPTIONS.COURIER.cost} ₴) — окрема послуга, комісія на неї не нараховується. Застава лише блокується
              на картці і повертається після підтвердження повернення. Гроші за оренду зараховуються на баланс власника, щойно він
              підтвердить повернення речі, — звідти їх можна вивести на картку.
            </p>
          </section>

          <section id="insurance" className="dbju-help-section">
            <h2>Програма захисту DBJU</h2>
            <p>
              Захист включено в кожну оренду — окремо платити не потрібно. Частина комісії платформи відраховується до страхового
              фонду. Якщо річ пошкоджено, збиток покривається із застави, а якщо її не вистачає — зі страхового фонду DBJU.
              Стан речі фіксується на фото при поверненні.
            </p>
          </section>

          <section id="ai-photo" className="dbju-help-section">
            <h2>Фотозвіт повернення</h2>
            <p>
              При поверненні ви фотографуєте річ. Фото зберігається в замовленні й доступне власнику — це захищає обидві
              сторони від суперечок щодо стану. Після підтвердження власником застава повертається.
            </p>
          </section>

          <section id="delivery" className="dbju-help-section">
            <h2>Отримання та доставка</h2>
            <p>
              DBJU не має власних пунктів видачі — речі передаються напряму між людьми. Є два способи: самовивіз
              за адресою власника (0 ₴) або кур&apos;єр до ваших дверей ({DELIVERY_OPTIONS.COURIER.cost} ₴). Точну адресу
              та телефон власника ви побачите в розділі «Мої оренди» після бронювання.
            </p>
          </section>

          <section id="faq" className="dbju-help-section">
            <h2>Часті запитання</h2>
            <ul>
              <li><strong>Що таке DBJU+?</strong> Підписка за {PLUS_PRICE} ₴/міс: оренди без сервісного збору ({pct(SERVICE_FEE_RATE)}) та пріоритетна підтримка. Власник при цьому отримує стільки ж. Перший місяць безкоштовно — активується в профілі.</li>
              <li><strong>Чи можна орендувати власну річ?</strong> Ні, бронювати можна лише чужі оголошення.</li>
              <li><strong>Як розраховується ціна?</strong> Від 3 діб діє тариф «3 доби», від 7 — тижневий (якщо власник їх вказав).</li>
              <li><strong>Максимальний термін оренди?</strong> 30 днів за одне бронювання, бронювати можна до 90 днів наперед.</li>
              <li><strong>Куди писати?</strong> <a href="mailto:support@dbju.ua">support@dbju.ua</a></li>
            </ul>
          </section>

          <section id="terms" className="dbju-help-section">
            <h2>Правила безпечної оренди</h2>
            <ul>
              <li>Повертайте річ у тому ж стані та комплектації, що й отримали.</li>
              <li>Не передавайте орендовану річ третім особам.</li>
              <li>Власник зобов&apos;язаний надати річ, що відповідає опису та фото.</li>
              <li>Спірні ситуації вирішуються за фотозвітом та через підтримку.</li>
            </ul>
          </section>

          <section id="privacy" className="dbju-help-section">
            <h2>Політика конфіденційності</h2>
            <p>
              Ми зберігаємо лише дані, потрібні для оренди. Публічно видно лише місто, а точну адресу й телефон бачить тільки
              інша сторона вашої оренди. Повний текст — <Link href="/legal/privacy">Політика конфіденційності</Link>, умови
              сервісу — <Link href="/legal/terms">Правила користування</Link>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
