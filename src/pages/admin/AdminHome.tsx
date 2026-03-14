import React from "react";

import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [{ name: "robots", content: "noindex, nofollow" }];
};

export default function AdminHome() {
  return (
    <div className="max-w-2xl mx-auto mt-12 bg-gray-800/50 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-4 text-violet-400">Bine ați venit la Panoul de Administrare</h2>
      <p className="text-white mb-2">Selectați o secțiune din bara laterală pentru a începe gestionarea aplicației.</p>
      <p className="text-gray-400">Folosiți navigația din stânga pentru a accesa rezervări, disponibilități, analize, utilizatori și jurnale de audit.</p>
    </div>
  );
} 