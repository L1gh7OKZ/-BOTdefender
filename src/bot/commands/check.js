const { EmbedBuilder } = require("discord.js");
const { decodeSnowflake } = require("../../services/snowflakeService");
const { fetchDiscordUser } = require("../../services/discordApiService");
const { analyzeAccountSafety } = require("../../services/defenderService");

/**
 * Génère le rapport de sécurité Anti-Raid BOTdefender
 * @param {string} targetId
 * @param {string} [token]
 * @returns {Promise<Object>}
 */
async function generateCheckResponse(targetId, token = null) {
  const result = await fetchDiscordUser(targetId, token);
  const snowflake = result.snowflake || decodeSnowflake(targetId);

  if (!snowflake.valid) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle("❌ Identifiant Invalide")
          .setDescription("L'identifiant Discord spécifié n'est pas un Snowflake valide.")
      ]
    };
  }

  const user = result.user || null;
  const safety = analyzeAccountSafety(snowflake, user);

  const embed = new EmbedBuilder()
    .setColor(safety.riskLevel === "CRITICAL" ? 0xED4245 : (safety.riskLevel === "HIGH" ? 0xF47B67 : (safety.riskLevel === "MEDIUM" ? 0xFEE75C : 0x57F287)))
    .setTitle(`🛡️ Audit de Sécurité BOTdefender | ID: ${snowflake.id}`)
    .setDescription(`**Compte audité :** <@${snowflake.id}>\n**Score de sécurité global :** \`${safety.safetyScore}/100\`\n**Niveau de menace :** **${safety.riskLabelFr}**`)
    .addFields(
      {
        name: "⏱️ Ancienneté du Compte",
        value: `**${snowflake.age.formattedFr}** (${snowflake.age.totalDays} jours)`,
        inline: true
      },
      {
        name: "📅 Date de Création",
        value: `${snowflake.discordTags.fullDate}`,
        inline: true
      },
      {
        name: "🤖 Nature du Compte",
        value: user?.isBot ? "🤖 Bot Discord" : "👤 Utilisateur",
        inline: true
      }
    );

  // Signatures de confiance & de menace
  const flags = [
    ...(safety.trustFlags || []).map(f => `🟢 \`${f}\``),
    ...(safety.threatFlags || []).map(f => `🔴 \`${f}\``)
  ];

  if (flags.length > 0) {
    embed.addFields({
      name: "🚩 Signatures Détectées",
      value: flags.join("\n"),
      inline: false
    });
  }

  // Recommandations
  if (safety.recommendationsFr && safety.recommendationsFr.length > 0) {
    embed.addFields({
      name: "📋 Recommandations pour vos Modérateurs",
      value: safety.recommendationsFr.map(r => `• ${r}`).join("\n"),
      inline: false
    });
  }

  embed.setFooter({ text: "BOTdefender Anti-Raid & Security Module" });
  embed.setTimestamp();

  return { embeds: [embed] };
}

module.exports = {
  generateCheckResponse
};
