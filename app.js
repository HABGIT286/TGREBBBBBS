/* =========================================================
   TEACHER PRO
   js/app.js
   Main Application Controller
   الإصدار: 1.0.0
   ========================================================= */

"use strict";


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const AppState = {

    initialized: false,

    currentPage:
        "home",

    previousPage:
        null,

    loading:
        true,

    databaseReady:
        false,

    settingsReady:
        false,

    dataReady:
        false,

    isMobile:
        false,

    isDesktop:
        false,

    activeTheme:
        "purple-pink",

    siteName:
        "TEACHER PRO",

    siteLogo:
        "AA.jpg",

    siteBackground:
        "A.jpg",

    clockFormat:
        "12",

    showSeconds:
        true,

    animations:
        true,

    sounds:
        true,

    particles:
        true,

    glass:
        true,

    autoRefresh:
        true,

    selectedClass:
        null,

    selectedSection:
        null,

    selectedStudent:
        null,

    today:
        null,

    intervalIds:
        [],

    listenersAttached:
        false

};


/* =========================================================
   APPLICATION SELECTORS
   ========================================================= */

const APP_SELECTORS = {

    app:
        "#app",

    loadingScreen:
        "#loading-screen",

    loadingLogo:
        "#loading-logo",

    loadingTitle:
        "#loading-title",

    loadingSubtitle:
        "#loading-subtitle",

    loadingProgress:
        "#loading-progress",

    loadingPercent:
        "#loading-percent",

    siteLogo:
        "[data-site-logo]",

    siteName:
        "[data-site-name]",

    clock:
        "[data-clock]",

    date:
        "[data-date]",

    currentDay:
        "[data-current-day]",

    currentDate:
        "[data-current-date]",

    navigation:
        "[data-navigation]",

    navigationItems:
        "[data-nav]",

    pages:
        "[data-page]",

    themeElements:
        "[data-theme]",

    totalStudents:
        "[data-stat='total-students']",

    presentStudents:
        "[data-stat='present-students']",

    absentStudents:
        "[data-stat='absent-students']",

    lateStudents:
        "[data-stat='late-students']",

    currentClass:
        "[data-stat='class']",

    currentSection:
        "[data-stat='section']",

    currentLesson:
        "[data-stat='lesson']",

    currentTopic:
        "[data-stat='topic']",

    reminder:
        "[data-reminder]",

    todayNote:
        "[data-today-note]"

};


/* =========================================================
   DOM CACHE
   ========================================================= */

const DOM = {

    app:
        null,

    loadingScreen:
        null,

    loadingLogo:
        null,

    loadingTitle:
        null,

    loadingSubtitle:
        null,

    loadingProgress:
        null,

    loadingPercent:
        null,

    navigation:
        null,

    pages:
        [],

    navigationItems:
        [],

    clocks:
        [],

    dates:
        [],

    logos:
        [],

    names:
        []

};


/* =========================================================
   SAFE QUERY HELPERS
   ========================================================= */

function qs(selector, parent = document) {

    try {

        return parent.querySelector(selector);

    } catch (error) {

        console.warn(
            "Invalid selector:",
            selector,
            error
        );

        return null;

    }

}


function qsa(selector, parent = document) {

    try {

        return Array.from(
            parent.querySelectorAll(selector)
        );

    } catch (error) {

        console.warn(
            "Invalid selector:",
            selector,
            error
        );

        return [];

    }

}


/* =========================================================
   INITIALIZE DOM CACHE
   ========================================================= */

function cacheDOM() {

    DOM.app =
        qs(APP_SELECTORS.app);

    DOM.loadingScreen =
        qs(APP_SELECTORS.loadingScreen);

    DOM.loadingLogo =
        qs(APP_SELECTORS.loadingLogo);

    DOM.loadingTitle =
        qs(APP_SELECTORS.loadingTitle);

    DOM.loadingSubtitle =
        qs(APP_SELECTORS.loadingSubtitle);

    DOM.loadingProgress =
        qs(APP_SELECTORS.loadingProgress);

    DOM.loadingPercent =
        qs(APP_SELECTORS.loadingPercent);

    DOM.navigation =
        qs(APP_SELECTORS.navigation);

    DOM.pages =
        qsa(APP_SELECTORS.pages);

    DOM.navigationItems =
        qsa(APP_SELECTORS.navigationItems);

    DOM.clocks =
        qsa(APP_SELECTORS.clock);

    DOM.dates =
        qsa(APP_SELECTORS.date);

    DOM.logos =
        qsa(APP_SELECTORS.siteLogo);

    DOM.names =
        qsa(APP_SELECTORS.siteName);

}


/* =========================================================
   APPLICATION START
   ========================================================= */

async function startApplication() {

    if (
        AppState.initialized
    ) {

        return;

    }

    AppState.initialized =
        true;

    cacheDOM();

    detectDevice();

    initializeToday();

    applyInitialSiteConfiguration();

    attachGlobalEvents();

    initializeVisualEffects();

    updateClock();

    updateDate();

    await initializeApplicationData();

    await initializeApplicationModules();

    restoreApplicationState();

    updateDashboard();

    hideLoadingScreen();

}


/* =========================================================
   INITIAL DATA INITIALIZATION
   ========================================================= */

async function initializeApplicationData() {

    try {

        await initializeDatabase();

        AppState.databaseReady =
            true;

    } catch (error) {

        console.error(
            "Database initialization failed:",
            error
        );

        AppState.databaseReady =
            false;

    }


    try {

        await loadApplicationSettings();

        AppState.settingsReady =
            true;

    } catch (error) {

        console.error(
            "Settings initialization failed:",
            error
        );

        AppState.settingsReady =
            false;

    }


    try {

        await loadInitialData();

        AppState.dataReady =
            true;

    } catch (error) {

        console.error(
            "Initial data loading failed:",
            error
        );

        AppState.dataReady =
            false;

    }

}


/* =========================================================
   DATABASE INITIALIZATION BRIDGE
   ========================================================= */

async function initializeDatabase() {

    if (
        typeof window.initDatabase ===
        "function"
    ) {

        return await window.initDatabase();

    }


    if (
        typeof window.initializeDB ===
        "function"
    ) {

        return await window.initializeDB();

    }


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.init ===
        "function"
    ) {

        return await window.TeacherProDB.init();

    }


    /*
     * إذا لم يكن ملف قاعدة البيانات قد حمل بعد،
     * لا يتم إنشاء localStorage بديل لأن النظام
     * يعتمد على IndexedDB.
     */

    return true;

}


/* =========================================================
   SETTINGS LOADER
   ========================================================= */

async function loadApplicationSettings() {

    let settings = null;


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getAllSettings ===
        "function"
    ) {

        settings =
            await window.TeacherProDB.getAllSettings();

    } else if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getSettings ===
        "function"
    ) {

        settings =
            await window.TeacherProDB.getSettings();

    }


    if (
        !settings
    ) {

        settings = {};

    }


    applySettings(settings);

}


/* =========================================================
   APPLY SETTINGS
   ========================================================= */

function applySettings(settings) {

    if (
        typeof settings !==
        "object" ||
        settings === null
    ) {

        return;

    }


    AppState.siteName =
        settings.siteName ||
        SITE_DEFAULTS.name;


    AppState.siteLogo =
        settings.siteLogo ||
        SITE_DEFAULTS.logo;


    AppState.siteBackground =
        settings.siteBackground ||
        SITE_DEFAULTS.background;


    AppState.activeTheme =
        settings.activeTheme ||
        SITE_DEFAULTS.defaultTheme;


    AppState.clockFormat =
        settings.clockFormat ||
        SITE_DEFAULTS.defaultTimeFormat;


    AppState.showSeconds =
        settings.showSeconds !== undefined
            ? Boolean(settings.showSeconds)
            : true;


    AppState.animations =
        settings.enableAnimations !== undefined
            ? Boolean(settings.enableAnimations)
            : true;


    AppState.sounds =
        settings.enableSounds !== undefined
            ? Boolean(settings.enableSounds)
            : true;


    AppState.particles =
        settings.enableParticles !== undefined
            ? Boolean(settings.enableParticles)
            : true;


    AppState.glass =
        settings.glassEffect !== undefined
            ? Boolean(settings.glassEffect)
            : true;


    AppState.autoRefresh =
        settings.autoRefresh !== undefined
            ? Boolean(settings.autoRefresh)
            : true;


    applySiteBranding();

    applyTheme(
        AppState.activeTheme
    );

    applyInterfacePreferences();

}


/* =========================================================
   SITE BRANDING
   ========================================================= */

function applySiteBranding() {

    DOM.names.forEach(
        element => {

            element.textContent =
                AppState.siteName;

        }
    );


    DOM.logos.forEach(
        element => {

            if (
                AppState.siteLogo
            ) {

                element.src =
                    AppState.siteLogo;

            }

            element.alt =
                AppState.siteName;

        }
    );


    if (
        DOM.loadingLogo
    ) {

        DOM.loadingLogo.src =
            AppState.siteLogo;

        DOM.loadingLogo.alt =
            AppState.siteName;

    }


    if (
        DOM.loadingTitle
    ) {

        DOM.loadingTitle.textContent =
            AppState.siteName;

    }


    document.title =
        AppState.siteName;

}


/* =========================================================
   BACKGROUND
   ========================================================= */

function applySiteBackground() {

    const background =
        AppState.siteBackground;


    if (
        !background
    ) {

        return;

    }


    document.documentElement
        .style
        .setProperty(
            "--site-background-image",
            `url("${background}")`
        );


    document.body
        .style
        .backgroundImage =
        `url("${background}")`;

}


/* =========================================================
   INITIAL SITE CONFIGURATION
   ========================================================= */

function applyInitialSiteConfiguration() {

    AppState.siteName =
        SITE_DEFAULTS.name;

    AppState.siteLogo =
        SITE_DEFAULTS.logo;

    AppState.siteBackground =
        SITE_DEFAULTS.background;

    AppState.activeTheme =
        SITE_DEFAULTS.defaultTheme;

    AppState.clockFormat =
        SITE_DEFAULTS.defaultTimeFormat;

    AppState.showSeconds =
        true;

    AppState.animations =
        SITE_DEFAULTS.enableAnimations;

    AppState.sounds =
        SITE_DEFAULTS.enableSounds;

    AppState.particles =
        SITE_DEFAULTS.enableParticles;

    AppState.glass =
        SITE_DEFAULTS.enableGlass;

    applySiteBranding();

    applySiteBackground();

    applyTheme(
        AppState.activeTheme
    );

    applyInterfacePreferences();

}


/* =========================================================
   INTERFACE PREFERENCES
   ========================================================= */

function applyInterfacePreferences() {

    const root =
        document.documentElement;


    root.classList.toggle(
        "animations-disabled",
        !AppState.animations
    );


    root.classList.toggle(
        "particles-disabled",
        !AppState.particles
    );


    root.classList.toggle(
        "glass-disabled",
        !AppState.glass
    );


    root.dataset.clockFormat =
        AppState.clockFormat;

}


/* =========================================================
   THEME SYSTEM
   ========================================================= */

function applyTheme(themeId) {

    const theme =
        getThemeById(themeId);


    if (
        !theme
    ) {

        return;

    }


    AppState.activeTheme =
        theme.id;


    const root =
        document.documentElement;


    root.dataset.theme =
        theme.id;


    root.style.setProperty(
        "--theme-primary",
        theme.primary
    );


    root.style.setProperty(
        "--theme-secondary",
        theme.secondary
    );


    root.style.setProperty(
        "--theme-accent",
        theme.accent
    );


    root.style.setProperty(
        "--theme-background",
        theme.background
    );


    root.style.setProperty(
        "--theme-surface",
        theme.surface
    );


    root.style.setProperty(
        "--theme-border",
        theme.border
    );


    root.style.setProperty(
        "--theme-glow",
        theme.glow
    );


    qsa(
        "[data-theme-name]"
    ).forEach(
        element => {

            element.textContent =
                theme.name;

        }
    );


    qsa(
        "[data-theme]"
    ).forEach(
        element => {

            if (
                element.dataset.theme !==
                theme.id
            ) {

                element.classList.remove(
                    "theme-active"
                );

            } else {

                element.classList.add(
                    "theme-active"
                );

            }

        }
    );

}


/* =========================================================
   CHANGE THEME
   ========================================================= */

async function changeTheme(themeId) {

    const theme =
        getThemeById(themeId);


    if (
        !theme
    ) {

        return false;

    }


    applyTheme(
        theme.id
    );


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.saveSetting ===
        "function"
    ) {

        try {

            await window.TeacherProDB.saveSetting(
                "activeTheme",
                theme.id
            );

        } catch (error) {

            console.warn(
                "Could not save theme:",
                error
            );

        }

    }


    triggerPageEffect(
        "theme"
    );


    return true;

}


/* =========================================================
   DEVICE DETECTION
   ========================================================= */

function detectDevice() {

    const width =
        window.innerWidth;


    AppState.isMobile =
        width <= 767;


    AppState.isDesktop =
        width >= 1024;


    document.documentElement
        .classList.toggle(
            "is-mobile",
            AppState.isMobile
        );


    document.documentElement
        .classList.toggle(
            "is-desktop",
            AppState.isDesktop
        );

}


/* =========================================================
   CURRENT DATE
   ========================================================= */

function initializeToday() {

    const now =
        new Date();


    AppState.today =
        now;

}


/* =========================================================
   CLOCK FORMATTER
   ========================================================= */

function formatClock(date) {

    const hours24 =
        date.getHours();


    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            date.getSeconds()
        ).padStart(
            2,
            "0"
        );


    if (
        AppState.clockFormat ===
        "24"
    ) {

        const hours =
            String(
                hours24
            ).padStart(
                2,
                "0"
            );


        return AppState.showSeconds
            ? `${hours}:${minutes}:${seconds}`
            : `${hours}:${minutes}`;

    }


    let hours =
        hours24 % 12;


    if (
        hours === 0
    ) {

        hours =
            12;

    }


    const period =
        hours24 >= 12
            ? "PM"
            : "AM";


    const hourText =
        String(
            hours
        ).padStart(
            2,
            "0"
        );


    return AppState.showSeconds
        ? `${hourText}:${minutes}:${seconds} ${period}`
        : `${hourText}:${minutes} ${period}`;

}


/* =========================================================
   ARABIC DATE FORMAT
   ========================================================= */

function formatArabicDate(date) {

    const days = [

        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"

    ];


    const months = [

        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر"

    ];


    const day =
        days[
            date.getDay()
        ];


    const dayNumber =
        date.getDate();


    const month =
        months[
            date.getMonth()
        ];


    const year =
        date.getFullYear();


    return `${day}، ${dayNumber} ${month} ${year}`;

}


/* =========================================================
   UPDATE CLOCK
   ========================================================= */

function updateClock() {

    const now =
        new Date();


    AppState.today =
        now;


    const clockText =
        formatClock(
            now
        );


    DOM.clocks.forEach(
        element => {

            element.textContent =
                clockText;

        }
    );


    qsa(
        "[data-time]"
    ).forEach(
        element => {

            element.textContent =
                clockText;

        }
    );


    qsa(
        "[data-current-time]"
    ).forEach(
        element => {

            element.textContent =
                clockText;

        }
    );

}


/* =========================================================
   UPDATE DATE
   ========================================================= */

function updateDate() {

    const now =
        new Date();


    const dateText =
        formatArabicDate(
            now
        );


    DOM.dates.forEach(
        element => {

            element.textContent =
                dateText;

        }
    );


    qsa(
        "[data-current-date]"
    ).forEach(
        element => {

            element.textContent =
                dateText;

        }
    );


    qsa(
        "[data-day]"
    ).forEach(
        element => {

            element.textContent =
                getArabicDay(
                    now
                );

        }
    );

}


/* =========================================================
   GET ARABIC DAY
   ========================================================= */

function getArabicDay(date) {

    const days = [

        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"

    ];


    return (
        days[
            date.getDay()
        ] ||
        ""
    );

}


/* =========================================================
   LOAD INITIAL DATA
   ========================================================= */

async function loadInitialData() {

    await updateDashboard();

    await updateCurrentClass();

    await updateCurrentLesson();

    await updateTodayReminder();

    await updateTodayNote();

}


/* =========================================================
   APPLICATION MODULE INITIALIZATION
   ========================================================= */

async function initializeApplicationModules() {

    const modules = [

        "TeacherProRouter",
        "TeacherProStudents",
        "TeacherProClasses",
        "TeacherProAttendance",
        "TeacherProGrades",
        "TeacherProAssignments",
        "TeacherProExams",
        "TeacherProSchedule",
        "TeacherProNotes",
        "TeacherProReminders",
        "TeacherProData",
        "TeacherProCommunication",
        "TeacherProMessaging",
        "TeacherProBackup",
        "TeacherProSettings",
        "TeacherProThemes"

    ];


    for (
        const moduleName
        of modules
    ) {

        const module =
            window[
                moduleName
            ];


        if (
            module &&
            typeof module.init ===
            "function"
        ) {

            try {

                await module.init();

            } catch (error) {

                console.warn(
                    `Module ${moduleName} initialization failed:`,
                    error
                );

            }

        }

    }

}


/* =========================================================
   GLOBAL EVENTS
   ========================================================= */

function attachGlobalEvents() {

    if (
        AppState.listenersAttached
    ) {

        return;

    }


    AppState.listenersAttached =
        true;


    window.addEventListener(
        "resize",
        handleResize,
        {
            passive:
                true
        }
    );


    window.addEventListener(
        "popstate",
        handlePopState
    );


    document.addEventListener(
        "click",
        handleDocumentClick
    );


    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );


    window.addEventListener(
        "error",
        handleGlobalError
    );


    window.addEventListener(
        "unhandledrejection",
        handlePromiseError
    );

}


/* =========================================================
   DOCUMENT CLICK HANDLER
   ========================================================= */

function handleDocumentClick(event) {

    const nav =
        event.target.closest(
            "[data-nav]"
        );


    if (
        nav
    ) {

        event.preventDefault();

        const page =
            nav.dataset.nav ||
            nav.dataset.page;


        if (
            page
        ) {

            navigateTo(
                page
            );

        }

        return;

    }


    const pageButton =
        event.target.closest(
            "[data-go-page]"
        );


    if (
        pageButton
    ) {

        event.preventDefault();

        const page =
            pageButton.dataset.goPage;


        if (
            page
        ) {

            navigateTo(
                page
            );

        }

        return;

    }


    const themeButton =
        event.target.closest(
            "[data-set-theme]"
        );


    if (
        themeButton
    ) {

        const theme =
            themeButton.dataset.setTheme;


        if (
            theme
        ) {

            changeTheme(
                theme
            );

        }

        return;

    }


    const rippleTarget =
        event.target.closest(
            "[data-ripple]"
        );


    if (
        rippleTarget
    ) {

        createRipple(
            rippleTarget,
            event
        );

    }


    const effectTarget =
        event.target.closest(
            "[data-click-effect]"
        );


    if (
        effectTarget
    ) {

        triggerClickEffect(
            effectTarget
        );

    }

}


/* =========================================================
   KEYBOARD HANDLER
   ========================================================= */

function handleKeyboard(event) {

    if (
        event.key ===
        "Escape"
    ) {

        closeOpenOverlays();

    }


    if (
        event.key ===
        "Home" &&
        !isTypingTarget(
            event.target
        )
    ) {

        navigateTo(
            "home"
        );

    }

}


/* =========================================================
   CHECK TYPING TARGET
   ========================================================= */

function isTypingTarget(element) {

    if (
        !element
    ) {

        return false;

    }


    const tag =
        element.tagName
            ? element.tagName.toLowerCase()
            : "";


    return (

        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        element.isContentEditable

    );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function navigateTo(pageId, options = {}) {

    if (
        !pageId
    ) {

        return false;

    }


    const targetPage =
        qs(
            `[data-page="${pageId}"]`
        );


    if (
        !targetPage
    ) {

        console.warn(
            `Page "${pageId}" was not found.`
        );

        return false;

    }


    if (
        AppState.currentPage ===
        pageId &&
        !options.force
    ) {

        return true;

    }


    const oldPage =
        AppState.currentPage;


    AppState.previousPage =
        oldPage;


    AppState.currentPage =
        pageId;


    if (
        AppState.animations
    ) {

        animatePageTransition(
            oldPage,
            pageId
        );

    }


    updatePageVisibility(
        pageId
    );


    updateNavigationState(
        pageId
    );


    if (
        options.history !== false
    ) {

        updateHistory(
            pageId
        );

    }


    triggerPageEffect(
        "navigation"
    );


    callPageActivation(
        pageId
    );


    return true;

}


/* =========================================================
   PAGE VISIBILITY
   ========================================================= */

function updatePageVisibility(pageId) {

    DOM.pages.forEach(
        page => {

            const isActive =
                page.dataset.page ===
                pageId;


            page.classList.toggle(
                "active",
                isActive
            );


            page.classList.toggle(
                "page-active",
                isActive
            );


            page.hidden =
                !isActive;


            page.setAttribute(
                "aria-hidden",
                String(
                    !isActive
                )
            );

        }
    );

}


/* =========================================================
   NAVIGATION STATE
   ========================================================= */

function updateNavigationState(pageId) {

    DOM.navigationItems.forEach(
        item => {

            const itemPage =
                item.dataset.nav ||
                item.dataset.page;


            const active =
                itemPage ===
                pageId;


            item.classList.toggle(
                "active",
                active
            );


            item.classList.toggle(
                "selected",
                active
            );


            item.setAttribute(
                "aria-current",
                active
                    ? "page"
                    : "false"
            );

        }
    );

}


/* =========================================================
   HISTORY
   ========================================================= */

function updateHistory(pageId) {

    try {

        const url =
            new URL(
                window.location.href
            );


        url.hash =
            pageId;


        window.history.pushState(
            {
                page:
                    pageId
            },
            "",
            url
        );

    } catch (error) {

        console.warn(
            "History update failed:",
            error
        );

    }

}


/* =========================================================
   POP STATE
   ========================================================= */

function handlePopState() {

    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            );


    const page =
        hash ||
        "home";


    navigateTo(
        page,
        {
            history:
                false
        }
    );

}


/* =========================================================
   RESTORE APPLICATION STATE
   ========================================================= */

function restoreApplicationState() {

    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            );


    const page =
        hash ||
        "home";


    const valid =
        qs(
            `[data-page="${page}"]`
        );


    if (
        valid
    ) {

        navigateTo(
            page,
            {
                history:
                    false
            }
        );

    } else {

        navigateTo(
            "home",
            {
                history:
                    false
            }
        );

    }

}


/* =========================================================
   PAGE ACTIVATION
   ========================================================= */

function callPageActivation(pageId) {

    const activationMap = {

        home:
            "TeacherProHome",

        students:
            "TeacherProStudents",

        classes:
            "TeacherProClasses",

        attendance:
            "TeacherProAttendance",

        grades:
            "TeacherProGrades",

        assignments:
            "TeacherProAssignments",

        exams:
            "TeacherProExams",

        schedule:
            "TeacherProSchedule",

        notes:
            "TeacherProNotes",

        reminders:
            "TeacherProReminders",

        data:
            "TeacherProData",

        communication:
            "TeacherProCommunication",

        messaging:
            "TeacherProMessaging",

        backup:
            "TeacherProBackup",

        settings:
            "TeacherProSettings",

        themes:
            "TeacherProThemes"

    };


    const moduleName =
        activationMap[
            pageId
        ];


    if (
        !moduleName
    ) {

        return;

    }


    const module =
        window[
            moduleName
        ];


    if (
        module &&
        typeof module.activate ===
        "function"
    ) {

        try {

            module.activate();

        } catch (error) {

            console.warn(
                `Activation failed for ${pageId}:`,
                error
            );

        }

    }

}


/* =========================================================
   PAGE TRANSITION
   ========================================================= */

function animatePageTransition(
    oldPage,
    newPage
) {

    const oldElement =
        qs(
            `[data-page="${oldPage}"]`
        );


    const newElement =
        qs(
            `[data-page="${newPage}"]`
        );


    if (
        oldElement
    ) {

        oldElement.classList.add(
            "page-leaving"
        );


        window.setTimeout(
            () => {

                oldElement.classList.remove(
                    "page-leaving"
                );

            },
            300
        );

    }


    if (
        newElement
    ) {

        newElement.classList.add(
            "page-entering"
        );


        window.setTimeout(
            () => {

                newElement.classList.remove(
                    "page-entering"
                );

            },
            450
        );

    }

}


/* =========================================================
   PAGE EFFECT
   ========================================================= */

function triggerPageEffect(type) {

    if (
        !AppState.animations
    ) {

        return;

    }


    const app =
        DOM.app ||
        document.body;


    if (
        !app
    ) {

        return;

    }


    app.classList.remove(
        "effect-navigation",
        "effect-theme",
        "effect-refresh"
    );


    void app.offsetWidth;


    if (
        type ===
        "navigation"
    ) {

        app.classList.add(
            "effect-navigation"
        );

    }


    if (
        type ===
        "theme"
    ) {

        app.classList.add(
            "effect-theme"
        );

    }


    if (
        type ===
        "refresh"
    ) {

        app.classList.add(
            "effect-refresh"
        );

    }


    window.setTimeout(
        () => {

            app.classList.remove(
                "effect-navigation",
                "effect-theme",
                "effect-refresh"
            );

        },
        600
    );

}


/* =========================================================
   RIPPLE EFFECT
   ========================================================= */

function createRipple(
    element,
    event
) {

    if (
        !element ||
        !AppState.animations
    ) {

        return;

    }


    const rect =
        element.getBoundingClientRect();


    const ripple =
        document.createElement(
            "span"
        );


    ripple.className =
        "click-ripple";


    const size =
        Math.max(
            rect.width,
            rect.height
        );


    ripple.style.width =
        `${size}px`;


    ripple.style.height =
        `${size}px`;


    ripple.style.left =
        `${event.clientX - rect.left - size / 2}px`;


    ripple.style.top =
        `${event.clientY - rect.top - size / 2}px`;


    element.appendChild(
        ripple
    );


    window.setTimeout(
        () => {

            ripple.remove();

        },
        650
    );

}


/* =========================================================
   CLICK EFFECT
   ========================================================= */

function triggerClickEffect(element) {

    if (
        !element ||
        !AppState.animations
    ) {

        return;

    }


    element.classList.add(
        "clicked"
    );


    window.setTimeout(
        () => {

            element.classList.remove(
                "clicked"
            );

        },
        350
    );

}


/* =========================================================
   CLOSE OVERLAYS
   ========================================================= */

function closeOpenOverlays() {

    qsa(
        ".modal.open, .modal.active, .overlay.open, .drawer.open"
    ).forEach(
        element => {

            element.classList.remove(
                "open",
                "active"
            );

            element.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );

}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

async function updateDashboard() {

    let students =
        [];


    let attendance =
        [];


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getAllStudents ===
        "function"
    ) {

        try {

            students =
                await window.TeacherProDB.getAllStudents();

        } catch (error) {

            console.warn(
                "Could not load students:",
                error
            );

        }

    }


    const todayString =
        getDateKey(
            new Date()
        );


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getAttendanceByDate ===
        "function"
    ) {

        try {

            attendance =
                await window.TeacherProDB.getAttendanceByDate(
                    todayString
                );

        } catch (error) {

            console.warn(
                "Could not load attendance:",
                error
            );

        }

    }


    const activeStudents =
        students.filter(
            student =>
                student &&
                student.active !== false
        );


    const total =
        activeStudents.length;


    let present =
        0;

    let absent =
        0;

    let late =
        0;

    let excused =
        0;


    attendance.forEach(
        record => {

            if (
                !record
            ) {

                return;

            }


            if (
                record.status ===
                "present"
            ) {

                present++;

            } else if (
                record.status ===
                "absent"
            ) {

                absent++;

            } else if (
                record.status ===
                "late"
            ) {

                late++;

            } else if (
                record.status ===
                "excused"
            ) {

                excused++;

            }

        }
    );


    updateStatValue(
        "total-students",
        total
    );


    updateStatValue(
        "present-students",
        present
    );


    updateStatValue(
        "absent-students",
        absent
    );


    updateStatValue(
        "late-students",
        late
    );


    qsa(
        "[data-stat='excused-students']"
    ).forEach(
        element => {

            element.textContent =
                String(
                    excused
                );

        }
    );


    updateAttendancePercent(
        total,
        present
    );

}


/* =========================================================
   UPDATE STAT VALUE
   ========================================================= */

function updateStatValue(
    key,
    value
) {

    const elements =
        qsa(
            `[data-stat="${key}"]`
        );


    elements.forEach(
        element => {

            animateNumber(
                element,
                Number(value) || 0
            );

        }
    );

}


/* =========================================================
   ANIMATED NUMBER
   ========================================================= */

function animateNumber(
    element,
    target
) {

    if (
        !element
    ) {

        return;

    }


    if (
        !AppState.animations
    ) {

        element.textContent =
            String(target);

        return;

    }


    const current =
        Number(
            element.textContent
                .replace(
                    /[^0-9.-]/g,
                    ""
                )
        ) || 0;


    if (
        current ===
        target
    ) {

        element.textContent =
            String(target);

        return;

    }


    const difference =
        target -
        current;


    const duration =
        500;


    const start =
        performance.now();


    function frame(
        timestamp
    ) {

        const progress =
            Math.min(
                (
                    timestamp -
                    start
                ) /
                duration,
                1
            );


        const eased =
            1 -
            Math.pow(
                1 -
                progress,
                3
            );


        const value =
            Math.round(
                current +
                difference *
                eased
            );


        element.textContent =
            String(
                value
            );


        if (
            progress <
            1
        ) {

            requestAnimationFrame(
                frame
            );

        }

    }


    requestAnimationFrame(
        frame
    );

}


/* =========================================================
   ATTENDANCE PERCENTAGE
   ========================================================= */

function updateAttendancePercent(
    total,
    present
) {

    const elements =
        qsa(
            "[data-attendance-percent]"
        );


    const percentage =
        total > 0
            ? Math.round(
                (
                    present /
                    total
                ) *
                100
            )
            : 0;


    elements.forEach(
        element => {

            element.textContent =
                `${percentage}%`;

        }
    );


    qsa(
        "[data-attendance-progress]"
    ).forEach(
        element => {

            element.style.setProperty(
                "--progress",
                `${percentage}%`
            );

        }
    );

}


/* =========================================================
   UPDATE CURRENT CLASS
   ========================================================= */

async function updateCurrentClass() {

    if (
        !AppState.selectedClass
    ) {

        setDashboardText(
            "class",
            "—"
        );

        setDashboardText(
            "section",
            "—"
        );

        return;

    }


    setDashboardText(
        "class",
        AppState.selectedClass.name ||
        "—"
    );


    if (
        AppState.selectedSection
    ) {

        setDashboardText(
            "section",
            AppState.selectedSection.name ||
            "—"
        );

    }

}


/* =========================================================
   UPDATE CURRENT LESSON
   ========================================================= */

async function updateCurrentLesson() {

    const now =
        new Date();


    const day =
        getDayId(
            now
        );


    let lesson =
        null;


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getCurrentScheduleItem ===
        "function"
    ) {

        try {

            lesson =
                await window.TeacherProDB.getCurrentScheduleItem(
                    day,
                    now
                );

        } catch (error) {

            console.warn(
                "Could not get current lesson:",
                error
            );

        }

    }


    if (
        lesson
    ) {

        setDashboardText(
            "lesson",
            lesson.lesson ||
            lesson.subject ||
            "—"
        );


        setDashboardText(
            "topic",
            lesson.topic ||
            "—"
        );

    } else {

        setDashboardText(
            "lesson",
            "لا توجد حصة"
        );


        setDashboardText(
            "topic",
            "—"
        );

    }

}


/* =========================================================
   UPDATE REMINDER
   ========================================================= */

async function updateTodayReminder() {

    let reminder =
        null;


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getNextReminder ===
        "function"
    ) {

        try {

            reminder =
                await window.TeacherProDB.getNextReminder();

        } catch (error) {

            console.warn(
                "Could not load reminder:",
                error
            );

        }

    }


    const elements =
        qsa(
            APP_SELECTORS.reminder
        );


    elements.forEach(
        element => {

            if (
                reminder
            ) {

                element.textContent =
                    reminder.title ||
                    "لديك تذكير";

                element.dataset.active =
                    "true";

            } else {

                element.textContent =
                    "لا توجد تنبيهات قريبة";

                element.dataset.active =
                    "false";

            }

        }
    );

}


/* =========================================================
   UPDATE TODAY NOTE
   ========================================================= */

async function updateTodayNote() {

    let note =
        null;


    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.getPinnedNote ===
        "function"
    ) {

        try {

            note =
                await window.TeacherProDB.getPinnedNote();

        } catch (error) {

            console.warn(
                "Could not load pinned note:",
                error
            );

        }

    }


    const elements =
        qsa(
            APP_SELECTORS.todayNote
        );


    elements.forEach(
        element => {

            if (
                note
            ) {

                element.textContent =
                    note.content ||
                    note.title ||
                    "—";

            } else {

                element.textContent =
                    "لا توجد ملاحظة مثبتة";

            }

        }
    );

}


/* =========================================================
   DASHBOARD TEXT
   ========================================================= */

function setDashboardText(
    key,
    value
) {

    qsa(
        `[data-stat="${key}"]`
    ).forEach(
        element => {

            element.textContent =
                value;

        }
    );

}


/* =========================================================
   DATE KEY
   ========================================================= */

function getDateKey(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   GET DAY ID
   ========================================================= */

function getDayId(
    date
) {

    const days = [

        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"

    ];


    return (
        days[
            date.getDay()
        ] ||
        ""
    );

}


/* =========================================================
   AUTO REFRESH
   ========================================================= */

function startAutoRefresh() {

    if (
        !AppState.autoRefresh
    ) {

        return;

    }


    stopAutoRefresh();


    const dashboardInterval =
        window.setInterval(
            async () => {

                try {

                    await updateDashboard();

                    await updateCurrentLesson();

                    await updateTodayReminder();

                    await updateTodayNote();

                } catch (error) {

                    console.warn(
                        "Auto refresh error:",
                        error
                    );

                }

            },
            30000
        );


    AppState.intervalIds.push(
        dashboardInterval
    );


    const clockInterval =
        window.setInterval(
            () => {

                updateClock();

                updateDate();

            },
            1000
        );


    AppState.intervalIds.push(
        clockInterval
    );

}


/* =========================================================
   STOP AUTO REFRESH
   ========================================================= */

function stopAutoRefresh() {

    AppState.intervalIds.forEach(
        id => {

            window.clearInterval(
                id
            );

        }
    );


    AppState.intervalIds =
        [];

}


/* =========================================================
   VISIBILITY CHANGE
   ========================================================= */

function handleVisibilityChange() {

    if (
        document.hidden
    ) {

        stopAutoRefresh();

    } else {

        updateClock();

        updateDate();

        startAutoRefresh();

    }

}


/* =========================================================
   RESIZE
   ========================================================= */

function handleResize() {

    detectDevice();

}


/* =========================================================
   GLOBAL ERROR
   ========================================================= */

function handleGlobalError(
    event
) {

    console.error(
        "Teacher Pro error:",
        event.error ||
        event.message
    );

}


/* =========================================================
   PROMISE ERROR
   ========================================================= */

function handlePromiseError(
    event
) {

    console.error(
        "Unhandled Promise:",
        event.reason
    );

}


/* =========================================================
   VISUAL EFFECTS
   ========================================================= */

function initializeVisualEffects() {

    if (
        !AppState.animations
    ) {

        return;

    }


    initializeGlowCards();

    initializePulseIcons();

    initializeHoverEffects();

    initializeBackgroundEffects();

    initializeClickEffects();

}


/* =========================================================
   GLOW CARDS
   ========================================================= */

function initializeGlowCards() {

    qsa(
        "[data-glow-card]"
    ).forEach(
        card => {

            card.addEventListener(
                "pointermove",
                event => {

                    const rect =
                        card.getBoundingClientRect();


                    const x =
                        event.clientX -
                        rect.left;


                    const y =
                        event.clientY -
                        rect.top;


                    card.style.setProperty(
                        "--mouse-x",
                        `${x}px`
                    );


                    card.style.setProperty(
                        "--mouse-y",
                        `${y}px`
                    );

                },
                {
                    passive:
                        true
                }
            );


            card.addEventListener(
                "pointerleave",
                () => {

                    card.style.removeProperty(
                        "--mouse-x"
                    );

                    card.style.removeProperty(
                        "--mouse-y"
                    );

                }
            );

        }
    );

}


/* =========================================================
   PULSE ICONS
   ========================================================= */

function initializePulseIcons() {

    qsa(
        "[data-pulse]"
    ).forEach(
        element => {

            element.classList.add(
                "pulse-icon"
            );

        }
    );

}


/* =========================================================
   HOVER EFFECTS
   ========================================================= */

function initializeHoverEffects() {

    qsa(
        "[data-hover-effect]"
    ).forEach(
        element => {

            element.addEventListener(
                "mouseenter",
                () => {

                    element.classList.add(
                        "hover-active"
                    );

                }
            );


            element.addEventListener(
                "mouseleave",
                () => {

                    element.classList.remove(
                        "hover-active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   BACKGROUND EFFECTS
   ========================================================= */

function initializeBackgroundEffects() {

    if (
        !AppState.particles
    ) {

        return;

    }


    document.documentElement
        .classList.add(
            "particles-enabled"
        );

}


/* =========================================================
   CLICK EFFECTS
   ========================================================= */

function initializeClickEffects() {

    qsa(
        "[data-ripple]"
    ).forEach(
        element => {

            element.style.position =
                element.style.position ||
                "relative";

            element.style.overflow =
                "hidden";

        }
    );

}


/* =========================================================
   LOADING SCREEN
   ========================================================= */

async function hideLoadingScreen() {

    const duration =
        Math.max(
            700,
            Number(
                LOADING_CONFIG.minimumDuration
            ) || 1000
        );


    await wait(
        duration
    );


    if (
        DOM.loadingProgress
    ) {

        DOM.loadingProgress.style.width =
            "100%";

    }


    if (
        DOM.loadingPercent
    ) {

        DOM.loadingPercent.textContent =
            "100%";

    }


    if (
        DOM.loadingSubtitle
    ) {

        DOM.loadingSubtitle.textContent =
            "تم تجهيز النظام";

    }


    await wait(
        350
    );


    if (
        DOM.loadingScreen
    ) {

        DOM.loadingScreen.classList.add(
            "loading-complete"
        );


        window.setTimeout(
            () => {

                DOM.loadingScreen.classList.add(
                    "hidden"
                );


                DOM.loadingScreen.setAttribute(
                    "aria-hidden",
                    "true"
                );


                AppState.loading =
                    false;

            },
            700
        );

    } else {

        AppState.loading =
            false;

    }


    startAutoRefresh();

}


/* =========================================================
   LOADING PROGRESS
   ========================================================= */

function setLoadingProgress(
    percentage,
    message
) {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    percentage
                ) || 0
            )
        );


    if (
        DOM.loadingProgress
    ) {

        DOM.loadingProgress.style.width =
            `${value}%`;

    }


    if (
        DOM.loadingPercent
    ) {

        DOM.loadingPercent.textContent =
            `${Math.round(value)}%`;

    }


    if (
        DOM.loadingSubtitle &&
        message
    ) {

        DOM.loadingSubtitle.textContent =
            message;

    }

}


/* =========================================================
   WAIT HELPER
   ========================================================= */

function wait(
    milliseconds
) {

    return new Promise(
        resolve => {

            window.setTimeout(
                resolve,
                milliseconds
            );

        }
    );

}


/* =========================================================
   REFRESH CURRENT PAGE
   ========================================================= */

async function refreshCurrentPage() {

    const page =
        AppState.currentPage;


    triggerPageEffect(
        "refresh"
    );


    await updateDashboard();

    await updateCurrentClass();

    await updateCurrentLesson();

    await updateTodayReminder();

    await updateTodayNote();


    callPageActivation(
        page
    );

}


/* =========================================================
   SET SELECTED CLASS
   ========================================================= */

function setSelectedClass(
    classData
) {

    AppState.selectedClass =
        classData || null;


    AppState.selectedSection =
        null;


    updateCurrentClass();

    updateCurrentLesson();

}


/* =========================================================
   SET SELECTED SECTION
   ========================================================= */

function setSelectedSection(
    sectionData
) {

    AppState.selectedSection =
        sectionData || null;


    updateCurrentClass();

    updateCurrentLesson();

}


/* =========================================================
   SET SELECTED STUDENT
   ========================================================= */

function setSelectedStudent(
    studentData
) {

    AppState.selectedStudent =
        studentData || null;


    qsa(
        "[data-selected-student]"
    ).forEach(
        element => {

            element.textContent =
                studentData &&
                studentData.fullName
                    ? studentData.fullName
                    : "لم يتم اختيار طالب";

        }
    );

}


/* =========================================================
   GET SELECTED CLASS
   ========================================================= */

function getSelectedClass() {

    return AppState.selectedClass;

}


/* =========================================================
   GET SELECTED SECTION
   ========================================================= */

function getSelectedSection() {

    return AppState.selectedSection;

}


/* =========================================================
   GET SELECTED STUDENT
   ========================================================= */

function getSelectedStudent() {

    return AppState.selectedStudent;

}


/* =========================================================
   ENABLE/DISABLE ANIMATIONS
   ========================================================= */

function setAnimationsEnabled(
    enabled
) {

    AppState.animations =
        Boolean(enabled);


    document.documentElement
        .classList.toggle(
            "animations-disabled",
            !AppState.animations
        );

}


/* =========================================================
   ENABLE/DISABLE SOUND
   ========================================================= */

function setSoundsEnabled(
    enabled
) {

    AppState.sounds =
        Boolean(enabled);

}


/* =========================================================
   ENABLE/DISABLE PARTICLES
   ========================================================= */

function setParticlesEnabled(
    enabled
) {

    AppState.particles =
        Boolean(enabled);


    document.documentElement
        .classList.toggle(
            "particles-disabled",
            !AppState.particles
        );

}


/* =========================================================
   ENABLE/DISABLE GLASS
   ========================================================= */

function setGlassEnabled(
    enabled
) {

    AppState.glass =
        Boolean(enabled);


    document.documentElement
        .classList.toggle(
            "glass-disabled",
            !AppState.glass
        );

}


/* =========================================================
   SAVE SETTING BRIDGE
   ========================================================= */

async function saveSetting(
    key,
    value
) {

    if (
        window.TeacherProDB &&
        typeof window.TeacherProDB.saveSetting ===
        "function"
    ) {

        try {

            await window.TeacherProDB.saveSetting(
                key,
                value
            );

        } catch (error) {

            console.warn(
                `Could not save setting ${key}:`,
                error
            );

        }

    }

}


/* =========================================================
   PAGE TITLE
   ========================================================= */

function updatePageTitle(
    pageId
) {

    const page =
        getNavigationItem(
            pageId
        );


    if (
        !page
    ) {

        document.title =
            AppState.siteName;

        return;

    }


    document.title =
        `${page.title} | ${AppState.siteName}`;

}


/* =========================================================
   ENHANCED NAVIGATION
   ========================================================= */

function navigateToPage(
    pageId
) {

    const result =
        navigateTo(
            pageId
        );


    if (
        result
    ) {

        updatePageTitle(
            pageId
        );

    }


    return result;

}


/* =========================================================
   APPLICATION API
   ========================================================= */

window.TeacherProApp = {

    state:
        AppState,

    dom:
        DOM,

    selectors:
        APP_SELECTORS,

    start:
        startApplication,

    navigate:
        navigateToPage,

    refresh:
        refreshCurrentPage,

    changeTheme:
        changeTheme,

    applyTheme:
        applyTheme,

    updateClock:
        updateClock,

    updateDate:
        updateDate,

    updateDashboard:
        updateDashboard,

    setSelectedClass:
        setSelectedClass,

    setSelectedSection:
        setSelectedSection,

    setSelectedStudent:
        setSelectedStudent,

    getSelectedClass:
        getSelectedClass,

    getSelectedSection:
        getSelectedSection,

    getSelectedStudent:
        getSelectedStudent,

    setAnimationsEnabled:
        setAnimationsEnabled,

    setSoundsEnabled:
        setSoundsEnabled,

    setParticlesEnabled:
        setParticlesEnabled,

    setGlassEnabled:
        setGlassEnabled,

    saveSetting:
        saveSetting,

    setLoadingProgress:
        setLoadingProgress,

    createRipple:
        createRipple,

    triggerPageEffect:
        triggerPageEffect,

    getDateKey:
        getDateKey,

    formatClock:
        formatClock,

    formatArabicDate:
        formatArabicDate

};


/* =========================================================
   GLOBAL SHORTCUTS
   ========================================================= */

window.navigateTo =
    navigateToPage;

window.changeTheme =
    changeTheme;

window.updateDashboard =
    updateDashboard;

window.updateClock =
    updateClock;

window.updateDate =
    updateDate;

window.refreshApplication =
    refreshCurrentPage;


/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            startApplication();

        },
        {
            once:
                true
        }
    );

} else {

    startApplication();

}


/* =========================================================
   END OF APP.JS
   ========================================================= */