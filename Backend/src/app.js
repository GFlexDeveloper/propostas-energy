<<<<<<< HEAD
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const propostasRoutes = require('./routes/propostas.routes');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', healthRoutes);
app.use('/api/usuarios', authRoutes);

app.use('/api/propostas', propostasRoutes);


app.use(errorMiddleware);

module.exports = app;
=======
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const propostasRoutes = require('./routes/propostas.routes');
const { errorMiddleware } = require('./middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', healthRoutes);
app.use('/api/usuarios', authRoutes);

app.use('/api/propostas', propostasRoutes);


app.use(errorMiddleware);

module.exports = app;
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
