const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const { decodeSnowflake, cleanSnowflake } = require("../services/snowflakeService");
const { fetchDiscordUser } = require("../services/discordApiService");
const { fetchLanyardPresence } = require("../services/lanyardService");
const { analyzeAccountSafety } = require("../services/defenderService");

const app = express();

// Configuration des middlewares
app.use(cors({ origin: "*" }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques du dashboard Web
app.use(express.static(path.join(__dirname, "../public")));

// Échantillons pour tests rapides
const SAMPLE_IDS = [
  { id: "155149108183695360", name: "Compte 2016 (Vétéran)", desc: "Exemple de compte ancien avec badges" },
  { id: "235148962103951360", name: "Carl-bot (Bot Discord)", desc: "Exemple de robot vérifié Discord" },
  { id: "643945264868098049", name: "Compte Récent (2019)", desc: "Exemple de compte moderne" }
];

/**
 * Route principale d'analyse complète d'un identifiant Discord
 */
app.get("/api/lookup/:id", async (req, res) => {
  try {
    const rawId = req.params.id;
    const botToken = req.query.token || process.env.DISCORD_BOT_TOKEN || null;

    const id = cleanSnowflake(rawId);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Identifiant Discord invalide (doit comporter entre 17 et 20 chiffres)"
      });
    }

    // Récupération des données Discord & Snowflake
    const discordResult = await fetchDiscordUser(id, botToken);
    if (!discordResult.success && !discordResult.snowflake) {
      return res.status(404).json(discordResult);
    }

    const snowflake = discordResult.snowflake || decodeSnowflake(id);
    const user = discordResult.user || null;

    // Analyse de sécurité BOTdefender
    const safety = analyzeAccountSafety(snowflake, user);

    // Récupération présence Lanyard en temps réel (optionnel)
    const lanyard = await fetchLanyardPresence(id);

    return res.json({
      success: true,
      source: discordResult.source || "snowflake_offline",
      message: discordResult.message || "Données récupérées avec succès",
      data: {
        id,
        user,
        snowflake,
        safety,
        lanyard
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Erreur interne du serveur : ${err.message}`
    });
  }
});

/**
 * Route POST d'analyse avec token optionnel dans le corps de la requête
 */
app.post("/api/lookup", async (req, res) => {
  try {
    const { id: rawId, token } = req.body;
    const botToken = token || process.env.DISCORD_BOT_TOKEN || null;

    const id = cleanSnowflake(rawId);
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Identifiant Discord invalide"
      });
    }

    const discordResult = await fetchDiscordUser(id, botToken);
    if (!discordResult.success && !discordResult.snowflake) {
      return res.status(404).json(discordResult);
    }

    const snowflake = discordResult.snowflake || decodeSnowflake(id);
    const user = discordResult.user || null;
    const safety = analyzeAccountSafety(snowflake, user);
    const lanyard = await fetchLanyardPresence(id);

    return res.json({
      success: true,
      source: discordResult.source || "snowflake_offline",
      message: discordResult.message || "Données récupérées avec succès",
      data: {
        id,
        user,
        snowflake,
        safety,
        lanyard
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: `Erreur interne : ${err.message}`
    });
  }
});

/**
 * Route de décodage Snowflake purement mathématique (100% hors ligne)
 */
app.get("/api/decode/:id", (req, res) => {
  const result = decodeSnowflake(req.params.id);
  if (!result.valid) {
    return res.status(400).json(result);
  }
  return res.json({
    success: true,
    data: result
  });
});

/**
 * Route d'échantillons pour démo
 */
app.get("/api/samples", (req, res) => {
  res.json({ success: true, samples: SAMPLE_IDS });
});

/**
 * Santé de l'API
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "BOTdefender-Lookup-API",
    hasBotToken: Boolean(process.env.DISCORD_BOT_TOKEN)
  });
});

module.exports = app;
