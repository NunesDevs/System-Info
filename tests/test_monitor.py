from collections import namedtuple
from types import SimpleNamespace
import unittest
from monitor import SystemMonitor, cpu_snapshot

Times = namedtuple('Times', 'user system idle')


class Provider:
    def __init__(self):
        self.times = Times(10, 10, 80)
        self.memory = 64
        self.network = SimpleNamespace(packets_sent=124500, packets_recv=94000)
        self.network_reads = 0

    def cpu_times(self):
        return self.times

    def virtual_memory(self):
        return SimpleNamespace(percent=self.memory)

    def net_io_counters(self):
        self.network_reads += 1
        return self.network


class MonitorTests(unittest.TestCase):
    def setUp(self):
        self.provider = Provider()
        self.now = 0
        self.monitor = SystemMonitor(self.provider, clock=lambda: self.now, wall_clock=lambda: 123456)

    def test_nonblocking_counter_deltas_and_single_network_read(self):
        self.assertIsNone(self.monitor.sample()['cpu_percent'])
        self.provider.times = Times(15, 15, 100)
        self.now = 1
        sample = self.monitor.sample()
        self.assertAlmostEqual(sample['cpu_percent'], 33.3)
        self.assertEqual(sample['memory_percent'], 64)
        self.assertEqual(sample['packets_sent'], 124500)
        self.assertEqual(sample['packets_recv'], 94000)
        self.assertEqual(self.provider.network_reads, 2)

    def test_cache_is_bounded_and_callers_cannot_mutate_it(self):
        first = self.monitor.sample()
        first['packets_sent'] = -1
        self.now = 0.1
        self.assertEqual(self.monitor.sample()['packets_sent'], 124500)
        self.assertEqual(self.provider.network_reads, 1)
        self.now = 0.5
        self.monitor.sample()
        self.assertEqual(self.provider.network_reads, 2)

    def test_guest_is_not_double_counted_and_iowait_is_idle(self):
        LinuxTimes = namedtuple('LinuxTimes', 'user nice system idle iowait irq softirq steal guest guest_nice')
        self.assertEqual(cpu_snapshot(LinuxTimes(20, 5, 10, 60, 5, 0, 0, 0, 3, 2)), (100, 65))

    def test_reset_and_absent_network_never_fabricate_measurements(self):
        self.monitor.sample()
        self.provider.times = Times(0, 0, 0)
        self.provider.memory = float('nan')
        self.provider.network = None
        self.now = 1
        data = self.monitor.sample()
        self.assertIsNone(data['cpu_percent'])
        self.assertIsNone(data['memory_percent'])
        self.assertIsNone(data['packets_sent'])
        self.assertIsNone(data['packets_recv'])


if __name__ == '__main__':
    unittest.main()
