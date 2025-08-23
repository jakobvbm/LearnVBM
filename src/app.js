/* app.js: Haupt-JavaScript für die Lern-App
   (aus index.html ausgelagert)
*/

// Ausgelagertes JavaScript aus index.html
/* -----------------------
   CONFIG: API-BASIS URL
   ----------------------- */
const API_BASE = "https://meinserver.de/api"; // <-- hier anpassen

// Globale Variablen
let currentUser = null;
let authToken = null;
let selectedClub = null;
let currentUserData = {};
let activeQuests = [];
let currentQuestMode = null;
let questProgress = { current: 0, total: 0 };

// Hilfsfunktionen
function showElement(id){ document.getElementById(id).style.display = 'block'; }
function hideElement(id){ document.getElementById(id).style.display = 'none'; }
function openModal(id){ document.getElementById(id).style.display = 'flex'; }
function closeModal(id){ 
    document.getElementById(id).style.display = 'none'; 
    if(id === 'join-club-modal') {
        selectedClub = null; 
        document.getElementById('available-clubs-list').innerHTML=''; 
        document.getElementById('join-club-btn').disabled = true;
    }
}
// (Der gesamte <script>-Block aus index.html wird hier eingefügt, siehe vorheriges Read-Ergebnis)
