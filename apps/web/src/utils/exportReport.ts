import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Set the fonts for pdfMake
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = pdfFonts;

interface Survey {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
}

interface QuestionAnalytics {
  questionId: string;
  type: string;
  title: string;
  totalResponses: number;
  analytics: {
    type: 'choice' | 'numeric' | 'text' | 'matrix' | 'grid' | 'basic';
    data?: Record<string, unknown>;
    values?: Array<{ label: string; value: number; percentage: number }>;
    stats?: {
      min?: number;
      max?: number;
      average?: number;
      responses?: number;
    };
    textResponses?: string[];
  } | null;
}

interface AnalyticsData {
  surveyId: string;
  totalResponses: number;
  questions: QuestionAnalytics[];
}

export const exportReport = (survey: Survey, analytics: AnalyticsData) => {
  const docDefinition = {
    content: [
      // Header
      {
        text: 'Survey Report',
        style: 'header',
        alignment: 'center' as const,
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      
      // Survey Details
      {
        text: survey.title,
        style: 'subheader',
        margin: [0, 0, 0, 10] as [number, number, number, number]
      },
      
      ...(survey.description ? [{
        text: survey.description,
        style: 'normal',
        margin: [0, 0, 0, 10] as [number, number, number, number]
      }] : []),
      
      {
        text: `Generated on: ${new Date().toLocaleDateString()}`,
        style: 'small',
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      
      // Summary Section
      {
        text: 'Summary',
        style: 'subheader',
        margin: [0, 0, 0, 10] as [number, number, number, number]
      },
      
      {
        table: {
          widths: ['*', '*'],
          body: [
            ['Total Responses', analytics.totalResponses.toString()],
            ['Total Questions', analytics.questions.length.toString()],
            ['Questions with Responses', analytics.questions.filter(q => q.totalResponses > 0).length.toString()],
            ['Completion Rate', `${Math.round((analytics.questions.filter(q => q.totalResponses > 0).length / analytics.questions.length) * 100)}%`]
          ]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20] as [number, number, number, number]
      },
      
      // Questions Section
      {
        text: 'Question Analysis',
        style: 'subheader',
        margin: [0, 0, 0, 10] as [number, number, number, number]
      },
      
      ...analytics.questions.map((question, index) => [
        {
          text: `${index + 1}. ${question.title}`,
          style: 'questionTitle',
          margin: [0, 10, 0, 5] as [number, number, number, number]
        },
        {
          text: `Type: ${question.type} | Responses: ${question.totalResponses}`,
          style: 'small',
          margin: [0, 0, 0, 5] as [number, number, number, number]
        },
        
        // Question-specific content based on analytics type
        ...(question.totalResponses > 0 ? getQuestionContent(question) : [{
          text: 'No responses collected for this question.',
          style: 'small',
          margin: [0, 0, 0, 10] as [number, number, number, number]
        }])
      ]).flat()
    ],
    
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        color: '#2563eb'
      },
      subheader: {
        fontSize: 16,
        bold: true,
        color: '#374151'
      },
      questionTitle: {
        fontSize: 14,
        bold: true,
        color: '#1f2937'
      },
      normal: {
        fontSize: 12,
        color: '#374151'
      },
      small: {
        fontSize: 10,
        color: '#6b7280'
      }
    },
    
    defaultStyle: {
      fontSize: 12,
      color: '#374151'
    }
  };

  // Generate and download the PDF
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pdfMake.createPdf(docDefinition as any).download(`survey-report-${survey.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`);
};

function getQuestionContent(question: QuestionAnalytics): Array<Record<string, unknown>> {
  const content: Array<Record<string, unknown>> = [];
  
  if (question.analytics) {
    switch (question.analytics.type) {
      case 'choice':
        if (question.analytics.values && question.analytics.values.length > 0) {
          content.push({
            table: {
              widths: ['*', 'auto', 'auto'],
              headerRows: 1,
              body: [
                ['Option', 'Count', 'Percentage'],
                ...question.analytics.values.map(item => [
                  item.label,
                  item.value.toString(),
                  `${item.percentage.toFixed(1)}%`
                ])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          });
        }
        break;
        
      case 'numeric':
        if (question.analytics.stats) {
          const stats = question.analytics.stats;
          content.push({
            table: {
              widths: ['*', '*'],
              body: [
                ...(stats.min !== undefined ? [['Minimum', stats.min.toString()]] : []),
                ...(stats.max !== undefined ? [['Maximum', stats.max.toString()]] : []),
                ...(stats.average !== undefined ? [['Average', stats.average.toFixed(2)]] : []),
                ...(stats.responses !== undefined ? [['Total Responses', stats.responses.toString()]] : [])
              ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          });
        }
        break;
        
      case 'text':
        if (question.analytics.textResponses && question.analytics.textResponses.length > 0) {
          content.push({
            text: 'Text Responses:',
            style: 'small',
            bold: true,
            margin: [0, 0, 0, 5] as [number, number, number, number]
          });
          
          // Show up to 10 text responses
          const displayResponses = question.analytics.textResponses.slice(0, 10);
          content.push({
            ul: displayResponses.map(response => ({
              text: response,
              style: 'small'
            })),
            margin: [0, 0, 0, 5] as [number, number, number, number]
          });
          
          if (question.analytics.textResponses.length > 10) {
            content.push({
              text: `... and ${question.analytics.textResponses.length - 10} more responses`,
              style: 'small',
              italics: true,
              margin: [0, 0, 0, 10] as [number, number, number, number]
            });
          }
        }
        break;
        
      case 'matrix':
      case 'grid':
        if (question.analytics.data) {
          content.push({
            text: 'Matrix/Grid responses are visualized in charts and cannot be fully represented in this text format.',
            style: 'small',
            italics: true,
            margin: [0, 0, 0, 10] as [number, number, number, number]
          });
        }
        break;
        
      default:
        content.push({
          text: 'Analytics data available in the dashboard.',
          style: 'small',
          margin: [0, 0, 0, 10] as [number, number, number, number]
        });
    }
  }
  
  return content;
}