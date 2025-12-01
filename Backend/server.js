<<<<<<< HEAD
const app = require("./src/app");
const { PORT } = require("./src/config/env");
const { initDatabase } = require("./src/config/database");

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () =>
      console.log(`${PORT}`)
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
=======
const app = require("./src/app");
const { PORT } = require("./src/config/env");
const { initDatabase } = require("./src/config/database");

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () =>
      console.log(`🚀 Servidor rodando na porta ${PORT}`)
    );
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
>>>>>>> b52c59025a5e31c6d8b81637195ee70976af80b7
