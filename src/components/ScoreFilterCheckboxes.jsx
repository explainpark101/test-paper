import React from 'react';

function ScoreFilterCheckboxes({ filterChecks, onChange }) {
  const handleChange = (key, checked) => {
    onChange(prev => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs border-t border-gray-100 pt-3">
      <span className="font-semibold text-gray-600">필터:</span>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filterChecks.AO}
          onChange={(e) => handleChange('AO', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
        <span className="text-green-600 font-medium">AO</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filterChecks.BO}
          onChange={(e) => handleChange('BO', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
        <span className="text-green-600 font-medium">BO</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filterChecks.CO}
          onChange={(e) => handleChange('CO', e.target.checked)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
        <span className="text-green-600 font-medium">CO</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filterChecks.AX}
          onChange={(e) => handleChange('AX', e.target.checked)}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <span className="text-red-600 font-medium">AX</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filterChecks.BX}
          onChange={(e) => handleChange('BX', e.target.checked)}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <span className="text-red-600 font-medium">BX</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={filterChecks.CX}
          onChange={(e) => handleChange('CX', e.target.checked)}
          className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
        />
        <span className="text-red-600 font-medium">CX</span>
      </label>
    </div>
  );
}

export default ScoreFilterCheckboxes;
