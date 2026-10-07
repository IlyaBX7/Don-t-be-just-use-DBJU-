import { ProductCard } from '../components/ProductCard/ProductCard';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { mockProducts } from '../data/mockProducts';

export default function Home() {
  return (
    <div className="pageLayout">
      <Sidebar />
      
      <main className="mainContent">
        {/* Блок розумного пошуку */}
        <section className="aiHeroBlock">
          <h1 className="aiHeroTitle">Що плануєте робити?</h1>
          <p className="aiHeroSubtitle">Опишіть ситуацію, і наш ШІ підбере необхідні речі (наприклад: "Їду на риболовлю з ночівлею" або "Треба зробити ремонт у ванній").</p>
          
          <div className="aiSearchWrapper">
            <textarea 
              className="aiSearchInput" 
              placeholder="Опишіть вашу потребу тут..."
              rows={3}
            />
            <button className="aiSearchBtn">✨ Підібрати речі</button>
          </div>
        </section>

        <h2 className="sectionTitle">🔥 Популярне поруч</h2>
        <div className="productsGrid">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </main>
    </div>
  );
}