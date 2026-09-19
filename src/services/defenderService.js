/**
 * Service de sécurité et d'analyse Anti-Raid / Détection de faux comptes pour BOTdefender
 */

/**
 * Analyse la réputation et le niveau de risque d'un compte Discord
 * @param {Object} snowflakeData
 * @param {Object} [userData]
 * @returns {Object}
 */
function analyzeAccountSafety(snowflakeData, userData = null) {
  if (!snowflakeData || !snowflakeData.valid) {
    return {
      safetyScore: 0,
      riskLevel: "UNKNOWN",
      riskColor: "#747f8d",
      summaryFr: "Compte introuvable ou ID non valide",
      summaryEn: "Invalid ID or account not found",
      trustFlags: [],
      threatFlags: ["ID_INVALID"],
      recommendationsFr: ["Vérifier l'identifiant fourni."],
      isSuspicious: true
    };
  }

  const age = snowflakeData.age || {};
  const totalDays = Math.max(0, Number(age.totalDays) || 0);
  const totalHours = Math.max(0, Number(age.totalHours) || 0);

  let score = 50;
  const threatFlags = [];
  const trustFlags = [];
  const recommendationsFr = [];

  // 1. Analyse d'ancienneté du compte
  if (totalHours < 1) {
    score = 5;
    threatFlags.push("COMPTE_CREE_IL_Y_A_MOINS_D_UNE_HEURE");
    recommendationsFr.push("🔴 Risque critique de raid / spam bot. Isolement immédiat ou vérification Captcha stricte recommandée.");
  } else if (totalHours < 24) {
    score = 15;
    threatFlags.push("COMPTE_CREE_IL_Y_A_MOINS_DE_24H");
    recommendationsFr.push("🔴 Compte créé il y a moins de 24 heures. Surveiller les premiers messages et restreindre les invitations.");
  } else if (totalDays < 7) {
    score = 35;
    threatFlags.push("COMPTE_TROP_RECENT_MOINS_DE_7_JOURS");
    recommendationsFr.push("🟠 Compte très jeune (< 7 jours). Potentiel double compte ou contournement de sanction.");
  } else if (totalDays < 30) {
    score = 60;
    threatFlags.push("COMPTE_RECENT_MOINS_DE_30_JOURS");
    recommendationsFr.push("🟡 Compte récent (< 1 mois). Autoriser avec niveau de vérification standard.");
  } else if (totalDays < 365) {
    score = 85;
    trustFlags.push("COMPTE_ETABLI_PLUS_D_UN_MOIS");
    recommendationsFr.push("🟢 Compte établi sans risque majeur détecté.");
  } else if (totalDays < 365 * 3) {
    score = 95;
    trustFlags.push("COMPTE_ANCIEN_PLUS_D_UN_AN");
    recommendationsFr.push("🟢 Compte ancien et stable (> 1 an). Accès de confiance standard.");
  } else {
    score = 100;
    trustFlags.push("COMPTE_VETERAN_DISCORD");
    recommendationsFr.push("⭐ Compte vétéran Discord (> 3 ans). Niveau de confiance maximal.");
  }

  // 2. Analyse des données Discord (si disponibles)
  if (userData) {
    const badges = userData.badges || [];
    const badgeNames = badges.map(b => b.id);

    // Détection drapeau Spammer / Quarantined
    if (badgeNames.includes("SPAMMER")) {
      score = Math.max(0, score - 60);
      threatFlags.push("COMPTE_SIGNALE_SPAMMEUR_PAR_DISCORD");
      recommendationsFr.unshift("🚨 Compte classé comme SPAMMEUR par la sécurité Discord ! Bannissement ou mise sous quarantaine vivement conseillé.");
    }

    // Badges officiels de confiance
    if (badgeNames.some(b => ["DISCORD_EMPLOYEE", "PARTNERED_SERVER_OWNER", "CERTIFIED_MODERATOR", "VERIFIED_DEVELOPER"].includes(b))) {
      score = Math.min(100, score + 15);
      trustFlags.push("BADGE_OFFICIEL_HAUTEMENT_VERIFIE");
    }
    if (badgeNames.includes("EARLY_SUPPORTER")) {
      score = Math.min(100, score + 10);
      trustFlags.push("SOUTIEN_HISTORIQUE_EARLY_SUPPORTER");
    }
    if (badgeNames.includes("ACTIVE_DEVELOPER")) {
      score = Math.min(100, score + 5);
      trustFlags.push("DEVELOPPEUR_ACTIF");
    }

    // Analyse Bot vs Humain
    if (userData.isBot) {
      if (badgeNames.includes("VERIFIED_BOT")) {
        trustFlags.push("BOT_VERIFIE_PAR_DISCORD");
        recommendationsFr.push("🤖 Robot certifié par Discord. Vérifier les permissions octroyées.");
      } else {
        score = Math.max(5, score - 20);
        threatFlags.push("BOT_NON_VERIFIE");
        recommendationsFr.push("⚠️ Robot non vérifié. Restreindre les permissions d'administration.");
      }
    }

    // Analyse de personnalisation
    if (userData.avatar?.isCustom) {
      trustFlags.push("AVATAR_PERSONNALISE");
    } else if (totalDays < 7) {
      score = Math.max(5, score - 15);
      threatFlags.push("AVATAR_PAR_DEFAUT_COMPTE_RECENT");
      recommendationsFr.push("⚠️ Absence d'avatar personnalisé sur un compte très récent (signature typique de bot de raid).");
    }
  }

  score = Math.max(0, Math.min(100, score));

  // Détermination du statut de risque
  let riskLevel = "LOW";
  let riskColor = "#57F287"; // Vert Discord
  let riskLabelFr = "Compte Sûr & Établi";
  let riskLabelEn = "Safe & Established";

  if (score < 25) {
    riskLevel = "CRITICAL";
    riskColor = "#ED4245"; // Rouge Discord
    riskLabelFr = "Risque Critique (Spam / Raid)";
    riskLabelEn = "Critical Risk (Spam / Raid)";
  } else if (score < 50) {
    riskLevel = "HIGH";
    riskColor = "#F47B67"; // Orange-Rouge
    riskLabelFr = "Risque Élevé (Compte Très Récent)";
    riskLabelEn = "High Risk (Very New Account)";
  } else if (score < 75) {
    riskLevel = "MEDIUM";
    riskColor = "#FEE75C"; // Jaune Discord
    riskLabelFr = "Risque Modéré (Compte Récent)";
    riskLabelEn = "Moderate Risk (Recent Account)";
  }

  return {
    safetyScore: score,
    riskLevel,
    riskColor,
    riskLabelFr,
    riskLabelEn,
    totalAccountDays: totalDays,
    threatFlags,
    trustFlags,
    recommendationsFr,
    isSuspicious: score < 50
  };
}

module.exports = {
  analyzeAccountSafety
};
