// Interactive behaviors for portfolio
document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle (persisted)
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.body;

    function applyTheme(t) {
        if (t === 'light') {
            root.setAttribute('data-theme', 'light');
            themeToggle.textContent = '☀️';
        } else {
            root.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
        }
    }

    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved === 'light' ? 'light' : 'dark');

    themeToggle.addEventListener('click', () => {
        const isLight = root.getAttribute('data-theme') === 'light';
        const next = isLight ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('theme', next === 'light' ? 'light' : 'dark');
    });

    // Role rotation in hero
    const roleEl = document.getElementById('role');
    if (roleEl) {
        const roles = (roleEl.dataset.roles || '').split(',').map(r => r.trim()).filter(Boolean);
        let i = 0;
        if (roles.length) {
            setInterval(() => {
                // fade-out
                roleEl.style.opacity = '0';
                roleEl.style.transform = 'translateY(-6px)';
                setTimeout(() => {
                    roleEl.textContent = roles[i];
                    roleEl.style.opacity = '1';
                    roleEl.style.transform = 'translateY(0)';
                    i = (i + 1) % roles.length;
                }, 260);
            }, 2700);
        }
    }

    // Project modal
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalDesc = document.getElementById('modal-desc');
    const closeBtn = modal && modal.querySelector('.modal-close');

    function openModal(title, desc) {
        if (!modal) return;
        modalTitle.textContent = title || '';
        modalDesc.textContent = desc || '';
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.querySelectorAll('.view-btn').forEach(b => {
        b.addEventListener('click', e => {
            const t = b.dataset.title;
            const d = b.dataset.desc;
            openModal(t, d);
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Project filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
            btn.classList.add('active');
            const f = btn.dataset.filter;
            document.querySelectorAll('.card').forEach(card => {
                const tags = (card.dataset.tags || '').split(',').map(t => t.trim());
                if (f === 'all' || tags.includes(f)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Profile actions: copy email feedback and download hint
    const copyBtn = document.getElementById('copy-email');
    if (copyBtn) {
        copyBtn.addEventListener('click', async() => {
            const email = copyBtn.dataset.email || 'your-email@example.com';
            try {
                await navigator.clipboard.writeText(email);
                copyBtn.textContent = 'Copied ✓';
                setTimeout(() => { copyBtn.textContent = 'Copy Email'; }, 1800);
            } catch (err) {
                // fallback
                const ta = document.createElement('textarea');
                ta.value = email;
                document.body.appendChild(ta);
                ta.select();
                try {
                    document.execCommand('copy');
                    copyBtn.textContent = 'Copied ✓';
                    setTimeout(() => { copyBtn.textContent = 'Copy Email'; }, 1800);
                } catch (e) { alert('Copy failed, email: ' + email); }
                ta.remove();
            }
        });
    }

    const downloadBtn = document.getElementById('download-cv');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            // small UX: change text briefly to confirm download started
            const before = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            setTimeout(() => { downloadBtn.textContent = before; }, 1500);
        });
    }

    // Resume nav feedback
    const resumeNav = document.getElementById('resume-nav');
    if (resumeNav) {
        resumeNav.addEventListener('click', () => {
            const before = resumeNav.textContent;
            resumeNav.textContent = 'Downloading...';
            setTimeout(() => { resumeNav.textContent = before; }, 1400);
        });
    }

    // Contact form: client-side validation + mock send
    const contactForm = document.getElementById('contact-form');
    const feedback = document.getElementById('form-feedback');
    const clearBtn = document.getElementById('form-clear');

    function validateEmail(email) {
        return /^[\w-.+]+@[\w-]+\.[a-zA-Z]{2,}$/.test(email);
    }

    if (clearBtn) clearBtn.addEventListener('click', () => {
        if (contactForm) contactForm.reset();
        feedback.textContent = '';
        feedback.className = 'form-feedback';
    });

    if (contactForm) {
        contactForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            const name = contactForm.querySelector('[name="name"]').value.trim();
            const email = contactForm.querySelector('[name="email"]').value.trim();
            const subject = (contactForm.querySelector('[name="subject"]') || { value: '' }).value.trim();
            const message = contactForm.querySelector('[name="message"]').value.trim();

            if (!name || !email || !message) {
                feedback.textContent = 'Please fill in name, email and message.';
                feedback.className = 'form-feedback error';
                return;
            }

            if (!validateEmail(email)) {
                feedback.textContent = 'Please enter a valid email address.';
                feedback.className = 'form-feedback error';
                return;
            }

            feedback.textContent = 'Sending message...';
            feedback.className = 'form-feedback';

            // Check for configured endpoint in saved profileData
            let endpoint = null;
            try { const saved = JSON.parse(localStorage.getItem('profileData') || 'null'); if (saved && saved.endpoint) endpoint = saved.endpoint; } catch (err) { endpoint = null; }

            const saveLocally = (status) => {
                try {
                    const stored = JSON.parse(localStorage.getItem('sentMessages') || '[]');
                    stored.push({ name, email, subject, message, date: new Date().toISOString(), status });
                    localStorage.setItem('sentMessages', JSON.stringify(stored));
                } catch (err) { /* ignore storage issues */ }
            };

            if (endpoint) {
                // fire-and-forget fetch so the submit handler returns quickly
                const payload = { name, email, subject, message };
                fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).then(res => {
                    if (res.ok) {
                        feedback.textContent = 'Thanks — your message was sent. I will get back to you soon.';
                        feedback.className = 'form-feedback success';
                        contactForm.reset();
                        saveLocally('sent');
                    } else {
                        // server responded with error; fallback to mailto
                        feedback.textContent = 'Send failed (server). Opening mail client as fallback.';
                        feedback.className = 'form-feedback error';
                        const recipient = (document.getElementById('contact-email') || { textContent: '' }).textContent.trim();
                        const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject || 'Contact from portfolio')}&body=${encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\n' + message)}`;
                        window.location.href = mailto;
                        saveLocally('failed-server-fallback-mailto');
                    }
                }).catch(err => {
                    console.warn('Send failed', err);
                    feedback.textContent = 'Send failed (network). Opening mail client as fallback.';
                    feedback.className = 'form-feedback error';
                    const recipient = (document.getElementById('contact-email') || { textContent: '' }).textContent.trim();
                    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject || 'Contact from portfolio')}&body=${encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\n' + message)}`;
                    window.location.href = mailto;
                    saveLocally('failed-network-fallback-mailto');
                });
            } else {
                // No endpoint configured: open mail client with prefilled message
                const recipient = (document.getElementById('contact-email') || { textContent: '' }).textContent.trim();
                const subj = subject || 'Contact from portfolio';
                const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
                const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailto;
                feedback.textContent = 'Opening your mail client...';
                feedback.className = 'form-feedback';
                saveLocally('mailto');
                contactForm.reset();
            }
        });
    }

    // Hero video: autoplay attempt, overlay behavior and error handling
    (function setupHeroVideo() {
        const video = document.getElementById('hero-video');
        const overlay = document.getElementById('video-play-overlay');
        if (!video || !overlay) return;

        // Try autoplay muted (some browsers allow it)
        video.play().then(() => {
            // autoplay succeeded; hide overlay
            overlay.classList.remove('show');
        }).catch(() => {
            // Autoplay blocked: show overlay to prompt user
            overlay.classList.add('show');
        });

        // If video errors (bad source), hide video and overlay gracefully
        video.addEventListener('error', (ev) => {
            console.warn('Hero video failed to load/play', ev);
            overlay.classList.remove('show');
            video.style.display = 'none';
        });

        // Overlay click starts playback (enables controls and unmutes)
        overlay.addEventListener('click', async() => {
            try {
                video.muted = false;
                video.controls = true;
                await video.play();
                overlay.classList.remove('show');
            } catch (err) {
                console.warn('Play failed on user interaction', err);
                // fallback: keep overlay visible and allow user to click again
            }
        });
    })();

    /* Settings modal: open, populate, save and persist */
    (function setupSettings() {
        const btn = document.getElementById('settings-btn');
        const modal = document.getElementById('settings-modal');
        const closeBtn = modal && modal.querySelector('.modal-close');
        const form = document.getElementById('settings-form');
        const cancel = document.getElementById('settings-cancel');

        if (!btn || !modal || !form) return;
        const editBtn = document.getElementById('settings-edit');

        function setEditMode(enabled) {
            Array.from(form.querySelectorAll('input,textarea')).forEach(el => {
                el.disabled = !enabled;
            });
            const submit = form.querySelector('button[type="submit"]');
            if (submit) {
                submit.disabled = !enabled;
                submit.textContent = 'Save details';
            }
            if (editBtn) {
                editBtn.textContent = enabled ? 'Editing...' : 'Edit';
                editBtn.disabled = enabled;
            }
        }

        function openSettings() {
            populateFormFromPage();
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeSettings() {
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        btn.addEventListener('click', openSettings);
        if (closeBtn) closeBtn.addEventListener('click', closeSettings);
        if (cancel) cancel.addEventListener('click', closeSettings);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeSettings(); });

        if (editBtn) {
            editBtn.addEventListener('click', () => {
                setEditMode(true);
                // focus first input
                const first = form.querySelector('input,textarea');
                if (first) first.focus();
            });
        }

        function getTextList(selector) {
            const el = document.querySelector(selector);
            if (!el) return [];
            return Array.from(el.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
        }

        function setListFromText(selector, lines) {
            const container = document.querySelector(selector);
            if (!container) return;
            container.innerHTML = '';
            lines.forEach(v => {
                const li = document.createElement('li');
                li.textContent = v;
                container.appendChild(li);
            });
        }

        function populateFormFromPage() {
            document.getElementById('settings-name').value = (document.querySelector('.profile-body h3') || { textContent: '' }).textContent.trim();
            document.getElementById('settings-role').value = (document.querySelector('.profile-body .role') || { textContent: '' }).textContent.trim();
            document.getElementById('settings-email').value = (document.getElementById('contact-email') || { textContent: '' }).textContent.trim();
            document.getElementById('settings-bio').value = (document.querySelector('.profile-body .bio') || { textContent: '' }).textContent.trim();
            document.getElementById('settings-avatar').value = (document.querySelector('.avatar img') || { src: '' }).src.split('/').pop() || '';

            // load saved endpoint if present
            try {
                const saved = JSON.parse(localStorage.getItem('profileData') || 'null') || {};
                document.getElementById('settings-endpoint').value = saved.endpoint || '';
            } catch (e) { document.getElementById('settings-endpoint').value = ''; }

            // Fill skills
            document.getElementById('settings-prog').value = getTextList('.skill-group:nth-of-type(1) ul').join('\n');
            document.getElementById('settings-web').value = getTextList('.skill-group:nth-of-type(2) ul').join('\n');
            document.getElementById('settings-db').value = getTextList('.skill-group:nth-of-type(3) ul').join('\n');
            // mobile and concepts groups may be shifted depending on DOM; try to find by heading text fallback
            const groups = Array.from(document.querySelectorAll('#skills .skill-group'));
            const findByHeading = (heading) => {
                const g = groups.find(g => (g.querySelector('h3') || { textContent: '' }).textContent.trim().toLowerCase().includes(heading));
                return g ? Array.from(g.querySelectorAll('li')).map(li => li.textContent.trim()).join('\n') : '';
            };
            document.getElementById('settings-mobile').value = findByHeading('mobile');
            document.getElementById('settings-concepts').value = findByHeading('concept');
            document.getElementById('settings-soft').value = findByHeading('soft');

            // start locked (view-only)
            setEditMode(false);
        }

        function saveFormToPage(data) {
            const nameEl = document.querySelector('.profile-body h3');
            if (nameEl) nameEl.textContent = data.name;
            const roleEl = document.querySelector('.profile-body .role');
            if (roleEl) roleEl.textContent = data.role;
            const bioEl = document.querySelector('.profile-body .bio');
            if (bioEl) bioEl.textContent = data.bio;
            const contactEmail = document.getElementById('contact-email');
            if (contactEmail) contactEmail.textContent = data.email;
            const copyBtn = document.getElementById('copy-email');
            if (copyBtn) copyBtn.dataset.email = data.email;
            const avatarImg = document.querySelector('.avatar img');
            if (avatarImg && data.avatar) avatarImg.src = data.avatar;

            // Update lists by heading
            const updateGroup = (headingText, lines) => {
                const g = Array.from(document.querySelectorAll('#skills .skill-group')).find(g => (g.querySelector('h3') || { textContent: '' }).textContent.trim().toLowerCase().includes(headingText));
                if (!g) return;
                const ul = g.querySelector('ul');
                if (!ul) return;
                ul.innerHTML = '';
                lines.forEach(s => {
                    if (!s) return;
                    const li = document.createElement('li');
                    li.textContent = s.trim();
                    ul.appendChild(li);
                });
            };

            updateGroup('program', data.prog);
            updateGroup('web', data.web);
            updateGroup('database', data.db);
            updateGroup('mobile', data.mobile);
            updateGroup('concept', data.concepts);
            updateGroup('soft', data.soft);

            // Persist
            try { localStorage.setItem('profileData', JSON.stringify(data)); } catch (e) { /* ignore */ }
        }

        // load saved on start
        try {
            const saved = JSON.parse(localStorage.getItem('profileData') || 'null');
            if (saved) saveFormToPage(saved);
        } catch (e) {}

        form.addEventListener('submit', async(e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('settings-name').value.trim(),
                role: document.getElementById('settings-role').value.trim(),
                email: document.getElementById('settings-email').value.trim(),
                bio: document.getElementById('settings-bio').value.trim(),
                avatar: document.getElementById('settings-avatar').value.trim(),
                endpoint: document.getElementById('settings-endpoint').value.trim(),
                prog: document.getElementById('settings-prog').value.split('\n').map(s => s.trim()).filter(Boolean),
                web: document.getElementById('settings-web').value.split('\n').map(s => s.trim()).filter(Boolean),
                db: document.getElementById('settings-db').value.split('\n').map(s => s.trim()).filter(Boolean),
                mobile: document.getElementById('settings-mobile').value.split('\n').map(s => s.trim()).filter(Boolean),
                concepts: document.getElementById('settings-concepts').value.split('\n').map(s => s.trim()).filter(Boolean),
                soft: document.getElementById('settings-soft').value.split('\n').map(s => s.trim()).filter(Boolean),
            };

            // If avatar is a filename only, try to use it as relative path
            if (data.avatar && !data.avatar.includes('/')) data.avatar = data.avatar;

            // Save locally and update DOM immediately
            saveFormToPage(data);

            // If an endpoint is configured, attempt to POST the profile data to it
            if (data.endpoint) {
                // Do upload in background (non-blocking) and show status in settings-feedback
                const settingsFeedback = document.getElementById('settings-feedback');
                if (settingsFeedback) { settingsFeedback.textContent = 'Uploading...';
                    settingsFeedback.className = 'form-feedback'; }
                fetch(data.endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).then(res => {
                    try { localStorage.setItem('profileData', JSON.stringify(data)); } catch (e) {}
                    if (settingsFeedback) {
                        if (res.ok) {
                            settingsFeedback.textContent = 'Details saved locally and uploaded to endpoint.';
                            settingsFeedback.className = 'form-feedback success';
                        } else {
                            settingsFeedback.textContent = 'Saved locally; upload returned an error.';
                            settingsFeedback.className = 'form-feedback error';
                        }
                    }
                }).catch(err => {
                    console.warn('Upload failed', err);
                    if (settingsFeedback) { settingsFeedback.textContent = 'Saved locally; upload failed.';
                        settingsFeedback.className = 'form-feedback error'; }
                });
            } else {
                const settingsFeedback = document.getElementById('settings-feedback');
                if (settingsFeedback) { settingsFeedback.textContent = 'Details saved locally.';
                    settingsFeedback.className = 'form-feedback success'; }
            }

            // return to view-only mode after save
            setEditMode(false);
            closeSettings();
        });

        // esc closes
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modal.getAttribute('aria-hidden') === 'false') closeSettings();
            }
        });
    })();
});