# Monitor do sistema

Painel local de CPU, memória e contadores acumulados de pacotes do computador que executa o servidor. A interface responsiva foi aplicada a partir de frames editáveis no Figma e usa fontes locais DM Sans e Space Grotesk.

## Executar

Validado com Python 3.12. Crie um ambiente isolado e instale o lock de dependências com verificação de hashes:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install --only-binary=:all: --require-hashes -r requirements.lock
.venv\Scripts\python app.py
```

Abra `http://127.0.0.1:5000`. Em Linux/macOS, use `.venv/bin/python` nos comandos. O servidor inicia em loopback com debug desativado. São métricas do servidor, mesmo quando a página é aberta em outro dispositivo.

## Comportamento

- CPU é calculada entre snapshots não bloqueantes compartilhados entre threads; a primeira leitura aparece como indisponível até existir uma segunda amostra.
- CPU/memória têm indicadores; pacotes são contadores acumulados, com o valor completo no rótulo acessível.
- Atualização automática a cada 1, 2 ou 5 segundos, com pausa, retomada e atualização manual mesmo durante pausa.
- Requisições nunca se sobrepõem; timeout e falhas mantêm a última amostra, exibem o erro e permitem nova tentativa.
- Páginas ocultas suspendem a coleta e retomam quando voltam a ficar visíveis.

`monitor.py` concentra snapshots, cache curto e sincronização; `app.py` oferece uma fábrica Flask e `/stats` sem cache; `static/poller.mjs` controla timers, pausa e cancelamento, enquanto `static/script.js` valida e apresenta os dados. Não há banco, armazenamento de histórico ou serviço externo.

```powershell
.venv\Scripts\python -m unittest discover -s tests -v
node --test tests/poller.test.mjs
```

Seis testes Python cobrem amostragem, cache, contadores, primeiro dado e contrato HTTP. Cinco testes Node cobrem concorrência, pausa, ocultação, recuperação, timeout e compatibilidade de timers com o navegador. A passagem Playwright e as capturas da revisão ficam registradas na memória técnica.

`requirements.txt` fixa as dependências diretas; `requirements.lock` inclui versões transitivas e hashes dos artefatos oficiais. Licença MIT em `LICENSE`; licenças OFL em `static/fonts/`. Memória técnica: `docs/ai-context/QUALITY_REFRESH.md`.
