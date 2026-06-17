# Instruções do projeto — Cash No Pix

Documentação completa do projeto: ver [`PROJETO.md`](./PROJETO.md). Leia-o antes de mexer no funil.

## 📌 REGRA OBRIGATÓRIA: documentar todo commit + push

**Sempre que fizer um `commit` e `push` de qualquer alteração, documente o que foi feito.** Antes (ou junto)
de subir, atualize o `PROJETO.md`:

1. **Registre o que mudou** na seção apropriada (ou crie uma nova seção/sessão datada): o *quê*, o *porquê*
   e *como* foi resolvido — não só o "o quê".
2. **Adicione a linha do commit** na tabela **"Histórico de Commits Relevantes"** (hash curto + descrição).
3. Se a mudança afetar checkout, gateway, pixels, VSLs ou estrutura de chunks, **atualize as tabelas/seções
   correspondentes** (ex.: "Checkouts Configurados", "Pixels de Rastreamento", "Vídeos VSL").
4. Use a data real da sessão (datas absolutas, não relativas).

Inclua a atualização do `PROJETO.md` **no mesmo push** da alteração sempre que possível, para o histórico e
a documentação andarem juntos.

## Lembretes técnicos rápidos (detalhes no PROJETO.md)

- **Chunks em dois locais:** todo `page-<hash>.js` existe em `funil-2/<page>/js/` **e**
  `funil-2/_next/static/chunks/app/<page>/` — edite os **dois**, idênticos. Confirme qual `page-<hash>.js`
  o `index.html` da página realmente carrega (há chunks órfãos).
- **Sempre** rode `node --check <arquivo>.js` após editar qualquer chunk minificado.
- **Checkout/gateway:** no config das páginas, `pay` = gateway novo (brpix), `disru` = gateway antigo
  (disrupt, descontinuado). O botão usa o gateway antigo se `disru` tiver valor (ignora `pay`). Para usar o
  brpix: `pay` preenchido **e** `disru` vazio. Cada página lê sua própria chave (`up1P/dws1P/up2P/up3P`).
- **Tracking:** rastreador único é o Pixel Utmify `6a32e6e2d07604ad6574982c`. Não reintroduzir Meta/Kwai/Wustats.
- **antidebug.js:** flag `_DISABLED` (true só para testar com DevTools). Garanta `false` antes de subir para produção.
- **Deploy:** push em `main` (remoto `origin` = `assombradev/mycapix`) → a Vercel redeploya sozinha.
