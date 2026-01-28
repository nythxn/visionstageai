
import React from 'react';
import { StagingStyle } from '../types';

interface StyleCardProps {
  style: StagingStyle;
  isSelected: boolean;
  onSelect: (style: StagingStyle) => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ style, isSelected, onSelect }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(style)}
      className={`relative flex flex-col items-start p-5 rounded-2xl border-2 transition-all text-left group h-full ${
        isSelected 
          ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-600 ring-opacity-10' 
          : 'border-gray-100 bg-white hover:border-indigo-300 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between w-full mb-3">
        <div className="text-3xl filter group-hover:scale-110 transition-transform">{style.icon}</div>
        {style.isCustom && (
          <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-tighter">Custom</span>
        )}
      </div>
      <h4 className={`font-black text-sm tracking-tight ${isSelected ? 'text-indigo-950' : 'text-gray-900'}`}>
        {style.name}
      </h4>
      <p className="text-[10px] text-gray-400 font-bold mt-1 line-clamp-2 leading-relaxed uppercase tracking-tighter">
        {style.isCustom ? 'Agent defined custom aesthetic.' : style.description}
      </p>
      
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="bg-indigo-600 rounded-full p-1 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
};
