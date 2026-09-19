require("dotenv").config();
const http = require("http");
const app = require("./api");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  BOTdefender - Serveur Web OSINT & API Discord`);
  console.log(`======================================================`);
  console.log(`🚀 Interface Web accessible sur : http://${HOST}:${PORT}`);
  console.log(`📡 Point d'API REST : http://${HOST}:${PORT}/api/lookup/:id`);
  console.log(`🔑 Token Bot Discord : ${process.env.DISCORD_BOT_TOKEN ? "Configuré ✅" : "Non configuré (Mode Snowflake & Lanyard)"}`);
  console.log(`======================================================\n`);
});

module.exports = server;
