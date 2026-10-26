import { db, stockMensualites, stockRecus, eleveActuel, listeMois, moisSelectionnePourRecu, setMoisSelectionnePourRecu } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function ouvrirMensualites() {
    const nom = eleveActuel.nom;
    if (!nom) { alert("Veuillez sélectionner un élève."); return; }

    const corpsTableau = document.getElementById('corps-tableau-mensualites');
    if (corpsTableau) corpsTableau.innerHTML = '';

    if (!stockMensualites[nom]) { stockMensualites[nom] = {}; }

    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";

    if (listeMois && corpsTableau) {
        listeMois.forEach(mois => {
            let estPaye = stockMensualites[nom][mois] ? 'checked' : '';
            let disabledAttr = estAdmin ? '' : 'disabled';
            let tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600; color: #1e293b;">Cotisation de ${mois} (2 000 FCFA)</td>
                <td style="text-align: center;">
                    <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                        <input type="checkbox" class="checkbox-mois" data-mois="${mois}" ${estPaye} ${disabledAttr} style="width: 18px; height: 18px; accent-color: #22c55e;">
                        <span style="font-size: 0.9rem; font-weight: 500;">Payé</span>
                    </label>
                </td>
            `;
            const inputCb = tr.querySelector('.checkbox-mois');
            if (inputCb) {
                inputCb.onchange = (e) => selectionnerMoisRecu(mois, e.target.checked);
            }

            corpsTableau.appendChild(tr);
        });
    }

    const nomRecuSpan = document.getElementById("recu-nom-eleve");
    if (nomRecuSpan) nomRecuSpan.textContent = nom;
    
    const dateRecuSpan = document.getElementById("recu-date");
    if (dateRecuSpan) dateRecuSpan.textContent = new Date().toLocaleDateString('fr-FR');
    
    if (!stockRecus[nom]) stockRecus[nom] = [];
    let prochainNumero = "REC-00" + (stockRecus[nom].length + 1);
    
    const numeroRecuSpan = document.getElementById("recu-numero");
    if (numeroRecuSpan) numeroRecuSpan.textContent = prochainNumero;

    if (window.afficherSection) window.afficherSection('zone-mensualites');
}

function selectionnerMoisRecu(mois, estCoche) {
    if (estCoche) {
        if (typeof setMoisSelectionnePourRecu === 'function') setMoisSelectionnePourRecu(mois);
        const motifSpan = document.getElementById("recu-motif");
        if (motifSpan) motifSpan.textContent = `Mensualité de ${mois} 2026`;
    }
}

async function enregistrerMensualites() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé.");
        return;
    }

    const nom = eleveActuel.nom;
    const checkboxes = document.querySelectorAll('.checkbox-mois');

    if (!stockMensualites[nom]) { stockMensualites[nom] = {}; }

    checkboxes.forEach(cb => {
        let mois = cb.getAttribute('data-mois');
        stockMensualites[nom][mois] = cb.checked;
    });

    try {
        await setDoc(doc(db, "stockGlobalShaolin", "mensualites"), stockMensualites);
        
        const moisNoms = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const dateActuelle = new Date();
        let indexMoisPrecedent = dateActuelle.getMonth() - 1;
        if (indexMoisPrecedent < 0) indexMoisPrecedent = 11;
        const moisAPayer = moisNoms[indexMoisPrecedent];

        const badgeId = 'badge-paiement-' + nom.toLowerCase();
        const badgeElement = document.getElementById(badgeId);

        if (badgeElement) {
            if (stockMensualites[nom][moisAPayer]) {
                badgeElement.className = "badge-statut badge-vert";
                badgeElement.textContent = `Payé (${moisAPayer})`;
            } else {
                badgeElement.className = "badge-statut badge-rouge";
                badgeElement.textContent = `À régler (${moisAPayer})`;
            }
        }

        alert("Les mensualités de " + nom + " ont été enregistrées avec succès !");
        if (window.afficherSection) window.afficherSection('zone-infos');
    } catch (e) {
        console.error("Erreur :", e);
        alert("Erreur lors de l'enregistrement.");
    }
}

async function enregistrerEtFigerRecu() {
    if (sessionStorage.getItem("adminConnecte") !== "true") {
        alert("Accès refusé.");
        return;
    }

    if (!eleveActuel.nom) return;
    if (!moisSelectionnePourRecu) {
        alert("Veuillez d'abord cocher un mois dans le tableau !");
        return;
    }

    if (!stockRecus[eleveActuel.nom]) { stockRecus[eleveActuel.nom] = []; }

    const numElement = document.getElementById("recu-numero");
    const dateElement = document.getElementById("recu-date");

    const nouveauRecu = {
        numero: numElement ? numElement.textContent : "REC-001",
        montantChiffre: "2 000 FCFA",
        montantLettre: "Deux mille francs CFA",
        motif: `Mensualité de ${moisSelectionnePourRecu} 2026`,
        date: dateElement ? dateElement.textContent : new Date().toLocaleDateString('fr-FR')
    };

    stockRecus[eleveActuel.nom].unshift(nouveauRecu);

    try {
        await setDoc(doc(db, "stockGlobalShaolin", "recus"), stockRecus);
        alert("Le reçu " + nouveauRecu.numero + " a été enregistré et figé avec succès !");
        ouvrirAnciensRecus();
    } catch (e) {
        console.error("Erreur :", e);
    }
}

function ouvrirAnciensRecus() {
    if (window.afficherSection) window.afficherSection('zone-anciens-recus');
    const conteneur = document.getElementById('archives-recus-conteneur');
    if (!conteneur) return;
    conteneur.innerHTML = '';

    const estAdmin = sessionStorage.getItem("adminConnecte") === "true";
    const nom = eleveActuel.nom;

    if (!stockRecus[nom] || stockRecus[nom].length === 0) {
        conteneur.innerHTML = '<p style="color: #64748b; font-style: italic;">Aucun reçu archivé pour le moment.</p>';
    } else {
        stockRecus[nom].forEach((recu, index) => {
            const carte = document.createElement('div');
            carte.className = 'bulletin-archive';
            carte.innerHTML = `
                <div style="padding: 10px; border-bottom: 1px solid #e2e8f0; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <p style="margin: 0 0 5px 0; font-weight: bold; color: #2563eb;">🎫 Reçu : ${recu.numero} | B.P.F : ${recu.montantChiffre}</p>
                        <p style="margin: 3px 0; font-size: 0.9rem;"><strong>Motif :</strong> ${recu.motif} | <strong>Date :</strong> ${recu.date}</p>
                    </div>
                    <div class="actions-archive" style="display: flex; gap: 5px;">
                        <button class="btn-afficher" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">👁 Afficher</button>
                        ${estAdmin ? `<button class="btn-modifier-archive" style="background: #d97706; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">✏ Modifier</button>` : ''}
                        <button class="btn-pdf" style="background: #e11d48; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer;">📄 PDF</button>
                    </div>
                </div>
            `;
            
            carte.querySelector('.btn-afficher').onclick = () => afficherRecuArchive(index);
            if (estAdmin) { carte.querySelector('.btn-modifier-archive').onclick = () => modifierRecuArchive(index); }
            carte.querySelector('.btn-pdf').onclick = () => telechargerRecuArchivePDF(nom, index);

            conteneur.appendChild(carte);
        });
    }
}

function afficherRecuArchive(index) {
    const nom = eleveActuel.nom;
    const recu = stockRecus[nom][index];

    const nomElem = document.getElementById("recu-nom-eleve");
    if (nomElem) nomElem.textContent = nom;
    
    const motifElem = document.getElementById("recu-motif");
    if (motifElem) motifElem.textContent = recu.motif;
    
    const numElem = document.getElementById("recu-numero");
    if (numElem) numElem.textContent = recu.numero;
    
    const dateElem = document.getElementById("recu-date");
    if (dateElem) dateElem.textContent = recu.date;

    if (window.afficherSection) window.afficherSection('zone-mensualites');
}

async function modifierRecuArchive(index) {
    if (sessionStorage.getItem("adminConnecte") !== "true") return;

    const nom = eleveActuel.nom;
    const recu = stockRecus[nom][index];

    let nouveauMotif = prompt("Modifier le motif du reçu :", recu.motif);
    if (nouveauMotif !== null && nouveauMotif.trim() !== "") {
        stockRecus[nom][index].motif = nouveauMotif;
        try {
            await setDoc(doc(db, "stockGlobalShaolin", "recus"), stockRecus);
            alert("Le reçu a été modifié !");
            ouvrirAnciensRecus();
        } catch (e) {
            console.error("Erreur :", e);
        }
    }
}

function telechargerRecuPDF() {
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();

    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(185, 28, 28);
    docPdf.setFontSize(16);
    docPdf.text("CLUB YOUZE", 20, 20);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(100, 100, 100);
    docPdf.setFontSize(9);
    docPdf.text("Kung Fu Wushu - Bamako Yirimadio | Tél: +223 71 62 15 36", 20, 26);

    docPdf.setFillColor(37, 99, 235);
    docPdf.roundedRect(135, 15, 55, 12, 2, 2, "F");
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.text("B.P.F : 2 000 FCFA", 138, 22.5);

    docPdf.setDrawColor(200, 200, 200);
    docPdf.line(20, 33, 190, 33);

    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(15);
    docPdf.text("REÇU DE PAIEMENT", 105, 45, { align: "center" });

    docPdf.setFontSize(11);
    docPdf.setFont("helvetica", "normal");
    docPdf.text("De M. / Élève :", 20, 62);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(37, 99, 235);
    docPdf.text(eleveActuel.nom || "Élève", 55, 62);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("La Somme de :", 20, 75);
    docPdf.setFont("helvetica", "italic");
    docPdf.text("Deux mille francs CFA (2 000 FCFA)", 55, 75);

    docPdf.setFont("helvetica", "normal");
    docPdf.text("Motif :", 20, 88);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(2, 132, 199);
    docPdf.text(moisSelectionnePourRecu ? `Mensualité de ${moisSelectionnePourRecu} 2026` : "Mensualité club", 35, 88);

    let numRecu = document.getElementById("recu-numero") ? document.getElementById("recu-numero").textContent : "REC-001";
    let dateRecu = document.getElementById("recu-date") ? document.getElementById("recu-date").textContent : new Date().toLocaleDateString('fr-FR');
    
    docPdf.text(`N° : ${numRecu}`, 20, 108);
    docPdf.text(`Le : ${dateRecu}`, 130, 108);

    // Signature et Nom (Harouna Konaré)
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(10);
    docPdf.text("Le Trésorier", 145, 120);
    docPdf.text("Harouna Konaré", 140, 126);

    const img = new Image();
    img.src = "signature.jpg";
    img.onload = function() {
        try {
            docPdf.addImage(img, 'JPEG', 132, 130, 40, 22);
        } catch (err) {
            console.error("Erreur d'insertion du cachet/signature :", err);
        }
        docPdf.save(`Recu_${numRecu}_${(eleveActuel.nom || 'Eleve').replace(/\s+/g, '_')}.pdf`);
    };

    img.onerror = function() {
        docPdf.text("............................................", 130, 145);
        docPdf.save(`Recu_${numRecu}_${(eleveActuel.nom || 'Eleve').replace(/\s+/g, '_')}.pdf`);
    };
}

function telechargerRecuArchivePDF(nomEleve, index) {
    const recu = stockRecus[nomEleve][index];
    const { jsPDF } = window.jspdf;
    const docPdf = new jsPDF();

    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(185, 28, 28);
    docPdf.setFontSize(16);
    docPdf.text("CLUB YOUZE", 20, 20);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(100, 100, 100);
    docPdf.setFontSize(9);
    docPdf.text("Kung Fu Wushu - Bamako Yirimadio | Tél: +223 71 62 15 36", 20, 26);

    docPdf.setFillColor(37, 99, 235);
    docPdf.roundedRect(135, 15, 55, 12, 2, 2, "F");
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(11);
    docPdf.text(`B.P.F : ${recu.montantChiffre}`, 138, 22.5);

    docPdf.setDrawColor(200, 200, 200);
    docPdf.line(20, 33, 190, 33);

    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(15);
    docPdf.text("REÇU DE PAIEMENT", 105, 45, { align: "center" });

    docPdf.setFontSize(11);
    docPdf.setFont("helvetica", "normal");
    docPdf.text("De M. / Élève :", 20, 62);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(37, 99, 235);
    docPdf.text(nomEleve, 55, 62);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("La Somme de :", 20, 75);
    docPdf.setFont("helvetica", "italic");
    docPdf.text(`${recu.montantLettre} (${recu.montantChiffre})`, 55, 75);

    docPdf.setFont("helvetica", "normal");
    docPdf.text("Motif :", 20, 88);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(2, 132, 199);
    docPdf.text(recu.motif, 35, 88);

    docPdf.text(`N° : ${recu.numero}`, 20, 108);
    docPdf.text(`Le : ${recu.date}`, 130, 108);

    // Signature et Nom (Harouna Konaré)
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(10);
    docPdf.text("Le Trésorier", 145, 120);
    docPdf.text("Harouna Konaré", 140, 126);

    const img = new Image();
    img.src = "signature.jpg";
    img.onload = function() {
        try {
            docPdf.addImage(img, 'JPEG', 132, 130, 40, 22);
        } catch (err) {
            console.error("Erreur d'insertion du cachet/signature :", err);
        }
        docPdf.save(`Recu_${recu.numero}_${nomEleve.replace(/\s+/g, '_')}.pdf`);
    };

    img.onerror = function() {
        docPdf.text("............................................", 130, 145);
        docPdf.save(`Recu_${recu.numero}_${nomEleve.replace(/\s+/g, '_')}.pdf`);
    };
}

window.ouvrirMensualites = ouvrirMensualites;
window.selectionnerMoisRecu = selectionnerMoisRecu;
window.enregistrerMensualites = enregistrerMensualites;
window.enregistrerEtFigerRecu = enregistrerEtFigerRecu;
window.ouvrirAnciensRecus = ouvrirAnciensRecus;
window.afficherRecuArchive = afficherRecuArchive;
window.modifierRecuArchive = modifierRecuArchive;
window.telechargerRecuPDF = telechargerRecuPDF;
window.telechargerRecuArchivePDF = telechargerRecuArchivePDF;