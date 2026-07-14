# Fluxo n8n — Parcerias COCCS

Serve os dados do painel "Parcerias e Convênios em Andamento"
(`assets/js/parcerias.js`) a partir da planilha Excel no SharePoint/OneDrive,
por um webhook que o site consulta a cada carregamento.

## Como o fluxo funciona

Um único gatilho, sem cache/estado compartilhado — cada chamada ao webhook
lê a planilha na hora:

```
[Webhook GET /parcerias-coccs] → [Ler planilha] → [Normalizar colunas] → [Responder com JSON]
```

Cada requisição ao webhook lê a planilha do SharePoint e normaliza as colunas
na hora, então a resposta reflete sempre o estado mais atual da planilha (sem
precisar de gatilho diário nem de esperar até o dia seguinte pra ver uma
atualização).

> Uma versão anterior deste fluxo usava um gatilho diário separado que
> gravava um "instantâneo" em `$getWorkflowStaticData` e o webhook só lia
> esse cache. Essa abordagem foi abandonada: execuções manuais/de teste no
> editor do n8n não persistem esse dado de forma confiável entre gatilhos
> diferentes do mesmo workflow, o que causava o webhook responder vazio
> mesmo depois do gatilho diário "ter salvo" os dados. Ler a planilha direto
> a cada chamada é mais simples e não depende desse comportamento.

## Passo a passo para importar

1. No n8n, vá em **Workflows → Import from File** e selecione
   `n8n/parcerias-coccs.workflow.json`.
2. Abra o nó **"Ler planilha (SharePoint/OneDrive)"**:
   - Selecione sua credencial Microsoft já configurada.
   - **Resource**: `Table` (os dados estão numa Tabela do Excel dentro da
     aba "Dados" — usar `Sheet`/`Worksheet` aqui só lista as abas, não as
     linhas).
   - No campo **Workbook**, escolha "Parcerias em andamento".
   - No campo **Table**, troque para "From list" e escolha a tabela da aba
     "Dados".
   - Confira o **Operation** — deve estar em "Get Rows"/"Get Many"; se o
     n8n mostrar um nome diferente na sua versão, é só trocar nesse
     dropdown.
3. Abra o nó **"Webhook (GET /parcerias-coccs)"** e copie a **Production
   URL** (algo como `https://SEU-N8N.dominio.com/webhook/parcerias-coccs`).
4. Cole essa URL em [`assets/js/parcerias-data.js`](../assets/js/parcerias-data.js),
   na constante `PARCERIAS_N8N_URL` (linha 2), no lugar do placeholder
   `https://SEU-N8N.dominio.com/webhook/parcerias-coccs`.
5. **Ative o workflow** (toggle no canto superior direito) — sem isso a
   Production URL não fica disponível.
6. Teste: abra a Production URL do webhook direto no navegador — deve
   devolver um array JSON com os processos (a cada chamada, o fluxo lê a
   planilha na hora, então pode levar alguns segundos pra responder).

## Colunas da planilha (confirmadas na base real)

| Coluna na planilha "Dados" | Campo no site |
|---|---|
| Ordem Numérica | `ordem` |
| Data recebimento da demanda na COCCS *(serial do Excel — convertido para dd/mm/aaaa)* | `dataRec` |
| N° Processo Administrativo | `processo` |
| Objeto | `objeto` |
| Partes | `partes` |
| Demandante | `demandante` |
| Status | `status` |
| — *(não existe coluna Grupo)* | `grupo` — derivado do Status, veja abaixo |
| Urgência (Sim/Não) | `urgente` |
| Tipo (Interno/Externo) | `tipo` |
| Tipo de instrumento | `tipoInstr` |
| Qualquer coluna cujo nome contenha "manifesta" (ex: "Planejamento (manifestação e instrução do processo)") | `andamento` |

Como a coluna **Grupo** não existe na planilha, o fluxo deriva automaticamente
a etapa (Planejamento / Diligência / Parecer-Autorização / Assinatura /
Finalizado) a partir dos dois primeiros dígitos do **Status** (ex: "03- ..."
→ Diligência). Ajuste o mapa `STATUS_GRUPO` no nó "Normalizar colunas" se
os códigos de status da planilha mudarem.

A planilha parece ter uma coluna de observações por etapa (a que vimos se
chama "Planejamento (manifestação e instrução do processo)"); o código
procura qualquer coluna cujo nome contenha "manifesta" e usa a primeira
preenchida. Se existirem colunas assim para as outras etapas (Diligência,
Assinatura etc.) com nomes parecidos, elas já são cobertas pela mesma regra
— não precisa listar uma por uma.

## Se algo não bater na sua versão do n8n

Os nomes de alguns campos (nó do Excel, Respond to Webhook) podem variar
levemente entre versões do n8n. Se algum nó abrir com um aviso de campo
inválido depois do import, normalmente é só reselecionar a opção certa num
dropdown — a lógica (os nós de código) não muda.
