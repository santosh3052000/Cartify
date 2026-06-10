import { useState } from 'react';
import { compareProducts, checkDuplicate } from '../api/client';

export default function ComparisonBoard() {
  const [ids, setIds] = useState<string[]>(['', '']);
  const [products, setProducts] = useState<any[]>([]);
  const [dupResult, setDupResult] = useState<any>(null);

  const handleCompare = async () => {
    const validIds = ids.filter(id => id.trim());
    if (validIds.length < 2) return;
    const data = await compareProducts(validIds);
    setProducts(data.products);
    if (validIds.length === 2) {
      const p1 = data.products.find((p: any) => p.product_id === validIds[0]);
      const p2 = data.products.find((p: any) => p.product_id === validIds[1]);
      if (p1 && p2) {
        const dup = await checkDuplicate(p1.title, p2.title);
        setDupResult(dup);
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Compare Products</h1>
      <div className="flex gap-2 mb-4">
        {ids.map((id, idx) => (
          <input key={idx} className="border p-2 flex-1" placeholder="Product ID" value={id} onChange={e => {
            const newIds = [...ids];
            newIds[idx] = e.target.value;
            setIds(newIds);
          }} />
        ))}
        <button onClick={handleCompare} className="bg-indigo-600 text-white px-4 py-2 rounded">Compare</button>
      </div>
      {dupResult && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <strong>Duplicate Check:</strong> {dupResult.is_match ? 'Likely Duplicate' : 'Not Duplicate'} (confidence: {dupResult.confidence})
        </div>
      )}
      {products.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p.product_id} className="border p-4 rounded shadow">
              <h2 className="font-bold">{p.title}</h2>
              <p>Brand: {p.brand}</p>
              <p>Price: {p.platforms?.[0]?.price?.current || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}