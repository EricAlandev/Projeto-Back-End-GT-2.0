Este projeto é uma API backend desenvolvida com Node.js, Express, Sequelize e MySQL. 
Ele é estruturado seguindo o padrão MVC (Model-View-Controller) e tem como objetivo fornecer uma base para gerenciamento de 
usuários, produtos, categorias, imagens e opções de produto, com autenticação JWT e upload de imagens via base64.

📚 Seções do Projeto

1. Autenticação (JWT)

Rota de login com geração de token JWT.

Middleware de autenticação para proteger rotas sensíveis.

2. Usuários

Cadastro, edição, exclusão e busca por ID.

Senhas criptografadas com bcrypt.

3. Categorias

CRUD completo com proteção por token.

Filtro por nome via GET /category/search.

4. Produtos

CRUD completo.

Upload de imagens em base64 com salvamento local.

Vínculo com categorias (N:N), imagens (1:N) e opções (1:N).

Suporte a opções com valores em array ou string.

Edição e remoção de imagens/opções no PUT.

5. Relacionamentos

Product <-> Category (N:N via tabela product_categories)

Product -> ProductImage (1:N)

Product -> ProductOption (1:N) 



--------------

**Rotas Principais**

Usuários (/v1/user)

POST /user - Cadastrar

POST /user/token - Login

GET /user/:id - Buscar por ID

PUT /user/:id - Atualizar (requer token)

DELETE /user/:id - Remover (requer token)

Categorias (/v1/category)

POST /category - Criar (token)

GET /category/:id - Buscar por ID

GET /category/search?name=algo - Buscar por nome

PUT /category/:id - Atualizar (token)

DELETE /category/:id - Deletar (token)

Produtos (/v1/product)

POST /product - Criar (token)

PUT /product/:id - Atualizar (token)

GET /product/:id - Buscar detalhes

GET /product/search?name=algo - Filtros diversos (em implementação)

DELETE /product/:id - Remover (token)

