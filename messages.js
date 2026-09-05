/* =========================================================
   TEACHER PRO
   messages.js
   =========================================================

   قسم المراسلة

   المميزات:
   - استقبال رسائل الطلاب وأولياء الأمور
   - تحديد اسم الطالب
   - اختيار صفة المرسل: طالب / أم / أب / ولي أمر
   - اختيار الصف
   - اختيار الشعبة
   - كتابة الرسالة
   - توليد كود تلقائي لكل رسالة
   - حفظ التاريخ والوقت
   - حفظ بيانات الجهاز المتاحة للمتصفح
   - حفظ سجل الرسائل داخل IndexedDB
   - البحث في الرسائل
   - الفلترة حسب الصف والشعبة والحالة
   - قراءة الرسالة
   - تعليم الرسالة كمقروءة
   - أرشفة الرسالة
   - حذف الرسالة
   - نسخ كود الرسالة
   - إرسال الرسالة إلى Discord Webhook
   - إعادة الإرسال عند الفشل
   - إحصائيات الرسائل
   - تحديث مباشر بدون إعادة تحميل الصفحة
   - حماية النصوص من HTML Injection
   - دعم الأجهزة المحمولة والحاسوب
   ========================================================= */

"use strict";


/* =========================================================
   MODULE
   ========================================================= */

const MessagesModule = {

    initialized: false,

    messages: [],

    classes: [],

    sections: [],

    students: [],

    currentMessageId: null,

    currentFilter: "all",

    searchQuery: "",

    currentPage: 1,

    pageSize: 20,

    databaseName: "TeacherProDB",

    storeName: "messages",

    classesStoreName: "classes",

    sectionsStoreName: "sections",

    studentsStoreName: "students",

    webhookStoreName: "settings",


    /* =====================================================
       SELECTORS
       ===================================================== */

    selectors: {

        container:
            "#messagesContainer",

        empty:
            "#messagesEmpty",

        search:
            "#messageSearch",

        addButton:
            "#addMessageBtn",

        refreshButton:
            "#refreshMessagesBtn",

        filterButtons:
            "[data-message-filter]",

        classFilter:
            "#messageClassFilter",

        sectionFilter:
            "#messageSectionFilter",

        statusFilter:
            "#messageStatusFilter",

        form:
            "#messageForm",

        modal:
            "#messageModal",

        modalTitle:
            "#messageModalTitle",

        closeModal:
            "#closeMessageModal",

        cancel:
            "#cancelMessageBtn",

        senderName:
            "#messageSenderName",

        senderType:
            "#messageSenderType",

        classId:
            "#messageClassId",

        sectionId:
            "#messageSectionId",

        studentId:
            "#messageStudentId",

        text:
            "#messageText",

        webhook:
            "#messageWebhook",

        sendToDiscord:
            "#messageSendToDiscord",

        code:
            "#messageCode",

        count:
            "#messagesCount",

        unreadCount:
            "#messagesUnreadCount",

        archivedCount:
            "#messagesArchivedCount",

        todayCount:
            "#messagesTodayCount",

        pagination:
            "#messagesPagination"

    },


    /* =====================================================
       أنواع المرسل
       ===================================================== */

    senderTypes: {

        student: {
            label: "طالب",
            icon: "🎓"
        },

        mother: {
            label: "أم",
            icon: "👩"
        },

        father: {
            label: "أب",
            icon: "👨"
        },

        guardian: {
            label: "ولي أمر",
            icon: "👤"
        },

        teacher: {
            label: "مدرس",
            icon: "🧑‍🏫"
        },

        other: {
            label: "آخر",
            icon: "👥"
        }

    },


    /* =====================================================
       تشغيل القسم
       ===================================================== */

    async init() {

        try {

            if (this.initialized) {

                await this.refresh();

                return;

            }

            this.initialized = true;

            this.bindEvents();

            await this.loadRelatedData();

            await this.loadMessages();

            this.populateClassFilter();

            this.render();

            this.updateStatistics();

            this.dispatchReady();

        } catch (error) {

            console.error(
                "MessagesModule init error:",
                error
            );

        }

    },


    /* =====================================================
       الأحداث
       ===================================================== */

    bindEvents() {

        const addButton =
            document.querySelector(
                this.selectors.addButton
            );

        addButton?.addEventListener(
            "click",
            () => {

                this.openAddModal();

            }
        );


        const refreshButton =
            document.querySelector(
                this.selectors.refreshButton
            );

        refreshButton?.addEventListener(
            "click",
            async () => {

                await this.refresh();

            }
        );


        const search =
            document.querySelector(
                this.selectors.search
            );

        search?.addEventListener(
            "input",
            event => {

                this.searchQuery =
                    String(
                        event.target.value || ""
                    )
                    .trim()
                    .toLowerCase();

                this.currentPage = 1;

                this.render();

            }
        );


        const form =
            document.querySelector(
                this.selectors.form
            );

        form?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await this.saveMessage();

            }
        );


        const close =
            document.querySelector(
                this.selectors.closeModal
            );

        close?.addEventListener(
            "click",
            () => {

                this.closeModal();

            }
        );


        const cancel =
            document.querySelector(
                this.selectors.cancel
            );

        cancel?.addEventListener(
            "click",
            () => {

                this.closeModal();

            }
        );


        const classFilter =
            document.querySelector(
                this.selectors.classFilter
            );

        classFilter?.addEventListener(
            "change",
            event => {

                this.classFilter =
                    event.target.value;

                this.currentPage = 1;

                this.populateSectionFilter();

                this.render();

            }
        );


        const sectionFilter =
            document.querySelector(
                this.selectors.sectionFilter
            );

        sectionFilter?.addEventListener(
            "change",
            event => {

                this.sectionFilter =
                    event.target.value;

                this.currentPage = 1;

                this.render();

            }
        );


        const statusFilter =
            document.querySelector(
                this.selectors.statusFilter
            );

        statusFilter?.addEventListener(
            "change",
            event => {

                this.statusFilter =
                    event.target.value;

                this.currentPage = 1;

                this.render();

            }
        );


        const filters =
            document.querySelectorAll(
                this.selectors.filterButtons
            );

        filters.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        this.currentFilter =
                            button.dataset
                                .messageFilter ||
                            "all";

                        this.currentPage = 1;

                        filters.forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item === button
                                );

                            }
                        );

                        this.render();

                    }
                );

            }
        );


        const classInput =
            document.querySelector(
                this.selectors.classId
            );

        classInput?.addEventListener(
            "change",
            () => {

                this.populateSectionsForClass();

                this.populateStudentsForClass();

            }
        );


        const sectionInput =
            document.querySelector(
                this.selectors.sectionId
            );

        sectionInput?.addEventListener(
            "change",
            () => {

                this.populateStudentsForClass();

            }
        );


        const senderType =
            document.querySelector(
                this.selectors.senderType
            );

        senderType?.addEventListener(
            "change",
            () => {

                this.updateSenderTypeUI();

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape"
                ) {

                    this.closeModal();

                }

            }
        );


        document.addEventListener(
            "data:updated",
            async () => {

                await this.refresh();

            }
        );


        document.addEventListener(
            "classes:updated",
            async () => {

                await this.loadRelatedData();

                this.populateClassFilter();

                this.render();

            }
        );


        document.addEventListener(
            "students:updated",
            async () => {

                await this.loadRelatedData();

                this.render();

            }
        );

    },


    /* =====================================================
       تحميل البيانات المرتبطة
       ===================================================== */

    async loadRelatedData() {

        try {

            this.classes =
                await this.getAllFromStore(
                    this.classesStoreName
                );

        } catch {

            this.classes = [];

        }


        try {

            this.sections =
                await this.getAllFromStore(
                    this.sectionsStoreName
                );

        } catch {

            this.sections = [];

        }


        try {

            this.students =
                await this.getAllFromStore(
                    this.studentsStoreName
                );

        } catch {

            this.students = [];

        }


        if (
            !Array.isArray(
                this.classes
            )
        ) {

            this.classes = [];

        }


        if (
            !Array.isArray(
                this.sections
            )
        ) {

            this.sections = [];

        }


        if (
            !Array.isArray(
                this.students
            )
        ) {

            this.students = [];

        }

    },


    /* =====================================================
       تحميل الرسائل
       ===================================================== */

    async loadMessages() {

        try {

            this.messages =
                await this.getAllFromStore(
                    this.storeName
                );

        } catch (error) {

            console.error(
                "Cannot load messages:",
                error
            );

            this.messages = [];

        }


        this.messages.sort(
            (
                a,
                b
            ) => {

                return (
                    new Date(
                        b.createdAt || 0
                    ).getTime()
                ) -
                (
                    new Date(
                        a.createdAt || 0
                    ).getTime()
                );

            }
        );

    },


    /* =====================================================
       فتح قاعدة البيانات
       ===================================================== */

    openDatabase() {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const request =
                    indexedDB.open(
                        this.databaseName
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

            }
        );

    },


    /* =====================================================
       قراءة Store
       ===================================================== */

    async getAllFromStore(
        storeName
    ) {

        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll ===
            "function"
        ) {

            return await TeacherDB.getAll(
                storeName
            );

        }


        if (
            window.DB &&
            typeof DB.getAll ===
            "function"
        ) {

            return await DB.getAll(
                storeName
            );

        }


        const database =
            await this.openDatabase();


        if (
            !database.objectStoreNames.contains(
                storeName
            )
        ) {

            database.close();

            return [];

        }


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    database.transaction(
                        storeName,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        storeName
                    );

                const request =
                    store.getAll();

                request.onsuccess =
                    () => {

                        const result =
                            request.result ||
                            [];

                        database.close();

                        resolve(
                            result
                        );

                    };

                request.onerror =
                    () => {

                        database.close();

                        reject(
                            request.error
                        );

                    };

            }
        );

    },


    /* =====================================================
       إضافة رسالة
       ===================================================== */

    async addMessage(
        message
    ) {

        if (
            window.TeacherDB &&
            typeof TeacherDB.add ===
            "function"
        ) {

            return await TeacherDB.add(
                this.storeName,
                message
            );

        }


        if (
            window.DB &&
            typeof DB.add ===
            "function"
        ) {

            return await DB.add(
                this.storeName,
                message
            );

        }


        const database =
            await this.openDatabase();


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    database.transaction(
                        this.storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                const request =
                    store.add(
                        message
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

                transaction.oncomplete =
                    () => {

                        database.close();

                    };

            }
        );

    },


    /* =====================================================
       تعديل رسالة
       ===================================================== */

    async updateMessage(
        message
    ) {

        if (
            window.TeacherDB &&
            typeof TeacherDB.put ===
            "function"
        ) {

            return await TeacherDB.put(
                this.storeName,
                message
            );

        }


        if (
            window.DB &&
            typeof DB.put ===
            "function"
        ) {

            return await DB.put(
                this.storeName,
                message
            );

        }


        const database =
            await this.openDatabase();


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    database.transaction(
                        this.storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                const request =
                    store.put(
                        message
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            request.result
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

                transaction.oncomplete =
                    () => {

                        database.close();

                    };

            }
        );

    },


    /* =====================================================
       حذف رسالة
       ===================================================== */

    async deleteMessageFromDB(
        id
    ) {

        if (
            window.TeacherDB &&
            typeof TeacherDB.delete ===
            "function"
        ) {

            return await TeacherDB.delete(
                this.storeName,
                id
            );

        }


        if (
            window.DB &&
            typeof DB.delete ===
            "function"
        ) {

            return await DB.delete(
                this.storeName,
                id
            );

        }


        const database =
            await this.openDatabase();


        return new Promise(
            (
                resolve,
                reject
            ) => {

                const transaction =
                    database.transaction(
                        this.storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        this.storeName
                    );

                const request =
                    store.delete(
                        id
                    );

                request.onsuccess =
                    () => {

                        resolve(
                            true
                        );

                    };

                request.onerror =
                    () => {

                        reject(
                            request.error
                        );

                    };

                transaction.oncomplete =
                    () => {

                        database.close();

                    };

            }
        );

    },


    /* =====================================================
       فتح نافذة الإضافة
       ===================================================== */

    openAddModal() {

        this.currentMessageId =
            null;

        this.resetForm();

        const title =
            document.querySelector(
                this.selectors.modalTitle
            );

        if (title) {

            title.textContent =
                "إضافة رسالة";

        }

        this.showModal();

    },


    /* =====================================================
       فتح نافذة التعديل
       ===================================================== */

    openEditModal(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );

        if (!message) {

            return;

        }

        this.currentMessageId =
            id;


        this.setValue(
            this.selectors.senderName,
            message.senderName
        );


        this.setValue(
            this.selectors.senderType,
            message.senderType
        );


        this.setValue(
            this.selectors.classId,
            message.classId
        );


        this.populateSectionsForClass();


        this.setValue(
            this.selectors.sectionId,
            message.sectionId
        );


        this.populateStudentsForClass();


        this.setValue(
            this.selectors.studentId,
            message.studentId
        );


        this.setValue(
            this.selectors.text,
            message.text
        );


        this.setValue(
            this.selectors.webhook,
            message.webhook || ""
        );


        this.setChecked(
            this.selectors.sendToDiscord,
            false
        );


        this.setValue(
            this.selectors.code,
            message.code
        );


        const title =
            document.querySelector(
                this.selectors.modalTitle
            );

        if (title) {

            title.textContent =
                "تعديل رسالة";

        }

        this.showModal();

    },


    /* =====================================================
       إظهار النافذة
       ===================================================== */

    showModal() {

        const modal =
            document.querySelector(
                this.selectors.modal
            );

        if (!modal) {

            return;

        }

        modal.classList.add(
            "show"
        );

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );


        setTimeout(
            () => {

                document
                    .querySelector(
                        this.selectors.senderName
                    )
                    ?.focus();

            },
            200
        );

    },


    /* =====================================================
       إغلاق النافذة
       ===================================================== */

    closeModal() {

        const modal =
            document.querySelector(
                this.selectors.modal
            );

        if (modal) {

            modal.classList.remove(
                "show"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }

        document.body.classList.remove(
            "modal-open"
        );

        this.currentMessageId =
            null;

        this.resetForm();

    },


    /* =====================================================
       إعادة النموذج
       ===================================================== */

    resetForm() {

        const form =
            document.querySelector(
                this.selectors.form
            );

        if (form) {

            form.reset();

        }


        this.setValue(
            this.selectors.senderType,
            "student"
        );


        this.setValue(
            this.selectors.code,
            this.generateMessageCode()
        );


        this.setChecked(
            this.selectors.sendToDiscord,
            true
        );


        this.updateSenderTypeUI();


        this.populateClassInput();


        this.populateSectionsForClass();


        this.populateStudentsForClass();

    },


    /* =====================================================
       بيانات النموذج
       ===================================================== */

    getFormData() {

        return {

            senderName:
                this.getValue(
                    this.selectors.senderName
                ).trim(),

            senderType:
                this.getValue(
                    this.selectors.senderType
                ) || "student",

            classId:
                this.getValue(
                    this.selectors.classId
                ),

            sectionId:
                this.getValue(
                    this.selectors.sectionId
                ),

            studentId:
                this.getValue(
                    this.selectors.studentId
                ),

            text:
                this.getValue(
                    this.selectors.text
                ).trim(),

            webhook:
                this.getValue(
                    this.selectors.webhook
                ).trim(),

            sendToDiscord:
                this.getChecked(
                    this.selectors.sendToDiscord,
                    true
                )

        };

    },


    /* =====================================================
       حفظ الرسالة
       ===================================================== */

    async saveMessage() {

        try {

            const data =
                this.getFormData();


            const validation =
                this.validateMessage(
                    data
                );


            if (
                !validation.valid
            ) {

                this.showMessage(
                    validation.message,
                    "warning"
                );

                return;

            }


            const now =
                new Date();


            if (
                this.currentMessageId
            ) {

                const oldMessage =
                    this.getMessageById(
                        this.currentMessageId
                    );


                const updated = {

                    ...oldMessage,

                    ...data,

                    updatedAt:
                        now.toISOString()

                };


                await this.updateMessage(
                    updated
                );


                this.showMessage(
                    "تم تعديل الرسالة بنجاح",
                    "success"
                );


                if (
                    data.sendToDiscord
                ) {

                    await this.sendMessageToDiscord(
                        updated
                    );

                }

            } else {

                const message = {

                    id:
                        this.generateId(),

                    code:
                        this.generateMessageCode(),

                    senderName:
                        data.senderName,

                    senderType:
                        data.senderType,

                    classId:
                        data.classId,

                    sectionId:
                        data.sectionId,

                    studentId:
                        data.studentId,

                    text:
                        data.text,

                    webhook:
                        data.webhook,

                    status:
                        "unread",

                    archived:
                        false,

                    discordSent:
                        false,

                    discordError:
                        null,

                    createdAt:
                        now.toISOString(),

                    updatedAt:
                        now.toISOString(),

                    readAt:
                        null,

                    device:
                        this.getDeviceInfo(),

                    ip:
                        null

                };


                await this.addMessage(
                    message
                );


                if (
                    data.sendToDiscord
                ) {

                    await this.sendMessageToDiscord(
                        message
                    );

                }


                this.showMessage(
                    "تم حفظ الرسالة بنجاح",
                    "success"
                );

            }


            await this.refresh();

            this.closeModal();

            this.dispatchUpdate();

        } catch (error) {

            console.error(
                "Save message error:",
                error
            );

            this.showMessage(
                "حدث خطأ أثناء حفظ الرسالة",
                "error"
            );

        }

    },


    /* =====================================================
       التحقق
       ===================================================== */

    validateMessage(
        data
    ) {

        if (
            !data.senderName
        ) {

            return {

                valid: false,

                message:
                    "اكتب اسم المرسل"

            };

        }


        if (
            !data.senderType
        ) {

            return {

                valid: false,

                message:
                    "اختر صفة المرسل"

            };

        }


        if (
            !data.classId
        ) {

            return {

                valid: false,

                message:
                    "اختر الصف"

            };

        }


        if (
            !data.sectionId
        ) {

            return {

                valid: false,

                message:
                    "اختر الشعبة"

            };

        }


        if (
            !data.text
        ) {

            return {

                valid: false,

                message:
                    "اكتب نص الرسالة"

            };

        }


        if (
            data.text.length >
            5000
        ) {

            return {

                valid: false,

                message:
                    "الرسالة طويلة جداً"

            };

        }


        return {

            valid: true

        };

    },


    /* =====================================================
       إرسال Discord Webhook
       ===================================================== */

    async sendMessageToDiscord(
        message
    ) {

        const webhook =
            message.webhook ||
            await this.getSavedWebhook();


        if (
            !webhook
        ) {

            return false;

        }


        if (
            !this.isValidWebhook(
                webhook
            )
        ) {

            await this.markDiscordError(
                message,
                "رابط Webhook غير صالح"
            );

            return false;

        }


        const className =
            this.getClassName(
                message.classId
            );


        const sectionName =
            this.getSectionName(
                message.sectionId
            );


        const senderType =
            this.senderTypes[
                message.senderType
            ] ||
            this.senderTypes.other;


        const createdDate =
            this.formatDateTime(
                message.createdAt
            );


        const device =
            message.device ||
            this.getDeviceInfo();


        const payload = {

            username:
                "Teacher Pro",

            content:
                `📨 رسالة جديدة\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `👤 الاسم: ${message.senderName}\n` +
                `${senderType.icon} الصفة: ${senderType.label}\n` +
                `🏫 الصف: ${className}\n` +
                `📚 الشعبة: ${sectionName}\n` +
                `🧾 الكود: ${message.code}\n` +
                `🕐 الوقت: ${createdDate}\n` +
                `📱 الجهاز: ${device.platform}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💬 الرسالة:\n${message.text}`,

            allowed_mentions: {

                parse: []

            }

        };


        try {

            const response =
                await fetch(
                    webhook,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            if (
                !response.ok
            ) {

                throw new Error(
                    `Discord HTTP ${response.status}`
                );

            }


            message.discordSent =
                true;

            message.discordSentAt =
                new Date()
                    .toISOString();

            message.discordError =
                null;


            await this.updateMessage(
                message
            );


            this.showMessage(
                "تم إرسال الرسالة إلى Discord",
                "success"
            );


            return true;

        } catch (error) {

            console.error(
                "Discord webhook error:",
                error
            );


            await this.markDiscordError(
                message,
                error.message
            );


            this.showMessage(
                "تعذر إرسال الرسالة إلى Discord",
                "error"
            );


            return false;

        }

    },


    /* =====================================================
       حفظ خطأ Discord
       ===================================================== */

    async markDiscordError(
        message,
        error
    ) {

        message.discordSent =
            false;

        message.discordError =
            String(
                error ||
                "Unknown error"
            );

        message.updatedAt =
            new Date()
                .toISOString();


        try {

            await this.updateMessage(
                message
            );

        } catch (updateError) {

            console.error(
                updateError
            );

        }

    },


    /* =====================================================
       إعادة إرسال رسالة
       ===================================================== */

    async resendToDiscord(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );


        if (!message) {

            return;

        }


        await this.sendMessageToDiscord(
            message
        );


        await this.refresh();

    },


    /* =====================================================
       Webhook محفوظ
       ===================================================== */

    async getSavedWebhook() {

        try {

            const settings =
                await this.getAllFromStore(
                    this.webhookStoreName
                );


            if (
                !Array.isArray(
                    settings
                )
            ) {

                return "";

            }


            const setting =
                settings.find(
                    item =>

                        item.key ===
                        "discordWebhook" ||

                        item.name ===
                        "discordWebhook"

                );


            return setting?.value ||
                   setting?.webhook ||
                   "";

        } catch {

            return "";

        }

    },


    /* =====================================================
       التحقق من Webhook
       ===================================================== */

    isValidWebhook(
        webhook
    ) {

        try {

            const url =
                new URL(
                    webhook
                );


            return (
                url.protocol ===
                    "https:" &&

                (
                    url.hostname ===
                        "discord.com" ||

                    url.hostname ===
                        "discordapp.com"
                ) &&

                url.pathname.includes(
                    "/api/webhooks/"
                )

            );

        } catch {

            return false;

        }

    },


    /* =====================================================
       تعليم كمقروء
       ===================================================== */

    async markAsRead(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );


        if (!message) {

            return;

        }


        if (
            message.status ===
            "read"
        ) {

            return;

        }


        message.status =
            "read";

        message.readAt =
            new Date()
                .toISOString();

        message.updatedAt =
            message.readAt;


        await this.updateMessage(
            message
        );


        await this.refresh();


        this.dispatchUpdate();

    },


    /* =====================================================
       أرشفة
       ===================================================== */

    async archiveMessage(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );


        if (!message) {

            return;

        }


        message.archived =
            !Boolean(
                message.archived
            );


        message.updatedAt =
            new Date()
                .toISOString();


        await this.updateMessage(
            message
        );


        await this.refresh();


        this.showMessage(

            message.archived
                ? "تمت أرشفة الرسالة"
                : "تم إلغاء أرشفة الرسالة",

            "success"

        );

    },


    /* =====================================================
       حذف
       ===================================================== */

    async deleteMessage(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );


        if (!message) {

            return;

        }


        const confirmed =
            await this.confirm(
                `هل تريد حذف الرسالة ذات الكود ${message.code}؟`
            );


        if (!confirmed) {

            return;

        }


        try {

            await this.deleteMessageFromDB(
                id
            );


            this.messages =
                this.messages.filter(
                    item =>

                        String(
                            item.id
                        ) !==
                        String(
                            id
                        )
                );


            this.render();

            this.updateStatistics();

            this.dispatchUpdate();


            this.showMessage(
                "تم حذف الرسالة",
                "success"
            );

        } catch (error) {

            console.error(
                "Delete message error:",
                error
            );


            this.showMessage(
                "تعذر حذف الرسالة",
                "error"
            );

        }

    },


    /* =====================================================
       عرض الرسالة
       ===================================================== */

    async viewMessage(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );


        if (!message) {

            return;

        }


        await this.markAsRead(
            id
        );


        const className =
            this.getClassName(
                message.classId
            );


        const sectionName =
            this.getSectionName(
                message.sectionId
            );


        const studentName =
            this.getStudentName(
                message.studentId
            );


        const senderType =
            this.senderTypes[
                message.senderType
            ] ||
            this.senderTypes.other;


        const text =
            this.escapeHTML(
                message.text
            )
            .replace(
                /\n/g,
                "<br>"
            );


        const html = `

            <div class="message-details glass-card">

                <div class="message-details-header">

                    <div class="message-details-icon">

                        ${senderType.icon}

                    </div>

                    <div>

                        <h2>

                            ${this.escapeHTML(
                                message.senderName
                            )}

                        </h2>

                        <span>

                            ${senderType.label}

                        </span>

                    </div>

                </div>


                <div class="message-details-grid">

                    <div>

                        <small>
                            الكود
                        </small>

                        <strong>
                            ${this.escapeHTML(
                                message.code
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            الصف
                        </small>

                        <strong>
                            ${this.escapeHTML(
                                className
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            الشعبة
                        </small>

                        <strong>
                            ${this.escapeHTML(
                                sectionName
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            الطالب
                        </small>

                        <strong>
                            ${this.escapeHTML(
                                studentName ||
                                message.senderName
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            التاريخ
                        </small>

                        <strong>
                            ${this.formatDateTime(
                                message.createdAt
                            )}
                        </strong>

                    </div>


                    <div>

                        <small>
                            Discord
                        </small>

                        <strong>

                            ${
                                message.discordSent
                                    ? "🟢 تم الإرسال"
                                    : "🔴 لم يتم الإرسال"
                            }

                        </strong>

                    </div>

                </div>


                <div class="message-details-text">

                    <div class="message-text-label">

                        💬 نص الرسالة

                    </div>

                    <div class="message-text-content">

                        ${text}

                    </div>

                </div>


                <div class="message-details-device">

                    <div>

                        📱 الجهاز:
                        ${this.escapeHTML(
                            message.device?.platform ||
                            "غير معروف"
                        )}

                    </div>

                    <div>

                        🌐 المتصفح:
                        ${this.escapeHTML(
                            message.device?.browser ||
                            "غير معروف"
                        )}

                    </div>

                </div>

            </div>

        `;


        this.openDetailsDialog(
            html
        );

    },


    /* =====================================================
       نافذة التفاصيل
       ===================================================== */

    openDetailsDialog(
        html
    ) {

        const old =
            document.querySelector(
                "#messageDetailsDialog"
            );


        old?.remove();


        const dialog =
            document.createElement(
                "div"
            );


        dialog.id =
            "messageDetailsDialog";


        dialog.className =
            "message-details-overlay";


        dialog.innerHTML = `

            <div
                class="
                    message-details-wrapper
                    glass-card
                "
            >

                <button
                    type="button"
                    class="message-details-close"
                    aria-label="إغلاق"
                >

                    ×

                </button>


                ${html}

            </div>

        `;


        document.body.appendChild(
            dialog
        );


        dialog
            .querySelector(
                ".message-details-close"
            )
            ?.addEventListener(
                "click",
                () => {

                    dialog.remove();

                }
            );


        dialog.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    dialog
                ) {

                    dialog.remove();

                }

            }
        );

    },


    /* =====================================================
       نسخ الكود
       ===================================================== */

    async copyCode(
        id
    ) {

        const message =
            this.getMessageById(
                id
            );


        if (!message) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                message.code
            );


            this.showMessage(
                "تم نسخ كود الرسالة",
                "success"
            );

        } catch {

            this.showMessage(
                "تعذر نسخ الكود",
                "error"
            );

        }

    },


    /* =====================================================
       إنشاء الكود
       ===================================================== */

    generateMessageCode() {

        const date =
            new Date();


        const year =
            date.getFullYear()
                .toString()
                .slice(-2);


        const month =
            String(
                date.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            )
            .padStart(
                2,
                "0"
            );


        const random =
            Math.random()
                .toString(36)
                .substring(
                    2,
                    8
                )
                .toUpperCase();


        return `MSG-${year}${month}${day}-${random}`;

    },


    /* =====================================================
       توليد ID
       ===================================================== */

    generateId() {

        if (
            window.crypto &&
            typeof crypto.randomUUID ===
            "function"
        ) {

            return crypto.randomUUID();

        }


        return (

            "message_" +

            Date.now() +

            "_" +

            Math.random()
                .toString(36)
                .substring(
                    2,
                    12
                )

        );

    },


    /* =====================================================
       معلومات الجهاز
       ===================================================== */

    getDeviceInfo() {

        const ua =
            navigator.userAgent ||
            "";


        let browser =
            "Unknown";


        if (
            /Edg/i.test(
                ua
            )
        ) {

            browser =
                "Microsoft Edge";

        } else if (
            /Chrome/i.test(
                ua
            )
        ) {

            browser =
                "Google Chrome";

        } else if (
            /Firefox/i.test(
                ua
            )
        ) {

            browser =
                "Mozilla Firefox";

        } else if (
            /Safari/i.test(
                ua
            )
        ) {

            browser =
                "Safari";

        }


        let platform =
            "Unknown";


        if (
            /Android/i.test(
                ua
            )
        ) {

            platform =
                "Android";

        } else if (
            /iPhone|iPad|iPod/i.test(
                ua
            )
        ) {

            platform =
                "iOS";

        } else if (
            /Windows/i.test(
                ua
            )
        ) {

            platform =
                "Windows";

        } else if (
            /Macintosh/i.test(
                ua
            )
        ) {

            platform =
                "macOS";

        } else if (
            /Linux/i.test(
                ua
            )
        ) {

            platform =
                "Linux";

        }


        return {

            platform,

            browser,

            language:
                navigator.language ||
                "",

            screen:
                `${window.screen?.width || 0}x${
                    window.screen?.height || 0
                }`,

            timezone:
                Intl.DateTimeFormat()
                    .resolvedOptions()
                    .timeZone ||
                "",

            userAgent:
                ua.substring(
                    0,
                    500
                )

        };

    },


    /* =====================================================
       الصفوف في الفلتر
       ===================================================== */

    populateClassFilter() {

        const select =
            document.querySelector(
                this.selectors.classFilter
            );


        if (!select) {

            return;

        }


        const current =
            select.value;


        select.innerHTML =
            `<option value="">
                كل الصفوف
            </option>`;


        this.classes.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    item.name ||
                    item.title ||
                    item.className ||
                    "صف";


                select.appendChild(
                    option
                );

            }
        );


        if (current) {

            select.value =
                current;

        }

    },


    /* =====================================================
       الصفوف في نموذج الرسالة
       ===================================================== */

    populateClassInput() {

        const select =
            document.querySelector(
                this.selectors.classId
            );


        if (!select) {

            return;

        }


        const current =
            select.value;


        select.innerHTML =
            `<option value="">
                اختر الصف
            </option>`;


        this.classes.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    item.name ||
                    item.title ||
                    item.className ||
                    "صف";


                select.appendChild(
                    option
                );

            }
        );


        if (current) {

            select.value =
                current;

        }

    },


    /* =====================================================
       الشعب حسب الصف
       ===================================================== */

    populateSectionsForClass() {

        const classId =
            this.getValue(
                this.selectors.classId
            );


        const select =
            document.querySelector(
                this.selectors.sectionId
            );


        if (!select) {

            return;

        }


        const current =
            select.value;


        select.innerHTML =
            `<option value="">
                اختر الشعبة
            </option>`;


        const sections =
            this.getSectionsForClass(
                classId
            );


        sections.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    item.name ||
                    item.title ||
                    item.sectionName ||
                    "شعبة";


                select.appendChild(
                    option
                );

            }
        );


        if (current) {

            select.value =
                current;

        }

    },


    /* =====================================================
       فلتر الشعب
       ===================================================== */

    populateSectionFilter() {

        const select =
            document.querySelector(
                this.selectors.sectionFilter
            );


        if (!select) {

            return;

        }


        const classId =
            document.querySelector(
                this.selectors.classFilter
            )?.value ||
            "";


        select.innerHTML =
            `<option value="">
                كل الشعب
            </option>`;


        const sections =
            this.getSectionsForClass(
                classId
            );


        sections.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    item.name ||
                    item.title ||
                    item.sectionName ||
                    "شعبة";


                select.appendChild(
                    option
                );

            }
        );

    },


    /* =====================================================
       الطلاب
       ===================================================== */

    populateStudentsForClass() {

        const studentSelect =
            document.querySelector(
                this.selectors.studentId
            );


        if (!studentSelect) {

            return;

        }


        const classId =
            this.getValue(
                this.selectors.classId
            );


        const sectionId =
            this.getValue(
                this.selectors.sectionId
            );


        const current =
            studentSelect.value;


        studentSelect.innerHTML =
            `<option value="">
                اختر الطالب إن وجد
            </option>`;


        const students =
            this.students.filter(
                student => {

                    const studentClass =
                        student.classId ||
                        student.class_id;


                    const studentSection =
                        student.sectionId ||
                        student.section_id;


                    const classMatch =
                        !classId ||
                        String(
                            studentClass
                        ) ===
                        String(
                            classId
                        );


                    const sectionMatch =
                        !sectionId ||
                        String(
                            studentSection
                        ) ===
                        String(
                            sectionId
                        );


                    return (
                        classMatch &&
                        sectionMatch
                    );

                }
            );


        students.sort(
            (
                a,
                b
            ) => {

                const aName =
                    a.name ||
                    a.fullName ||
                    a.studentName ||
                    "";

                const bName =
                    b.name ||
                    b.fullName ||
                    b.studentName ||
                    "";

                return aName.localeCompare(
                    bName,
                    "ar"
                );

            }
        );


        students.forEach(
            student => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    student.id;


                option.textContent =
                    student.name ||
                    student.fullName ||
                    student.studentName ||
                    "طالب";


                studentSelect.appendChild(
                    option
                );

            }
        );


        if (current) {

            studentSelect.value =
                current;

        }

    },


    /* =====================================================
       الشعب حسب الصف
       ===================================================== */

    getSectionsForClass(
        classId
    ) {

        if (!classId) {

            return this.sections;

        }


        return this.sections.filter(
            section => {

                const sectionClass =
                    section.classId ||
                    section.class_id;


                return (
                    String(
                        sectionClass
                    ) ===
                    String(
                        classId
                    )
                );

            }
        );

    },


    /* =====================================================
       تحديث واجهة نوع المرسل
       ===================================================== */

    updateSenderTypeUI() {

        const type =
            this.getValue(
                this.selectors.senderType
            );


        const studentSelect =
            document.querySelector(
                this.selectors.studentId
            );


        if (!studentSelect) {

            return;

        }


        if (
            type === "student"
        ) {

            studentSelect.disabled =
                false;

        } else {

            studentSelect.disabled =
                false;

        }

    },


    /* =====================================================
       البحث والفلترة
       ===================================================== */

    getFilteredMessages() {

        let result =
            [
                ...this.messages
            ];


        if (
            this.currentFilter ===
            "unread"
        ) {

            result =
                result.filter(
                    item =>

                        item.status ===
                        "unread"

                );

        }


        if (
            this.currentFilter ===
            "read"
        ) {

            result =
                result.filter(
                    item =>

                        item.status ===
                        "read"

                );

        }


        if (
            this.currentFilter ===
            "archived"
        ) {

            result =
                result.filter(
                    item =>

                        item.archived ===
                        true

                );

        }


        if (
            this.currentFilter ===
            "discord_failed"
        ) {

            result =
                result.filter(
                    item =>

                        item.discordSent !==
                        true

                );

        }


        const classId =
            document.querySelector(
                this.selectors.classFilter
            )?.value ||
            "";


        const sectionId =
            document.querySelector(
                this.selectors.sectionFilter
            )?.value ||
            "";


        const status =
            document.querySelector(
                this.selectors.statusFilter
            )?.value ||
            "";


        if (classId) {

            result =
                result.filter(
                    item =>

                        String(
                            item.classId
                        ) ===
                        String(
                            classId
                        )

                );

        }


        if (sectionId) {

            result =
                result.filter(
                    item =>

                        String(
                            item.sectionId
                        ) ===
                        String(
                            sectionId
                        )

                );

        }


        if (status) {

            result =
                result.filter(
                    item =>

                        status === "archived"
                            ? item.archived === true
                            : item.status === status

                );

        }


        if (
            this.searchQuery
        ) {

            result =
                result.filter(
                    item => {

                        const searchable =

                            `${item.senderName || ""}
                            ${item.text || ""}
                            ${item.code || ""}
                            ${this.getClassName(item.classId)}
                            ${this.getSectionName(item.sectionId)}
                            ${this.getStudentName(item.studentId)}`

                                .toLowerCase();


                        return searchable.includes(
                            this.searchQuery
                        );

                    }
                );

        }


        return result;

    },


    /* =====================================================
       الرسم
       ===================================================== */

    render() {

        const container =
            document.querySelector(
                this.selectors.container
            );


        if (!container) {

            return;

        }


        const messages =
            this.getFilteredMessages();


        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    messages.length /
                    this.pageSize
                )
            );


        if (
            this.currentPage >
            totalPages
        ) {

            this.currentPage =
                totalPages;

        }


        const start =
            (
                this.currentPage -
                1
            ) *
            this.pageSize;


        const visible =
            messages.slice(
                start,
                start +
                this.pageSize
            );


        container.innerHTML =
            "";


        if (
            visible.length ===
            0
        ) {

            this.renderEmpty();

            this.renderPagination(
                0
            );

            this.updateStatistics();

            return;

        }


        visible.forEach(
            message => {

                container.appendChild(
                    this.createMessageCard(
                        message
                    )
                );

            }
        );


        this.renderPagination(
            totalPages
        );


        this.updateStatistics();

    },


    /* =====================================================
       إنشاء كارد الرسالة
       ===================================================== */

    createMessageCard(
        message
    ) {

        const card =
            document.createElement(
                "article"
            );


        card.className =
            "message-card glass-card";


        if (
            message.status ===
            "unread"
        ) {

            card.classList.add(
                "message-unread"
            );

        }


        if (
            message.archived
        ) {

            card.classList.add(
                "message-archived"
            );

        }


        const senderType =
            this.senderTypes[
                message.senderType
            ] ||
            this.senderTypes.other;


        const className =
            this.getClassName(
                message.classId
            );


        const sectionName =
            this.getSectionName(
                message.sectionId
            );


        const studentName =
            this.getStudentName(
                message.studentId
            );


        const safeName =
            this.escapeHTML(
                message.senderName
            );


        const safeText =
            this.escapeHTML(
                message.text
            );


        const preview =
            safeText.length >
            180
                ? safeText.substring(
                    0,
                    180
                ) +
                "..."
                : safeText;


        card.innerHTML = `

            <div class="message-card-top">

                <div class="message-sender-avatar">

                    ${senderType.icon}

                </div>


                <div class="message-sender-info">

                    <h3>

                        ${safeName}

                    </h3>


                    <div class="message-meta">

                        <span>

                            ${senderType.label}

                        </span>


                        <span>

                            🏫
                            ${this.escapeHTML(
                                className
                            )}

                        </span>


                        <span>

                            📚
                            ${this.escapeHTML(
                                sectionName
                            )}

                        </span>

                    </div>

                </div>


                <div class="message-state">

                    ${
                        message.status ===
                        "unread"

                            ? `<span
                                class="message-badge unread"
                              >
                                🔵 جديد
                              </span>`

                            : `<span
                                class="message-badge read"
                              >
                                ✓ مقروء
                              </span>`
                    }


                    ${
                        message.archived

                            ? `<span
                                class="message-badge archived"
                              >
                                📦 مؤرشف
                              </span>`

                            : ""
                    }

                </div>

            </div>


            <div class="message-card-content">

                <div class="message-code">

                    🧾
                    ${this.escapeHTML(
                        message.code
                    )}

                </div>


                ${
                    studentName
                        ? `
                            <div class="message-student">

                                🎓 الطالب:

                                <strong>

                                    ${this.escapeHTML(
                                        studentName
                                    )}

                                </strong>

                            </div>
                          `
                        : ""
                }


                <div class="message-preview">

                    ${preview}

                </div>

            </div>


            <div class="message-card-footer">

                <time>

                    🕐
                    ${this.formatDateTime(
                        message.createdAt
                    )}

                </time>


                <div class="message-discord-status">

                    ${
                        message.discordSent

                            ? "🟢 Discord"

                            : message.discordError

                                ? "🔴 Discord"

                                : "⚪ لم يرسل"

                    }

                </div>


                <div class="message-actions">

                    <button
                        type="button"
                        class="message-action view"
                        data-action="view"
                        data-id="${message.id}"
                        title="عرض"
                    >

                        👁️

                    </button>


                    <button
                        type="button"
                        class="message-action copy"
                        data-action="copy"
                        data-id="${message.id}"
                        title="نسخ الكود"
                    >

                        📋

                    </button>


                    ${
                        !message.discordSent

                            ? `
                                <button
                                    type="button"
                                    class="
                                        message-action
                                        resend
                                    "
                                    data-action="resend"
                                    data-id="${message.id}"
                                    title="إرسال إلى Discord"
                                >
                                    🔄
                                </button>
                              `

                            : ""
                    }


                    <button
                        type="button"
                        class="message-action edit"
                        data-action="edit"
                        data-id="${message.id}"
                        title="تعديل"
                    >

                        ✏️

                    </button>


                    <button
                        type="button"
                        class="message-action archive"
                        data-action="archive"
                        data-id="${message.id}"
                        title="
                            ${
                                message.archived
                                    ? "إلغاء الأرشفة"
                                    : "أرشفة"
                            }
                        "
                    >

                        ${
                            message.archived
                                ? "📤"
                                : "📦"
                        }

                    </button>


                    <button
                        type="button"
                        class="message-action delete"
                        data-action="delete"
                        data-id="${message.id}"
                        title="حذف"
                    >

                        🗑️

                    </button>

                </div>

            </div>

        `;


        this.bindCardEvents(
            card
        );


        return card;

    },


    /* =====================================================
       أحداث الكارد
       ===================================================== */

    bindCardEvents(
        card
    ) {

        card
            .querySelectorAll(
                "[data-action]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async event => {

                            event.stopPropagation();


                            const action =
                                button.dataset.action;


                            const id =
                                button.dataset.id;


                            switch (
                                action
                            ) {

                                case "view":

                                    await this.viewMessage(
                                        id
                                    );

                                    break;


                                case "copy":

                                    await this.copyCode(
                                        id
                                    );

                                    break;


                                case "resend":

                                    await this.resendToDiscord(
                                        id
                                    );

                                    break;


                                case "edit":

                                    this.openEditModal(
                                        id
                                    );

                                    break;


                                case "archive":

                                    await this.archiveMessage(
                                        id
                                    );

                                    break;


                                case "delete":

                                    await this.deleteMessage(
                                        id
                                    );

                                    break;

                            }

                        }
                    );

                }
            );


        card.addEventListener(
            "click",
            () => {

                const id =
                    card.dataset.id ||
                    card.querySelector(
                        "[data-id]"
                    )?.dataset.id;


                if (id) {

                    this.viewMessage(
                        id
                    );

                }

            }
        );

    },


    /* =====================================================
       فارغ
       ===================================================== */

    renderEmpty() {

        const container =
            document.querySelector(
                this.selectors.container
            );


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div
                class="
                    messages-empty
                    glass-card
                "
            >

                <div class="messages-empty-icon">

                    💬

                </div>


                <h3>

                    لا توجد رسائل

                </h3>


                <p>

                    عند وصول رسالة من طالب أو ولي أمر
                    ستظهر هنا بشكل مرتب.

                </p>


                <button
                    type="button"
                    class="messages-empty-btn"
                    id="emptyAddMessageBtn"
                >

                    ✨ إضافة رسالة

                </button>

            </div>

        `;


        document
            .querySelector(
                "#emptyAddMessageBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    this.openAddModal();

                }
            );

    },


    /* =====================================================
       Pagination
       ===================================================== */

    renderPagination(
        totalPages
    ) {

        const container =
            document.querySelector(
                this.selectors.pagination
            );


        if (!container) {

            return;

        }


        container.innerHTML =
            "";


        if (
            totalPages <=
            1
        ) {

            return;

        }


        const previous =
            document.createElement(
                "button"
            );


        previous.type =
            "button";


        previous.className =
            "pagination-btn";


        previous.textContent =
            "‹";


        previous.disabled =
            this.currentPage <= 1;


        previous.addEventListener(
            "click",
            () => {

                if (
                    this.currentPage >
                    1
                ) {

                    this.currentPage--;

                    this.render();

                }

            }
        );


        container.appendChild(
            previous
        );


        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            if (
                totalPages > 7 &&
                Math.abs(
                    page -
                    this.currentPage
                ) > 2 &&
                page !== 1 &&
                page !== totalPages
            ) {

                continue;

            }


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "pagination-btn";


            button.textContent =
                page;


            if (
                page ===
                this.currentPage
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.addEventListener(
                "click",
                () => {

                    this.currentPage =
                        page;

                    this.render();

                }
            );


            container.appendChild(
                button
            );

        }


        const next =
            document.createElement(
                "button"
            );


        next.type =
            "button";


        next.className =
            "pagination-btn";


        next.textContent =
            "›";


        next.disabled =
            this.currentPage >=
            totalPages;


        next.addEventListener(
            "click",
            () => {

                if (
                    this.currentPage <
                    totalPages
                ) {

                    this.currentPage++;

                    this.render();

                }

            }
        );


        container.appendChild(
            next
        );

    },


    /* =====================================================
       الإحصائيات
       ===================================================== */

    updateStatistics() {

        const total =
            this.messages.length;


        const unread =
            this.messages.filter(
                item =>
                    item.status ===
                    "unread"
            ).length;


        const archived =
            this.messages.filter(
                item =>
                    item.archived ===
                    true
            ).length;


        const today =
            this.messages.filter(
                item =>
                    this.isToday(
                        item.createdAt
                    )
            ).length;


        this.setText(
            this.selectors.count,
            total
        );


        this.setText(
            this.selectors.unreadCount,
            unread
        );


        this.setText(
            this.selectors.archivedCount,
            archived
        );


        this.setText(
            this.selectors.todayCount,
            today
        );


        document.dispatchEvent(

            new CustomEvent(
                "messages:statistics",
                {

                    detail: {

                        total,

                        unread,

                        archived,

                        today

                    }

                }
            )

        );

    },


    /* =====================================================
       اسم الصف
       ===================================================== */

    getClassName(
        id
    ) {

        if (!id) {

            return "غير محدد";

        }


        const item =
            this.classes.find(
                classItem =>

                    String(
                        classItem.id
                    ) ===
                    String(
                        id
                    )

            );


        if (!item) {

            return "غير معروف";

        }


        return (
            item.name ||
            item.title ||
            item.className ||
            "صف"
        );

    },


    /* =====================================================
       اسم الشعبة
       ===================================================== */

    getSectionName(
        id
    ) {

        if (!id) {

            return "غير محددة";

        }


        const item =
            this.sections.find(
                section =>

                    String(
                        section.id
                    ) ===
                    String(
                        id
                    )

            );


        if (!item) {

            return "غير معروفة";

        }


        return (
            item.name ||
            item.title ||
            item.sectionName ||
            "شعبة"
        );

    },


    /* =====================================================
       اسم الطالب
       ===================================================== */

    getStudentName(
        id
    ) {

        if (!id) {

            return "";

        }


        const student =
            this.students.find(
                item =>

                    String(
                        item.id
                    ) ===
                    String(
                        id
                    )

            );


        if (!student) {

            return "";

        }


        return (
            student.name ||
            student.fullName ||
            student.studentName ||
            ""
        );

    },


    /* =====================================================
       الحصول على رسالة
       ===================================================== */

    getMessageById(
        id
    ) {

        return this.messages.find(
            message =>

                String(
                    message.id
                ) ===
                String(
                    id
                )

        ) || null;

    },


    /* =====================================================
       التاريخ والوقت
       ===================================================== */

    formatDateTime(
        value
    ) {

        if (!value) {

            return "غير محدد";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "غير محدد";

        }


        return new Intl.DateTimeFormat(
            "ar-IQ",
            {

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hour12:
                    true

            }
        )
        .format(
            date
        );

    },


    /* =====================================================
       اليوم
       ===================================================== */

    isToday(
        value
    ) {

        if (!value) {

            return false;

        }


        const date =
            new Date(
                value
            );


        const now =
            new Date();


        return (

            date.getFullYear() ===
            now.getFullYear() &&

            date.getMonth() ===
            now.getMonth() &&

            date.getDate() ===
            now.getDate()

        );

    },


    /* =====================================================
       تعيين قيمة
       ===================================================== */

    setValue(
        selector,
        value
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            element.value =
                value ??
                "";

        }

    },


    /* =====================================================
       قراءة قيمة
       ===================================================== */

    getValue(
        selector
    ) {

        const element =
            document.querySelector(
                selector
            );


        return element
            ? String(
                element.value ||
                ""
            )
            : "";

    },


    /* =====================================================
       Checkbox
       ===================================================== */

    setChecked(
        selector,
        value
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            element.checked =
                Boolean(
                    value
                );

        }

    },


    getChecked(
        selector,
        fallback = false
    ) {

        const element =
            document.querySelector(
                selector
            );


        return element
            ? element.checked
            : fallback;

    },


    /* =====================================================
       نص
       ===================================================== */

    setText(
        selector,
        value
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (element) {

            element.textContent =
                value;

        }

    },


    /* =====================================================
       HTML Escape
       ===================================================== */

    escapeHTML(
        value
    ) {

        return String(
            value ??
            ""
        )

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    },


    /* =====================================================
       تأكيد
       ===================================================== */

    async confirm(
        message
    ) {

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

    },


    /* =====================================================
       Toast
       ===================================================== */

    showMessage(
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

    },


    /* =====================================================
       تحديث
       ===================================================== */

    async refresh() {

        await this.loadRelatedData();

        await this.loadMessages();

        this.populateClassFilter();

        this.populateSectionFilter();

        this.render();

        this.updateStatistics();

    },


    /* =====================================================
       حدث التحديث
       ===================================================== */

    dispatchUpdate() {

        document.dispatchEvent(

            new CustomEvent(
                "messages:updated",
                {

                    detail: {

                        count:
                            this.messages.length,

                        unread:
                            this.messages.filter(
                                item =>
                                    item.status ===
                                    "unread"
                            ).length

                    }

                }
            )

        );

    },


    /* =====================================================
       حدث الجاهزية
       ===================================================== */

    dispatchReady() {

        document.dispatchEvent(

            new CustomEvent(
                "messages:ready",
                {

                    detail: {

                        module:
                            "MessagesModule"

                    }

                }
            )

        );

    },


    /* =====================================================
       تصدير الرسائل JSON
       ===================================================== */

    exportJSON() {

        const data =
            JSON.stringify(
                this.messages,
                null,
                2
            );


        const blob =
            new Blob(
                [
                    data
                ],
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
            `messages-${this.getFileDate()}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );

    },


    /* =====================================================
       تاريخ الملف
       ===================================================== */

    getFileDate() {

        const date =
            new Date();


        return (

            date.getFullYear() +

            "-" +

            String(
                date.getMonth() + 1
            )
            .padStart(
                2,
                "0"
            ) +

            "-" +

            String(
                date.getDate()
            )
            .padStart(
                2,
                "0"
            )

        );

    },


    /* =====================================================
       استيراد JSON
       ===================================================== */

    async importJSON(
        file
    ) {

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


            if (
                !Array.isArray(
                    data
                )
            ) {

                throw new Error(
                    "Invalid data"
                );

            }


            let imported =
                0;


            for (
                const item of data
            ) {

                if (
                    !item.id
                ) {

                    item.id =
                        this.generateId();

                }


                if (
                    !item.code
                ) {

                    item.code =
                        this.generateMessageCode();

                }


                if (
                    !item.createdAt
                ) {

                    item.createdAt =
                        new Date()
                            .toISOString();

                }


                if (
                    !item.updatedAt
                ) {

                    item.updatedAt =
                        item.createdAt;

                }


                await this.addMessage(
                    item
                );


                imported++;

            }


            await this.refresh();


            this.showMessage(
                `تم استيراد ${imported} رسالة`,
                "success"
            );


        } catch (error) {

            console.error(
                "Import messages error:",
                error
            );


            this.showMessage(
                "ملف الرسائل غير صالح",
                "error"
            );

        }

    },


    /* =====================================================
       حذف جميع الرسائل المؤرشفة
       ===================================================== */

    async deleteArchived() {

        const archived =
            this.messages.filter(
                item =>
                    item.archived ===
                    true
            );


        if (
            archived.length ===
            0
        ) {

            this.showMessage(
                "لا توجد رسائل مؤرشفة",
                "info"
            );

            return;

        }


        const confirmed =
            await this.confirm(
                `سيتم حذف ${archived.length} رسالة مؤرشفة. هل أنت متأكد؟`
            );


        if (!confirmed) {

            return;

        }


        for (
            const message of archived
        ) {

            try {

                await this.deleteMessageFromDB(
                    message.id
                );

            } catch (error) {

                console.error(
                    error
                );

            }

        }


        await this.refresh();


        this.showMessage(
            "تم حذف الرسائل المؤرشفة",
            "success"
        );

    },


    /* =====================================================
       تحديد جميع الرسائل كمقروءة
       ===================================================== */

    async markAllAsRead() {

        const unread =
            this.messages.filter(
                item =>
                    item.status ===
                    "unread"
            );


        if (
            unread.length ===
            0
        ) {

            this.showMessage(
                "لا توجد رسائل جديدة",
                "info"
            );

            return;

        }


        for (
            const message of unread
        ) {

            message.status =
                "read";

            message.readAt =
                new Date()
                    .toISOString();

            message.updatedAt =
                message.readAt;


            try {

                await this.updateMessage(
                    message
                );

            } catch (error) {

                console.error(
                    error
                );

            }

        }


        await this.refresh();


        this.showMessage(
            "تم تعليم جميع الرسائل كمقروءة",
            "success"
        );

    },


    /* =====================================================
       البحث برمز
       ===================================================== */

    findByCode(
        code
    ) {

        if (!code) {

            return null;

        }


        return this.messages.find(
            message =>

                String(
                    message.code
                ).toLowerCase() ===
                String(
                    code
                ).trim().toLowerCase()

        ) || null;

    },


    /* =====================================================
       البحث باسم الطالب
       ===================================================== */

    findByStudent(
        studentId
    ) {

        return this.messages.filter(
            message =>

                String(
                    message.studentId
                ) ===
                String(
                    studentId
                )

        );

    },


    /* =====================================================
       رسائل صف
       ===================================================== */

    findByClass(
        classId
    ) {

        return this.messages.filter(
            message =>

                String(
                    message.classId
                ) ===
                String(
                    classId
                )

        );

    },


    /* =====================================================
       رسائل شعبة
       ===================================================== */

    findBySection(
        sectionId
    ) {

        return this.messages.filter(
            message =>

                String(
                    message.sectionId
                ) ===
                String(
                    sectionId
                )

        );

    },


    /* =====================================================
       تنظيف
       ===================================================== */

    destroy() {

        this.initialized =
            false;

        this.messages =
            [];

        this.classes =
            [];

        this.sections =
            [];

        this.students =
            [];

        this.currentMessageId =
            null;

        this.currentFilter =
            "all";

        this.searchQuery =
            "";

    }

};


/* =========================================================
   GLOBAL
   ========================================================= */

window.MessagesModule =
    MessagesModule;


/* =========================================================
   اختصارات عامة
   ========================================================= */

window.openMessages =
function () {

    MessagesModule.init();

};


window.addTeacherMessage =
function () {

    MessagesModule.openAddModal();

};


window.searchTeacherMessage =
function (
    query
) {

    MessagesModule.searchQuery =
        String(
            query ||
            ""
        )
        .trim()
        .toLowerCase();

    MessagesModule.currentPage =
        1;

    MessagesModule.render();

};


window.findTeacherMessageByCode =
function (
    code
) {

    return MessagesModule.findByCode(
        code
    );

};


window.exportTeacherMessages =
function () {

    MessagesModule.exportJSON();

};


window.markAllTeacherMessagesRead =
async function () {

    await MessagesModule.markAllAsRead();

};


/* =========================================================
   التشغيل التلقائي
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            async () => {

                await MessagesModule.init();

            },
            400
        );

    }
);