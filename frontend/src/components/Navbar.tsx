import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-indigo-700 text-white p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* Left Side: Logo Icon and Brand Name */}
        <Link to="/" className="flex items-center gap-3 group">
          {/* SVG representation of your Cartify Icon */}
          <div className="p-2 bg-indigo-800 rounded-xl border border-indigo-500/30 transition-all duration-300 group-hover:border-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            <svg 
              className="w-6 h-6 text-amber-400 transition-transform duration-300 group-hover:scale-110" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://w3.org"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M13 5l2 2-2 2M9 7h6"
              />
            </svg>
          </div>
          
          {/* Glowing Golden Text */}
          <span className="text-xl font-extrabold tracking-wide text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all duration-300 group-hover:text-amber-300 group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]">
            Cartify
          </span>
        </Link>

        {/* Right Side: Navigation Links */}
        <div className="flex gap-6">
          <Link 
            to="/" 
            className="transition-all duration-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] hover:underline"
          >
            Products
          </Link>
          <Link 
            to="/compare" 
            className="transition-all duration-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] hover:underline"
          >
            Compare
          </Link>
          <Link 
            to="/monitor" 
            className="transition-all duration-300 hover:text-orange-500 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] hover:underline"
          >
            Monitor
          </Link>
        </div>

      </div>
    </nav>
  );
}
