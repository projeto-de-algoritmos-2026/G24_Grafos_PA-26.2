/**
 * Binary min-heap based Priority Queue.
 *
 * Used by Dijkstra, A* and Prim so that the "extract minimum" operation
 * runs in O(log n) instead of the O(n log n) that a `sort()+shift()` pair
 * would cost on every iteration.
 *
 * Complexity (n = number of items ever pushed):
 *  - push:        O(log n)
 *  - popMin:      O(log n)
 *  - peek:        O(1)
 *  - size/isEmpty:O(1)
 *
 * The heap stores arbitrary items alongside a numeric priority. Ties are
 * broken by insertion order (stable-ish, first pushed wins) which keeps
 * algorithm behaviour deterministic and easy to test.
 */

interface HeapEntry<T> {
  priority: number;
  sequence: number;
  value: T;
}

export class PriorityQueue<T> {
  private heap: HeapEntry<T>[] = [];
  private sequenceCounter = 0;

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | undefined {
    return this.heap[0]?.value;
  }

  push(value: T, priority: number): void {
    const entry: HeapEntry<T> = { priority, sequence: this.sequenceCounter++, value };
    this.heap.push(entry);
    this.bubbleUp(this.heap.length - 1);
  }

  popMin(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top.value;
  }

  private isSmaller(a: HeapEntry<T>, b: HeapEntry<T>): boolean {
    if (a.priority !== b.priority) return a.priority < b.priority;
    return a.sequence < b.sequence;
  }

  private bubbleUp(startIndex: number): void {
    let index = startIndex;
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.isSmaller(this.heap[index], this.heap[parentIndex])) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private bubbleDown(startIndex: number): void {
    let index = startIndex;
    const length = this.heap.length;
    for (;;) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (left < length && this.isSmaller(this.heap[left], this.heap[smallest])) smallest = left;
      if (right < length && this.isSmaller(this.heap[right], this.heap[smallest])) smallest = right;
      if (smallest === index) break;

      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(a: number, b: number): void {
    const temp = this.heap[a];
    this.heap[a] = this.heap[b];
    this.heap[b] = temp;
  }
}
