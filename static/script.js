import { Poller } from './poller.mjs';

const percentFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat('pt-BR');
const compactFormatter = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const timeFormatter = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const get = id => document.getElementById(id);
const write = (element, value) => { if (element.textContent !== value) element.textContent = value; };
let lastUpdate = '';

function renderStats(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid stats');
    for (const key of ['cpu_percent', 'memory_percent']) {
        if (data[key] !== null && (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0 || data[key] > 100)) throw new Error('Invalid percentage');
    }
    for (const key of ['packets_sent', 'packets_recv']) {
        if (data[key] !== null && (!Number.isSafeInteger(data[key]) || data[key] < 0)) throw new Error('Invalid counter');
    }
    const date = new Date(data.sampled_at * 1000);
    if (typeof data.sampled_at !== 'number' || !Number.isFinite(date.getTime())) throw new Error('Invalid timestamp');
    for (const [id, key, label] of [['cpu', 'cpu_percent', 'CPU'], ['mem', 'memory_percent', 'Memória']]) {
        const value = data[key];
        write(get(id), value === null ? '—' : percentFormatter.format(value) + '%');
        get(id).setAttribute('aria-label', label + ': ' + (value === null ? 'leitura indisponível' : percentFormatter.format(value) + '%'));
        get(id + '_gauge').hidden = value === null;
        if (value !== null) get(id + '_gauge').value = value;
    }
    for (const [id, key, label] of [['sent', 'packets_sent', 'Pacotes enviados'], ['recv', 'packets_recv', 'Pacotes recebidos']]) {
        const value = data[key];
        write(get(id), value === null ? '—' : (value >= 1000000 ? compactFormatter : integerFormatter).format(value));
        get(id).setAttribute('aria-label', label + ': ' + (value === null ? 'leitura indisponível' : integerFormatter.format(value)));
    }
    lastUpdate = data.cpu_percent === null ? 'Aguardando a primeira amostra de CPU.' : 'Atualizado às ' + timeFormatter.format(date) + '.';
}

const poller = new Poller({
    interval: () => Number(get('interval').value),
    hidden: () => document.hidden,
    request: async signal => {
        const response = await fetch(document.body.dataset.statsUrl, { signal, cache: 'no-store' });
        if (!response.ok) throw new Error('Request failed');
        return response.json();
    },
    render: renderStats,
    onState: state => {
        const connection = get('connection');
        const mode = state.paused ? 'paused' : state.error ? 'error' : state.hasData ? 'live' : 'loading';
        connection.dataset.state = mode;
        write(connection, mode === 'paused' ? 'Atualização pausada' : mode === 'error' ? 'Sem atualização' : mode === 'live' ? 'Em tempo real' : 'Coletando métricas…');
        write(get('pause'), poller.paused ? 'Retomar' : 'Pausar');
        get('pause').setAttribute('aria-pressed', String(poller.paused));
        get('refresh').disabled = state.busy;
        get('error').hidden = !state.error;
        write(get('updated'), state.paused ? 'A atualização automática está pausada.' : state.error ? state.hasData ? lastUpdate + ' Última amostra antes da falha.' : 'Nenhuma amostra foi recebida.' : lastUpdate || 'Aguardando a primeira amostra.');
    },
});
get('pause').addEventListener('click', () => poller.setPaused(!poller.paused));
get('refresh').addEventListener('click', () => poller.update({ manual: true }));
get('interval').addEventListener('change', () => poller.intervalChanged());
document.addEventListener('visibilitychange', () => poller.visibilityChanged());
window.addEventListener('pagehide', () => poller.stop());
window.addEventListener('pageshow', event => { if (event.persisted) poller.start(); });
poller.start();
