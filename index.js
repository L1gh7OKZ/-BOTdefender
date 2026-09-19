/**
 * BOTdefender - Point d'entrée principal
 * Lance l'interface Web, l'API REST et le Bot Discord
 */

require("dotenv").config();
const http = require("http");
const app = require("./src/server/api");
const { startBot } = require("./src/bot/bot");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🛡️  BOTdefender v1.0.0                     ║
║         Outil de Recherche OSINT & Défense par ID Discord    ║
╚══════════════════════════════════════════════════════════════╝

  🌐 Dashboard Web   : http://${HOST}:${PORT}
  📡 API REST        : http://${HOST}:${PORT}/api/lookup/:id
  ⚡ Décodeur 100%   : http://${HOST}:${PORT}/api/decode/:id
  🤖 Bot Discord     : ${process.env.DISCORD_BOT_TOKEN ? "Démarrage en cours..." : "En attente de token (Mode Web / CLI actif)"}

════════════════════════════════════════════════════════════════
`);

  // Démarrage du bot Discord si le token est présent
  if (process.env.DISCORD_BOT_TOKEN) {
    try {
      startBot();
    } catch (err) {
      console.error("⚠️ Erreur au démarrage du bot Discord :", err.message);
    }
  }
});

module.exports = server;
