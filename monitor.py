"""Nonblocking snapshots shared across HTTP threads, without background workers."""
import math
import threading
import time


def cpu_snapshot(times):
    # Guest time is already included in user/nice time on Linux.
    total = sum(times) - getattr(times, 'guest', 0) - getattr(times, 'guest_nice', 0)
    idle = times.idle + getattr(times, 'iowait', 0)
    return total, idle


def percent(value):
    return round(min(100, max(0, value)), 1) if math.isfinite(value) else None


class SystemMonitor:
    def __init__(self, provider=None, clock=time.monotonic, wall_clock=time.time, minimum_interval=0.5):
        if provider is None:
            import psutil
            provider = psutil
        self.provider = provider
        self.clock = clock
        self.wall_clock = wall_clock
        self.minimum_interval = minimum_interval
        self.lock = threading.Lock()
        self.previous_cpu = None
        self.cached = None
        self.cached_at = None

    def sample(self):
        with self.lock:
            now = self.clock()
            if self.cached is not None and 0 <= now - self.cached_at < self.minimum_interval:
                return dict(self.cached)
            current = cpu_snapshot(self.provider.cpu_times())
            cpu = None
            if self.previous_cpu is not None:
                elapsed = current[0] - self.previous_cpu[0]
                idle = current[1] - self.previous_cpu[1]
                if elapsed > 0 and idle >= 0:
                    cpu = percent(100 * (elapsed - idle) / elapsed)
                elif elapsed == 0 and idle == 0 and self.cached:
                    cpu = self.cached['cpu_percent']
            memory = self.provider.virtual_memory()
            network = self.provider.net_io_counters()
            snapshot = {
                'cpu_percent': cpu,
                'memory_percent': percent(memory.percent),
                'packets_sent': max(0, int(network.packets_sent)) if network is not None else None,
                'packets_recv': max(0, int(network.packets_recv)) if network is not None else None,
                'sampled_at': self.wall_clock(),
            }
            self.previous_cpu = current
            self.cached = snapshot
            self.cached_at = now
            return dict(snapshot)


_default_monitor = None
_default_lock = threading.Lock()


def get_system_stats():
    global _default_monitor
    with _default_lock:
        if _default_monitor is None:
            _default_monitor = SystemMonitor()
        monitor = _default_monitor
    return monitor.sample()


if __name__ == '__main__':
    import json
    print(json.dumps(get_system_stats(), ensure_ascii=False))
