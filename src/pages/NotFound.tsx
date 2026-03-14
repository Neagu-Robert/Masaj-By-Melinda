import { useLocation } from "react-router";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Ups! Pagina nu a fost găsită</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Înapoi la Pagina Principală
        </a>
      </div>
    </div>
  );
};

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default NotFound;
