import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Tabs from '../ui/Tabs';
import ThemePicker from '../ui/ThemePicker';

interface SurveyDetailsCardProps {
  survey: any;
  setSurvey: (survey: any) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SurveyDetailsCard: React.FC<SurveyDetailsCardProps> = ({
  survey,
  setSurvey,
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'theme', label: 'Theme' },
  ];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey({ ...survey, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey({ ...survey, description: e.target.value });
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey({ ...survey, backgroundColor: e.target.value });
  };

  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSurvey({ ...survey, textColor: e.target.value });
  };

  const handleThemeChange = (themeId: string) => {
    setSurvey({ ...survey, theme: themeId });
  };

  return (
    <Card>
      <div className="p-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="mt-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <Input
                label="Survey Title"
                value={survey.title}
                onChange={handleTitleChange}
                placeholder="Enter survey title"
              />
              
              <Input
                label="Description (Optional)"
                value={survey.description || ''}
                onChange={handleDescriptionChange}
                placeholder="Describe your survey"
              />

              {/* Global background and theme preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Global Background Color"
                  type="color"
                  value={survey.backgroundColor || '#f9fafb'}
                  onChange={handleBackgroundColorChange}
                />
                <Input
                  label="Global Text Color"
                  type="color"
                  value={survey.textColor || '#111827'}
                  onChange={handleTextColorChange}
                />
              </div>
            </div>
        )}
          
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <ThemePicker
                selectedTheme={survey.theme || 'default'}
                onThemeChange={handleThemeChange}
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default SurveyDetailsCard;
