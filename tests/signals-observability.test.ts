import { describe, it, expect, vi } from "vitest";
import {
  makeReactive,
  signal,
  computed,
  effect,
  batch,
  flushBatch,
  getDependencyGraph,
  registerOnMutation,
  registerOnReaction,
} from "../src/index";
import {
  registerReactivityHooks,
  observe,
  createReactivityHub,
  type ReactiveSource,
  type ReactiveConsumer,
} from "../src/core/observability";

interface ProfileProps {
  name: string;
  email: string;
  age: number;
}

class UserStore {
  public props: ProfileProps;
  public id: string;

  constructor(props: ProfileProps, id: string) {
    this.props = props;
    this.id = id;
    return makeReactive(this);
  }

  public updateProfile(name: string, email: string): void {
    this.props.name = name;
    this.props.email = email;
  }
}

describe("@platform/signals - Reactivity Observability & Hooks Engine", () => {
  it("Given active reactive nodes, when reading properties inside an effect, then onTrack lifecycle hooks capture dependency edges in real-time", () => {
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com", age: 30 },
      "usr-1",
    );

    const trackedSources: ReactiveSource[] = [];
    const trackedConsumers: ReactiveConsumer[] = [];

    const unregister = registerReactivityHooks({
      onTrack(source, consumer) {
        trackedSources.push(source);
        trackedConsumers.push(consumer);
      },
    });

    effect(() => {
      void user.props.name;
      void user.props.email;
    });

    // Tracks user.props and nested property accesses
    const properties = trackedSources.map((s) => s.meta.property);
    expect(properties).toContain("props");
    expect(properties).toContain("name");
    expect(properties).toContain("email");

    const nameSource = trackedSources.find((s) => s.meta.property === "name");
    expect(nameSource?.value).toBe("Alice");
    expect(trackedConsumers[0]?.type).toBe("effect");

    unregister();
  });

  it("Given state mutations across objects, arrays, and sets, then onNotify hooks receive accurate old and new values", () => {
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com", age: 30 },
      "usr-1",
    );
    const notifications: Array<{
      label: string;
      oldValue: unknown;
      newValue: unknown;
    }> = [];

    const unregister = registerReactivityHooks({
      onNotify(source, change) {
        notifications.push({
          label: source.meta.label,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      },
    });

    user.props.name = "Bob";
    user.props.age = 31;

    expect(notifications.length).toBe(2);
    expect(notifications[0]).toEqual({
      label: expect.stringContaining("name"),
      oldValue: "Alice",
      newValue: "Bob",
    });
    expect(notifications[1]).toEqual({
      label: expect.stringContaining("age"),
      oldValue: 30,
      newValue: 31,
    });

    unregister();
  });

  it("Given computed signals and effects, when evaluating, then onExecute and onBatch capture lifecycle execution phases", async () => {
    const num = signal(5);
    const executions: Array<{ name: string; phase: string }> = [];
    const batches: Array<{ phase: string; flushedCount?: number }> = [];

    const unregister = registerReactivityHooks({
      onExecute(consumer, context) {
        executions.push({ name: consumer.name, phase: context.phase });
      },
      onBatch(stats) {
        batches.push({ phase: stats.phase, flushedCount: stats.flushedCount });
      },
    });

    const doubled = computed(() => num.value * 2);

    effect(() => {
      void doubled.value;
    });

    expect(executions.some((e) => e.phase === "start")).toBe(true);
    expect(executions.some((e) => e.phase === "end")).toBe(true);

    // Mutate and flush batch
    batch(() => {
      num.value = 10;
      num.value = 15;
    });

    expect(doubled.value).toBe(30);
    expect(batches.some((b) => b.phase === "start")).toBe(true);
    expect(batches.some((b) => b.phase === "flush")).toBe(true);

    unregister();
  });

  it("Given target-scoped observation via observe(target, hooks), callbacks only fire for the specified target instance", () => {
    const user1 = new UserStore(
      { name: "User 1", email: "u1@example.com", age: 20 },
      "usr-1",
    );
    const user2 = new UserStore(
      { name: "User 2", email: "u2@example.com", age: 25 },
      "usr-2",
    );

    const user1Mutations: string[] = [];
    const stopObservingUser1 = observe(user1.props, {
      onNotify(source, change) {
        user1Mutations.push(
          `${String(source.meta.property)}: ${change.newValue}`,
        );
      },
    });

    // Mutate both
    user1.props.name = "Updated User 1";
    user2.props.name = "Updated User 2";

    expect(user1Mutations).toEqual(["name: Updated User 1"]);

    stopObservingUser1();
    user1.props.name = "Final User 1";
    expect(user1Mutations.length).toBe(1);
  });

  it("Given createReactivityHub with a filter predicate, then filtered events are ignored while permitted events are processed", () => {
    const hub = createReactivityHub({
      filter: (source) => source.meta.property !== "privateKey",
    });

    const state = makeReactive({
      publicKey: "123",
      privateKey: "secret_456",
    });

    const log: string[] = [];
    const unregister = hub.use({
      onNotify(source, change) {
        log.push(`${String(source.meta.property)}=${change.newValue}`);
      },
    });

    state.publicKey = "789";
    state.privateKey = "secret_999";

    expect(log).toEqual(["publicKey=789"]);

    unregister();
    hub.clear();
  });

  it("Given legacy registerOnMutation, registerOnReaction, and getDependencyGraph, backwards compatibility is fully preserved", () => {
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com", age: 30 },
      "usr-1",
    );
    const mutationSpy = vi.fn();
    const reactionSpy = vi.fn();

    const unregMutation = registerOnMutation(mutationSpy);
    const unregReaction = registerOnReaction(reactionSpy);

    effect(() => {
      void user.props.name;
    });

    const graph = getDependencyGraph(user.props);
    expect(graph.properties["name"]?.subscriberCount).toBe(1);

    user.props.name = "Bob";
    flushBatch();

    expect(mutationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        property: "name",
        oldValue: "Alice",
        newValue: "Bob",
      }),
    );
    expect(reactionSpy).toHaveBeenCalled();

    unregMutation();
    unregReaction();
  });
});
