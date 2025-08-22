import { generateSlug, generateEventSlug, createSlugToIdMapping, extractEventIdFromSlug } from '../slugUtils';

describe('slugUtils', () => {
  describe('generateSlug', () => {
    it('lowercases, trims, removes specials, and collapses to hyphens', () => {
      expect(generateSlug('  Hello, World!__Test  ')).toBe('hello-world-test');
    });

    it('returns empty string for falsy input', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug(null)).toBe('');
      expect(generateSlug(undefined)).toBe('');
    });
  });

  describe('generateEventSlug', () => {
    it('builds slug from artist (from title), location and Month-Year', () => {
      const event = {
        id: '550e8400-e29b-41d4-a716-446655440102',
        title: 'Amr Diab - The Plateau Concert',
        date: '2025-02-20',
        location: 'New Administrative Capital Arena'
      };

      // Month short name is in en-US, e.g., 'Feb-2025'
      const slug = generateEventSlug(event);
      expect(slug).toBe('amr-diab-new-administrative-capital-arena-Feb-2025');
    });

    it('handles missing event gracefully', () => {
      expect(generateEventSlug(null)).toBe('');
      expect(generateEventSlug(undefined)).toBe('');
    });
  });

  describe('createSlugToIdMapping', () => {
    it('maps generated slugs to event IDs', () => {
      const events = [
        {
          id: 'e1',
          title: 'Artist One - Live',
          date: '2024-03-10',
          location: 'Cairo Opera House'
        },
        {
          id: 'e2',
          title: 'Artist Two',
          date: '2024-05-12',
          location: 'Alexandria Stadium'
        }
      ];

      const mapping = createSlugToIdMapping(events);
      expect(Object.values(mapping)).toContain('e1');
      expect(Object.values(mapping)).toContain('e2');

      // Spot-check one expected key format
      const anyKey = Object.keys(mapping).find(k => k.includes('artist-one'));
      expect(anyKey).toMatch(/artist-one-cairo-opera-house-[A-Z][a-z]{2}-\d{4}/);
    });
  });

  describe('extractEventIdFromSlug', () => {
    it('returns null (not implemented yet)', () => {
      expect(extractEventIdFromSlug('anything')).toBeNull();
    });
  });
});


