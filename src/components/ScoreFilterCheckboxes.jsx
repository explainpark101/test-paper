import React from 'react';
import Checkbox from './Checkbox';

function ScoreFilterCheckboxes({ filterChecks, onChange }) {
  const handleChange = (key, checked) => {
    onChange(prev => ({ ...prev, [key]: checked }));
  };

  const toggleCorrect = () => {
    const allCorrectChecked = filterChecks.AO && filterChecks.BO && filterChecks.CO && filterChecks.NO;
    onChange(prev => ({
      ...prev,
      AO: !allCorrectChecked,
      BO: !allCorrectChecked,
      CO: !allCorrectChecked,
      NO: !allCorrectChecked
    }));
  };

  const toggleWrong = () => {
    const allWrongChecked = filterChecks.AX && filterChecks.BX && filterChecks.CX && filterChecks.NX;
    onChange(prev => ({
      ...prev,
      AX: !allWrongChecked,
      BX: !allWrongChecked,
      CX: !allWrongChecked,
      NX: !allWrongChecked
    }));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs border-t border-gray-100 dark:border-gray-700 pt-3">
      <span className="font-semibold text-gray-600 dark:text-gray-400">필터:</span>
      <button
        type="button"
        onClick={toggleCorrect}
        className="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 border border-green-300 dark:border-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
      >
        맞은 것 전부 {filterChecks.AO && filterChecks.BO && filterChecks.CO && filterChecks.NO ? 'OFF' : 'ON'}
      </button>
      <button
        type="button"
        onClick={toggleWrong}
        className="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
      >
        틀린 것 전부 {filterChecks.AX && filterChecks.BX && filterChecks.CX && filterChecks.NX ? 'OFF' : 'ON'}
      </button>
      <Checkbox
        checked={filterChecks.AO}
        onChange={(checked) => handleChange('AO', checked)}
        variant="green"
        label={<span className="text-green-600 dark:text-green-400 font-medium">AO</span>}
      />
      <Checkbox
        checked={filterChecks.BO}
        onChange={(checked) => handleChange('BO', checked)}
        variant="green"
        label={<span className="text-green-600 dark:text-green-400 font-medium">BO</span>}
      />
      <Checkbox
        checked={filterChecks.CO}
        onChange={(checked) => handleChange('CO', checked)}
        variant="green"
        label={<span className="text-green-600 dark:text-green-400 font-medium">CO</span>}
      />
      <Checkbox
        checked={filterChecks.AX}
        onChange={(checked) => handleChange('AX', checked)}
        variant="red"
        label={<span className="text-red-600 dark:text-red-400 font-medium">AX</span>}
      />
      <Checkbox
        checked={filterChecks.BX}
        onChange={(checked) => handleChange('BX', checked)}
        variant="red"
        label={<span className="text-red-600 dark:text-red-400 font-medium">BX</span>}
      />
      <Checkbox
        checked={filterChecks.CX}
        onChange={(checked) => handleChange('CX', checked)}
        variant="red"
        label={<span className="text-red-600 dark:text-red-400 font-medium">CX</span>}
      />
      <Checkbox
        checked={filterChecks.NO}
        onChange={(checked) => handleChange('NO', checked)}
        variant="gray"
        label={<span className="text-gray-400 dark:text-gray-500 font-medium">NO</span>}
      />
      <Checkbox
        checked={filterChecks.NX}
        onChange={(checked) => handleChange('NX', checked)}
        variant="gray"
        label={<span className="text-gray-400 dark:text-gray-500 font-medium">NX</span>}
      />
    </div>
  );
}

export default ScoreFilterCheckboxes;
