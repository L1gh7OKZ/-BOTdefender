#!/usr/bin/env node

/**
 * Outil CLI BOTdefender : Recherche OSINT par ID Discord
 * Usage : node cli/lookup.js <ID_DISCORD> [--token <TOKEN>] [--json]
 */

require("dotenv").config();
const { decodeSnowflake, cleanSnowflake } = require("../src/services/snowflakeService");
const { fetchDiscordUser } = require("../src/services/discordApiService");
const { analyzeAccountSafety } = require("../src/services/defenderService");
const { fetchLanyardPresence } = require("../src/services/lanyardService");

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
🛡️  BOTdefender CLI - Recherche OSINT Discord par ID

Usage :
  node cli/lookup.js <ID_DISCORD> [options]

Options :
  --token <BOT_TOKEN>    Spécifier un token de bot Discord
  --json                 Afficher le résultat au format JSON brut
  --help, -h             Afficher cette aide

Exemples :
  node cli/lookup.js 155149108183695360
  node cli/lookup.js 155149108183695360 --json
  node cli/lookup.js 155149108183695360 --token MTAx...
`);
}

async function run() {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const isJson = args.includes("--json");
  let token = process.env.DISCORD_BOT_TOKEN || null;

  const tokenIndex = args.indexOf("--token");
  if (tokenIndex !== -1 && args[tokenIndex + 1]) {
    token = args[tokenIndex + 1];
  }

  const rawId = args.find(a => !a.startsWith("--") && a !== token);
  const id = cleanSnowflake(rawId);

  if (!id) {
    console.error("❌ Erreur : Veuillez fournir un identifiant Discord valide (17-20 chiffres).");
    process.exit(1);
  }

  const result = await fetchDiscordUser(id, token);
  const snowflake = result.snowflake || decodeSnowflake(id);
  const user = result.user || null;
  const safety = analyzeAccountSafety(snowflake, user);
  const lanyard = await fetchLanyardPresence(id);

  const fullData = {
    id,
    user,
    snowflake,
    safety,
    lanyard
  };

  if (isJson) {
    console.log(JSON.stringify(fullData, null, 2));
    process.exit(0);
  }

  // Affichage formaté console
  console.log("\n" + "═".repeat(60));
  console.log("🛡️  BOTdefender • Rapport OSINT Discord");
  console.log("═".repeat(60));

  console.log(`\n📌 INFORMATIONS UTILISATEUR :`);
  console.log(`  • ID Discord       : ${id}`);
  console.log(`  • Pseudo / Tag     : ${user?.tag || `@Utilisateur_${id.slice(-4)}`}`);
  console.log(`  • Nom d'affichage  : ${user?.globalName || "Non défini"}`);
  console.log(`  • Type de Compte   : ${user?.isBot ? "🤖 Bot Discord" : (user?.isSystem ? "⚙️ Système" : "👤 Humain")}`);

  console.log(`\n📅 HORODATAGE & CRÉATION (SNOWFLAKE) :`);
  console.log(`  • Date de Création : ${snowflake.createdAtFr}`);
  console.log(`  • Ancienneté       : ${snowflake.age.formattedFr} (${snowflake.age.totalDays} jours)`);
  console.log(`  • Tag Discord      : ${snowflake.discordTags.fullDate} (${snowflake.discordTags.relative})`);
  console.log(`  • Worker / Process : Worker #${snowflake.internals.workerId} | Process #${snowflake.internals.processId}`);

  console.log(`\n🏆 BADGES DISCORD :`);
  if (user?.badges && user.badges.length > 0) {
    user.badges.forEach(b => {
      console.log(`  ${b.emoji}  ${b.labelFr} (${b.id})`);
    });
  } else {
    console.log(`  (Aucun badge public)`);
  }

  console.log(`\n🛡️ ANALYSE SÉCURITÉ BOTDEFENDER :`);
  console.log(`  • Score de Sécurité : ${safety.safetyScore}/100`);
  console.log(`  • Statut de Risque  : ${safety.riskLabelFr}`);
  console.log(`  • Recommandation   : ${safety.recommendationsFr[0] || "Aucun risque"}`);

  if (user?.avatar?.main) {
    console.log(`\n🖼️ RESSOURCES HD :`);
    console.log(`  • Avatar   : ${user.avatar.main}`);
    if (user.banner?.hasBanner && user.banner.main) {
      console.log(`  • Bannière : ${user.banner.main}`);
    }
  }

  if (lanyard && lanyard.available) {
    console.log(`\n📡 PRÉSENCE EN DIRECT (LANYARD) :`);
    console.log(`  • Statut   : ${lanyard.status.toUpperCase()}`);
    if (lanyard.customStatus?.text) {
      console.log(`  • Statut Perso : ${lanyard.customStatus.text}`);
    }
    if (lanyard.spotify?.active) {
      console.log(`  • Spotify  : ${lanyard.spotify.track} - ${lanyard.spotify.artist}`);
    }
  }

  console.log("\n" + "═".repeat(60) + "\n");
}

run().catch(err => {
  console.error("❌ Erreur inattendue :", err.message);
  process.exit(1);
});
