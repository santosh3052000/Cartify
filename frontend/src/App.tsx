import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductExplorer from './pages/ProductExplorer';
import ProductDetail from './pages/ProductDetail';
import ComparisonBoard from './pages/ComparisonBoard';
import CrawlMonitor from './pages/CrawlMonitor';
import Navbar from './components/Navbar';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<ProductExplorer />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/compare" element={<ComparisonBoard />} />
            <Route path="/monitor" element={<CrawlMonitor />} />
          </Routes>
        </main>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;