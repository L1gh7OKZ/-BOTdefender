#!/usr/bin/env python3
"""
BOTdefender CLI (Python) - Outil d'extraction et de recherche OSINT par ID Discord
Usage : python3 cli/lookup.py <ID_DISCORD> [--token <TOKEN>] [--json]
"""

import sys
import os
import json
import re
import argparse
import datetime
import urllib.request
import urllib.error

DISCORD_EPOCH = 1420070400000

BADGES_MAP = [
    (1 << 0, "DISCORD_EMPLOYEE", "Membre du personnel Discord (Staff)", "🛡️"),
    (1 << 1, "PARTNERED_SERVER_OWNER", "Propriétaire de serveur partenaire", "👑"),
    (1 << 2, "HYPESQUAD_EVENTS", "Coordinateur HypeSquad Events", "🎉"),
    (1 << 3, "BUG_HUNTER_LEVEL_1", "Chasseur de bugs Niveau 1", "🐛"),
    (1 << 6, "HOUSE_BRAVERY", "HypeSquad Bravery (Bravoure)", "🟣"),
    (1 << 7, "HOUSE_BRILLIANCE", "HypeSquad Brilliance (Brillance)", "🔴"),
    (1 << 8, "HOUSE_BALANCE", "HypeSquad Balance (Équilibre)", "🟢"),
    (1 << 9, "EARLY_SUPPORTER", "Soutien de la première heure (Early Nitro)", "⭐"),
    (1 << 10, "TEAM_USER", "Utilisateur Équipe Discord", "👥"),
    (1 << 14, "BUG_HUNTER_LEVEL_2", "Chasseur de bugs Niveau 2", "🏅"),
    (1 << 16, "VERIFIED_BOT", "Bot Discord Vérifié", "🤖"),
    (1 << 17, "VERIFIED_DEVELOPER", "Développeur de bot vérifié pionnier", "💻"),
    (1 << 18, "CERTIFIED_MODERATOR", "Modérateur Certifié Discord", "🛡️"),
    (1 << 19, "BOT_HTTP_INTERACTIONS", "Bot Interactions HTTP", "⚡"),
    (1 << 20, "SPAMMER", "Compte Signalé Spammeur / Quarantaine", "⚠️"),
    (1 << 22, "ACTIVE_DEVELOPER", "Développeur Actif", "🚀"),
]


def clean_snowflake(raw_input: str) -> str:
    """Extrait l'ID numérique Discord valide d'une chaîne, URL ou mention."""
    if not raw_input:
        return None
    match = re.search(r"(?:^|\D)(\d{17,20})(?!\d)", str(raw_input).strip())
    return match.group(1) if match else None


def decode_snowflake(snowflake_id: str) -> dict:
    """Décode un Discord Snowflake et extrait toutes les métadonnées de création."""
    sf = int(snowflake_id)
    timestamp_ms = (sf >> 22) + DISCORD_EPOCH
    created_dt = datetime.datetime.fromtimestamp(timestamp_ms / 1000.0, tz=datetime.timezone.utc)
    now_dt = datetime.datetime.now(datetime.timezone.utc)

    worker_id = (sf & 0x3E0000) >> 17
    process_id = (sf & 0x1F000) >> 12
    increment = sf & 0xFFF

    diff = now_dt - created_dt
    total_seconds = max(0, int(diff.total_seconds()))
    total_hours = total_seconds // 3600
    total_days = max(0, diff.days)

    years = total_days // 365
    remaining_days = total_days % 365
    months = remaining_days // 30
    days = remaining_days % 30

    age_parts = []
    if years > 0:
        age_parts.append(f"{years} {'ans' if years > 1 else 'an'}")
    if months > 0:
        age_parts.append(f"{months} mois")
    if days > 0:
        age_parts.append(f"{days} {'jours' if days > 1 else 'jour'}")
    if not age_parts:
        if total_hours > 0:
            age_parts.append(f"{total_hours}h")
        else:
            age_parts.append("Moins de 24h")

    unix_seconds = int(timestamp_ms // 1000)

    # Décomposition binaire
    bin_str = bin(sf)[2:].zfill(64)

    return {
        "id": snowflake_id,
        "timestamp_ms": timestamp_ms,
        "unix_seconds": unix_seconds,
        "created_at_utc": created_dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "created_at_iso": created_dt.isoformat(),
        "discord_tags": {
            "relative": f"<t:{unix_seconds}:R>",
            "full_date": f"<t:{unix_seconds}:F>",
            "short_date": f"<t:{unix_seconds}:d>",
        },
        "age": {
            "years": years,
            "months": months,
            "days": days,
            "total_days": total_days,
            "total_hours": total_hours,
            "formatted": ", ".join(age_parts)
        },
        "internals": {
            "worker_id": worker_id,
            "process_id": process_id,
            "increment": increment
        },
        "binary": {
            "timestamp_bits": bin_str[:42],
            "worker_bits": bin_str[42:47],
            "process_bits": bin_str[47:52],
            "increment_bits": bin_str[52:64]
        }
    }


def decode_badges(flags: int) -> list:
    """Décode les badges publics d'un utilisateur Discord."""
    badges = []
    for flag_val, name, label, emoji in BADGES_MAP:
        if (flags & flag_val) == flag_val:
            badges.append({
                "name": name,
                "label": label,
                "emoji": emoji,
                "flag": flag_val
            })
    return badges


def analyze_safety(snowflake_data: dict, user_data: dict = None) -> dict:
    """Analyse de réputation et de sécurité Anti-Raid BOTdefender."""
    total_days = snowflake_data["age"]["total_days"]
    total_hours = snowflake_data["age"]["total_hours"]

    score = 50
    threats = []
    trusts = []
    recommendations = []

    if total_hours < 1:
        score = 5
        threats.append("COMPTE_CREE_IL_Y_A_MOINS_D_UNE_HEURE")
        recommendations.append("🔴 Compte créé il y a moins d'une heure ! Risque critique de raid.")
    elif total_hours < 24:
        score = 15
        threats.append("COMPTE_CREE_IL_Y_A_MOINS_DE_24H")
        recommendations.append("🔴 Compte créé aujourd'hui ! Surveiller les messages.")
    elif total_days < 7:
        score = 35
        threats.append("COMPTE_TROP_RECENT_MOINS_DE_7_JOURS")
        recommendations.append("🟠 Compte très récent (< 7 jours).")
    elif total_days < 30:
        score = 60
        threats.append("COMPTE_RECENT_MOINS_DE_30_JOURS")
        recommendations.append("🟡 Compte jeune (< 1 mois).")
    elif total_days < 365:
        score = 85
        trusts.append("COMPTE_ETABLI_PLUS_D_UN_MOIS")
        recommendations.append("🟢 Compte établi sans risque majeur.")
    else:
        score = 100
        trusts.append("COMPTE_ANCIEN_PLUS_D_UN_AN")
        recommendations.append("⭐ Compte ancien de confiance (> 1 an).")

    if user_data:
        badges = user_data.get("badges", [])
        badge_names = [b["name"] for b in badges]

        if "SPAMMER" in badge_names:
            score = max(0, score - 60)
            threats.append("COMPTE_SIGNALE_SPAMMEUR_PAR_DISCORD")
            recommendations.insert(0, "🚨 Compte classé SPAMMEUR par Discord !")

        if any(b in badge_names for b in ["DISCORD_EMPLOYEE", "PARTNERED_SERVER_OWNER", "CERTIFIED_MODERATOR", "VERIFIED_DEVELOPER"]):
            score = min(100, score + 15)
            trusts.append("BADGE_OFFICIEL_VERIFIE")

        if "EARLY_SUPPORTER" in badge_names:
            score = min(100, score + 10)
            trusts.append("SOUTIEN_HISTORIQUE_EARLY_SUPPORTER")

        if user_data.get("is_bot"):
            if "VERIFIED_BOT" in badge_names:
                trusts.append("BOT_VERIFIE")
            else:
                score = max(5, score - 20)
                threats.append("BOT_NON_VERIFIE")

    score = max(0, min(100, score))

    if score >= 75:
        risk_label = "Compte Sûr & Établi"
    elif score >= 50:
        risk_label = "Risque Modéré"
    elif score >= 25:
        risk_label = "Risque Élevé"
    else:
        risk_label = "Risque Critique (Raid)"

    return {
        "score": score,
        "risk_label": risk_label,
        "trust_flags": trusts,
        "threat_flags": threats,
        "recommendations": recommendations
    }


def fetch_discord_api(user_id: str, bot_token: str = None) -> dict:
    """Interroge l'API Discord v10 si un token est disponible."""
    token = (bot_token or os.environ.get("DISCORD_BOT_TOKEN") or "").strip()
    if not token:
        return None

    auth_header = token if token.startswith("Bot ") or token.startswith("Bearer ") else f"Bot {token}"
    req = urllib.request.Request(
        f"https://discord.com/api/v10/users/{user_id}",
        headers={
            "Authorization": auth_header,
            "User-Agent": "BOTdefender-Lookup/1.0"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=3.5) as response:
            if response.status == 200:
                raw = json.loads(response.read().decode("utf-8"))
                flags = raw.get("public_flags", 0) or raw.get("flags", 0)
                accent = raw.get("accent_color")
                accent_hex = f"#{(accent & 0xFFFFFF):06x}" if accent is not None else "#5865F2"

                return {
                    "id": raw.get("id"),
                    "username": raw.get("username"),
                    "global_name": raw.get("global_name"),
                    "discriminator": raw.get("discriminator", "0"),
                    "is_bot": bool(raw.get("bot", False)),
                    "is_system": bool(raw.get("system", False)),
                    "flags": flags,
                    "badges": decode_badges(flags),
                    "avatar_url": f"https://cdn.discordapp.com/avatars/{user_id}/{raw.get('avatar')}.png?size=1024" if raw.get("avatar") else None,
                    "banner_url": f"https://cdn.discordapp.com/banners/{user_id}/{raw.get('banner')}.png?size=1024" if raw.get("banner") else None,
                    "accent_color": accent_hex
                }
    except Exception:
        return None


def main():
    parser = argparse.ArgumentParser(description="🛡️ BOTdefender - Recherche OSINT Discord par ID")
    parser.add_argument("id", nargs="?", help="ID Discord (17-20 chiffres) ou mention")
    parser.add_argument("--token", help="Token de bot Discord pour requête API en direct")
    parser.add_argument("--json", action="store_true", help="Afficher la sortie en JSON pur")

    args = parser.parse_args()

    target_id = clean_snowflake(args.id)
    if not target_id:
        if args.json:
            print(json.dumps({"error": "Veuillez fournir un ID Discord valide"}))
            sys.exit(1)
        try:
            user_input = input("Entrez l'ID Discord à rechercher : ")
            target_id = clean_snowflake(user_input)
        except (KeyboardInterrupt, EOFError):
            sys.exit(0)

        if not target_id:
            print("❌ ID Discord invalide (doit contenir entre 17 et 20 chiffres).")
            sys.exit(1)

    snowflake = decode_snowflake(target_id)
    user = fetch_discord_api(target_id, args.token)
    safety = analyze_safety(snowflake, user)

    output = {
        "id": target_id,
        "snowflake": snowflake,
        "user": user,
        "safety": safety
    }

    if args.json:
        print(json.dumps(output, indent=2, ensure_ascii=False))
        return

    print("\n" + "=" * 60)
    print("🛡️  BOTdefender • Rapport OSINT Discord (Python CLI)")
    print("=" * 60)
    print(f"\n📌 INFORMATIONS COMPTE :")
    print(f"  • ID Discord       : {target_id}")
    if user:
        print(f"  • Pseudo           : @{user['username']}")
        print(f"  • Nom d'affichage  : {user['global_name'] or 'Non défini'}")
        print(f"  • Type             : {'🤖 Bot Discord' if user['is_bot'] else '👤 Utilisateur'}")
    else:
        print(f"  • Pseudo           : (Spécifiez --token pour obtenir le profil en direct)")

    print(f"\n📅 HORODATAGE & CRÉATION (SNOWFLAKE) :")
    print(f"  • Date de Création : {snowflake['created_at_utc']}")
    print(f"  • Âge du Compte    : {snowflake['age']['formatted']} ({snowflake['age']['total_days']} jours)")
    print(f"  • Tag Discord      : {snowflake['discord_tags']['full_date']} ({snowflake['discord_tags']['relative']})")
    print(f"  • Worker / Process : Worker #{snowflake['internals']['worker_id']} | Process #{snowflake['internals']['process_id']}")

    if user and user.get("badges"):
        print(f"\n🏆 BADGES DISCORD ({len(user['badges'])}) :")
        for b in user["badges"]:
            print(f"  {b['emoji']}  {b['label']} ({b['name']})")

    print(f"\n🛡️ SÉCURITÉ BOTDEFENDER :")
    print(f"  • Score de Confiance : {safety['score']}/100")
    print(f"  • Évaluation         : {safety['risk_label']}")
    if safety["recommendations"]:
        print(f"  • Conseil            : {safety['recommendations'][0]}")

    if user and user.get("avatar_url"):
        print(f"\n🖼️ ASSETS :")
        print(f"  • Avatar HD : {user['avatar_url']}")
        if user.get("banner_url"):
            print(f"  • Bannière  : {user['banner_url']}")

    print("\n" + "=" * 60 + "\n")


if __name__ == "__main__":
    main()
