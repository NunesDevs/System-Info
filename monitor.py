import psutil

def get_system_stats():
    return {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "packets_sent": psutil.net_io_counters().packets_sent,
        "packets_recv": psutil.net_io_counters().packets_recv
    }

if __name__ == "__main__":
    print(get_system_stats())
