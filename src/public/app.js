/**
 * Script Frontend interactif pour BOTdefender Lookup
 */

document.addEventListener("DOMContentLoaded", () => {
  // Éléments DOM
  const lookupForm = document.getElementById("lookupForm");
  const idInput = document.getElementById("idInput");
  const btnClearInput = document.getElementById("btnClearInput");
  const btnSearch = document.getElementById("btnSearch");
  const sampleButtons = document.querySelectorAll(".sample-btn");

  const errorAlert = document.getElementById("errorAlert");
  const errorMessage = document.getElementById("errorMessage");
  const loadingState = document.getElementById("loadingState");
  const resultContainer = document.getElementById("resultContainer");

  // Profil Discord
  const profileBannerWrapper = document.getElementById("profileBannerWrapper");
  const profileBanner = document.getElementById("profileBanner");
  const profileAvatar = document.getElementById("profileAvatar");
  const profileDecoration = document.getElementById("profileDecoration");
  const statusIndicator = document.getElementById("statusIndicator");
  const profileGlobalName = document.getElementById("profileGlobalName");
  const profileTag = document.getElementById("profileTag");
  const profileBotBadge = document.getElementById("profileBotBadge");
  const profileSystemBadge = document.getElementById("profileSystemBadge");
  const profileId = document.getElementById("profileId");
  const btnCopyId = document.getElementById("btnCopyId");
  const profileBadgesHeader = document.getElementById("profileBadgesHeader");
  const badgesCount = document.getElementById("badgesCount");

  // Onglets
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  // Onglet Vue d'ensemble
  const ovCreatedAt = document.getElementById("ovCreatedAt");
  const ovAccountAge = document.getElementById("ovAccountAge");
  const tagRelative = document.getElementById("tagRelative");
  const tagFull = document.getElementById("tagFull");
  const tagUnix = document.getElementById("tagUnix");
  const ovLiveStatus = document.getElementById("ovLiveStatus");
  const ovCustomStatusRow = document.getElementById("ovCustomStatusRow");
  const ovCustomStatus = document.getElementById("ovCustomStatus");
  const ovSpotifyBox = document.getElementById("ovSpotifyBox");
  const spotifyArt = document.getElementById("spotifyArt");
  const spotifyTrack = document.getElementById("spotifyTrack");
  const spotifyArtist = document.getElementById("spotifyArtist");
  const spotifyAlbum = document.getElementById("spotifyAlbum");
  const devDesktop = document.getElementById("devDesktop");
  const devMobile = document.getElementById("devMobile");
  const devWeb = document.getElementById("devWeb");

  // Onglet Badges
  const badgesGrid = document.getElementById("badgesGrid");
  const noBadgesMessage = document.getElementById("noBadgesMessage");

  // Onglet Sécurité BOTdefender
  const scoreValue = document.getElementById("scoreValue");
  const safetyLevelBadge = document.getElementById("safetyLevelBadge");
  const safetyLevelDesc = document.getElementById("safetyLevelDesc");
  const safetyProgressBar = document.getElementById("safetyProgressBar");
  const defenderFlagsList = document.getElementById("defenderFlagsList");
  const defenderRecommendationsList = document.getElementById("defenderRecommendationsList");

  // Onglet Snowflake Technique
  const sfTimestamp = document.getElementById("sfTimestamp");
  const sfWorkerId = document.getElementById("sfWorkerId");
  const sfProcessId = document.getElementById("sfProcessId");
  const sfIncrement = document.getElementById("sfIncrement");
  const binTimestamp = document.getElementById("binTimestamp");
  const binWorker = document.getElementById("binWorker");
  const binProcess = document.getElementById("binProcess");
  const binIncrement = document.getElementById("binIncrement");

  // Onglet Ressources HD
  const assetAvatarImg = document.getElementById("assetAvatarImg");
  const avatarLinks = document.getElementById("avatarLinks");
  const bannerColorBox = document.getElementById("bannerColorBox");
  const bannerColorHex = document.getElementById("bannerColorHex");
  const bannerLinks = document.getElementById("bannerLinks");

  // Onglet JSON
  const jsonViewer = document.getElementById("jsonViewer");
  const btnCopyJson = document.getElementById("btnCopyJson");
  const btnDownloadJson = document.getElementById("btnDownloadJson");

  // Token Modal
  const btnOpenTokenModal = document.getElementById("btnOpenTokenModal");
  const tokenModal = document.getElementById("tokenModal");
  const btnCloseTokenModal = document.getElementById("btnCloseTokenModal");
  const tokenInput = document.getElementById("tokenInput");
  const btnSaveToken = document.getElementById("btnSaveToken");
  const btnRemoveToken = document.getElementById("btnRemoveToken");
  const tokenStatusDot = document.getElementById("tokenStatusDot");

  // Toast
  const toast = document.getElementById("toast");

  let currentLookupData = null;

  // Fonction de copie dans le presse-papier avec solution de secours
  async function copyToClipboard(text, successMsg = "Copié dans le presse-papier !") {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      showToast(successMsg);
    } catch {
      showToast("❌ Impossible de copier automatiquement");
    }
  }

  // Gestion du token dans le localStorage
  function updateTokenStatus() {
    const savedToken = localStorage.getItem("botdefender_token");
    if (savedToken) {
      tokenStatusDot.className = "status-dot online";
      tokenStatusDot.title = "Token configuré dans votre navigateur";
      tokenInput.value = savedToken;
    } else {
      tokenStatusDot.className = "status-dot offline";
      tokenStatusDot.title = "Aucun token configuré (Mode Snowflake)";
      tokenInput.value = "";
    }
  }
  updateTokenStatus();

  // Notification Toast
  function showToast(message) {
    toast.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }

  // Onglets switch
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Gestion du champ texte et bouton clear
  idInput.addEventListener("input", () => {
    if (idInput.value.trim().length > 0) {
      btnClearInput.classList.remove("hidden");
    } else {
      btnClearInput.classList.add("hidden");
    }
  });

  btnClearInput.addEventListener("click", () => {
    idInput.value = "";
    btnClearInput.classList.add("hidden");
    idInput.focus();
  });

  // Boutons d'exemples
  sampleButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      idInput.value = id;
      btnClearInput.classList.remove("hidden");
      performLookup(id);
    });
  });

  // Soumission du formulaire
  lookupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = idInput.value.trim();
    if (query) {
      performLookup(query);
    }
  });

  // Copie d'ID
  btnCopyId.addEventListener("click", () => {
    if (profileId.textContent) {
      copyToClipboard(profileId.textContent, "✅ Identifiant copié !");
    }
  });

  // Copie de balises de code
  document.querySelectorAll(".btn-copy-code").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const el = document.getElementById(targetId);
      if (el && el.textContent) {
        copyToClipboard(el.textContent, "✅ Tag Discord copié !");
      }
    });
  });

  // Copie JSON
  btnCopyJson.addEventListener("click", () => {
    if (currentLookupData) {
      copyToClipboard(JSON.stringify(currentLookupData, null, 2), "✅ Données JSON copiées !");
    }
  });

  // Téléchargement JSON
  btnDownloadJson.addEventListener("click", () => {
    if (currentLookupData) {
      const blob = new Blob([JSON.stringify(currentLookupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `discord_lookup_${currentLookupData.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  // Modale de configuration du token
  btnOpenTokenModal.addEventListener("click", () => {
    tokenModal.classList.remove("hidden");
  });

  btnCloseTokenModal.addEventListener("click", () => {
    tokenModal.classList.add("hidden");
  });

  tokenModal.addEventListener("click", (e) => {
    if (e.target === tokenModal) {
      tokenModal.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !tokenModal.classList.contains("hidden")) {
      tokenModal.classList.add("hidden");
    }
  });

  btnSaveToken.addEventListener("click", () => {
    const val = tokenInput.value.trim();
    if (val) {
      localStorage.setItem("botdefender_token", val);
      showToast("✅ Token de bot enregistré localement !");
    } else {
      localStorage.removeItem("botdefender_token");
    }
    updateTokenStatus();
    tokenModal.classList.add("hidden");
  });

  btnRemoveToken.addEventListener("click", () => {
    localStorage.removeItem("botdefender_token");
    updateTokenStatus();
    tokenModal.classList.add("hidden");
    showToast("🗑️ Token supprimé.");
  });

  // Fonction principale de recherche
  async function performLookup(rawInput) {
    const match = String(rawInput).match(/(?:^|\D)(\d{17,20})(?!\d)/);
    if (!match) {
      showError("Veuillez entrer un ID Discord valide (17 à 20 chiffres) ou une mention (<@id>).");
      return;
    }

    const discordId = match[1];

    hideError();
    loadingState.classList.remove("hidden");
    resultContainer.classList.add("hidden");
    btnSearch.disabled = true;

    try {
      const token = localStorage.getItem("botdefender_token");
      let url = `/api/lookup/${discordId}`;
      if (token) {
        url += `?token=${encodeURIComponent(token)}`;
      }

      const response = await fetch(url);
      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Impossible de récupérer les informations de ce compte.");
      }

      currentLookupData = resData.data;
      renderUserData(resData.data);
      resultContainer.classList.remove("hidden");
    } catch (err) {
      showError(err.message);
    } finally {
      loadingState.classList.add("hidden");
      btnSearch.disabled = false;
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove("hidden");
  }

  function hideError() {
    errorAlert.classList.add("hidden");
  }

  // Rendu complet des données
  function renderUserData(data) {
    const { id, user, snowflake, safety, lanyard } = data;

    // 1. Profil Carte
    profileId.textContent = id;
    profileGlobalName.textContent = user?.globalName || user?.username || `Utilisateur_${id.slice(-4)}`;
    profileTag.textContent = user?.tag || `@${user?.username || id}`;

    // Badges Bot / Système
    if (user?.isBot) {
      profileBotBadge.classList.remove("hidden");
    } else {
      profileBotBadge.classList.add("hidden");
    }

    if (user?.isSystem) {
      profileSystemBadge.classList.remove("hidden");
    } else {
      profileSystemBadge.classList.add("hidden");
    }

    // Avatar & Décoration
    const avatarUrl = user?.avatar?.main || `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> 22n) % 6n)}.png`;
    profileAvatar.src = avatarUrl;
    profileAvatar.onerror = () => {
      profileAvatar.src = "https://cdn.discordapp.com/embed/avatars/0.png";
    };
    assetAvatarImg.src = avatarUrl;

    if (user?.decoration?.url) {
      profileDecoration.src = user.decoration.url;
      profileDecoration.classList.remove("hidden");
    } else {
      profileDecoration.classList.add("hidden");
    }

    // Bannière & Couleur
    const hexColor = user?.hexColor || "#5865F2";
    if (user?.banner?.hasBanner && user?.banner?.main) {
      profileBanner.style.backgroundImage = `url('${user.banner.main}')`;
      profileBannerWrapper.style.backgroundColor = hexColor;
    } else {
      profileBanner.style.backgroundImage = "none";
      profileBannerWrapper.style.backgroundColor = hexColor;
    }
    bannerColorBox.style.backgroundColor = hexColor;
    bannerColorHex.textContent = hexColor;

    // Badges Header & Grid
    profileBadgesHeader.innerHTML = "";
    badgesGrid.innerHTML = "";
    const badges = user?.badges || [];
    badgesCount.textContent = badges.length;

    if (badges.length > 0) {
      noBadgesMessage.classList.add("hidden");
      badges.forEach(b => {
        const img = document.createElement("img");
        img.className = "badge-item-icon";
        img.src = b.icon;
        img.alt = b.labelFr;
        img.title = `${b.labelFr} : ${b.description}`;
        img.onerror = () => {
          img.style.display = "none";
        };
        profileBadgesHeader.appendChild(img);

        const card = document.createElement("div");
        card.className = "badge-card";
        card.innerHTML = `
          <img class="badge-card-icon" src="${b.icon}" alt="${b.labelFr}">
          <div>
            <div class="badge-card-title">${b.emoji ? b.emoji + " " : ""}${b.labelFr}</div>
            <div class="badge-card-desc">${b.description}</div>
          </div>
        `;
        badgesGrid.appendChild(card);
      });
    } else {
      noBadgesMessage.classList.remove("hidden");
    }

    // 2. Horodatages & Vue d'ensemble
    ovCreatedAt.textContent = snowflake.createdAtFr;
    ovAccountAge.textContent = snowflake.age.formattedFr;
    tagRelative.textContent = snowflake.discordTags.relative;
    tagFull.textContent = snowflake.discordTags.fullDate;
    tagUnix.textContent = snowflake.unixSeconds;

    // Présence Lanyard
    if (lanyard && lanyard.available) {
      const st = lanyard.status;
      statusIndicator.className = `status-indicator ${st}`;
      ovLiveStatus.className = `status-pill ${st}`;
      ovLiveStatus.textContent = st === "online" ? "En ligne" : (st === "idle" ? "Inactif" : (st === "dnd" ? "Ne pas déranger" : "Hors ligne"));

      if (lanyard.customStatus && lanyard.customStatus.text) {
        ovCustomStatusRow.classList.remove("hidden");
        ovCustomStatus.textContent = `${lanyard.customStatus.emoji || "💬"} ${lanyard.customStatus.text}`;
      } else {
        ovCustomStatusRow.classList.add("hidden");
      }

      if (lanyard.spotify && lanyard.spotify.active) {
        ovSpotifyBox.classList.remove("hidden");
        spotifyTrack.textContent = lanyard.spotify.track;
        spotifyArtist.textContent = lanyard.spotify.artist;
        spotifyAlbum.textContent = lanyard.spotify.album || "Single";
        spotifyArt.src = lanyard.spotify.albumArtUrl || "";
      } else {
        ovSpotifyBox.classList.add("hidden");
      }

      devDesktop.className = `dev-chip ${lanyard.devices.desktop ? "active" : "inactive"}`;
      devMobile.className = `dev-chip ${lanyard.devices.mobile ? "active" : "inactive"}`;
      devWeb.className = `dev-chip ${lanyard.devices.web ? "active" : "inactive"}`;
    } else {
      statusIndicator.className = "status-indicator offline";
      ovLiveStatus.className = "status-pill offline";
      ovLiveStatus.textContent = "Hors ligne / Lanyard non actif";
      ovCustomStatusRow.classList.add("hidden");
      ovSpotifyBox.classList.add("hidden");
      devDesktop.className = "dev-chip inactive";
      devMobile.className = "dev-chip inactive";
      devWeb.className = "dev-chip inactive";
    }

    // 3. Sécurité BOTdefender
    if (safety) {
      scoreValue.textContent = safety.safetyScore;
      scoreValue.style.color = safety.riskColor;
      scoreValue.parentElement.style.borderColor = safety.riskColor;
      safetyLevelBadge.textContent = safety.riskLabelFr;
      safetyLevelBadge.style.backgroundColor = `${safety.riskColor}25`;
      safetyLevelBadge.style.color = safety.riskColor;
      safetyProgressBar.style.width = `${safety.safetyScore}%`;
      safetyProgressBar.style.backgroundColor = safety.riskColor;

      // Liste des drapeaux
      defenderFlagsList.innerHTML = "";
      const allFlags = [...(safety.trustFlags || []).map(f => `🟢 ${f}`), ...(safety.threatFlags || []).map(f => `🔴 ${f}`)];
      if (allFlags.length === 0) {
        defenderFlagsList.innerHTML = "<li>Aucune anomalie détectée</li>";
      } else {
        allFlags.forEach(f => {
          const li = document.createElement("li");
          li.textContent = f;
          defenderFlagsList.appendChild(li);
        });
      }

      // Recommandations
      defenderRecommendationsList.innerHTML = "";
      (safety.recommendationsFr || []).forEach(r => {
        const li = document.createElement("li");
        li.textContent = r;
        defenderRecommendationsList.appendChild(li);
      });
    }

    // 4. Snowflake Technique
    sfTimestamp.textContent = `${snowflake.timestamp} ms`;
    sfWorkerId.textContent = snowflake.internals.workerId;
    sfProcessId.textContent = snowflake.internals.processId;
    sfIncrement.textContent = snowflake.internals.increment;

    binTimestamp.textContent = snowflake.binary.timestampBits;
    binWorker.textContent = snowflake.binary.workerBits;
    binProcess.textContent = snowflake.binary.processBits;
    binIncrement.textContent = snowflake.binary.incrementBits;

    // 5. Liens Assets HD
    avatarLinks.innerHTML = "";
    if (user?.avatar) {
      if (user.avatar.png) avatarLinks.innerHTML += `<a href="${user.avatar.png}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm">PNG HD</a>`;
      if (user.avatar.webp) avatarLinks.innerHTML += `<a href="${user.avatar.webp}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm">WebP</a>`;
      if (user.avatar.jpg) avatarLinks.innerHTML += `<a href="${user.avatar.jpg}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm">JPG</a>`;
      if (user.avatar.gif) avatarLinks.innerHTML += `<a href="${user.avatar.gif}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm">GIF Animé</a>`;
    }

    bannerLinks.innerHTML = "";
    if (user?.banner?.hasBanner) {
      if (user.banner.png) bannerLinks.innerHTML += `<a href="${user.banner.png}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm">Bannière PNG</a>`;
      if (user.banner.webp) bannerLinks.innerHTML += `<a href="${user.banner.webp}" target="_blank" rel="noreferrer" class="btn btn-secondary btn-sm">Bannière WebP</a>`;
      if (user.banner.gif) bannerLinks.innerHTML += `<a href="${user.banner.gif}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm">Bannière GIF Animée</a>`;
    } else {
      bannerLinks.innerHTML = "<span style='font-size:12px; color:var(--text-muted)'>Aucune bannière personnalisée (Couleur d'accent par défaut)</span>";
    }

    // 6. JSON Brut
    jsonViewer.textContent = JSON.stringify(data, null, 2);
  }
});
