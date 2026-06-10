import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProduct, fetchPriceHistory } from '../api/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ProductDetail() {
  const { productId } = useParams();
  const { data: product } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId!),
  });
  const { data: priceData } = useQuery({
    queryKey: ['priceHistory', productId],
    queryFn: () => fetchPriceHistory(productId!),
  });

  if (!product) return <div>Loading...</div>;

  const chartData = priceData?.history?.map((h: any) => ({
    date: new Date(h.recorded_at).toLocaleDateString(),
    price: h.price,
    platform: h.platform,
  })) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold">{product.title}</h1>
      <p className="text-gray-600">Brand: {product.brand}</p>
      <p className="text-gray-600">Category: {product.category?.l1} / {product.category?.l2}</p>
      <div className="mt-6">
        <h2 className="text-xl font-semibold">Price History (90 days)</h2>
        <LineChart width={600} height={300} data={chartData}>
          <XAxis dataKey="date" />
          <YAxis />
          <CartesianGrid stroke="#eee" />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#8884d8" />
        </LineChart>
      </div>
    </div>
  );
}