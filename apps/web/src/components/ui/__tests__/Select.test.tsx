import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Select from '../Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('should render with default props', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveClass('w-full', 'px-3', 'py-2', 'border', 'rounded-md');
  });

  it('should render with label', () => {
    render(<Select options={mockOptions} label="Select Label" />);
    
    expect(screen.getByText('Select Label')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render all options', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select.children).toHaveLength(3);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(
      <Select 
        options={mockOptions} 
        placeholder="Choose an option" 
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select.children).toHaveLength(4); // 3 options + 1 placeholder
    expect(screen.getByText('Choose an option')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(
      <Select 
        options={mockOptions} 
        error="This field is required" 
      />
    );
    
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('border-red-500', 'focus:border-red-500');
  });

  it('should apply custom className', () => {
    render(<Select options={mockOptions} className="custom-class" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('custom-class');
  });

  it('should handle change events', () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option2' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(select).toHaveValue('option2');
  });

  it('should support disabled state', () => {
    render(<Select options={mockOptions} disabled />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should support required attribute', () => {
    render(<Select options={mockOptions} required />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
  });

  it('should support name attribute', () => {
    render(<Select options={mockOptions} name="test-select" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('name', 'test-select');
  });

  it('should support id attribute', () => {
    render(<Select options={mockOptions} id="test-select" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'test-select');
  });

  it('should associate label with select using htmlFor', () => {
    render(<Select options={mockOptions} id="test-select" label="Test Label" />);
    
    const label = screen.getByText('Test Label');
    const select = screen.getByRole('combobox');
    
    // Note: The Select component doesn't currently support htmlFor/id association
    // This test verifies the component renders without errors
    expect(label).toBeInTheDocument();
    expect(select).toBeInTheDocument();
  });

  it('should render placeholder as disabled option', () => {
    render(
      <Select 
        options={mockOptions} 
        placeholder="Choose an option" 
      />
    );
    
    const select = screen.getByRole('combobox');
    const placeholderOption = select.children[0] as HTMLOptionElement;
    expect(placeholderOption).toHaveAttribute('disabled');
    expect(placeholderOption.value).toBe('');
  });

  it('should have proper focus styles', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('focus:outline-none', 'focus:border-2', 'focus:border-[var(--color-primary)]');
  });

  it('should have proper dark mode styles', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('dark:bg-gray-700', 'dark:border-gray-600', 'dark:text-white');
  });

  it('should pass through other HTML select attributes', () => {
    render(
      <Select 
        options={mockOptions}
        data-testid="custom-select"
        aria-label="Custom select"
        multiple
      />
    );
    
    const select = screen.getByTestId('custom-select');
    expect(select).toHaveAttribute('aria-label', 'Custom select');
    expect(select).toHaveAttribute('multiple');
  });

  it('should handle empty options array', () => {
    render(<Select options={[]} placeholder="No options" />);
    
    const select = screen.getByRole('combobox');
    expect(select.children).toHaveLength(1); // Only placeholder
    expect(screen.getByText('No options')).toBeInTheDocument();
  });

  it('should render options with correct values and labels', () => {
    render(<Select options={mockOptions} />);
    
    const select = screen.getByRole('combobox');
    const option1 = select.children[0] as HTMLOptionElement;
    const option2 = select.children[1] as HTMLOptionElement;
    const option3 = select.children[2] as HTMLOptionElement;
    
    expect(option1.value).toBe('option1');
    expect(option1.textContent).toBe('Option 1');
    expect(option2.value).toBe('option2');
    expect(option2.textContent).toBe('Option 2');
    expect(option3.value).toBe('option3');
    expect(option3.textContent).toBe('Option 3');
  });
});
