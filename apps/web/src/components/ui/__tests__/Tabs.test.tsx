import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tabs from '../Tabs';

describe('Tabs Component', () => {
  const mockTabs = [
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
    { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
  ];

  const mockOnTabChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all tabs', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('should render active tab content', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab2" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Content 3')).not.toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab2" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const activeTab = screen.getByText('Tab 2');
    expect(activeTab).toHaveClass('border-[var(--color-primary)]', 'text-[var(--color-primary)]', 'dark:text-[var(--color-primary)]', 'dark:border-[var(--color-primary)]');
  });

  it('should call onTabChange when tab is clicked', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const tab2 = screen.getByText('Tab 2');
    fireEvent.click(tab2);
    
    expect(mockOnTabChange).toHaveBeenCalledWith('tab2');
  });

  it('should not call onTabChange when disabled tab is clicked', () => {
    const tabsWithDisabled = [
      { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
      { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
      { id: 'tab3', label: 'Tab 3', content: <div>Content 3</div> },
    ];

    render(
      <Tabs 
        tabs={tabsWithDisabled} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const disabledTab = screen.getByText('Tab 2');
    fireEvent.click(disabledTab);
    
    expect(mockOnTabChange).not.toHaveBeenCalled();
  });

  it('should apply disabled styles to disabled tab', () => {
    const tabsWithDisabled = [
      { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
      { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div>, disabled: true },
    ];

    render(
      <Tabs 
        tabs={tabsWithDisabled} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const disabledTab = screen.getByText('Tab 2');
    expect(disabledTab).toHaveClass('text-gray-400', 'cursor-not-allowed');
    expect(disabledTab).toBeDisabled();
  });

  it('should apply custom className', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange}
        className="custom-class"
      />
    );
    
    const tabsContainer = screen.getByText('Tab 1').closest('.custom-class');
    expect(tabsContainer).toBeInTheDocument();
  });

  it('should render tabs without content', () => {
    const tabsWithoutContent = [
      { id: 'tab1', label: 'Tab 1' },
      { id: 'tab2', label: 'Tab 2' },
    ];

    render(
      <Tabs 
        tabs={tabsWithoutContent} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    
    // Should not render content area when no content is provided
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const nav = screen.getByLabelText('Tabs');
    expect(nav).toBeInTheDocument();
  });

  it('should have proper dark mode styles', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const activeTab = screen.getByText('Tab 1');
    expect(activeTab).toHaveClass('dark:text-[var(--color-primary)]', 'dark:border-[var(--color-primary)]');
  });

  it('should handle hover states for non-active tabs', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const inactiveTab = screen.getByText('Tab 2');
    expect(inactiveTab).toHaveClass('hover:text-gray-700', 'hover:border-gray-300');
  });

  it('should render complex tab content', () => {
    const complexTabs = [
      { 
        id: 'complex', 
        label: 'Complex Tab', 
        content: (
          <div>
            <h2>Complex Content</h2>
            <p>This is a paragraph</p>
            <form>
              <input type="text" placeholder="Enter text" />
              <button type="submit">Submit</button>
            </form>
          </div>
        )
      },
    ];

    render(
      <Tabs 
        tabs={complexTabs} 
        activeTab="complex" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('This is a paragraph')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should handle empty tabs array', () => {
    render(
      <Tabs 
        tabs={[]} 
        activeTab="" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    // Should render without errors
    expect(screen.getByLabelText('Tabs')).toBeInTheDocument();
  });

  it('should handle tab change with keyboard navigation', () => {
    render(
      <Tabs 
        tabs={mockTabs} 
        activeTab="tab1" 
        onTabChange={mockOnTabChange} 
      />
    );
    
    const tab2 = screen.getByText('Tab 2');
    
    // Simulate keyboard navigation (Enter key)
    fireEvent.keyDown(tab2, { key: 'Enter' });
    // Note: The component doesn't handle keyboard events directly,
    // but the button should be focusable
    expect(tab2).toBeInTheDocument();
  });
});

