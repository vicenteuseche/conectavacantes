/**
 * ConectaVacantes - Frontend JavaScript Completo
 * Funcionalidad para los 4 pasos: Perfil, Vacantes, Dashboard, Seguimiento
 * FLUJO OBLIGATORIO: Login -> Perfil -> Vacantes -> Dashboard -> Seguimiento
 */

// Estado global de la aplicación
let appState = {
    user: null,
    token: null,
    cvData: null,
    profile: null,
    jobs: [],
    applications: [],
    chart: null,
    evaluatedVacancies: [],
    matchedVacancies: [],
    isFirstVisit: true
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Detectar tema del sistema
    const theme = localStorage.getItem('theme');
    if (theme === 'system' || !theme) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.classList.add(theme);
    }
    
    // Verificar si hay sesión guardada
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
        appState.token = savedToken;
        appState.user = JSON.parse(savedUser);
        appState.isFirstVisit = false;
        updateAuthUI();
        // Si ya está autenticado, mostrar la sección de perfil
        showSection('perfil');
    } else {
        // PRIMER INGRESO: Mostrar welcome y forzar login
        showSection('welcome');
        // Auto-abrir el modal de autenticación
        setTimeout(function() {
            openAuthModal();
        }, 500);
    }
});

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('theme', 'light');
    } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

// API Helper
async function apiCall(endpoint, options = {}) {
    const response = await fetch(endpoint, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': appState.token ? `Bearer ${appState.token}` : '',
            ...options.headers
        }
    });
    return response.json();
}

// Modal Functions
function openDetailsModal() {
    document.getElementById('details-modal').classList.remove('hidden');
}

function closeDetailsModal() {
    document.getElementById('details-modal').classList.add('hidden');
}

function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

// Stats Detail Functions
async function showEvaluatedVacancies() {
    const titleEl = document.getElementById('details-modal-title');
    const contentEl = document.getElementById('details-modal-content');
    
    titleEl.textContent = 'Vacantes Evaluadas';
    contentEl.innerHTML = '<p class="text-muted-foreground">Cargando detalles...</p>';
    openDetailsModal();
    
    try {
        const result = await apiCall('/api/dashboard/evaluated');
        const vacancies = result.vacancies || getMockEvaluatedVacancies();
        
        contentEl.innerHTML = `
            <div class="space-y-4">
                <p class="text-muted-foreground mb-4">Total de vacantes evaluadas: <strong class="text-foreground">${vacancies.length}</strong></p>
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full bg-card rounded-lg border border-border">
                        <thead>
                            <tr class="border-b border-border">
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vacante</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Match</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Plataforma</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${vacancies.map((v, idx) => `
                                <tr class="border-b border-border">
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${idx + 1}</td>
                                    <td class="px-3 py-2 text-sm text-foreground">${v.title}</td>
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${v.company}</td>
                                    <td class="px-3 py-2">
                                        <span class="px-2 py-1 rounded-full text-xs ${v.matchScore > 55 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}">${v.matchScore}%</span>
                                    </td>
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${v.platform}</td>
                                    <td class="px-3 py-2">
                                        <a href="${v.url || `https://${v.platform.toLowerCase().replace(' ', '')}.com/jobs/${v.id}`}" target="_blank" class="px-2 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30">Ver vacante</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        contentEl.innerHTML = '<p class="text-muted-foreground">No se pudieron cargar los detalles</p>';
    }
}

async function showMatchedVacancies() {
    const titleEl = document.getElementById('details-modal-title');
    const contentEl = document.getElementById('details-modal-content');
    
    titleEl.textContent = 'Perfiles Emparejados';
    contentEl.innerHTML = '<p class="text-muted-foreground">Cargando detalles...</p>';
    openDetailsModal();
    
    try {
        const result = await apiCall('/api/dashboard/matched');
        const matched = result.vacancies || getMockMatchedVacancies();
        
        contentEl.innerHTML = `
            <div class="space-y-4">
                <p class="text-muted-foreground mb-4">Total de perfiles emparejados: <strong class="text-success">${matched.length}</strong></p>
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full bg-card rounded-lg border border-border">
                        <thead>
                            <tr class="border-b border-border">
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vacante</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Match</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Plataforma</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${matched.map((v, idx) => `
                                <tr class="border-b border-border">
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${idx + 1}</td>
                                    <td class="px-3 py-2 text-sm text-foreground">${v.title}</td>
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${v.company}</td>
                                    <td class="px-3 py-2">
                                        <span class="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-medium">${v.matchScore}%</span>
                                    </td>
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${v.platform}</td>
                                    <td class="px-3 py-2">
                                        <a href="${v.url || `https://${v.platform.toLowerCase().replace(' ', '')}.com/jobs/${v.id}`}" target="_blank" class="px-2 py-1 bg-success/20 text-success rounded text-xs hover:bg-success/30">Ver vacante</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        contentEl.innerHTML = '<p class="text-muted-foreground">No se pudieron cargar los detalles</p>';
    }
}

async function showSentApplications() {
    const titleEl = document.getElementById('details-modal-title');
    const contentEl = document.getElementById('details-modal-content');
    
    titleEl.textContent = 'Postulaciones Enviadas';
    contentEl.innerHTML = '<p class="text-muted-foreground">Cargando detalles...</p>';
    openDetailsModal();
    
    try {
        const result = await apiCall('/api/applications');
        const applications = result.applications || [];
        
        contentEl.innerHTML = `
            <div class="space-y-4">
                <p class="text-muted-foreground mb-4">Total de postulaciones: <strong class="text-amber-500">${applications.length}</strong></p>
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full bg-card rounded-lg border border-border">
                        <thead>
                            <tr class="border-b border-border">
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">#</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Vacante</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Empresa</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Match</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                                <th class="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${applications.map((app, idx) => `
                                <tr class="border-b border-border">
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${idx + 1}</td>
                                    <td class="px-3 py-2 text-sm text-foreground">${app.vacancyTitle || 'Vacante'}</td>
                                    <td class="px-3 py-2 text-sm text-muted-foreground">${app.company || 'Empresa'}</td>
                                    <td class="px-3 py-2">
                                        <span class="px-2 py-1 ${getStatusColor(app.status)} rounded-full text-xs">${app.matchScore || 0}%</span>
                                    </td>
                                    <td class="px-3 py-2">
                                        <span class="px-2 py-1 ${getStatusColor(app.status)} rounded-full text-xs">${getStatusText(app.status)}</span>
                                    </td>
                                    <td class="px-3 py-2">
                                        <div class="flex gap-1">
                                            <button onclick="updateAppStatus('${app.id}', 'read')" class="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs hover:bg-blue-500/30">Leído</button>
                                            <button onclick="updateAppStatus('${app.id}', 'rejected')" class="px-2 py-1 bg-danger/20 text-danger rounded text-xs hover:bg-danger/30">Rechazar</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (error) {
        contentEl.innerHTML = '<p class="text-muted-foreground">No se pudieron cargar los detalles</p>';
    }
}

// Mock data for demo
function getMockEvaluatedVacancies() {
    const platforms = ["We Work Remotely", "Remote.co", "Arc.dev"];
    const companies = ["NovaTech", "CloudForce", "DevTeams", "BlueBridge"];
    const titles = ["Senior React Developer", "Python Backend Engineer", "Full Stack Developer", "DevOps Specialist"];
    
    return Array.from({length: 10}, (_, i) => ({
        id: `eval_${i+1}`,
        title: titles[i % titles.length],
        company: companies[i % companies.length],
        platform: platforms[i % platforms.length],
        matchScore: Math.floor(Math.random() * 40) + 60,
        evaluatedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')
    }));
}

function getMockMatchedVacancies() {
    const platforms = ["We Work Remotely", "Remote.co", "Arc.dev"];
    const companies = ["NovaTech", "CloudForce", "DevTeams"];
    const titles = ["Senior React Developer", "Python Backend Engineer", "Full Stack Developer"];
    
    return Array.from({length: 5}, (_, i) => ({
        id: `match_${i+1}`,
        title: titles[i % titles.length],
        company: companies[i % companies.length],
        platform: platforms[i % platforms.length],
        matchScore: Math.floor(Math.random() * 20) + 70,
        matchedSkills: "React, Python, AWS"
    }));
}

function formatDate(dateString) {
    if (!dateString) return 'Fecha desconocida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Auth Functions
function toggleAuthMode() {
    const isRegister = document.getElementById('auth-title').textContent === 'Iniciar Sesión';
    if (isRegister) {
        document.getElementById('auth-title').textContent = 'Registrarse';
        document.getElementById('name-field').classList.remove('hidden');
        document.getElementById('toggle-auth-text').textContent = '¿Ya tienes cuenta? ';
    } else {
        document.getElementById('auth-title').textContent = 'Iniciar Sesión';
        document.getElementById('name-field').classList.add('hidden');
        document.getElementById('toggle-auth-text').textContent = '¿No tienes cuenta? ';
    }
}

async function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;
    const isRegister = document.getElementById('auth-title').textContent === 'Registrarse';
    
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { email, password, name } : { email, password };
    
    try {
        const result = await apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
        
        if (result.success || result.token) {
            appState.token = result.token;
            appState.user = result.user;
            appState.isFirstVisit = false;
            localStorage.setItem('token', appState.token);
            localStorage.setItem('user', JSON.stringify(appState.user));
            closeAuthModal();
            updateAuthUI();
            // Redirigir al Paso 1: Perfil después del login exitoso
            showSection('perfil');
        } else {
            alert(result.error || 'Error de autenticación');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

async function handleGoogleAuth() {
    const width = 500;
    const height = 600;
    const left = (screen.width / 2) - (width / 2);
    const top = (screen.height / 2) - (height / 2);
    
    const authWindow = window.open(
        '/oauth/google-provider',
        'google-auth',
        `width=${width},height=${height},top=${top},left=${left}`
    );
    
    window.addEventListener('message', function handler(event) {
        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
            window.removeEventListener('message', handler);
            authWindow.close();
            appState.token = 'oauth-' + Date.now();
            appState.user = event.data.profile;
            appState.isFirstVisit = false;
            localStorage.setItem('token', appState.token);
            localStorage.setItem('user', JSON.stringify(appState.user));
            updateAuthUI();
            // Redirigir al Paso 1: Perfil después del login exitoso
            showSection('perfil');
        }
    });
}

function logout() {
    appState.token = null;
    appState.user = null;
    appState.isFirstVisit = true;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    // Volver a la pantalla de bienvenida
    showSection('welcome');
}

function updateAuthUI() {
    if (appState.user) {
        document.getElementById('nav-auth').classList.add('hidden');
        document.getElementById('user-menu').classList.remove('hidden');
        document.getElementById('nav-dashboard').classList.remove('hidden');
        document.getElementById('nav-vacantes').classList.remove('hidden');
        document.getElementById('nav-seguimiento').classList.remove('hidden');
        document.getElementById('nav-perfil').classList.remove('hidden');
        document.getElementById('user-name').textContent = appState.user.name || appState.user.email;
    } else {
        document.getElementById('nav-auth').classList.remove('hidden');
        document.getElementById('user-menu').classList.add('hidden');
        document.getElementById('nav-dashboard').classList.add('hidden');
        document.getElementById('nav-vacantes').classList.add('hidden');
        document.getElementById('nav-seguimiento').classList.add('hidden');
        document.getElementById('nav-perfil').classList.add('hidden');
    }
}

// Section Navigation - PROTEGIDA POR AUTENTICACIÓN
function showSection(sectionId) {
    // Verificar autenticación obligatoria para secciones protegidas
    if (!appState.user && sectionId !== 'welcome') {
        openAuthModal();
        return;
    }
    
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Mostrar la sección seleccionada
    document.getElementById(sectionId).classList.remove('hidden');
    
    // Actualizar navegación
    document.querySelectorAll('nav a').forEach(link => {
        link.classList.remove('text-primary');
    });
    
    // Si es welcome, resaltar el enlace de inicio
    if (sectionId === 'welcome') {
        document.getElementById('nav-welcome').classList.add('text-primary');
    }
    
    // Cargar datos específicos de cada sección
    if (sectionId === 'dashboard') {
        loadDashboardStats();
        loadApplications();
    } else if (sectionId === 'seguimiento') {
        loadAIRecommendations();
        loadRecommendedCourses();
    }
}

// Paso 1: CV Upload and Profile
async function handleCVUpload(event) {
    // Verificar autenticación
    if (!appState.user) {
        openAuthModal();
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result.split(',')[1];
        
        try {
            const result = await apiCall('/api/parse-cv', {
                method: 'POST',
                body: JSON.stringify({ cv: { base64, filename: file.name } })
            });
            
            if (result.error) {
                alert('Error al procesar el CV: ' + result.error);
                return;
            }
            
            appState.cvData = result;
            displayCVPreview(result);
            
            // Autocompletar formulario de perfil
            if (result.name) document.getElementById('profile-name').value = result.name;
            if (result.phone) document.getElementById('profile-phone').value = result.phone;
            // profile-email no existe en el HTML - saltado
            if (result.address) document.getElementById('profile-address').value = result.address;
            if (result.skills && result.skills.length > 0) {
                document.getElementById('profile-skills').value = result.skills.join(', ');
            }
        } catch (error) {
            alert('Error al procesar el CV');
        }
    };
    reader.readAsDataURL(file);
}

function displayCVPreview(data) {
    const preview = document.getElementById('cv-preview');
    const content = document.getElementById('cv-data-preview');
    
    preview.classList.remove('hidden');
    content.innerHTML = `
        <p><strong>Nombre:</strong> ${data.name || 'No detectado'}</p>
        <p><strong>Teléfono:</strong> ${data.phone || 'No detectado'}</p>
        <p><strong>Email:</strong> ${data.email || 'No detectado'}</p>
        <p><strong>Dirección:</strong> ${data.address || 'No detectada'}</p>
        <p><strong>Habilidades:</strong> ${data.skills && data.skills.length > 0 ? data.skills.join(', ') : 'No detectadas'}</p>
    `;
}

async function saveProfile(event) {
    // Verificar autenticación
    if (!appState.user) {
        openAuthModal();
        return;
    }
    
    event.preventDefault();
    
    appState.profile = {
        name: document.getElementById('profile-name').value,
        phone: document.getElementById('profile-phone').value,
        address: document.getElementById('profile-address').value,
        skills: document.getElementById('profile-skills').value.split(',').map(s => s.trim()),
        region: document.getElementById('profile-region').value,
        languages: ['es', 'en']
    };
    
    localStorage.setItem('profile', JSON.stringify(appState.profile));
    alert('Perfil guardado exitosamente');
    // Ir al Paso 2: Vacantes
    showSection('vacantes');
}

// Paso 2: Job Search
async function searchJobs() {
    // Verificar autenticación
    if (!appState.user) {
        openAuthModal();
        return;
    }
    
    const query = appState.profile?.skills?.join(',') || 'developer';
    const regions = [appState.profile?.region || 'global'];
    
    try {
        const result = await apiCall('/api/match-vacancies', {
            method: 'POST',
            body: JSON.stringify({
                profileKeywords: query,
                allowedRegions: regions,
                query: query
            })
        });
        
        if (result.vacancies) {
            appState.jobs = result.vacancies;
            renderJobs(result.vacancies);
        }
    } catch (error) {
        console.error('Error searching jobs:', error);
    }
}

function renderJobs(jobs) {
    const highMatchTbody = document.getElementById('high-match-jobs');
    const lowMatchTbody = document.getElementById('low-match-jobs');
    
    // Vacantes con match > 55%
    const highMatchJobs = jobs.filter(job => (job.matchScore || 70) > 55);
    highMatchTbody.innerHTML = highMatchJobs.map(job => `
        <tr class="border-b border-border">
            <td class="px-4 py-3 text-foreground">${job.title}</td>
            <td class="px-4 py-3 text-muted-foreground">${job.company}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-medium">${job.matchScore || 70}% match</span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">${job.platform || job.sourceApi}</td>
            <td class="px-4 py-3">
                ${job.recruiterEmail ? 
                    `<button onclick="applyToJob('${job.id}', true)" class="px-3 py-1 bg-success text-white rounded text-xs">Postulación Automática Enviada</button>` :
                    `<a href="${job.url}" target="_blank" class="px-3 py-1 bg-muted text-foreground rounded text-xs hover:bg-muted/80">Ver Vacante</a>`
                }
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No hay vacantes compatibles</td></tr>';
    
    // Vacantes con match <= 55%
    const lowMatchJobs = jobs.filter(job => (job.matchScore || 40) <= 55);
    lowMatchTbody.innerHTML = lowMatchJobs.map(job => `
        <tr class="border-b border-border">
            <td class="px-4 py-3 text-foreground">${job.title}</td>
            <td class="px-4 py-3 text-muted-foreground">${job.company}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 bg-warning/20 text-warning rounded-full text-xs font-medium">${job.matchScore || 40}% match</span>
            </td>
            <td class="px-4 py-3 text-muted-foreground">${job.platform || job.sourceApi}</td>
            <td class="px-4 py-3">
                ${job.recruiterEmail ? 
                    `<button onclick="applyToJob('${job.id}', false)" class="px-3 py-1 bg-primary text-primary-foreground rounded text-xs">Enviar Postulación</button>` :
                    `<a href="${job.url}" target="_blank" class="px-3 py-1 bg-muted text-foreground rounded text-xs hover:bg-muted/80">Ver Vacante</a>`
                }
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="px-4 py-8 text-center text-muted-foreground">No hay otras vacantes</td></tr>';
}

async function applyToJob(jobId, autoSend = false) {
    // Verificar autenticación
    if (!appState.user) {
        openAuthModal();
        return;
    }
    
    const job = appState.jobs.find(j => j.id === jobId);
    if (!job) return;
    
    try {
        const result = await apiCall('/api/applications', {
            method: 'POST',
            body: JSON.stringify({
                vacancy: job,
                cv: appState.cvData
            })
        });
        
        alert(autoSend ? '¡Postulación enviada automáticamente!' : 'Postulación enviada');
        loadApplications();
    } catch (error) {
        alert('Error al postularse');
    }
}

// Paso 3: Dashboard
async function loadDashboardStats() {
    try {
        const stats = await apiCall('/api/dashboard/stats');
        
        document.getElementById('stat-evaluated').textContent = stats.vacanciesEvaluated || 0;
        document.getElementById('stat-matched').textContent = stats.vacanciesMatched || 0;
        document.getElementById('stat-sent').textContent = stats.applicationsSent || 0;
        
        // Actualizar estatus
        document.getElementById('status-sent').textContent = appState.applications.filter(a => a.status === 'sent').length;
        document.getElementById('status-read').textContent = appState.applications.filter(a => a.status === 'read').length;
        document.getElementById('status-no-response').textContent = appState.applications.filter(a => a.status === 'pending').length;
        document.getElementById('status-rejected').textContent = appState.applications.filter(a => a.status === 'rejected').length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadApplications() {
    try {
        const result = await apiCall('/api/applications');
        appState.applications = result.applications || [];
        
        // Actualizar dashboard
        document.getElementById('status-sent').textContent = appState.applications.filter(a => a.status === 'sent').length;
        document.getElementById('status-read').textContent = appState.applications.filter(a => a.status === 'read').length;
        document.getElementById('status-no-response').textContent = appState.applications.filter(a => a.status === 'pending').length;
        document.getElementById('status-rejected').textContent = appState.applications.filter(a => a.status === 'rejected').length;
        
        // Postulaciones recientes
        const recentContainer = document.getElementById('recent-applications');
        recentContainer.innerHTML = appState.applications.slice(-5).reverse().map(app => `
            <div class="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                    <h4 class="font-medium text-foreground">${app.vacancyTitle || 'Vacante'}</h4>
                    <p class="text-sm text-muted-foreground">${app.company || 'Empresa'}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(app.status)}">${getStatusText(app.status)}</span>
                    <button onclick="updateAppStatus('${app.id}', 'read')" class="text-xs text-primary hover:underline">Marcar Leído</button>
                    <button onclick="deleteApplication('${app.id}')" class="text-xs text-danger hover:underline">Eliminar</button>
                </div>
            </div>
        `).join('') || '<p class="text-center text-muted-foreground py-8">No hay postulaciones recientes</p>';
        
        // Cargar gráfico
        loadChart();
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

function getStatusColor(status) {
    const colors = {
        sent: 'bg-success/20 text-success',
        read: 'bg-blue-500/20 text-blue-500',
        pending: 'bg-warning/20 text-warning',
        rejected: 'bg-danger/20 text-danger'
    };
    return colors[status] || 'bg-muted/20 text-muted-foreground';
}

function getStatusText(status) {
    const texts = {
        sent: 'Enviado',
        read: 'Leído',
        pending: 'Sin respuesta',
        rejected: 'Rechazado'
    };
    return texts[status] || status;
}

async function updateAppStatus(appId, status) {
    try {
        await apiCall(`/api/applications/${appId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        loadApplications();
        // Recargar el modal si está abierto
        if (!document.getElementById('details-modal').classList.contains('hidden')) {
            showSentApplications();
        }
    } catch (error) {
        alert('Error al actualizar estado');
    }
}

async function deleteApplication(appId) {
    // Por simplicidad, filtramos localmente
    appState.applications = appState.applications.filter(a => a.id !== appId);
    loadApplications();
}

async function loadChart() {
    try {
        const chartData = await apiCall('/api/dashboard/chart');
        
        const ctx = document.getElementById('jobsChart').getContext('2d');
        
        if (appState.chart) {
            appState.chart.destroy();
        }
        
        appState.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: chartData.datasets || [{
                    label: 'Postulaciones enviadas',
                    data: [12, 19, 8, 15, 22, 18],
                    backgroundColor: 'rgba(99, 102, 241, 0.5)',
                    borderColor: '#6366f1',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        labels: { color: '#fff' }
                    }
                },
                scales: {
                    y: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        ticks: { color: '#9ca3af' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading chart:', error);
    }
}

// Paso 4: AI Recommendations and Courses
async function loadAIRecommendations() {
    // Verificar autenticación
    if (!appState.user) {
        document.getElementById('ai-recommendations').innerHTML = '<p class="text-muted-foreground">Debes iniciar sesión para ver las recomendaciones</p>';
        return;
    }
    
    const container = document.getElementById('ai-recommendations');
    
    if (!appState.cvData && !appState.profile) {
        container.innerHTML = '<p class="text-muted-foreground">Completa tu perfil para recibir recomendaciones personalizadas</p>';
        return;
    }
    
    container.innerHTML = '<p class="text-muted-foreground">Generando recomendaciones...</p>';
    
    try {
        const profileSkills = appState.profile?.skills?.join(', ') || appState.cvData?.skills?.join(', ') || '';
        
        // Simular recomendaciones basadas en skills faltantes
        const recommendations = generateSkillRecommendations(profileSkills);
        
        container.innerHTML = recommendations.map(rec => `
            <div class="p-4 bg-muted/30 rounded-lg">
                <h4 class="font-medium text-foreground mb-1">${rec.title}</h4>
                <p class="text-sm text-muted-foreground">${rec.description}</p>
                ${rec.link ? `<a href="${rec.link}" target="_blank" class="text-xs text-primary hover:underline mt-2 inline-block">Ver recurso</a>` : ''}
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="text-muted-foreground">No se pudieron cargar las recomendaciones</p>';
    }
}

function generateSkillRecommendations(skills) {
    const skillList = skills.toLowerCase().split(',').map(s => s.trim());
    const recommendations = [];
    
    if (!skillList.includes('aws') && !skillList.includes('cloud')) {
        recommendations.push({
            title: 'Aprende Cloud Computing',
            description: 'Las empresas buscan candidatos con conocimientos en AWS, Azure o GCP',
            link: 'https://aws.amazon.com/training/'
        });
    }
    
    if (!skillList.includes('docker') && !skillList.includes('kubernetes')) {
        recommendations.push({
            title: 'Contenedores y DevOps',
            description: 'Docker y Kubernetes son habilidades muy demandadas en trabajos remotos',
            link: 'https://www.docker.com/101-tutorial'
        });
    }
    
    if (!skillList.includes('react') && !skillList.includes('vue') && !skillList.includes('angular')) {
        recommendations.push({
            title: 'Frameworks Frontend',
            description: 'Considera aprender React, Vue o Angular para mayor compatibilidad',
            link: 'https://react.dev/learn'
        });
    }
    
    if (recommendations.length === 0) {
        recommendations.push({
            title: '¡Tu perfil está completo!',
            description: 'Tus habilidades están alineadas con el mercado laboral actual'
        });
    }
    
    return recommendations;
}

async function loadRecommendedCourses() {
    // Verificar autenticación
    if (!appState.user) {
        document.getElementById('recommended-courses').innerHTML = '<p class="text-muted-foreground">Debes iniciar sesión para ver los cursos</p>';
        return;
    }
    
    const container = document.getElementById('recommended-courses');
    
    if (!appState.profile?.skills && !appState.cvData?.skills) {
        container.innerHTML = '<p class="text-muted-foreground">Los cursos aparecerán según tus habilidades</p>';
        return;
    }
    
    container.innerHTML = '<p class="text-muted-foreground">Cargando cursos...</p>';
    
    try {
        const skills = appState.profile?.skills || appState.cvData?.skills || [];
        const result = await apiCall(`/api/courses?skills=${skills.join(',')}`);
        
        const courses = result.courses || getFallbackCourses(skills);
        
        container.innerHTML = courses.map(course => `
            <div class="p-4 bg-muted/30 rounded-lg">
                <h4 class="font-medium text-foreground mb-1">${course.title}</h4>
                <p class="text-xs text-muted-foreground mb-2">${course.platform} - ${course.duration}</p>
                <a href="${course.url}" target="_blank" class="text-xs text-success hover:underline">Ver curso gratuito</a>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="text-muted-foreground">No se pudieron cargar los cursos</p>';
    }
}

function getFallbackCourses(skills) {
    const courseMap = {
        python: [{ title: 'Python for Everybody', platform: 'Coursera (Audit)', url: 'https://www.coursera.org/specializations/python', duration: '4 meses' }],
        javascript: [{ title: 'JavaScript Algorithms', platform: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/javascript-algorithms/', duration: '300 horas' }],
        react: [{ title: 'React Basics', platform: 'Coursera (Audit)', url: 'https://www.coursera.org/learn/react-basics', duration: '25 horas' }],
        aws: [{ title: 'AWS Cloud Practitioner', platform: 'AWS Training', url: 'https://aws.amazon.com/training/', duration: '60 horas' }]
    };
    
    let courses = [];
    skills.forEach(skill => {
        if (courseMap[skill.toLowerCase()]) {
            courses.push(...courseMap[skill.toLowerCase()]);
        }
    });
    
    if (courses.length === 0) {
        courses = [
            { title: 'Git & GitHub Crash Course', platform: 'Udemy (Free)', url: 'https://www.udemy.com/course/git-and-github-crash-course/', duration: '2 horas' },
            { title: 'Remote Work Skills', platform: 'Coursera (Audit)', url: 'https://www.coursera.org/learn/remote-work', duration: '10 horas' }
        ];
    }
    
    return courses;
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        toggleTheme, 
        openAuthModal, 
        showSection, 
        searchJobs,
        applyToJob 
    };
}