import { db, stockBulletins, eleveActuel } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. CERTIFICAT DE FRÉQUENTATION ---
export function ouvrirCertificat() {
    if (!eleveActuel || !eleveActuel.nom) {
        alert("Veuillez d'abord sélectionner un élève dans la liste.");
        return;
    }
    
    document.getElementById('cert-nom').textContent = eleveActuel.nom || "";
    document.getElementById('cert-matricule').textContent = eleveActuel.matricule || "";
    document.getElementById('cert-naissance').textContent = eleveActuel.naissance || "";
    document.getElementById('cert-parents').textContent = eleveActuel.parents || "";
    document.getElementById('cert-date').textContent = new Date().toLocaleDateString('fr-FR');

    window.afficherSection('zone-certificat');
}

export function imprimerCertificat() { window.print(); }

export function telechargerCertificatPDF() {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("FEDERATION MALIENNE DE KUNG FU WUSHU", 105, 20, { align: "center" });

    docPdf.setFontSize(16);
    docPdf.setTextColor(185, 28, 28);
    docPdf.text("CLUB YOUZE", 105, 28, { align: "center" });

    docPdf.setFontSize(9);
    docPdf.setTextColor(71, 85, 105);
    docPdf.text("Bamako - Yirimadio  |  Tél: +223 71 62 15 36", 105, 35, { align: "center" });

    docPdf.setDrawColor(217, 119, 6);
    docPdf.setLineWidth(1);
    docPdf.line(20, 42, 190, 42);

    docPdf.setFont("georgia", "bold");
    docPdf.setFontSize(18);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("CERTIFICAT DE FRÉQUENTATION", 105, 58, { align: "center" });

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(11);
    docPdf.setTextColor(30, 41, 59);
    let texteIntro = "Nous soussignés, Direction technique et administrative du Club Youze de Kung Fu Wushu, certifions par la présente que l’élève dont les références suivent :";
    docPdf.text(docPdf.splitTextToSize(texteIntro, 170), 20, 72);

    docPdf.setFillColor(248, 250, 252);
    docPdf.setDrawColor(203, 213, 225);
    docPdf.roundedRect(20, 88, 170, 42, 3, 3, "FD");

    docPdf.setFont("helvetica", "bold");
    docPdf.text(`- Nom et Prénom : ${eleveActuel.nom || ''}`, 28, 100);
    docPdf.text(`- Matricule : ${eleveActuel.matricule || ''}`, 28, 110);
    docPdf.text(`- Date de naissance : ${eleveActuel.naissance || ''}`, 28, 120);

    docPdf.setFont("helvetica", "normal");
    let texteConf = "Est régulièrement inscrit(e) au sein de notre structure et fréquente assidûment les entraînements et cours d'arts martiaux.";
    docPdf.text(docPdf.splitTextToSize(texteConf, 170), 20, 142);

    let aujourdHui = new Date().toLocaleDateString('fr-FR');
    docPdf.text(`Fait à Bamako, le ${aujourdHui}`, 20, 190);

    docPdf.setFont("helvetica", "bold");
    docPdf.text("Le Maître d'Armes", 140, 185);
    docPdf.setFont("helvetica", "normal");
    docPdf.text("............................................", 130, 205);

    let nomFichier = (eleveActuel.nom || 'Eleve').replace(/\s+/g, '_');
    docPdf.save(`Certificat_${nomFichier}.pdf`);
}

// --- 2. FICHE DE MEMBRE ---
export function ouvrirFicheMembre() {
    if (!eleveActuel || !eleveActuel.nom) { 
        alert("Veuillez d'abord sélectionner un élève dans la liste."); 
        return; 
    }
    
    document.getElementById('fiche-matricule').textContent = eleveActuel.matricule || "N/A";
    document.getElementById('fiche-nom').textContent = eleveActuel.nom || "N/A";
    document.getElementById('fiche-naissance').textContent = eleveActuel.naissance || "N/A";
    document.getElementById('fiche-inscription').textContent = eleveActuel.inscription || "N/A";
    document.getElementById('fiche-contact-eleve').textContent = eleveActuel.telephoneEleve || "Non renseigné";
    document.getElementById('fiche-parents').textContent = eleveActuel.parents || "Non renseigné";
    document.getElementById('fiche-contact-tuteur').textContent = eleveActuel.telephoneTuteur || "Non renseigné";

    window.afficherSection('zone-fiche-membre');
}

export function imprimerFicheMembre() { window.print(); }

export function telechargerFicheMembrePDF() {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();

    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(16);
    docPdf.setTextColor(185, 28, 28);
    docPdf.text("CLUB YOUZE", 20, 20);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(100, 100, 100);
    docPdf.setFontSize(9);
    docPdf.text("Kung Fu Wushu - Bamako Yirimadio", 20, 26);

    docPdf.setFillColor(15, 23, 42);
    docPdf.roundedRect(135, 15, 55, 12, 2, 2, "F");
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.text("SAISON 2026", 148, 22.5);

    docPdf.setDrawColor(15, 23, 42);
    docPdf.line(20, 38, 190, 38);

    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(14);
    docPdf.text("FICHE D'INSCRIPTION & DOSSIER MEMBRE", 105, 50, { align: "center" });

    docPdf.setFontSize(11);
    docPdf.setFont("helvetica", "normal");

    let y = 65;
    docPdf.text(`Matricule :`, 20, y);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`${eleveActuel.matricule || 'N/A'}`, 60, y);

    y += 10;
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`Nom & Prénom :`, 20, y);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`${eleveActuel.nom || 'N/A'}`, 60, y);

    y += 10;
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`Date de naissance :`, 20, y);
    docPdf.text(`${eleveActuel.naissance || 'N/A'}`, 60, y);

    y += 10;
    docPdf.text(`Parents / Tuteur :`, 20, y);
    docPdf.text(`${eleveActuel.parents || 'Non renseigné'}`, 60, y);

    docPdf.save(`Fiche_Membre_${(eleveActuel.nom || 'Eleve').replace(/\s+/g, '_')}.pdf`);
}

// --- 3. CREER BULLETIN ---
export function ouvrirNouveauBulletin() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé. Seul l'administrateur peut créer des bulletins.");
        return;
    }

    document.getElementById('titre-form-bulletin').textContent = "NOUVELLE FICHE DE PASSATION";
    document.getElementById('bul-index-modif').value = "-1";
    document.getElementById('bul-grade').value = '';
    document.getElementById('bul-grade').disabled = false;
    document.getElementById('date-passation').valueAsDate = new Date();
    document.getElementById('rang').value = '';
    document.getElementById('observation').value = '';

    const inputs = document.querySelectorAll('.note-input');
    inputs.forEach(input => { input.value = ''; input.disabled = false; });
    document.getElementById('total-notes').value = '';
    document.getElementById('moyenne-notes').value = '';

    let btnRetour = document.getElementById('btn-retour-archives');
    if (btnRetour) btnRetour.style.display = 'none';

    // Masquer l'image de signature en mode création de nouveau bulletin
    let imgSignature = document.getElementById('apercu-signature-form');
    if (imgSignature) imgSignature.style.display = 'none';

    window.afficherSection('zone-creation-bulletin');
}

export function calculerTotaux() {
    const inputs = document.querySelectorAll('.note-input');
    let somme = 0;
    let remplies = 0;
    
    inputs.forEach(input => {
        let val = parseFloat(input.value);
        if (!isNaN(val)) {
            if (val > 10) { input.value = 10; val = 10; }
            else if (val < 0) { input.value = 0; val = 0; }
            somme += val;
            remplies++;
        }
    });

    let moyenne = remplies > 0 ? somme / inputs.length : 0;
    document.getElementById('total-notes').value = somme + ' / ' + (inputs.length * 10);
    document.getElementById('moyenne-notes').value = moyenne.toFixed(2) + ' / 10';
}

export async function enregistrerBulletin() {
    if (sessionStorage.getItem("adminConnecte") !== "true") { alert("Accès refusé."); return; }

    const nomEleve = eleveActuel.nom;
    const grade = document.getElementById('bul-grade').value || "Grade non spécifié";
    const total = document.getElementById('total-notes').value || "0 / 70";
    const moyenne = document.getElementById('moyenne-notes').value || "0 / 10";
    const date = document.getElementById('date-passation').value;
    const rang = document.getElementById('rang').value || "-";
    const observation = document.getElementById('observation').value || "Aucune observation";
    
    const inputs = document.querySelectorAll('.note-input');
    let notesTab = [];
    inputs.forEach(input => { notesTab.push(input.value); });

    const indexModif = parseInt(document.getElementById('bul-index-modif').value);

    if (!stockBulletins[nomEleve]) { stockBulletins[nomEleve] = []; }

    const bulletinData = { grade, notes: notesTab, total, moyenne, date, rang, observation };

    if (indexModif > -1) {
        stockBulletins[nomEleve][indexModif] = bulletinData;
        alert("Bulletin mis à jour avec succès !");
    } else {
        stockBulletins[nomEleve].unshift(bulletinData);
        alert("Bulletin enregistré avec succès !");
    }

    try {
        await setDoc(doc(db, "stockGlobalShaolin", "bulletins"), stockBulletins);
        ouvrirAnciensBulletins();
    } catch (e) {
        console.error("Erreur :", e);
    }
}

// --- 4. ANCIENS BULLETINS ---
export function ouvrirAnciensBulletins() {
    const nom = eleveActuel.nom;
    if (!nom) {
        alert("Veuillez d'abord sélectionner un élève dans la liste.");
        return;
    }

    const archivesConteneur = document.getElementById('archives-conteneur');
    archivesConteneur.innerHTML = '';

    if (!stockBulletins[nom] || stockBulletins[nom].length === 0) {
        archivesConteneur.innerHTML = '<p style="color: #64748b; font-style: italic;">Aucun bulletin enregistré pour cet élève.</p>';
    } else {
        stockBulletins[nom].forEach((bul, index) => {
            const carte = document.createElement('div');
            carte.className = 'bulletin-archive';
            carte.innerHTML = `
                <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0 0 5px 0; font-weight: bold; color: #8b5cf6;">🥋 Passation : ${bul.grade}</p>
                        <p style="margin: 3px 0; font-size: 0.9rem;"><strong>Date :</strong> ${bul.date} | <strong>Moyenne :</strong> <span style="color: #b91c1c; font-weight: bold;">${bul.moyenne}</span></p>
                    </div>
                    <div class="actions-archive" style="display: flex; gap: 5px;">
                        <button class="btn-afficher" style="background: #2563eb; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">👁 Afficher</button>
                        <button class="btn-pdf" style="background: #e11d48; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">📄 PDF</button>
                        <button class="btn-supprimer-bul" style="background: #dc2626; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🗑 Supprimer</button>
                    </div>
                </div>
            `;

            carte.querySelector('.btn-afficher').onclick = () => afficherBulletin(index);
            carte.querySelector('.btn-pdf').onclick = () => telechargerPDF(index);
            carte.querySelector('.btn-supprimer-bul').onclick = () => supprimerBulletinArchive(index);

            archivesConteneur.appendChild(carte);
        });
    }

    window.afficherSection('zone-anciens-bulletins');
}

export async function supprimerBulletinArchive(index) {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé. Seul l'administrateur peut supprimer un bulletin.");
        return;
    }

    let confirmation = confirm("Voulez-vous vraiment supprimer ce bulletin de passation ?");
    if (!confirmation) return;

    const nom = eleveActuel.nom;
    if (stockBulletins[nom]) {
        stockBulletins[nom].splice(index, 1);

        try {
            await setDoc(doc(db, "stockGlobalShaolin", "bulletins"), stockBulletins);
            alert("Bulletin supprimé avec succès !");
            ouvrirAnciensBulletins();
        } catch (e) {
            console.error("Erreur lors de la suppression :", e);
            alert("Erreur lors de la suppression du bulletin.");
        }
    }
}

export function afficherBulletin(index) {
    const nom = eleveActuel.nom;
    const bul = stockBulletins[nom][index];
    document.getElementById('titre-form-bulletin').textContent = "CONSULTATION DU BULLETIN";
    document.getElementById('bul-grade').value = bul.grade;
    document.getElementById('date-passation').value = bul.date;
    document.getElementById('rang').value = bul.rang;
    document.getElementById('observation').value = bul.observation;

    const inputs = document.querySelectorAll('.note-input');
    inputs.forEach((input, i) => {
        input.value = bul.notes && bul.notes[i] !== undefined ? bul.notes[i] : '';
    });

    document.getElementById('total-notes').value = bul.total;
    document.getElementById('moyenne-notes').value = bul.moyenne;

    let zoneCreation = document.getElementById('zone-creation-bulletin');
    
    // Bouton de retour
    let btnRetour = document.getElementById('btn-retour-archives');
    if (!btnRetour) {
        btnRetour = document.createElement('button');
        btnRetour.id = 'btn-retour-archives';
        btnRetour.innerHTML = '⬅ Retour aux anciens bulletins';
        btnRetour.style.cssText = "background: #475569; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: bold;";
        zoneCreation.insertBefore(btnRetour, zoneCreation.firstChild);
    }
    btnRetour.style.display = 'inline-block';
    btnRetour.onclick = () => ouvrirAnciensBulletins();

    // Affichage de l'image de la signature/cachet dans le formulaire de consultation
    let imgSignature = document.getElementById('apercu-signature-form');
    if (!imgSignature) {
        imgSignature = document.createElement('img');
        imgSignature.id = 'apercu-signature-form';
        imgSignature.src = 'signature.jpg';
        imgSignature.alt = 'Cachet et Signature';
        imgSignature.style.cssText = "display: block; max-width: 180px; margin: 20px auto 10px auto; border-radius: 4px;";
        zoneCreation.appendChild(imgSignature);
    } else {
        imgSignature.style.display = 'block';
    }

    window.afficherSection('zone-creation-bulletin');
}

export function telechargerPDF(index) {
    const nom = eleveActuel.nom;
    const bul = stockBulletins[nom][index];
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();

    // En-tête
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("FEDERATION MALIENNE DE KUNG FU WUSHU", 105, 22, { align: "center" });

    docPdf.setFontSize(16);
    docPdf.setTextColor(185, 28, 28);
    docPdf.text("CLUB YOUZE", 105, 30, { align: "center" });

    docPdf.setFontSize(9);
    docPdf.setTextColor(71, 85, 105);
    docPdf.text("Bamako - Yirimadio  |  Tél: +223 71 62 15 36", 105, 37, { align: "center" });

    docPdf.setDrawColor(217, 119, 6);
    docPdf.setLineWidth(0.8);
    docPdf.line(20, 43, 190, 43);

    docPdf.setFillColor(15, 23, 42);
    docPdf.roundedRect(20, 48, 170, 9, 1.5, 1.5, "F");
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "bold");
    docPdf.text("FICHE DE PASSATION DE GRADES", 105, 54, { align: "center" });

    // Infos générales élève
    docPdf.setDrawColor(203, 213, 225);
    docPdf.setFillColor(248, 250, 252);
    docPdf.roundedRect(20, 61, 170, 22, 2, 2, "FD");

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(10);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Elève :`, 25, 68);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${nom}`, 45, 68);

    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Grade :`, 25, 76);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${bul.grade}`, 45, 76);

    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Date :`, 120, 68);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${bul.date}`, 135, 68);

    docPdf.setFont("helvetica", "bold");
    docPdf.text(`Rang :`, 120, 76);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${bul.rang}`, 135, 76);

    // Tableau des notes
    let startY = 90;
    
    docPdf.setFillColor(30, 41, 59);
    docPdf.setDrawColor(30, 41, 59);
    docPdf.rect(20, startY, 170, 8, "FD");
    
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(9);
    docPdf.text("N°", 24, startY + 5.5);
    docPdf.text("ÉLÉMENT D'ÉVALUATION", 45, startY + 5.5);
    docPdf.text("NOTE (/10)", 165, startY + 5.5, { align: "center" });

    const intitulesCriteres = [
        "Marches de shaolin",
        "Pieds - Poings",
        "Tao",
        "Kwen",
        "Solt",
        "Acrobatie",
        "Combat"
    ];

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(30, 41, 59);
    let currentY = startY + 8;

    intitulesCriteres.forEach((intitule, i) => {
        let noteValeur = (bul.notes && bul.notes[i] !== undefined && bul.notes[i] !== "") ? bul.notes[i] + " / 10" : "-";
        
        if (i % 2 === 0) {
            docPdf.setFillColor(255, 255, 255);
        } else {
            docPdf.setFillColor(248, 250, 252);
        }
        
        docPdf.setDrawColor(203, 213, 225);
        docPdf.rect(20, currentY, 170, 7.5, "FD");

        docPdf.text(`${i + 1}`, 24, currentY + 5);
        docPdf.text(intitule, 45, currentY + 5);
        docPdf.setFont("helvetica", "bold");
        docPdf.text(noteValeur, 165, currentY + 5, { align: "center" });
        docPdf.setFont("helvetica", "normal");

        currentY += 7.5;
    });

    // Totaux et Moyenne
    currentY += 4;
    docPdf.setFillColor(241, 245, 249);
    docPdf.setDrawColor(203, 213, 225);
    docPdf.roundedRect(20, currentY, 170, 10, 1, 1, "FD");

    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.text(`Total : ${bul.total || '0 / 70'}`, 26, currentY + 6.5);
    docPdf.text(`Moyenne Générale : ${bul.moyenne || '0 / 10'}`, 115, currentY + 6.5);

    // Observation
    currentY += 15;
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Observation :", 20, currentY);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`${bul.observation || 'Aucune observation'}`, 48, currentY);

    // Signature et Cachet (Image signature.jpg)
    currentY += 18;
    docPdf.setFont("helvetica", "bold");
    docPdf.text("Le Maître d'Armes", 135, currentY);

    const img = new Image();
    img.src = "signature.jpg";
    img.onload = function() {
        try {
            docPdf.addImage(img, 'JPEG', 125, currentY + 3, 40, 25);
        } catch (err) {
            console.error("Erreur d'insertion du cachet/signature :", err);
        }
        docPdf.save(`Bulletin_${nom.replace(/\s+/g, '_')}_${bul.grade.replace(/\s+/g, '_')}.pdf`);
    };
    
    img.onerror = function() {
        docPdf.text("............................................", 125, currentY + 12);
        docPdf.save(`Bulletin_${nom.replace(/\s+/g, '_')}_${bul.grade.replace(/\s+/g, '_')}.pdf`);
    };
}

// ATTACHEMENT GLOBAL SUR WINDOW POUR RÉPONDRE AUX CLICS HTML
window.ouvrirCertificat = ouvrirCertificat;
window.imprimerCertificat = imprimerCertificat;
window.telechargerCertificatPDF = telechargerCertificatPDF;
window.ouvrirFicheMembre = ouvrirFicheMembre;
window.imprimerFicheMembre = imprimerFicheMembre;
window.telechargerFicheMembrePDF = telechargerFicheMembrePDF;
window.ouvrirNouveauBulletin = ouvrirNouveauBulletin;
window.calculerTotaux = calculerTotaux;
window.enregistrerBulletin = enregistrerBulletin;
window.ouvrirAnciensBulletins = ouvrirAnciensBulletins;
window.supprimerBulletinArchive = supprimerBulletinArchive;
window.afficherBulletin = afficherBulletin;
window.telechargerPDF = telechargerPDF;