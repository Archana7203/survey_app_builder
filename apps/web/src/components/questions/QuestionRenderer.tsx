import React from 'react';
import SingleChoiceQuestion from './SingleChoiceQuestion';
import MultiChoiceQuestion from './MultiChoiceQuestion';
import DropdownQuestion from './DropdownQuestion';

import SliderQuestion from './SliderQuestion';
import RatingStarQuestion from './RatingStarQuestion';
import RatingSmileyQuestion from './RatingSmileyQuestion';
import RatingNumberQuestion from './RatingNumberQuestion';
import TextShortQuestion from './TextShortQuestion';
import TextLongQuestion from './TextLongQuestion';
import DatePickerQuestion from './DatePickerQuestion';
import FileUploadQuestion from './FileUploadQuestion';
import EmailQuestion from './EmailQuestion';

export interface QuestionProps {
  question: {
    id: string;
    type: string;
    title: string;
    description?: string;
    required: boolean;
    options?: Array<{
      id: string;
      text: string;
      value?: string;
    }>;
    settings?: (Record<string, unknown> & { backgroundColor?: string; textColor?: string });
  };
  value?: string | number | boolean | string[] | number[] | Record<string, string>;
  onChange?: (value: string | number | boolean | string[] | number[] | Record<string, string>) => void;
  error?: string;
  disabled?: boolean;
  themeColors?: {
    backgroundColor?: string;
    textColor?: string;
    primaryColor?: string;
  };
}

const QuestionRenderer: React.FC<QuestionProps> = (props) => {
  const { question, themeColors } = props;
  const style = (question.settings && (question.settings).backgroundColor) || (question.settings && (question.settings).textColor)
    ? {
        backgroundColor: (question.settings).backgroundColor,
        color: (question.settings).textColor,
        borderRadius: '0.5rem',
        padding: '1rem',
      } as React.CSSProperties
    : undefined;

  switch (question.type) {
    case 'singleChoice':
      return <div style={style}><SingleChoiceQuestion {...props} themeColors={themeColors} /></div>;
    case 'multiChoice':
      return <div style={style}><MultiChoiceQuestion {...props} themeColors={themeColors} /></div>;
    case 'dropdown':
      return <div style={style}><DropdownQuestion {...props} themeColors={themeColors} /></div>;
    
    case 'slider':
      return <div style={style}><SliderQuestion {...props} themeColors={themeColors} /></div>;
    case 'ratingStar':
      return <div style={style}><RatingStarQuestion {...props} themeColors={themeColors} /></div>;
    case 'ratingSmiley':
      return <div style={style}><RatingSmileyQuestion {...props} themeColors={themeColors} /></div>;
    case 'ratingNumber':
      return <div style={style}><RatingNumberQuestion {...props} themeColors={themeColors} /></div>;
    case 'textShort':
      return <div style={style}><TextShortQuestion {...props} themeColors={themeColors} /></div>;
    case 'textLong':
      return <div style={style}><TextLongQuestion {...props} themeColors={themeColors} /></div>;
    case 'datePicker':
      return <div style={style}><DatePickerQuestion {...props} themeColors={themeColors} /></div>;
    case 'fileUpload':
      return <div style={style}><FileUploadQuestion {...props} themeColors={themeColors} /></div>;
    case 'email':
      return <div style={style}><EmailQuestion {...props} themeColors={themeColors} /></div>;
    default:
      return (
        <div style={{
          padding: '1rem',
          border: '1px solid #fca5a5',
          borderRadius: '0.375rem',
          backgroundColor: '#fef2f2'
        }}>
          <p style={{ color: '#dc2626' }}>Unknown question type: {question.type}</p>
        </div>
      );
  }
};

export default QuestionRenderer;

