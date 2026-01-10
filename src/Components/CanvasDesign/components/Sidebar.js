/**
 * Sidebar Component
 * Left vertical toolbar with tool icons
 */

import React from 'react';
import { SIDEBAR_TOOLS } from '../constants';

const Sidebar = ({ activeToolId, onToolSelect }) => {
  return (
    <aside className="w-16 bg-white border-r flex flex-col items-center py-2">
      {SIDEBAR_TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeToolId === tool.id;
        
        return (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`w-full py-3 flex flex-col items-center gap-1 transition-colors ${
              isActive
                ? 'bg-cyan-50 text-cyan-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] leading-tight text-center whitespace-pre-line">
              {tool.label}
            </span>
          </button>
        );
      })}
    </aside>
  );
};

export default Sidebar;
