/* =========================================================
   TEACHER PRO
   themes.js

   نظام الثيمات الفخم للموقع
   - 10 ثيمات
   - حفظ الثيم المختار في IndexedDB
   - تطبيق مباشر بدون تحديث الصفحة
   - دعم البطاقات الزجاجية
   - دعم الهاتف والحاسوب
   - انتقالات وتأثيرات مضيئة
   ========================================================= */

"use strict";


/* =========================================================
   الوحدة الرئيسية
   ========================================================= */

const ThemesModule = {

    initialized: false,

    currentThemeId: "red-green",

    themes: [],

    databaseKey: "teacher_pro_theme_settings",

    selectors: {

        page: "#themesPage",

        grid: "#themesGrid",

        currentThemeName: "#currentThemeName",

        currentThemePreview: "#currentThemePreview",

        themeCount: "#themeCount",

        resetButton: "#resetThemeBtn"

    }

};


/* =========================================================
   تعريف الثيمات
   ========================================================= */

ThemesModule.defaultThemes = [

    {
        id: "red-green",

        name: "الأحمر والأخضر",

        icon: "🔥",

        description:
            "ثيم قوي يجمع الأحمر الفخم مع الأخضر المضيء.",

        colors: {
            primary: "#ff1f3d",
            primaryRgb: "255, 31, 61",

            secondary: "#00d084",
            secondaryRgb: "0, 208, 132",

            accent: "#ffb703",
            accentRgb: "255, 183, 3",

            background: "#090b10",
            backgroundSecondary: "#11151d",

            glass: "rgba(18, 22, 30, 0.62)",
            glassStrong: "rgba(18, 22, 30, 0.84)",

            text: "#ffffff",
            textSecondary: "#b8c0cc",

            border: "rgba(255,255,255,0.13)",

            shadow: "rgba(0,0,0,0.45)"
        }
    },


    {
        id: "purple-pink",

        name: "البنفسجي والوردي",

        icon: "💜",

        description:
            "مزيج عصري فاخر من البنفسجي والوردي.",

        colors: {
            primary: "#8b5cf6",
            primaryRgb: "139, 92, 246",

            secondary: "#ec4899",
            secondaryRgb: "236, 72, 153",

            accent: "#f472b6",
            accentRgb: "244, 114, 182",

            background: "#100a1b",
            backgroundSecondary: "#1b1027",

            glass: "rgba(31, 18, 47, 0.62)",
            glassStrong: "rgba(31, 18, 47, 0.84)",

            text: "#ffffff",
            textSecondary: "#d7c9e8",

            border: "rgba(255,255,255,0.14)",

            shadow: "rgba(0,0,0,0.48)"
        }
    },


    {
        id: "gold-red",

        name: "الذهبي والأحمر",

        icon: "👑",

        description:
            "ثيم ملكي فاخر باللون الذهبي والأحمر.",

        colors: {
            primary: "#d4af37",
            primaryRgb: "212, 175, 55",

            secondary: "#d62839",
            secondaryRgb: "214, 40, 57",

            accent: "#ffd166",
            accentRgb: "255, 209, 102",

            background: "#100d08",
            backgroundSecondary: "#1b1510",

            glass: "rgba(35, 27, 16, 0.65)",
            glassStrong: "rgba(35, 27, 16, 0.87)",

            text: "#fff9eb",
            textSecondary: "#d8c9a5",

            border: "rgba(212,175,55,0.24)",

            shadow: "rgba(0,0,0,0.52)"
        }
    },


    {
        id: "red-blue",

        name: "الأحمر والأزرق",

        icon: "⚡",

        description:
            "مزيج ديناميكي بين الأحمر القوي والأزرق.",

        colors: {
            primary: "#ef233c",
            primaryRgb: "239, 35, 60",

            secondary: "#3a86ff",
            secondaryRgb: "58, 134, 255",

            accent: "#72ddf7",
            accentRgb: "114, 221, 247",

            background: "#090d16",
            backgroundSecondary: "#10192a",

            glass: "rgba(16, 24, 41, 0.63)",
            glassStrong: "rgba(16, 24, 41, 0.86)",

            text: "#ffffff",
            textSecondary: "#c3cce0",

            border: "rgba(255,255,255,0.13)",

            shadow: "rgba(0,0,0,0.5)"
        }
    },


    {
        id: "black-purple",

        name: "الأسود والبنفسجي",

        icon: "🌌",

        description:
            "ثيم داكن جداً بلمسات بنفسجية مضيئة.",

        colors: {
            primary: "#7c3aed",
            primaryRgb: "124, 58, 237",

            secondary: "#c026d3",
            secondaryRgb: "192, 38, 211",

            accent: "#a78bfa",
            accentRgb: "167, 139, 250",

            background: "#050505",
            backgroundSecondary: "#0d0913",

            glass: "rgba(16, 10, 24, 0.7)",
            glassStrong: "rgba(16, 10, 24, 0.9)",

            text: "#ffffff",
            textSecondary: "#c7b9d6",

            border: "rgba(167,139,250,0.17)",

            shadow: "rgba(0,0,0,0.7)"
        }
    },


    {
        id: "brown-white",

        name: "الجوزي والأبيض",

        icon: "☕",

        description:
            "تصميم هادئ وفاخر بألوان الجوز والأبيض.",

        colors: {
            primary: "#8b5e3c",
            primaryRgb: "139, 94, 60",

            secondary: "#f5f0e8",
            secondaryRgb: "245, 240, 232",

            accent: "#c99a6b",
            accentRgb: "201, 154, 107",

            background: "#17120f",
            backgroundSecondary: "#241b16",

            glass: "rgba(55, 43, 35, 0.62)",
            glassStrong: "rgba(55, 43, 35, 0.85)",

            text: "#ffffff",
            textSecondary: "#ded3c9",

            border: "rgba(245,240,232,0.15)",

            shadow: "rgba(0,0,0,0.5)"
        }
    },


    {
        id: "cyan-green",

        name: "السماوي والأخضر",

        icon: "🌊",

        description:
            "ألوان منعشة تجمع السماوي والأخضر.",

        colors: {
            primary: "#06b6d4",
            primaryRgb: "6, 182, 212",

            secondary: "#22c55e",
            secondaryRgb: "34, 197, 94",

            accent: "#a3e635",
            accentRgb: "163, 230, 53",

            background: "#071517",
            backgroundSecondary: "#0c2223",

            glass: "rgba(10, 39, 39, 0.63)",
            glassStrong: "rgba(10, 39, 39, 0.86)",

            text: "#ffffff",
            textSecondary: "#bfdbd9",

            border: "rgba(255,255,255,0.13)",

            shadow: "rgba(0,0,0,0.5)"
        }
    },


    {
        id: "green-purple",

        name: "الأخضر والبنفسجي",

        icon: "✨",

        description:
            "ثيم متوازن بين الأخضر المضيء والبنفسجي.",

        colors: {
            primary: "#22c55e",
            primaryRgb: "34, 197, 94",

            secondary: "#8b5cf6",
            secondaryRgb: "139, 92, 246",

            accent: "#d8b4fe",
            accentRgb: "216, 180, 254",

            background: "#08130e",
            backgroundSecondary: "#101c1a",

            glass: "rgba(18, 34, 29, 0.64)",
            glassStrong: "rgba(18, 34, 29, 0.86)",

            text: "#ffffff",
            textSecondary: "#c7d7d0",

            border: "rgba(255,255,255,0.13)",

            shadow: "rgba(0,0,0,0.52)"
        }
    },


    {
        id: "blue-maroon",

        name: "الأزرق والماروني",

        icon: "🔷",

        description:
            "مزيج فاخر بين الأزرق البارد والماروني.",

        colors: {
            primary: "#2563eb",
            primaryRgb: "37, 99, 235",

            secondary: "#7f1d1d",
            secondaryRgb: "127, 29, 29",

            accent: "#60a5fa",
            accentRgb: "96, 165, 250",

            background: "#080b14",
            backgroundSecondary: "#141320",

            glass: "rgba(18, 21, 37, 0.66)",
            glassStrong: "rgba(18, 21, 37, 0.88)",

            text: "#ffffff",
            textSecondary: "#c7d0e0",

            border: "rgba(255,255,255,0.12)",

            shadow: "rgba(0,0,0,0.55)"
        }
    },


    {
        id: "orange-green",

        name: "البرتقالي والأخضر",

        icon: "🍊",

        description:
            "ثيم حيوي ومضيء بالبرتقالي والأخضر.",

        colors: {
            primary: "#f97316",
            primaryRgb: "249, 115, 22",

            secondary: "#16a34a",
            secondaryRgb: "22, 163, 74",

            accent: "#facc15",
            accentRgb: "250, 204, 21",

            background: "#120d08",
            backgroundSecondary: "#1b1910",

            glass: "rgba(38, 31, 17, 0.65)",
            glassStrong: "rgba(38, 31, 17, 0.87)",

            text: "#ffffff",
            textSecondary: "#d8d0bc",

            border: "rgba(255,255,255,0.13)",

            shadow: "rgba(0,0,0,0.5)"
        }
    }

];


/* =========================================================
   تشغيل القسم
   ========================================================= */

ThemesModule.init = async function () {

    try {

        if (this.initialized) {

            this.render();

            return;

        }


        this.initialized = true;


        this.themes = [
            ...this.defaultThemes
        ];


        this.bindEvents();


        await this.loadSavedTheme();


        this.applyTheme(
            this.currentThemeId,
            false
        );


        this.render();


    } catch (error) {

        console.error(
            "ThemesModule initialization error:",
            error
        );

    }

};


/* =========================================================
   ربط الأحداث
   ========================================================= */

ThemesModule.bindEvents = function () {

    const resetButton =
        document.querySelector(
            this.selectors.resetButton
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            async () => {

                await this.resetTheme();

            }
        );

    }


    document.addEventListener(
        "themes:apply",
        async event => {

            const themeId =
                event.detail?.themeId;


            if (themeId) {

                await this.selectTheme(
                    themeId
                );

            }

        }
    );

};


/* =========================================================
   تحميل الثيم المحفوظ
   ========================================================= */

ThemesModule.loadSavedTheme =
async function () {

    try {

        let settings = null;


        if (
            window.TeacherDB &&
            typeof TeacherDB.get === "function"
        ) {

            settings =
                await TeacherDB.get(
                    "settings",
                    this.databaseKey
                );

        }


        if (
            !settings &&
            window.DB &&
            typeof DB.get === "function"
        ) {

            settings =
                await DB.get(
                    "settings",
                    this.databaseKey
                );

        }


        if (
            settings &&
            settings.themeId
        ) {

            this.currentThemeId =
                settings.themeId;


            return;

        }


        const localTheme =
            localStorage.getItem(
                this.databaseKey
            );


        if (localTheme) {

            this.currentThemeId =
                localTheme;

        }


    } catch (error) {

        console.error(
            "Error loading saved theme:",
            error
        );

    }

};


/* =========================================================
   حفظ الثيم
   ========================================================= */

ThemesModule.saveTheme =
async function (themeId) {

    const data = {

        id:
            this.databaseKey,

        themeId,

        updatedAt:
            new Date().toISOString()

    };


    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.put === "function"
        ) {

            await TeacherDB.put(
                "settings",
                data
            );

        } else if (
            window.DB &&
            typeof DB.put === "function"
        ) {

            await DB.put(
                "settings",
                data
            );

        }


        localStorage.setItem(
            this.databaseKey,
            themeId
        );


        return true;


    } catch (error) {

        console.error(
            "Theme save error:",
            error
        );


        try {

            localStorage.setItem(
                this.databaseKey,
                themeId
            );

        } catch (localError) {

            console.error(
                "Local theme save error:",
                localError
            );

        }


        return false;

    }

};


/* =========================================================
   اختيار ثيم
   ========================================================= */

ThemesModule.selectTheme =
async function (themeId) {

    const theme =
        this.getThemeById(
            themeId
        );


    if (!theme) {

        return false;

    }


    this.currentThemeId =
        themeId;


    this.applyTheme(
        themeId,
        true
    );


    await this.saveTheme(
        themeId
    );


    this.render();


    this.emitThemeChange(
        theme
    );


    this.showMessage(
        `تم تطبيق ثيم ${theme.name}`,
        "success"
    );


    return true;

};


/* =========================================================
   تطبيق الثيم
   ========================================================= */

ThemesModule.applyTheme =
function (
    themeId,
    animate = true
) {

    const theme =
        this.getThemeById(
            themeId
        );


    if (!theme) {

        return;

    }


    const root =
        document.documentElement;


    const colors =
        theme.colors;


    if (animate) {

        document.body.classList.add(
            "theme-changing"
        );

    }


    root.style.setProperty(
        "--primary",
        colors.primary
    );


    root.style.setProperty(
        "--primary-rgb",
        colors.primaryRgb
    );


    root.style.setProperty(
        "--secondary",
        colors.secondary
    );


    root.style.setProperty(
        "--secondary-rgb",
        colors.secondaryRgb
    );


    root.style.setProperty(
        "--accent",
        colors.accent
    );


    root.style.setProperty(
        "--accent-rgb",
        colors.accentRgb
    );


    root.style.setProperty(
        "--background",
        colors.background
    );


    root.style.setProperty(
        "--background-secondary",
        colors.backgroundSecondary
    );


    root.style.setProperty(
        "--glass",
        colors.glass
    );


    root.style.setProperty(
        "--glass-strong",
        colors.glassStrong
    );


    root.style.setProperty(
        "--text",
        colors.text
    );


    root.style.setProperty(
        "--text-secondary",
        colors.textSecondary
    );


    root.style.setProperty(
        "--border",
        colors.border
    );


    root.style.setProperty(
        "--shadow",
        colors.shadow
    );


    root.style.setProperty(
        "--theme-gradient",

        `linear-gradient(
            135deg,
            ${colors.primary},
            ${colors.secondary}
        )`
    );


    root.style.setProperty(
        "--theme-glow",

        `0 0 30px rgba(
            ${colors.primaryRgb},
            0.35
        )`
    );


    document.body.dataset.theme =
        themeId;


    root.dataset.theme =
        themeId;


    this.currentThemeId =
        themeId;


    if (animate) {

        this.createThemeFlash(
            theme
        );


        setTimeout(
            () => {

                document.body.classList.remove(
                    "theme-changing"
                );

            },
            700
        );

    }

};


/* =========================================================
   تأثير تغيير الثيم
   ========================================================= */

ThemesModule.createThemeFlash =
function (theme) {

    const oldFlash =
        document.querySelector(
            ".theme-change-flash"
        );


    if (oldFlash) {

        oldFlash.remove();

    }


    const flash =
        document.createElement(
            "div"
        );


    flash.className =
        "theme-change-flash";


    flash.style.setProperty(
        "--flash-primary",
        theme.colors.primary
    );


    flash.style.setProperty(
        "--flash-secondary",
        theme.colors.secondary
    );


    document.body.appendChild(
        flash
    );


    requestAnimationFrame(
        () => {

            flash.classList.add(
                "active"
            );

        }
    );


    setTimeout(
        () => {

            flash.classList.remove(
                "active"
            );


            setTimeout(
                () => {

                    flash.remove();

                },
                700
            );

        },
        300
    );

};


/* =========================================================
   إعادة الثيم الافتراضي
   ========================================================= */

ThemesModule.resetTheme =
async function () {

    const defaultTheme =
        this.defaultThemes[0];


    this.currentThemeId =
        defaultTheme.id;


    this.applyTheme(
        defaultTheme.id,
        true
    );


    await this.saveTheme(
        defaultTheme.id
    );


    this.render();


    this.emitThemeChange(
        defaultTheme
    );


    this.showMessage(
        "تمت إعادة الثيم الافتراضي",
        "success"
    );

};


/* =========================================================
   الحصول على ثيم
   ========================================================= */

ThemesModule.getThemeById =
function (themeId) {

    return this.themes.find(
        theme =>
            theme.id === themeId
    ) || null;

};


/* =========================================================
   الحصول على الثيم الحالي
   ========================================================= */

ThemesModule.getCurrentTheme =
function () {

    return this.getThemeById(
        this.currentThemeId
    );

};


/* =========================================================
   رسم صفحة الثيمات
   ========================================================= */

ThemesModule.render =
function () {

    this.renderThemeGrid();


    this.updateCurrentThemeInfo();


    this.updateThemeCount();

};


/* =========================================================
   رسم شبكة الثيمات
   ========================================================= */

ThemesModule.renderThemeGrid =
function () {

    const grid =
        document.querySelector(
            this.selectors.grid
        );


    if (!grid) {

        return;

    }


    grid.innerHTML =
        "";


    this.themes.forEach(
        theme => {

            const card =
                this.createThemeCard(
                    theme
                );


            grid.appendChild(
                card
            );

        }
    );

};


/* =========================================================
   إنشاء كارد ثيم
   ========================================================= */

ThemesModule.createThemeCard =
function (theme) {

    const card =
        document.createElement(
            "article"
        );


    const isActive =
        theme.id ===
        this.currentThemeId;


    card.className =
        [
            "theme-card",
            "glass-card",
            isActive
                ? "active"
                : ""
        ]
            .filter(Boolean)
            .join(" ");


    card.dataset.themeId =
        theme.id;


    card.innerHTML = `

        <div class="theme-card-background">

            <div
                class="theme-color-orb orb-one"
                style="
                    background:
                    ${theme.colors.primary};
                "
            ></div>

            <div
                class="theme-color-orb orb-two"
                style="
                    background:
                    ${theme.colors.secondary};
                "
            ></div>

        </div>


        <div class="theme-card-content">

            <div class="theme-card-header">

                <div
                    class="theme-icon"
                    style="
                        box-shadow:
                        0 0 25px
                        rgba(
                            ${theme.colors.primaryRgb},
                            0.35
                        );
                    "
                >
                    ${theme.icon}
                </div>


                ${
                    isActive
                        ? `
                            <div class="active-theme-badge">
                                ✓ مفعل
                            </div>
                        `
                        : ""
                }

            </div>


            <div class="theme-preview">

                <div
                    class="theme-preview-primary"
                    style="
                        background:
                        ${theme.colors.primary};
                    "
                ></div>

                <div
                    class="theme-preview-secondary"
                    style="
                        background:
                        ${theme.colors.secondary};
                    "
                ></div>

                <div
                    class="theme-preview-accent"
                    style="
                        background:
                        ${theme.colors.accent};
                    "
                ></div>

            </div>


            <h3>
                ${this.escapeHTML(theme.name)}
            </h3>


            <p>
                ${this.escapeHTML(theme.description)}
            </p>


            <button
                type="button"
                class="theme-select-button"
                data-theme-id="${theme.id}"
            >

                ${
                    isActive
                        ? "الثيم الحالي ✓"
                        : "تطبيق الثيم"
                }

            </button>

        </div>

    `;


    card.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    ".theme-select-button"
                );


            if (!button) {

                return;

            }


            event.preventDefault();


            const themeId =
                button.dataset.themeId;


            await this.selectTheme(
                themeId
            );

        }
    );


    return card;

};


/* =========================================================
   تحديث معلومات الثيم الحالي
   ========================================================= */

ThemesModule.updateCurrentThemeInfo =
function () {

    const theme =
        this.getCurrentTheme();


    if (!theme) {

        return;

    }


    const nameElement =
        document.querySelector(
            this.selectors.currentThemeName
        );


    if (nameElement) {

        nameElement.textContent =
            `${theme.icon} ${theme.name}`;

    }


    const preview =
        document.querySelector(
            this.selectors.currentThemePreview
        );


    if (preview) {

        preview.innerHTML = `

            <div
                class="current-theme-color"
                style="
                    background:
                    ${theme.colors.primary};
                "
            ></div>

            <div
                class="current-theme-color"
                style="
                    background:
                    ${theme.colors.secondary};
                "
            ></div>

            <div
                class="current-theme-color"
                style="
                    background:
                    ${theme.colors.accent};
                "
            ></div>

        `;

    }

};


/* =========================================================
   تحديث عدد الثيمات
   ========================================================= */

ThemesModule.updateThemeCount =
function () {

    const count =
        document.querySelector(
            this.selectors.themeCount
        );


    if (!count) {

        return;

    }


    count.textContent =
        this.themes.length;

};


/* =========================================================
   تغيير الثيم من الخارج
   ========================================================= */

ThemesModule.setTheme =
async function (themeId) {

    return await this.selectTheme(
        themeId
    );

};


/* =========================================================
   Event عند تغيير الثيم
   ========================================================= */

ThemesModule.emitThemeChange =
function (theme) {

    document.dispatchEvent(

        new CustomEvent(
            "theme:changed",
            {

                detail: {

                    themeId:
                        theme.id,

                    themeName:
                        theme.name,

                    theme:
                        theme

                }

            }
        )

    );

};


/* =========================================================
   إنشاء CSS ديناميكي للتأثيرات
   ========================================================= */

ThemesModule.injectDynamicStyles =
function () {

    if (
        document.querySelector(
            "#themesModuleDynamicStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "themesModuleDynamicStyles";


    style.textContent = `

        :root {

            --primary: #ff1f3d;

            --secondary: #00d084;

            --accent: #ffb703;

            --background: #090b10;

            --background-secondary: #11151d;

            --glass:
                rgba(18, 22, 30, 0.62);

            --glass-strong:
                rgba(18, 22, 30, 0.84);

            --text:
                #ffffff;

            --text-secondary:
                #b8c0cc;

            --border:
                rgba(255,255,255,0.13);

            --shadow:
                rgba(0,0,0,0.45);

        }


        body {

            background:
                radial-gradient(
                    circle at top right,
                    rgba(
                        var(--primary-rgb),
                        0.12
                    ),
                    transparent 35%
                ),

                radial-gradient(
                    circle at bottom left,
                    rgba(
                        var(--secondary-rgb),
                        0.10
                    ),
                    transparent 40%
                ),

                var(--background);

            color:
                var(--text);

            transition:
                background 0.6s ease,
                color 0.4s ease;

        }


        .glass-card {

            background:
                var(--glass);

            border:
                1px solid
                var(--border);

            box-shadow:
                0 15px 45px
                var(--shadow);

            backdrop-filter:
                blur(18px);

            -webkit-backdrop-filter:
                blur(18px);

            transition:
                transform 0.3s ease,
                border-color 0.4s ease,
                box-shadow 0.4s ease,
                background 0.5s ease;

        }


        .glass-card:hover {

            border-color:
                rgba(
                    var(--primary-rgb),
                    0.45
                );

            box-shadow:
                0 18px 55px
                var(--shadow),

                0 0 25px
                rgba(
                    var(--primary-rgb),
                    0.08
                );

        }


        .theme-card {

            position:
                relative;

            overflow:
                hidden;

            min-height:
                260px;

            cursor:
                pointer;

            border-radius:
                24px;

        }


        .theme-card:hover {

            transform:
                translateY(-7px);

        }


        .theme-card.active {

            border-color:
                var(--primary);

            box-shadow:
                0 0 0 1px
                var(--primary),

                0 20px 60px
                var(--shadow),

                0 0 35px
                rgba(
                    var(--primary-rgb),
                    0.25
                );

        }


        .theme-card-background {

            position:
                absolute;

            inset:
                0;

            overflow:
                hidden;

            pointer-events:
                none;

            opacity:
                0.25;

        }


        .theme-color-orb {

            position:
                absolute;

            width:
                180px;

            height:
                180px;

            border-radius:
                50%;

            filter:
                blur(45px);

            animation:
                themeOrbFloat
                7s ease-in-out
                infinite;

        }


        .orb-one {

            top:
                -50px;

            right:
                -45px;

        }


        .orb-two {

            bottom:
                -60px;

            left:
                -45px;

            animation-delay:
                -3s;

        }


        @keyframes themeOrbFloat {

            0%,
            100% {

                transform:
                    translate(0, 0)
                    scale(1);

            }

            50% {

                transform:
                    translate(
                        20px,
                        -15px
                    )
                    scale(1.15);

            }

        }


        .theme-card-content {

            position:
                relative;

            z-index:
                2;

            padding:
                22px;

            height:
                100%;

            display:
                flex;

            flex-direction:
                column;

        }


        .theme-card-header {

            display:
                flex;

            justify-content:
                space-between;

            align-items:
                center;

        }


        .theme-icon {

            width:
                52px;

            height:
                52px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            border-radius:
                16px;

            font-size:
                26px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.08
                );

        }


        .active-theme-badge {

            padding:
                7px 12px;

            border-radius:
                20px;

            background:
                rgba(
                    var(--primary-rgb),
                    0.16
                );

            border:
                1px solid
                rgba(
                    var(--primary-rgb),
                    0.45
                );

            font-size:
                12px;

            color:
                var(--text);

        }


        .theme-preview {

            display:
                flex;

            gap:
                10px;

            margin:
                22px 0;

        }


        .theme-preview-primary,
        .theme-preview-secondary,
        .theme-preview-accent {

            flex:
                1;

            height:
                34px;

            border-radius:
                12px;

            box-shadow:
                inset
                0 0 10px
                rgba(
                    255,
                    255,
                    255,
                    0.15
                );

        }


        .theme-card h3 {

            margin:
                0 0 8px;

            color:
                var(--text);

            font-size:
                18px;

        }


        .theme-card p {

            margin:
                0;

            color:
                var(--text-secondary);

            line-height:
                1.7;

            font-size:
                13px;

        }


        .theme-select-button {

            width:
                100%;

            margin-top:
                auto;

            padding:
                12px 18px;

            border:
                1px solid
                rgba(
                    var(--primary-rgb),
                    0.35
                );

            border-radius:
                14px;

            cursor:
                pointer;

            color:
                var(--text);

            background:
                linear-gradient(
                    135deg,
                    rgba(
                        var(--primary-rgb),
                        0.22
                    ),
                    rgba(
                        var(--secondary-rgb),
                        0.18
                    )
                );

            transition:
                transform 0.25s ease,
                box-shadow 0.25s ease,
                background 0.25s ease;

        }


        .theme-select-button:hover {

            transform:
                translateY(-2px);

            box-shadow:
                0 8px 25px
                rgba(
                    var(--primary-rgb),
                    0.25
                );

        }


        .theme-change-flash {

            position:
                fixed;

            inset:
                0;

            z-index:
                999999;

            pointer-events:
                none;

            opacity:
                0;

            background:
                radial-gradient(
                    circle at center,
                    var(--flash-primary),
                    transparent 45%
                ),

                radial-gradient(
                    circle at 70% 30%,
                    var(--flash-secondary),
                    transparent 40%
                );

            mix-blend-mode:
                screen;

            transition:
                opacity 0.5s ease;

        }


        .theme-change-flash.active {

            opacity:
                0.18;

        }


        .theme-changing * {

            transition:
                background 0.45s ease,
                color 0.35s ease,
                border-color 0.4s ease,
                box-shadow 0.45s ease !important;

        }


        .current-theme-color {

            width:
                25px;

            height:
                25px;

            border-radius:
                50%;

            display:
                inline-block;

            margin:
                0 4px;

            box-shadow:
                0 0 12px
                rgba(
                    255,
                    255,
                    255,
                    0.15
                );

        }


        @media
        (
            max-width:
            600px
        ) {

            .theme-card {

                min-height:
                    230px;

            }


            .theme-card-content {

                padding:
                    18px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

};


/* =========================================================
   Toast
   ========================================================= */

ThemesModule.showMessage =
function (
    message,
    type = "info"
) {

    if (
        window.App &&
        typeof App.showToast === "function"
    ) {

        App.showToast(
            message,
            type
        );


        return;

    }


    if (
        typeof window.showToast ===
        "function"
    ) {

        window.showToast(
            message,
            type
        );


        return;

    }


    console.log(
        `[${type}] ${message}`
    );

};


/* =========================================================
   حماية النص من HTML
   ========================================================= */

ThemesModule.escapeHTML =
function (value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        String(value);


    return element.innerHTML;

};


/* =========================================================
   تصدير إعدادات الثيم
   ========================================================= */

ThemesModule.exportCurrentTheme =
function () {

    const theme =
        this.getCurrentTheme();


    if (!theme) {

        return null;

    }


    return {

        id:
            theme.id,

        name:
            theme.name,

        colors:
            {
                ...theme.colors
            }

    };

};


/* =========================================================
   تطبيق إعدادات محفوظة خارجياً
   ========================================================= */

ThemesModule.restoreTheme =
async function (
    settings
) {

    if (
        !settings ||
        !settings.themeId
    ) {

        return false;

    }


    const theme =
        this.getThemeById(
            settings.themeId
        );


    if (!theme) {

        return false;

    }


    this.currentThemeId =
        theme.id;


    this.applyTheme(
        theme.id,
        false
    );


    await this.saveTheme(
        theme.id
    );


    this.render();


    return true;

};


/* =========================================================
   الحصول على قائمة الثيمات
   ========================================================= */

ThemesModule.getThemes =
function () {

    return [
        ...this.themes
    ];

};


/* =========================================================
   تدمير الوحدة
   ========================================================= */

ThemesModule.destroy =
function () {

    this.initialized =
        false;

};


/* =========================================================
   جعل الوحدة متاحة لكل ملفات الموقع
   ========================================================= */

window.ThemesModule =
    ThemesModule;


/* =========================================================
   إضافة الأنماط
   ========================================================= */

ThemesModule.injectDynamicStyles();


/* =========================================================
   تشغيل تلقائي
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            () => {

                ThemesModule.init();

            },
            150
        );

    }
);