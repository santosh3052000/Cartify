import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../api/client';
import { Link } from 'react-router-dom';

export default function ProductExplorer() {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { isLoading, refetch } = useQuery({
    queryKey: ['products', search, cursor],
    queryFn: async () => {
      const data = await fetchProducts(cursor || undefined, search);
      if (cursor) {
        setProductsList(prev => [...prev, ...data.products]);
      } else {
        setProductsList(data.products);
      }
      setHasMore(data.hasMore);
      return data;
    },
  });

  const handleSearch = () => {
    setCursor(null);
    setProductsList([]);
    refetch();
  };

  const loadMore = () => {
    if (hasMore) refetch();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Product Explorer</h1>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search by title or brand..."
          className="border p-2 rounded flex-grow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={handleSearch} className="bg-indigo-600 text-white px-4 py-2 rounded">Search</button>
      </div>
      {isLoading && <p>Loading...</p>}
      <div className="grid gap-4">
        {productsList.map((p) => (
          <Link key={p.product_id} to={`/product/${p.product_id}`} className="border p-4 rounded shadow hover:bg-gray-50">
            <div className="font-bold">{p.title}</div>
            <div className="text-sm text-gray-600">{p.brand} | {p.category?.l1}</div>
          </Link>
        ))}
      </div>
      {hasMore && productsList.length > 0 && (
        <button onClick={loadMore} className="mt-4 bg-gray-200 px-4 py-2 rounded">Load More</button>
      )}
    </div>
  );
}