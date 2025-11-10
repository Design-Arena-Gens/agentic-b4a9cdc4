'use client';

import { useState } from 'react';
import EisenhowerMatrix from '@/components/EisenhowerMatrix';
import AIBlueprintOrganizer from '@/components/AIBlueprintOrganizer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'ai'>('matrix');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-6">
          Eisenhower Matrix & AI Blueprint Organizer
        </h1>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Task Matrix
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            AI Blueprint Organizer
          </button>
        </div>

        {activeTab === 'matrix' ? <EisenhowerMatrix /> : <AIBlueprintOrganizer />}
      </div>
    </main>
  );
}
