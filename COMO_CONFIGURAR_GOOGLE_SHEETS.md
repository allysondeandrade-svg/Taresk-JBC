# 🚀 Guia de Conexão: Taresk + Google Sheets (Banco de Dados)

O arquivo [`google_apps_script_backend.js`](file:///c:/Users/allys/OneDrive/Área%20de%20Trabalho/JBC%20ELETRO/APPS/Taresk/google_apps_script_backend.js) foi criado para funcionar como a API e banco de dados completo do Taresk.

---

### Passo 1: Criar a Planilha no Google Drive
1. Acesse o [Google Sheets](https://sheets.new) e crie uma nova planilha.
2. Dê o nome que desejar, por exemplo: `Taresk_JBC_Eletro`.

### Passo 2: Adicionar o Código do Apps Script
1. No menu superior da planilha, clique em **Extensões** > **Apps Script**.
2. Apague o código padrão que estiver lá e cole todo o conteúdo do arquivo [`google_apps_script_backend.js`](file:///c:/Users/allys/OneDrive/Área%20de%20Trabalho/JBC%20ELETRO/APPS/Taresk/google_apps_script_backend.js).
3. Salve o projeto (ícone de disquete ou `Ctrl + S`).

### Passo 3: Criar as Abas Automaticamente
1. No topo do editor do Apps Script, selecione a função **`setupSheets`** no menu dropdown.
2. Clique no botão **Executar**.
3. Na primeira vez, o Google pedirá autorização:
   - Clique em **Revisar permissões**.
   - Escolha sua conta Google.
   - Clique em **Avançado** > **Acessar (não seguro)**.
   - Clique em **Permitir**.
4. Volte na sua planilha: você verá que as 4 abas foram criadas e formatadas automaticamente:
   - 📑 **Usuarios**: ID, Nome, Email, Senha, Cargo, Avatar, Badge
   - 📦 **Produtos**: SKU, Titulo, Custo, Largura, Comprimento, Altura, Peso
   - ✅ **Tarefas**: ID, Tipo, ProdutoID, Titulo, Responsável, Prazo, Status, Marketplaces, Checklists
   - 💰 **Precificadora**: Plataforma, Taxa %, Taxa Fixa, Frete Padrão

---

### Passo 4: Publicar o Web App
1. No canto superior direito do Apps Script, clique no botão azul **Implantar** > **Nova implantação**.
2. Clique no ícone de engrenagem ao lado de "Selecionar tipo" e escolha **App da Web**.
3. Configure os campos:
   - **Descrição**: `API Taresk Produção`
   - **Executar como**: `Eu (seu e-mail)`
   - **Quem pode acessar**: `Qualquer pessoa` *(Isso permite que o app Web sincronize dados sem bloqueio)*.
4. Clique em **Implantar**.
5. Copie a **URL do app da web** gerada (ela termina com `/exec`).

---

### Passo 5: Conectar ao Aplicativo Taresk
Com a URL copiada, a integração no aplicativo sincroniza automaticamente:
- Criação e edição de tarefas (Shopee, Mercado Livre, Amazon, Magalu).
- Atualização do checklist de fotos e descrições.
- Cadastro e cálculo de dimensões de novos produtos na tabela.
- Relatório de produtividade de todos os usuários.
