require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType
} = require("discord.js");
const { generateLookupResponse } = require("./commands/lookup");
const { generateCheckResponse } = require("./commands/check");
const { generateSnowflakeResponse } = require("./commands/snowflake");
const { cleanSnowflake } = require("../services/snowflakeService");

// Définition des commandes Slash
const commands = [
  new SlashCommandBuilder()
    .setName("lookup")
    .setDescription("🔍 Recherche et affiche les données complètes d'un utilisateur Discord par ID ou mention")
    .addStringOption(option =>
      option
        .setName("utilisateur")
        .setDescription("ID Discord (Snowflake) ou mention (@utilisateur)")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("check")
    .setDescription("🛡️ Audit de sécurité et analyse Anti-Raid BOTdefender")
    .addStringOption(option =>
      option
        .setName("utilisateur")
        .setDescription("ID Discord ou mention à vérifier")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("snowflake")
    .setDescription("⚙️ Analyse technique détaillée des 64 bits du Snowflake Discord")
    .addStringOption(option =>
      option
        .setName("id")
        .setDescription("ID Snowflake Discord")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("🖼️ Affiche et permet de télécharger l'avatar HD d'un utilisateur")
    .addStringOption(option =>
      option
        .setName("utilisateur")
        .setDescription("ID Discord ou mention")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("banner")
    .setDescription("🎨 Affiche et permet de télécharger la bannière HD d'un utilisateur")
    .addStringOption(option =>
      option
        .setName("utilisateur")
        .setDescription("ID Discord ou mention")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

/**
 * Enregistre les commandes Slash auprès de l'API Discord
 * @param {string} token
 * @param {string} clientId
 */
async function registerSlashCommands(token, clientId) {
  try {
    const rest = new REST({ version: "10" }).setToken(token);
    console.log("🔄 Enregistrement des commandes Slash globales...");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅ Commandes Slash enregistrées avec succès !");
  } catch (err) {
    console.error("⚠️ Impossible d'enregistrer les commandes Slash :", err.message);
  }
}

/**
 * Initialise le bot Discord
 * @param {string} [token]
 * @returns {Client}
 */
function startBot(token = null) {
  const botToken = token || process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.log("ℹ️ Aucun DISCORD_BOT_TOKEN renseigné. Le bot Discord ne sera pas démarré.");
    return null;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once("ready", async () => {
    console.log(`\n🤖 BOTdefender connecté en tant que : ${client.user.tag}`);
    console.log(`🛡️ Prêt à surveiller et analyser les identifiants Discord.`);

    client.user.setActivity("!lookup <ID> | /lookup", { type: ActivityType.Watching });

    if (process.env.DISCORD_CLIENT_ID || client.user.id) {
      await registerSlashCommands(botToken, process.env.DISCORD_CLIENT_ID || client.user.id);
    }
  });

  // Gestion des interactions Slash commands
  client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    await interaction.deferReply();

    try {
      const targetInput = interaction.options.getString("utilisateur") || interaction.options.getString("id");
      const targetId = cleanSnowflake(targetInput);

      if (!targetId) {
        return interaction.editReply({
          content: "❌ Veuillez fournir un ID Discord valide comportant entre 17 et 20 chiffres."
        });
      }

      if (commandName === "lookup" || commandName === "avatar" || commandName === "banner") {
        const replyData = await generateLookupResponse(targetId, botToken);
        await interaction.editReply(replyData);
      } else if (commandName === "check") {
        const replyData = await generateCheckResponse(targetId, botToken);
        await interaction.editReply(replyData);
      } else if (commandName === "snowflake") {
        const replyData = generateSnowflakeResponse(targetId);
        await interaction.editReply(replyData);
      }
    } catch (err) {
      console.error("Erreur commande slash:", err);
      await interaction.editReply({
        content: `❌ Une erreur est survenue lors du traitement : ${err.message}`
      });
    }
  });

  // Gestion des commandes avec préfixe (!lookup, !check, !userinfo, !whois, !snowflake)
  const prefix = process.env.BOT_PREFIX || "!";
  client.on("messageCreate", async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (["lookup", "userinfo", "whois", "find"].includes(command)) {
      const targetInput = args[0] || (message.mentions.users.first()?.id) || message.author.id;
      const targetId = cleanSnowflake(targetInput);

      if (!targetId) {
        return message.reply(`❌ Syntaxe : \`${prefix}${command} <ID ou @mention>\``);
      }

      const replyData = await generateLookupResponse(targetId, botToken);
      return message.reply(replyData);
    }

    if (["check", "audit", "security", "scan"].includes(command)) {
      const targetInput = args[0] || (message.mentions.users.first()?.id) || message.author.id;
      const targetId = cleanSnowflake(targetInput);

      if (!targetId) {
        return message.reply(`❌ Syntaxe : \`${prefix}check <ID ou @mention>\``);
      }

      const replyData = await generateCheckResponse(targetId, botToken);
      return message.reply(replyData);
    }

    if (["snowflake", "sf", "decode"].includes(command)) {
      const targetInput = args[0] || message.author.id;
      const targetId = cleanSnowflake(targetInput);

      if (!targetId) {
        return message.reply(`❌ Syntaxe : \`${prefix}snowflake <ID>\``);
      }

      const replyData = generateSnowflakeResponse(targetId);
      return message.reply(replyData);
    }
  });

  client.login(botToken).catch(err => {
    console.error("❌ Échec de connexion du bot Discord :", err.message);
  });

  return client;
}

// Lancement direct si exécuté comme script principal
if (require.main === module) {
  startBot();
}

module.exports = {
  startBot
};
