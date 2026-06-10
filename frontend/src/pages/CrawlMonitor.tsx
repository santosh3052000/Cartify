export default function CrawlMonitor() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Crawl Monitor</h1>
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-green-600">✅ Crawl simulation: active</p>
        <p>Last crawl: {new Date().toLocaleString()}</p>
        <p>Products synced: 50</p>
        <p>Pending enrichment: 0</p>
      </div>
    </div>
  );
}