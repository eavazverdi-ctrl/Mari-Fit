/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface BodyAdjustmentPanelProps {
  onAdjustBody: (direction: 'more' | 'less') => void;
  isLoading: boolean;
}

const BodyAdjustmentPanel: React.FC<BodyAdjustmentPanelProps> = ({ onAdjustBody, isLoading }) => {
  return (
    <div>
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-3">Physique Adjustment</h2>
      <p className="text-sm text-gray-600 mb-3">Fine-tune the abdominal muscle definition.</p>
      <div className="flex items-center gap-3">
        <button
            onClick={() => onAdjustBody('less')}
            disabled={isLoading}
            className="w-1/2 text-center bg-gray-800 text-white font-semibold py-2.5 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-600 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            Less Sixpack
        </button>
        <button
            onClick={() => onAdjustBody('more')}
            disabled={isLoading}
            className="w-1/2 text-center bg-gray-800 text-white font-semibold py-2.5 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-600 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            More Sixpack
        </button>
      </div>
    </div>
  );
};

export default BodyAdjustmentPanel;
