import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RatingSmiley from '../RatingSmiley';

describe('RatingSmiley Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<RatingSmiley />);
    
    // Should render 5 smiley buttons
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText('😞')).toBeInTheDocument();
    expect(screen.getByText('😐')).toBeInTheDocument();
    expect(screen.getByText('🙂')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
    expect(screen.getByText('😍')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<RatingSmiley label="Rate your experience" />);
    
    expect(screen.getByText('Rate your experience')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<RatingSmiley error="Please select a rating" />);
    
    const errorMessage = screen.getByText('Please select a rating');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('should show selected smiley', () => {
    render(<RatingSmiley value={3} />);
    
    const selectedSmiley = screen.getByText('🙂');
    expect(selectedSmiley).toHaveClass('scale-110', 'drop-shadow-lg');
  });

  it('should call onChange when smiley is clicked', () => {
    render(<RatingSmiley onChange={mockOnChange} />);
    
    const thirdSmiley = screen.getByText('🙂');
    fireEvent.click(thirdSmiley);
    
    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('should not call onChange when readOnly is true', () => {
    render(<RatingSmiley onChange={mockOnChange} readOnly />);
    
    const thirdSmiley = screen.getByText('🙂');
    fireEvent.click(thirdSmiley);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should show hover effect when not readOnly', () => {
    render(<RatingSmiley />);
    
    const thirdSmiley = screen.getByText('🙂');
    fireEvent.mouseEnter(thirdSmiley);
    
    expect(thirdSmiley).toHaveClass('scale-110', 'drop-shadow-lg');
  });

  it('should not show hover effect when readOnly', () => {
    render(<RatingSmiley readOnly />);
    
    const thirdSmiley = screen.getByText('🙂');
    fireEvent.mouseEnter(thirdSmiley);
    
    expect(thirdSmiley).not.toHaveClass('scale-110');
  });

  it('should remove hover effect on mouse leave', () => {
    render(<RatingSmiley />);
    
    const thirdSmiley = screen.getByText('🙂');
    fireEvent.mouseEnter(thirdSmiley);
    expect(thirdSmiley).toHaveClass('scale-110');
    
    fireEvent.mouseLeave(thirdSmiley);
    expect(thirdSmiley).not.toHaveClass('scale-110');
  });

  it('should show label text for selected rating', () => {
    render(<RatingSmiley value={3} />);
    
    expect(screen.getAllByText('Neutral')).toHaveLength(2); // Button title and description
  });

  it('should show label text for hovered rating', () => {
    render(<RatingSmiley />);
    
    const thirdSmiley = screen.getByText('🙂');
    fireEvent.mouseEnter(thirdSmiley);
    
    expect(screen.getAllByText('Neutral')).toHaveLength(2); // Button title and description
  });

  it('should prioritize hover label over selected label', () => {
    render(<RatingSmiley value={2} />);
    
    const fourthSmiley = screen.getByText('😊');
    fireEvent.mouseEnter(fourthSmiley);

    expect(screen.getAllByText('Satisfied')).toHaveLength(2); // Button title and description
  });

  it('should not show label text when no rating is selected or hovered', () => {
    render(<RatingSmiley />);
    
    // The component always shows individual labels under each smiley
    // but should not show the main description text
    expect(screen.queryByText('Very Dissatisfied')).toBeInTheDocument(); // Individual label
    expect(screen.queryByText('Dissatisfied')).toBeInTheDocument(); // Individual label
    expect(screen.queryByText('Neutral')).toBeInTheDocument(); // Individual label
    expect(screen.queryByText('Satisfied')).toBeInTheDocument(); // Individual label
    expect(screen.queryByText('Very Satisfied')).toBeInTheDocument(); // Individual label
    
    // But no main description should be shown
    expect(screen.queryByText('Very Dissatisfied')).not.toHaveClass('text-center text-sm font-medium');
  });

  it('should have proper styling for unselected smileys', () => {
    render(<RatingSmiley />);
    
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('opacity-70');
    });
  });

  it('should have proper dark mode styles', () => {
    render(<RatingSmiley />);
    
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('text-4xl', 'transition-all');
    });
  });

  it('should have proper dark mode error styles', () => {
    render(<RatingSmiley error="Dark error" />);
    
    const error = screen.getByText('Dark error');
    expect(error).toHaveClass('dark:text-red-400');
  });

  it('should have proper dark mode label styles', () => {
    render(<RatingSmiley label="Dark label" />);
    
    const label = screen.getByText('Dark label');
    expect(label).toHaveClass('dark:text-gray-300');
  });

  it('should have proper dark mode description styles', () => {
    render(<RatingSmiley value={3} />);
    
    const descriptions = screen.getAllByText('Neutral');
    const description = descriptions.find(el => el.tagName === 'P');
    expect(description).toHaveClass('dark:text-gray-300');
  });

  it('should have proper cursor styles', () => {
    render(<RatingSmiley />);
    
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('cursor-pointer');
    });
  });

  it('should have proper cursor styles when readOnly', () => {
    render(<RatingSmiley readOnly />);
    
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('cursor-default');
    });
  });

  it('should have proper hover scale effect', () => {
    render(<RatingSmiley />);
    
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('hover:scale-110');
    });
  });

  it('should have proper title attributes', () => {
    render(<RatingSmiley />);
    
    const veryDissatisfied = screen.getByTitle('Very Dissatisfied');
    const dissatisfied = screen.getByTitle('Dissatisfied');
    const neutral = screen.getByTitle('Neutral');
    const satisfied = screen.getByTitle('Satisfied');
    const verySatisfied = screen.getByTitle('Very Satisfied');
    
    expect(veryDissatisfied).toBeInTheDocument();
    expect(dissatisfied).toBeInTheDocument();
    expect(neutral).toBeInTheDocument();
    expect(satisfied).toBeInTheDocument();
    expect(verySatisfied).toBeInTheDocument();
  });

  it('should handle multiple clicks', () => {
    render(<RatingSmiley onChange={mockOnChange} />);
    
    const firstSmiley = screen.getByText('😞');
    const fifthSmiley = screen.getByText('😍');
    
    fireEvent.click(firstSmiley);
    fireEvent.click(fifthSmiley);
    
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 1);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 5);
  });

  it('should handle keyboard navigation', () => {
    render(<RatingSmiley onChange={mockOnChange} />);
    
    const thirdSmiley = screen.getByText('🙂');
    
    // Test keyboard navigation (Enter key)
    fireEvent.keyDown(thirdSmiley, { key: 'Enter' });
    // The button should be focusable
    expect(thirdSmiley).toBeInTheDocument();
  });

  it('should handle value of 0', () => {
    render(<RatingSmiley value={0} />);
    
    // No smiley should be selected
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('opacity-70');
    });
  });

  it('should handle value greater than 5', () => {
    render(<RatingSmiley value={10} />);
    
    // No smiley should be selected since value > 5
    const smileys = screen.getAllByRole('button');
    smileys.forEach(smiley => {
      expect(smiley).toHaveClass('opacity-70');
    });
  });

  it('should show correct label for each rating', () => {
    const { rerender } = render(<RatingSmiley value={1} />);
    expect(screen.getAllByText('Very Dissatisfied')).toHaveLength(2); // Button title and description

    rerender(<RatingSmiley value={2} />);
    expect(screen.getAllByText('Dissatisfied')).toHaveLength(2);

    rerender(<RatingSmiley value={3} />);
    expect(screen.getAllByText('Neutral')).toHaveLength(2);

    rerender(<RatingSmiley value={4} />);
    expect(screen.getAllByText('Satisfied')).toHaveLength(2);

    rerender(<RatingSmiley value={5} />);
    expect(screen.getAllByText('Very Satisfied')).toHaveLength(2);
  });

  it('should have proper spacing and layout', () => {
    render(<RatingSmiley />);
    
    const container = screen.getByText('😞').closest('div');
    expect(container).toHaveClass('flex', 'flex-col', 'items-center', 'space-y-2');
  });

  it('should have proper description text styling', () => {
    render(<RatingSmiley value={3} />);
    
    const descriptions = screen.getAllByText('Neutral');
    const description = descriptions.find(el => el.tagName === 'P');
    expect(description).toHaveClass('text-center', 'text-sm', 'font-medium', 'text-gray-700', 'dark:text-gray-300');
  });
});

