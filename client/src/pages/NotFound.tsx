import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white/10 mb-4">404</h1>
        <p className="text-sm text-white/30 mb-6">Page not found</p>
        <button
          onClick={() => setLocation('/')}
          className="px-4 py-2 rounded-lg text-sm bg-ice/10 text-ice border border-ice/20 hover:bg-ice/20 transition-colors"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
