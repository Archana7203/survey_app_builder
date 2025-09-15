import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from '../Card';

describe('Card Component', () => {
  it('should render with default props', () => {
    render(<Card>Card content</Card>);
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
    // Card content is in a nested div, so we need to go up to the main card container
    const cardContainer = screen.getByText('Card content').closest('.bg-white');
    expect(cardContainer).toHaveClass('bg-white', 'rounded-lg', 'border', 'shadow-sm');
  });

  it('should render with title', () => {
    render(
      <Card title="Card Title">
        Card content
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render with subtitle', () => {
    render(
      <Card subtitle="Card Subtitle">
        Card content
      </Card>
    );
    
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render with both title and subtitle', () => {
    render(
      <Card title="Card Title" subtitle="Card Subtitle">
        Card content
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render with actions', () => {
    render(
      <Card 
        title="Card Title" 
        actions={<button>Action Button</button>}
      >
        Card content
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply hover effect when hover prop is true', () => {
    render(<Card hover>Hoverable card</Card>);
    
    const card = screen.getByText('Hoverable card').closest('.bg-white');
    expect(card).toHaveClass('hover:shadow-md', 'transition-shadow', 'duration-200');
  });

  it('should not apply hover effect when hover prop is false', () => {
    render(<Card hover={false}>Non-hoverable card</Card>);
    
    const card = screen.getByText('Non-hoverable card').closest('div');
    expect(card).not.toHaveClass('hover:shadow-md');
  });

  it('should apply custom className', () => {
    render(<Card className="custom-class">Custom card</Card>);
    
    const card = screen.getByText('Custom card').closest('.bg-white');
    expect(card).toHaveClass('custom-class');
  });

  it('should apply custom backgroundColor style', () => {
    render(<Card backgroundColor="#ff0000">Red card</Card>);
    
    const card = screen.getByText('Red card').closest('.bg-white');
    expect(card).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('should render complex children content', () => {
    render(
      <Card>
        <div>
          <h2>Complex Content</h2>
          <p>This is a paragraph</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
        </div>
      </Card>
    );
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('This is a paragraph')).toBeInTheDocument();
    expect(screen.getByText('List item 1')).toBeInTheDocument();
    expect(screen.getByText('List item 2')).toBeInTheDocument();
  });

  it('should render multiple action buttons', () => {
    render(
      <Card 
        title="Card with Actions"
        actions={
          <div>
            <button>Button 1</button>
            <button>Button 2</button>
          </div>
        }
      >
        Card content
      </Card>
    );
    
    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();
  });

  it('should have proper dark mode classes', () => {
    render(<Card>Dark mode card</Card>);
    
    const card = screen.getByText('Dark mode card').closest('.bg-white');
    expect(card).toHaveClass('dark:bg-gray-800', 'dark:border-gray-700');
  });

  it('should render header section only when title, subtitle, or actions are provided', () => {
    const { rerender } = render(<Card>No header</Card>);
    const noHeaderCard = screen.queryByText('No header')?.closest('.bg-white');
    expect(noHeaderCard?.querySelector('.border-b')).not.toBeInTheDocument();

    rerender(<Card title="With title">With header</Card>);
    const withHeaderCard = screen.getByText('With header').closest('.bg-white');
    expect(withHeaderCard?.querySelector('.border-b')).toBeInTheDocument();
  });

  it('should render content in proper structure', () => {
    render(
      <Card title="Test Card">
        <div data-testid="card-content">Content</div>
      </Card>
    );
    
    const content = screen.getByTestId('card-content');
    expect(content.closest('.px-6.py-4')).toBeInTheDocument();
  });
});
