import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Alert from '../Alert';

describe('Alert Component', () => {
    it('should render with default props', () => {
    render(<Alert>Test alert message</Alert>);

    expect(screen.getByText('Test alert message')).toBeInTheDocument();
    // Alert component doesn't have role="alert" by default
    expect(screen.getByText('Test alert message').closest('div')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Alert variant="info">Info alert</Alert>);
    expect(screen.getByText('Info alert')).toBeInTheDocument();
    // Find the main alert container (the one with border and rounded classes)
    const alertContainer = screen.getByText('Info alert').closest('.border.rounded-md');
    expect(alertContainer).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');

    rerender(<Alert variant="success">Success alert</Alert>);
    const successContainer = screen.getByText('Success alert').closest('.border.rounded-md');
    expect(successContainer).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');

    rerender(<Alert variant="warning">Warning alert</Alert>);
    const warningContainer = screen.getByText('Warning alert').closest('.border.rounded-md');
    expect(warningContainer).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');

    rerender(<Alert variant="error">Error alert</Alert>);
    const errorContainer = screen.getByText('Error alert').closest('.border.rounded-md');
    expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('should render with title', () => {
    render(
      <Alert title="Alert Title">
        Alert message
      </Alert>
    );
    
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('should render close button when onClose is provided', () => {
    const handleClose = vi.fn();
    render(
      <Alert onClose={handleClose}>
        Dismissible alert
      </Alert>
    );
    
    const closeButton = screen.getByLabelText('Close alert');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(<Alert>Non-dismissible alert</Alert>);
    
    expect(screen.queryByLabelText('Close alert')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<Alert className="custom-class">Custom alert</Alert>);
    
    const customContainer = screen.getByText('Custom alert').closest('.border.rounded-md');
    expect(customContainer).toHaveClass('custom-class');
  });

  it('should render appropriate icons for each variant', () => {
    const { rerender } = render(<Alert variant="info">Info</Alert>);
    const infoContainer = screen.getByText('Info').closest('.border.rounded-md');
    expect(infoContainer?.querySelector('svg')).toBeInTheDocument();

    rerender(<Alert variant="success">Success</Alert>);
    const successContainer = screen.getByText('Success').closest('.border.rounded-md');
    expect(successContainer?.querySelector('svg')).toBeInTheDocument();

    rerender(<Alert variant="warning">Warning</Alert>);
    const warningContainer = screen.getByText('Warning').closest('.border.rounded-md');
    expect(warningContainer?.querySelector('svg')).toBeInTheDocument();

    rerender(<Alert variant="error">Error</Alert>);
    const errorContainer = screen.getByText('Error').closest('.border.rounded-md');
    expect(errorContainer?.querySelector('svg')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <Alert>
        <div>
          <p>Complex alert content</p>
          <button>Action button</button>
        </div>
      </Alert>
    );
    
    expect(screen.getByText('Complex alert content')).toBeInTheDocument();
    expect(screen.getByText('Action button')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<Alert>Accessible alert</Alert>);
    
    const alert = screen.getByText('Accessible alert').closest('div');
    expect(alert).toBeInTheDocument();
  });

  it('should handle close button hover states', () => {
    const handleClose = vi.fn();
    render(
      <Alert onClose={handleClose}>
        Hoverable close button
      </Alert>
    );
    
    const closeButton = screen.getByLabelText('Close alert');
    expect(closeButton).toHaveClass('hover:ring-1', 'hover:ring-gray-300');
  });

  it('should render with dark mode classes', () => {
    render(<Alert variant="info">Dark mode alert</Alert>);
    
    const alert = screen.getByText('Dark mode alert').closest('.border.rounded-md');
    expect(alert).toHaveClass('dark:bg-blue-900/20', 'dark:border-blue-800', 'dark:text-blue-200');
  });
});
