import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  makeReactive,
  signal,
  computed,
  effect,
  batch,
  hasNotifyObservers,
  hasExecuteObservers,
  hasBatchObservers,
} from "../src/index";
import {
  DevToolsBridge,
  initDevTools,
  connectDevTools,
  disconnectDevTools,
  getDevToolsBridge,
} from "../src/devtools";

interface UserProps {
  name: string;
  email: string;
  _secretKey?: string;
}

class UserStore {
  public props: UserProps;
  public id: string;

  constructor(props: UserProps, id: string) {
    this.props = props;
    this.id = id;
    return makeReactive(this);
  }

  public updateName(name: string): void {
    this.props.name = name;
  }
}

describe("@platform/signals/devtools - Chrome DevTools MCP Bridge Adapter", () => {
  beforeEach(() => {
    disconnectDevTools();
  });

  afterEach(() => {
    disconnectDevTools();
  });

  it("Given DevToolsBridge instantiation, it attaches to globalThis and window globals", () => {
    const bridge = getDevToolsBridge();
    expect(bridge).toBeDefined();
    expect((globalThis as any).__BANKSIA_SIGNALS_DEVTOOLS__).toBe(bridge);
  });

  it("Given connectDevTools and disconnectDevTools, lifecycle hooks attach and detach with zero overhead when disconnected", () => {
    expect(hasNotifyObservers()).toBe(false);

    const unreg = connectDevTools({ recordNotifyEvents: true });
    expect(hasNotifyObservers()).toBe(true);
    expect(getDevToolsBridge().isConnected()).toBe(true);

    unreg();
    expect(hasNotifyObservers()).toBe(false);
    expect(getDevToolsBridge().isConnected()).toBe(false);
  });

  it("Given state mutations, then onNotify events are ring-buffered and queryable via getRecentEvents and getRecentMutations", () => {
    const bridge = new DevToolsBridge({ maxBufferSize: 3 });
    bridge.connect();

    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );

    user.props.name = "Bob";
    user.props.name = "Charlie";
    user.props.email = "charlie@example.com";
    user.props.name = "David";

    // Ring buffer size is 3, so 'Bob' mutation should be evicted
    const events = bridge.getRecentEvents();
    expect(events.length).toBe(3);

    const mutations = bridge.getRecentMutations(2);
    expect(mutations.length).toBe(2);
    expect(mutations[1]?.newValue).toBe("David");

    bridge.clearEventBuffer();
    expect(bridge.getRecentEvents().length).toBe(0);

    bridge.disconnect();
  });

  it("Given effect and computed executions, execution phases and batch flushes are recorded in telemetry", () => {
    const bridge = new DevToolsBridge();
    bridge.connect({ recordExecuteEvents: true, recordBatchEvents: true });

    const count = signal(1);
    const doubled = computed(() => count.value * 2, "doubledComputed");

    effect(() => {
      void doubled.value;
    }, "counterEffect");

    batch(() => {
      count.value = 5;
    });

    const executeEvents = bridge.getRecentEvents({ type: "execute" });
    expect(
      executeEvents.some((e) => e.type === "execute" && e.phase === "start"),
    ).toBe(true);
    expect(
      executeEvents.some((e) => e.type === "execute" && e.phase === "end"),
    ).toBe(true);

    const batchEvents = bridge.getRecentEvents({ type: "batch" });
    expect(
      batchEvents.some((b) => b.type === "batch" && b.phase === "flush"),
    ).toBe(true);

    const metrics = bridge.getPerformanceMetrics();
    expect(metrics.totalBatches).toBeGreaterThan(0);
    expect(metrics.totalExecutions).toBeGreaterThan(0);
    expect(metrics.totalMutations).toBeGreaterThan(0);

    bridge.resetPerformanceMetrics();
    expect(bridge.getPerformanceMetrics().totalBatches).toBe(0);

    bridge.disconnect();
  });

  it("Given private properties (leading _ or isPrivate), DevTools redacts sensitive values from inspection streams", () => {
    const bridge = new DevToolsBridge({ sanitizePrivate: true });
    bridge.connect();

    const user = new UserStore(
      {
        name: "Alice",
        email: "alice@example.com",
        _secretKey: "top-secret-token",
      },
      "usr-1",
    );

    user.props._secretKey = "new-secret-token";

    const mutations = bridge.getRecentMutations();
    const secretMutation = mutations.find((m) => m.property === "_secretKey");
    expect(secretMutation?.newValue).toBe("[REDACTED_PRIVATE]");

    const state = bridge.inspectState(user.props);
    expect(state?.["_secretKey"]).toBe("[REDACTED_PRIVATE]");
    expect(state?.["name"]).toBe("Alice");

    bridge.disconnect();
  });

  it("Given registerTarget, allows target indexing, state snapshot inspection, and dependency graph queries", () => {
    const bridge = new DevToolsBridge();
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );

    const unregTarget = bridge.registerTarget(user.props, "UserPropsStore");
    const targets = bridge.listRegisteredTargets();
    expect(targets.some((t) => t.id === "UserPropsStore")).toBe(true);

    effect(() => {
      void user.props.name;
    });

    const targetInspection = bridge.inspectTarget("UserPropsStore");
    expect(targetInspection).not.toBeNull();
    expect(targetInspection?.id).toBe("UserPropsStore");
    expect(targetInspection?.state["name"]).toBe("Alice");
    expect(targetInspection?.graph.properties["name"]?.subscriberCount).toBe(1);

    const allGraphs = bridge.inspectGraph() as Record<string, any>;
    expect(allGraphs["UserPropsStore"]).toBeDefined();

    unregTarget();
    expect(bridge.listRegisteredTargets().length).toBe(0);
  });

  it("Given inspection inside an active effect, inspectState runs in a sandboxed untracked context without adding phantom dependencies", () => {
    const bridge = new DevToolsBridge();
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );

    bridge.registerTarget(user.props, "UserProps");

    let effectRunCount = 0;
    effect(() => {
      effectRunCount++;
      // DevTools inspectState should be untracked
      bridge.inspectState("UserProps");
    });

    expect(effectRunCount).toBe(1);

    // Mutate user property that was read only during inspectState
    user.props.name = "Bob";

    // The effect should NOT have re-run because inspectState was sandboxed and untracked
    expect(effectRunCount).toBe(1);
  });

  it("Given customFilter option, events for excluded sources are filtered out", () => {
    const bridge = new DevToolsBridge({
      customFilter: (source) => source.meta.property !== "email",
    });
    bridge.connect();

    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );

    user.props.name = "Bob";
    user.props.email = "bob@example.com";

    const mutations = bridge.getRecentMutations();
    expect(mutations.length).toBe(1);
    expect(mutations[0]?.property).toBe("name");

    bridge.disconnect();
  });

  it("Given initDevTools helper, initializes and starts tracking immediately", () => {
    const bridge = initDevTools({ maxBufferSize: 100 });
    expect(bridge.isConnected()).toBe(true);

    const count = signal(10);
    count.value = 20;

    const mutations = bridge.getRecentMutations();
    expect(mutations.length).toBe(1);
    expect(mutations[0]?.newValue).toBe(20);

    disconnectDevTools();
    expect(bridge.isConnected()).toBe(false);
  });
});
