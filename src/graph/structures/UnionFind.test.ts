import { describe, expect, it } from 'vitest';
import { UnionFind } from './UnionFind';

describe('UnionFind (disjoint set)', () => {
  it('starts with one component per item', () => {
    const uf = new UnionFind(['a', 'b', 'c', 'd']);
    expect(uf.countComponents()).toBe(4);
    expect(uf.connected('a', 'b')).toBe(false);
  });

  it('find returns the item itself before any union', () => {
    const uf = new UnionFind(['a', 'b']);
    expect(uf.find('a')).toBe('a');
    expect(uf.find('b')).toBe('b');
  });

  it('union merges two sets and returns true only when they were disjoint', () => {
    const uf = new UnionFind(['a', 'b', 'c']);
    expect(uf.union('a', 'b')).toBe(true);
    expect(uf.connected('a', 'b')).toBe(true);
    expect(uf.countComponents()).toBe(2);
    // repeated union of the already-connected pair is a no-op
    expect(uf.union('a', 'b')).toBe(false);
    expect(uf.countComponents()).toBe(2);
  });

  it('union is transitive across chains', () => {
    const uf = new UnionFind(['a', 'b', 'c', 'd']);
    uf.union('a', 'b');
    uf.union('c', 'd');
    expect(uf.connected('a', 'c')).toBe(false);
    uf.union('b', 'c');
    expect(uf.connected('a', 'd')).toBe(true);
    expect(uf.countComponents()).toBe(1);
  });

  it('shares a single representative after path compression (indirect check)', () => {
    const uf = new UnionFind(['a', 'b', 'c', 'd', 'e']);
    uf.union('a', 'b');
    uf.union('b', 'c');
    uf.union('c', 'd');
    uf.union('d', 'e');
    const root = uf.find('a');
    // Every element must resolve to the same root, even the far end of the chain.
    ['b', 'c', 'd', 'e'].forEach((item) => expect(uf.find(item)).toBe(root));
  });

  it('throws for an unknown item', () => {
    const uf = new UnionFind(['a']);
    expect(() => uf.find('z')).toThrow();
  });
});
