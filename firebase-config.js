// Importation des SDKs Firebase via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCb4isUEJUeHTiylyFrWEqP3WhU0A2Wc4A",
  authDomain: "shaolinapp-466e8.firebaseapp.com",
  projectId: "shaolinapp-466e8",
  storageBucket: "shaolinapp-466e8.firebasestorage.app",
  messagingSenderId: "715800083026",
  appId: "1:715800083026:web:0a51748663f4fddd29bd8b",
  measurementId: "G-5GGYZYMSB4"
};

// Initialisation de Firebase & Firestore
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export let stockBulletins = {};
export let stockMensualites = {}; 
export let stockDossiersMedicaux = {}; 
export let stockRecus = {};
export let eleveActuel = { matricule: "", nom: "", naissance: "", parents: "", telephoneEleve: "", telephoneTuteur: "", inscription: "" };

export let moisSelectionnePourRecu = "";
export function setMoisSelectionnePourRecu(mois) { moisSelectionnePourRecu = mois; }

export const listeMois = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];