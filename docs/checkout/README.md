# 🧩 Checkout próprio — Projeto

Construção de um **checkout próprio** com integração direta a uma **API PIX** (intermediadora da
holding brpix, somente API, sem checkout). Objetivo: resolver o tracking de UTMs na Utmify e ter
controle total do fluxo de pagamento, substituindo os links `/c/...` em **todo o funil**.

## Fases

1. ✅ **Análise de brand** — ver [`../BRAND.md`](../BRAND.md)
2. ⬜ **Lógica do checkout** — fluxo de dados, estados, criação de cobrança PIX, polling de status,
   webhook, envio de UTMs à Utmify *(próxima)*
3. ⬜ **UX do checkout** — jornada do usuário, telas, estados de erro/loading/sucesso
4. ⬜ **UI do checkout** — implementação visual seguindo o `BRAND.md`
5. ⬜ **Integração da API PIX** — usando a documentação da intermediadora

## Onde colar os materiais

| Material | Pasta |
|---|---|
| 📄 Documentação da **API PIX** da intermediadora (PDF, .md, JSON, prints) | `docs/checkout/referencias/api-pix/` |
| 🎨 Referências / skills de **UI/UX** (se NÃO forem skills do Claude Code) | `docs/checkout/referencias/ux/` |
| 🛠️ **Skills do Claude Code** (pastas com `SKILL.md`) | `.claude/skills/` |

> Se não tiver certeza se o que você tem é uma "skill do Claude Code" ou só material de
> referência, ver a nota em `.claude/skills/LEIA-ME.md`.
