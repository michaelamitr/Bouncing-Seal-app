import { type KeyboardEvent, useRef } from 'react';

import { Icon } from '../../Icon/Icon';
import {
  panelId,
  SOURCE_TABS,
  type SourceTabId,
  tabId,
} from './sourceTabConfig.ts';
import './index.css';

interface SourceTabsProps {
  activeTab: SourceTabId;
  onChange: (tab: SourceTabId) => void;
}

/** WAI-ARIA tabs: arrow keys, Home and End move between music sources. */
export const SourceTabs = ({ activeTab, onChange }: SourceTabsProps) => {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = SOURCE_TABS.findIndex((tab) => tab.id === activeTab);
    const last = SOURCE_TABS.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (current + 1) % SOURCE_TABS.length
        : event.key === 'ArrowLeft'
          ? (current - 1 + SOURCE_TABS.length) % SOURCE_TABS.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;

    if (next === null) {
      return;
    }

    event.preventDefault();
    onChange(SOURCE_TABS[next].id);
    buttons.current[next]?.focus();
  };

  return (
    <div
      className="source-tabs"
      role="tablist"
      aria-label="Music source"
      onKeyDown={handleKeyDown}
    >
      {SOURCE_TABS.map((tab, index) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            id={tabId(tab.id)}
            type="button"
            role="tab"
            className="source-tab"
            aria-selected={isActive}
            aria-controls={panelId(tab.id)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
