/**
 * Configuração do Express:
 * - Body parser JSON
 * - Rotas agregadas em /
 * - Documentação Swagger em /api-docs (UI) e /api-docs.json (raw)
 * - Middleware central de erros
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yaml = require('yamljs');

const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Habilita CORS para o frontend (Vite roda em 5173 por padrão).
app.use(cors());
app.use(express.json());

// Carrega o documento Swagger a partir de /resources.
const swaggerDocument = yaml.load(
  path.join(__dirname, '..', 'resources', 'swagger.yaml')
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (req, res) => res.json(swaggerDocument));

// Rotas da aplicação.
app.use('/', routes);

// Rota não encontrada.
app.use((req, res) => {
  res
    .status(404)
    .json({ error: 'NotFound', message: `Rota ${req.method} ${req.originalUrl} não existe.` });
});

// Middleware central de erros.
app.use(errorHandler);

module.exports = app;
