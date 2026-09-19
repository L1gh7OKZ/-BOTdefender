/**
 * Suite de tests unitaires complète pour BOTdefender
 */

const assert = require("assert");
const { decodeSnowflake, cleanSnowflake, calculateAccountAge } = require("../src/services/snowflakeService");
const { decodeBadges, buildAvatarUrls, buildBannerUrls } = require("../src/services/discordApiService");
const { analyzeAccountSafety } = require("../src/services/defenderService");

console.log("🧪 Lancement des tests unitaires complets BOTdefender...\n");

// 1. Test cleanSnowflake
console.log("▶ Test 1 : Nettoyage des Snowflakes, URLs et mentions");
assert.strictEqual(cleanSnowflake("155149108183695360"), "155149108183695360");
assert.strictEqual(cleanSnowflake("<@155149108183695360>"), "155149108183695360");
assert.strictEqual(cleanSnowflake("<@!155149108183695360>"), "155149108183695360");
assert.strictEqual(cleanSnowflake("<@&155149108183695360>"), "155149108183695360");
assert.strictEqual(cleanSnowflake("https://discord.com/users/155149108183695360/profile"), "155149108183695360");
assert.strictEqual(cleanSnowflake(155149108183695360n), "155149108183695360");
assert.strictEqual(cleanSnowflake("1234567890"), null); // Trop court
assert.strictEqual(cleanSnowflake("1234567890123456789012345"), null); // Trop long
assert.strictEqual(cleanSnowflake(null), null);
assert.strictEqual(cleanSnowflake(undefined), null);
console.log("  ✅ Test 1 réussi !");

// 2. Test calculateAccountAge (Cas limites : 0 sec, 1h, 10 ans)
console.log("\n▶ Test 2 : Calcul précis de l'âge du compte");
const now = new Date();
const createdJustNow = new Date(now.getTime() - 10000); // 10 secondes
const ageJustNow = calculateAccountAge(createdJustNow, now);
assert.strictEqual(ageJustNow.totalDays, 0);
assert.strictEqual(ageJustNow.formattedFr.includes("s (Création immédiate)"), true);

const createdOld = new Date(Date.UTC(2016, 2, 4, 3, 7, 9)); // Mars 2016
const ageOld = calculateAccountAge(createdOld, new Date(Date.UTC(2026, 8, 19)));
assert.strictEqual(ageOld.years >= 10, true);
console.log("  ✅ Âge immédiat :", ageJustNow.formattedFr);
console.log("  ✅ Âge historique :", ageOld.formattedFr);
console.log("  ✅ Test 2 réussi !");

// 3. Test decodeSnowflake
console.log("\n▶ Test 3 : Décodage Snowflake et binaire 64 bits");
const sf = decodeSnowflake("155149108183695360");
assert.strictEqual(sf.valid, true);
assert.strictEqual(sf.timestamp, 1457060829922);
assert.strictEqual(sf.internals.workerId, 1);
assert.strictEqual(sf.internals.processId, 0);
assert.strictEqual(sf.internals.increment, 0);
assert.strictEqual(sf.binary.fullBinary.length, 64);
assert.strictEqual(sf.discordTags.relative, "<t:1457060829:R>");
console.log("  ✅ Timestamp UTC :", sf.createdAtUtc);
console.log("  ✅ Binaire :", sf.binary.timestampBits, sf.binary.workerBits, sf.binary.processBits, sf.binary.incrementBits);
console.log("  ✅ Test 3 réussi !");

// 4. Test Badges Bitfield & Spammer Flag
console.log("\n▶ Test 4 : Décodage des badges et drapeau Spammer");
const testFlags = (1 << 0) | (1 << 9) | (1 << 20) | (1 << 22);
const badges = decodeBadges(testFlags);
assert.strictEqual(badges.length, 4);
assert.strictEqual(badges.some(b => b.id === "DISCORD_EMPLOYEE"), true);
assert.strictEqual(badges.some(b => b.id === "EARLY_SUPPORTER"), true);
assert.strictEqual(badges.some(b => b.id === "SPAMMER"), true);
assert.strictEqual(badges.some(b => b.id === "ACTIVE_DEVELOPER"), true);
console.log("  ✅ Badges décodés :", badges.map(b => b.labelFr).join(", "));
console.log("  ✅ Test 4 réussi !");

// 5. Test Avatars & Bannières
console.log("\n▶ Test 5 : Construction des URLs d'assets (PNG, GIF, WebP, Hex Color)");
const avatarAnim = buildAvatarUrls("155149108183695360", "a_abcdef1234567890");
assert.strictEqual(avatarAnim.isAnimated, true);
assert.strictEqual(avatarAnim.gif.includes(".gif"), true);

const avatarDefault = buildAvatarUrls("155149108183695360", null);
assert.strictEqual(avatarDefault.isCustom, false);
assert.strictEqual(avatarDefault.main.includes("embed/avatars"), true);

const banner = buildBannerUrls("155149108183695360", "banner_hash_123", 0x5865f2);
assert.strictEqual(banner.hasBanner, true);
assert.strictEqual(banner.hexColor, "#5865f2");
console.log("  ✅ Test 5 réussi !");

// 6. Test Analyse Sécurité & Détection Raid
console.log("\n▶ Test 6 : Évaluation de sécurité BOTdefender & drapeaux de menace");
const safetyOld = analyzeAccountSafety(sf);
assert.strictEqual(safetyOld.safetyScore, 100);
assert.strictEqual(safetyOld.riskLevel, "LOW");

const fakeRecentSf = {
  valid: true,
  age: { totalDays: 0, totalHours: 0 }
};
const safetyRaid = analyzeAccountSafety(fakeRecentSf);
assert.strictEqual(safetyRaid.safetyScore <= 15, true);
assert.strictEqual(safetyRaid.riskLevel, "CRITICAL");

const spamUser = {
  badges: [{ id: "SPAMMER" }],
  isBot: false
};
const safetySpam = analyzeAccountSafety(sf, spamUser);
assert.strictEqual(safetySpam.threatFlags.includes("COMPTE_SIGNALE_SPAMMEUR_PAR_DISCORD"), true);
assert.strictEqual(safetySpam.safetyScore <= 50, true);

console.log("  ✅ Détection de compte raid :", safetyRaid.riskLabelFr, "(Score:", safetyRaid.safetyScore, ")");
console.log("  ✅ Détection de compte spammeur :", safetySpam.riskLabelFr, "(Score:", safetySpam.safetyScore, ")");
console.log("  ✅ Test 6 réussi !");

console.log("\n🎉 TOUS LES TESTS UNITAIRES ONT RÉUSSI AVEC 100% DE SUCCÈS !\n");
