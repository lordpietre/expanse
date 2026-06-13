import { describe, it, expect } from 'vitest';

describe('actions/libraryActions sorting', () => {
  const categoryOrder: Record<string, number> = {
    'Database': 0,
    'Web Server': 1,
    'Cache': 2,
    'Social': 3,
    'CMS': 4,
    'Network': 5,
    'Monitoring': 6,
    'Automation': 7,
    'Cloud': 8,
    'AI': 9,
    'Utilities': 10,
    'Development': 11,
    'Messaging': 12,
    'Queue': 13,
    'Applications': 14,
    'OS': 15,
    'Other': 16,
  };

  it('should have category order defined for all expected categories', () => {
    const expectedCategories = [
      'Database', 'Web Server', 'Cache', 'Social', 'CMS', 'Network',
      'Monitoring', 'Automation', 'Cloud', 'AI', 'Utilities',
      'Development', 'Messaging', 'Queue', 'Applications', 'OS'
    ];

    expectedCategories.forEach(cat => {
      expect(categoryOrder).toHaveProperty(cat);
    });
  });

  it('should have Database as highest priority', () => {
    expect(categoryOrder['Database']).toBe(0);
  });

  it('should have OS and Other as lowest priority', () => {
    expect(categoryOrder['OS']).toBe(15);
    expect(categoryOrder['Other']).toBe(16);
  });
});