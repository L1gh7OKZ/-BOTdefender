/**
 * Service d'interaction avec l'API Discord v10 et décodage complet des profils
 */

const { decodeSnowflake, cleanSnowflake } = require("./snowflakeService");

// Dictionnaire officiel des badges Discord (User Public Flags)
const DISCORD_BADGES = [
  {
    flag: 1 << 0,
    name: "DISCORD_EMPLOYEE",
    labelFr: "Membre du personnel Discord (Staff)",
    labelEn: "Discord Employee (Staff)",
    description: "Employé officiel travaillant chez Discord",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordstaff.svg",
    emoji: "🛡️"
  },
  {
    flag: 1 << 1,
    name: "PARTNERED_SERVER_OWNER",
    labelFr: "Propriétaire de serveur partenaire",
    labelEn: "Partnered Server Owner",
    description: "Propriétaire d'un serveur communautaire certifié Discord Partner",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordpartner.svg",
    emoji: "👑"
  },
  {
    flag: 1 << 2,
    name: "HYPESQUAD_EVENTS",
    labelFr: "Coordinateur d'événements HypeSquad",
    labelEn: "HypeSquad Events Coordinator",
    description: "Organisateur d'événements physiques HypeSquad",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadevents.svg",
    emoji: "🎉"
  },
  {
    flag: 1 << 3,
    name: "BUG_HUNTER_LEVEL_1",
    labelFr: "Chasseur de bugs Discord - Niveau 1",
    labelEn: "Discord Bug Hunter Level 1",
    description: "Auteur de rapports de bugs confirmés (Chasseur Vert)",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbughunter1.svg",
    emoji: "🐛"
  },
  {
    flag: 1 << 6,
    name: "HOUSE_BRAVERY",
    labelFr: "HypeSquad Bravery (Bravoure)",
    labelEn: "HypeSquad Bravery",
    description: "Membre de la maison HypeSquad Bravoure",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbravery.svg",
    emoji: "🟣"
  },
  {
    flag: 1 << 7,
    name: "HOUSE_BRILLIANCE",
    labelFr: "HypeSquad Brilliance (Brillance)",
    labelEn: "HypeSquad Brilliance",
    description: "Membre de la maison HypeSquad Brillance",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbrilliance.svg",
    emoji: "🔴"
  },
  {
    flag: 1 << 8,
    name: "HOUSE_BALANCE",
    labelFr: "HypeSquad Balance (Équilibre)",
    labelEn: "HypeSquad Balance",
    description: "Membre de la maison HypeSquad Équilibre",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/hypesquadbalance.svg",
    emoji: "🟢"
  },
  {
    flag: 1 << 9,
    name: "EARLY_SUPPORTER",
    labelFr: "Soutien de la première heure (Early Nitro)",
    labelEn: "Early Supporter",
    description: "Abonné Nitro avant le 10 octobre 2018",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordearlysupporter.svg",
    emoji: "⭐"
  },
  {
    flag: 1 << 10,
    name: "TEAM_USER",
    labelFr: "Utilisateur Équipe Discord",
    labelEn: "Discord Team User",
    description: "Compte système lié à une équipe de développeurs",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbotdev.svg",
    emoji: "👥"
  },
  {
    flag: 1 << 14,
    name: "BUG_HUNTER_LEVEL_2",
    labelFr: "Chasseur de bugs Discord - Niveau 2",
    labelEn: "Discord Bug Hunter Level 2",
    description: "Chasseur de bugs d'élite (Chasseur Doré)",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbughunter2.svg",
    emoji: "🏅"
  },
  {
    flag: 1 << 16,
    name: "VERIFIED_BOT",
    labelFr: "Bot Discord Vérifié",
    labelEn: "Verified Discord Bot",
    description: "Robot vérifié officiellement par Discord",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordbotdev.svg",
    emoji: "🤖"
  },
  {
    flag: 1 << 17,
    name: "VERIFIED_DEVELOPER",
    labelFr: "Développeur de bot vérifié pionnier",
    labelEn: "Early Verified Bot Developer",
    description: "Développeur historique ayant vérifié un bot avant août 2020",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordearlybotdev.svg",
    emoji: "💻"
  },
  {
    flag: 1 << 18,
    name: "CERTIFIED_MODERATOR",
    labelFr: "Modérateur Certifié Discord",
    labelEn: "Discord Certified Moderator Alumni",
    description: "Diplômé de l'académie des modérateurs Discord",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordmod.svg",
    emoji: "🛡️"
  },
  {
    flag: 1 << 19,
    name: "BOT_HTTP_INTERACTIONS",
    labelFr: "Bot Interactions HTTP",
    labelEn: "HTTP Interactions Bot",
    description: "Bot utilisant exclusivement les interactions webhook HTTP",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/activedeveloper.svg",
    emoji: "⚡"
  },
  {
    flag: 1 << 20,
    name: "SPAMMER",
    labelFr: "Compte Marqué comme Spammeur (Discord Quarantine)",
    labelEn: "Quarantined / Spammer Account",
    description: "Compte signalé et restreint par les systèmes de sécurité Discord",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/discordmod.svg",
    emoji: "⚠️"
  },
  {
    flag: 1 << 22,
    name: "ACTIVE_DEVELOPER",
    labelFr: "Développeur Actif",
    labelEn: "Active Developer",
    description: "Développeur exécutant activement des commandes d'application",
    icon: "https://raw.githubusercontent.com/mezotv/discord-badges/main/assets/activedeveloper.svg",
    emoji: "🚀"
  }
];

const NITRO_TYPES = {
  0: { id: 0, name: "Aucun", labelFr: "Aucun abonnement Nitro", labelEn: "No Nitro" },
  1: { id: 1, name: "Nitro Classic", labelFr: "Discord Nitro Classic", labelEn: "Discord Nitro Classic" },
  2: { id: 2, name: "Nitro Boost", labelFr: "Discord Nitro (Plein)", labelEn: "Discord Nitro (Full)" },
  3: { id: 3, name: "Nitro Basic", labelFr: "Discord Nitro Basic", labelEn: "Discord Nitro Basic" }
};

/**
 * Décode le champ bitfield des flags publics en liste d'objets badges
 * @param {number} publicFlags
 * @returns {Array<Object>}
 */
function decodeBadges(publicFlags = 0) {
  const flags = Number(publicFlags) || 0;
  const badges = [];

  for (const badge of DISCORD_BADGES) {
    if ((flags & badge.flag) === badge.flag) {
      badges.push({
        id: badge.name,
        flag: badge.flag,
        labelFr: badge.labelFr,
        labelEn: badge.labelEn,
        description: badge.description,
        icon: badge.icon,
        emoji: badge.emoji
      });
    }
  }

  return badges;
}

/**
 * Construit toutes les URLs et formats pour l'avatar d'un utilisateur
 * @param {string} userId
 * @param {string|null} avatarHash
 * @param {string} [discriminator]
 * @returns {Object}
 */
function buildAvatarUrls(userId, avatarHash, discriminator = "0") {
  if (!avatarHash) {
    let defaultIndex = 0;
    try {
      if (discriminator && discriminator !== "0") {
        defaultIndex = parseInt(discriminator, 10) % 5;
      } else {
        defaultIndex = Number((BigInt(userId) >> 22n) % 6n);
      }
    } catch {
      defaultIndex = 0;
    }

    if (isNaN(defaultIndex) || defaultIndex < 0) defaultIndex = 0;

    const defaultUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    return {
      isCustom: false,
      isAnimated: false,
      defaultIndex,
      main: defaultUrl,
      png: defaultUrl,
      webp: defaultUrl,
      gif: null,
      jpg: defaultUrl
    };
  }

  const isAnimated = String(avatarHash).startsWith("a_");
  const baseUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}`;

  return {
    isCustom: true,
    isAnimated,
    hash: avatarHash,
    main: isAnimated ? `${baseUrl}.gif?size=1024` : `${baseUrl}.png?size=1024`,
    png: `${baseUrl}.png?size=1024`,
    webp: `${baseUrl}.webp?size=1024`,
    jpg: `${baseUrl}.jpg?size=1024`,
    gif: isAnimated ? `${baseUrl}.gif?size=1024` : null,
    hd: isAnimated ? `${baseUrl}.gif?size=4096` : `${baseUrl}.png?size=4096`
  };
}

/**
 * Construit toutes les URLs et informations pour la bannière d'un utilisateur
 * @param {string} userId
 * @param {string|null} bannerHash
 * @param {number|null} accentColor
 * @returns {Object}
 */
function buildBannerUrls(userId, bannerHash, accentColor = null) {
  let hexColor = "#5865F2";
  if (accentColor != null && !isNaN(Number(accentColor))) {
    hexColor = `#${(Number(accentColor) & 0xFFFFFF).toString(16).padStart(6, "0")}`;
  }

  if (!bannerHash) {
    return {
      hasBanner: false,
      isAnimated: false,
      hash: null,
      hexColor,
      main: null,
      png: null,
      webp: null,
      gif: null
    };
  }

  const isAnimated = String(bannerHash).startsWith("a_");
  const baseUrl = `https://cdn.discordapp.com/banners/${userId}/${bannerHash}`;

  return {
    hasBanner: true,
    isAnimated,
    hash: bannerHash,
    hexColor,
    main: isAnimated ? `${baseUrl}.gif?size=1024` : `${baseUrl}.png?size=1024`,
    png: `${baseUrl}.png?size=1024`,
    webp: `${baseUrl}.webp?size=1024`,
    gif: isAnimated ? `${baseUrl}.gif?size=1024` : null,
    hd: isAnimated ? `${baseUrl}.gif?size=4096` : `${baseUrl}.png?size=4096`
  };
}

/**
 * Interroge l'API Discord officielle pour récupérer les données d'un utilisateur
 * @param {string} rawId - ID ou mention Discord
 * @param {string} [botToken] - Token de bot Discord
 * @returns {Promise<Object>}
 */
async function fetchDiscordUser(rawId, botToken = null) {
  const id = cleanSnowflake(rawId);
  if (!id) {
    return {
      success: false,
      error: "Identifiant Discord invalide"
    };
  }

  // Analyse Snowflake 100% autonome
  const snowflakeData = decodeSnowflake(id);
  if (!snowflakeData.valid) {
    return {
      success: false,
      error: snowflakeData.error
    };
  }

  const token = (botToken || process.env.DISCORD_BOT_TOKEN || "").trim();

  if (!token) {
    const avatar = buildAvatarUrls(id, null);
    const banner = buildBannerUrls(id, null);

    return {
      success: true,
      source: "snowflake_offline",
      message: "Analyse Snowflake locale effectuée. Spécifiez un token de bot pour les données API en temps réel (Pseudo, Avatar HD, Badges, etc.).",
      user: {
        id,
        username: `Utilisateur_${id.slice(-4)}`,
        globalName: null,
        discriminator: "0",
        tag: `Utilisateur_${id.slice(-4)}`,
        isBot: false,
        isSystem: false,
        badges: [],
        publicFlags: 0,
        premiumType: NITRO_TYPES[0],
        accentColor: null,
        hexColor: "#5865F2",
        avatar,
        banner,
        decoration: null
      },
      snowflake: snowflakeData
    };
  }

  // Appel REST avec timeout de 3.5s
  try {
    let authHeader = token;
    if (!token.startsWith("Bot ") && !token.startsWith("Bearer ")) {
      authHeader = `Bot ${token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
      signal: controller.signal,
      headers: {
        Authorization: authHeader,
        "User-Agent": "BOTdefender-Lookup/1.0.0 (https://github.com/L1gh7OKZ/-BOTdefender)"
      }
    });

    clearTimeout(timer);

    if (response.status === 404) {
      return {
        success: false,
        source: "discord_api",
        error: `Aucun utilisateur trouvé pour l'identifiant ${id} (Code 404). Compte potentiellement supprimé ou inexistant.`
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        source: "discord_api",
        error: "Token Discord invalide ou non autorisé (Code 401 Unauthorized)."
      };
    }

    if (response.status === 429) {
      const rateData = await response.json().catch(() => ({}));
      return {
        success: false,
        source: "discord_api",
        error: `Limite de requêtes atteinte (Rate Limit). Réessayez dans ${rateData.retry_after || 5}s.`
      };
    }

    if (!response.ok) {
      return {
        success: false,
        source: "discord_api",
        error: `Erreur API Discord HTTP ${response.status}: ${response.statusText}`
      };
    }

    const userData = await response.json();

    const flags = userData.public_flags || userData.flags || 0;
    const badges = decodeBadges(flags);
    const avatar = buildAvatarUrls(id, userData.avatar, userData.discriminator);
    const banner = buildBannerUrls(id, userData.banner, userData.accent_color);

    let decoration = null;
    if (userData.avatar_decoration_data && userData.avatar_decoration_data.asset) {
      const asset = userData.avatar_decoration_data.asset;
      decoration = {
        asset,
        skuId: userData.avatar_decoration_data.sku_id || null,
        url: `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.png?size=512`
      };
    }

    let premiumType = NITRO_TYPES[userData.premium_type || 0] || NITRO_TYPES[0];
    if (userData.premium_type === undefined || userData.premium_type === 0) {
      if (banner.hasBanner || avatar.isAnimated || decoration) {
        premiumType = {
          id: 2,
          name: "Nitro (Détecté)",
          labelFr: "Discord Nitro (Détecté via éléments de profil)",
          labelEn: "Discord Nitro (Detected via perks)"
        };
      }
    }

    const tag = userData.discriminator && userData.discriminator !== "0"
      ? `${userData.username}#${userData.discriminator}`
      : `@${userData.username}`;

    return {
      success: true,
      source: "discord_api",
      user: {
        id: userData.id,
        username: userData.username,
        globalName: userData.global_name || null,
        discriminator: userData.discriminator || "0",
        tag,
        isBot: Boolean(userData.bot),
        isSystem: Boolean(userData.system),
        mfaEnabled: Boolean(userData.mfa_enabled),
        publicFlags: flags,
        badges,
        premiumType,
        accentColor: userData.accent_color,
        hexColor: banner.hexColor,
        avatar,
        banner,
        decoration,
        raw: userData
      },
      snowflake: snowflakeData
    };
  } catch (err) {
    return {
      success: true,
      source: "snowflake_fallback",
      message: `Connexion API Discord indisponible (${err.name === "AbortError" ? "Délai dépassé" : err.message}). Analyse Snowflake effectuée.`,
      user: {
        id,
        username: `Utilisateur_${id.slice(-4)}`,
        globalName: null,
        discriminator: "0",
        tag: `Utilisateur_${id.slice(-4)}`,
        isBot: false,
        isSystem: false,
        badges: [],
        publicFlags: 0,
        premiumType: NITRO_TYPES[0],
        accentColor: null,
        hexColor: "#5865F2",
        avatar: buildAvatarUrls(id, null),
        banner: buildBannerUrls(id, null),
        decoration: null
      },
      snowflake: snowflakeData
    };
  }
}

module.exports = {
  DISCORD_BADGES,
  NITRO_TYPES,
  decodeBadges,
  buildAvatarUrls,
  buildBannerUrls,
  fetchDiscordUser
};
