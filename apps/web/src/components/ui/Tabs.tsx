import React from 'react';

interface Tab {
  id: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  // ✅ helper to compute classes
  const getTabClass = (tab: Tab) => {
    if (activeTab === tab.id) {
      return 'border-black text-black dark:text-white dark:border-white';
    }
    if (tab.disabled) {
      return 'border-transparent text-gray-400 cursor-not-allowed';
    }
    return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300';
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && onTabChange(tab.id)}
              disabled={tab.disabled}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${getTabClass(
                tab
              )}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {tabs.find((tab) => tab.id === activeTab)?.content && (
        <div className="mt-4">
          {tabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      )}
    </div>
  );
};

export default Tabs;