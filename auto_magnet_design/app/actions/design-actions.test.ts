import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveDesignsAction, deleteDesignAction } from './design-actions';

// 1. Mock the specific Auth behavior
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

// 2. Mock 'next/cache' since we aren't in a real running Next app
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// 3. Create mock functions for the database calls, then mock the whole DB layer
const mockInsert = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/db', () => ({
  db: {
    insert: () => ({ values: mockInsert }),
    delete: () => ({ where: mockDelete }),
  },
}));

describe('Design Server Actions', () => {
  beforeEach(() => {
    // Reset all mock counters before each test
    vi.clearAllMocks();
  });

  describe('saveDesignsAction', () => {
    it('returns Unauthorized when the user is not logged in', async () => {
      // Mock session returning null
      const { getSession } = await import('@/lib/auth');
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const result = await saveDesignsAction(['http://example.com/image.jpg'], true);
      
      expect(result).toEqual({ error: 'Unauthorized' });
      // Guarantee that DB insert was NOT called
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('successfully saves the design if the user is logged in', async () => {
      const { getSession } = await import('@/lib/auth');
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 10, username: 'testuser' });

      // Mock our database DB logic succeeding
      mockInsert.mockResolvedValueOnce([]);

      const result = await saveDesignsAction(['http://example.com/image.jpg'], false);
      
      expect(result).toEqual({ success: true });
      expect(mockInsert).toHaveBeenCalledWith([{
        userId: 10,
        imageUrl: 'http://example.com/image.jpg',
        two_doors: false
      }]);
    });
  });

  describe('deleteDesignAction', () => {
    it('blocks attempting to delete a design while unauthenticated', async () => {
      const { getSession } = await import('@/lib/auth');
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

      const result = await deleteDesignAction(101);

      expect(result.error).toBe('Unauthorized');
      expect(mockDelete).not.toHaveBeenCalled(); // Ensures we don't hit the DB!
    });
  });
});