import { describe, it, expect, vi } from "vitest";
import { makeReactive, flushBatch } from "../src/index";
import { bindText, bindDOM } from "../src/vanilla";
import { SignalsController, ReactiveControllerHost } from "../src/lit";
import { createSolidSignalBridge } from "../src/solid";
import { createRoot } from "solid-js";

class TestCounter {
  public count = 0;
  constructor() {
    return makeReactive(this);
  }
  public increment() {
    this.count++;
  }
}

describe("@banksia/signals - Framework Adapters BDD Tests", () => {
  it("Behavior: Vanilla DOM Binding - Given a DOM element bound to reactive state via bindText, when state updates, then element textContent updates automatically", () => {
    // Mock DOM Element
    const fakeElement = { textContent: "" } as HTMLElement;
    const counter = new TestCounter();

    const unbind = bindText(fakeElement, () => `Count is ${counter.count}`);
    expect(fakeElement.textContent).toBe("Count is 0");

    // When mutating state
    counter.increment();
    flushBatch();

    // Then DOM text content updates
    expect(fakeElement.textContent).toBe("Count is 1");
    unbind();
  });

  it("Behavior: Lit Controller Synchronization - Given a Lit host component using SignalsController, when reactive state mutates, then host.requestUpdate is invoked", () => {
    const counter = new TestCounter();
    const mockHost: ReactiveControllerHost = {
      addController: vi.fn(),
      removeController: vi.fn(),
      requestUpdate: vi.fn(),
    };

    const controller = new SignalsController(mockHost, counter);
    controller.hostConnected();

    expect(mockHost.requestUpdate).toHaveBeenCalledTimes(1);

    // When mutating state
    counter.increment();
    flushBatch();

    // Then Lit requestUpdate is triggered
    expect(mockHost.requestUpdate).toHaveBeenCalledTimes(2);

    controller.hostDisconnected();
  });

  it("Behavior: Solid Signal Bridge - Given a Solid signal bridge connected to reactive state, when state mutates, then Solid accessor emits new state instance", () => {
    const counter = new TestCounter();

    createRoot((dispose) => {
      const accessor = createSolidSignalBridge(counter);
      expect(accessor().count).toBe(0);

      // When mutating state
      counter.increment();
      flushBatch();

      // Then Solid accessor receives update
      expect(accessor().count).toBe(1);
      dispose();
    });
  });
});
