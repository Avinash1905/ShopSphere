import React from 'react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 text-surface-900">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-surface-200 max-w-lg">
        <h1 className="text-3xl font-bold text-brand-600 mb-2">ShopSphere Platform</h1>
        <p className="text-surface-600">Frontend Foundation Initialized</p>
      </div>
    </div>
  );
};

export default App;
