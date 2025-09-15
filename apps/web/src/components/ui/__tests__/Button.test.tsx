import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('Button Component', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('font-medium', 'rounded-lg', 'transition-colors');
  });

  it('should render with primary variant by default', () => {
    render(<Button>Primary Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-white');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: 'var(--color-secondary)',
      borderColor: 'var(--color-secondary-border)',
      borderWidth: '1px',
      borderStyle: 'solid',
      color: 'var(--color-primary)',
    });

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border', 'text-gray-700');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-gray-700');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:opacity-90', 'text-white');

    rerender(<Button variant="accent">Accent</Button>);
    expect(screen.getByRole('button')).toHaveStyle({
      backgroundColor: 'var(--color-accent-button)',
      borderRadius: '9999px',
    });
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('should not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply primary variant styles with CSS variables', () => {
    render(<Button variant="primary">Primary</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveStyle({
      backgroundColor: 'var(--color-primary)',
    });
  });

  it('should handle mouse enter and leave events for primary variant', () => {
    render(<Button variant="primary">Primary</Button>);
    
    const button = screen.getByRole('button');
    
    // Test mouse enter
    fireEvent.mouseEnter(button);
    expect(button).toHaveStyle({
      backgroundColor: 'var(--color-primary)',
    });
    
    // Test mouse leave
    fireEvent.mouseLeave(button);
    expect(button).toHaveStyle({
      backgroundColor: 'var(--color-primary)',
    });
  });

  it('should not apply hover styles for non-primary variants', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByRole('button');
    
    fireEvent.mouseEnter(button);
    expect(button).not.toHaveStyle({
      backgroundColor: 'var(--color-accent-hover)',
    });
  });

  it('should pass through other HTML button attributes', () => {
    render(
      <Button 
        type="submit" 
        data-testid="submit-button"
        aria-label="Submit form"
      >
        Submit
      </Button>
    );
    
    const button = screen.getByTestId('submit-button');
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('aria-label', 'Submit form');
  });

  it('should render children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});

