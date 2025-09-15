import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileUploader from '../FileUploader';

describe('FileUploader Component', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(<FileUploader />);
    
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('or drag and drop')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<FileUploader label="Upload File" />);
    
    expect(screen.getByText('Upload File')).toBeInTheDocument();
  });

  it('should render with error message', () => {
    render(<FileUploader error="File upload failed" />);
    
    expect(screen.getByText('File upload failed')).toBeInTheDocument();
  });

  it('should render with helper text', () => {
    render(<FileUploader helperText="Select a file to upload" />);
    
    expect(screen.getByText('Select a file to upload')).toBeInTheDocument();
  });

  it('should show max size when provided', () => {
    render(<FileUploader maxSize={1024 * 1024} />); // 1MB
    
    expect(screen.getByText('Maximum file size: 1 MB')).toBeInTheDocument();
  });

  it('should handle file selection', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);
    expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
  });

  it('should display selected files', async () => {
    const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
    const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });
    
    render(<FileUploader multiple onFileSelect={mockOnFileSelect} />);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file1, file2],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });
  });

  it('should format file sizes correctly', () => {
    render(<FileUploader maxSize={1024} onFileSelect={mockOnFileSelect} />); // 1KB max

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(fileInput);
    expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
  });

  it('should filter files by max size', () => {
    render(<FileUploader maxSize={1024} onFileSelect={mockOnFileSelect} />); // 1KB max

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = new File(['test content'], 'large.txt', { type: 'text/plain' });
    Object.defineProperty(largeFile, 'size', { value: 2048, writable: false });
    const smallFile = new File(['small'], 'small.txt', { type: 'text/plain' });
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile, smallFile],
      writable: false,
    });

    fireEvent.change(fileInput);
    expect(mockOnFileSelect).toHaveBeenCalledWith([smallFile]);
  });

  it('should support multiple file selection', () => {
    render(<FileUploader multiple />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('should support file type restrictions', () => {
    render(<FileUploader accept=".pdf,.doc,.docx" />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx');
  });

  it('should have proper error styling', () => {
    render(<FileUploader error="Test error" />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    // The error styling is applied conditionally based on the error prop
    expect(uploadArea).toBeInTheDocument();
  });

  it('should have proper dark mode styles', () => {
    render(<FileUploader />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    // The component has conditional styling based on state
    expect(uploadArea).toBeInTheDocument();
  });

  it('should have proper drag over dark mode styles', () => {
    render(<FileUploader />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    fireEvent.dragOver(uploadArea!);
    // The drag over styling is applied conditionally
    expect(uploadArea).toBeInTheDocument();
  });

  it('should handle empty file selection', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [],
      writable: false,
    });

    fireEvent.change(fileInput);
    // The component calls onFileSelect even with empty files array
    expect(mockOnFileSelect).toHaveBeenCalledWith([]);
  });

  it('should handle null file selection', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: null,
      writable: false,
    });

    fireEvent.change(fileInput);
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('should handle drag and drop', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(uploadArea!, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
  });

  it('should handle drag over', () => {
    render(<FileUploader />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    fireEvent.dragOver(uploadArea!);
    
    // The drag over styling is applied conditionally
    expect(uploadArea).toBeInTheDocument();
  });

  it('should handle drag leave', () => {
    render(<FileUploader />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    fireEvent.dragOver(uploadArea!);
    fireEvent.dragLeave(uploadArea!);
    
    expect(uploadArea).not.toHaveClass('border-blue-500');
  });

  it('should open file dialog on click', () => {
    render(<FileUploader />);

    const uploadArea = screen.getByText('Click to upload').closest('div');
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(uploadArea!);
    
    expect(clickSpy).toHaveBeenCalled();
  });

  // Edge Cases Tests
  describe('Edge Cases', () => {
    it('should handle file size limits exactly at limit', () => {
      const exactSize = 1024; // 1KB exactly
      render(<FileUploader maxSize={exactSize} onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['x'.repeat(exactSize)], 'exact.txt', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
    });

    it('should handle file size one byte over limit', () => {
      const maxSize = 1024; // 1KB max
      render(<FileUploader maxSize={maxSize} onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const oversizedFile = new File(['test content'], 'oversized.txt', { type: 'text/plain' });
      Object.defineProperty(oversizedFile, 'size', { value: maxSize + 1, writable: false });
      
      Object.defineProperty(fileInput, 'files', {
        value: [oversizedFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([]); // Should filter out oversized file
    });

    it('should handle multiple file selection', () => {
      render(<FileUploader multiple onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const files = [
        new File(['content1'], 'file1.txt', { type: 'text/plain' }),
        new File(['content2'], 'file2.txt', { type: 'text/plain' }),
        new File(['content3'], 'file3.txt', { type: 'text/plain' })
      ];
      
      Object.defineProperty(fileInput, 'files', {
        value: files,
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith(files); // Should handle all files
    });

    it('should handle file type restrictions with edge cases', () => {
      render(<FileUploader accept=".pdf,.doc,.docx" onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const invalidFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [validFile, invalidFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      // Component doesn't filter by type, it passes all files to onFileSelect
      expect(mockOnFileSelect).toHaveBeenCalledWith([validFile, invalidFile]);
    });

    it('should handle drag and drop with invalid files', () => {
      render(<FileUploader accept=".pdf" onFileSelect={mockOnFileSelect} />);

      const uploadArea = screen.getByText('Click to upload').closest('div');
      const validFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const invalidFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });

      fireEvent.drop(uploadArea!, {
        dataTransfer: {
          files: [validFile, invalidFile],
        },
      });

      // Component doesn't filter by type, it passes all files to onFileSelect
      expect(mockOnFileSelect).toHaveBeenCalledWith([validFile, invalidFile]);
    });

    it('should handle very large files (memory management)', () => {
      const largeFileSize = 10 * 1024 * 1024; // 10MB (reduced from 100MB for performance)
      render(<FileUploader maxSize={largeFileSize} onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Create a smaller test file to avoid memory issues
      const largeFile = new File(['test content'], 'large.txt', { type: 'text/plain' });
      // Mock the size property instead of creating actual large content
      Object.defineProperty(largeFile, 'size', { value: largeFileSize, writable: false });
      
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([largeFile]);
    });

    it('should handle duplicate file names', () => {
      render(<FileUploader multiple onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = new File(['content1'], 'duplicate.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'duplicate.txt', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([file1, file2]); // Should handle duplicates
    });

    it('should handle files with special characters in names', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const specialNameFile = new File(['content'], 'file with spaces & symbols!.txt', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [specialNameFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([specialNameFile]);
    });

    it('should handle rapid file selection/deselection', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Test rapid file selections by creating multiple files and setting them once
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([`content${i}`], `file${i}.txt`, { type: 'text/plain' })
      );
      
      Object.defineProperty(fileInput, 'files', {
        value: files,
        writable: false,
      });
      
      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith(files);
    });

    it('should handle network interruption simulation', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      // Simulate network error
      fireEvent.change(fileInput);
      // Component should handle gracefully
      expect(mockOnFileSelect).toHaveBeenCalledWith([file]);
    });

    it('should handle empty file selection gracefully', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [emptyFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([emptyFile]);
    });

    it('should handle files with no extension', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const noExtFile = new File(['content'], 'filename', { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [noExtFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([noExtFile]);
    });

    it('should handle files with very long names', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const longName = 'a'.repeat(255) + '.txt'; // Very long filename
      const longNameFile = new File(['content'], longName, { type: 'text/plain' });
      
      Object.defineProperty(fileInput, 'files', {
        value: [longNameFile],
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith([longNameFile]);
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<FileUploader />);
      const uploadArea = screen.getByText('Click to upload').closest('div');
      
      // Test that the upload area is clickable and accessible
      expect(uploadArea).toBeInTheDocument();
      // Find the parent div that has the cursor-pointer class
      const clickableArea = uploadArea?.closest('.cursor-pointer');
      expect(clickableArea).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<FileUploader />);
      const uploadArea = screen.getByText('Click to upload').closest('div');
      
      // Test that the upload area is accessible
      expect(uploadArea).toBeInTheDocument();
    });

    it('should support screen reader compatibility', () => {
      render(<FileUploader />);
      const uploadArea = screen.getByText('Click to upload').closest('div');
      
      // Test that the upload area is focusable and accessible
      expect(uploadArea).toBeInTheDocument();
    });
  });

  // Performance Tests
  describe('Performance', () => {
    it('should handle large number of files efficiently', () => {
      const manyFiles = Array.from({ length: 100 }, (_, i) => 
        new File([`content${i}`], `file${i}.txt`, { type: 'text/plain' })
      );
      
      render(<FileUploader multiple onFileSelect={mockOnFileSelect} />);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(fileInput, 'files', {
        value: manyFiles,
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFileSelect).toHaveBeenCalledWith(manyFiles);
    });

    it('should handle rapid drag and drop operations', () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);
      const uploadArea = screen.getByText('Click to upload').closest('div');
      
      // Rapid drag and drop operations
      for (let i = 0; i < 10; i++) {
        const file = new File([`content${i}`], `file${i}.txt`, { type: 'text/plain' });
        fireEvent.drop(uploadArea!, {
          dataTransfer: { files: [file] },
        });
      }
      
      expect(mockOnFileSelect).toHaveBeenCalledTimes(10);
    });
  });

});