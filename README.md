# System-Info

Painel web de CPU, memória e pacotes de rede do computador que executa o servidor Flask.

## Funcionalidades verificadas

- Percentual de CPU.
- Uso percentual de memória.
- Pacotes de rede enviados e recebidos.
- Atualização dos indicadores via API /stats.

## Operação e arquitetura verificadas

monitor.py consulta psutil e app.py publica /stats e template HTML. As métricas correspondem ao servidor, não ao computador do visitante.

Arquivos principais: `app.py`, `monitor.py`, `static/script.js`.

### Requisitos e execução

Python 3, Flask e psutil.

```text
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python app.py
```



### Testes e estado

Não foi identificada uma suíte automatizada específica para os fluxos descritos; valide a execução e os casos de borda antes de publicar.

Estado: projeto de estudo/experimental. Deploy ativo não foi confirmado nesta revisão.

### Limitações conhecidas

- Não há autenticação para métricas.
- A chamada psutil.cpu_percent(interval=1) bloqueia a requisição por um segundo.
- Servidor debug é apenas para desenvolvimento.

### Licença e manutenção

Nenhum arquivo de licença foi identificado nesta revisão; não foi adicionada uma nova licença. Atualize comandos e limitações quando houver mudança de comportamento.
