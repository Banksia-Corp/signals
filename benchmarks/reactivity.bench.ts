import { bench, describe } from "vitest";
import {
  signal,
  computed,
  effect,
  batch,
  makeReactive,
  type ReadonlySignal,
  type Signal,
} from "../src/index";

describe("1. Signal & Reactive Object Read/Write Throughput", () => {
  const primitive = signal(0);
  bench("primitive signal read", () => {
    const val = primitive.value;
    val;
  });

  bench("primitive signal write", () => {
    primitive.value += 1;
  });

  const reactiveStore = makeReactive({
    user: {
      profile: {
        score: 100,
        name: "Alice",
      },
    },
  });

  bench("reactive proxy property read", () => {
    const score = reactiveStore.user.profile.score;
    score;
  });

  bench("reactive proxy property write", () => {
    reactiveStore.user.profile.score += 1;
  });
});

describe("2. Deep Dependency Chain Propagation", () => {
  // 100-deep computed chain
  const root100 = signal(1);
  let current100: ReadonlySignal<number> | Signal<number> = root100;
  for (let i = 0; i < 100; i++) {
    const prev = current100;
    current100 = computed(() => prev.value + 1);
  }
  const leaf100 = current100 as ReadonlySignal<number>;

  bench("100-deep computed chain update & resolve", () => {
    root100.value += 1;
    const result = leaf100.value;
    result;
  });

  // 500-deep computed chain
  const root500 = signal(1);
  let current500: ReadonlySignal<number> | Signal<number> = root500;
  for (let i = 0; i < 500; i++) {
    const prev = current500;
    current500 = computed(() => prev.value + 1);
  }
  const leaf500 = current500 as ReadonlySignal<number>;

  bench("500-deep computed chain update & resolve", () => {
    root500.value += 1;
    const result = leaf500.value;
    result;
  });
});

describe("3. Wide Fan-out / Fan-in (Diamond Problem)", () => {
  const root = signal(1);
  const WIDTH = 1000;
  const computeds: ReadonlySignal<number>[] = [];

  for (let i = 0; i < WIDTH; i++) {
    computeds.push(computed(() => root.value * 2));
  }

  let effectRunCount = 0;
  const aggregator = computed(() => {
    let sum = 0;
    for (let i = 0; i < WIDTH; i++) {
      sum += computeds[i].value;
    }
    return sum;
  });

  effect(() => {
    aggregator.value;
    effectRunCount++;
  });

  bench("1,000-wide diamond dependency propagation", () => {
    root.value += 1;
  });
});

describe("4. Reactive Collections Performance", () => {
  const reactiveMap = makeReactive(new Map<string, number>());
  bench("reactive Map: set / get / delete", () => {
    reactiveMap.set("key", 42);
    const val = reactiveMap.get("key");
    val;
    reactiveMap.delete("key");
  });

  const reactiveSet = makeReactive(new Set<number>());
  bench("reactive Set: add / has / delete", () => {
    reactiveSet.add(100);
    const has = reactiveSet.has(100);
    has;
    reactiveSet.delete(100);
  });
});

describe("5. Batching & Scheduling Efficiency", () => {
  const a = signal(0);
  const b = signal(0);
  const c = signal(0);

  let reactionCount = 0;
  effect(() => {
    a.value;
    b.value;
    c.value;
    reactionCount++;
  });

  bench("unbatched synchronous multi-signal updates (3 writes)", () => {
    a.value += 1;
    b.value += 1;
    c.value += 1;
  });

  bench("batched multi-signal updates via batch() (3 writes)", () => {
    batch(() => {
      a.value += 1;
      b.value += 1;
      c.value += 1;
    });
  });
});

describe("6. Memory & Disposal Teardown Lifecycle", () => {
  bench("create and dispose 100 effects", () => {
    const s = signal(0);
    const disposers: Array<() => void> = [];
    for (let i = 0; i < 100; i++) {
      disposers.push(
        effect(() => {
          s.value;
        }),
      );
    }
    for (const dispose of disposers) {
      dispose();
    }
  });
});
