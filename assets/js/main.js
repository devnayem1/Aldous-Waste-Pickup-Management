/* ================================================
   1. HELPER FUNCTIONS
================================================ */

/**
 * @param {string} selector 
 * @param {number} duration 
 */
function showAlert(form, isSuccess, duration = 2000) {
    const formContainer = form.closest(".contact-form-container") || form.closest(".banner-home") || form.parentElement;
    if (!formContainer) return;

    const targetSelector = isSuccess ? ".success-message" : ".error-message";
    const alertEl = formContainer.querySelector(targetSelector);
    if (!alertEl) return;

    formContainer.querySelectorAll(".alert").forEach((el) => {
        if (el !== alertEl) el.classList.add("hidden");
    });

    alertEl.classList.remove("hidden");
    clearTimeout(alertEl._alertTimer);
    alertEl._alertTimer = setTimeout(() => alertEl.classList.add("hidden"), duration);
}

/**
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function isFormValid(form) {
    let valid = true;
    const fields = form.querySelectorAll("input, select, textarea");

    fields.forEach((field) => {
        const value = field.value ?? "";

        if (field.tagName === "SELECT" && value === "") {
            valid = false;
            return;
        }

        if (field.value === null || field.value.trim() === "") {
            valid = false;
        }
    });

    return valid;
}

function initContactForm() {
    const forms = document.querySelectorAll(".contact-form, .register-form");
    if (!forms.length) return;

    forms.forEach((form) => {
        if (form.dataset.bound === "true") return;
        form.dataset.bound = "true";

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            if (isFormValid(form)) {
                form.reset();
                showAlert(form, true);
            } else {
                showAlert(form, false);
            }
        });
    });
}

/**
 * Convert CSS time strings (e.g., "200ms", "2s") to milliseconds
 * @param {string|number} value - Time value from CSS
 * @param {number} fallback - Default millisecond value
 * @returns {number}
 */
const getTimeInMs = (value, fallback = 0) => {
    if (!value) return fallback;
    const stringValue = String(value).trim();
    if (stringValue.endsWith("ms")) return parseFloat(stringValue);
    if (stringValue.endsWith("s")) return parseFloat(stringValue) * 1000;
    const numberValue = parseFloat(stringValue);
    return Number.isNaN(numberValue) ? fallback : numberValue;
};


/* ================================================
   2. ANIMATION HELPERS
================================================ */

/**
 * Animate progress bar element
 * @param {HTMLElement} el
 */
const animateProgress = (el) => {
    if (!el) return;
    const target = parseFloat(el.dataset.percent) || 0;
    const styles = getComputedStyle(el);
    const duration = getTimeInMs(styles.getPropertyValue("--anim-duration").trim(), 2000);
    const delay = getTimeInMs(styles.getPropertyValue("--anim-delay").trim(), 0);
    const skillContainer = el.closest(".about-skill");
    const percentText = skillContainer?.querySelector(".skill-percent") || null;

    el.style.width = "0%";
    if (percentText) percentText.textContent = "0%";

    const startAnimation = () => {
        const startTime = performance.now();

        const updateProgress = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentValue = target * progress;

            el.style.width = `${currentValue}%`;

            if (percentText) {
                percentText.textContent = `${Math.round(currentValue)}%`;
                percentText.style.left = `${currentValue - 5}%`;
            }

            if (progress < 1) {
                el._progressFrame = requestAnimationFrame(updateProgress);
            } else {
                el.style.width = `${target}%`;
                if (percentText) {
                    percentText.textContent = `${target}%`;
                    percentText.style.left = `${target - 5}%`;
                }
            }
        };

        el._progressFrame = requestAnimationFrame(updateProgress);
    };

    if (delay > 0) {
        el._progressTimeout = setTimeout(startAnimation, delay);
    } else {
        startAnimation();
    }
};

/**
 * Play CSS or JS animation for an element
 * @param {HTMLElement} el
 */
const playAnimation = (el) => {
    if (!el) return;
    const animation = el.dataset.animation;
    if (!animation) return;

    if (animation === "progress") {
        animateProgress(el);
        return;
    }

    const styles = getComputedStyle(el);
    const duration = el.dataset.duration || styles.getPropertyValue("--anim-duration").trim() || "0.8s";
    const delay = el.dataset.delay || styles.getPropertyValue("--anim-delay").trim() || "0s";

    el.style.animation = "none";
    void el.offsetWidth; // Trigger reflow
    el.style.opacity = "0";

    el.style.animationName = animation;
    el.style.animationDuration = duration;
    el.style.animationDelay = delay;
    el.style.animationTimingFunction = "ease";
    el.style.animationFillMode = "forwards";
    el.style.animationPlayState = "running";
};


/* ================================================
   3. FEATURE INITIALIZERS
================================================ */

/**
 * Initialize scroll animations using IntersectionObserver
 */
const initScrollAnimations = () => {
    const elements = document.querySelectorAll("[data-animation]");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const el = entry.target;
                const animation = el.dataset.animation;

                if (animation !== "progress") {
                    el.addEventListener(
                        "animationend",
                        () => {
                            el.style.opacity = "1";
                            if (el.classList.contains("card-banner-home")) {
                                el.style.removeProperty("transform");
                                if (typeof window.cardBannerHomeAnimation === "function") {
                                    requestAnimationFrame(() => {
                                        window.cardBannerHomeAnimation();
                                    });
                                }
                            } else {
                                el.style.transform = "none";
                            }
                        },
                        { once: true }
                    );
                }

                playAnimation(el);
                el.classList.add("animated");
                observer.unobserve(el);
            });
        },
        { threshold: 0.1 }
    );

    elements.forEach((el) => {
        const animation = el.dataset.animation;
        if (animation === "progress") {
            el.style.animation = "none";
            el.style.width = "0%";
            el.style.opacity = "1";
        } else {
            el.style.animationPlayState = "paused";
            el.style.opacity = "0";
        }
        observer.observe(el);
    });
};

/**
 * Initialize service tab interactions
 */
const initServiceTabs = () => {
    const tabButtons = document.querySelectorAll("#serviceTabs .option-button");
    const tabPanes = document.querySelectorAll("#serviceTabsContent .tab-pane");

    if (tabButtons.length === 0 || tabPanes.length === 0) return;

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const targetSelector = button.getAttribute("data-tab-target");
            const targetPane = document.querySelector(targetSelector);

            if (!targetPane) {
                console.warn(`Tab target "${targetSelector}" not found.`);
                return;
            }

            for (const btn of tabButtons) btn.classList.remove("active-button");
            for (const pane of tabPanes) pane.classList.remove("active", "show");

            button.classList.add("active-button");
            targetPane.classList.add("active", "show");
        });
    });
};

const initNavbarActiveState = () => {
    const currentUrl = window.location.href;

    document.querySelectorAll(".nv-link").forEach((link) => {
        if (link.href === currentUrl) {
            link.classList.add("active");

            const dropdownParent = link.closest(".nv-dropdown-parent");
            if (dropdownParent) {
                const parentToggle = dropdownParent.querySelector(":scope > a.nv-link");
                if (parentToggle) parentToggle.classList.add("active");
            }
        }
    });
};


function initNavbar() {

    // ===== ELEMENT SELECTORS =====
    const sidebar = document.getElementById('mobileSidebar');
    const openBtn = document.getElementById('openMobileMenu');
    const closeBtn = document.getElementById('closeMobileMenu');
    const dropdownToggles = document.querySelectorAll('.sb-has-dropdown');

    function openSidebar() {
        sidebar.style.left = '0';
    }

    function closeSidebar() {
        sidebar.style.left = '-100%';
    }

    openBtn.addEventListener('click', openSidebar);
    closeBtn.addEventListener('click', closeSidebar);

    function toggleDropdown(toggle) {
        const parentLi = toggle.closest('.sb-has-dropdown');
        const submenu = parentLi.querySelector('.sb-submenu');
        const isOpen = submenu.classList.contains('sb-dropdown-open');

        document.querySelectorAll('.sb-has-dropdown').forEach((li) => {
            li.classList.remove('sb-dropdown-open');
        });

        if (!isOpen) {
            submenu.classList.add('sb-dropdown-open');
        }

        else if (isOpen) {
            submenu.classList.remove('sb-dropdown-open');
        }
    }

    dropdownToggles.forEach((toggle) => {
        toggle.addEventListener('click', () => toggleDropdown(toggle));
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) { 
            closeSidebar();
        }
    });
}

/* ================================================
    4. MAIN INITIALIZATION
    ================================================ */

    const initPageFeatures = () => {
        initContactForm();
        initScrollAnimations();
        initServiceTabs();
        initNavbarActiveState();
        initNavbar();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPageFeatures);
    } else {
        initPageFeatures();
    }