import type { IconName } from '../../Icon/Icon';

export type SourceTabId = 'discover' | 'file' | 'youtube';

export const SOURCE_TABS: Array<{
  id: SourceTabId;
  label: string;
  icon: IconName;
}> = [
  { id: 'discover', label: 'Discover', icon: 'search' },
  { id: 'file', label: 'Your file', icon: 'upload' },
  { id: 'youtube', label: 'YouTube', icon: 'video' },
];

export const tabId = (id: SourceTabId) => `source-tab-${id}`;
export const panelId = (id: SourceTabId) => `source-panel-${id}`;
