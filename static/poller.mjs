export class Poller {
    constructor({ request, render, onState, interval, hidden, setTimer = setTimeout, clearTimer = clearTimeout }) {
        Object.assign(this, { request, render, onState, interval, hidden });
        // Browser timer functions must be called without a Poller receiver.
        this.setTimer = (callback, delay) => setTimer(callback, delay);
        this.clearTimer = handle => clearTimer(handle);
        this.paused = false;
        this.busy = false;
        this.error = false;
        this.hasData = false;
        this.stopped = false;
        this.generation = 0;
        this.timer = this.timeout = this.controller = null;
    }
    emit() {
        this.onState({ paused: this.paused || this.hidden(), busy: this.busy, error: this.error, hasData: this.hasData });
    }
    clearScheduled() {
        if (this.timer !== null) this.clearTimer(this.timer);
        this.timer = null;
    }
    schedule() {
        this.clearScheduled();
        if (this.stopped || this.paused || this.hidden() || this.busy) return;
        const delay = [1000, 2000, 5000].includes(this.interval()) ? this.interval() : 1000;
        this.timer = this.setTimer(() => this.update(), delay);
    }
    cancel() {
        this.generation++;
        this.clearScheduled();
        if (this.timeout !== null) this.clearTimer(this.timeout);
        this.timeout = null;
        this.controller?.abort();
        this.controller = null;
        this.busy = false;
    }
    async update({ manual = false } = {}) {
        if (this.stopped || this.hidden() || this.busy || (this.paused && !manual)) return;
        this.clearScheduled();
        const generation = ++this.generation;
        const controller = new AbortController();
        this.controller = controller;
        this.busy = true;
        this.timeout = this.setTimer(() => controller.abort(), 8000);
        this.emit();
        try {
            const data = await this.request(controller.signal);
            if (generation !== this.generation) return;
            if (controller.signal.aborted) throw new Error('Request aborted');
            this.render(data);
            this.hasData = true;
            this.error = false;
        } catch {
            if (generation === this.generation) this.error = true;
        } finally {
            if (generation === this.generation) {
                if (this.timeout !== null) this.clearTimer(this.timeout);
                this.timeout = null;
                this.controller = null;
                this.busy = false;
                this.emit();
                this.schedule();
            }
        }
    }
    setPaused(paused) {
        this.paused = paused;
        this.cancel();
        this.emit();
        if (!paused && !this.hidden()) return this.update();
    }
    visibilityChanged() {
        if (this.hidden()) { this.cancel(); this.emit(); }
        else if (!this.paused) return this.update();
    }
    intervalChanged() { this.schedule(); }
    stop() { this.stopped = true; this.cancel(); }
    start() { this.stopped = false; return this.update(); }
}
