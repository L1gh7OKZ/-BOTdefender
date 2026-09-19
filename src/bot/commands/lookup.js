const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { fetchDiscordUser } = require("../../services/discordApiService");
const { analyzeAccountSafety } = require("../../services/defenderService");
const { fetchLanyardPresence } = require("../../services/lanyardService");

/**
 * Génère l'embed et les boutons d'action pour la commande lookup
 * @param {string} targetId
 * @param {string} [token]
 * @returns {Promise<Object>}
 */
async function generateLookupResponse(targetId, token = null) {
  const result = await fetchDiscordUser(targetId, token);
  if (!result.success && !result.snowflake) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle("❌ Erreur de recherche")
          .setDescription(result.error || "Impossible de trouver cet utilisateur Discord.")
          .setTimestamp()
      ]
    };
  }

  const { snowflake, user } = result;
  const safety = analyzeAccountSafety(snowflake, user);
  const lanyard = await fetchLanyardPresence(targetId);

  // Construction de l'embed Discord
  const embed = new EmbedBuilder()
    .setColor(user?.accentColor || 0x5865F2)
    .setTitle(`🔍 OSINT Lookup : ${user?.globalName || user?.username || `Utilisateur ${targetId}`}`)
    .setDescription(`**Identifiant Discord :** \`${snowflake.id}\`\n**Mention :** <@${snowflake.id}>`)
    .setThumbnail(user?.avatar?.main || `https://cdn.discordapp.com/embed/avatars/0.png`)
    .addFields(
      {
        name: "📅 Date de Création (Snowflake)",
        value: `${snowflake.discordTags.fullDate}\n${snowflake.discordTags.relative}`,
        inline: true
      },
      {
        name: "⏳ Âge du Compte",
        value: `\`${snowflake.age.formattedFr}\`\n(${snowflake.age.totalDays} jours)`,
        inline: true
      },
      {
        name: "🤖 Type de Compte",
        value: user?.isBot ? "🤖 **Robot Discord**" : (user?.isSystem ? "⚙️ **Compte Système**" : "👤 **Utilisateur Humain**"),
        inline: true
      }
    );

  // Badges
  if (user?.badges && user.badges.length > 0) {
    const badgeText = user.badges.map(b => `${b.emoji} **${b.labelFr}**`).join("\n");
    embed.addFields({
      name: `🏆 Badges Publics (${user.badges.length})`,
      value: badgeText,
      inline: false
    });
  }

  // Évaluation de sécurité BOTdefender
  embed.addFields({
    name: "🛡️ Analyse Sécurité BOTdefender",
    value: `**Score de Confiance :** \`${safety.safetyScore}/100\`\n**Niveau de Risque :** ${safety.riskLabelFr}\n${safety.recommendationsFr[0] || "Aucune anomalie"}`,
    inline: false
  });

  // Présence en direct si disponible
  if (lanyard && lanyard.available) {
    let presenceDesc = `**Statut :** ${lanyard.status.toUpperCase()}`;
    if (lanyard.customStatus?.text) {
      presenceDesc += `\n**Statut perso :** ${lanyard.customStatus.emoji || "💬"} ${lanyard.customStatus.text}`;
    }
    if (lanyard.spotify?.active) {
      presenceDesc += `\n**Spotify :** 🎵 *${lanyard.spotify.track}* par **${lanyard.spotify.artist}**`;
    }
    embed.addFields({
      name: "📡 Activité en Direct (Lanyard)",
      value: presenceDesc,
      inline: false
    });
  }

  // Bannière
  if (user?.banner?.hasBanner && user?.banner?.main) {
    embed.setImage(user.banner.main);
  }

  embed.setFooter({
    text: "BOTdefender • Système de défense et OSINT Discord",
    iconURL: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordstaff.svg"
  });
  embed.setTimestamp();

  // Boutons interactifs
  const row = new ActionRowBuilder();

  if (user?.avatar?.main) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("🖼️ Avatar HD")
        .setStyle(ButtonStyle.Link)
        .setURL(user.avatar.hd || user.avatar.main)
    );
  }

  if (user?.banner?.hasBanner && user.banner.main) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("🎨 Bannière HD")
        .setStyle(ButtonStyle.Link)
        .setURL(user.banner.hd || user.banner.main)
    );
  }

  const response = { embeds: [embed] };
  if (row.components.length > 0) {
    response.components = [row];
  }

  return response;
}

module.exports = {
  generateLookupResponse
};
