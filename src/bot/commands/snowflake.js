const { EmbedBuilder } = require("discord.js");
const { decodeSnowflake } = require("../../services/snowflakeService");

/**
 * Génère le rapport technique du Snowflake Discord
 * @param {string} targetId
 * @returns {Object}
 */
function generateSnowflakeResponse(targetId) {
  const sf = decodeSnowflake(targetId);

  if (!sf.valid) {
    return {
      embeds: [
        new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle("❌ Snowflake Invalide")
          .setDescription(sf.error || "Impossible de décoder ce Snowflake.")
      ]
    };
  }

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`⚙️ Structure Snowflake 64-bit : ${sf.id}`)
    .setDescription("Décomposition technique des 64 bits de l'identifiant Discord.")
    .addFields(
      {
        name: "🕒 Horodatage Époque Discord",
        value: `\`${sf.timestamp} ms\`\n${sf.discordTags.fullDate}\n${sf.discordTags.relative}`,
        inline: true
      },
      {
        name: "🖥️ Worker ID",
        value: `\`${sf.internals.workerId}\` (5 bits)`,
        inline: true
      },
      {
        name: "⚙️ Process ID",
        value: `\`${sf.internals.processId}\` (5 bits)`,
        inline: true
      },
      {
        name: "🔢 Incrémentation",
        value: `\`${sf.internals.increment}\` (12 bits)`,
        inline: true
      },
      {
        name: "⏳ Âge Précis",
        value: `${sf.age.formattedFr}`,
        inline: true
      },
      {
        name: "📅 Date UTC",
        value: `\`${sf.createdAtUtc}\``,
        inline: true
      },
      {
        name: "💻 Décomposition Binaire (64 bits)",
        value: `\`\`\`\nHorodatage (42b): ${sf.binary.timestampBits}\nWorker ID   (5b):  ${sf.binary.workerBits}\nProcess ID  (5b):  ${sf.binary.processBits}\nIncrément  (12b):  ${sf.binary.incrementBits}\n\`\`\``,
        inline: false
      }
    )
    .setFooter({ text: "BOTdefender Snowflake Engine" })
    .setTimestamp();

  return { embeds: [embed] };
}

module.exports = {
  generateSnowflakeResponse
};
