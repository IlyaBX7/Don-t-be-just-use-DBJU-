import Link from "next/link";
import { Footer } from "../components/Footer/Footer";

export default function NotFound() {
  return (
    <>
      <div className="dbju-page-container dbju-status-page">
        <div className="dbju-status-code">404</div>
        <h1>Такої сторінки немає</h1>
        <p>Можливо, оголошення видалили або посилання містить помилку. Спробуйте знайти потрібну річ у каталозі.</p>
        <div className="dbju-status-actions">
          <Link href="/catalog" className="dbju-btn-primary">До каталогу</Link>
          <Link href="/" className="dbju-btn-secondary">На головну</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
