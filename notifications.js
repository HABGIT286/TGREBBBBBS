/* =========================================================
   TEACHER PRO
   notifications.js

   إدارة:
   - التنبيهات
   - التذكيرات
   - الملاحظات الموجهة
   - الامتحانات والاختبارات
   - الدروس
   - التنبيهات العامة
   - التنبيهات الخاصة بصف أو شعبة
   - الحفظ في IndexedDB
   ========================================================= */

"use strict";


/* =========================================================
   إعدادات القسم
   ========================================================= */

const NotificationsModule = {

    notifications: [],

    currentFilter: "all",

    currentNotificationId: null,

    initialized: false,

    autoRefreshInterval: null,

    selectors: {

        page: "#notificationsPage",

        list: "#notificationsList",

        count: "#notificationsCount",

        search: "#notificationsSearch",

        filter: "#notificationsFilter",

        addButton: "#addNotificationBtn",

        modal: "#notificationModal",

        form: "#notificationForm",

        modalTitle: "#notificationModalTitle",

        saveButton: "#saveNotificationBtn",

        cancelButton: "#cancelNotificationBtn",

        closeButton: "#closeNotificationModalBtn",

        titleInput: "#notificationTitle",

        contentInput: "#notificationContent",

        typeInput: "#notificationType",

        priorityInput: "#notificationPriority",

        targetInput: "#notificationTarget",

        classInput: "#notificationClass",

        sectionInput: "#notificationSection",

        dateInput: "#notificationDate",

        timeInput: "#notificationTime",

        enabledInput: "#notificationEnabled",

        reminderInput: "#notificationReminder",

        emptyState: "#notificationsEmptyState",

        dashboardNotifications: "#dashboardNotifications",

        reminderWidget: "#examReminderWidget",

        reminderTitle: "#reminderTitle",

        reminderDate: "#reminderDate"

    }

};


/* =========================================================
   أنواع التنبيهات
   ========================================================= */

NotificationsModule.types = {

    notification: {

        label: "تنبيه",

        icon: "🔔"

    },

    exam: {

        label: "امتحان",

        icon: "📝"

    },

    test: {

        label: "اختبار",

        icon: "📋"

    },

    lesson: {

        label: "درس",

        icon: "📚"

    },

    homework: {

        label: "واجب",

        icon: "✏️"

    },

    reminder: {

        label: "تذكير",

        icon: "⏰"

    },

    important: {

        label: "مهم",

        icon: "⚠️"

    },

    general: {

        label: "إعلان",

        icon: "📢"

    }

};


/* =========================================================
   مستويات الأولوية
   ========================================================= */

NotificationsModule.priorities = {

    low: {

        label: "منخفضة",

        icon: "🟢",

        order: 1

    },

    normal: {

        label: "عادية",

        icon: "🔵",

        order: 2

    },

    high: {

        label: "مرتفعة",

        icon: "🟠",

        order: 3

    },

    urgent: {

        label: "عاجلة",

        icon: "🔴",

        order: 4

    }

};


/* =========================================================
   تشغيل القسم
   ========================================================= */

NotificationsModule.init = async function () {

    try {

        if (this.initialized) {

            await this.refresh();

            return;

        }


        this.initialized = true;


        this.bindEvents();


        await this.loadNotifications();


        await this.loadClassesIntoTargetSelectors();


        this.render();


        this.startAutoRefresh();


        this.updateDashboard();


        this.updateReminderWidget();


    } catch (error) {

        console.error(
            "NotificationsModule initialization error:",
            error
        );

    }

};


/* =========================================================
   ربط الأحداث
   ========================================================= */

NotificationsModule.bindEvents = function () {

    const addButton = document.querySelector(
        this.selectors.addButton
    );


    if (addButton) {

        addButton.addEventListener(
            "click",
            () => {

                this.openAddModal();

            }
        );

    }


    const form = document.querySelector(
        this.selectors.form
    );


    if (form) {

        form.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                await this.saveFromForm();

            }
        );

    }


    const searchInput = document.querySelector(
        this.selectors.search
    );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                this.render();

            }
        );

    }


    const filterInput = document.querySelector(
        this.selectors.filter
    );


    if (filterInput) {

        filterInput.addEventListener(
            "change",
            () => {

                this.currentFilter =
                    filterInput.value || "all";


                this.render();

            }
        );

    }


    const cancelButton = document.querySelector(
        this.selectors.cancelButton
    );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                this.closeModal();

            }
        );

    }


    const closeButton = document.querySelector(
        this.selectors.closeButton
    );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                this.closeModal();

            }
        );

    }


    const targetInput = document.querySelector(
        this.selectors.targetInput
    );


    if (targetInput) {

        targetInput.addEventListener(
            "change",
            () => {

                this.updateTargetFields();

            }
        );

    }


    document.addEventListener(
        "notifications:refresh",
        async () => {

            await this.refresh();

        }
    );

};


/* =========================================================
   تحميل التنبيهات من IndexedDB
   ========================================================= */

NotificationsModule.loadNotifications = async function () {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll === "function"
        ) {

            const data =
                await TeacherDB.getAll(
                    "notifications"
                );


            this.notifications =
                Array.isArray(data)
                    ? data
                    : [];


        } else if (
            window.DB &&
            typeof DB.getAll === "function"
        ) {

            const data =
                await DB.getAll(
                    "notifications"
                );


            this.notifications =
                Array.isArray(data)
                    ? data
                    : [];


        } else {

            this.notifications =
                this.getLocalFallback();

        }


        this.sortNotifications();


    } catch (error) {

        console.error(
            "Error loading notifications:",
            error
        );


        this.notifications =
            this.getLocalFallback();

    }

};


/* =========================================================
   حفظ التنبيهات في IndexedDB
   ========================================================= */

NotificationsModule.saveNotificationToDatabase =
async function (notification) {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.put === "function"
        ) {

            await TeacherDB.put(
                "notifications",
                notification
            );


            return true;

        }


        if (
            window.DB &&
            typeof DB.put === "function"
        ) {

            await DB.put(
                "notifications",
                notification
            );


            return true;

        }


        this.saveLocalFallback();


        return true;


    } catch (error) {

        console.error(
            "Error saving notification:",
            error
        );


        this.saveLocalFallback();


        return false;

    }

};


/* =========================================================
   حذف من IndexedDB
   ========================================================= */

NotificationsModule.deleteNotificationFromDatabase =
async function (id) {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.delete === "function"
        ) {

            await TeacherDB.delete(
                "notifications",
                id
            );


            return true;

        }


        if (
            window.DB &&
            typeof DB.delete === "function"
        ) {

            await DB.delete(
                "notifications",
                id
            );


            return true;

        }


        this.saveLocalFallback();


        return true;


    } catch (error) {

        console.error(
            "Error deleting notification:",
            error
        );


        this.saveLocalFallback();


        return false;

    }

};


/* =========================================================
   LocalStorage احتياطي
   ========================================================= */

NotificationsModule.getLocalFallback =
function () {

    try {

        const data =
            localStorage.getItem(
                "teacher_pro_notifications"
            );


        if (!data) {

            return [];

        }


        const parsed =
            JSON.parse(data);


        return Array.isArray(parsed)
            ? parsed
            : [];


    } catch (error) {

        return [];

    }

};


NotificationsModule.saveLocalFallback =
function () {

    try {

        localStorage.setItem(

            "teacher_pro_notifications",

            JSON.stringify(
                this.notifications
            )

        );

    } catch (error) {

        console.error(
            "Local fallback save error:",
            error
        );

    }

};


/* =========================================================
   تحديث كامل
   ========================================================= */

NotificationsModule.refresh =
async function () {

    await this.loadNotifications();


    await this.loadClassesIntoTargetSelectors();


    this.render();


    this.updateDashboard();


    this.updateReminderWidget();


    document.dispatchEvent(

        new CustomEvent(
            "notifications:updated",
            {

                detail:
                    this.notifications

            }
        )

    );

};


/* =========================================================
   فتح نافذة إضافة
   ========================================================= */

NotificationsModule.openAddModal =
async function () {

    this.currentNotificationId =
        null;


    const form = document.querySelector(
        this.selectors.form
    );


    if (form) {

        form.reset();

    }


    const title =
        document.querySelector(
            this.selectors.modalTitle
        );


    if (title) {

        title.textContent =
            "إضافة تنبيه جديد";

    }


    this.setDefaultFormValues();


    await this.loadClassesIntoTargetSelectors();


    this.updateTargetFields();


    this.openModal();

};


/* =========================================================
   فتح نافذة تعديل
   ========================================================= */

NotificationsModule.openEditModal =
async function (id) {

    const notification =
        this.notifications.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!notification) {

        this.showMessage(
            "لم يتم العثور على التنبيه",
            "error"
        );


        return;

    }


    this.currentNotificationId =
        notification.id;


    await this.loadClassesIntoTargetSelectors();


    this.fillForm(
        notification
    );


    const title =
        document.querySelector(
            this.selectors.modalTitle
        );


    if (title) {

        title.textContent =
            "تعديل التنبيه";

    }


    this.updateTargetFields();


    this.openModal();

};


/* =========================================================
   القيم الافتراضية
   ========================================================= */

NotificationsModule.setDefaultFormValues =
function () {

    const dateInput =
        document.querySelector(
            this.selectors.dateInput
        );


    const timeInput =
        document.querySelector(
            this.selectors.timeInput
        );


    const typeInput =
        document.querySelector(
            this.selectors.typeInput
        );


    const priorityInput =
        document.querySelector(
            this.selectors.priorityInput
        );


    const targetInput =
        document.querySelector(
            this.selectors.targetInput
        );


    const enabledInput =
        document.querySelector(
            this.selectors.enabledInput
        );


    const reminderInput =
        document.querySelector(
            this.selectors.reminderInput
        );


    const now =
        new Date();


    if (dateInput) {

        dateInput.value =
            this.formatDateInput(
                now
            );

    }


    if (timeInput) {

        timeInput.value =
            this.formatTimeInput(
                now
            );

    }


    if (typeInput) {

        typeInput.value =
            "notification";

    }


    if (priorityInput) {

        priorityInput.value =
            "normal";

    }


    if (targetInput) {

        targetInput.value =
            "general";

    }


    if (enabledInput) {

        enabledInput.checked =
            true;

    }


    if (reminderInput) {

        reminderInput.checked =
            true;

    }

};


/* =========================================================
   تعبئة النموذج
   ========================================================= */

NotificationsModule.fillForm =
function (notification) {

    const setValue =
        (selector, value) => {

            const element =
                document.querySelector(
                    selector
                );


            if (element) {

                element.value =
                    value ?? "";

            }

        };


    setValue(
        this.selectors.titleInput,
        notification.title
    );


    setValue(
        this.selectors.contentInput,
        notification.content
    );


    setValue(
        this.selectors.typeInput,
        notification.type
    );


    setValue(
        this.selectors.priorityInput,
        notification.priority
    );


    setValue(
        this.selectors.targetInput,
        notification.target
    );


    setValue(
        this.selectors.classInput,
        notification.classId
    );


    setValue(
        this.selectors.sectionInput,
        notification.sectionId
    );


    setValue(
        this.selectors.dateInput,
        notification.date
    );


    setValue(
        this.selectors.timeInput,
        notification.time
    );


    const enabledInput =
        document.querySelector(
            this.selectors.enabledInput
        );


    if (enabledInput) {

        enabledInput.checked =
            notification.enabled !== false;

    }


    const reminderInput =
        document.querySelector(
            this.selectors.reminderInput
        );


    if (reminderInput) {

        reminderInput.checked =
            notification.reminder !== false;

    }

};


/* =========================================================
   قراءة النموذج
   ========================================================= */

NotificationsModule.getFormData =
function () {

    const getValue =
        selector => {

            const element =
                document.querySelector(
                    selector
                );


            return element
                ? element.value.trim()
                : "";

        };


    const getChecked =
        selector => {

            const element =
                document.querySelector(
                    selector
                );


            return element
                ? element.checked
                : false;

        };


    return {

        title:
            getValue(
                this.selectors.titleInput
            ),

        content:
            getValue(
                this.selectors.contentInput
            ),

        type:
            getValue(
                this.selectors.typeInput
            ) || "notification",

        priority:
            getValue(
                this.selectors.priorityInput
            ) || "normal",

        target:
            getValue(
                this.selectors.targetInput
            ) || "general",

        classId:
            getValue(
                this.selectors.classInput
            ),

        sectionId:
            getValue(
                this.selectors.sectionInput
            ),

        date:
            getValue(
                this.selectors.dateInput
            ),

        time:
            getValue(
                this.selectors.timeInput
            ),

        enabled:
            getChecked(
                this.selectors.enabledInput
            ),

        reminder:
            getChecked(
                this.selectors.reminderInput
            )

    };

};


/* =========================================================
   التحقق من البيانات
   ========================================================= */

NotificationsModule.validateForm =
function (data) {

    if (!data.title) {

        this.showMessage(
            "يرجى كتابة عنوان التنبيه",
            "warning"
        );


        return false;

    }


    if (
        data.target === "class" &&
        !data.classId
    ) {

        this.showMessage(
            "يرجى اختيار الصف",
            "warning"
        );


        return false;

    }


    if (
        data.target === "section" &&
        (
            !data.classId ||
            !data.sectionId
        )
    ) {

        this.showMessage(
            "يرجى اختيار الصف والشعبة",
            "warning"
        );


        return false;

    }


    return true;

};


/* =========================================================
   حفظ من النموذج
   ========================================================= */

NotificationsModule.saveFromForm =
async function () {

    const data =
        this.getFormData();


    if (
        !this.validateForm(
            data
        )
    ) {

        return;

    }


    const now =
        new Date();


    if (
        this.currentNotificationId
    ) {

        const index =
            this.notifications.findIndex(
                item =>
                    String(item.id) ===
                    String(
                        this.currentNotificationId
                    )
            );


        if (index !== -1) {

            const oldNotification =
                this.notifications[index];


            const updatedNotification = {

                ...oldNotification,

                ...data,

                updatedAt:
                    now.toISOString()

            };


            this.notifications[index] =
                updatedNotification;


            await this.saveNotificationToDatabase(
                updatedNotification
            );


            this.showMessage(
                "تم تعديل التنبيه بنجاح",
                "success"
            );

        }


    } else {

        const notification = {

            id:
                this.generateId(),

            ...data,

            createdAt:
                now.toISOString(),

            updatedAt:
                now.toISOString(),

            viewed:
                false,

            archived:
                false

        };


        this.notifications.push(
            notification
        );


        await this.saveNotificationToDatabase(
            notification
        );


        this.showMessage(
            "تم إضافة التنبيه بنجاح",
            "success"
        );

    }


    this.sortNotifications();


    this.closeModal();


    this.render();


    this.updateDashboard();


    this.updateReminderWidget();


    this.emitUpdateEvent();

};


/* =========================================================
   تغيير حالة الاستهداف
   ========================================================= */

NotificationsModule.updateTargetFields =
function () {

    const targetInput =
        document.querySelector(
            this.selectors.targetInput
        );


    const classInput =
        document.querySelector(
            this.selectors.classInput
        );


    const sectionInput =
        document.querySelector(
            this.selectors.sectionInput
        );


    if (!targetInput) {

        return;

    }


    const target =
        targetInput.value;


    if (classInput) {

        classInput.disabled =
            target === "general";


        classInput.closest(
            ".form-group"
        )?.classList.toggle(

            "hidden",

            target === "general"

        );

    }


    if (sectionInput) {

        const showSection =
            target === "section";


        sectionInput.disabled =
            !showSection;


        sectionInput.closest(
            ".form-group"
        )?.classList.toggle(

            "hidden",

            !showSection

        );

    }


    if (
        target === "general"
    ) {

        if (classInput) {

            classInput.value =
                "";

        }


        if (sectionInput) {

            sectionInput.value =
                "";

        }

    }


    if (
        target === "class"
    ) {

        if (sectionInput) {

            sectionInput.value =
                "";

        }

    }

};


/* =========================================================
   تحميل الصفوف والشعب
   ========================================================= */

NotificationsModule.loadClassesIntoTargetSelectors =
async function () {

    try {

        const classInput =
            document.querySelector(
                this.selectors.classInput
            );


        const sectionInput =
            document.querySelector(
                this.selectors.sectionInput
            );


        if (
            !classInput &&
            !sectionInput
        ) {

            return;

        }


        let classes = [];


        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll === "function"
        ) {

            classes =
                await TeacherDB.getAll(
                    "classes"
                );


        } else if (
            window.DB &&
            typeof DB.getAll === "function"
        ) {

            classes =
                await DB.getAll(
                    "classes"
                );


        } else {

            const stored =
                localStorage.getItem(
                    "teacher_pro_classes"
                );


            if (stored) {

                classes =
                    JSON.parse(
                        stored
                    );

            }

        }


        if (
            classInput
        ) {

            const currentValue =
                classInput.value;


            classInput.innerHTML =
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


                    classInput.appendChild(
                        option
                    );

                }
            );


            if (currentValue) {

                classInput.value =
                    currentValue;

            }


            classInput.onchange =
                () => {

                    this.loadSectionsByClass(
                        classInput.value
                    );

                };

        }


        if (
            classInput &&
            classInput.value
        ) {

            await this.loadSectionsByClass(
                classInput.value
            );

        }


    } catch (error) {

        console.error(
            "Error loading classes:",
            error
        );

    }

};


/* =========================================================
   تحميل الشعب حسب الصف
   ========================================================= */

NotificationsModule.loadSectionsByClass =
async function (classId) {

    const sectionInput =
        document.querySelector(
            this.selectors.sectionInput
        );


    if (!sectionInput) {

        return;

    }


    sectionInput.innerHTML =
        `<option value="">اختر الشعبة</option>`;


    if (!classId) {

        return;

    }


    try {

        let sections = [];


        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll === "function"
        ) {

            sections =
                await TeacherDB.getAll(
                    "sections"
                );


        } else if (
            window.DB &&
            typeof DB.getAll === "function"
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


                    sectionInput.appendChild(
                        option
                    );

                }
            );


    } catch (error) {

        console.error(
            "Error loading sections:",
            error
        );

    }

};


/* =========================================================
   ترتيب التنبيهات
   ========================================================= */

NotificationsModule.sortNotifications =
function () {

    this.notifications.sort(

        (a, b) => {

            const aDate =
                this.getNotificationDate(
                    a
                );


            const bDate =
                this.getNotificationDate(
                    b
                );


            const priorityA =
                this.priorities[
                    a.priority
                ]?.order || 0;


            const priorityB =
                this.priorities[
                    b.priority
                ]?.order || 0;


            if (
                priorityA !== priorityB
            ) {

                return (
                    priorityB -
                    priorityA
                );

            }


            return (
                aDate.getTime() -
                bDate.getTime()
            );

        }

    );

};


/* =========================================================
   الحصول على التاريخ الكامل
   ========================================================= */

NotificationsModule.getNotificationDate =
function (notification) {

    const date =
        notification.date ||
        new Date().toISOString().split("T")[0];


    const time =
        notification.time ||
        "00:00";


    const result =
        new Date(
            `${date}T${time}`
        );


    if (
        Number.isNaN(
            result.getTime()
        )
    ) {

        return new Date(
            notification.createdAt ||
            Date.now()
        );

    }


    return result;

};


/* =========================================================
   التنبيهات المفلترة
   ========================================================= */

NotificationsModule.getFilteredNotifications =
function () {

    const searchInput =
        document.querySelector(
            this.selectors.search
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    return this.notifications.filter(
        notification => {

            if (
                notification.archived === true
            ) {

                return false;

            }


            if (
                this.currentFilter !== "all" &&
                notification.type !==
                this.currentFilter
            ) {

                return false;

            }


            if (!search) {

                return true;

            }


            const searchableText =
                [

                    notification.title,

                    notification.content,

                    this.types[
                        notification.type
                    ]?.label

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


            return searchableText.includes(
                search
            );

        }
    );

};


/* =========================================================
   رسم القسم
   ========================================================= */

NotificationsModule.render =
function () {

    const list =
        document.querySelector(
            this.selectors.list
        );


    if (!list) {

        return;

    }


    const notifications =
        this.getFilteredNotifications();


    list.innerHTML =
        "";


    if (
        notifications.length === 0
    ) {

        this.renderEmptyState();

        this.updateCount(0);

        return;

    }


    notifications.forEach(
        notification => {

            list.appendChild(

                this.createNotificationCard(
                    notification
                )

            );

        }
    );


    this.updateCount(
        notifications.length
    );

};


/* =========================================================
   بطاقة تنبيه
   ========================================================= */

NotificationsModule.createNotificationCard =
function (notification) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        [
            "notification-card",
            "glass-card",
            "animate-fade-up",
            `priority-${notification.priority || "normal"}`
        ].join(" ");


    card.dataset.id =
        notification.id;


    const type =
        this.types[
            notification.type
        ] ||
        this.types.notification;


    const priority =
        this.priorities[
            notification.priority
        ] ||
        this.priorities.normal;


    const isExpired =
        this.isExpired(
            notification
        );


    const targetText =
        this.getTargetText(
            notification
        );


    const dateText =
        this.formatNotificationDate(
            notification
        );


    card.innerHTML = `

        <div class="notification-card-glow"></div>

        <div class="notification-card-header">

            <div class="notification-type-icon">
                ${type.icon}
            </div>

            <div class="notification-card-title-area">

                <div class="notification-title-row">

                    <h3>
                        ${this.escapeHTML(notification.title)}
                    </h3>

                    <span
                        class="notification-priority priority-${notification.priority || "normal"}"
                    >
                        ${priority.icon}
                        ${priority.label}
                    </span>

                </div>

                <div class="notification-meta">

                    <span class="notification-target">
                        🎯
                        ${this.escapeHTML(targetText)}
                    </span>

                    <span class="notification-date">
                        🗓️
                        ${this.escapeHTML(dateText)}
                    </span>

                </div>

            </div>

        </div>

        ${
            notification.content
                ? `
                    <div class="notification-content">
                        ${this.escapeHTML(notification.content)}
                    </div>
                `
                : ""
        }

        <div class="notification-card-footer">

            <div class="notification-status">

                <span
                    class="status-dot ${
                        notification.enabled === false
                            ? "disabled"
                            : isExpired
                                ? "expired"
                                : "active"
                    }"
                ></span>

                <span>
                    ${
                        notification.enabled === false
                            ? "متوقف"
                            : isExpired
                                ? "منتهي الموعد"
                                : "نشط"
                    }
                </span>

            </div>

            <div class="notification-actions">

                <button
                    type="button"
                    class="icon-button notification-toggle-btn"
                    title="تشغيل أو إيقاف"
                    data-action="toggle"
                    data-id="${notification.id}"
                >
                    ${
                        notification.enabled === false
                            ? "▶️"
                            : "⏸️"
                    }
                </button>

                <button
                    type="button"
                    class="icon-button notification-edit-btn"
                    title="تعديل"
                    data-action="edit"
                    data-id="${notification.id}"
                >
                    ✏️
                </button>

                <button
                    type="button"
                    class="icon-button danger notification-delete-btn"
                    title="حذف"
                    data-action="delete"
                    data-id="${notification.id}"
                >
                    🗑️
                </button>

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {

                return;

            }


            event.preventDefault();


            const action =
                button.dataset.action;


            const id =
                button.dataset.id;


            if (
                action === "edit"
            ) {

                this.openEditModal(
                    id
                );

            }


            if (
                action === "delete"
            ) {

                this.deleteNotification(
                    id
                );

            }


            if (
                action === "toggle"
            ) {

                this.toggleNotification(
                    id
                );

            }

        }
    );


    return card;

};


/* =========================================================
   حالة عدم وجود تنبيهات
   ========================================================= */

NotificationsModule.renderEmptyState =
function () {

    const list =
        document.querySelector(
            this.selectors.list
        );


    if (!list) {

        return;

    }


    list.innerHTML = `

        <div
            class="notifications-empty-state glass-card animate-fade-in"
        >

            <div class="empty-icon">
                🔔
            </div>

            <h3>
                لا توجد تنبيهات
            </h3>

            <p>
                يمكنك إضافة تنبيه أو تذكير جديد
                وسيظهر هنا تلقائياً.
            </p>

        </div>

    `;

};


/* =========================================================
   حذف تنبيه
   ========================================================= */

NotificationsModule.deleteNotification =
async function (id) {

    const notification =
        this.notifications.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!notification) {

        return;

    }


    const confirmed =
        await this.confirmAction(
            `هل تريد حذف التنبيه "${notification.title}"؟`
        );


    if (!confirmed) {

        return;

    }


    const card =
        document.querySelector(
            `.notification-card[data-id="${id}"]`
        );


    if (card) {

        card.classList.add(
            "delete-animation"
        );

    }


    this.notifications =
        this.notifications.filter(
            item =>
                String(item.id) !==
                String(id)
        );


    setTimeout(
        async () => {

            await this.deleteNotificationFromDatabase(
                id
            );


            this.render();


            this.updateDashboard();


            this.updateReminderWidget();


            this.emitUpdateEvent();


            this.showMessage(
                "تم حذف التنبيه",
                "success"
            );

        },
        250
    );

};


/* =========================================================
   تشغيل وإيقاف
   ========================================================= */

NotificationsModule.toggleNotification =
async function (id) {

    const notification =
        this.notifications.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!notification) {

        return;

    }


    notification.enabled =
        notification.enabled === false;


    notification.updatedAt =
        new Date().toISOString();


    await this.saveNotificationToDatabase(
        notification
    );


    this.render();


    this.updateDashboard();


    this.updateReminderWidget();


    this.emitUpdateEvent();


    this.showMessage(

        notification.enabled
            ? "تم تشغيل التنبيه"
            : "تم إيقاف التنبيه",

        "success"

    );

};


/* =========================================================
   تحديث العداد
   ========================================================= */

NotificationsModule.updateCount =
function (count = null) {

    const countElement =
        document.querySelector(
            this.selectors.count
        );


    if (!countElement) {

        return;

    }


    const value =
        count === null
            ? this.getActiveNotifications().length
            : count;


    countElement.textContent =
        value;


    countElement.classList.remove(
        "number-update"
    );


    void countElement.offsetWidth;


    countElement.classList.add(
        "number-update"
    );

};


/* =========================================================
   التنبيهات النشطة
   ========================================================= */

NotificationsModule.getActiveNotifications =
function () {

    return this.notifications.filter(
        notification =>
            notification.enabled !== false &&
            notification.archived !== true
    );

};


/* =========================================================
   تحديث الصفحة الرئيسية
   ========================================================= */

NotificationsModule.updateDashboard =
function () {

    this.updateCount(
        this.getActiveNotifications().length
    );


    const container =
        document.querySelector(
            this.selectors.dashboardNotifications
        );


    if (!container) {

        return;

    }


    const notifications =
        this.getUpcomingNotifications(
            5
        );


    container.innerHTML =
        "";


    if (
        notifications.length === 0
    ) {

        container.innerHTML = `

            <div class="dashboard-empty-notifications">

                <span>🔔</span>

                <p>
                    لا توجد تنبيهات حالياً
                </p>

            </div>

        `;


        return;

    }


    notifications.forEach(
        notification => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dashboard-notification-item";


            const type =
                this.types[
                    notification.type
                ] ||
                this.types.notification;


            item.innerHTML = `

                <div class="dashboard-notification-icon">
                    ${type.icon}
                </div>

                <div class="dashboard-notification-info">

                    <strong>
                        ${this.escapeHTML(notification.title)}
                    </strong>

                    <small>
                        ${this.escapeHTML(
                            this.getTargetText(
                                notification
                            )
                        )}
                    </small>

                </div>

                <div class="dashboard-notification-time">
                    ${this.getRelativeTime(notification)}
                </div>

            `;


            item.addEventListener(
                "click",
                () => {

                    if (
                        window.App &&
                        typeof App.navigate === "function"
                    ) {

                        App.navigate(
                            "notifications"
                        );

                    }


                    setTimeout(
                        () => {

                            const card =
                                document.querySelector(
                                    `.notification-card[data-id="${notification.id}"]`
                                );


                            card?.scrollIntoView(
                                {

                                    behavior:
                                        "smooth",

                                    block:
                                        "center"

                                }
                            );

                        },
                        300
                    );

                }
            );


            container.appendChild(
                item
            );

        }
    );

};


/* =========================================================
   Widget تذكير الامتحان
   ========================================================= */

NotificationsModule.updateReminderWidget =
function () {

    const widget =
        document.querySelector(
            this.selectors.reminderWidget
        );


    if (!widget) {

        return;

    }


    const reminder =
        this.getNextImportantReminder();


    if (!reminder) {

        widget.classList.add(
            "hidden"
        );


        return;

    }


    widget.classList.remove(
        "hidden"
    );


    const titleElement =
        document.querySelector(
            this.selectors.reminderTitle
        );


    const dateElement =
        document.querySelector(
            this.selectors.reminderDate
        );


    if (titleElement) {

        titleElement.textContent =
            reminder.title;

    }


    if (dateElement) {

        dateElement.textContent =
            this.getReminderCountdown(
                reminder
            );

    }

};


/* =========================================================
   أقرب تذكير مهم
   ========================================================= */

NotificationsModule.getNextImportantReminder =
function () {

    const now =
        new Date();


    const importantTypes =
        [

            "exam",

            "test",

            "lesson",

            "homework",

            "reminder",

            "important"

        ];


    const list =
        this.getActiveNotifications()
            .filter(
                notification =>
                    notification.reminder !== false &&
                    importantTypes.includes(
                        notification.type
                    )
            )
            .filter(
                notification =>
                    this.getNotificationDate(
                        notification
                    ) >= now
            )
            .sort(
                (a, b) =>
                    this.getNotificationDate(a) -
                    this.getNotificationDate(b)
            );


    return list[0] || null;

};


/* =========================================================
   التنبيهات القادمة
   ========================================================= */

NotificationsModule.getUpcomingNotifications =
function (limit = 5) {

    const now =
        new Date();


    return this.getActiveNotifications()
        .filter(
            notification => {

                const date =
                    this.getNotificationDate(
                        notification
                    );


                return (
                    date >= now ||
                    notification.type ===
                    "general"
                );

            }
        )
        .sort(
            (a, b) =>
                this.getNotificationDate(a) -
                this.getNotificationDate(b)
        )
        .slice(
            0,
            limit
        );

};


/* =========================================================
   التحقق من انتهاء التنبيه
   ========================================================= */

NotificationsModule.isExpired =
function (notification) {

    if (
        notification.enabled === false
    ) {

        return false;

    }


    const date =
        this.getNotificationDate(
            notification
        );


    return (
        date.getTime() <
        Date.now()
    );

};


/* =========================================================
   نص الاستهداف
   ========================================================= */

NotificationsModule.getTargetText =
function (notification) {

    if (
        notification.target ===
        "general"
    ) {

        return "عام للجميع";

    }


    if (
        notification.target ===
        "class"
    ) {

        return (
            notification.className ||
            "صف محدد"
        );

    }


    if (
        notification.target ===
        "section"
    ) {

        const className =
            notification.className ||
            "صف";


        const sectionName =
            notification.sectionName ||
            "شعبة";


        return `${className} - ${sectionName}`;

    }


    return "عام";

};


/* =========================================================
   عد تنازلي للتذكير
   ========================================================= */

NotificationsModule.getReminderCountdown =
function (notification) {

    const target =
        this.getNotificationDate(
            notification
        );


    const now =
        new Date();


    const difference =
        target.getTime() -
        now.getTime();


    if (
        difference <= 0
    ) {

        return "موعد التنبيه الآن أو انتهى";

    }


    const minutes =
        Math.floor(
            difference /
            (1000 * 60)
        );


    const hours =
        Math.floor(
            difference /
            (1000 * 60 * 60)
        );


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (
        days > 0
    ) {

        return `متبقي ${days} يوم`;

    }


    if (
        hours > 0
    ) {

        return `متبقي ${hours} ساعة`;

    }


    return `متبقي ${minutes} دقيقة`;

};


/* =========================================================
   الوقت النسبي
   ========================================================= */

NotificationsModule.getRelativeTime =
function (notification) {

    const date =
        this.getNotificationDate(
            notification
        );


    const difference =
        date.getTime() -
        Date.now();


    if (
        difference <= 0
    ) {

        return "الآن";

    }


    const minutes =
        Math.floor(
            difference /
            (1000 * 60)
        );


    const hours =
        Math.floor(
            difference /
            (1000 * 60 * 60)
        );


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (
        days >= 1
    ) {

        return `${days} يوم`;

    }


    if (
        hours >= 1
    ) {

        return `${hours} ساعة`;

    }


    return `${minutes} دقيقة`;

};


/* =========================================================
   تنسيق التاريخ
   ========================================================= */

NotificationsModule.formatNotificationDate =
function (notification) {

    const date =
        this.getNotificationDate(
            notification
        );


    try {

        return new Intl.DateTimeFormat(
            "ar-IQ",
            {

                day:
                    "2-digit",

                month:
                    "long",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    true

            }
        ).format(
            date
        );


    } catch (error) {

        return (
            notification.date ||
            ""
        );

    }

};


/* =========================================================
   تنسيق التاريخ للإدخال
   ========================================================= */

NotificationsModule.formatDateInput =
function (date) {

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
   تنسيق الوقت للإدخال
   ========================================================= */

NotificationsModule.formatTimeInput =
function (date) {

    const hours =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );


    return `${hours}:${minutes}`;

};


/* =========================================================
   فتح Modal
   ========================================================= */

NotificationsModule.openModal =
function () {

    const modal =
        document.querySelector(
            this.selectors.modal
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "hidden"
    );


    modal.classList.add(
        "active"
    );


    const modalContent =
        modal.querySelector(
            ".modal-content"
        );


    if (modalContent) {

        modalContent.classList.remove(
            "modal-exit"
        );


        modalContent.classList.add(
            "modal-enter"
        );

    }


    document.body.classList.add(
        "modal-open"
    );

};


/* =========================================================
   إغلاق Modal
   ========================================================= */

NotificationsModule.closeModal =
function () {

    const modal =
        document.querySelector(
            this.selectors.modal
        );


    if (!modal) {

        return;

    }


    const modalContent =
        modal.querySelector(
            ".modal-content"
        );


    if (modalContent) {

        modalContent.classList.remove(
            "modal-enter"
        );


        modalContent.classList.add(
            "modal-exit"
        );

    }


    setTimeout(
        () => {

            modal.classList.remove(
                "active"
            );


            modal.classList.add(
                "hidden"
            );


            document.body.classList.remove(
                "modal-open"
            );


            this.currentNotificationId =
                null;

        },
        220
    );

};


/* =========================================================
   تحديث تلقائي
   ========================================================= */

NotificationsModule.startAutoRefresh =
function () {

    if (
        this.autoRefreshInterval
    ) {

        clearInterval(
            this.autoRefreshInterval
        );

    }


    this.autoRefreshInterval =
        setInterval(
            () => {

                this.updateDashboard();


                this.updateReminderWidget();

            },
            30000
        );

};


/* =========================================================
   رسالة للمستخدم
   ========================================================= */

NotificationsModule.showMessage =
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
        window.showToast &&
        typeof window.showToast === "function"
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
   نافذة تأكيد
   ========================================================= */

NotificationsModule.confirmAction =
async function (message) {

    if (
        window.App &&
        typeof App.confirm === "function"
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
   إنشاء ID
   ========================================================= */

NotificationsModule.generateId =
function () {

    if (
        window.crypto &&
        typeof crypto.randomUUID ===
        "function"
    ) {

        return crypto.randomUUID();

    }


    return (

        "notification_" +

        Date.now() +

        "_" +

        Math.random()
            .toString(36)
            .substring(2, 10)

    );

};


/* =========================================================
   حماية HTML
   ========================================================= */

NotificationsModule.escapeHTML =
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
   إرسال حدث تحديث
   ========================================================= */

NotificationsModule.emitUpdateEvent =
function () {

    document.dispatchEvent(

        new CustomEvent(
            "notifications:updated",
            {

                detail: {

                    notifications:
                        this.notifications,

                    activeCount:
                        this.getActiveNotifications()
                            .length

                }

            }
        )

    );

};


/* =========================================================
   الحصول على التنبيهات حسب الصف
   ========================================================= */

NotificationsModule.getByClass =
function (classId) {

    return this.getActiveNotifications()
        .filter(
            notification =>
                notification.target ===
                "general" ||

                (
                    notification.target ===
                    "class" &&

                    String(
                        notification.classId
                    ) ===
                    String(
                        classId
                    )
                ) ||

                (
                    notification.target ===
                    "section" &&

                    String(
                        notification.classId
                    ) ===
                    String(
                        classId
                    )
                )
        );

};


/* =========================================================
   الحصول على التنبيهات حسب الصف والشعبة
   ========================================================= */

NotificationsModule.getByClassAndSection =
function (
    classId,
    sectionId
) {

    return this.getActiveNotifications()
        .filter(
            notification => {

                if (
                    notification.target ===
                    "general"
                ) {

                    return true;

                }


                if (
                    notification.target ===
                    "class"
                ) {

                    return (

                        String(
                            notification.classId
                        ) ===
                        String(
                            classId
                        )

                    );

                }


                if (
                    notification.target ===
                    "section"
                ) {

                    return (

                        String(
                            notification.classId
                        ) ===
                        String(
                            classId
                        ) &&

                        String(
                            notification.sectionId
                        ) ===
                        String(
                            sectionId
                        )

                    );

                }


                return false;

            }
        );

};


/* =========================================================
   إضافة تنبيه برمجياً
   ========================================================= */

NotificationsModule.create =
async function (data = {}) {

    const now =
        new Date();


    const notification = {

        id:
            this.generateId(),

        title:
            data.title ||
            "تنبيه جديد",

        content:
            data.content ||
            "",

        type:
            data.type ||
            "notification",

        priority:
            data.priority ||
            "normal",

        target:
            data.target ||
            "general",

        classId:
            data.classId ||
            "",

        sectionId:
            data.sectionId ||
            "",

        className:
            data.className ||
            "",

        sectionName:
            data.sectionName ||
            "",

        date:
            data.date ||
            this.formatDateInput(
                now
            ),

        time:
            data.time ||
            this.formatTimeInput(
                now
            ),

        enabled:
            data.enabled !== false,

        reminder:
            data.reminder !== false,

        viewed:
            false,

        archived:
            false,

        createdAt:
            now.toISOString(),

        updatedAt:
            now.toISOString()

    };


    this.notifications.push(
        notification
    );


    await this.saveNotificationToDatabase(
        notification
    );


    this.sortNotifications();


    this.render();


    this.updateDashboard();


    this.updateReminderWidget();


    this.emitUpdateEvent();


    return notification;

};


/* =========================================================
   إيقاف القسم عند الحاجة
   ========================================================= */

NotificationsModule.destroy =
function () {

    if (
        this.autoRefreshInterval
    ) {

        clearInterval(
            this.autoRefreshInterval
        );


        this.autoRefreshInterval =
            null;

    }


    this.initialized =
        false;

};


/* =========================================================
   جعل الوحدة متاحة عالمياً
   ========================================================= */

window.NotificationsModule =
    NotificationsModule;


/* =========================================================
   تشغيل تلقائي عند جاهزية الصفحة
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            () => {

                NotificationsModule.init();

            },
            100
        );

    }
);