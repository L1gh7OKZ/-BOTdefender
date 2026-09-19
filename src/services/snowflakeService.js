/**
 * Service de décodage des Discord Snowflakes (Identifiants Discord)
 * Analyse mathématique 100% autonome sans token API Discord
 */

const DISCORD_EPOCH = 1420070400000n; // 1er Janvier 2015 00:00:00.000 UTC

/**
 * Nettoie et extrait un Snowflake valide depuis une chaîne (ID pur, mention, URL, etc.)
 * @param {string|number|BigInt} input - ID brut, mention (<@123...>) ou URL
 * @returns {string|null} - ID numérique pur de 17 à 20 chiffres ou null si invalide
 */
function cleanSnowflake(input) {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  // Regex stricte pour isoler une séquence de 17 à 20 chiffres
  const match = str.match(/(?:^|\D)(\d{17,20})(?!\d)/);
  return match ? match[1] : null;
}

/**
 * Calcule l'âge détaillé d'un compte Discord
 * @param {Date} createdDate
 * @param {Date} [nowDate]
 * @returns {Object}
 */
function calculateAccountAge(createdDate, nowDate = new Date()) {
  const diffMs = nowDate.getTime() - createdDate.getTime();
  if (diffMs < 0) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalDays: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      formattedFr: "Compte futur (Invalide)",
      formattedEn: "Future account (Invalid)"
    };
  }

  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  let years = nowDate.getUTCFullYear() - createdDate.getUTCFullYear();
  let months = nowDate.getUTCMonth() - createdDate.getUTCMonth();
  let days = nowDate.getUTCDate() - createdDate.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  const partsFr = [];
  if (years > 0) partsFr.push(`${years} ${years > 1 ? "ans" : "an"}`);
  if (months > 0) partsFr.push(`${months} mois`);
  if (days > 0) partsFr.push(`${days} ${days > 1 ? "jours" : "jour"}`);

  if (partsFr.length === 0) {
    const hours = totalHours % 24;
    const mins = totalMinutes % 60;
    const secs = totalSeconds % 60;
    if (hours > 0) partsFr.push(`${hours}h ${mins}min`);
    else if (mins > 0) partsFr.push(`${mins} min`);
    else partsFr.push(`${secs} s (Création immédiate)`);
  }

  const partsEn = [];
  if (years > 0) partsEn.push(`${years} ${years > 1 ? "years" : "year"}`);
  if (months > 0) partsEn.push(`${months} ${months > 1 ? "months" : "month"}`);
  if (days > 0) partsEn.push(`${days} ${days > 1 ? "days" : "day"}`);

  if (partsEn.length === 0) {
    const hours = totalHours % 24;
    const mins = totalMinutes % 60;
    const secs = totalSeconds % 60;
    if (hours > 0) partsEn.push(`${hours}h ${mins}m`);
    else if (mins > 0) partsEn.push(`${mins}m`);
    else partsEn.push(`${secs}s (Just created)`);
  }

  return {
    years,
    months,
    days,
    hours: totalHours % 24,
    minutes: totalMinutes % 60,
    seconds: totalSeconds % 60,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    formattedFr: partsFr.join(", "),
    formattedEn: partsEn.join(", ")
  };
}

/**
 * Décode un Snowflake Discord et extrait toutes les métadonnées internes
 * @param {string|number|BigInt} input
 * @returns {Object}
 */
function decodeSnowflake(input) {
  const idStr = cleanSnowflake(input);
  if (!idStr) {
    return {
      valid: false,
      error: "Identifiant Discord invalide (doit comporter entre 17 et 20 chiffres)"
    };
  }

  try {
    const id = BigInt(idStr);

    if (id <= 0n) {
      return {
        valid: false,
        error: "L'identifiant Discord doit être strictement positif"
      };
    }

    // Extraction des 64 bits du Snowflake Discord
    // Bits 22 à 63 (42 bits) : Horodatage en ms depuis l'époque Discord
    const timestampMs = Number((id >> 22n) + DISCORD_EPOCH);
    // Bits 17 à 21 (5 bits) : Worker ID interne (0-31)
    const workerId = Number((id & 0x3E0000n) >> 17n);
    // Bits 12 à 16 (5 bits) : Process ID interne (0-31)
    const processId = Number((id & 0x1F000n) >> 12n);
    // Bits 0 à 11 (12 bits) : Incrément séquentiel (0-4095)
    const increment = Number(id & 0xFFFn);

    const createdDate = new Date(timestampMs);
    const unixSeconds = Math.floor(timestampMs / 1000);

    // Vérification de cohérence
    if (isNaN(createdDate.getTime()) || timestampMs < Number(DISCORD_EPOCH)) {
      return {
        valid: false,
        error: "L'identifiant correspond à une date antérieure à la création de Discord (1er Janvier 2015)"
      };
    }

    const age = calculateAccountAge(createdDate);

    // Représentation binaire structurée sur 64 bits
    const binary64 = id.toString(2).padStart(64, "0");
    const binaryBreakdown = {
      timestampBits: binary64.slice(0, 42),
      workerBits: binary64.slice(42, 47),
      processBits: binary64.slice(47, 52),
      incrementBits: binary64.slice(52, 64),
      fullBinary: binary64
    };

    return {
      valid: true,
      id: idStr,
      timestamp: timestampMs,
      unixSeconds,
      createdAtUtc: createdDate.toUTCString(),
      createdAtIso: createdDate.toISOString(),
      createdAtFr: createdDate.toLocaleString("fr-FR", {
        timeZone: "UTC",
        dateStyle: "full",
        timeStyle: "medium"
      }) + " (UTC)",
      discordTags: {
        relative: `<t:${unixSeconds}:R>`,
        fullDate: `<t:${unixSeconds}:F>`,
        shortDate: `<t:${unixSeconds}:d>`,
        longTime: `<t:${unixSeconds}:T>`
      },
      age,
      internals: {
        workerId,
        processId,
        increment,
        epochOffsetMs: timestampMs - Number(DISCORD_EPOCH)
      },
      binary: binaryBreakdown
    };
  } catch (err) {
    return {
      valid: false,
      error: `Erreur lors du calcul du Snowflake : ${err.message}`
    };
  }
}

module.exports = {
  DISCORD_EPOCH,
  cleanSnowflake,
  calculateAccountAge,
  decodeSnowflake
};
