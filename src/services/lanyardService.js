/**
 * Service Lanyard pour récupérer l'activité en temps réel (Spotify, Statut, Appareils, Jeux)
 */

const { cleanSnowflake } = require("./snowflakeService");

/**
 * Récupère les données Lanyard en temps réel pour un utilisateur Discord
 * @param {string} rawId
 * @returns {Promise<Object|null>}
 */
async function fetchLanyardPresence(rawId) {
  const id = cleanSnowflake(rawId);
  if (!id) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(`https://api.lanyard.rest/v1/users/${id}`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BOTdefender-Lookup/1.0.0"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success || !data.data) return null;

    const d = data.data;

    // Décodage du statut Spotify si en écoute
    let spotify = null;
    if (d.spotify && d.listening_to_spotify) {
      spotify = {
        active: true,
        track: d.spotify.song,
        artist: d.spotify.artist,
        album: d.spotify.album,
        albumArtUrl: d.spotify.album_art_url,
        trackId: d.spotify.track_id,
        durationMs: d.spotify.timestamps ? d.spotify.timestamps.end - d.spotify.timestamps.start : 0
      };
    }

    // Décodage des activités & Rich Presence
    const activities = (d.activities || []).map(act => ({
      name: act.name,
      type: act.type,
      details: act.details || null,
      state: act.state || null,
      emoji: act.emoji ? (act.emoji.id ? `https://cdn.discordapp.com/emojis/${act.emoji.id}.png` : act.emoji.name) : null,
      applicationId: act.application_id || null,
      createdTimestamp: act.created_at
    }));

    // Statut personnalisé
    const customStatusActivity = d.activities?.find(a => a.type === 4);
    const customStatus = customStatusActivity ? {
      text: customStatusActivity.state || null,
      emoji: customStatusActivity.emoji?.name || null
    } : null;

    return {
      available: true,
      status: d.discord_status,
      devices: {
        desktop: Boolean(d.active_on_discord_desktop),
        mobile: Boolean(d.active_on_discord_mobile),
        web: Boolean(d.active_on_discord_web)
      },
      spotify,
      customStatus,
      activities
    };
  } catch {
    return null;
  }
}

module.exports = {
  fetchLanyardPresence
};
