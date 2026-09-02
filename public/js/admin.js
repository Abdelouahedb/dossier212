/**
 * DOSSIER 212 - Admin Panel JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initMarkdownPreview();
    initDynamicPersons();
    initDynamicTimeline();
    initImageUpload();
    initConfirmDelete();
    initFormValidation();
});

/**
 * Tab Navigation
 */
function initTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.admin-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to target
            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

/**
 * Markdown Preview
 * Uses a basic client-side renderer for demonstration.
 * In production, this should ideally call a backend endpoint.
 */
function initMarkdownPreview() {
    const inputs = document.querySelectorAll('.md-editor-input');
    
    inputs.forEach(input => {
        const previewId = input.getAttribute('data-preview');
        const previewEl = document.getElementById(previewId);
        
        if (!previewEl) return;

        // Simple debounce
        let timeout;
        input.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                // Extremely basic MD rendering for preview purposes
                let text = input.value;
                text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>')
                           .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                           .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                           .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                           .replace(/\*(.*)\*/gim, '<em>$1</em>')
                           .replace(/\n\n/gim, '</p><p>');
                
                previewEl.innerHTML = `<p>${text}</p>`;
            }, 300);
        });
    });
}

/**
 * Dynamic Persons Manager
 */
function initDynamicPersons() {
    const container = document.getElementById('personnes-container');
    const btnAdd = document.getElementById('btn-add-personne');
    const hiddenInput = document.getElementById('personnes-json');
    
    if (!container || !btnAdd || !hiddenInput) return;

    let persons = [];
    try {
        persons = JSON.parse(hiddenInput.value || '[]');
    } catch (e) {
        persons = [];
    }

    const render = () => {
        container.innerHTML = '';
        persons.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = 'admin-card form-row';
            item.innerHTML = `
                <div>
                    <div class="form-group">
                        <label>Nom</label>
                        <input type="text" value="${p.nom || ''}" data-index="${index}" data-field="nom" class="person-input">
                    </div>
                    <div class="form-group">
                        <label>Rôle</label>
                        <select data-index="${index}" data-field="role" class="person-input">
                            <option value="victime" ${p.role === 'victime' ? 'selected' : ''}>Victime</option>
                            <option value="suspect" ${p.role === 'suspect' ? 'selected' : ''}>Suspect</option>
                            <option value="temoin" ${p.role === 'temoin' ? 'selected' : ''}>Témoin</option>
                            <option value="enqueteur" ${p.role === 'enqueteur' ? 'selected' : ''}>Enquêteur</option>
                            <option value="autre" ${p.role === 'autre' ? 'selected' : ''}>Autre</option>
                        </select>
                    </div>
                </div>
                <div>
                    <div class="form-group">
                        <label>Statut Judiciaire</label>
                        <select data-index="${index}" data-field="statut_judiciaire" class="person-input">
                            <option value="">Aucun</option>
                            <option value="soupconne" ${p.statut_judiciaire === 'soupconne' ? 'selected' : ''}>Soupçonné</option>
                            <option value="condamne" ${p.statut_judiciaire === 'condamne' ? 'selected' : ''}>Condamné</option>
                            <option value="acquitte" ${p.statut_judiciaire === 'acquitte' ? 'selected' : ''}>Acquitté</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description (FR)</label>
                        <textarea data-index="${index}" data-field="description_fr" class="person-input" style="min-height: 80px;">${p.description_fr || ''}</textarea>
                    </div>
                </div>
                <div>
                    <button type="button" class="admin-btn admin-btn--danger btn-remove" data-index="${index}">Supprimer</button>
                </div>
            `;
            container.appendChild(item);
        });

        // Add event listeners
        container.querySelectorAll('.person-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const field = e.target.getAttribute('data-field');
                persons[idx][field] = e.target.value;
                hiddenInput.value = JSON.stringify(persons);
            });
        });

        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                persons.splice(idx, 1);
                hiddenInput.value = JSON.stringify(persons);
                render();
            });
        });
    };

    btnAdd.addEventListener('click', () => {
        persons.push({ nom: '', role: 'victime', statut_judiciaire: '', description_fr: '' });
        hiddenInput.value = JSON.stringify(persons);
        render();
    });

    render();
}

/**
 * Dynamic Timeline Manager
 */
function initDynamicTimeline() {
    const container = document.getElementById('timeline-container');
    const btnAdd = document.getElementById('btn-add-timeline');
    const hiddenInput = document.getElementById('timeline-json');
    
    if (!container || !btnAdd || !hiddenInput) return;

    let events = [];
    try {
        events = JSON.parse(hiddenInput.value || '[]');
    } catch (e) {
        events = [];
    }

    const render = () => {
        container.innerHTML = '';
        events.forEach((ev, index) => {
            const item = document.createElement('div');
            item.className = 'admin-card form-row';
            item.innerHTML = `
                <div>
                    <div class="form-group">
                        <label>Date / Période</label>
                        <input type="text" value="${ev.date_evenement || ''}" data-index="${index}" data-field="date_evenement" class="tl-input">
                    </div>
                    <div class="form-group">
                        <label>Ordre</label>
                        <input type="number" value="${ev.ordre || index}" data-index="${index}" data-field="ordre" class="tl-input">
                    </div>
                </div>
                <div style="flex:2">
                    <div class="form-group">
                        <label>Description (FR)</label>
                        <textarea data-index="${index}" data-field="description_fr" class="tl-input" style="min-height: 80px;">${ev.description_fr || ''}</textarea>
                    </div>
                </div>
                <div>
                    <button type="button" class="admin-btn admin-btn--danger btn-remove-tl" data-index="${index}">Supprimer</button>
                </div>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('.tl-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const field = e.target.getAttribute('data-field');
                events[idx][field] = e.target.value;
                hiddenInput.value = JSON.stringify(events);
            });
        });

        container.querySelectorAll('.btn-remove-tl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                events.splice(idx, 1);
                hiddenInput.value = JSON.stringify(events);
                render();
            });
        });
    };

    btnAdd.addEventListener('click', () => {
        events.push({ date_evenement: '', description_fr: '', ordre: events.length });
        hiddenInput.value = JSON.stringify(events);
        render();
    });

    render();
}

/**
 * Image Upload Dropzone
 */
function initImageUpload() {
    const dropzone = document.getElementById('image-dropzone');
    const fileInput = document.getElementById('image-upload-input');
    
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            // Optionally trigger upload or preview here
            console.log('Files ready for upload', fileInput.files);
        }
    });
}

/**
 * Confirm Delete
 */
function initConfirmDelete() {
    document.querySelectorAll('.btn-delete-confirm').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) {
                e.preventDefault();
            }
        });
    });
}

/**
 * Form Validation
 */
function initFormValidation() {
    const form = document.querySelector('.admin-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'red';
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) {
            e.preventDefault();
            alert('Veuillez remplir tous les champs obligatoires.');
        }
    });
}
