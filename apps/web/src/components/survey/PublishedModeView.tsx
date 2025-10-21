// Component for displaying draft mode status
import Card from '../ui/Card';

interface PublishedModeViewProps {
  startDate?: string;
}

export default function PublishedModeView({ startDate }: PublishedModeViewProps) {
  const formattedDate = startDate ? new Date(startDate).toLocaleDateString() : 'not set';
  
  return (
    <Card className="my-8">
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Survey Not Live Yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          This survey is currently in draft mode and is not accessible to respondents.
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          {startDate 
            ? `Survey will be live on ${formattedDate}`
            : 'Set a start date to make this survey available to respondents.'}
        </p>
      </div>
    </Card>
  );
}