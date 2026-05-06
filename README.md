# 🛒 SmartMarket Estimator

O **SmartMarket Estimator** é uma aplicação inteligente projetada para ajudar consumidores a estimarem o custo total de suas compras em tempo real. Utilizando a potência da **IA Gemini 2.0** e persistência de dados com **Neon PostgreSQL**, ele oferece uma experiência fluida e moderna tanto no desktop quanto no celular.

## ✨ Funcionalidades

- 🧠 **Busca de Preços via IA**: Utiliza o Google Gemini 2.0 para pesquisar preços médios de mercado na internet em tempo real.
- 💾 **Persistência em Nuvem**: Carrinho sincronizado com banco de dados Neon PostgreSQL (seus itens não somem ao atualizar a página).
- 📱 **Design Totalmente Responsivo**: Interface premium otimizada para computadores, tablets e smartphones.
- 🛒 **Gerenciamento de Carrinho**: Adição rápida de itens, controle de quantidade e edição manual de preços quando necessário.
- 🔗 **Fontes de Grounding**: Exibe os links das pesquisas realizadas pela IA para maior transparência.

## 🚀 Tecnologias Utilizadas

- **Frontend**: React + Vite + TypeScript
- **Estilização**: CSS Vanilla (Design Moderno & Glassmorphism)
- **Ícones**: Heroicons
- **IA**: Google Generative AI (Gemini 2.0 Flash)
- **Backend**: Node.js + Express
- **Banco de Dados**: Neon PostgreSQL (Serverless)

## 🛠️ Como Executar

### Pré-requisitos
- Node.js instalado
- Chave de API do Google Gemini
- URL de conexão do Neon PostgreSQL

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/MBARUDI/Smartmarlet.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` na raiz do projeto:
   ```env
   VITE_GEMINI_API_KEY=sua_chave_aqui
   DATABASE_URL=sua_url_do_neon_aqui
   ```

### Executando o Projeto

1. Inicie o servidor backend:
   ```bash
   npm run server
   ```

2. Inicie o frontend (em outro terminal):
   ```bash
   npm run dev
   ```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---
Desenvolvido com ❤️ por [MBARUDI](https://github.com/MBARUDI)
