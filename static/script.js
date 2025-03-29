function updateStats() {
    fetch('/stats')
        .then(response => response.json())
        .then(data => {
            document.getElementById('cpu').textContent = data.cpu_percent;
            document.getElementById('mem').textContent = data.memory_percent;
            document.getElementById('sent').textContent = data.packets_sent;
            document.getElementById('recv').textContent = data.packets_recv;
        });
}

setInterval(updateStats, 1000);
updateStats();
