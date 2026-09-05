/* =========================================================
   TEACHER PRO
   settings.js

   مسؤول عن:
   - اسم الموقع
   - اسم المدرس
   - الصورة المصغرة AA.jpg
   - صورة الخلفية A.jpg
   - الصف والشعبة النشطين
   - الدرس وموضوع الدرس
   - ملاحظة اليوم
   - الملاحظة المثبتة
   - إعدادات الساعة والتاريخ
   - الإشعارات
   - التشغيل التلقائي
   - الحركة والتأثيرات
   - النسخ الاحتياطي
   - الحفظ في IndexedDB
   - التحديث الفوري بدون إعادة تحميل
   ========================================================= */

"use strict";


/* =========================================================
   الوحدة الرئيسية
   ========================================================= */

const SettingsModule = {

    initialized: false,

    databaseKey: "teacher_pro_settings",

    settings: {},

    defaultSettings: {

        siteName: "Teacher Pro",

        teacherName: "",

        siteLogo: "AA.jpg",

        backgroundImage: "A.jpg",

        activeClassId: "",

        activeSectionId: "",

        lessonName: "",

        lessonTopic: "",

        todayNote: "",

        pinnedNote: "",

        dateFormat: "ar-IQ",

        timeFormat: "12",

        autoRefresh: true,

        autoRefreshInterval: 30,

        notificationsEnabled: true,

        soundsEnabled: true,

        animationsEnabled: true,

        glassEffectsEnabled: true,

        compactMode: false,

        desktopMode: true,

        showTeachingTips: true,

        showGallery: true,

        galleryAutoPlay: true,

        galleryInterval: 5000,

        confirmBeforeDelete: true,

        showStudentNumbers: true,

        defaultAttendanceStatus: "present",

        createdAt: "",

        updatedAt: ""

    },


    selectors: {

        page: "#settingsPage",

        form: "#settingsForm",

        saveButton: "#saveSettingsBtn",

        resetButton: "#resetSettingsBtn",

        exportButton: "#exportSettingsBtn",

        importInput: "#importSettingsInput",

        siteNameInput: "#settingSiteName",

        teacherNameInput: "#settingTeacherName",

        siteLogoInput: "#settingSiteLogo",

        backgroundImageInput: "#settingBackgroundImage",

        activeClassInput: "#settingActiveClass",

        activeSectionInput: "#settingActiveSection",

        lessonNameInput: "#settingLessonName",

        lessonTopicInput: "#settingLessonTopic",

        todayNoteInput: "#settingTodayNote",

        pinnedNoteInput: "#settingPinnedNote",

        dateFormatInput: "#settingDateFormat",

        timeFormatInput: "#settingTimeFormat",

        autoRefreshInput: "#settingAutoRefresh",

        autoRefreshIntervalInput: "#settingAutoRefreshInterval",

        notificationsEnabledInput: "#settingNotificationsEnabled",

        soundsEnabledInput: "#settingSoundsEnabled",

        animationsEnabledInput: "#settingAnimationsEnabled",

        glassEffectsEnabledInput: "#settingGlassEffectsEnabled",

        compactModeInput: "#settingCompactMode",

        desktopModeInput: "#settingDesktopMode",

        showTeachingTipsInput: "#settingShowTeachingTips",

        showGalleryInput: "#settingShowGallery",

        galleryAutoPlayInput: "#settingGalleryAutoPlay",

        galleryIntervalInput: "#settingGalleryInterval",

        confirmBeforeDeleteInput: "#settingConfirmBeforeDelete",

        showStudentNumbersInput: "#settingShowStudentNumbers",

        defaultAttendanceStatusInput: "#settingDefaultAttendanceStatus",

        currentSiteName: "#currentSiteName",

        headerSiteName: "#headerSiteName",

        dashboardSiteName: "#dashboardSiteName",

        teacherNameDisplay: "#teacherNameDisplay",

        activeClassDisplay: "#activeClassDisplay",

        activeSectionDisplay: "#activeSectionDisplay",

        lessonNameDisplay: "#lessonNameDisplay",

        lessonTopicDisplay: "#lessonTopicDisplay",

        todayNoteDisplay: "#todayNoteDisplay",

        pinnedNoteDisplay: "#pinnedNoteDisplay",

        siteLogoImage: "#siteLogoImage",

        siteLogoPreview: "#siteLogoPreview"

    }

};


/* =========================================================
   تشغيل القسم
   ========================================================= */

SettingsModule.init = async function () {

    try {

        if (this.initialized) {

            await this.refresh();

            return;

        }


        this.initialized = true;


        this.settings = {
            ...this.defaultSettings
        };


        this.bindEvents();


        await this.loadSettings();


        await this.loadClasses();


        await this.applySettings(
            false
        );


        this.fillForm();


    } catch (error) {

        console.error(
            "SettingsModule initialization error:",
            error
        );

    }

};


/* =========================================================
   ربط الأحداث
   ========================================================= */

SettingsModule.bindEvents = function () {

    const form =
        document.querySelector(
            this.selectors.form
        );


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                await this.saveFromForm();

            }
        );

    }


    const saveButton =
        document.querySelector(
            this.selectors.saveButton
        );


    if (saveButton && !form) {

        saveButton.addEventListener(
            "click",
            async () => {

                await this.saveFromForm();

            }
        );

    }


    const resetButton =
        document.querySelector(
            this.selectors.resetButton
        );


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            async () => {

                await this.resetSettings();

            }
        );

    }


    const exportButton =
        document.querySelector(
            this.selectors.exportButton
        );


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            () => {

                this.exportSettings();

            }
        );

    }


    const importInput =
        document.querySelector(
            this.selectors.importInput
        );


    if (importInput) {

        importInput.addEventListener(
            "change",
            async event => {

                await this.importSettings(
                    event
                );

            }
        );

    }


    const activeClassInput =
        document.querySelector(
            this.selectors.activeClassInput
        );


    if (activeClassInput) {

        activeClassInput.addEventListener(
            "change",
            async () => {

                await this.loadSections(
                    activeClassInput.value
                );

            }
        );

    }


    const animationsInput =
        document.querySelector(
            this.selectors.animationsEnabledInput
        );


    if (animationsInput) {

        animationsInput.addEventListener(
            "change",
            () => {

                document.body.classList.toggle(
                    "disable-animations",
                    !animationsInput.checked
                );

            }
        );

    }


    const glassInput =
        document.querySelector(
            this.selectors.glassEffectsEnabledInput
        );


    if (glassInput) {

        glassInput.addEventListener(
            "change",
            () => {

                document.body.classList.toggle(
                    "disable-glass-effects",
                    !glassInput.checked
                );

            }
        );

    }


    const compactInput =
        document.querySelector(
            this.selectors.compactModeInput
        );


    if (compactInput) {

        compactInput.addEventListener(
            "change",
            () => {

                document.body.classList.toggle(
                    "compact-mode",
                    compactInput.checked
                );

            }
        );

    }


    const desktopInput =
        document.querySelector(
            this.selectors.desktopModeInput
        );


    if (desktopInput) {

        desktopInput.addEventListener(
            "change",
            () => {

                document.body.classList.toggle(
                    "desktop-mode",
                    desktopInput.checked
                );

            }
        );

    }


    document.addEventListener(
        "settings:refresh",
        async () => {

            await this.refresh();

        }
    );

};


/* =========================================================
   تحميل الإعدادات
   ========================================================= */

SettingsModule.loadSettings =
async function () {

    try {

        let savedSettings =
            null;


        if (
            window.TeacherDB &&
            typeof TeacherDB.get ===
            "function"
        ) {

            savedSettings =
                await TeacherDB.get(
                    "settings",
                    this.databaseKey
                );

        }


        if (
            !savedSettings &&
            window.DB &&
            typeof DB.get ===
            "function"
        ) {

            savedSettings =
                await DB.get(
                    "settings",
                    this.databaseKey
                );

        }


        if (
            savedSettings &&
            typeof savedSettings ===
            "object"
        ) {

            this.settings = {

                ...this.defaultSettings,

                ...savedSettings

            };


            return;

        }


        const localData =
            localStorage.getItem(
                this.databaseKey
            );


        if (localData) {

            const parsed =
                JSON.parse(
                    localData
                );


            this.settings = {

                ...this.defaultSettings,

                ...parsed

            };

        }


    } catch (error) {

        console.error(
            "Error loading settings:",
            error
        );


        this.loadLocalFallback();

    }

};


/* =========================================================
   تحميل احتياطي
   ========================================================= */

SettingsModule.loadLocalFallback =
function () {

    try {

        const localData =
            localStorage.getItem(
                this.databaseKey
            );


        if (!localData) {

            return;

        }


        const parsed =
            JSON.parse(
                localData
            );


        this.settings = {

            ...this.defaultSettings,

            ...parsed

        };


    } catch (error) {

        console.error(
            "Local settings load error:",
            error
        );

    }

};


/* =========================================================
   حفظ الإعدادات
   ========================================================= */

SettingsModule.saveSettings =
async function () {

    this.settings.id =
        this.databaseKey;


    this.settings.updatedAt =
        new Date().toISOString();


    if (
        !this.settings.createdAt
    ) {

        this.settings.createdAt =
            new Date().toISOString();

    }


    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.put ===
            "function"
        ) {

            await TeacherDB.put(
                "settings",
                this.settings
            );

        } else if (
            window.DB &&
            typeof DB.put ===
            "function"
        ) {

            await DB.put(
                "settings",
                this.settings
            );

        }


        this.saveLocalFallback();


        return true;


    } catch (error) {

        console.error(
            "Settings save error:",
            error
        );


        this.saveLocalFallback();


        return false;

    }

};


/* =========================================================
   حفظ احتياطي
   ========================================================= */

SettingsModule.saveLocalFallback =
function () {

    try {

        localStorage.setItem(

            this.databaseKey,

            JSON.stringify(
                this.settings
            )

        );

    } catch (error) {

        console.error(
            "Local settings save error:",
            error
        );

    }

};


/* =========================================================
   تحميل الصفوف
   ========================================================= */

SettingsModule.loadClasses =
async function () {

    const input =
        document.querySelector(
            this.selectors.activeClassInput
        );


    if (!input) {

        return;

    }


    try {

        let classes = [];


        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll ===
            "function"
        ) {

            classes =
                await TeacherDB.getAll(
                    "classes"
                );

        } else if (
            window.DB &&
            typeof DB.getAll ===
            "function"
        ) {

            classes =
                await DB.getAll(
                    "classes"
                );

        }


        const currentValue =
            this.settings.activeClassId;


        input.innerHTML =
            `<option value="">اختر الصف</option>`;


        classes.forEach(
            classItem => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    classItem.id;


                option.textContent =
                    classItem.name ||
                    classItem.className ||
                    "صف بدون اسم";


                input.appendChild(
                    option
                );

            }
        );


        if (currentValue) {

            input.value =
                currentValue;


            await this.loadSections(
                currentValue
            );

        }


    } catch (error) {

        console.error(
            "Error loading settings classes:",
            error
        );

    }

};


/* =========================================================
   تحميل الشعب
   ========================================================= */

SettingsModule.loadSections =
async function (classId) {

    const input =
        document.querySelector(
            this.selectors.activeSectionInput
        );


    if (!input) {

        return;

    }


    input.innerHTML =
        `<option value="">اختر الشعبة</option>`;


    if (!classId) {

        return;

    }


    try {

        let sections = [];


        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll ===
            "function"
        ) {

            sections =
                await TeacherDB.getAll(
                    "sections"
                );

        } else if (
            window.DB &&
            typeof DB.getAll ===
            "function"
        ) {

            sections =
                await DB.getAll(
                    "sections"
                );

        }


        sections
            .filter(
                section =>

                    String(
                        section.classId
                    ) ===
                    String(
                        classId
                    )

            )
            .forEach(
                section => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        section.id;


                    option.textContent =
                        section.name ||
                        section.sectionName ||
                        "شعبة";


                    input.appendChild(
                        option
                    );

                }
            );


        if (
            this.settings.activeSectionId
        ) {

            input.value =
                this.settings.activeSectionId;

        }


    } catch (error) {

        console.error(
            "Error loading settings sections:",
            error
        );

    }

};


/* =========================================================
   تعبئة النموذج
   ========================================================= */

SettingsModule.fillForm =
function () {

    this.setInputValue(
        this.selectors.siteNameInput,
        this.settings.siteName
    );


    this.setInputValue(
        this.selectors.teacherNameInput,
        this.settings.teacherName
    );


    this.setInputValue(
        this.selectors.siteLogoInput,
        this.settings.siteLogo
    );


    this.setInputValue(
        this.selectors.backgroundImageInput,
        this.settings.backgroundImage
    );


    this.setInputValue(
        this.selectors.activeClassInput,
        this.settings.activeClassId
    );


    this.setInputValue(
        this.selectors.activeSectionInput,
        this.settings.activeSectionId
    );


    this.setInputValue(
        this.selectors.lessonNameInput,
        this.settings.lessonName
    );


    this.setInputValue(
        this.selectors.lessonTopicInput,
        this.settings.lessonTopic
    );


    this.setInputValue(
        this.selectors.todayNoteInput,
        this.settings.todayNote
    );


    this.setInputValue(
        this.selectors.pinnedNoteInput,
        this.settings.pinnedNote
    );


    this.setInputValue(
        this.selectors.dateFormatInput,
        this.settings.dateFormat
    );


    this.setInputValue(
        this.selectors.timeFormatInput,
        this.settings.timeFormat
    );


    this.setInputChecked(
        this.selectors.autoRefreshInput,
        this.settings.autoRefresh
    );


    this.setInputValue(
        this.selectors.autoRefreshIntervalInput,
        this.settings.autoRefreshInterval
    );


    this.setInputChecked(
        this.selectors.notificationsEnabledInput,
        this.settings.notificationsEnabled
    );


    this.setInputChecked(
        this.selectors.soundsEnabledInput,
        this.settings.soundsEnabled
    );


    this.setInputChecked(
        this.selectors.animationsEnabledInput,
        this.settings.animationsEnabled
    );


    this.setInputChecked(
        this.selectors.glassEffectsEnabledInput,
        this.settings.glassEffectsEnabled
    );


    this.setInputChecked(
        this.selectors.compactModeInput,
        this.settings.compactMode
    );


    this.setInputChecked(
        this.selectors.desktopModeInput,
        this.settings.desktopMode
    );


    this.setInputChecked(
        this.selectors.showTeachingTipsInput,
        this.settings.showTeachingTips
    );


    this.setInputChecked(
        this.selectors.showGalleryInput,
        this.settings.showGallery
    );


    this.setInputChecked(
        this.selectors.galleryAutoPlayInput,
        this.settings.galleryAutoPlay
    );


    this.setInputValue(
        this.selectors.galleryIntervalInput,
        this.settings.galleryInterval
    );


    this.setInputChecked(
        this.selectors.confirmBeforeDeleteInput,
        this.settings.confirmBeforeDelete
    );


    this.setInputChecked(
        this.selectors.showStudentNumbersInput,
        this.settings.showStudentNumbers
    );


    this.setInputValue(
        this.selectors.defaultAttendanceStatusInput,
        this.settings.defaultAttendanceStatus
    );

};


/* =========================================================
   قراءة النموذج
   ========================================================= */

SettingsModule.getFormData =
function () {

    return {

        siteName:
            this.getInputValue(
                this.selectors.siteNameInput
            ),

        teacherName:
            this.getInputValue(
                this.selectors.teacherNameInput
            ),

        siteLogo:
            this.getInputValue(
                this.selectors.siteLogoInput
            ),

        backgroundImage:
            this.getInputValue(
                this.selectors.backgroundImageInput
            ),

        activeClassId:
            this.getInputValue(
                this.selectors.activeClassInput
            ),

        activeSectionId:
            this.getInputValue(
                this.selectors.activeSectionInput
            ),

        lessonName:
            this.getInputValue(
                this.selectors.lessonNameInput
            ),

        lessonTopic:
            this.getInputValue(
                this.selectors.lessonTopicInput
            ),

        todayNote:
            this.getInputValue(
                this.selectors.todayNoteInput
            ),

        pinnedNote:
            this.getInputValue(
                this.selectors.pinnedNoteInput
            ),

        dateFormat:
            this.getInputValue(
                this.selectors.dateFormatInput
            ) || "ar-IQ",

        timeFormat:
            this.getInputValue(
                this.selectors.timeFormatInput
            ) || "12",

        autoRefresh:
            this.getInputChecked(
                this.selectors.autoRefreshInput
            ),

        autoRefreshInterval:
            this.getNumberValue(
                this.selectors.autoRefreshIntervalInput,
                30
            ),

        notificationsEnabled:
            this.getInputChecked(
                this.selectors.notificationsEnabledInput
            ),

        soundsEnabled:
            this.getInputChecked(
                this.selectors.soundsEnabledInput
            ),

        animationsEnabled:
            this.getInputChecked(
                this.selectors.animationsEnabledInput
            ),

        glassEffectsEnabled:
            this.getInputChecked(
                this.selectors.glassEffectsEnabledInput
            ),

        compactMode:
            this.getInputChecked(
                this.selectors.compactModeInput
            ),

        desktopMode:
            this.getInputChecked(
                this.selectors.desktopModeInput
            ),

        showTeachingTips:
            this.getInputChecked(
                this.selectors.showTeachingTipsInput
            ),

        showGallery:
            this.getInputChecked(
                this.selectors.showGalleryInput
            ),

        galleryAutoPlay:
            this.getInputChecked(
                this.selectors.galleryAutoPlayInput
            ),

        galleryInterval:
            this.getNumberValue(
                this.selectors.galleryIntervalInput,
                5000
            ),

        confirmBeforeDelete:
            this.getInputChecked(
                this.selectors.confirmBeforeDeleteInput
            ),

        showStudentNumbers:
            this.getInputChecked(
                this.selectors.showStudentNumbersInput
            ),

        defaultAttendanceStatus:
            this.getInputValue(
                this.selectors.defaultAttendanceStatusInput
            ) || "present"

    };

};


/* =========================================================
   حفظ من النموذج
   ========================================================= */

SettingsModule.saveFromForm =
async function () {

    const data =
        this.getFormData();


    this.settings = {

        ...this.settings,

        ...data

    };


    const saved =
        await this.saveSettings();


    if (!saved) {

        this.showMessage(
            "حدث خطأ أثناء حفظ الإعدادات",
            "error"
        );


        return false;

    }


    await this.applySettings(
        true
    );


    this.fillForm();


    this.emitUpdateEvent();


    this.showMessage(
        "تم حفظ الإعدادات بنجاح",
        "success"
    );


    return true;

};


/* =========================================================
   تطبيق الإعدادات
   ========================================================= */

SettingsModule.applySettings =
async function (
    animate = false
) {

    if (animate) {

        document.body.classList.add(
            "settings-applying"
        );

    }


    this.applySiteName();


    this.applyTeacherName();


    this.applyImages();


    this.applyVisualSettings();


    this.applyDisplaySettings();


    this.applyLessonInformation();


    this.applyActiveClassInformation();


    if (
        animate
    ) {

        setTimeout(
            () => {

                document.body.classList.remove(
                    "settings-applying"
                );

            },
            600
        );

    }

};


/* =========================================================
   تطبيق اسم الموقع
   ========================================================= */

SettingsModule.applySiteName =
function () {

    const name =
        this.settings.siteName ||
        this.defaultSettings.siteName;


    this.setText(
        this.selectors.currentSiteName,
        name
    );


    this.setText(
        this.selectors.headerSiteName,
        name
    );


    this.setText(
        this.selectors.dashboardSiteName,
        name
    );


    document.title =
        name;


    document.documentElement.style.setProperty(
        "--site-name",
        `"${name}"`
    );

};


/* =========================================================
   تطبيق اسم المدرس
   ========================================================= */

SettingsModule.applyTeacherName =
function () {

    const name =
        this.settings.teacherName ||
        "";


    this.setText(
        this.selectors.teacherNameDisplay,
        name
    );

};


/* =========================================================
   تطبيق الصور
   ========================================================= */

SettingsModule.applyImages =
function () {

    const logo =
        this.settings.siteLogo ||
        "AA.jpg";


    const background =
        this.settings.backgroundImage ||
        "A.jpg";


    this.setImage(
        this.selectors.siteLogoImage,
        logo
    );


    this.setImage(
        this.selectors.siteLogoPreview,
        logo
    );


    document.documentElement.style.setProperty(

        "--site-background-image",

        `url("${background}")`

    );


    document.body.style.backgroundImage =

        `
            linear-gradient(
                rgba(5,8,15,0.82),
                rgba(5,8,15,0.88)
            ),

            url("${background}")
        `;

};


/* =========================================================
   تطبيق الإعدادات البصرية
   ========================================================= */

SettingsModule.applyVisualSettings =
function () {

    document.body.classList.toggle(

        "disable-animations",

        !this.settings.animationsEnabled

    );


    document.body.classList.toggle(

        "disable-glass-effects",

        !this.settings.glassEffectsEnabled

    );


    document.body.classList.toggle(

        "compact-mode",

        this.settings.compactMode

    );


    document.body.classList.toggle(

        "desktop-mode",

        this.settings.desktopMode

    );


    document.body.classList.toggle(

        "hide-teaching-tips",

        !this.settings.showTeachingTips

    );


    document.body.classList.toggle(

        "hide-gallery",

        !this.settings.showGallery

    );


    document.body.classList.toggle(

        "hide-student-numbers",

        !this.settings.showStudentNumbers

    );


    document.body.dataset.timeFormat =
        this.settings.timeFormat;


    document.body.dataset.dateFormat =
        this.settings.dateFormat;

};


/* =========================================================
   تطبيق إعدادات العرض
   ========================================================= */

SettingsModule.applyDisplaySettings =
function () {

    if (
        window.GalleryModule &&
        typeof GalleryModule.setAutoPlay ===
        "function"
    ) {

        GalleryModule.setAutoPlay(
            this.settings.galleryAutoPlay
        );

    }


    if (
        window.GalleryModule &&
        typeof GalleryModule.setInterval ===
        "function"
    ) {

        GalleryModule.setInterval(
            this.settings.galleryInterval
        );

    }


    if (
        window.ClockModule &&
        typeof ClockModule.setFormat ===
        "function"
    ) {

        ClockModule.setFormat(
            this.settings.timeFormat
        );

    }


    document.dispatchEvent(

        new CustomEvent(
            "settings:display-changed",
            {

                detail:
                    this.settings

            }
        )

    );

};


/* =========================================================
   تطبيق معلومات الدرس
   ========================================================= */

SettingsModule.applyLessonInformation =
function () {

    this.setText(

        this.selectors.lessonNameDisplay,

        this.settings.lessonName ||
        "لم يتم تحديد الدرس"

    );


    this.setText(

        this.selectors.lessonTopicDisplay,

        this.settings.lessonTopic ||
        "لم يتم تحديد الموضوع"

    );


    this.setText(

        this.selectors.todayNoteDisplay,

        this.settings.todayNote ||
        "لا توجد ملاحظة لليوم"

    );


    this.setText(

        this.selectors.pinnedNoteDisplay,

        this.settings.pinnedNote ||
        "لا توجد ملاحظة مثبتة"

    );

};


/* =========================================================
   تطبيق الصف والشعبة النشطين
   ========================================================= */

SettingsModule.applyActiveClassInformation =
async function () {

    try {

        let className =
            "لم يتم تحديد الصف";


        let sectionName =
            "لم يتم تحديد الشعبة";


        if (
            this.settings.activeClassId
        ) {

            const classItem =
                await this.getClassById(
                    this.settings.activeClassId
                );


            if (classItem) {

                className =
                    classItem.name ||
                    classItem.className ||
                    className;

            }

        }


        if (
            this.settings.activeSectionId
        ) {

            const sectionItem =
                await this.getSectionById(
                    this.settings.activeSectionId
                );


            if (sectionItem) {

                sectionName =
                    sectionItem.name ||
                    sectionItem.sectionName ||
                    sectionName;

            }

        }


        this.setText(
            this.selectors.activeClassDisplay,
            className
        );


        this.setText(
            this.selectors.activeSectionDisplay,
            sectionName
        );


        document.dispatchEvent(

            new CustomEvent(
                "active-class:changed",
                {

                    detail: {

                        classId:
                            this.settings.activeClassId,

                        sectionId:
                            this.settings.activeSectionId,

                        className,

                        sectionName

                    }

                }
            )

        );


    } catch (error) {

        console.error(
            "Error applying active class:",
            error
        );

    }

};


/* =========================================================
   جلب صف حسب ID
   ========================================================= */

SettingsModule.getClassById =
async function (id) {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.get ===
            "function"
        ) {

            return await TeacherDB.get(
                "classes",
                id
            );

        }


        if (
            window.DB &&
            typeof DB.get ===
            "function"
        ) {

            return await DB.get(
                "classes",
                id
            );

        }


        return null;


    } catch (error) {

        return null;

    }

};


/* =========================================================
   جلب شعبة حسب ID
   ========================================================= */

SettingsModule.getSectionById =
async function (id) {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.get ===
            "function"
        ) {

            return await TeacherDB.get(
                "sections",
                id
            );

        }


        if (
            window.DB &&
            typeof DB.get ===
            "function"
        ) {

            return await DB.get(
                "sections",
                id
            );

        }


        return null;


    } catch (error) {

        return null;

    }

};


/* =========================================================
   إعادة الإعدادات الافتراضية
   ========================================================= */

SettingsModule.resetSettings =
async function () {

    const confirmed =
        await this.confirmAction(
            "هل تريد إعادة جميع إعدادات الموقع إلى الوضع الافتراضي؟"
        );


    if (!confirmed) {

        return;

    }


    this.settings = {

        ...this.defaultSettings,

        id:
            this.databaseKey,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    await this.saveSettings();


    await this.loadClasses();


    await this.applySettings(
        true
    );


    this.fillForm();


    this.emitUpdateEvent();


    this.showMessage(
        "تمت إعادة الإعدادات الافتراضية",
        "success"
    );

};


/* =========================================================
   تصدير الإعدادات
   ========================================================= */

SettingsModule.exportSettings =
function () {

    try {

        const exportData = {

            type:
                "Teacher Pro Settings",

            version:
                "1.0",

            exportedAt:
                new Date().toISOString(),

            settings:
                this.settings

        };


        const json =
            JSON.stringify(
                exportData,
                null,
                2
            );


        const blob =
            new Blob(

                [json],

                {
                    type:
                        "application/json"
                }

            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `teacher-pro-settings-${this.getDateForFile()}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        this.showMessage(
            "تم تنزيل ملف الإعدادات",
            "success"
        );


    } catch (error) {

        console.error(
            "Settings export error:",
            error
        );


        this.showMessage(
            "تعذر تصدير الإعدادات",
            "error"
        );

    }

};


/* =========================================================
   استيراد الإعدادات
   ========================================================= */

SettingsModule.importSettings =
async function (event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;

    }


    try {

        const text =
            await file.text();


        const data =
            JSON.parse(
                text
            );


        const importedSettings =
            data.settings ||
            data;


        if (
            !importedSettings ||
            typeof importedSettings !==
            "object"
        ) {

            throw new Error(
                "Invalid settings file"
            );

        }


        const confirmed =
            await this.confirmAction(
                "سيتم استبدال الإعدادات الحالية. هل تريد المتابعة؟"
            );


        if (!confirmed) {

            event.target.value =
                "";

            return;

        }


        this.settings = {

            ...this.defaultSettings,

            ...importedSettings,

            id:
                this.databaseKey,

            updatedAt:
                new Date().toISOString()

        };


        await this.saveSettings();


        await this.loadClasses();


        await this.applySettings(
            true
        );


        this.fillForm();


        this.emitUpdateEvent();


        this.showMessage(
            "تم استيراد الإعدادات بنجاح",
            "success"
        );


    } catch (error) {

        console.error(
            "Settings import error:",
            error
        );


        this.showMessage(
            "ملف الإعدادات غير صالح",
            "error"
        );

    }


    event.target.value =
        "";

};


/* =========================================================
   تحديث الإعدادات برمجياً
   ========================================================= */

SettingsModule.update =
async function (
    newSettings = {}
) {

    this.settings = {

        ...this.settings,

        ...newSettings,

        updatedAt:
            new Date().toISOString()

    };


    await this.saveSettings();


    await this.applySettings(
        false
    );


    this.fillForm();


    this.emitUpdateEvent();


    return this.settings;

};


/* =========================================================
   الحصول على إعداد
   ========================================================= */

SettingsModule.get =
function (key) {

    return this.settings[key];

};


/* =========================================================
   تعيين إعداد واحد
   ========================================================= */

SettingsModule.set =
async function (
    key,
    value
) {

    this.settings[key] =
        value;


    this.settings.updatedAt =
        new Date().toISOString();


    await this.saveSettings();


    await this.applySettings(
        false
    );


    this.fillForm();


    this.emitUpdateEvent();


    return true;

};


/* =========================================================
   الحصول على كل الإعدادات
   ========================================================= */

SettingsModule.getAll =
function () {

    return {

        ...this.settings

    };

};


/* =========================================================
   تحديث كامل
   ========================================================= */

SettingsModule.refresh =
async function () {

    await this.loadSettings();


    await this.loadClasses();


    await this.applySettings(
        false
    );


    this.fillForm();

};


/* =========================================================
   دوال الإدخال
   ========================================================= */

SettingsModule.getInputValue =
function (selector) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {

        return "";

    }


    return (
        element.value || ""
    ).trim();

};


SettingsModule.getInputChecked =
function (selector) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {

        return false;

    }


    return Boolean(
        element.checked
    );

};


SettingsModule.getNumberValue =
function (
    selector,
    fallback = 0
) {

    const value =
        this.getInputValue(
            selector
        );


    const number =
        Number(value);


    return (
        Number.isFinite(number)
            ? number
            : fallback
    );

};


SettingsModule.setInputValue =
function (
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {

        return;

    }


    element.value =
        value ?? "";

};


SettingsModule.setInputChecked =
function (
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {

        return;

    }


    element.checked =
        Boolean(value);

};


/* =========================================================
   دوال العرض
   ========================================================= */

SettingsModule.setText =
function (
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {

        return;

    }


    element.textContent =
        value ?? "";

};


SettingsModule.setImage =
function (
    selector,
    source
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {

        return;

    }


    element.src =
        source;


    element.onerror =
        () => {

            element.style.opacity =
                "0";

        };


    element.onload =
        () => {

            element.style.opacity =
                "1";

        };

};


/* =========================================================
   Event تحديث الإعدادات
   ========================================================= */

SettingsModule.emitUpdateEvent =
function () {

    document.dispatchEvent(

        new CustomEvent(
            "settings:updated",
            {

                detail: {

                    settings:
                        this.getAll()

                }

            }
        )

    );

};


/* =========================================================
   تأكيد
   ========================================================= */

SettingsModule.confirmAction =
async function (message) {

    if (
        this.settings.confirmBeforeDelete ===
        false
    ) {

        return true;

    }


    if (
        window.App &&
        typeof App.confirm ===
        "function"
    ) {

        return await App.confirm(
            message
        );

    }


    return window.confirm(
        message
    );

};


/* =========================================================
   رسالة
   ========================================================= */

SettingsModule.showMessage =
function (
    message,
    type = "info"
) {

    if (
        window.App &&
        typeof App.showToast ===
        "function"
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
   تاريخ مناسب لاسم الملف
   ========================================================= */

SettingsModule.getDateForFile =
function () {

    const date =
        new Date();


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

};


/* =========================================================
   تدمير الوحدة
   ========================================================= */

SettingsModule.destroy =
function () {

    this.initialized =
        false;

};


/* =========================================================
   جعل الوحدة متاحة عالمياً
   ========================================================= */

window.SettingsModule =
    SettingsModule;


/* =========================================================
   تشغيل تلقائي
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            () => {

                SettingsModule.init();

            },
            200
        );

    }
);