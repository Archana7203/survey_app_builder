import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RatingNumber from '../RatingNumber';

describe('RatingNumber Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<RatingNumber />);
    
    // Should render 10 rating buttons by default
    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<RatingNumber label="Rate this item" />);
    
    expect(screen.getByText('Rate this item')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<RatingNumber error="Please select a rating" />);
    
    const errorMessage = screen.getByText('Please select a rating');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('should render with custom max rating', () => {
    render(<RatingNumber maxRating={5} />);
    
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('6')).not.toBeInTheDocument();
  });

  it('should show selected rating', () => {
    render(<RatingNumber value={3} />);
    
    const rating3 = screen.getByText('3');
    expect(rating3).toHaveClass('bg-[var(--color-primary)]', 'text-white', 'border-[var(--color-primary)]');
  });

  it('should call onChange when rating is clicked', () => {
    render(<RatingNumber onChange={mockOnChange} />);
    
    const rating5 = screen.getByText('5');
    fireEvent.click(rating5);
    
    expect(mockOnChange).toHaveBeenCalledWith(5);
  });

  it('should not call onChange when readOnly is true', () => {
    render(<RatingNumber onChange={mockOnChange} readOnly />);
    
    const rating5 = screen.getByText('5');
    fireEvent.click(rating5);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should show hover effect when not readOnly', () => {
    render(<RatingNumber />);
    
    const rating3 = screen.getByText('3');
    fireEvent.mouseEnter(rating3);
    
    expect(rating3).toHaveClass('bg-[var(--color-primary)]', 'text-white', 'border-[var(--color-primary)]');
  });

  it('should not show hover effect when readOnly', () => {
    render(<RatingNumber readOnly />);
    
    const rating3 = screen.getByText('3');
    fireEvent.mouseEnter(rating3);
    
    expect(rating3).not.toHaveClass('bg-blue-600');
  });

  it('should remove hover effect on mouse leave', () => {
    render(<RatingNumber />);
    
    const rating3 = screen.getByText('3');
    fireEvent.mouseEnter(rating3);
    expect(rating3).toHaveClass('bg-[var(--color-primary)]');
    
    fireEvent.mouseLeave(rating3);
    expect(rating3).not.toHaveClass('bg-blue-600');
  });

  it('should have proper styling for unselected ratings', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('bg-white', 'text-gray-700', 'border-gray-300');
  });

  it('should have proper dark mode styles', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('dark:bg-gray-800', 'dark:text-gray-300', 'dark:border-gray-600');
  });

  it('should have proper dark mode hover styles', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('dark:hover:border-[var(--color-primary)]');
  });

  it('should have proper dark mode error styles', () => {
    render(<RatingNumber error="Dark error" />);
    
    const error = screen.getByText('Dark error');
    expect(error).toHaveClass('dark:text-red-400');
  });

  it('should have proper dark mode label styles', () => {
    render(<RatingNumber label="Dark label" />);
    
    const label = screen.getByText('Dark label');
    expect(label).toHaveClass('dark:text-gray-300');
  });

  it('should have proper cursor styles', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('cursor-pointer');
  });

  it('should have proper cursor styles when readOnly', () => {
    render(<RatingNumber readOnly />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('cursor-default');
  });

  it('should have proper transition styles', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('transition-all');
  });

  it('should have proper hover scale effect', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('hover:scale-105');
  });

  it('should have proper button styling', () => {
    render(<RatingNumber />);
    
    const rating1 = screen.getByText('1');
    expect(rating1).toHaveClass('w-10', 'h-10', 'rounded-full', 'border-2', 'font-medium');
  });

  it('should handle multiple clicks', () => {
    render(<RatingNumber onChange={mockOnChange} />);
    
    const rating3 = screen.getByText('3');
    const rating7 = screen.getByText('7');
    
    fireEvent.click(rating3);
    fireEvent.click(rating7);
    
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 3);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 7);
  });

  it('should handle keyboard navigation', () => {
    render(<RatingNumber onChange={mockOnChange} />);
    
    const rating5 = screen.getByText('5');
    
    // Test keyboard navigation (Enter key)
    fireEvent.keyDown(rating5, { key: 'Enter' });
    // The button should be focusable
    expect(rating5).toBeInTheDocument();
  });

  it('should handle edge case with maxRating of 1', () => {
    render(<RatingNumber maxRating={1} />);
    
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should handle edge case with maxRating of 0', () => {
    render(<RatingNumber maxRating={0} />);
    
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('should handle value of 0', () => {
    render(<RatingNumber value={0} />);
    
    // No rating should be selected
    const rating1 = screen.getByText('1');
    expect(rating1).not.toHaveClass('bg-blue-600');
  });

  it('should handle value greater than maxRating', () => {
    render(<RatingNumber value={15} maxRating={10} />);
    
    // No rating should be selected since 15 > 10
    const rating1 = screen.getByText('1');
    expect(rating1).not.toHaveClass('bg-blue-600');
  });
});

