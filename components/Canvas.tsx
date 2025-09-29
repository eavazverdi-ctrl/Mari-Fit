/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (instruction: string) => void;
  currentPoseInstruction: string;
}

const Canvas: React.FC<CanvasProps> = ({ displayImageUrl, onStartOver, isLoading, loadingMessage, onSelectPose, currentPoseInstruction }) => {
  const [poseInput, setPoseInput] = useState('');

  const handlePoseGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    if (poseInput.trim()) {
      onSelectPose(poseInput.trim());
      setPoseInput('');
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Start Over Button */}
      <button 
          onClick={onStartOver}
          className="absolute top-4 left-4 z-30 flex items-center justify-center text-center bg-white/60 border border-gray-300/80 text-gray-700 font-semibold py-2 px-4 rounded-full transition-all duration-200 ease-in-out hover:bg-white hover:border-gray-400 active:scale-95 text-sm backdrop-blur-sm"
      >
          <RotateCcwIcon className="w-4 h-4 mr-2" />
          Start Over
      </button>

      {/* Image Display or Placeholder */}
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl} // Use key to force re-render and trigger animation on image change
            src={displayImageUrl}
            alt="Virtual try-on model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg"
          />
        ) : (
            <div className="w-[400px] h-[600px] bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-md font-serif text-gray-600 mt-4">Loading Model...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom Pose Controls */}
      {displayImageUrl && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-4"
        >
          <form 
            onSubmit={handlePoseGeneration}
            className="flex items-center justify-center gap-2 bg-white/60 backdrop-blur-md rounded-full p-2 border border-gray-300/50 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <input
              type="text"
              value={poseInput}
              onChange={(e) => setPoseInput(e.target.value)}
              placeholder="Describe a pose, e.g., 'jumping in the air'"
              className="w-full bg-transparent focus:outline-none text-sm font-medium text-gray-800 px-3 placeholder-gray-500"
              disabled={isLoading}
            />
            <button 
              type="submit"
              aria-label="Generate pose"
              className="flex-shrink-0 bg-gray-800 text-white font-semibold rounded-full px-4 py-1.5 text-sm hover:bg-gray-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !poseInput.trim()}
            >
              Generate
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Canvas;
