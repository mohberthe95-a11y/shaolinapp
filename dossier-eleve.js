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
                
                let codePinEleve = (stockDossiersMedicaux[nomEleve] && stockDossiersMedicaux[nomEleve].codePin) || eleve.codePin || "0000";

                divItem.onclick = function() {
                    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";

                    if (estAdmin) {
                        executerOuvertureDossier(eleve, matriculeAuto, nomEleve);
                    } else {
                        let codeSaisi = prompt(`🔒 Accès sécurisé au dossier de ${nomEleve}\nVeuillez entrer votre code PIN à 4 chiffres :`);
                        if (codeSaisi === null) return;

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

function executerOuvertureDossier(eleve, matriculeAuto, nomEleve) {
    ouvrirDossierEleve(
        matriculeAuto, 
        nomEleve, 
        eleve.naissance || 'Non renseignée', 
        eleve.parent || eleve.parents || 'Non renseigné', 
        eleve.telephoneEleve || '', 
        eleve.telephoneTuteur || '', 
        eleve.dateInscription || eleve.dateEnregistrement || '15/09/2025',
        eleve.photo || ''
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

    const btnPassationGenerale = document.getElementById('btn-passation-generale');
    if (btnPassationGenerale) {
        btnPassationGenerale.style.display = estAdmin ? 'inline-block' : 'none';
    }
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

// ==========================================
// LOGIQUE DE LA PASSATION GÉNÉRALE (GROUPÉE PAR GRADE, NUMÉROTÉE 1, 2, 3 ET RANGS INDÉPENDANTS)
// ==========================================
async function accederPassationGenerale() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé. Réservé à l'administrateur.");
        return;
    }

    document.getElementById('zone-liste-principale').style.display = 'none';
    document.getElementById('zone-passation-generale').style.display = 'block';

    const corpsTableau = document.getElementById('corps-tableau-passation-globale');
    corpsTableau.innerHTML = "<tr><td colspan='10' style='text-align: center; padding: 20px; color: #64748b;'>Chargement des élèves...</td></tr>";

    try {
        const querySnapshot = await getDocs(collection(db, "membresShaolin"));
        let listeMembres = [];
        querySnapshot.forEach((d) => listeMembres.push({ id: d.id, ...d.data() }));

        if (listeMembres.length === 0) {
            corpsTableau.innerHTML = "<tr><td colspan='10' style='text-align: center; padding: 20px; color: #64748b;'>Aucun élève trouvé.</td></tr>";
            return;
        }

        corpsTableau.innerHTML = "";

        // Regrouper les élèves par leur grade actuel
        let groupesParGrade = {};

        listeMembres.forEach((eleve, index) => {
            let nom = eleve.nom || "Sans nom";
            let matricule = "SH-2026-00" + (index + 1);
            let gradeActuel = (stockDossiersMedicaux[nom] && stockDossiersMedicaux[nom].gradeActuel) || "7e Barrette";

            if (!groupesParGrade[gradeActuel]) {
                groupesParGrade[gradeActuel] = [];
            }
            groupesParGrade[gradeActuel].push({ eleve, nom, matricule, gradeActuel });
        });

        // Afficher chaque groupe de grade séparé par un en-tête foncé et numéroté de façon indépendante (1, 2, 3...)
        for (let grade in groupesParGrade) {
            let trSep = document.createElement("tr");
            trSep.innerHTML = `
                <td colspan="10" style="background-color: #0f172a; color: white; font-weight: bold; padding: 12px 15px; font-size: 0.95rem; letter-spacing: 0.5px; border-top: 3px solid #38bdf8;">
                    🥋 SECTION / GRADE : ${grade.toUpperCase()}
                </td>
            `;
            corpsTableau.appendChild(trSep);

            // Trier les élèves de ce grade par ordre alphabétique ou les garder dans l'ordre, puis leur assigner un numéro d'ordre (1, 2, 3...)
            let elevesDuGrade = groupesParGrade[grade];

            elevesDuGrade.forEach((item, indexNum) => {
                let numeroOrdre = indexNum + 1; // 1, 2, 3...
                let bulletinsEleve = stockBulletins[item.nom] || [];
                let dernierBull = bulletinsEleve.length > 0 ? bulletinsEleve[bulletinsEleve.length - 1] : null;
                let notes = dernierBull ? dernierBull.notes : [0, 0, 0, 0, 0, 0, 0];

                let tr = document.createElement("tr");
                tr.setAttribute("data-nom-eleve", item.nom);
                tr.setAttribute("data-grade-groupe", grade);
                tr.className = "ligne-eleve-passation";
                tr.innerHTML = `
                    <td style="font-weight: 600; color: #0f172a; padding-left: 20px;">
                        <span style="color: #2563eb; font-weight: bold; margin-right: 6px;">${numeroOrdre}.</span> ${item.nom}
                        <span style="display: block; font-size: 0.75rem; color: #64748b; font-weight: normal; margin-left: 18px;">${item.matricule}</span>
                    </td>
                    <td><input type="text" class="input-grade-globale" value="${item.gradeActuel}" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.85rem;" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[0] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[1] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[2] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[3] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[4] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[5] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center;"><input type="number" class="note-globale" min="0" max="10" step="0.5" value="${notes[6] || 0}" oninput="recalculerMoyennesEtRangsIndependants()"></td>
                    <td style="text-align: center; font-weight: bold; color: #b91c1c;" class="moyenne-ligne">0.00 / 10</td>
                `;
                corpsTableau.appendChild(tr);
            });
        }

        recalculerMoyennesEtRangsIndependants();

    } catch (e) {
        console.error("Erreur chargement passation générale :", e);
        corpsTableau.innerHTML = "<tr><td colspan='10' style='text-align: center; color: red; padding: 20px;'>Erreur lors du chargement des élèves.</td></tr>";
    }
}

function retournerAListeDepuisPassation() {
    document.getElementById('zone-passation-generale').style.display = 'none';
    document.getElementById('zone-liste-principale').style.display = 'block';
}

// Calcule les moyennes et attribue le rang de manière INDÉPENDANTE pour chaque groupe de grade
function recalculerMoyennesEtRangsIndependants() {
    // Récupérer tous les grades uniques affichés dans le tableau
    let sectionsGrades = document.querySelectorAll('tr[style*="background-color: #0f172a"]');
    
    sectionsGrades.forEach(section => {
        // Retrouver le texte du grade à partir de l'en-tête
        let texteEnTete = section.textContent;
        // On récupère les lignes d'élèves qui suivent immédiatement cet en-tête jusqu'au prochain en-tête
        let prochaineLigne = section.nextElementSibling;
        let elevesDuGroupe = [];

        while (prochaineLigne && !prochaineLigne.querySelector('td[colspan="10"]')) {
            if (prochaineLigne.classList.contains('ligne-eleve-passation')) {
                let inputsNotes = prochaineLigne.querySelectorAll('.note-globale');
                let somme = 0;
                
                inputsNotes.forEach(input => {
                    let val = parseFloat(input.value) || 0;
                    if (val < 0) input.value = 0;
                    if (val > 10) input.value = 10;
                    somme += parseFloat(input.value) || 0;
                });

                let moyenne = somme / 7;
                elevesDuGroupe.push({
                    ligne: prochaineLigne,
                    moyenne: moyenne
                });
            }
            prochaineLigne = prochaineLigne.nextElementSibling;
        }

        // Trier les élèves de CE groupe spécifique du plus fort au plus faible pour le rang
        elevesDuGroupe.sort((a, b) => b.moyenne - a.moyenne);

        let totalElevesDansGrade = elevesDuGroupe.length;

        elevesDuGroupe.forEach((item, index) => {
            let rangNum = index + 1;
            let suffixeRang = (rangNum === 1) ? "1er" : `${rangNum}e`;

            item.ligne.setAttribute('data-rang-calcule', suffixeRang);
            item.ligne.setAttribute('data-total-grade', totalElevesDansGrade);

            let celluleMoyenne = item.ligne.querySelector('.moyenne-ligne');
            celluleMoyenne.innerHTML = `${item.moyenne.toFixed(2)} / 10 <br><span style="font-size: 0.75rem; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; font-weight: bold;">(${suffixeRang} / ${totalElevesDansGrade})</span>`;
        });
    });
}

async function enregistrerPassationGlobale() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé.");
        return;
    }

    let lignes = document.querySelectorAll('.ligne-eleve-passation');
    let dateDuJour = new Date().toISOString().split('T')[0];

    lignes.forEach((ligne) => {
        let nom = ligne.getAttribute('data-nom-eleve');
        let grade = ligne.querySelector('.input-grade-globale').value;
        let inputsNotes = ligne.querySelectorAll('.note-globale');
        let rangCalcule = ligne.getAttribute('data-rang-calcule') || "1er";
        let totalGrade = ligne.getAttribute('data-total-grade') || "1";
        
        let notes = [];
        let total = 0;
        inputsNotes.forEach(input => {
            let n = parseFloat(input.value) || 0;
            notes.push(n);
            total += n;
        });

        let moyenne = (total / 7).toFixed(2);
        let moyNum = parseFloat(moyenne);
        
        let observationText = "Bon travail, continue ainsi.";
        if (moyNum >= 8) observationText = "Excellent niveau, félicitations du maître !";
        else if (moyNum >= 6) observationText = "Bon niveau, efforts satisfaisants.";
        else if (moyNum >= 5) observationText = "Passable, des efforts à accentuer.";
        else observationText = "Insuffisant, redouble d'efforts aux entraînements.";

        let nouveauBulletin = {
            grade: grade,
            notes: notes,
            total: total,
            moyenne: moyenne + " / 10",
            rang: `${rangCalcule} / ${totalGrade}`,
            observation: observationText,
            date: dateDuJour,
            signature: "Maître Youze"
        };

        if (!stockBulletins[nom]) {
            stockBulletins[nom] = [];
        }
        stockBulletins[nom].push(nouveauBulletin);
    });

    try {
        await setDoc(doc(db, "stockGlobalShaolin", "bulletins"), stockBulletins);
        alert("⚡ Passation générale enregistrée avec succès ! Les classements indépendants par grade ont été propagés.");
        retournerAListeDepuisPassation();
    } catch (e) {
        console.error("Erreur enregistrement passation globale :", e);
        alert("Erreur lors de l'enregistrement dans le Cloud.");
    }
}
// ==========================================

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

    let imgProfil = document.getElementById('info-photo-eleve');
    let texteSansPhoto = document.getElementById('info-sans-photo');

    if (imgProfil && texteSansPhoto) {
        if (photo && photo.trim() !== "") {
            imgProfil.src = photo;
            imgProfil.style.display = "block";
            texteSansPhoto.style.display = "none";
        } else {
            imgProfil.src = "";
            imgProfil.style.display = "none";
            texteSansPhoto.style.display = "flex";
        }
    }

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
        codePin: document.getElementById('info-codepin').value || '0000'
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
window.accederPassationGenerale = accederPassationGenerale;
window.retournerAListeDepuisPassation = retournerAListeDepuisPassation;
window.recalculerMoyennesEtRangsIndependants = recalculerMoyennesEtRangsIndependants;
window.enregistrerPassationGlobale = enregistrerPassationGlobale;
window.ouvrirDossierEleve = ouvrirDossierEleve;
window.retournerAListe = retournerAListe;
window.afficherSection = afficherSection;
window.ouvrirPieceJustificative = ouvrirPieceJustificative;
window.fermerModalPiece = fermerModalPiece;
window.enregistrerInfosSupplementaires = enregistrerInfosSupplementaires;
window.supprimerEleveActuel = supprimerEleveActuel;