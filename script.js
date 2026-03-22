
/* MODULE 0: SUPABASE INITIALIZATION */
/* Description: Safely connects to cloud database if library is present. */
const supabaseUrl = 'https://dghjvhnnqtddjcfztxkl.supabase.co';
const supabaseKey = 'sb_publishable__66tzTBdb9MsI-nUlHECzA_4DZi2dxG';
let supabase;
if (window.supabase) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
}

/* MODULE 1: Memory Safety Utility */
/* Description: Prevents fatal crashes when reading database. */
function getSafeTutorsDB() {
    try {
        const db = JSON.parse(localStorage.getItem('tutorsDB'));
        return Array.isArray(db) ? db : [];
    } catch (error) {
        return [];
    }
}
function getNormalizedSubjects(tutor) {
    if (Array.isArray(tutor.subjects)) return tutor.subjects;
    if (typeof tutor.subjects === 'string') return [tutor.subjects];
    if (typeof tutor.subject === 'string') return [tutor.subject];
    return [];
}
if (!localStorage.getItem('tutorsDB')) {
    localStorage.setItem('tutorsDB', JSON.stringify([]));
}

/* MODULE 2: Auth and Navigation */
/* Description: Controls login state and updates nav bar UI. */
document.addEventListener("DOMContentLoaded", function() {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        if (document.getElementById('nav-login')) document.getElementById('nav-login').style.display = 'none';
        if (document.getElementById('nav-join')) document.getElementById('nav-join').style.display = 'none';
        if (document.getElementById('nav-dashboard')) {
            const navDashboard = document.getElementById('nav-dashboard');
            navDashboard.style.display = 'inline';
            navDashboard.href = localStorage.getItem('userRole') === 'Educator' ? 'tutorManager.html' : 'dashboard.html';
        }
        if (document.getElementById('nav-logout')) document.getElementById('nav-logout').style.display = 'inline';
    }
});
/* ========================================= */
/* MODULE: REGISTRATION WIZARD UI            */
/* Description: Controls the account toggle and the 3-step setup process. */
/* ========================================= */

let selectedAccountType = 'Student';

function selectRole(clickedButton, role) {
    // 1. Remove active state from both buttons
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    
    // 2. Add active state to the clicked button
    clickedButton.classList.add('active');
    selectedAccountType = role;
    
    // 3. Change the text and color of the submit button at the bottom
    const step1Btn = document.getElementById('step-1-btn');
    if (role === 'Educator') {
        step1Btn.innerText = 'Continue Educator Setup';
        step1Btn.style.background = '#0056b3';
    } else {
        step1Btn.innerText = 'Create Student Account';
        step1Btn.style.background = '#333';
    }
}

function handleStep1() {
    const emailInput = document.getElementById('email-input');
    if (!emailInput || emailInput.value === "") {
        alert("Please enter a valid email address.");
        return;
    }
    
    localStorage.setItem('userEmail', emailInput.value);
    localStorage.setItem('userRole', selectedAccountType);
    
    if (selectedAccountType === 'Student') {
        alert("Student Account Created!");
        window.location.href = 'dashboard.html';
    } else {
        // Expand the box and show step 2 for Educators
        document.getElementById('wizard-box').style.maxWidth = '700px';
        document.getElementById('progress-bar').style.display = 'flex';
        goToStep(2);
    }
}

function goToStep(stepNumber) {
    // Hide all steps
    document.getElementById('step-1-content').style.display = 'none';
    document.getElementById('step-2-content').style.display = 'none';
    document.getElementById('step-3-content').style.display = 'none';
    
    // Show the target step
    document.getElementById('step-' + stepNumber + '-content').style.display = 'block';
    
    // Update the visual progress bar
    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById('indicator-' + i);
        if (!indicator) continue;
        
        indicator.classList.remove('active', 'completed');
        let rawText = indicator.innerText.replace("Done ", "");
        
        if (i < stepNumber) {
            indicator.classList.add('completed');
            indicator.innerText = "Done " + rawText;
        } else if (i === stepNumber) {
            indicator.classList.add('active');
            indicator.innerText = rawText;
        } else {
            indicator.innerText = rawText;
        }
    }
}

/* ========================================= */
/* MODULE: TAG INPUT ENGINE                  */
/* Description: Creates the subject tags for step 3 of registration. */
/* ========================================= */

let activeSubjects = [];
document.addEventListener("DOMContentLoaded", function() {
    const subjectInput = document.getElementById('subject-input');
    if (subjectInput) {
        subjectInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                let newSubject = subjectInput.value.replace(',', '').trim();
                if (newSubject !== "" && !activeSubjects.includes(newSubject)) {
                    activeSubjects.push(newSubject);
                    renderTags();
                }
                subjectInput.value = '';
            }
        });
    }
});

function renderTags() {
    const container = document.getElementById('subject-tag-container');
    const input = document.getElementById('subject-input');
    if (!container || !input) return;
    
    document.querySelectorAll('.tag-bubble').forEach(tag => tag.remove());
    
    activeSubjects.forEach((subject, index) => {
        const bubble = document.createElement('div');
        bubble.className = 'tag-bubble';
        bubble.innerHTML = `${subject} <span onclick="removeTag(${index})" style="cursor:pointer; font-weight:bold; margin-left:8px;">x</span>`;
        container.insertBefore(bubble, input);
    });
}

function removeTag(index) {
    activeSubjects.splice(index, 1);
    renderTags();
}
function handleLogout() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}

/* MODULE 3: Home Page Search Bridge */
/* Description: Grabs search from index.html and routes to directory.html. */
function executeHomeSearch() {
    const input = document.getElementById('home-search-input');
    if (input && input.value.trim() !== "") {
        localStorage.setItem('pendingSearch', input.value.trim());
        window.location.href = 'directory.html';
    } else {
        window.location.href = 'directory.html';
    }
}

/* MODULE 4: Directory Search and Renderer */
/* Description: Filters tutors and draws cards. Automatically catches searches coming from the home page. */
function renderTutorDirectory(searchQuery = "") {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;
    const tutorsDB = getSafeTutorsDB();
    grid.innerHTML = "";
    
    const queryText = (typeof searchQuery === 'string' ? searchQuery : "").toLowerCase();
    
    const filteredTutors = tutorsDB.filter(tutor => {
        const matchesName = tutor.name && tutor.name.toLowerCase().includes(queryText);
        const matchesLocation = tutor.location && tutor.location.toLowerCase().includes(queryText);
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const matchesSubject = normalizedSubjects.some(sub => sub.toLowerCase().includes(queryText));
        
        return matchesName || matchesLocation || matchesSubject;
    });

    if (filteredTutors.length === 0) {
        grid.innerHTML = "<p>No tutors found matching your search.</p>";
        return;
    }

    filteredTutors.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'tutorCard'; // Your original class
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const mainSubject = normalizedSubjects.length > 0 ? normalizedSubjects[0] : "General";
        
        card.innerHTML = `
            ${tutor.profilePic ? '<img src="' + tutor.profilePic + '" class="card-profile-img">' : '<div class="card-profile-img" style="background:#ccc;"></div>'}
            <h3>${tutor.name || "Unnamed Tutor"}</h3>
            <p class="occupation-tag">${tutor.occupation || "Educator"}</p>
            <span class="tag">${mainSubject}</span>
            <p class="bio-snippet">${tutor.bio ? tutor.bio.substring(0, 60) + "..." : "No bio available."}</p>
            <b>$${tutor.rate || "0"}/hr</b>
            <button class="btn full-width" onclick="viewProfile('${tutor.id}')">View Profile</button>
        `;
        grid.appendChild(card);
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        renderTutorDirectory(searchInput.value);
    }
}

function viewProfile(tutorId) {
    localStorage.setItem('viewingTutorId', tutorId);
    window.location.href = 'tutorProfile.html';
}

// Auto-run directory logic on load, checking for pending searches from Home
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('directory-grid')) {
        const pendingSearch = localStorage.getItem('pendingSearch');
        if (pendingSearch) {
            document.getElementById('search-input').value = pendingSearch;
            renderTutorDirectory(pendingSearch);
            localStorage.removeItem('pendingSearch'); // Clear it so it doesn't stick forever
        } else {
            renderTutorDirectory("");
        }
    }
});

/* MODULE 5: Profile Creation & Save Engine */
/* Description: Saves new educator data. Includes safety catch for 5MB memory limits. */
function finishEducatorRegistration() {
    const fileInput = document.getElementById('reg-pic-file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            saveNewEducatorData(event.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveNewEducatorData("");
    }
}

function saveNewEducatorData(imageData) {
    let tutorsDB = getSafeTutorsDB();
    const newTutor = {
        id: Date.now().toString(),
        email: localStorage.getItem('userEmail') || "unknown@email.com",
        name: document.getElementById('reg-name') ? document.getElementById('reg-name').value : "New Tutor",
        occupation: document.getElementById('reg-occupation') ? document.getElementById('reg-occupation').value : "",
        education: document.getElementById('reg-education') ? document.getElementById('reg-education').value : "",
        location: document.getElementById('reg-location') ? document.getElementById('reg-location').value : "",
        rate: document.getElementById('reg-rate') ? document.getElementById('reg-rate').value : "0",
        bio: document.getElementById('reg-bio') ? document.getElementById('reg-bio').value : "",
        subjects: typeof activeSubjects !== 'undefined' ? activeSubjects : [],
        profilePic: imageData
    };
    
    tutorsDB.push(newTutor);
    
    try {
        localStorage.setItem('tutorsDB', JSON.stringify(tutorsDB));
        localStorage.setItem('viewingTutorId', newTutor.id); // Cement the ID
        alert("Educator Profile Setup Complete!");
        window.location.href = 'tutorProfile.html';
    } catch (e) {
        alert("Save failed! The image file might be too large for local memory. Try again without a photo or use a smaller one.");
    }
}

/* MODULE 6: Tutor Profile Renderer */
/* Description: Populates the public profile page. */
function renderTutorProfile() {
    const nameElement = document.getElementById('profile-name');
    if (!nameElement) return; // Stop if not on profile page

    const viewedTutorId = localStorage.getItem('viewingTutorId');
    const tutorsDB = getSafeTutorsDB();
    const tutor = tutorsDB.find(t => t.id === viewedTutorId);

    if (tutor) {
        nameElement.innerText = tutor.name || "Name not provided";
        document.getElementById('profile-occupation').innerText = tutor.occupation || "Educator";
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        document.getElementById('profile-subject').innerText = normalizedSubjects.length > 0 ? normalizedSubjects.join(', ') : "General Studies";
        
        document.getElementById('profile-location').innerText = tutor.location || "Online";
        document.getElementById('profile-education').innerText = tutor.education || "Degree not listed";
        document.getElementById('profile-rate').innerText = "$" + (tutor.rate || "0") + " / hour";
        document.getElementById('profile-bio').innerText = tutor.bio || "No bio available.";

        const picDisplay = document.getElementById('profile-pic-display');
        const picPlaceholder = document.getElementById('profile-pic-placeholder');
        if (tutor.profilePic && tutor.profilePic.trim() !== "") {
            picDisplay.src = tutor.profilePic;
            picDisplay.style.display = 'block';
            picPlaceholder.style.display = 'none';
        } else {
            picDisplay.style.display = 'none';
            picPlaceholder.style.display = 'flex';
        }
    } else {
        nameElement.innerText = "Tutor Not Found";
        document.getElementById('profile-bio').innerText = "Data error. Please return to the directory.";
    }
}
document.addEventListener("DOMContentLoaded", renderTutorProfile);

/* MODULE 7: Tutor Request System */
function handleTutorRequest() {
    const currentUser = localStorage.getItem('userEmail');
    const viewedTutorId = localStorage.getItem('viewingTutorId');

    if (!currentUser) {
        alert("You must be logged in to request a tutor.");
        window.location.href = 'login.html';
        return;
    }

    if (viewedTutorId) {
        alert("Success! Request sent to the admin.");
    }
}

/* MODULE 8: Tutor Manager Logic */
/* Description: Auto loads settings for editing and saves modifications safely. */
function loadManagerProfile() {
    if (document.getElementById('manager-name')) {
        const tutorsDB = getSafeTutorsDB();
        const myProfile = tutorsDB.find(tutor => tutor.email === localStorage.getItem('userEmail'));
        if (myProfile) {
            document.getElementById('manager-name').value = myProfile.name || "";
            document.getElementById('manager-occupation').value = myProfile.occupation || "";
            document.getElementById('manager-education').value = myProfile.education || "";
            document.getElementById('manager-country').value = myProfile.country || "";
            document.getElementById('manager-public-location').value = myProfile.location || "";
            document.getElementById('manager-rate').value = myProfile.rate || "";
            document.getElementById('manager-bio').value = myProfile.bio || "";
            document.getElementById('manager-legal-name').value = myProfile.legalName || "";
            document.getElementById('manager-phone').value = myProfile.phone || "";
            document.getElementById('manager-street').value = myProfile.street || "";
            document.getElementById('manager-state').value = myProfile.state || "";
            document.getElementById('manager-zip').value = myProfile.zip || "";
            
            const normalizedSubjects = getNormalizedSubjects(myProfile);
            if (normalizedSubjects.length > 0) {
                activeSubjects = normalizedSubjects;
                renderTags();
            }
        }
    }
}
document.addEventListener("DOMContentLoaded", loadManagerProfile);

function saveManagerProfile() {
    const fileInput = document.getElementById('manager-pic-file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            finalizeSave(event.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        const tutorsDB = getSafeTutorsDB();
        const myProfile = tutorsDB.find(tutor => tutor.email === localStorage.getItem('userEmail'));
        finalizeSave(myProfile ? myProfile.profilePic : "");
    }
}

function finalizeSave(imageData) {
    let tutorsDB = getSafeTutorsDB();
    let profileIndex = tutorsDB.findIndex(tutor => tutor.email === localStorage.getItem('userEmail'));
    const updatedData = {
        id: profileIndex >= 0 ? tutorsDB[profileIndex].id : Date.now().toString(),
        email: localStorage.getItem('userEmail'),
        name: document.getElementById('manager-name').value,
        occupation: document.getElementById('manager-occupation').value,
        education: document.getElementById('manager-education').value,
        country: document.getElementById('manager-country').value,
        location: document.getElementById('manager-public-location').value,
        rate: document.getElementById('manager-rate').value,
        bio: document.getElementById('manager-bio').value,
        subjects: activeSubjects,
        profilePic: imageData,
        legalName: document.getElementById('manager-legal-name').value,
        phone: document.getElementById('manager-phone').value,
        street: document.getElementById('manager-street').value,
        state: document.getElementById('manager-state').value,
        zip: document.getElementById('manager-zip').value
    };
    if (profileIndex >= 0) {
        tutorsDB[profileIndex] = updatedData;
    } else {
        tutorsDB.push(updatedData);
    }
    localStorage.setItem('tutorsDB', JSON.stringify(tutorsDB));
    localStorage.setItem('viewingTutorId', updatedData.id);
    alert("Profile Saved! Redirecting to public view.");
    window.location.href = 'tutorProfile.html';
}

/* MODULE 9: Directory Search and Renderer */
/* Description: Filters tutors dynamically. Safely converts all data types to prevent crashing. */
function renderTutorDirectory(searchQuery = "") {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;
    const tutorsDB = getSafeTutorsDB();
    grid.innerHTML = "";
    
    const queryText = (typeof searchQuery === 'string' ? searchQuery : "").toLowerCase();
    
    const filteredTutors = tutorsDB.filter(tutor => {
        const matchesName = tutor.name && tutor.name.toLowerCase().includes(queryText);
        const matchesLocation = tutor.location && tutor.location.toLowerCase().includes(queryText);
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const matchesSubject = normalizedSubjects.some(sub => sub.toLowerCase().includes(queryText));
        
        return matchesName || matchesLocation || matchesSubject;
    });

    if (filteredTutors.length === 0) {
        grid.innerHTML = "<p>No tutors found matching your search.</p>";
        return;
    }

    filteredTutors.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'tutorCard';
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const mainSubject = normalizedSubjects.length > 0 ? normalizedSubjects[0] : "General";
        
        card.innerHTML = `
            ${tutor.profilePic ? '<img src="' + tutor.profilePic + '" class="card-profile-img">' : '<div class="card-profile-img" style="background:#ccc;"></div>'}
            <h3>${tutor.name || "Unnamed Tutor"}</h3>
            <p class="occupation-tag">${tutor.occupation || "Educator"}</p>
            <span class="tag">${mainSubject}</span>
            <p class="bio-snippet">${tutor.bio ? tutor.bio.substring(0, 60) + "..." : "No bio available."}</p>
            <b>$${tutor.rate || "0"}/hr</b>
            <button class="btn full-width" onclick="viewProfile('${tutor.id}')">View Profile</button>
        `;
        grid.appendChild(card);
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        renderTutorDirectory(searchInput.value);
    }
}

function viewProfile(tutorId) {
    localStorage.setItem('viewingTutorId', tutorId);
    window.location.href = 'tutorProfile.html';
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('directory-grid')) {
        renderTutorDirectory("");
    }
});

/* MODULE 10: Tutor Profile Renderer */
/* Description: Reads the saved ID and normalizes subject data before injecting into the profile page. */
function renderTutorProfile() {
    const nameElement = document.getElementById('profile-name');
    if (!nameElement) return;
    const viewedTutorId = localStorage.getItem('viewingTutorId');
    const tutorsDB = getSafeTutorsDB();
    const tutor = tutorsDB.find(t => t.id === viewedTutorId);

    if (tutor) {
        nameElement.innerText = tutor.name || "Name not provided";
        document.getElementById('profile-occupation').innerText = tutor.occupation || "Educator";
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const displaySubject = normalizedSubjects.length > 0 ? normalizedSubjects.join(', ') : "General Studies";
        document.getElementById('profile-subject').innerText = displaySubject;
        
        document.getElementById('profile-location').innerText = tutor.location || "Online";
        document.getElementById('profile-education').innerText = tutor.education || "Degree not listed";
        document.getElementById('profile-rate').innerText = "$" + (tutor.rate || "0") + " / hour";
        document.getElementById('profile-bio').innerText = tutor.bio || "This educator has not written a bio yet.";

        const picDisplay = document.getElementById('profile-pic-display');
        const picPlaceholder = document.getElementById('profile-pic-placeholder');
        if (tutor.profilePic) {
            picDisplay.src = tutor.profilePic;
            picDisplay.style.display = 'block';
            picPlaceholder.style.display = 'none';
        } else {
            picDisplay.style.display = 'none';
            picPlaceholder.style.display = 'flex';
        }
    } else {
        nameElement.innerText = "Tutor Not Found";
        document.getElementById('profile-bio').innerText = "Please return to the directory and select a valid profile.";
    }
}
document.addEventListener("DOMContentLoaded", renderTutorProfile);

/* MODULE 11: Tutor Request System */
/* Description: Manages the request button flow securely and redirects invalid requests. */
function handleTutorRequest() {
    const currentUser = localStorage.getItem('userEmail');
    const viewedTutorId = localStorage.getItem('viewingTutorId');

    if (!currentUser) {
        alert("You must be logged in to request a tutor. Redirecting to login.");
        window.location.href = 'login.html';
        return;
    }

    if (viewedTutorId) {
        const tutorsDB = getSafeTutorsDB();
        const tutor = tutorsDB.find(t => t.id === viewedTutorId);
        if (tutor) {
            const newRequest = {
                requestId: Date.now().toString(),
                studentEmail: currentUser,
                tutorId: tutor.id,
                tutorName: tutor.name,
                status: "Pending Admin Approval",
                dateRequested: new Date().toLocaleDateString()
            };
            let adminRequests = [];
            try {
                const parsed = JSON.parse(localStorage.getItem('adminRequests'));
                adminRequests = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                adminRequests = [];
            }
            adminRequests.push(newRequest);
            localStorage.setItem('adminRequests', JSON.stringify(adminRequests));
            alert("Success! Your request for " + tutor.name + " has been sent to the admin for review.");
        }
    } else {
        alert("Error: No tutor selected.");
    }
}

/* MODULE 3: Home Page Search Bridge */
/* Description: Grabs search from index.html and routes to directory.html. */
function executeHomeSearch() {
    const input = document.getElementById('home-search-input');
    if (input && input.value.trim() !== "") {
        localStorage.setItem('pendingSearch', input.value.trim());
        window.location.href = 'directory.html';
    } else {
        window.location.href = 'directory.html';
    }
}

/* MODULE 4: Directory Search and Renderer */
/* Description: Filters tutors and draws cards. Automatically catches searches coming from the home page. */
function renderTutorDirectory(searchQuery = "") {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;
    const tutorsDB = getSafeTutorsDB();
    grid.innerHTML = "";
    
    const queryText = (typeof searchQuery === 'string' ? searchQuery : "").toLowerCase();
    
    const filteredTutors = tutorsDB.filter(tutor => {
        const matchesName = tutor.name && tutor.name.toLowerCase().includes(queryText);
        const matchesLocation = tutor.location && tutor.location.toLowerCase().includes(queryText);
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const matchesSubject = normalizedSubjects.some(sub => sub.toLowerCase().includes(queryText));
        
        return matchesName || matchesLocation || matchesSubject;
    });

    if (filteredTutors.length === 0) {
        grid.innerHTML = "<p>No tutors found matching your search.</p>";
        return;
    }

    filteredTutors.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'tutorCard'; // Your original class
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const mainSubject = normalizedSubjects.length > 0 ? normalizedSubjects[0] : "General";
        
        card.innerHTML = `
            ${tutor.profilePic ? '<img src="' + tutor.profilePic + '" class="card-profile-img">' : '<div class="card-profile-img" style="background:#ccc;"></div>'}
            <h3>${tutor.name || "Unnamed Tutor"}</h3>
            <p class="occupation-tag">${tutor.occupation || "Educator"}</p>
            <span class="tag">${mainSubject}</span>
            <p class="bio-snippet">${tutor.bio ? tutor.bio.substring(0, 60) + "..." : "No bio available."}</p>
            <b>$${tutor.rate || "0"}/hr</b>
            <button class="btn full-width" onclick="viewProfile('${tutor.id}')">View Profile</button>
        `;
        grid.appendChild(card);
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        renderTutorDirectory(searchInput.value);
    }
}

function viewProfile(tutorId) {
    localStorage.setItem('viewingTutorId', tutorId);
    window.location.href = 'tutorProfile.html';
}

// Auto-run directory logic on load, checking for pending searches from Home
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('directory-grid')) {
        const pendingSearch = localStorage.getItem('pendingSearch');
        if (pendingSearch) {
            document.getElementById('search-input').value = pendingSearch;
            renderTutorDirectory(pendingSearch);
            localStorage.removeItem('pendingSearch'); // Clear it so it doesn't stick forever
        } else {
            renderTutorDirectory("");
        }
    }
});

/* MODULE 5: Profile Creation & Save Engine */
/* Description: Saves new educator data. Includes safety catch for 5MB memory limits. */
function finishEducatorRegistration() {
    const fileInput = document.getElementById('reg-pic-file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            saveNewEducatorData(event.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        saveNewEducatorData("");
    }
}

function saveNewEducatorData(imageData) {
    let tutorsDB = getSafeTutorsDB();
    const newTutor = {
        id: Date.now().toString(),
        email: localStorage.getItem('userEmail') || "unknown@email.com",
        name: document.getElementById('reg-name') ? document.getElementById('reg-name').value : "New Tutor",
        occupation: document.getElementById('reg-occupation') ? document.getElementById('reg-occupation').value : "",
        education: document.getElementById('reg-education') ? document.getElementById('reg-education').value : "",
        location: document.getElementById('reg-location') ? document.getElementById('reg-location').value : "",
        rate: document.getElementById('reg-rate') ? document.getElementById('reg-rate').value : "0",
        bio: document.getElementById('reg-bio') ? document.getElementById('reg-bio').value : "",
        subjects: typeof activeSubjects !== 'undefined' ? activeSubjects : [],
        profilePic: imageData
    };
    
    tutorsDB.push(newTutor);
    
    try {
        localStorage.setItem('tutorsDB', JSON.stringify(tutorsDB));
        localStorage.setItem('viewingTutorId', newTutor.id); // Cement the ID
        alert("Educator Profile Setup Complete!");
        window.location.href = 'tutorProfile.html';
    } catch (e) {
        alert("Save failed! The image file might be too large for local memory. Try again without a photo or use a smaller one.");
    }
}

/* MODULE 6: Tutor Profile Renderer */
/* Description: Populates the public profile page. */
function renderTutorProfile() {
    const nameElement = document.getElementById('profile-name');
    if (!nameElement) return; // Stop if not on profile page

    const viewedTutorId = localStorage.getItem('viewingTutorId');
    const tutorsDB = getSafeTutorsDB();
    const tutor = tutorsDB.find(t => t.id === viewedTutorId);

    if (tutor) {
        nameElement.innerText = tutor.name || "Name not provided";
        document.getElementById('profile-occupation').innerText = tutor.occupation || "Educator";
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        document.getElementById('profile-subject').innerText = normalizedSubjects.length > 0 ? normalizedSubjects.join(', ') : "General Studies";
        
        document.getElementById('profile-location').innerText = tutor.location || "Online";
        document.getElementById('profile-education').innerText = tutor.education || "Degree not listed";
        document.getElementById('profile-rate').innerText = "$" + (tutor.rate || "0") + " / hour";
        document.getElementById('profile-bio').innerText = tutor.bio || "No bio available.";

        const picDisplay = document.getElementById('profile-pic-display');
        const picPlaceholder = document.getElementById('profile-pic-placeholder');
        if (tutor.profilePic && tutor.profilePic.trim() !== "") {
            picDisplay.src = tutor.profilePic;
            picDisplay.style.display = 'block';
            picPlaceholder.style.display = 'none';
        } else {
            picDisplay.style.display = 'none';
            picPlaceholder.style.display = 'flex';
        }
    } else {
        nameElement.innerText = "Tutor Not Found";
        document.getElementById('profile-bio').innerText = "Data error. Please return to the directory.";
    }
}
document.addEventListener("DOMContentLoaded", renderTutorProfile);

/* MODULE 7: Tutor Request System */
function handleTutorRequest() {
    const currentUser = localStorage.getItem('userEmail');
    const viewedTutorId = localStorage.getItem('viewingTutorId');

    if (!currentUser) {
        alert("You must be logged in to request a tutor.");
        window.location.href = 'login.html';
        return;
    }

    if (viewedTutorId) {
        alert("Success! Request sent to the admin.");
    }
}

/* MODULE 8: Tutor Manager Logic */
/* Description: Auto loads settings for editing and saves modifications safely. */
function loadManagerProfile() {
    if (document.getElementById('manager-name')) {
        const tutorsDB = getSafeTutorsDB();
        const myProfile = tutorsDB.find(tutor => tutor.email === localStorage.getItem('userEmail'));
        if (myProfile) {
            document.getElementById('manager-name').value = myProfile.name || "";
            document.getElementById('manager-occupation').value = myProfile.occupation || "";
            document.getElementById('manager-education').value = myProfile.education || "";
            document.getElementById('manager-country').value = myProfile.country || "";
            document.getElementById('manager-public-location').value = myProfile.location || "";
            document.getElementById('manager-rate').value = myProfile.rate || "";
            document.getElementById('manager-bio').value = myProfile.bio || "";
            document.getElementById('manager-legal-name').value = myProfile.legalName || "";
            document.getElementById('manager-phone').value = myProfile.phone || "";
            document.getElementById('manager-street').value = myProfile.street || "";
            document.getElementById('manager-state').value = myProfile.state || "";
            document.getElementById('manager-zip').value = myProfile.zip || "";
            
            const normalizedSubjects = getNormalizedSubjects(myProfile);
            if (normalizedSubjects.length > 0) {
                activeSubjects = normalizedSubjects;
                renderTags();
            }
        }
    }
}
document.addEventListener("DOMContentLoaded", loadManagerProfile);

function saveManagerProfile() {
    const fileInput = document.getElementById('manager-pic-file');
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            finalizeSave(event.target.result);
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        const tutorsDB = getSafeTutorsDB();
        const myProfile = tutorsDB.find(tutor => tutor.email === localStorage.getItem('userEmail'));
        finalizeSave(myProfile ? myProfile.profilePic : "");
    }
}

function finalizeSave(imageData) {
    let tutorsDB = getSafeTutorsDB();
    let profileIndex = tutorsDB.findIndex(tutor => tutor.email === localStorage.getItem('userEmail'));
    const updatedData = {
        id: profileIndex >= 0 ? tutorsDB[profileIndex].id : Date.now().toString(),
        email: localStorage.getItem('userEmail'),
        name: document.getElementById('manager-name').value,
        occupation: document.getElementById('manager-occupation').value,
        education: document.getElementById('manager-education').value,
        country: document.getElementById('manager-country').value,
        location: document.getElementById('manager-public-location').value,
        rate: document.getElementById('manager-rate').value,
        bio: document.getElementById('manager-bio').value,
        subjects: activeSubjects,
        profilePic: imageData,
        legalName: document.getElementById('manager-legal-name').value,
        phone: document.getElementById('manager-phone').value,
        street: document.getElementById('manager-street').value,
        state: document.getElementById('manager-state').value,
        zip: document.getElementById('manager-zip').value
    };
    if (profileIndex >= 0) {
        tutorsDB[profileIndex] = updatedData;
    } else {
        tutorsDB.push(updatedData);
    }
    localStorage.setItem('tutorsDB', JSON.stringify(tutorsDB));
    localStorage.setItem('viewingTutorId', updatedData.id);
    alert("Profile Saved! Redirecting to public view.");
    window.location.href = 'tutorProfile.html';
}

/* MODULE 9: Directory Search and Renderer */
/* Description: Filters tutors dynamically. Safely converts all data types to prevent crashing. */
function renderTutorDirectory(searchQuery = "") {
    const grid = document.getElementById('directory-grid');
    if (!grid) return;
    const tutorsDB = getSafeTutorsDB();
    grid.innerHTML = "";
    
    const queryText = (typeof searchQuery === 'string' ? searchQuery : "").toLowerCase();
    
    const filteredTutors = tutorsDB.filter(tutor => {
        const matchesName = tutor.name && tutor.name.toLowerCase().includes(queryText);
        const matchesLocation = tutor.location && tutor.location.toLowerCase().includes(queryText);
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const matchesSubject = normalizedSubjects.some(sub => sub.toLowerCase().includes(queryText));
        
        return matchesName || matchesLocation || matchesSubject;
    });

    if (filteredTutors.length === 0) {
        grid.innerHTML = "<p>No tutors found matching your search.</p>";
        return;
    }

    filteredTutors.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'tutorCard';
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const mainSubject = normalizedSubjects.length > 0 ? normalizedSubjects[0] : "General";
        
        card.innerHTML = `
            ${tutor.profilePic ? '<img src="' + tutor.profilePic + '" class="card-profile-img">' : '<div class="card-profile-img" style="background:#ccc;"></div>'}
            <h3>${tutor.name || "Unnamed Tutor"}</h3>
            <p class="occupation-tag">${tutor.occupation || "Educator"}</p>
            <span class="tag">${mainSubject}</span>
            <p class="bio-snippet">${tutor.bio ? tutor.bio.substring(0, 60) + "..." : "No bio available."}</p>
            <b>$${tutor.rate || "0"}/hr</b>
            <button class="btn full-width" onclick="viewProfile('${tutor.id}')">View Profile</button>
        `;
        grid.appendChild(card);
    });
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        renderTutorDirectory(searchInput.value);
    }
}

function viewProfile(tutorId) {
    localStorage.setItem('viewingTutorId', tutorId);
    window.location.href = 'tutorProfile.html';
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('directory-grid')) {
        renderTutorDirectory("");
    }
});

/* MODULE 10: Tutor Profile Renderer */
/* Description: Reads the saved ID and normalizes subject data before injecting into the profile page. */
function renderTutorProfile() {
    const nameElement = document.getElementById('profile-name');
    if (!nameElement) return;
    const viewedTutorId = localStorage.getItem('viewingTutorId');
    const tutorsDB = getSafeTutorsDB();
    const tutor = tutorsDB.find(t => t.id === viewedTutorId);

    if (tutor) {
        nameElement.innerText = tutor.name || "Name not provided";
        document.getElementById('profile-occupation').innerText = tutor.occupation || "Educator";
        
        const normalizedSubjects = getNormalizedSubjects(tutor);
        const displaySubject = normalizedSubjects.length > 0 ? normalizedSubjects.join(', ') : "General Studies";
        document.getElementById('profile-subject').innerText = displaySubject;
        
        document.getElementById('profile-location').innerText = tutor.location || "Online";
        document.getElementById('profile-education').innerText = tutor.education || "Degree not listed";
        document.getElementById('profile-rate').innerText = "$" + (tutor.rate || "0") + " / hour";
        document.getElementById('profile-bio').innerText = tutor.bio || "This educator has not written a bio yet.";

        const picDisplay = document.getElementById('profile-pic-display');
        const picPlaceholder = document.getElementById('profile-pic-placeholder');
        if (tutor.profilePic) {
            picDisplay.src = tutor.profilePic;
            picDisplay.style.display = 'block';
            picPlaceholder.style.display = 'none';
        } else {
            picDisplay.style.display = 'none';
            picPlaceholder.style.display = 'flex';
        }
    } else {
        nameElement.innerText = "Tutor Not Found";
        document.getElementById('profile-bio').innerText = "Please return to the directory and select a valid profile.";
    }
}
document.addEventListener("DOMContentLoaded", renderTutorProfile);

/* MODULE 11: Tutor Request System */
/* Description: Manages the request button flow securely and redirects invalid requests. */
function handleTutorRequest() {
    const currentUser = localStorage.getItem('userEmail');
    const viewedTutorId = localStorage.getItem('viewingTutorId');

    if (!currentUser) {
        alert("You must be logged in to request a tutor. Redirecting to login.");
        window.location.href = 'login.html';
        return;
    }

    if (viewedTutorId) {
        const tutorsDB = getSafeTutorsDB();
        const tutor = tutorsDB.find(t => t.id === viewedTutorId);
        if (tutor) {
            const newRequest = {
                requestId: Date.now().toString(),
                studentEmail: currentUser,
                tutorId: tutor.id,
                tutorName: tutor.name,
                status: "Pending Admin Approval",
                dateRequested: new Date().toLocaleDateString()
            };
            let adminRequests = [];
            try {
                const parsed = JSON.parse(localStorage.getItem('adminRequests'));
                adminRequests = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                adminRequests = [];
            }
            adminRequests.push(newRequest);
            localStorage.setItem('adminRequests', JSON.stringify(adminRequests));
            alert("Success! Your request for " + tutor.name + " has been sent to the admin for review.");
        }
    } else {
        alert("Error: No tutor selected.");
    }
}
