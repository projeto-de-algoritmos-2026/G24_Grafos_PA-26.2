/**
 * Disjoint Set Union (Union-Find) with path compression and union by rank.
 *
 * Used by Kruskal's algorithm to detect cycles in O(a(n)) amortized time
 * per operation, where a(n) is the inverse Ackermann function (effectively
 * constant for any realistic input size).
 */
export class UnionFind {
  private readonly parent = new Map<string, string>();
  private readonly rank = new Map<string, number>();
  private components: number;

  constructor(items: string[]) {
    items.forEach((item) => {
      this.parent.set(item, item);
      this.rank.set(item, 0);
    });
    this.components = items.length;
  }

  /** Finds the representative (root) of the set containing `item`, compressing the path along the way. */
  find(item: string): string {
    const parent = this.parent.get(item);
    if (parent === undefined) {
      throw new Error(`UnionFind.find: unknown item "${item}"`);
    }
    if (parent !== item) {
      const root = this.find(parent);
      this.parent.set(item, root);
      return root;
    }
    return item;
  }

  /** Merges the sets containing `a` and `b`. Returns true if they were previously disjoint (i.e. a merge happened). */
  union(a: string, b: string): boolean {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return false;

    const rankA = this.rank.get(rootA) ?? 0;
    const rankB = this.rank.get(rootB) ?? 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
    } else if (rankA > rankB) {
      this.parent.set(rootB, rootA);
    } else {
      this.parent.set(rootB, rootA);
      this.rank.set(rootA, rankA + 1);
    }

    this.components -= 1;
    return true;
  }

  connected(a: string, b: string): boolean {
    return this.find(a) === this.find(b);
  }

  /** Number of distinct disjoint sets currently tracked. */
  countComponents(): number {
    return this.components;
  }
}
