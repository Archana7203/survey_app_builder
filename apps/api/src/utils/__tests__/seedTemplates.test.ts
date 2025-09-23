import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Template } from '../../models/Template';
import { seedTemplates, reseedTemplates } from '../seedTemplates';

// Mock Template model
vi.mock('../../models/Template', () => ({
  Template: {
    insertMany: vi.fn(),
    countDocuments: vi.fn(),
    updateOne: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

// Mock fs and path modules
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => JSON.stringify([
    {
      id: 'template-1',
      title: 'Test Template',
      description: 'A test template',
      category: 'Test',
      thumbnail: 'test.jpg',
      estimatedTime: '5 minutes',
      pages: [{ questions: [] }]
    }
  ])),
}));

vi.mock('path', () => ({
  join: vi.fn(() => '/path/to/templates.json'),
}));

describe('Seed Templates Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('seedTemplates', () => {
    it('should seed templates when database is empty', async () => {
      vi.mocked(Template.countDocuments).mockResolvedValue(0);
      vi.mocked(Template.insertMany).mockResolvedValue([]);

      await seedTemplates();

      expect(Template.countDocuments).toHaveBeenCalled();
      expect(Template.insertMany).toHaveBeenCalled();
    });

    it('should upsert custom templates when database has existing templates', async () => {
      vi.mocked(Template.countDocuments).mockResolvedValue(5);
      vi.mocked(Template.updateOne).mockResolvedValue({ 
        acknowledged: true, 
        matchedCount: 1, 
        modifiedCount: 1, 
        upsertedCount: 0, 
        upsertedId: null 
      } as any);

      await seedTemplates();

      expect(Template.countDocuments).toHaveBeenCalled();
      expect(Template.updateOne).toHaveBeenCalled();
    });

    it('should handle database connection error', async () => {
      vi.mocked(Template.countDocuments).mockRejectedValue(new Error('Database connection failed'));

      await expect(seedTemplates()).rejects.toThrow('Database connection failed');
    });

    it('should handle insertMany error', async () => {
      vi.mocked(Template.countDocuments).mockResolvedValue(0);
      vi.mocked(Template.insertMany).mockRejectedValue(new Error('Insert failed'));

      await expect(seedTemplates()).rejects.toThrow('Insert failed');
    });

    it('should handle updateOne error', async () => {
      vi.mocked(Template.countDocuments).mockResolvedValue(5);
      vi.mocked(Template.updateOne).mockRejectedValue(new Error('Update failed'));

      await expect(seedTemplates()).rejects.toThrow('Update failed');
    });
  });

  describe('reseedTemplates', () => {
    it('should reseed templates successfully', async () => {
      vi.mocked(Template.deleteMany).mockResolvedValue({ 
        acknowledged: true, 
        deletedCount: 5 
      } as any);
      vi.mocked(Template.insertMany).mockResolvedValue([]);

      await reseedTemplates();

      expect(Template.deleteMany).toHaveBeenCalledWith({});
      expect(Template.insertMany).toHaveBeenCalled();
    });

    it('should handle deleteMany error', async () => {
      vi.mocked(Template.deleteMany).mockRejectedValue(new Error('Delete failed'));

      await expect(reseedTemplates()).rejects.toThrow('Delete failed');
    });

    it('should handle insertMany error after successful delete', async () => {
      vi.mocked(Template.deleteMany).mockResolvedValue({ 
        acknowledged: true, 
        deletedCount: 5 
      } as any);
      vi.mocked(Template.insertMany).mockRejectedValue(new Error('Insert failed'));

      await expect(reseedTemplates()).rejects.toThrow('Insert failed');
    });
  });
});