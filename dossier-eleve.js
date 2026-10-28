import { db, stockBulletins, stockMensualites, stockDossiersMedicaux, stockRecus, eleveActuel } from "./firebase-config.js";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    let conteneurListe = document.getElementById("conteneur-liste");
    if (conteneurListe) {
        conteneurListe.innerHTML = "<p style='text-align: center; color: #64748b; font-style: italic; padding: 20px;'>Chargement des données depuis le Cloud...</p>"; 
    }

    try {
        const querySnapshot = await getDocs(collection(db, "membresShaolin"));
        let listeMembres = [];
        querySnapshot.forEach((docSnap) => {
            listeMembres.push({ id: docSnap.id, ...docSnap.data() });
        });

        const docDossiers = await getDoc(doc(db, "stockGlobalShaolin", "dossiersMedicaux"));
        if (docDossiers.exists()) Object.assign(stockDossiersMedicaux, docDossiers.data());

        const docMens = await getDoc(doc(db, "stockGlobalShaolin", "mensualites"));
        if (docMens.exists()) Object.assign(stockMensualites, docMens.data());

        const docRecus = await getDoc(doc(db, "stockGlobalShaolin", "recus"));
        if (docRecus.exists()) Object.assign(stockRecus, docRecus.data());

        const docBull = await getDoc(doc(db, "stockGlobalShaolin", "bulletins"));
        if (docBull.exists()) Object.assign(stockBulletins, docBull.data());

        if (conteneurListe) {
            conteneurListe.innerHTML = ""; 

            if (listeMembres.length === 0) {
                conteneurListe.innerHTML = "<p style='text-align: center; color: #64748b; font-style: italic; padding: 20px;'>Aucun élève trouvé. Utilisez l'espace admin pour en ajouter.</p>";
                return;
            }

            listeMembres.forEach((eleve, index) => {
                let matriculeAuto = "SH-2026-00" + (index + 1);
                let divItem = document.createElement("div");
                divItem.className = "eleve-item";
                
                let nomEleve = eleve.nom || "Élève sans nom";
                divItem.setAttribute("data-nom", nomEleve.toLowerCase());
                
                // Récupération du code PIN (depuis stockDossiersMedicaux ou l'objet élève, sinon "0000" par défaut)
                let codePinEleve = (stockDossiersMedicaux[nomEleve] && stockDossiersMedicaux[nomEleve].codePin) || eleve.codePin || "0000";

                divItem.onclick = function() {
                    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";

                    if (estAdmin) {
                        // L'administrateur accède directement au dossier sans code PIN
                        executerOuvertureDossier(eleve, matriculeAuto, nomEleve);
                    } else {
                        // Demande du code PIN confidentiel à 4 chiffres
                        let codeSaisi = prompt(`🔒 Accès sécurisé au dossier de ${nomEleve}\nVeuillez entrer votre code PIN à 4 chiffres :`);
                        
                        if (codeSaisi === null) return; // Si l'utilisateur clique sur Annuler

                        if (codeSaisi.trim() === codePinEleve.toString().trim()) {
                            executerOuvertureDossier(eleve, matriculeAuto, nomEleve);
                        } else {
                            alert("❌ Code PIN incorrect. Accès refusé à ce dossier.");
                        }
                    }
                };

                const moisActuel = obtenirMoisAPayer();
                let payeMois = stockMensualites[nomEleve] && stockMensualites[nomEleve][moisActuel];
                let classeBadge = payeMois ? "badge-statut badge-vert" : "badge-statut badge-rouge";
                let texteBadge = payeMois ? `Payé (${moisActuel})` : "À régler";

                divItem.innerHTML = `
                    <div>
                        <span class="eleve-nom">🥋 ${nomEleve}</span>
                        <span id="badge-paiement-${nomEleve.toLowerCase()}" class="${classeBadge}">${texteBadge}</span>
                        <span style="display: block; font-size: 0.82rem; color: #64748b; margin-top: 3px;">Matricule : ${matriculeAuto} | Club : ${eleve.club || 'Club Youze'}</span>
                    </div>
                    <span class="eleve-fleche">Voir le dossier ➔</span>
                `;
                conteneurListe.appendChild(divItem);
            });
        }
    } catch (error) {
        console.error("Erreur lors du chargement : ", error);
        if (conteneurListe) {
            conteneurListe.innerHTML = "<p style='text-align: center; color: red;'>Erreur de connexion avec la base de données Cloud.</p>";
        }
    }

    verifierRestrictionsAdmin();
});

// Fonction intermédiaire pour déclencher l'ouverture après validation du code
function executerOuvertureDossier(eleve, matriculeAuto, nomEleve) {
    ouvrirDossierEleve(
        matriculeAuto, 
        nomEleve, 
        eleve.naissance || 'Non renseignée', 
        eleve.parent || eleve.parents || 'Non renseigné', 
        eleve.telephoneEleve || '', 
        eleve.telephoneTuteur || '', 
        eleve.dateInscription || eleve.dateEnregistrement || '15/09/2025',
        eleve.photo || '' // Passage de la photo de l'élève
    );
}

function verifierRestrictionsAdmin() {
    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";
    const champsFormulaire = document.querySelectorAll('#zone-infos input, #zone-infos select, #zone-infos textarea');
    champsFormulaire.forEach(champ => { champ.disabled = !estAdmin; });

    const btnEnregistrerDossier = document.querySelector('button[onclick*="enregistrerInfosSupplementaires"]');
    if (btnEnregistrerDossier) btnEnregistrerDossier.style.display = estAdmin ? 'inline-block' : 'none';

    const btnSuppr = document.querySelector('.btn-action.btn-supprimer');
    if (btnSuppr) btnSuppr.style.display = estAdmin ? 'inline-block' : 'none';
}

function obtenirMoisAPayer() {
    const moisNoms = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    const dateActuelle = new Date();
    let indexMoisPrecedent = dateActuelle.getMonth() - 1;
    if (indexMoisPrecedent < 0) indexMoisPrecedent = 11;
    return moisNoms[indexMoisPrecedent];
}

function filtrerEleves() {
    let filtre = document.getElementById('input-recherche').value.toLowerCase();
    let elementsEleves = document.querySelectorAll('.eleve-item');

    elementsEleves.forEach(item => {
        let nomEleve = item.getAttribute('data-nom');
        if (nomEleve.includes(filtre)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

function imprimerListeEleves() { window.print(); }

async function telechargerListePDF() {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("FEDERATION MALIENNE DE KUNG FU WUSHU", 105, 15, { align: "center" });

    docPdf.setFontSize(16);
    docPdf.setTextColor(185, 28, 28);
    docPdf.text("CLUB YOUZE", 105, 23, { align: "center" });

    docPdf.setFontSize(9);
    docPdf.setTextColor(51, 65, 85);
    docPdf.text("Bamako - Yirimadio  |  Tél: +223 71 62 15 36", 105, 30, { align: "center" });

    docPdf.setDrawColor(15, 23, 42);
    docPdf.setLineWidth(0.5);
    docPdf.line(20, 35, 190, 35);

    docPdf.setFillColor(15, 23, 42);
    docPdf.rect(20, 42, 170, 10, "F");
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(11);
    docPdf.text("REGISTRE OFFICIEL DES ÉLÈVES INSCRITS", 105, 49, { align: "center" });

    const querySnapshot = await getDocs(collection(db, "membresShaolin"));
    let listeMembres = [];
    querySnapshot.forEach((d) => listeMembres.push(d.data()));

    let startY = 60;
    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(20, startY, 170, 8, "F");
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(9);
    docPdf.setTextColor(15, 23, 42);
    
    docPdf.text("N°", 23, startY + 5.5);
    docPdf.text("MATRICULE", 38, startY + 5.5);
    docPdf.text("NOM & PRÉNOM", 75, startY + 5.5);
    docPdf.text("TUTEUR / CONTACT", 135, startY + 5.5);

    docPdf.setFont("helvetica", "normal");
    let currentY = startY + 8;

    if (listeMembres.length > 0) {
        listeMembres.forEach((eleve, index) => {
            let matriculeAuto = "SH-2026-00" + (index + 1);
            if (currentY > 270) { docPdf.addPage(); currentY = 20; }

            docPdf.rect(20, currentY, 170, 8);
            docPdf.text(`${index + 1}`, 23, currentY + 5.5);
            docPdf.text(matriculeAuto, 38, currentY + 5.5);
            docPdf.text(eleve.nom || "", 75, currentY + 5.5);
            docPdf.text(`${eleve.parent || eleve.parents || 'N/C'} (${eleve.telephoneTuteur || 'N/C'})`, 135, currentY + 5.5);

            currentY += 8;
        });
    }

    let aujourdHui = new Date().toLocaleDateString('fr-FR');
    docPdf.setFontSize(8);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text(`Document généré le ${aujourdHui} par ShaolinApp`, 105, 285, { align: "center" });

    docPdf.save("Registre_Eleves_Club_Youze.pdf");
}

function ouvrirDossierEleve(matricule, nom, naissance, parents, telephoneEleve, telephoneTuteur, inscription, photo) {
    eleveActuel.matricule = matricule;
    eleveActuel.nom = nom;
    eleveActuel.naissance = naissance;
    eleveActuel.parents = parents;
    eleveActuel.telephoneEleve = telephoneEleve;
    eleveActuel.telephoneTuteur = telephoneTuteur;
    eleveActuel.inscription = inscription;
    eleveActuel.photo = photo;

    document.getElementById('info-matricule').textContent = matricule;
    document.getElementById('info-nom').textContent = nom;
    document.getElementById('info-naissance').textContent = naissance;
    document.getElementById('info-inscription').textContent = inscription;
    document.getElementById('info-parents').textContent = parents;
    
    const champContactEleve = document.getElementById('info-contact-eleve');
    if (champContactEleve) champContactEleve.textContent = telephoneEleve || "Non renseigné";

    const champContactTuteur = document.getElementById('info-contact-tuteur');
    if (champContactTuteur) champContactTuteur.textContent = telephoneTuteur || "Non renseigné";

    document.getElementById('titre-dossier-nom').textContent = nom;
    document.getElementById('bul-nom').value = nom;

    // Gestion de l'affichage de la photo de l'élève à droite du profil (si un élément <img> ou conteneur existe)
    let imgProfil = document.getElementById('info-photo-eleve');
    if (imgProfil) {
        if (photo && photo.trim() !== "") {
            imgProfil.src = photo;
            imgProfil.style.display = "block";
        } else {
            imgProfil.src = "";
            imgProfil.style.display = "none";
        }
    }

    // Remplissage des données spécifiques (dont le code PIN)
    if (stockDossiersMedicaux[nom]) {
        document.getElementById('info-grade-actuel').value = stockDossiersMedicaux[nom].gradeActuel || '';
        document.getElementById('info-date-grade').value = stockDossiersMedicaux[nom].dateGrade || '';
        document.getElementById('info-certif-medical').value = stockDossiersMedicaux[nom].certifMedical || 'À jour';
        document.getElementById('info-assurance').value = stockDossiersMedicaux[nom].assurance || 'Validée';
        document.getElementById('info-obs-medicales').value = stockDossiersMedicaux[nom].obsMedicales || '';
        document.getElementById('info-codepin').value = stockDossiersMedicaux[nom].codePin || '0000';
    } else {
        document.getElementById('info-grade-actuel').value = '';
        document.getElementById('info-date-grade').value = '';
        document.getElementById('info-certif-medical').value = 'À jour';
        document.getElementById('info-assurance').value = 'Validée';
        document.getElementById('info-obs-medicales').value = '';
        document.getElementById('info-codepin').value = '0000';
    }

    document.getElementById('zone-liste-principale').style.display = 'none';
    document.getElementById('zone-dossier-eleve').style.display = 'block';

    afficherSection('zone-infos');
    verifierRestrictionsAdmin();
}

function retournerAListe() {
    document.getElementById('zone-dossier-eleve').style.display = 'none';
    document.getElementById('zone-liste-principale').style.display = 'block';
}

function afficherSection(idSection) {
    document.getElementById('zone-infos').style.display = 'none';
    document.getElementById('zone-mensualites').style.display = 'none';
    document.getElementById('zone-certificat').style.display = 'none';
    document.getElementById('zone-fiche-membre').style.display = 'none';
    document.getElementById('zone-creation-bulletin').style.display = 'none';
    document.getElementById('zone-anciens-bulletins').style.display = 'none';
    
    const zoneRecus = document.getElementById('zone-anciens-recus');
    if (zoneRecus) zoneRecus.style.display = 'none';

    document.getElementById(idSection).style.display = 'block';
}

async function ouvrirPieceJustificative() {
    const conteneur = document.getElementById('conteneurImagePiece');
    document.getElementById('modalTitrePiece').textContent = "Pièce de : " + eleveActuel.nom;
    
    const querySnapshot = await getDocs(collection(db, "membresShaolin"));
    let listeMembres = [];
    querySnapshot.forEach((d) => listeMembres.push(d.data()));

    let eleveTrouve = listeMembres.find(m => m.nom && m.nom.toLowerCase() === eleveActuel.nom.toLowerCase());

    if (eleveTrouve && eleveTrouve.pieceUrl) {
        conteneur.innerHTML = `<img src="${eleveTrouve.pieceUrl}" alt="Pièce d'identité de l'élève" style="max-width:100%;">`;
    } else {
        conteneur.innerHTML = `<p style="color: #64748b; font-style: italic; padding: 20px;">Aucune image de pièce justificative trouvée.</p>`;
    }

    document.getElementById('modalDossierPiece').style.display = 'flex';
}

function fermerModalPiece() {
    document.getElementById('modalDossierPiece').style.display = 'none';
}

async function enregistrerInfosSupplementaires() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé. Seul l'administrateur connecté peut modifier ce dossier.");
        return;
    }

    const nom = eleveActuel.nom;
    stockDossiersMedicaux[nom] = {
        gradeActuel: document.getElementById('info-grade-actuel').value,
        dateGrade: document.getElementById('info-date-grade').value,
        certifMedical: document.getElementById('info-certif-medical').value,
        assurance: document.getElementById('info-assurance').value,
        obsMedicales: document.getElementById('info-obs-medicales').value,
        codePin: document.getElementById('info-codepin').value || '0000' // Sauvegarde du code PIN modifiable par l'admin
    };
    
    try {
        await setDoc(doc(db, "stockGlobalShaolin", "dossiersMedicaux"), stockDossiersMedicaux);
        alert("Les informations et le code PIN du dossier ont été enregistrés avec succès !");
    } catch (e) {
        console.error("Erreur :", e);
        alert("Erreur lors de l'enregistrement.");
    }
}

async function supprimerEleveActuel() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé.");
        return;
    }

    let confirmation = confirm("Voulez-vous vraiment supprimer l'élève " + eleveActuel.nom + " ?");
    if (confirmation) {
        const querySnapshot = await getDocs(collection(db, "membresShaolin"));
        let docIdToDelete = null;
        querySnapshot.forEach((d) => {
            let data = d.data();
            if (data.nom && data.nom.toLowerCase() === eleveActuel.nom.toLowerCase()) {
                docIdToDelete = d.id;
            }
        });

        if (docIdToDelete) {
            await deleteDoc(doc(db, "membresShaolin", docIdToDelete));
        }

        delete stockBulletins[eleveActuel.nom];
        delete stockMensualites[eleveActuel.nom];
        delete stockDossiersMedicaux[eleveActuel.nom];
        delete stockRecus[eleveActuel.nom];

        await setDoc(doc(db, "stockGlobalShaolin", "bulletins"), stockBulletins);
        await setDoc(doc(db, "stockGlobalShaolin", "mensualites"), stockMensualites);
        await setDoc(doc(db, "stockGlobalShaolin", "dossiersMedicaux"), stockDossiersMedicaux);
        await setDoc(doc(db, "stockGlobalShaolin", "recus"), stockRecus);

        alert("L'élève a été supprimé avec succès.");
        location.reload(); 
    }
}

window.filtrerEleves = filtrerEleves;
window.imprimerListeEleves = imprimerListeEleves;
window.telechargerListePDF = telechargerListePDF;
window.ouvrirDossierEleve = ouvrirDossierEleve;
window.retournerAListe = retournerAListe;
window.afficherSection = afficherSection;
window.ouvrirPieceJustificative = ouvrirPieceJustificative;
window.fermerModalPiece = fermerModalPiece;
window.enregistrerInfosSupplementaires = enregistrerInfosSupplementaires;
window.supprimerEleveActuel = supprimerEleveActuel;