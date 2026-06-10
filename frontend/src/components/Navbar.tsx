import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-indigo-700 text-white p-4 shadow-lg">
      <div className="container mx-auto flex gap-6">
        <Link to="/" className="hover:underline">Products</Link>
        <Link to="/compare" className="hover:underline">Compare</Link>
        <Link to="/monitor" className="hover:underline">Monitor</Link>
      </div>
    </nav>
  );
}