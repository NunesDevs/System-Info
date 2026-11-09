# Memória técnica — Monitor do sistema

Revisão:2026-11-08. Este arquivo descreve a versão validada e atualiza os registros automáticos históricos.

Design Figma 61:470/512/555/601 aplicado; cartões61:449 e status61:456. Amostragem sem intervalo bloqueante, com deltas de CPU compartilhados entre threads e cache mínimo de0,5s; primeira CPU não é inventada como0. Contadores de rede vêm do mesmo snapshot. Poller serial com pausa/manual, intervalo, timeout, suspensão em aba oculta e recuperação preservando última amostra. O QA real encontrou Illegal invocation nos timers do browser; chamadas foram desacopladas do receiver e uma regressão reproduz esse contrato. Seis testes Python/API e cinco Node passaram.

Ambientes Python3.12 isolados por aplicativo; wheels oficiais PyPI verificados por SHA256 antes de instalar, dependências fixadas em requirements.lock e pip check aprovado. Flask3.1.3, psutil7.2.2 quando aplicável, Werkzeug3.1.9, Jinja2 3.1.6, MarkupSafe3.0.4, click8.5.1, blinker1.9.0 e itsdangerous2.2.0. Fontes locais com licenças OFL; código autoral MIT autorizado.

Playwright: dois fluxos funcionais no lote e oito larguras por aplicativo (320/360/390/430/768/1024/1440/1920), fontes carregadas, sem overflow ou erros inesperados. Falhas HTTP503 foram injetadas deliberadamente só nos testes de recuperação e registradas separadamente. Capturas finais usam dados reais e nenhuma informação pessoal; o chat usa o próprio FAQ demonstrativo. Servidores de teste em loopback e browser encerrados.

Não houve conexão a banco, migração, seed, envio externo de mensagens ou publicação de métricas em servidor público. Distribuição apropriada: pacote do app local com dependências verificáveis. Commit/push/integração FF-only e release autorizados pelo titular nesta sessão.
