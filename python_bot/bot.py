#!/usr/bin/env python3
"""
BOTdefender - Bot Discord de Défense et Recherche OSINT (discord.py)
"""

import os
import re
import datetime
import discord
from discord.ext import commands
from discord import app_commands
from dotenv import load_dotenv

load_dotenv()

DISCORD_EPOCH = 1420070400000

BADGES_MAP = [
    (1 << 0, "DISCORD_EMPLOYEE", "Membre du personnel Discord", "🛡️"),
    (1 << 1, "PARTNERED_SERVER_OWNER", "Propriétaire de serveur partenaire", "👑"),
    (1 << 2, "HYPESQUAD_EVENTS", "Coordinateur HypeSquad Events", "🎉"),
    (1 << 3, "BUG_HUNTER_LEVEL_1", "Chasseur de bugs Niveau 1", "🐛"),
    (1 << 6, "HOUSE_BRAVERY", "HypeSquad Bravery (Bravoure)", "🟣"),
    (1 << 7, "HOUSE_BRILLIANCE", "HypeSquad Brilliance (Brillance)", "🔴"),
    (1 << 8, "HOUSE_BALANCE", "HypeSquad Balance (Équilibre)", "🟢"),
    (1 << 9, "EARLY_SUPPORTER", "Soutien de la première heure", "⭐"),
    (1 << 10, "TEAM_USER", "Utilisateur Équipe Discord", "👥"),
    (1 << 14, "BUG_HUNTER_LEVEL_2", "Chasseur de bugs Niveau 2", "🏅"),
    (1 << 16, "VERIFIED_BOT", "Bot Discord Vérifié", "🤖"),
    (1 << 17, "VERIFIED_DEVELOPER", "Développeur de bot vérifié pionnier", "💻"),
    (1 << 18, "CERTIFIED_MODERATOR", "Modérateur Certifié Discord", "🛡️"),
    (1 << 19, "BOT_HTTP_INTERACTIONS", "Bot Interactions HTTP", "⚡"),
    (1 << 22, "ACTIVE_DEVELOPER", "Développeur Actif", "🚀"),
]


def clean_snowflake(raw_input: str) -> str:
    if not raw_input:
        return None
    match = re.search(r"\b(\d{17,20})\b", str(raw_input))
    return match.group(1) if match else None


def decode_snowflake(snowflake_id: str) -> dict:
    sf = int(snowflake_id)
    timestamp_ms = (sf >> 22) + DISCORD_EPOCH
    created_dt = datetime.datetime.fromtimestamp(timestamp_ms / 1000.0, tz=datetime.timezone.utc)
    now_dt = datetime.datetime.now(datetime.timezone.utc)

    worker_id = (sf & 0x3E0000) >> 17
    process_id = (sf & 0x1F000) >> 12
    increment = sf & 0xFFF

    diff = now_dt - created_dt
    total_days = diff.days
    years = total_days // 365
    months = (total_days % 365) // 30
    days = (total_days % 365) % 30

    age_parts = []
    if years > 0:
        age_parts.append(f"{years} {'ans' if years > 1 else 'an'}")
    if months > 0:
        age_parts.append(f"{months} mois")
    if days > 0:
        age_parts.append(f"{days} {'jours' if days > 1 else 'jour'}")
    if not age_parts:
        age_parts.append("Moins de 24h")

    unix_seconds = int(timestamp_ms // 1000)

    return {
        "id": snowflake_id,
        "timestamp_ms": timestamp_ms,
        "unix_seconds": unix_seconds,
        "created_at_utc": created_dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "discord_tags": {
            "relative": f"<t:{unix_seconds}:R>",
            "full_date": f"<t:{unix_seconds}:F>",
        },
        "age_formatted": ", ".join(age_parts),
        "total_days": total_days,
        "worker_id": worker_id,
        "process_id": process_id,
        "increment": increment
    }


def analyze_safety(total_days: int, is_bot: bool, badges: list) -> dict:
    score = 50
    threats = []
    trusts = []
    recommendations = []

    if total_days < 1:
        score = 10
        threats.append("COMPTE_CREE_AUJOURDHUI")
        recommendations.append("🔴 Compte créé aujourd'hui ! Risque de raid / bot spammer.")
    elif total_days < 7:
        score = 30
        threats.append("COMPTE_MOINS_DE_7_JOURS")
        recommendations.append("🟠 Compte très récent (< 7 jours).")
    elif total_days < 30:
        score = 60
        threats.append("COMPTE_MOINS_DE_30_JOURS")
        recommendations.append("🟡 Compte récent (< 1 mois).")
    elif total_days < 365:
        score = 85
        trusts.append("COMPTE_ETABLI")
        recommendations.append("🟢 Compte établi sans risque majeur.")
    else:
        score = 100
        trusts.append("COMPTE_VETERAN")
        recommendations.append("⭐ Compte ancien de confiance (> 1 an).")

    if badges:
        score = min(100, score + 10)
        trusts.append("POSSEDE_DES_BADGES")

    risk_label = "Compte Sûr & Établi" if score >= 75 else ("Risque Modéré" if score >= 50 else ("Risque Élevé" if score >= 25 else "Risque Critique (Raid)"))
    color = 0x57F287 if score >= 75 else (0xFEE75C if score >= 50 else (0xF47B67 if score >= 25 else 0xED4245))

    return {
        "score": score,
        "risk_label": risk_label,
        "color": color,
        "threats": threats,
        "trusts": trusts,
        "recommendations": recommendations
    }


# Initialisation du client Discord.py
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix=os.environ.get("BOT_PREFIX", "!"), intents=intents)


@bot.event
async def on_ready():
    print(f"🤖 BOTdefender (Python) connecté en tant que {bot.user}")
    try:
        synced = await bot.tree.sync()
        print(f"✅ {len(synced)} commandes Slash synchronisées !")
    except Exception as e:
        print(f"⚠️ Erreur de synchronisation Slash : {e}")


@bot.tree.command(name="lookup", description="🔍 Recherche les données d'un utilisateur Discord par ID ou mention")
@app_commands.describe(utilisateur="ID Discord ou mention de l'utilisateur")
async def slash_lookup(interaction: discord.Interaction, utilisateur: str):
    await interaction.response.defer()
    target_id = clean_snowflake(utilisateur)

    if not target_id:
        await interaction.followup.send("❌ ID Discord invalide (doit contenir 17-20 chiffres).")
        return

    sf = decode_snowflake(target_id)

    # Récupération de l'utilisateur via l'API Discord
    user = None
    try:
        user = await bot.fetch_user(int(target_id))
    except Exception:
        pass

    badges = []
    if user and hasattr(user, "public_flags"):
        flags_val = user.public_flags.value
        for flag_val, name, label, emoji in BADGES_MAP:
            if (flags_val & flag_val) == flag_val:
                badges.append((label, emoji))

    safety = analyze_safety(sf["total_days"], user.bot if user else False, badges)

    embed = discord.Embed(
        title=f"🔍 OSINT Lookup : {user.name if user else f'Utilisateur {target_id}'}",
        description=f"**ID :** `{target_id}`\n**Mention :** <@{target_id}>",
        color=safety["color"]
    )

    if user and user.avatar:
        embed.set_thumbnail(url=user.avatar.url)

    embed.add_field(
        name="📅 Création du Compte",
        value=f"{sf['discord_tags']['full_date']}\n{sf['discord_tags']['relative']}",
        inline=True
    )
    embed.add_field(
        name="⏳ Ancienneté",
        value=f"`{sf['age_formatted']}`\n({sf['total_days']} jours)",
        inline=True
    )
    embed.add_field(
        name="🤖 Type",
        value="🤖 Bot Discord" if (user and user.bot) else "👤 Utilisateur Humain",
        inline=True
    )

    if badges:
        embed.add_field(
            name=f"🏆 Badges Publics ({len(badges)})",
            value="\n".join([f"{emoji} {label}" for label, emoji in badges]),
            inline=False
        )

    embed.add_field(
        name="🛡️ Score BOTdefender",
        value=f"**Confiance :** `{safety['score']}/100` ({safety['risk_label']})\n{safety['recommendations'][0]}",
        inline=False
    )

    if user and user.banner:
        embed.set_image(url=user.banner.url)

    embed.set_footer(text="BOTdefender Python Edition")
    await interaction.followup.send(embed=embed)


@bot.command(name="lookup", aliases=["userinfo", "whois", "check"])
async def cmd_lookup(ctx, utilisateur: str = None):
    target_input = utilisateur or str(ctx.author.id)
    target_id = clean_snowflake(target_input)

    if not target_id:
        await ctx.reply("❌ Syntaxe : `!lookup <ID ou @mention>`")
        return

    sf = decode_snowflake(target_id)
    user = None
    try:
        user = await bot.fetch_user(int(target_id))
    except Exception:
        pass

    badges = []
    if user and hasattr(user, "public_flags"):
        flags_val = user.public_flags.value
        for flag_val, name, label, emoji in BADGES_MAP:
            if (flags_val & flag_val) == flag_val:
                badges.append((label, emoji))

    safety = analyze_safety(sf["total_days"], user.bot if user else False, badges)

    embed = discord.Embed(
        title=f"🛡️ BOTdefender : {user.name if user else target_id}",
        description=f"**ID :** `{target_id}` | <@{target_id}>",
        color=safety["color"]
    )
    if user and user.avatar:
        embed.set_thumbnail(url=user.avatar.url)

    embed.add_field(name="📅 Création", value=f"{sf['discord_tags']['full_date']}", inline=True)
    embed.add_field(name="⏳ Âge", value=f"{sf['age_formatted']}", inline=True)
    embed.add_field(name="🛡️ Sécurité", value=f"`{safety['score']}/100` - {safety['risk_label']}", inline=False)

    await ctx.reply(embed=embed)


if __name__ == "__main__":
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if token:
        bot.run(token)
    else:
        print("⚠️ Aucun DISCORD_BOT_TOKEN renseigné dans le fichier .env")
