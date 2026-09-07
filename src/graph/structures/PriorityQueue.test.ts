import { describe, expect, it } from 'vitest';
import { PriorityQueue } from './PriorityQueue';

describe('PriorityQueue (min-heap)', () => {
  it('starts empty', () => {
    const queue = new PriorityQueue<string>();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size).toBe(0);
    expect(queue.peek()).toBeUndefined();
    expect(queue.popMin()).toBeUndefined();
  });

  it('pushes and reports size', () => {
    const queue = new PriorityQueue<string>();
    queue.push('a', 5);
    queue.push('b', 1);
    expect(queue.size).toBe(2);
    expect(queue.isEmpty()).toBe(false);
  });

  it('peek returns the minimum without removing it', () => {
    const queue = new PriorityQueue<string>();
    queue.push('a', 5);
    queue.push('b', 1);
    expect(queue.peek()).toBe('b');
    expect(queue.size).toBe(2);
  });

  it('popMin returns items in ascending priority order regardless of insertion order', () => {
    const queue = new PriorityQueue<string>();
    queue.push('five', 5);
    queue.push('one', 1);
    queue.push('three', 3);
    queue.push('four', 4);
    queue.push('two', 2);

    const order: string[] = [];
    while (!queue.isEmpty()) {
      const value = queue.popMin();
      if (value) order.push(value);
    }
    expect(order).toEqual(['one', 'two', 'three', 'four', 'five']);
  });

  it('breaks ties by insertion order (stable, first pushed wins)', () => {
    const queue = new PriorityQueue<string>();
    queue.push('first', 1);
    queue.push('second', 1);
    queue.push('third', 1);
    expect(queue.popMin()).toBe('first');
    expect(queue.popMin()).toBe('second');
    expect(queue.popMin()).toBe('third');
  });

  it('handles a larger random batch correctly', () => {
    const queue = new PriorityQueue<number>();
    const values = Array.from({ length: 200 }, () => Math.floor(Math.random() * 1000));
    values.forEach((value) => queue.push(value, value));

    const popped: number[] = [];
    while (!queue.isEmpty()) {
      const value = queue.popMin();
      if (value !== undefined) popped.push(value);
    }
    expect(popped).toEqual([...values].sort((a, b) => a - b));
  });
});
