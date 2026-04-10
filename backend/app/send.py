import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
import os
from concurrent.futures import ThreadPoolExecutor

# Configuration email depuis les variables d'environnement ou valeurs par défaut
EMAIL_SENDER = os.getenv('EMAIL_SENDER', "fafa000fafa0n1@gmail.com")
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', "osbzapaarfetocco")
SMTP_SERVER = os.getenv('SMTP_SERVER', "smtp.gmail.com")
SMTP_PORT = int(os.getenv('SMTP_PORT', 465))

# Liste des destinataires par défaut (administrateurs)
EMAIL_RECEIVERS = ["haaahiii012@gmail.com"]

# Thread pool pour l'exécution asynchrone
executor = ThreadPoolExecutor(max_workers=3)


def send_alert_email(bin_id: str, location: str, fill_level: float, status: str, additional_email: str = None):
    """Envoie un email d'alerte pour une poubelle critique"""
    
    # Préparer le sujet selon le statut
    if status == "critical" or fill_level >= 95:
        subject = f"🚨 ALERTE URGENTE - Poubelle {bin_id}"
        priority = "Urgent"
    elif status == "attention" or fill_level >= 80:
        subject = f" ALERTE - Poubelle {bin_id}"
        priority = "Important"
    else:
        subject = f" Information - Poubelle {bin_id}"
        priority = "Normal"

    # Corps de l'email en HTML pour un meilleur rendu
    html_body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #10b981; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }}
            .alert-box {{ background-color: {'#fef2f2' if status == 'critical' else '#fef3c7' if status == 'attention' else '#eff6ff'}; 
                          border-left: 4px solid {'#dc2626' if status == 'critical' else '#f59e0b' if status == 'attention' else '#3b82f6'}; 
                          padding: 15px; margin: 15px 0; }}
            .details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
            .label {{ font-weight: bold; color: #4b5563; }}
            .value {{ color: #1f2937; }}
            .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
            .button {{ display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; 
                       text-decoration: none; border-radius: 5px; margin: 10px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1> SmartWaste - Système de Gestion des Déchets</h1>
            </div>
            
            <div class="content">
                <div class="alert-box">
                    <h2 style="margin-top: 0;">{'🚨 ALERTE URGENTE' if status == 'critical' else '⚠️ ALERTE' if status == 'attention' else 'ℹ️ INFORMATION'}</h2>
                    <p><strong>Priorité:</strong> {priority}</p>
                    <p>Une alerte a été détectée pour la poubelle <strong>{bin_id}</strong></p>
                </div>

                <div class="details">
                    <h3>Détails de la poubelle</h3>
                    <div class="detail-row">
                        <span class="label">ID Poubelle:</span>
                        <span class="value">{bin_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Localisation:</span>
                        <span class="value">{location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Niveau de remplissage:</span>
                        <span class="value" style="color: {'#dc2626' if fill_level >= 95 else '#f59e0b' if fill_level >= 80 else '#10b981'};">
                            <strong>{fill_level}%</strong>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Statut:</span>
                        <span class="value">{status.upper()}</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:3000/dashboard" class="button">
                        Voir dans le Dashboard
                    </a>
                </div>

                <p style="margin-top: 20px;">
                    {'<strong>Action requise:</strong> Une collecte urgente est nécessaire.' if status == 'critical' else 
                     '<strong>Action recommandée:</strong> Planifier une collecte prochainement.' if status == 'attention' else 
                     'Surveillance continue en cours.'}
                </p>
            </div>

            <div class="footer">
                <p>Ceci est un message automatique du système SmartWaste</p>
                <p>Commune de Fianarantsoa - Gestion Intelligente des Déchets</p>
                <p>© 2026 SmartWaste - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>
    """

    # Version texte simple comme fallback
    text_body = f"""
Bonjour,

Une alerte a été détectée pour la poubelle {bin_id}.

Détails :
- ID Poubelle : {bin_id}
- Localisation : {location}
- Niveau de remplissage : {fill_level}%
- Statut : {status}
- Priorité : {priority}

{'Action requise : Une collecte urgente est nécessaire.' if status == 'critical' else 
 'Action recommandée : Planifier une collecte prochainement.' if status == 'attention' else 
 'Surveillance continue en cours.'}

Veuillez prendre les mesures nécessaires.

Cordialement,
Système SmartWaste
Commune de Fianarantsoa
"""

    # Préparer la liste des destinataires
    receivers = EMAIL_RECEIVERS.copy()
    if additional_email and additional_email not in receivers:
        receivers.append(additional_email)

    # Créer le message multipart
    msg = MIMEMultipart('alternative')
    msg["Subject"] = subject
    msg["From"] = f"SmartWaste <{EMAIL_SENDER}>"
    msg["To"] = ", ".join(receivers)
    
    # Ajouter priorité pour les emails urgents
    if status == "critical":
        msg["X-Priority"] = "1"
        msg["Importance"] = "high"

    # Attacher les versions texte et HTML
    part1 = MIMEText(text_body, 'plain', 'utf-8')
    part2 = MIMEText(html_body, 'html', 'utf-8')
    msg.attach(part1)
    msg.attach(part2)

    try:
        print(f" Tentative envoi email pour {bin_id} à {len(receivers)} destinataire(s)")
        print(f"   Destinataires: {receivers}")
        print(f"   Priorité: {priority}")
        
        # Connexion SMTP avec SSL
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_SENDER, receivers, msg.as_string())
        
        print(f" Email d'alerte envoyé avec succès pour {bin_id}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f" Erreur d'authentification SMTP pour {bin_id}: {e}")
        print("   Vérifiez EMAIL_SENDER et EMAIL_PASSWORD dans les variables d'environnement")
        return False
    except smtplib.SMTPException as e:
        print(f" Erreur SMTP pour {bin_id}: {e}")
        return False
    except Exception as e:
        print(f" Erreur inattendue lors de l'envoi email pour {bin_id}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def send_alert_email_async(bin_id: str, location: str, fill_level: float, status: str, additional_email: str = None):
    """Version asynchrone pour l'envoi d'email sans bloquer le serveur"""
    loop = asyncio.get_event_loop()
    print("USER MAIL:: ",additional_email) 
    try:
        # Exécuter send_alert_email dans un thread séparé
        result = await loop.run_in_executor(
            executor,
            send_alert_email,
            bin_id,
            location,
            fill_level,
            status,
            additional_email
        )
        return result
    except Exception as e:
        print(f" Erreur async email pour {bin_id}: {e}")
        return False


# Test de la fonction (à exécuter uniquement en mode développement)
if __name__ == "__main__":
    print(" Test d'envoi d'email...")
    result = send_alert_email(
        bin_id="POUB_001",
        location="Rue de la Paix, Fianarantsoa",
        fill_level=98.5,
        status="critical"
    )
    print(f"Résultat du test: {' Succès' if result else ' Échec'}")