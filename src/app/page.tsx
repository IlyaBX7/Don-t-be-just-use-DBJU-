import { ProductCard } from '../components/ProductCard/ProductCard';
import { mockProducts } from '../data/mockProducts';

export default function Home() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ marginBottom: '32px' }}>Каталог оренди техніки</h1>
      
      {/* Використовуємо CSS Grid для сітки товарів (inline-стилі для швидкості) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '24px' 
      }}>
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}