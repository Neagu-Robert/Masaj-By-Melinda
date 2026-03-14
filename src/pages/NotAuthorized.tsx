import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default function NotAuthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Neautorizat</h1>
      <p>Nu aveți permisiunea de a accesa această pagină.</p>
    </div>
  );
} 