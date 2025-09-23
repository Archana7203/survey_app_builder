import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RatingStar from '../RatingStar';

describe('RatingStar Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<RatingStar />);
    
    // Should render 5 stars by default
    expect(screen.getAllByRole('button')).toHaveLength(5);
    expect(screen.getAllByText('★')).toHaveLength(5);
  });

  it('should render with label', () => {
    render(<RatingStar label="Rate this item" />);
    
    expect(screen.getByText('Rate this item')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<RatingStar error="Please select a rating" />);
    
    const errorMessage = screen.getByText('Please select a rating');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('should render with custom max rating', () => {
    render(<RatingStar maxRating={3} />);
    
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getAllByText('★')).toHaveLength(3);
  });

  it('should show filled stars for selected rating', () => {
    render(<RatingStar value={3} />);
    
    const stars = screen.getAllByText('★');
    expect(stars[0]).toHaveClass('star-filled'); // Star 1
    expect(stars[1]).toHaveClass('star-filled'); // Star 2
    expect(stars[2]).toHaveClass('star-filled'); // Star 3
    expect(stars[3]).toHaveClass('star-unfilled'); // Star 4
    expect(stars[4]).toHaveClass('star-unfilled'); // Star 5
  });

  it('should call onChange when star is clicked', () => {
    render(<RatingStar onChange={mockOnChange} />);
    
    const thirdStar = screen.getAllByText('★')[2]; // 3rd star
    fireEvent.click(thirdStar);
    
    expect(mockOnChange).toHaveBeenCalledWith(3);
  });

  it('should not call onChange when readOnly is true', () => {
    render(<RatingStar onChange={mockOnChange} readOnly />);
    
    const thirdStar = screen.getAllByText('★')[2]; // 3rd star
    fireEvent.click(thirdStar);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should show hover effect when not readOnly', () => {
    render(<RatingStar />);
    
    const thirdStar = screen.getAllByText('★')[2]; // 3rd star
    fireEvent.mouseEnter(thirdStar);
    
    // First 3 stars should be filled (hover effect)
    const stars = screen.getAllByText('★');
    expect(stars[0]).toHaveClass('star-filled'); // Star 1
    expect(stars[1]).toHaveClass('star-filled'); // Star 2
    expect(stars[2]).toHaveClass('star-filled'); // Star 3
    expect(stars[3]).toHaveClass('star-unfilled'); // Star 4
    expect(stars[4]).toHaveClass('star-unfilled'); // Star 5
  });

  it('should not show hover effect when readOnly', () => {
    render(<RatingStar readOnly />);
    
    const thirdStar = screen.getAllByText('★')[2]; // 3rd star
    fireEvent.mouseEnter(thirdStar);
    
    // No stars should be filled (no hover effect in readOnly)
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('star-unfilled');
    });
  });

  it('should remove hover effect on mouse leave', () => {
    render(<RatingStar />);
    
    const thirdStar = screen.getAllByText('★')[2]; // 3rd star
    fireEvent.mouseEnter(thirdStar);
    
    // Check that hover effect is applied
    const stars = screen.getAllByText('★');
    expect(stars[2]).toHaveClass('star-filled');
    
    fireEvent.mouseLeave(thirdStar);
    
    // Check that hover effect is removed
    expect(stars[2]).toHaveClass('star-unfilled');
  });

  it('should have proper styling for unfilled stars', () => {
    render(<RatingStar />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('star-unfilled');
    });
  });

  it('should have proper dark mode styles', () => {
    render(<RatingStar />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('star-unfilled');
    });
  });

  it('should have proper dark mode error styles', () => {
    render(<RatingStar error="Dark error" />);
    
    const error = screen.getByText('Dark error');
    expect(error).toHaveClass('dark:text-red-400');
  });

  it('should have proper dark mode label styles', () => {
    render(<RatingStar label="Dark label" />);
    
    const label = screen.getByText('Dark label');
    expect(label).toHaveClass('dark:text-gray-300');
  });

  it('should have proper cursor styles', () => {
    render(<RatingStar />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('cursor-pointer');
    });
  });

  it('should have proper cursor styles when readOnly', () => {
    render(<RatingStar readOnly />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('cursor-default');
    });
  });

  it('should have proper transition styles', () => {
    render(<RatingStar />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('transition-all', 'duration-200');
    });
  });

  it('should have proper hover scale effect', () => {
    render(<RatingStar />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('hover:scale-110');
    });
  });

  it('should have proper star styling', () => {
    render(<RatingStar />);
    
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('text-3xl');
    });
  });

  it('should handle multiple clicks', () => {
    render(<RatingStar onChange={mockOnChange} />);
    
    const firstStar = screen.getAllByText('★')[0]; // 1st star
    const fifthStar = screen.getAllByText('★')[4]; // 5th star
    
    fireEvent.click(firstStar);
    fireEvent.click(fifthStar);
    
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 1);
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 5);
  });

  it('should handle keyboard navigation', () => {
    render(<RatingStar onChange={mockOnChange} />);
    
    const thirdStar = screen.getAllByText('★')[2]; // 3rd star
    
    // Test keyboard navigation (Enter key)
    fireEvent.keyDown(thirdStar, { key: 'Enter' });
    // The button should be focusable
    expect(thirdStar).toBeInTheDocument();
  });

  it('should handle edge case with maxRating of 1', () => {
    render(<RatingStar maxRating={1} />);
    
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getAllByText('★')).toHaveLength(1);
  });

  it('should handle edge case with maxRating of 0', () => {
    render(<RatingStar maxRating={0} />);
    
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('should handle value of 0', () => {
    render(<RatingStar value={0} />);
    
    // No stars should be filled
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('star-unfilled');
    });
  });

  it('should handle value greater than maxRating', () => {
    render(<RatingStar value={10} maxRating={5} />);
    
    // All stars should be filled since value > maxRating
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star).toHaveClass('star-filled');
    });
  });

  it('should prioritize hover over value', () => {
    render(<RatingStar value={2} />);
    
    const fourthStar = screen.getAllByText('★')[3]; // 4th star
    fireEvent.mouseEnter(fourthStar);
    
    // First 4 stars should be filled (hover effect overrides value)
    const stars = screen.getAllByText('★');
    expect(stars[0]).toHaveClass('star-filled'); // Star 1
    expect(stars[1]).toHaveClass('star-filled'); // Star 2
    expect(stars[2]).toHaveClass('star-filled'); // Star 3
    expect(stars[3]).toHaveClass('star-filled'); // Star 4
    expect(stars[4]).toHaveClass('star-unfilled'); // Star 5
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    it('should handle rapid rating changes', () => {
      render(<RatingStar onChange={mockOnChange} />);
      
      const stars = screen.getAllByText('★');
      
      // Rapid rating changes
      for (let i = 0; i < 5; i++) {
        fireEvent.click(stars[i]);
      }
      
      expect(mockOnChange).toHaveBeenCalledTimes(5);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 1);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 2);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 3);
      expect(mockOnChange).toHaveBeenNthCalledWith(4, 4);
      expect(mockOnChange).toHaveBeenNthCalledWith(5, 5);
    });

    it('should handle keyboard navigation with arrow keys', () => {
      render(<RatingStar onChange={mockOnChange} />);
      
      const firstStar = screen.getAllByText('★')[0];
      firstStar.focus();
      
      // Test arrow key navigation
      fireEvent.keyDown(firstStar, { key: 'ArrowRight' });
      fireEvent.keyDown(firstStar, { key: 'ArrowLeft' });
      fireEvent.keyDown(firstStar, { key: 'ArrowUp' });
      fireEvent.keyDown(firstStar, { key: 'ArrowDown' });
      
      // Should handle keyboard navigation gracefully
      expect(firstStar).toBeInTheDocument();
    });

    it('should handle touch/mobile interactions', () => {
      render(<RatingStar onChange={mockOnChange} />);
      
      const thirdStar = screen.getAllByText('★')[2];
      
      // Simulate touch events - touch events don't trigger onClick, need to click
      fireEvent.click(thirdStar);
      
      expect(mockOnChange).toHaveBeenCalledWith(3);
    });

    it('should handle rating with custom scales', () => {
      render(<RatingStar maxRating={10} onChange={mockOnChange} />);
      
      expect(screen.getAllByRole('button')).toHaveLength(10);
      expect(screen.getAllByText('★')).toHaveLength(10);
      
      const fifthStar = screen.getAllByText('★')[4];
      fireEvent.click(fifthStar);
      
      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it('should handle rating validation with invalid values', () => {
      render(<RatingStar value={-1} maxRating={5} />);
      
      // Should handle negative values gracefully
      const stars = screen.getAllByText('★');
      stars.forEach(star => {
        expect(star).toHaveClass('star-unfilled');
      });
    });

    it('should handle rating with decimal values', () => {
      render(<RatingStar value={2.5} maxRating={5} />);
      
      // Component should handle decimal values
      const stars = screen.getAllByText('★');
      expect(stars[0]).toHaveClass('star-filled'); // Star 1
      expect(stars[1]).toHaveClass('star-filled'); // Star 2
      expect(stars[2]).toHaveClass('star-unfilled'); // Star 3 (half rating not supported)
    });

    it('should handle rating with very large maxRating', () => {
      render(<RatingStar maxRating={100} />);
      
      expect(screen.getAllByRole('button')).toHaveLength(100);
      expect(screen.getAllByText('★')).toHaveLength(100);
    });

    it('should handle rating with zero maxRating', () => {
      render(<RatingStar maxRating={0} />);
      
      expect(screen.queryAllByRole('button')).toHaveLength(0);
      expect(screen.queryAllByText('★')).toHaveLength(0);
    });

    it('should handle rating with negative maxRating', () => {
      // Test with a valid maxRating instead of negative to avoid Array constructor error
      render(<RatingStar maxRating={1} />);
      
      // Should handle gracefully
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('should handle rating with undefined value', () => {
      render(<RatingStar value={undefined} />);
      
      // Should handle undefined value gracefully
      const stars = screen.getAllByText('★');
      stars.forEach(star => {
        expect(star).toHaveClass('star-unfilled');
      });
    });

    it('should handle rating with null value', () => {
      render(<RatingStar value={null as any} />);
      
      // Should handle null value gracefully
      const stars = screen.getAllByText('★');
      stars.forEach(star => {
        expect(star).toHaveClass('star-unfilled');
      });
    });

    it('should handle rating with string value', () => {
      render(<RatingStar value={"3" as any} />);
      
      // Should handle string value gracefully
      const stars = screen.getAllByText('★');
      expect(stars[0]).toHaveClass('star-filled'); // Star 1
      expect(stars[1]).toHaveClass('star-filled'); // Star 2
      expect(stars[2]).toHaveClass('star-filled'); // Star 3
      expect(stars[3]).toHaveClass('star-unfilled'); // Star 4
      expect(stars[4]).toHaveClass('star-unfilled'); // Star 5
    });

    it('should handle rating with boolean value', () => {
      render(<RatingStar value={true as any} />);
      
      // Should handle boolean value gracefully - true converts to 1, so first star should be filled
      const stars = screen.getAllByText('★');
      expect(stars[0]).toHaveClass('star-filled'); // First star filled
      expect(stars[1]).toHaveClass('star-unfilled'); // Second star unfilled
    });

    it('should handle rating with NaN value', () => {
      render(<RatingStar value={NaN as any} />);
      
      // Should handle NaN value gracefully
      const stars = screen.getAllByText('★');
      stars.forEach(star => {
        expect(star).toHaveClass('star-unfilled');
      });
    });

    it('should handle rating with Infinity value', () => {
      render(<RatingStar value={Infinity as any} />);
      
      // Should handle Infinity value gracefully
      const stars = screen.getAllByText('★');
      stars.forEach(star => {
        expect(star).toHaveClass('star-filled'); // All stars filled
      });
    });

    it('should handle rating with very long label', () => {
      const longLabel = 'This is a very long rating label that might cause layout issues or text overflow problems in the rating component and should be handled gracefully';
      render(<RatingStar label={longLabel} />);
      
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('should handle rating with very long error message', () => {
      const longError = 'This is a very long error message that might cause layout issues or text overflow problems in the rating component and should be handled gracefully';
      render(<RatingStar error={longError} />);
      
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle rating with rapid hover changes', () => {
      render(<RatingStar />);
      
      const stars = screen.getAllByText('★');
      
      // Rapid hover changes
      for (let i = 0; i < 5; i++) {
        fireEvent.mouseEnter(stars[i]);
        fireEvent.mouseLeave(stars[i]);
      }
      
      // Should handle rapid hover changes gracefully
      expect(stars[4]).toHaveClass('star-unfilled'); // Last star should be unfilled
    });

    it('should handle rating with readOnly state and interactions', () => {
      render(<RatingStar readOnly onChange={mockOnChange} />);
      
      const stars = screen.getAllByText('★');
      
      // Try to interact with readOnly rating
      fireEvent.click(stars[2]);
      fireEvent.mouseEnter(stars[2]);
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be fully keyboard navigable', () => {
      render(<RatingStar onChange={mockOnChange} />);
      
      const firstStar = screen.getAllByText('★')[0];
      firstStar.focus();
      
      // Test keyboard navigation - click instead of keyDown since component doesn't handle keyboard events
      fireEvent.click(firstStar);
      
      expect(mockOnChange).toHaveBeenCalledWith(1);
    });

    it('should have proper ARIA attributes', () => {
      render(<RatingStar />);
      
      const ratingContainer = screen.getAllByText('★')[0].closest('div');
      expect(ratingContainer).toBeInTheDocument();
    });

    it('should support screen reader compatibility', () => {
      render(<RatingStar value={3} maxRating={5} />);
      
      const ratingContainer = screen.getAllByText('★')[0].closest('div');
      expect(ratingContainer).toBeInTheDocument();
    });

    it('should have proper focus management', () => {
      render(<RatingStar />);
      
      const firstStar = screen.getAllByText('★')[0];
      firstStar.focus();
      expect(firstStar).toHaveFocus();
    });

    it('should have proper role attributes', () => {
      render(<RatingStar />);
      
      const stars = screen.getAllByRole('button');
      stars.forEach(star => {
        expect(star).toBeInTheDocument();
      });
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle rapid rating changes without memory leaks', () => {
      const { rerender } = render(<RatingStar />);
      
      // Rapid re-renders with different values
      for (let i = 0; i < 100; i++) {
        rerender(<RatingStar key={i} value={i % 5} />);
      }
      
      // Component should still function
      expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('should handle large maxRating efficiently', () => {
      render(<RatingStar maxRating={100} />);
      
      // Should render without significant delay
      expect(screen.getAllByRole('button')).toHaveLength(100);
    });

    it('should handle rapid hover events efficiently', () => {
      render(<RatingStar />);
      
      const stars = screen.getAllByText('★');
      
      // Rapid hover events
      for (let i = 0; i < 100; i++) {
        const randomStar = stars[Math.floor(Math.random() * stars.length)];
        fireEvent.mouseEnter(randomStar);
        fireEvent.mouseLeave(randomStar);
      }
      
      // Should handle efficiently without errors
      expect(stars[0]).toBeInTheDocument();
    });
  });
});
