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

interface UserProps {
  name: string;
  email: string;
}

class UserStore {
  public props: UserProps;
  public id: string;

  constructor(props: UserProps, id: string) {
    this.props = props;
    this.id = id;
    return makeReactive(this);
  }

  public updateProfile(name: string, email: string): void {
    this.props.name = name;
    this.props.email = email;
  }
}

class CartStore {
  public items: string[] = [];
  constructor() {
    return makeReactive(this);
  }
  public addItem(item: string) {
    this.items.push(item);
  }
}

class RootStore {
  public user: UserStore;
  public cart: CartStore;

  constructor() {
    this.user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );
    this.cart = new CartStore();
    return makeReactive(this);
  }
}

class ClassCollectionStore {
  public tags = new Set<string>();
  public settings = new Map<string, string>();
  public logs: string[] = [];

  constructor() {
    return makeReactive(this);
  }
}

describe("@platform/signals - Core BDD Tests", () => {
  it("Given a domain object returning makeReactive(this) in constructor, when property assignments occur, then subscribers react dynamically to mutations", () => {
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );
    const reactionSpy = vi.fn();

    effect(() => {
      reactionSpy(user.props.name, user.props.email);
    });

    expect(reactionSpy).toHaveBeenCalledTimes(1);
    expect(reactionSpy).toHaveBeenLastCalledWith("Alice", "alice@example.com");

    // When mutating property
    user.props.name = "Bob";
    flushBatch();

    // Then observer receives updated value
    expect(reactionSpy).toHaveBeenCalledTimes(2);
    expect(reactionSpy).toHaveBeenLastCalledWith("Bob", "alice@example.com");
  });

  it("Given class property collections (Array, Map, Set), when mutated via class instance properties, then observers receive fine-grained reactive updates", () => {
    const store = new ClassCollectionStore();
    const tagSpy = vi.fn();
    const settingSpy = vi.fn();
    const logSpy = vi.fn();

    effect(() => {
      tagSpy(store.tags.size, store.tags.has("developer"));
    });

    effect(() => {
      settingSpy(store.settings.get("theme"));
    });

    effect(() => {
      logSpy(store.logs.length);
    });

    expect(tagSpy).toHaveBeenLastCalledWith(0, false);
    expect(settingSpy).toHaveBeenLastCalledWith(undefined);
    expect(logSpy).toHaveBeenLastCalledWith(0);

    // When mutating class property collections
    store.tags.add("developer");
    store.settings.set("theme", "dark");
    store.logs.push("App Started");
    flushBatch();

    // Then observers react to property collection mutations
    expect(tagSpy).toHaveBeenLastCalledWith(1, true);
    expect(settingSpy).toHaveBeenLastCalledWith("dark");
    expect(logSpy).toHaveBeenLastCalledWith(1);
  });

  it("Given a multi-tier store tree (RootStore + ChildStores), when child store properties mutate, then cross-store computed properties update atomically", () => {
    const root = new RootStore();
    const summaryComputed = computed(
      () => `${root.user.props.name} has ${root.cart.items.length} items`,
    );

    const reactionSpy = vi.fn();
    effect(() => {
      reactionSpy(summaryComputed.value);
    });

    expect(reactionSpy).toHaveBeenLastCalledWith("Alice has 0 items");

    // When modifying both child stores within an aggregate domain method
    root.user.updateProfile("Bob", "bob@example.com");
    root.cart.addItem("Laptop");
    flushBatch();

    // Then cross-store computed updates in a single notification
    expect(summaryComputed.value).toBe("Bob has 1 items");
    expect(reactionSpy).toHaveBeenLastCalledWith("Bob has 1 items");
  });

  it("Given reactive collection types (Map and Set), when collection mutations execute, then subscribers react to collection lifecycle changes", () => {
    const mapStore = makeReactive(new Map<string, number>());
    const setStore = makeReactive(new Set<string>());

    const mapSpy = vi.fn();
    const setSpy = vi.fn();

    effect(() => {
      mapSpy(mapStore.get("score"), mapStore.size);
    });

    effect(() => {
      setSpy(setStore.has("admin"), setStore.size);
    });

    expect(mapSpy).toHaveBeenLastCalledWith(undefined, 0);
    expect(setSpy).toHaveBeenLastCalledWith(false, 0);

    // When setting map key and adding set entry
    mapStore.set("score", 100);
    setStore.add("admin");
    flushBatch();

    // Then observers react with updated values and sizes
    expect(mapSpy).toHaveBeenLastCalledWith(100, 1);
    expect(setSpy).toHaveBeenLastCalledWith(true, 1);
  });

  it("Given multiple consecutive property assignments, when executed within the same execution turn, then subscriber notifications auto-collapse into a single batch turn", async () => {
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );
    const reactionSpy = vi.fn();

    effect(() => {
      reactionSpy(user.props.name, user.props.email);
    });

    expect(reactionSpy).toHaveBeenCalledTimes(1);

    // When performing 3 consecutive synchronous assignments
    user.props.name = "Charlie";
    user.props.email = "charlie@example.com";
    user.props.name = "David";

    // Wait for microtask tick
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));

    // Then effect fires only once with collapsed final state
    expect(reactionSpy).toHaveBeenCalledTimes(2);
    expect(reactionSpy).toHaveBeenLastCalledWith(
      "David",
      "charlie@example.com",
    );
  });

  it("Given active reactive nodes, when DevTools inspection executes, then getDependencyGraph and mutation listeners expose accurate graph linkage", () => {
    const user = new UserStore(
      { name: "Alice", email: "alice@example.com" },
      "usr-1",
    );
    const mutationSpy = vi.fn();

    const unregisterMutation = registerOnMutation(mutationSpy);

    effect(() => {
      // Read props.name
      void user.props.name;
    });

    const graph = getDependencyGraph(user.props);
    expect(graph.properties["name"]?.subscriberCount).toBe(1);

    user.props.name = "Eve";
    expect(mutationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        property: "name",
        oldValue: "Alice",
        newValue: "Eve",
      }),
    );

    unregisterMutation();
  });
});
