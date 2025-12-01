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
