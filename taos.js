import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuration Firebase ShaolinApp
const firebaseConfig = {
  apiKey: "AIzaSyCb4isUEJUeHTiylyFrWEqP3WhU0A2Wc4A",
  authDomain: "shaolinapp-466e8.firebaseapp.com",
  projectId: "shaolinapp-466e8",
  storageBucket: "shaolinapp-466e8.firebasestorage.app",
  messagingSenderId: "715800083026",
  appId: "1:715800083026:web:0a51748663f4fddd29bd8b",
  measurementId: "G-5GGYZYMSB4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Paramètres
const NUMERO_ORANGE_MONEY = "90 84 26 21";
const NUMERO_WHATSAPP = "22390842621"; 
const MOT_DE_PASSE_ADMIN = "Shaolin2027"; 
const DUREE_ABONNEMENT_JOURS = 7;

let videoEnAttente = null;

// Ordre logique strict des niveaux pour l'affichage
const ordreNiveaux = {
    "salutation": 0,
    "1ère barrette": 1,
    "2ème barrette": 2,
    "3ème barrette": 3,
    "4ème barrette": 4,
    "5ème barrette": 5,
    "6ème barrette": 6,
    "7ème barrette": 7,
    "8ème barrette": 8,
    "9ème barrette": 9
};

// Liste complète des vidéos classées par barrettes
const listeVideos = [
    // --- Salutation (100% Gratuit) ---
    { titre: "Salutation 1", description: "Le salut traditionnel des mains", duree: "5 min", niveau: "Salutation", fichier: "videos/salutation1.mp4" },
    { titre: "Salutation 2", description: "Posture de respect et d'ouverture", duree: "6 min", niveau: "Salutation", fichier: "videos/salutation2.mp4" },
    { titre: "Salutation 3", description: "Entrée en garde initiale", duree: "7 min", niveau: "Salutation", fichier: "videos/salutation3.mp4" },

    // --- 1ère barrette ---
    { titre: "1ère barrette - A", description: "Premiers pas et déplacements de base", duree: "10 min", niveau: "1ère barrette", fichier: "videos/b1_1.mp4" },
    { titre: "1ère barrette - B", description: "Technique de frappe frontale", duree: "8 min", niveau: "1ère barrette", fichier: "videos/b1_2.mp4" },
    { titre: "1ère barrette - C", description: "Blocage bas et contre-attaque", duree: "12 min", niveau: "1ère barrette", fichier: "videos/b1_3.mp4" },

    // --- 2ème barrette ---
    { titre: "2ème barrette - A", description: "Enchaînement des poings moyens", duree: "11 min", niveau: "2ème barrette", fichier: "videos/b2_1.mp4" },
    { titre: "2ème barrette - B", description: "Positions et stabilité latérale", duree: "9 min", niveau: "2ème barrette", fichier: "videos/b2_2.mp4" },
    { titre: "2ème barrette - C", description: "Esquives et mouvements fluides", duree: "14 min", niveau: "2ème barrette", fichier: "videos/b2_3.mp4" },

    // --- 3ème barrette ---
    { titre: "3ème barrette - A", description: "Coups de pied de base (Ma Geui)", duree: "12 min", niveau: "3ème barrette", fichier: "videos/b3_1.mp4" },
    { titre: "3ème barrette - B", description: "Combinaisons de bras et jambes", duree: "15 min", niveau: "3ème barrette", fichier: "videos/b3_2.mp4" },
    { titre: "3ème barrette - C", description: "Application en binôme (partie 1)", duree: "10 min", niveau: "3ème barrette", fichier: "videos/b3_3.mp4" },

    // --- 4ème barrette ---
    { titre: "4ème barrette - A", description: "Techniques de balayage simple", duree: "11 min", niveau: "4ème barrette", fichier: "videos/b4_1.mp4" },
    { titre: "4ème barrette - B", description: "Enchaînement technique intermédiaire", duree: "16 min", niveau: "4ème barrette", fichier: "videos/b4_2.mp4" },
    { titre: "4ème barrette - C", description: "Contrôle de l'équilibre", duree: "9 min", niveau: "4ème barrette", fichier: "videos/b4_3.mp4" },

    // --- 5ème barrette ---
    { titre: "5ème barrette - A", description: "Premières armes courtes (Bâton court)", duree: "18 min", niveau: "5ème barrette", fichier: "videos/b5_1.mp4" },
    { titre: "5ème barrette - B", description: "Manoeuvres de défense au bâton", duree: "13 min", niveau: "5ème barrette", fichier: "videos/b5_2.mp4" },
    { titre: "5ème barrette - C", description: "Fluidité des rotations d'armes", duree: "15 min", niveau: "5ème barrette", fichier: "videos/b5_3.mp4" },

    // --- 6ème barrette ---
    { titre: "6ème barrette - A", description: "Techniques de griffe avancées", duree: "12 min", niveau: "6ème barrette", fichier: "videos/b6_1.mp4" },
    { titre: "6ème barrette - B", description: "Séquence de combat souple", duree: "17 min", niveau: "6ème barrette", fichier: "videos/b6_2.mp4" },
    { titre: "6ème barrette - C", description: "Rythme et respiration", duree: "10 min", niveau: "6ème barrette", fichier: "videos/b6_3.mp4" },

    // --- 7ème barrette ---
    { titre: "7ème barrette - A", description: "Sauts et acrobaties de base", duree: "14 min", niveau: "7ème barrette", fichier: "videos/b7_1.mp4" },
    { titre: "7ème barrette - B", description: "Enchaînement supérieur rapide", duree: "19 min", niveau: "7ème barrette", fichier: "videos/b7_2.mp4" },
    { titre: "7ème barrette - C", description: "Application réaliste des techniques", duree: "15 min", niveau: "7ème barrette", fichier: "videos/b7_3.mp4" },

    // --- 8ème barrette ---
    { titre: "8ème barrette - A", description: "Maîtrise du grand bâton (Gun)", duree: "20 min", niveau: "8ème barrette", fichier: "videos/b8_1.mp4" },
    { titre: "8ème barrette - B", description: "Défense contre multiples attaques", duree: "16 min", niveau: "8ème barrette", fichier: "videos/b8_2.mp4" },
    { titre: "8ème barrette - C", description: "Précision et puissance des impacts", duree: "12 min", niveau: "8ème barrette", fichier: "videos/b8_3.mp4" },

    // --- 9ème barrette ---
    { titre: "9ème barrette - A", description: "Maîtrise complète du Tao supérieur", duree: "25 min", niveau: "9ème barrette", fichier: "videos/b9_1.mp4" },
    { titre: "9ème barrette - B", description: "Expertise technique et posture maître", duree: "22 min", niveau: "9ème barrette", fichier: "videos/b9_2.mp4" },
    { titre: "9ème barrette - C", description: "Synthèse et transmission des savoirs", duree: "30 min", niveau: "9ème barrette", fichier: "videos/b9_3.mp4" }
];

let niveauActuel = 'Tous';

// Règle de gratuité : Tout "Salutation" est gratuit, et le 1er Tao de chaque barrette (ex: - A) est gratuit. Les - B et - C sont payants.
function estTaoGratuit(video) {
    if (!video || !video.niveau) return false;
    const niv = video.niveau.toLowerCase().trim();
    if (niv === "salutation") return true;

    const memeNiveau = listeVideos.filter(v => v.niveau.toLowerCase().trim() === niv);
    return memeNiveau.length > 0 && memeNiveau[0].titre.trim() === video.titre.trim();
}

async function verifierAbonnementValide(titreVideo) {
    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";
    if (estAdmin) return true;

    const abonnementLocal = JSON.parse(localStorage.getItem("abonn_shaolin_taos_" + titreVideo) || "null");
    if (abonnementLocal && abonnementLocal.dateExpiration) {
        if (new Date().getTime() < abonnementLocal.dateExpiration) {
            return true;
        }
    }

    const telEleve = localStorage.getItem("shaolin_user_phone");
    if (telEleve) {
        try {
            const docRef = doc(db, "abonnements_taos", `${telEleve}_${titreVideo}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (new Date().getTime() < data.dateExpiration) {
                    localStorage.setItem("abonn_shaolin_taos_" + titreVideo, JSON.stringify(data));
                    return true;
                }
            }
        } catch (e) {
            console.error("Erreur de synchronisation distant:", e);
        }
    }

    return false;
}

async function afficherVideos(videos) {
    const grid = document.getElementById('gridVideos');
    if (!grid) return;
    grid.innerHTML = "";

    const videosTriees = [...videos].sort((a, b) => {
        let nivA = (a.niveau || "").toLowerCase().trim();
        let nivB = (b.niveau || "").toLowerCase().trim();
        let ordreA = ordreNiveaux[nivA] !== undefined ? ordreNiveaux[nivA] : 99;
        let ordreB = ordreNiveaux[nivB] !== undefined ? ordreNiveaux[nivB] : 99;
        
        if (ordreA !== ordreB) {
            return ordreA - ordreB;
        }
        return a.titre.localeCompare(b.titre);
    });

    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";

    for (const video of videosTriees) {
        let fichierSource = video.fichier || "#";
        const estGratuit = estTaoGratuit(video);
        const aPaye = await verifierAbonnementValide(video.titre);
        const accesAccorde = estGratuit || estAdmin || aPaye;

        let badgeHtml = "";
        if (estAdmin) {
            badgeHtml = `<span style="background: #e0f2fe; color: #0284c7; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;">👑 Admin</span>`;
        } else if (estGratuit) {
            badgeHtml = `<span style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;">🟢 Gratuit</span>`;
        } else if (aPaye) {
            badgeHtml = `<span style="background: #dcfce7; color: #15803d; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;">✅ Débloqué (7j)</span>`;
        } else {
            badgeHtml = `<span style="background: #fee2e2; color: #b91c1c; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 4px;">🔒 1 000 FCFA</span>`;
        }

        let titreSecurise = video.titre.replace(/'/g, "\\'");
        let descSecurisee = video.description.replace(/'/g, "\\'");

        // Bouton Télécharger affiché uniquement si l'accès est accordé (Gratuit, Admin ou Payé)
        let boutonTelechargerHtml = "";
        if (accesAccorde) {
            boutonTelechargerHtml = `<a href="${fichierSource}" download style="flex: 1; background: #10b981; color: white; text-align: center; padding: 8px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; justify-content: center;">📥 Télécharger</a>`;
        } else {
            boutonTelechargerHtml = `<div style="flex: 1; background: #f1f5f9; color: #94a3b8; text-align: center; padding: 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;" title="Téléchargement verrouillé (Paiement requis)">🔒 Verrouillé</div>`;
        }

        grid.innerHTML += `
            <div class="video-item" style="display: flex; flex-direction: column; justify-content: space-between; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div class="video-thumb" style="font-weight: bold; color: #0f172a;">🎬 ${video.titre}</div>
                        ${badgeHtml}
                    </div>
                    <h4 style="margin: 5px 0; color: #334155; font-size: 0.95rem;">${video.description}</h4>
                    <p style="color: #64748b; font-size: 0.8rem; margin: 5px 0;">Niveau : ${video.niveau} | Durée : ${video.duree}</p>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 15px;">
                    <button onclick="ouvrirLecteur('${titreSecurise}', '${descSecurisee}', '${fichierSource}')" style="flex: 1; background: #2563eb; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">Regarder</button>
                    ${boutonTelechargerHtml}
                </div>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    afficherVideos(listeVideos);
    ecouterDemandesDistant();

    const searchEl = document.getElementById('searchVideo');
    if (searchEl) {
        searchEl.addEventListener('keyup', filtrerVideos);
    }
});

function filtrerVideos() {
    let searchEl = document.getElementById('searchVideo');
    let recherche = searchEl ? searchEl.value.toLowerCase().trim() : "";
    
    let videosFiltrees = listeVideos.filter(video => {
        let correspondRecherche = video.titre.toLowerCase().includes(recherche) || 
                                  video.description.toLowerCase().includes(recherche) ||
                                  video.niveau.toLowerCase().includes(recherche);
        
        let correspondNiveau = (niveauActuel === 'Tous' || video.niveau.toLowerCase().trim() === niveauActuel.toLowerCase().trim());
        
        return correspondRecherche && correspondNiveau;
    });

    afficherVideos(videosFiltrees);
}

function filtrerParNiveau(niveau, elementBtn) {
    niveauActuel = niveau;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.style.background = '#f1f5f9';
        btn.style.color = '#1e293b';
        btn.classList.remove('active');
    });
    
    if (elementBtn) {
        elementBtn.style.background = '#2563eb';
        elementBtn.style.color = 'white';
        elementBtn.classList.add('active');
    }
    
    filtrerVideos();
}

async function ouvrirLecteur(titre, description, fichier) {
    const video = listeVideos.find(v => v.titre.toLowerCase().trim() === titre.toLowerCase().trim());
    if (!video) return;

    videoEnAttente = video;

    const estGratuit = estTaoGratuit(video);
    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";
    const aPaye = await verifierAbonnementValide(video.titre);

    if (estGratuit || estAdmin || aPaye) {
        lancerLecteurOriginal(video.titre, description, fichier);
    } else {
        afficherModalPaiement(video);
    }
}

function lancerLecteurOriginal(titre, description, fichier) {
    const modal = document.getElementById('videoModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const videoPlayer = document.getElementById('modalVideoPlayer');

    if (modal && modalTitle && modalDesc && videoPlayer) {
        modalTitle.innerText = titre;
        modalDesc.innerText = description + " - Vidéo de révision à distance.";
        videoPlayer.src = fichier;
        modal.style.display = 'flex';
        videoPlayer.play().catch(() => {});
    }
}

function fermerLecteur() {
    const modal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('modalVideoPlayer');
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.src = "";
    }
    if (modal) modal.style.display = 'none';
}

function afficherModalPaiement(video) {
    let modal = document.getElementById("modalPaiementTao");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modalPaiementTao";
        document.body.appendChild(modal);
    }

    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.85); display:flex; justify-content:center; align-items:center; z-index:9999; padding:15px; box-sizing:border-box;";

    modal.innerHTML = `
        <div style="background:#ffffff; width:100%; max-width:420px; padding:20px; border-radius:14px; box-shadow:0 10px 25px rgba(0,0,0,0.3); font-family:sans-serif; position:relative;">
            <button onclick="fermerModalPaiement()" style="position:absolute; top:12px; right:15px; background:none; border:none; font-size:1.4rem; cursor:pointer;">✖</button>

            <h3 style="margin-top:0; color:#b91c1c; font-size:1.2rem; text-align:center;">🔒 Contenu Payant (1 000 FCFA)</h3>
            <p style="font-size:0.85rem; color:#475569; text-align:center; margin-bottom:12px;">
                Pour débloquer <strong>${video.titre}</strong> pendant 7 jours :
            </p>

            <div style="background:#f1f5f9; padding:10px; border-radius:8px; text-align:center; margin-bottom:12px; border:1px dashed #cbd5e1;">
                <span style="font-size:0.75rem; color:#64748b; display:block;">Envoyez 1 000 FCFA à Orange Money :</span>
                <strong style="font-size:1.1rem; color:#0f172a;">+223 ${NUMERO_ORANGE_MONEY}</strong>
            </div>

            <div style="margin-bottom:12px;">
                <label style="font-size:0.80rem; font-weight:bold; color:#334155;">Votre Numéro de Téléphone :</label>
                <input type="tel" id="inputTelEleve" value="" placeholder="Ex: 70 00 00 00" style="width:100%; padding:8px; margin-top:4px; border:1px solid #cbd5e1; border-radius:6px; box-sizing:border-box;">
            </div>

            <button onclick="envoyerDemandeAbonnement()" style="width:100%; background:#10b981; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; font-size:0.85rem; cursor:pointer; margin-bottom:8px;">
                📲 Envoyer la demande d'activation (À Distance)
            </button>

            <button onclick="debloquerAbonnementAdmin()" style="width:100%; background:#2563eb; color:white; border:none; padding:10px; border-radius:6px; font-weight:bold; font-size:0.85rem; cursor:pointer;">
                🔑 Activer en direct (Responsable)
            </button>
        </div>
    `;
    modal.style.display = "flex";
}

function fermerModalPaiement() {
    const modal = document.getElementById("modalPaiementTao");
    if (modal) modal.style.display = "none";
}

async function envoyerDemandeAbonnement() {
    const inputTel = document.getElementById("inputTelEleve");
    if (!inputTel || !inputTel.value.trim()) {
        alert("⚠️ Veuillez entrer votre numéro de téléphone.");
        return;
    }

    const tel = inputTel.value.trim();
    localStorage.setItem("shaolin_user_phone", tel);

    if (!videoEnAttente) return;

    try {
        const idDemande = `${tel}_${videoEnAttente.titre}`;
        await setDoc(doc(db, "demandes_activation", idDemande), {
            telephone: tel,
            titreTao: videoEnAttente.titre,
            dateDemande: new Date().toLocaleDateString('fr-FR'),
            timestamp: new Date().getTime()
        });
    } catch (e) {
        console.error("Erreur Firebase :", e);
    }

    const message = `Bonjour Maître, je souhaite payer le Tao "${videoEnAttente.titre}". Mon numéro de téléphone est le ${tel}. Comment faire le paiement pour avoir l'opportunité de l'obtenir ?`;
    const urlWhatsApp = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(message)}`;

    window.open(urlWhatsApp, '_blank');
    fermerModalPaiement();
}

function debloquerAbonnementAdmin() {
    const pass = prompt("Veuillez saisir le code Administrateur :");
    if (!pass) return;

    if (pass.trim() === MOT_DE_PASSE_ADMIN) {
        if (!videoEnAttente) return;

        const maintenant = new Date();
        const dateExpiration = maintenant.getTime() + (DUREE_ABONNEMENT_JOURS * 24 * 60 * 60 * 1000);
        const dateExpFormatee = new Date(dateExpiration).toLocaleDateString('fr-FR');

        const abonnementData = {
            titreTao: videoEnAttente.titre,
            datePaiement: maintenant.toLocaleDateString('fr-FR'),
            dateExpiration: dateExpiration,
            dateExpirationFormatee: dateExpFormatee
        };

        localStorage.setItem("abonn_shaolin_taos_" + videoEnAttente.titre, JSON.stringify(abonnementData));

        alert(`✅ Accès débloqué en direct jusqu'au ${dateExpFormatee} !`);
        fermerModalPaiement();
        filtrerVideos();
        lancerLecteurOriginal(videoEnAttente.titre, videoEnAttente.description, videoEnAttente.fichier);
    } else {
        alert("❌ Mot de passe administrateur incorrect !");
    }
}

function ecouterDemandesDistant() {
    const telEleve = localStorage.getItem("shaolin_user_phone");
    if (!telEleve) return;

    onSnapshot(collection(db, "abonnements_taos"), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
                const data = change.doc.data();
                if (data.telephone === telEleve && new Date().getTime() < data.dateExpiration) {
                    localStorage.setItem("abonn_shaolin_taos_" + data.titreTao, JSON.stringify(data));
                    filtrerVideos();
                }
            }
        });
    });
}

// Expositions globales
window.afficherVideos = afficherVideos;
window.filtrerVideos = filtrerVideos;
window.filtrerParNiveau = filtrerParNiveau;
window.ouvrirLecteur = ouvrirLecteur;
window.fermerLecteur = fermerLecteur;
window.debloquerAbonnementAdmin = debloquerAbonnementAdmin;
window.fermerModalPaiement = fermerModalPaiement;
window.envoyerDemandeAbonnement = envoyerDemandeAbonnement;