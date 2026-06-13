import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recreatePositionMap, recreateConnectionMap } from '@/lib/metadata';
import type { PositionMap, ConnectionMapEntry } from '@/lib/metadata';

describe('lib/metadata', () => {
  describe('recreatePositionMap', () => {
    it('should recreate a position map from array', () => {
      const input: PositionMap[] = [
        { id: 'node1', position: { x: 100, y: 200 } },
        { id: 'node2', position: { x: 300, y: 400 } },
      ];

      const result = recreatePositionMap(input);

      expect(result.size).toBe(2);
      expect(result.get('node1')).toEqual({ position: { x: 100, y: 200 } });
      expect(result.get('node2')).toEqual({ position: { x: 300, y: 400 } });
    });

    it('should return empty map for undefined input', () => {
      const result = recreatePositionMap(undefined);
      expect(result.size).toBe(0);
    });

    it('should return empty map for null input', () => {
      const result = recreatePositionMap(null as any);
      expect(result.size).toBe(0);
    });

    it('should return empty map for empty array', () => {
      const result = recreatePositionMap([]);
      expect(result.size).toBe(0);
    });
  });

  describe('recreateConnectionMap', () => {
    it('should recreate a connection map from array', () => {
      const input: ConnectionMapEntry[] = [
        { key: 'source1:target1', targetHandle: 'handle-a' },
        { key: 'source2:target2', targetHandle: 'handle-b' },
      ];

      const result = recreateConnectionMap(input);

      expect(result.size).toBe(2);
      expect(result.get('source1:target1')).toBe('handle-a');
      expect(result.get('source2:target2')).toBe('handle-b');
    });

    it('should return empty map for undefined input', () => {
      const result = recreateConnectionMap(undefined);
      expect(result.size).toBe(0);
    });

    it('should return empty map for empty array', () => {
      const result = recreateConnectionMap([]);
      expect(result.size).toBe(0);
    });
  });
});