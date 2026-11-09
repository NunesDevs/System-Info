import test from 'node:test';
import assert from 'node:assert/strict';
import { Poller } from '../static/poller.mjs';

function fixture(request) {
    let id = 0;
    const timers = new Map(), rendered = [], states = [];
    const environment = { hidden: false, interval: 1000 };
    const poller = new Poller({ request, render: data => rendered.push(data), onState: state => states.push(state), hidden: () => environment.hidden, interval: () => environment.interval, setTimer: (fn, delay) => { timers.set(++id, { fn, delay }); return id; }, clearTimer: id => timers.delete(id) });
    return { poller, timers, rendered, states, environment, run(delay) { const entry = [...timers].find(([, timer]) => timer.delay === delay); assert.ok(entry); timers.delete(entry[0]); return entry[1].fn(); } };
}

test('slow requests never overlap and schedule the next poll after completion', async () => {
    let finish, calls = 0;
    const f = fixture(() => { calls++; return new Promise(resolve => { finish = resolve; }); });
    const first = f.poller.update(); await f.poller.update();
    assert.equal(calls, 1); assert.equal(f.poller.busy, true);
    finish({ cpu: 32 }); await first;
    assert.equal(f.rendered.length, 1); assert.equal(f.poller.busy, false);
    assert.deepEqual([...f.timers.values()].map(t => t.delay), [1000]);
    f.poller.stop(); assert.equal(f.timers.size, 0);
});

test('pause and hidden tabs abort requests and ignore stale results', async () => {
    let finish, signal;
    const f = fixture(value => { signal = value; return new Promise(resolve => { finish = resolve; }); });
    const pending = f.poller.update(); f.poller.setPaused(true);
    assert.equal(signal.aborted, true); finish({ old: true }); await pending;
    assert.equal(f.rendered.length, 0); assert.equal(f.timers.size, 0);
    const manual = f.poller.update({ manual: true }); finish({ manual: true }); await manual;
    assert.equal(f.rendered.length, 1); assert.equal(f.timers.size, 0);
    const resumed = f.poller.setPaused(false); f.environment.hidden = true; f.poller.visibilityChanged();
    assert.equal(signal.aborted, true); finish({ hidden: true }); await resumed;
    assert.equal(f.rendered.length, 1); assert.equal(f.timers.size, 0);
});

test('failure retains the previous sample and a later retry clears the error', async () => {
    let fail = false;
    const f = fixture(async () => { if (fail) throw new Error('offline'); return { cpu: 40 }; });
    await f.poller.update(); fail = true; await f.run(1000);
    assert.equal(f.rendered.length, 1); assert.equal(f.poller.error, true); assert.equal(f.poller.hasData, true);
    f.environment.interval = 5000; f.poller.intervalChanged();
    assert.deepEqual([...f.timers.values()].map(t => t.delay), [5000]);
    fail = false; await f.run(5000); assert.equal(f.poller.error, false); assert.equal(f.rendered.length, 2);
    f.poller.stop();
});

test('timeout aborts a hung request and schedules a bounded retry', async () => {
    const f = fixture(signal => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })));
    const pending = f.poller.update(); f.run(8000); await pending;
    assert.equal(f.poller.busy, false); assert.equal(f.poller.error, true);
    assert.deepEqual([...f.timers.values()].map(t => t.delay), [1000]);
    f.poller.stop();
});

test('host timer callbacks are invoked without an incompatible receiver', async () => {
    const timers = new Map(); let nextId = 0;
    const poller = new Poller({ request: async () => ({}), render() {}, onState() {}, interval: () => 1000, hidden: () => false,
        setTimer: function (callback, delay) { assert.equal(this, undefined); timers.set(++nextId, { callback, delay }); return nextId; },
        clearTimer: function (id) { assert.equal(this, undefined); timers.delete(id); },
    });
    await poller.update();
    assert.deepEqual([...timers.values()].map(t => t.delay), [1000]);
    poller.stop(); assert.equal(timers.size, 0);
});
