import type { HeapItem } from './routing.types.js';

export type { HeapItem } from './routing.types.js';

/** Binary min-heap keyed by numeric priority (Dijkstra distances). */
export class MinHeap<T> {
  private readonly data: HeapItem<T>[] = [];

  get size(): number {
    return this.data.length;
  }

  push(priority: number, value: T): void {
    this.data.push({ priority, value });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): HeapItem<T> | undefined {
    if (this.data.length === 0) {
      return undefined;
    }
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.data[index].priority >= this.data[parent].priority) {
        break;
      }
      [this.data[index], this.data[parent]] = [this.data[parent], this.data[index]];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    const n = this.data.length;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      let smallest = index;

      if (left < n && this.data[left].priority < this.data[smallest].priority) {
        smallest = left;
      }
      if (right < n && this.data[right].priority < this.data[smallest].priority) {
        smallest = right;
      }
      if (smallest === index) {
        break;
      }
      [this.data[index], this.data[smallest]] = [
        this.data[smallest],
        this.data[index],
      ];
      index = smallest;
    }
  }
}
