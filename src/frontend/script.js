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

// LocalStorage
function saveLocalUser(username){ localStorage.setItem('lernapp-current-user', username); }
function loadLocalUser(){ return localStorage.getItem('lernapp-current-user'); }
function clearLocalUser(){ localStorage.removeItem('lernapp-current-user'); }

// UI-Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    const saved = loadLocalUser();
    if(saved) document.getElementById('login-username').value = saved;
    loadActiveQuests();
});

// Tabsteuerung (Login/Register)
function switchTab(tab, ev){
    document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
    ev.currentTarget.classList.add('active');
    if(tab==='login'){ showElement('login-form'); hideElement('register-form'); }
    else { showElement('register-form'); hideElement('login-form'); }
}

/* ===========================
   AUTH: Register & Login
   =========================== */
async function register(){
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-password-confirm').value;

    if(!username || !email || !password){ alert('Bitte alle Felder ausfüllen'); return; }
    if(password !== confirm){ alert('Passwörter stimmen nicht überein'); return; }

    try{
        // Sende Registrierungsdaten an das Backend
        const response = await fetch('http://localhost:8000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        if(!response.ok){
            const error = await response.json();
            throw new Error(error.detail || 'Registrierung fehlgeschlagen');
        }
        alert('Account erstellt! Du kannst dich jetzt anmelden.');
        document.getElementById('login-username').value = username;
        switchTab('login', { currentTarget: document.querySelector('.tab-button') });
    }catch(err){
        alert('Fehler: ' + err.message);
    }
}

async function login(){
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if(!username || !password){ alert('Bitte Name und Passwort eingeben'); return; }

    try{
        // Sende Login-Daten an das Backend
        const response = await fetch('http://localhost:8000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if(!response.ok){
            const error = await response.json();
            throw new Error(error.detail || 'Login fehlgeschlagen');
        }
        const data = await response.json();
        currentUser = data.user;
        currentUserData = data;
        saveLocalUser(currentUser);
        showMainScreen();
    }catch(err){
        alert('Fehler: ' + err.message);
    }
}

function logout(){
    if(confirm('Möchtest du dich abmelden?')){
        currentUser = null;
        currentUserData = {};
        clearLocalUser();
        document.getElementById('login-screen').style.display = 'block';
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('user-header').style.display = 'none';
        hideElement('math-screen');
    }
}

/* ===========================
   UI: Bildschirmwechsel
   =========================== */
function showMainScreen(){
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('user-header').style.display = 'flex';
    updateUserInterface();
    loadActiveQuests();
    showTab('modes', { currentTarget: document.querySelectorAll('.nav-tab')[0] });
}

function showTab(name, ev){
    document.querySelectorAll('.tab-content').forEach(t=>t.style.display='none');
    document.querySelectorAll('.nav-tab').forEach(tab=>tab.classList.remove('active'));
    if(name==='modes') document.getElementById('modes-tab').style.display='block';
    if(name==='clubs') { document.getElementById('clubs-tab').style.display='block'; updateClubInterface(); }
    if(name==='quests') { document.getElementById('quests-tab').style.display='block'; updateQuestInterface(); }
    if(name==='leaderboard') { document.getElementById('leaderboard-tab').style.display='block'; updateLeaderboard(); }
    if(ev && ev.currentTarget) ev.currentTarget.classList.add('active');
}

/* ===========================
   USER & QUEST INTERFACE
   =========================== */
function updateUserInterface(){
    if(!currentUser) return;
    document.getElementById('current-username').textContent = currentUser;
    document.getElementById('user-points').textContent = currentUserData.points || 0;
    
    if(currentUserData.clubId){
        document.getElementById('user-club').textContent = currentUserData.clubName || 'Club';
        if(currentUserData.isAdmin){
            document.getElementById('admin-badge').style.display = 'block';
        }
    } else {
        document.getElementById('user-club').textContent = 'Kein Club';
        document.getElementById('admin-badge').style.display = 'none';
    }
    
    updateQuestNotification();
}

function updateQuestNotification(){
    const pendingQuests = activeQuests.filter(q => !q.completed).length;
    if(pendingQuests > 0){
        document.getElementById('quest-notification').style.display = 'block';
        document.getElementById('pending-quests').textContent = pendingQuests;
        document.getElementById('quest-tab-badge').style.display = 'block';
        document.getElementById('quest-tab-badge').textContent = pendingQuests;
    } else {
        document.getElementById('quest-notification').style.display = 'none';
        document.getElementById('quest-tab-badge').style.display = 'none';
    }
}

/* ===========================
   CLUB MANAGEMENT
   =========================== */
async function showCreateClubModal(){
    openModal('create-club-modal');
    document.getElementById('new-club-name').focus();
}

async function createClub(){
    const clubName = document.getElementById('new-club-name').value.trim();
    const clubCode = document.getElementById('new-club-code').value.trim() || generateClubCode();
    if(!clubName){ alert('Bitte Club-Name eingeben'); return; }
    
    try{
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        const clubId = 'club_' + Date.now();
        
        clubs[clubId] = {
            id: clubId,
            name: clubName,
            code: clubCode,
            creator: currentUser,
            members: [currentUser],
            admins: [currentUser],
            quests: []
        };
        localStorage.setItem('lernapp-clubs', JSON.stringify(clubs));
        
        // Update user data
        const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
        users[currentUser].clubId = clubId;
        users[currentUser].clubName = clubName;
        users[currentUser].isAdmin = true;
        localStorage.setItem('lernapp-users', JSON.stringify(users));
        currentUserData = users[currentUser];
        
        alert(`Club "${clubName}" erstellt (Code: ${clubCode})`);
        closeModal('create-club-modal');
        updateUserInterface();
        updateClubInterface();
    }catch(err){
        alert('Fehler: ' + err.message);
    }
}

function generateClubCode(){
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function showJoinClubModal(){
    openModal('join-club-modal');
    document.getElementById('join-club-input').value = '';
    document.getElementById('available-clubs-list').innerHTML = '';
    document.getElementById('no-clubs-message').textContent = 'Gib einen Club-Code ein um beizutreten';
}

async function searchClubs(){
    const searchInput = document.getElementById('join-club-input').value.trim().toUpperCase();
    const clubsList = document.getElementById('available-clubs-list');
    const noClubsMessage = document.getElementById('no-clubs-message');
    const joinBtn = document.getElementById('join-club-btn');

    clubsList.innerHTML = '';
    selectedClub = null;
    joinBtn.disabled = true;

    if(searchInput.length === 0){
        noClubsMessage.textContent = 'Gib einen Club-Code ein um beizutreten';
        return;
    }

    try{
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        const matchingClubs = Object.values(clubs).filter(club => club.code === searchInput);
        
        if(matchingClubs.length > 0){
            noClubsMessage.style.display = 'none';
            matchingClubs.forEach(club=>{
                const div = document.createElement('div');
                div.className = 'club-item';
                div.innerHTML = `<div style="font-weight:600">${club.name}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                        <div>👥 ${club.members.length} Mitglieder</div>
                        <div class="club-code-badge">${club.code}</div>
                    </div>`;
                div.onclick = () => {
                    document.querySelectorAll('#available-clubs-list .club-item').forEach(it=>it.style.border='none');
                    div.style.border = '2px solid var(--info-color)';
                    selectedClub = club;
                    joinBtn.disabled = false;
                };
                clubsList.appendChild(div);
            });
        } else {
            noClubsMessage.style.display = 'block';
            noClubsMessage.textContent = '❌ Club mit diesem Code nicht gefunden';
        }
    }catch(err){
        noClubsMessage.style.display = 'block';
        noClubsMessage.textContent = '❌ Fehler: ' + err.message;
    }
}

async function joinSelectedClub(){
    if(!selectedClub){ alert('Bitte wähle einen Club aus'); return; }
    if(selectedClub.members.includes(currentUser)){ alert('Du bist bereits in diesem Club'); return; }
    
    try{
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        clubs[selectedClub.id].members.push(currentUser);
        localStorage.setItem('lernapp-clubs', JSON.stringify(clubs));
        
        const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
        users[currentUser].clubId = selectedClub.id;
        users[currentUser].clubName = selectedClub.name;
        users[currentUser].isAdmin = false;
        localStorage.setItem('lernapp-users', JSON.stringify(users));
        currentUserData = users[currentUser];
        
        alert(`Erfolgreich dem Club "${selectedClub.name}" beigetreten!`);
        closeModal('join-club-modal');
        updateUserInterface();
        updateClubInterface();
    }catch(err){
        alert('Fehler: ' + err.message);
    }
}

async function leaveClub(){
    if(!currentUserData.clubId){ alert('Du bist in keinem Club'); return; }
    if(!confirm('Möchtest du den Club verlassen?')) return;
    
    try{
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        const club = clubs[currentUserData.clubId];
        club.members = club.members.filter(m => m !== currentUser);
        club.admins = club.admins.filter(a => a !== currentUser);
        localStorage.setItem('lernapp-clubs', JSON.stringify(clubs));
        
        const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
        users[currentUser].clubId = null;
        users[currentUser].clubName = null;
        users[currentUser].isAdmin = false;
        localStorage.setItem('lernapp-users', JSON.stringify(users));
        currentUserData = users[currentUser];
        
        alert('Du hast den Club verlassen.');
        updateUserInterface();
        updateClubInterface();
    }catch(err){
        alert('Fehler: ' + err.message);
    }
}

async function updateClubInterface(){
    if(!currentUserData.clubId){
        document.getElementById('current-club-info').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'none';
        return;
    }
    
    try{
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        const club = clubs[currentUserData.clubId];
        const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
        
        document.getElementById('current-club-info').style.display = 'block';
        document.getElementById('current-club-name').textContent = club.name;
        document.getElementById('current-club-code').textContent = club.code;
        
        if(currentUserData.isAdmin){
            document.getElementById('admin-panel').style.display = 'block';
        } else {
            document.getElementById('admin-panel').style.display = 'none';
        }
        
        const membersList = document.getElementById('club-members-list');
        membersList.innerHTML = '';
        club.members.sort((a,b)=> (users[b]?.points||0)-(users[a]?.points||0)).forEach((memberName)=>{
            const memberData = users[memberName] || { points: 0 };
            const li = document.createElement('li');
            li.style.padding = '8px';
            li.style.background = '#f8f9fa';
            li.style.borderRadius = '8px';
            li.style.marginBottom = '6px';
            li.innerHTML = `<div style="font-weight:600">${memberName}${club.creator === memberName ? ' 👑':''}${club.admins.includes(memberName) && club.creator !== memberName ? ' 👨‍💼':''}${memberName===currentUser?' 👤':''}</div>
                            <div style="color:var(--info-color);font-weight:700">${memberData.points||0} Punkte</div>`;
            membersList.appendChild(li);
        });
    }catch(err){
        console.error('updateClubInterface error', err);
        document.getElementById('current-club-info').style.display = 'none';
    }
}

/* ===========================
   QUEST SYSTEM
   =========================== */
function loadActiveQuests(){
    const saved = localStorage.getItem(`lernapp-quests-${currentUser}`);
    activeQuests = saved ? JSON.parse(saved) : [];
    updateQuestNotification();
}

function saveActiveQuests(){
    localStorage.setItem(`lernapp-quests-${currentUser}`, JSON.stringify(activeQuests));
    updateQuestNotification();
}

function showQuestModal(){
    updateQuestModalContent();
    openModal('quest-modal');
}

function updateQuestModalContent(){
    const content = document.getElementById('quest-modal-content');
    const pendingQuests = activeQuests.filter(q => !q.completed);
    
    if(pendingQuests.length === 0){
        content.innerHTML = '<p style="text-align:center;color:#7f8c8d">Keine aktiven Quests</p>';
        return;
    }
    
    content.innerHTML = '';
    pendingQuests.forEach(quest => {
        const div = document.createElement('div');
        div.className = 'quest-card';
        div.innerHTML = `
            <h4>${quest.title}</h4>
            <p>${getSubjectName(quest.subject)} • ${getDifficultyName(quest.difficulty)} • ${quest.count} Aufgaben</p>
            <div class="quest-progress">
                <div class="quest-progress-fill" style="width:${(quest.progress/quest.count)*100}%"></div>
            </div>
            <p>${quest.progress}/${quest.count} abgeschlossen</p>
            <button class="action-button check-btn" onclick="startQuest('${quest.id}')">▶️ Starten</button>
        `;
        content.appendChild(div);
    });
}

function updateQuestInterface(){
    const activeContainer = document.getElementById('active-quests');
    const completedContainer = document.getElementById('completed-quests-list');
    
    const activeQuestsList = activeQuests.filter(q => !q.completed);
    const completedQuestsList = activeQuests.filter(q => q.completed);
    
    activeContainer.innerHTML = '';
    if(activeQuestsList.length === 0){
        activeContainer.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:20px">Keine aktiven Quests</p>';
    } else {
        activeQuestsList.forEach(quest => {
            const div = document.createElement('div');
            div.className = 'quest-card';
            div.innerHTML = `
                <h4>${quest.title}</h4>
                <p>${getSubjectName(quest.subject)} • ${getDifficultyName(quest.difficulty)} • ${quest.count} Aufgaben</p>
                <div class="quest-progress">
                    <div class="quest-progress-fill" style="width:${(quest.progress/quest.count)*100}%"></div>
                </div>
                <p>${quest.progress}/${quest.count} abgeschlossen • ${quest.count * 10} Punkte</p>
                <button class="action-button check-btn" onclick="startQuest('${quest.id}')">▶️ Starten</button>
            `;
            activeContainer.appendChild(div);
        });
    }
    
    completedContainer.innerHTML = '';
    if(completedQuestsList.length === 0){
        completedContainer.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:10px">Noch keine abgeschlossenen Quests</p>';
    } else {
        completedQuestsList.forEach(quest => {
            const div = document.createElement('div');
            div.style.cssText = 'background:#e8f5e8;padding:10px;border-radius:8px;margin:5px 0;';
            div.innerHTML = `
                <div style="font-weight:600">${quest.title}</div>
                <div style="font-size:0.9rem;color:#27ae60">✅ Abgeschlossen • +${quest.count * 10} Punkte</div>
            `;
            completedContainer.appendChild(div);
        });
    }
}

function getSubjectName(subject){
    const names = { math: '🧮 Mathe', german: '📝 Deutsch', english: '🇬🇧 English' };
    return names[subject] || subject;
}

function getDifficultyName(difficulty){
    const names = { easy: '😊 Leicht', medium: '🤔 Mittel', hard: '😅 Schwer' };
    return names[difficulty] || difficulty;
}

function startQuest(questId){
    const quest = activeQuests.find(q => q.id === questId);
    if(!quest || quest.completed) return;
    
    currentQuestMode = quest;
    closeModal('quest-modal');
    
    if(quest.subject === 'math'){
        showMathMode();
    } else if(quest.subject === 'german'){
        showGermanMode();
    } else if(quest.subject === 'english'){
        showEnglishMode();
    }
}

/* ===========================
   ADMIN QUEST CREATION
   =========================== */
function showCreateQuestModal(){
    if(!currentUserData.isAdmin){ alert('Nur Admins können Quests erstellen'); return; }
    openModal('create-quest-modal');
    loadClubMembersForQuest();
}

function loadClubMembersForQuest(){
    const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
    const club = clubs[currentUserData.clubId];
    const memberSelection = document.getElementById('member-selection');
    const memberCheckboxes = document.getElementById('member-checkboxes');
    
    memberCheckboxes.innerHTML = '';
    if(club && club.members){
        club.members.forEach(member => {
            if(member !== currentUser){
                const div = document.createElement('div');
                div.style.cssText = 'margin:5px 0;';
                div.innerHTML = `
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
                        <input type="checkbox" value="${member}" checked>
                        <span>${member}</span>
                    </label>
                `;
                memberCheckboxes.appendChild(div);
            }
        });
    }
    
    document.getElementById('quest-target').addEventListener('change', (e) => {
        memberSelection.style.display = e.target.value === 'specific' ? 'block' : 'none';
    });
}

let selectedQuestSubject = 'math';
let selectedDifficulty = 'easy';

function selectQuestSubject(subject, event){
    selectedQuestSubject = subject;
    document.querySelectorAll('.subject-tab').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function selectDifficulty(difficulty, event){
    selectedDifficulty = difficulty;
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

function createQuest(){
    const title = document.getElementById('quest-title').value.trim();
    const count = parseInt(document.getElementById('quest-count').value);
    const target = document.getElementById('quest-target').value;
    
    if(!title){ alert('Bitte Quest-Titel eingeben'); return; }
    if(!count || count < 1){ alert('Bitte gültige Anzahl Aufgaben eingeben'); return; }
    
    let targetMembers = [];
    if(target === 'all'){
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        const club = clubs[currentUserData.clubId];
        targetMembers = club.members.filter(m => m !== currentUser);
    } else {
        const checkboxes = document.querySelectorAll('#member-checkboxes input[type="checkbox"]:checked');
        targetMembers = Array.from(checkboxes).map(cb => cb.value);
    }
    
    if(targetMembers.length === 0){ alert('Bitte mindestens ein Mitglied auswählen'); return; }
    
    const questId = 'quest_' + Date.now();
    const newQuest = {
        id: questId,
        title,
        subject: selectedQuestSubject,
        difficulty: selectedDifficulty,
        count,
        progress: 0,
        completed: false,
        createdBy: currentUser,
        createdAt: new Date().toISOString()
    };
    
    // Quest an alle Zielmitglieder verteilen
    targetMembers.forEach(member => {
        const memberQuests = JSON.parse(localStorage.getItem(`lernapp-quests-${member}`) || '[]');
        memberQuests.push({ ...newQuest });
        localStorage.setItem(`lernapp-quests-${member}`, JSON.stringify(memberQuests));
    });
    
    alert(`Quest "${title}" wurde an ${targetMembers.length} Mitglieder verteilt!`);
    closeModal('create-quest-modal');
    
    // Reset form
    document.getElementById('quest-title').value = '';
    document.getElementById('quest-count').value = '10';
    selectQuestSubject('math', { currentTarget: document.querySelector('.subject-tab') });
    selectDifficulty('easy', { currentTarget: document.querySelector('.difficulty-btn') });
}

function showManageAdminsModal(){
    if(!currentUserData.isAdmin){ alert('Nur Admins können andere Admins verwalten'); return; }
    updateAdminManagementList();
    openModal('manage-admins-modal');
}

function updateAdminManagementList(){
    const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
    const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
    const club = clubs[currentUserData.clubId];
    const list = document.getElementById('admin-management-list');
    
    list.innerHTML = '';
    if(club && club.members){
        club.members.forEach(member => {
            const isAdmin = club.admins.includes(member);
            const isCreator = club.creator === member;
            
            const div = document.createElement('div');
            div.className = 'member-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight:600">${member}${isCreator ? ' 👑' : ''}${isAdmin && !isCreator ? ' 👨‍💼' : ''}</div>
                    <div style="font-size:0.9rem;color:#666">${users[member]?.points || 0} Punkte</div>
                </div>
                <div>
                    ${!isCreator ? `<button class="action-button ${isAdmin ? 'back-btn' : 'check-btn'}" onclick="toggleAdmin('${member}')">${isAdmin ? '➖ Admin entfernen' : '➕ Admin machen'}</button>` : '<span style="color:#f39c12">Ersteller</span>'}
                </div>
            `;
            list.appendChild(div);
        });
    }
}

function toggleAdmin(memberName){
    const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
    const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
    const club = clubs[currentUserData.clubId];
    
    if(club.creator === memberName){ alert('Der Ersteller kann nicht entfernt werden'); return; }
    
    const isCurrentlyAdmin = club.admins.includes(memberName);
    
    if(isCurrentlyAdmin){
        club.admins = club.admins.filter(a => a !== memberName);
        users[memberName].isAdmin = false;
        alert(`${memberName} ist kein Admin mehr`);
    } else {
        club.admins.push(memberName);
        users[memberName].isAdmin = true;
        alert(`${memberName} ist jetzt Admin`);
    }
    
    localStorage.setItem('lernapp-clubs', JSON.stringify(clubs));
    localStorage.setItem('lernapp-users', JSON.stringify(users));
    updateAdminManagementList();
}

function showQuestProgressModal(){
    if(!currentUserData.isAdmin){ alert('Nur Admins können den Quest-Fortschritt einsehen'); return; }
    updateQuestProgressList();
    openModal('quest-progress-modal');
}

function updateQuestProgressList(){
    const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
    const club = clubs[currentUserData.clubId];
    const list = document.getElementById('quest-progress-list');
    
    list.innerHTML = '';
    
    if(!club || !club.members){
        list.innerHTML = '<p>Keine Club-Daten gefunden</p>';
        return;
    }
    
    // Sammle alle Quest-Daten der Mitglieder
    const allQuestData = {};
    club.members.forEach(member => {
        const memberQuests = JSON.parse(localStorage.getItem(`lernapp-quests-${member}`) || '[]');
        memberQuests.forEach(quest => {
            if(!allQuestData[quest.id]){
                allQuestData[quest.id] = {
                    title: quest.title,
                    subject: quest.subject,
                    difficulty: quest.difficulty,
                    count: quest.count,
                    members: {}
                };
            }
            allQuestData[quest.id].members[member] = {
                progress: quest.progress,
                completed: quest.completed
            };
        });
    });
    
    if(Object.keys(allQuestData).length === 0){
        list.innerHTML = '<p style="text-align:center;color:#7f8c8d">Keine Quests erstellt</p>';
        return;
    }
    
    Object.values(allQuestData).forEach(questData => {
        const div = document.createElement('div');
        div.style.cssText = 'background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:10px;';
        
        let memberStats = '';
        Object.entries(questData.members).forEach(([member, data]) => {
            const statusClass = data.completed ? 'status-completed' : (data.progress > 0 ? 'status-pending' : 'status-not-started');
            const statusText = data.completed ? 'Abgeschlossen' : (data.progress > 0 ? `${data.progress}/${questData.count}` : 'Nicht begonnen');
            
            memberStats += `
                <div class="member-item" style="margin-bottom:5px">
                    <span>${member}</span>
                    <span class="member-status ${statusClass}">${statusText}</span>
                </div>
            `;
        });
        
        div.innerHTML = `
            <h4>${questData.title}</h4>
            <p>${getSubjectName(questData.subject)} • ${getDifficultyName(questData.difficulty)} • ${questData.count} Aufgaben</p>
            <div style="margin-top:10px">${memberStats}</div>
        `;
        
        list.appendChild(div);
    });
}

/* ===========================
   LEADERBOARD
   =========================== */
async function updateLeaderboard(){
    try{
        const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
        const clubs = JSON.parse(localStorage.getItem('lernapp-clubs') || '{}');
        
        const userList = Object.entries(users).map(([name, data]) => ({
            name,
            points: data.points || 0,
            clubName: data.clubName
        })).sort((a,b) => b.points - a.points);
        
        const list = document.getElementById('global-leaderboard');
        list.innerHTML = '';
        
        userList.forEach((user,i) => {
            const li = document.createElement('li');
            li.style.padding='8px';
            li.style.background='#fff';
            li.style.borderRadius='8px';
            li.style.marginBottom='6px';
            li.innerHTML = `<div style="font-weight:700">${i<3? (i===0?'🥇':i===1?'🥈':'🥉') : (i+1)+'.'} ${user.name}${user.name===currentUser?' 👤':''}${user.clubName? ' ('+user.clubName+')':''}</div>
                            <div style="color:var(--info-color);font-weight:700">${user.points}</div>`;
            list.appendChild(li);
        });
    }catch(err){
        console.error(err);
    }
}

function refreshLeaderboard(){ updateLeaderboard(); }

/* ===========================
   LEARNING MODES
   =========================== */
let correctAnswers = 0, wrongAnswers = 0;

function showMathMode(){ 
    hideElement('main-screen'); 
    showElement('math-screen'); 
    document.getElementById('math-mode-title').textContent = currentQuestMode ? `🧮 Quest: ${currentQuestMode.title}` : '🧮 Mathe Trainer';
    setupQuestMode();
    generateNewTask(); 
}

function showGermanMode(){
    hideElement('main-screen'); 
    showElement('math-screen');
    document.getElementById('math-mode-title').textContent = currentQuestMode ? `📝 Quest: ${currentQuestMode.title}` : '📝 Deutsch Trainer';
    setupQuestMode();
    generateGermanTask();
}

function showEnglishMode(){
    hideElement('main-screen'); 
    showElement('math-screen');
    document.getElementById('math-mode-title').textContent = currentQuestMode ? `🇬🇧 Quest: ${currentQuestMode.title}` : '🇬🇧 English Trainer';
    setupQuestMode();
    generateEnglishTask();
}

function setupQuestMode(){
    if(currentQuestMode){
        document.getElementById('quest-progress-display').style.display = 'block';
        updateQuestProgressDisplay();
    } else {
        document.getElementById('quest-progress-display').style.display = 'none';
    }
}

function updateQuestProgressDisplay(){
    if(!currentQuestMode) return;
    document.getElementById('quest-current').textContent = currentQuestMode.progress;
    document.getElementById('quest-total').textContent = currentQuestMode.count;
    const percentage = (currentQuestMode.progress / currentQuestMode.count) * 100;
    document.getElementById('quest-progress-bar').style.width = percentage + '%';
}

function goBack(){ 
    showElement('main-screen'); 
    hideElement('math-screen'); 
    resetGame();
    currentQuestMode = null;
}

function resetGame(){ 
    correctAnswers=0; 
    wrongAnswers=0; 
    document.getElementById('correct-score').textContent='0'; 
    document.getElementById('wrong-score').textContent='0'; 
}

function generateNewTask(){
    if(!currentQuestMode || currentQuestMode.subject !== 'math') return generateMathTask();
    generateMathTask();
}

function generateMathTask(){
    let a, b, operation, question, solution;
    
    const difficulty = currentQuestMode ? currentQuestMode.difficulty : 'easy';
    
    switch(difficulty){
        case 'easy':
            a = Math.floor(Math.random()*10);
            b = Math.floor(Math.random()*10);
            operation = Math.random() < 0.5 ? '+' : '-';
            if(operation === '-' && a < b) [a,b] = [b,a]; // Negative vermeiden
            solution = operation === '+' ? a + b : a - b;
            break;
        case 'medium':
            a = Math.floor(Math.random()*50) + 1;
            b = Math.floor(Math.random()*50) + 1;
            operation = ['+', '-', '*'][Math.floor(Math.random()*3)];
            if(operation === '*') {
                a = Math.floor(Math.random()*12) + 1;
                b = Math.floor(Math.random()*12) + 1;
            }
            if(operation === '-' && a < b) [a,b] = [b,a];
            solution = operation === '+' ? a + b : operation === '-' ? a - b : a * b;
            break;
        case 'hard':
            a = Math.floor(Math.random()*100) + 1;
            b = Math.floor(Math.random()*100) + 1;
            operation = ['+', '-', '*', '/'][Math.floor(Math.random()*4)];
            if(operation === '*') {
                a = Math.floor(Math.random()*25) + 1;
                b = Math.floor(Math.random()*25) + 1;
            }
            if(operation === '/') {
                b = Math.floor(Math.random()*12) + 1;
                solution = Math.floor(Math.random()*20) + 1;
                a = solution * b; // Sorgt für ganzzahlige Division
            } else {
                if(operation === '-' && a < b) [a,b] = [b,a];
                solution = operation === '+' ? a + b : operation === '-' ? a - b : a * b;
            }
            break;
        default:
            a = Math.floor(Math.random()*10);
            b = Math.floor(Math.random()*10);
            operation = '+';
            solution = a + b;
    }
    
    question = `${a} ${operation} ${b} = ?`;
    document.getElementById('question').textContent = question;
    document.getElementById('question').dataset.solution = solution;
    document.getElementById('answer').value = '';
    document.getElementById('answer').focus();
}

function generateGermanTask(){
    const difficulty = currentQuestMode ? currentQuestMode.difficulty : 'easy';
    let tasks = [];
    
    switch(difficulty){
        case 'easy':
            tasks = [
                { question: 'Wie schreibt man "Haus" in der Mehrzahl?', answer: 'Häuser' },
                { question: 'Der/Die/Das... Katze?', answer: 'Die' },
                { question: 'Wie heißt das Gegenteil von "groß"?', answer: 'klein' },
                { question: 'Ergänze: Ich ___ zur Schule. (gehen)', answer: 'gehe' },
                { question: 'Wie viele Buchstaben hat das Alphabet?', answer: '26' }
            ];
            break;
        case 'medium':
            tasks = [
                { question: 'Konjugiere "haben" in der 3. Person Singular:', answer: 'hat' },
                { question: 'Was ist der Genitiv von "der Mann"?', answer: 'des Mannes' },
                { question: 'Ergänze das Adjektiv: Das rot__ Auto', answer: 'rote' },
                { question: 'Wie heißt die Steigerung von "gut"?', answer: 'besser' },
                { question: 'Setze das richtige Pronomen ein: ___ bin müde.', answer: 'Ich' }
            ];
            break;
        case 'hard':
            tasks = [
                { question: 'Bilde das Perfekt: "Ich lese ein Buch"', answer: 'Ich habe ein Buch gelesen' },
                { question: 'Was ist ein Substantiv? (Ein Wort für...)', answer: 'Personen, Tiere oder Dinge' },
                { question: 'Konjugiere "werden" im Präteritum, 1. Person Singular:', answer: 'wurde' },
                { question: 'Ergänze: Trotz d__ Regen__ gehen wir spazieren.', answer: 'des Regens' },
                { question: 'Was bedeutet "Metapher"?', answer: 'Sprachliches Bild' }
            ];
            break;
    }
    
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    document.getElementById('question').textContent = task.question;
    document.getElementById('question').dataset.solution = task.answer.toLowerCase();
    document.getElementById('answer').value = '';
    document.getElementById('answer').focus();
}

function generateEnglishTask(){
    const difficulty = currentQuestMode ? currentQuestMode.difficulty : 'easy';
    let tasks = [];
    
    switch(difficulty){
        case 'easy':
            tasks = [
                { question: 'Translate: "Hund"', answer: 'dog' },
                { question: 'What is the plural of "child"?', answer: 'children' },
                { question: 'Complete: I ___ happy. (am/is/are)', answer: 'am' },
                { question: 'What color is the sun?', answer: 'yellow' },
                { question: 'How do you say "Guten Morgen" in English?', answer: 'good morning' }
            ];
            break;
        case 'medium':
            tasks = [
                { question: 'What is the past tense of "go"?', answer: 'went' },
                { question: 'Complete: She ___ to school yesterday. (go)', answer: 'went' },
                { question: 'What is the opposite of "big"?', answer: 'small' },
                { question: 'Form the comparative of "good":', answer: 'better' },
                { question: 'Complete: I have ___ working here for 5 years.', answer: 'been' }
            ];
            break;
        case 'hard':
            tasks = [
                { question: 'What is the third conditional structure?', answer: 'If + past perfect, would have + past participle' },
                { question: 'Complete: I wish I ___ studied harder. (past)', answer: 'had' },
                { question: 'What is a gerund?', answer: 'verb + ing used as noun' },
                { question: 'Form the passive: "They built the house."', answer: 'The house was built' },
                { question: 'Complete: By next year, I ___ have graduated.', answer: 'will' }
            ];
            break;
    }
    
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    document.getElementById('question').textContent = task.question;
    document.getElementById('question').dataset.solution = task.answer.toLowerCase();
    document.getElementById('answer').value = '';
    document.getElementById('answer').focus();
}

function checkAnswer(){
    const userAnswer = document.getElementById('answer').value.trim();
    const correctAnswer = document.getElementById('question').dataset.solution;
    
    if(!userAnswer){ alert('Bitte eine Antwort eingeben'); return; }
    
    let isCorrect = false;
    
    // Für Mathe: numerischer Vergleich
    if(currentQuestMode && currentQuestMode.subject === 'math' || !currentQuestMode){
        isCorrect = Number(userAnswer) === Number(correctAnswer);
    } else {
        // Für Sprachen: Text-Vergleich (case-insensitive)
        isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    }
    
    if(isCorrect){
        correctAnswers++;
        document.getElementById('correct-score').textContent = correctAnswers;
        
        // Quest-Fortschritt aktualisieren
        if(currentQuestMode){
            currentQuestMode.progress++;
            updateQuestProgressDisplay();
            
            // Quest abgeschlossen?
            if(currentQuestMode.progress >= currentQuestMode.count){
                completeQuest();
                return;
            }
            
            // Quest-Daten speichern
            const questIndex = activeQuests.findIndex(q => q.id === currentQuestMode.id);
            if(questIndex !== -1){
                activeQuests[questIndex] = currentQuestMode;
                saveActiveQuests();
            }
        }
        
        alert('Richtig! 🎉');
    } else {
        wrongAnswers++;
        document.getElementById('wrong-score').textContent = wrongAnswers;
        alert(`Leider falsch. Die richtige Antwort war: ${correctAnswer}`);
    }
    
    // Nächste Aufgabe generieren
    setTimeout(() => {
        if(currentQuestMode && currentQuestMode.subject === 'math'){
            generateMathTask();
        } else if(currentQuestMode && currentQuestMode.subject === 'german'){
            generateGermanTask();
        } else if(currentQuestMode && currentQuestMode.subject === 'english'){
            generateEnglishTask();
        } else {
            generateMathTask(); // Default
        }
    }, 1500);
}

function completeQuest(){
    if(!currentQuestMode) return;
    
    // Quest als abgeschlossen markieren
    currentQuestMode.completed = true;
    const questIndex = activeQuests.findIndex(q => q.id === currentQuestMode.id);
    if(questIndex !== -1){
        activeQuests[questIndex] = currentQuestMode;
        saveActiveQuests();
    }
    
    // Punkte hinzufügen
    const pointsEarned = currentQuestMode.count * 10;
    currentUserData.points = (currentUserData.points || 0) + pointsEarned;
    
    // User-Daten speichern
    const users = JSON.parse(localStorage.getItem('lernapp-users') || '{}');
    users[currentUser] = currentUserData;
    localStorage.setItem('lernapp-users', JSON.stringify(users));
    
    alert(`🎉 Quest abgeschlossen!\n\nDu hast ${pointsEarned} Punkte erhalten!\n\nGesamtpunkte: ${currentUserData.points}`);
    
    updateUserInterface();
    goBack();
}

/* ===========================
   KEYBOARD SHORTCUTS
   =========================== */
document.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' && document.getElementById('math-screen').style.display !== 'none'){
        e.preventDefault();
        checkAnswer();
    }
});

/* ===========================
   EXPOSE FUNCTIONS TO GLOBAL SCOPE
   =========================== */
window.showCreateClubModal = showCreateClubModal;
window.showJoinClubModal = showJoinClubModal;
window.createClub = createClub;
window.searchClubs = searchClubs;
window.joinSelectedClub = joinSelectedClub;
window.leaveClub = leaveClub;
window.updateClubInterface = updateClubInterface;
window.updateLeaderboard = updateLeaderboard;
window.refreshLeaderboard = refreshLeaderboard;
window.register = register;
window.login = login;
window.logout = logout;
window.showMathMode = showMathMode;
window.showGermanMode = showGermanMode;
window.showEnglishMode = showEnglishMode;
window.goBack = goBack;
window.checkAnswer = checkAnswer;
window.showTab = showTab;
window.switchTab = switchTab;
window.closeModal = closeModal;
window.showQuestModal = showQuestModal;
window.startQuest = startQuest;
window.showCreateQuestModal = showCreateQuestModal;
window.selectQuestSubject = selectQuestSubject;
window.selectDifficulty = selectDifficulty;
window.createQuest = createQuest;
window.showManageAdminsModal = showManageAdminsModal;
window.toggleAdmin = toggleAdmin;
window.showQuestProgressModal = showQuestProgressModal;

function showSettingsScreen(){
    hideElement('login-screen');
    hideElement('main-screen');
    showElement('settings-screen');
}
function changeUsername(){
    // TODO: API-Call für Namensänderung
    alert('Name geändert!');
}
function changePassword(){
    // TODO: API-Call für Passwortänderung
    alert('Passwort geändert!');
}
function toggleMode(){
    // Dark/Light Mode umschalten
    const isDark = document.getElementById('mode-toggle').checked;
    if(isDark){
        document.body.classList.add('dark-mode');
    }else{
        document.body.classList.remove('dark-mode');
    }
}
function cancelSettings(){
    hideElement('settings-screen');
    showElement('main-screen');
}
function saveSettings(){
    // TODO: Einstellungen speichern
    hideElement('settings-screen');
    showElement('main-screen');
}
