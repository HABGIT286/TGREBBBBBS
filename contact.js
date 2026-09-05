/* =========================================================
   TEACHER PRO
   contact.js

   قسم التواصل

   المميزات:
   - إضافة حسابات التواصل
   - Telegram
   - البريد الإلكتروني
   - Facebook
   - WhatsApp
   - Discord
   - موقع إلكتروني
   - رابط مخصص
   - تفعيل وإيقاف أي وسيلة
   - تعديل البيانات
   - حذف البيانات
   - فتح الرابط مباشرة
   - تخزين البيانات داخل IndexedDB
   - تحديث تلقائي بدون إعادة تحميل الصفحة
   - ترتيب وسائل التواصل
   - بحث سريع
   ========================================================= */

"use strict";


/* =========================================================
   CONTACT MODULE
   ========================================================= */

const ContactModule = {


    /* =====================================================
       الإعدادات الأساسية
       ===================================================== */

    initialized: false,

    contacts: [],

    editingId: null,

    activeFilter: "all",


    /* =====================================================
       اسم قاعدة البيانات
       ===================================================== */

    databaseName: "TeacherProDB",


    /* =====================================================
       اسم الـ Store
       ===================================================== */

    storeName: "contacts",


    /* =====================================================
       Selectors
       ===================================================== */

    selectors: {

        container:
            "#contactsContainer",

        addButton:
            "#addContactBtn",

        searchInput:
            "#contactSearch",

        modal:
            "#contactModal",

        modalTitle:
            "#contactModalTitle",

        form:
            "#contactForm",

        idInput:
            "#contactId",

        typeInput:
            "#contactType",

        titleInput:
            "#contactTitle",

        valueInput:
            "#contactValue",

        descriptionInput:
            "#contactDescription",

        activeInput:
            "#contactActive",

        iconInput:
            "#contactIcon",

        colorInput:
            "#contactColor",

        orderInput:
            "#contactOrder",

        closeButton:
            "#closeContactModal",

        cancelButton:
            "#cancelContactBtn",

        saveButton:
            "#saveContactBtn",

        filters:
            "[data-contact-filter]",

        count:
            "#contactsCount",

        empty:
            "#contactsEmpty"

    },


    /* =====================================================
       أنواع التواصل
       ===================================================== */

    types: {

        telegram: {

            name:
                "Telegram",

            arabicName:
                "تلجرام",

            icon:
                "✈️",

            color:
                "#229ED9"

        },


        email: {

            name:
                "Email",

            arabicName:
                "البريد الإلكتروني",

            icon:
                "📧",

            color:
                "#EA4335"

        },


        facebook: {

            name:
                "Facebook",

            arabicName:
                "فيسبوك",

            icon:
                "📘",

            color:
                "#1877F2"

        },


        whatsapp: {

            name:
                "WhatsApp",

            arabicName:
                "واتساب",

            icon:
                "💬",

            color:
                "#25D366"

        },


        discord: {

            name:
                "Discord",

            arabicName:
                "ديسكورد",

            icon:
                "🎮",

            color:
                "#5865F2"

        },


        website: {

            name:
                "Website",

            arabicName:
                "موقع إلكتروني",

            icon:
                "🌐",

            color:
                "#00C2FF"

        },


        phone: {

            name:
                "Phone",

            arabicName:
                "رقم هاتف",

            icon:
                "📱",

            color:
                "#00C853"

        },


        custom: {

            name:
                "Custom",

            arabicName:
                "رابط مخصص",

            icon:
                "🔗",

            color:
                "#9C27B0"

        }

    },


    /* =====================================================
       تشغيل القسم
       ===================================================== */

    async init() {

        try {

            if (
                this.initialized
            ) {

                await this.refresh();

                return;

            }


            this.initialized =
                true;


            this.bindEvents();


            await this.loadContacts();


            this.render();


            this.dispatchReadyEvent();


        } catch (error) {

            console.error(
                "ContactModule initialization error:",
                error
            );

        }

    },


    /* =====================================================
       ربط الأحداث
       ===================================================== */

    bindEvents() {

        const addButton =
            document.querySelector(
                this.selectors.addButton
            );


        if (
            addButton
        ) {

            addButton.addEventListener(
                "click",
                () => {

                    this.openAddModal();

                }
            );

        }


        const form =
            document.querySelector(
                this.selectors.form
            );


        if (
            form
        ) {

            form.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    await this.saveContact();

                }
            );

        }


        const closeButton =
            document.querySelector(
                this.selectors.closeButton
            );


        if (
            closeButton
        ) {

            closeButton.addEventListener(
                "click",
                () => {

                    this.closeModal();

                }
            );

        }


        const cancelButton =
            document.querySelector(
                this.selectors.cancelButton
            );


        if (
            cancelButton
        ) {

            cancelButton.addEventListener(
                "click",
                () => {

                    this.closeModal();

                }
            );

        }


        const searchInput =
            document.querySelector(
                this.selectors.searchInput
            );


        if (
            searchInput
        ) {

            searchInput.addEventListener(
                "input",
                event => {

                    this.search(
                        event.target.value
                    );

                }
            );

        }


        const filters =
            document.querySelectorAll(
                this.selectors.filters
            );


        filters.forEach(
            filter => {

                filter.addEventListener(
                    "click",
                    () => {

                        const type =
                            filter.dataset
                                .contactFilter;


                        this.setFilter(
                            type
                        );

                    }
                );

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

    },


    /* =====================================================
       تحميل جهات التواصل
       ===================================================== */

    async loadContacts() {

        try {

            this.contacts =
                await this.getAll();


            if (
                !Array.isArray(
                    this.contacts
                )
            ) {

                this.contacts =
                    [];

            }


            this.contacts.sort(
                (
                    a,
                    b
                ) => {

                    return (
                        Number(
                            a.order
                        ) || 0
                    ) -
                    (
                        Number(
                            b.order
                        ) || 0
                    );

                }
            );


        } catch (error) {

            console.error(
                "Cannot load contacts:",
                error
            );


            this.contacts =
                [];

        }

    },


    /* =====================================================
       الحصول على جميع البيانات
       ===================================================== */

    async getAll() {

        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll ===
            "function"
        ) {

            return await TeacherDB.getAll(
                this.storeName
            );

        }


        if (
            window.DB &&
            typeof DB.getAll ===
            "function"
        ) {

            return await DB.getAll(
                this.storeName
            );

        }


        return await this.getAllIndexedDB();

    },


    /* =====================================================
       IndexedDB GET ALL
       ===================================================== */

    async getAllIndexedDB() {

        const database =
            await this.openDatabase();


        return new Promise(
            (
                resolve,
                reject
            ) => {

                if (
                    !database
                        .objectStoreNames
                        .contains(
                            this.storeName
                        )
                ) {

                    database.close();


                    resolve(
                        []
                    );


                    return;

                }


                const transaction =
                    database.transaction(
                        this.storeName,
                        "readonly"
                    );


                const store =
                    transaction.objectStore(
                        this.storeName
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
       فتح IndexedDB
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
       حفظ جهة تواصل
       ===================================================== */

    async saveContact() {

        try {

            const data =
                this.getFormData();


            const validation =
                this.validateContact(
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


            if (
                this.editingId
            ) {

                data.id =
                    this.editingId;


                const oldContact =
                    this.getContactById(
                        this.editingId
                    );


                data.createdAt =
                    oldContact?.createdAt ||
                    new Date()
                        .toISOString();


                data.updatedAt =
                    new Date()
                        .toISOString();


                await this.update(
                    data
                );


                this.showMessage(
                    "تم تعديل وسيلة التواصل بنجاح",
                    "success"
                );

            } else {

                data.id =
                    this.generateId();


                data.createdAt =
                    new Date()
                        .toISOString();


                data.updatedAt =
                    data.createdAt;


                await this.add(
                    data
                );


                this.showMessage(
                    "تمت إضافة وسيلة التواصل بنجاح",
                    "success"
                );

            }


            await this.refresh();


            this.closeModal();


            this.dispatchUpdateEvent();


        } catch (error) {

            console.error(
                "Save contact error:",
                error
            );


            this.showMessage(
                "حدث خطأ أثناء حفظ البيانات",
                "error"
            );

        }

    },


    /* =====================================================
       بيانات النموذج
       ===================================================== */

    getFormData() {

        const type =
            this.getValue(
                this.selectors.typeInput
            );


        const typeData =
            this.types[type] ||
            this.types.custom;


        return {

            type,

            title:
                this.getValue(
                    this.selectors.titleInput
                ).trim(),

            value:
                this.getValue(
                    this.selectors.valueInput
                ).trim(),

            description:
                this.getValue(
                    this.selectors.descriptionInput
                ).trim(),

            active:
                this.getChecked(
                    this.selectors.activeInput,
                    true
                ),

            icon:
                this.getValue(
                    this.selectors.iconInput
                ).trim() ||
                typeData.icon,

            color:
                this.getValue(
                    this.selectors.colorInput
                ).trim() ||
                typeData.color,

            order:
                Number(
                    this.getValue(
                        this.selectors.orderInput
                    )
                ) || 0

        };

    },


    /* =====================================================
       التحقق من البيانات
       ===================================================== */

    validateContact(
        data
    ) {

        if (
            !data.type
        ) {

            return {

                valid:
                    false,

                message:
                    "يرجى اختيار نوع التواصل"

            };

        }


        if (
            !data.title
        ) {

            return {

                valid:
                    false,

                message:
                    "يرجى كتابة اسم وسيلة التواصل"

            };

        }


        if (
            !data.value
        ) {

            return {

                valid:
                    false,

                message:
                    "يرجى إدخال الرابط أو الحساب"

            };

        }


        return {

            valid:
                true

        };

    },


    /* =====================================================
       إضافة
       ===================================================== */

    async add(
        contact
    ) {

        if (
            window.TeacherDB &&
            typeof TeacherDB.add ===
            "function"
        ) {

            return await TeacherDB.add(
                this.storeName,
                contact
            );

        }


        if (
            window.DB &&
            typeof DB.add ===
            "function"
        ) {

            return await DB.add(
                this.storeName,
                contact
            );

        }


        return await this.addIndexedDB(
            contact
        );

    },


    /* =====================================================
       إضافة IndexedDB
       ===================================================== */

    async addIndexedDB(
        contact
    ) {

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
                        contact
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
       تعديل
       ===================================================== */

    async update(
        contact
    ) {

        if (
            window.TeacherDB &&
            typeof TeacherDB.put ===
            "function"
        ) {

            return await TeacherDB.put(
                this.storeName,
                contact
            );

        }


        if (
            window.DB &&
            typeof DB.put ===
            "function"
        ) {

            return await DB.put(
                this.storeName,
                contact
            );

        }


        return await this.updateIndexedDB(
            contact
        );

    },


    /* =====================================================
       تعديل IndexedDB
       ===================================================== */

    async updateIndexedDB(
        contact
    ) {

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
                        contact
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
       حذف
       ===================================================== */

    async deleteContact(
        id
    ) {

        const contact =
            this.getContactById(
                id
            );


        if (
            !contact
        ) {

            return;

        }


        const confirmed =
            await this.confirm(
                `هل تريد حذف "${contact.title}"؟`
            );


        if (
            !confirmed
        ) {

            return;

        }


        try {

            if (
                window.TeacherDB &&
                typeof TeacherDB.delete ===
                "function"
            ) {

                await TeacherDB.delete(
                    this.storeName,
                    id
                );

            } else if (

                window.DB &&
                typeof DB.delete ===
                "function"

            ) {

                await DB.delete(
                    this.storeName,
                    id
                );

            } else {

                await this.deleteIndexedDB(
                    id
                );

            }


            await this.refresh();


            this.dispatchUpdateEvent();


            this.showMessage(
                "تم حذف وسيلة التواصل",
                "success"
            );


        } catch (error) {

            console.error(
                "Delete contact error:",
                error
            );


            this.showMessage(
                "تعذر حذف وسيلة التواصل",
                "error"
            );

        }

    },


    /* =====================================================
       حذف IndexedDB
       ===================================================== */

    async deleteIndexedDB(
        id
    ) {

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

        this.editingId =
            null;


        this.resetForm();


        const title =
            document.querySelector(
                this.selectors.modalTitle
            );


        if (
            title
        ) {

            title.textContent =
                "إضافة وسيلة تواصل";

        }


        this.showModal();

    },


    /* =====================================================
       فتح نافذة التعديل
       ===================================================== */

    openEditModal(
        id
    ) {

        const contact =
            this.getContactById(
                id
            );


        if (
            !contact
        ) {

            return;

        }


        this.editingId =
            id;


        this.setValue(
            this.selectors.idInput,
            contact.id
        );


        this.setValue(
            this.selectors.typeInput,
            contact.type
        );


        this.setValue(
            this.selectors.titleInput,
            contact.title
        );


        this.setValue(
            this.selectors.valueInput,
            contact.value
        );


        this.setValue(
            this.selectors.descriptionInput,
            contact.description
        );


        this.setChecked(
            this.selectors.activeInput,
            contact.active !== false
        );


        this.setValue(
            this.selectors.iconInput,
            contact.icon
        );


        this.setValue(
            this.selectors.colorInput,
            contact.color
        );


        this.setValue(
            this.selectors.orderInput,
            contact.order
        );


        const title =
            document.querySelector(
                this.selectors.modalTitle
            );


        if (
            title
        ) {

            title.textContent =
                "تعديل وسيلة التواصل";

        }


        this.showModal();

    },


    /* =====================================================
       إظهار Modal
       ===================================================== */

    showModal() {

        const modal =
            document.querySelector(
                this.selectors.modal
            );


        if (
            !modal
        ) {

            return;

        }


        modal.classList.add(
            "show"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        const titleInput =
            document.querySelector(
                this.selectors.titleInput
            );


        setTimeout(
            () => {

                titleInput?.focus();

            },
            250
        );

    },


    /* =====================================================
       إغلاق Modal
       ===================================================== */

    closeModal() {

        const modal =
            document.querySelector(
                this.selectors.modal
            );


        if (
            modal
        ) {

            modal.classList.remove(
                "show"
            );


            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }


        this.editingId =
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


        if (
            form
        ) {

            form.reset();

        }


        this.setValue(
            this.selectors.idInput,
            ""
        );


        this.setValue(
            this.selectors.typeInput,
            "telegram"
        );


        this.setChecked(
            this.selectors.activeInput,
            true
        );


        this.setValue(
            this.selectors.orderInput,
            this.contacts.length + 1
        );


        this.updateTypeDefaults();

    },


    /* =====================================================
       تحديث القيم حسب النوع
       ===================================================== */

    updateTypeDefaults() {

        const type =
            this.getValue(
                this.selectors.typeInput
            );


        const typeData =
            this.types[type];


        if (
            !typeData
        ) {

            return;

        }


        const icon =
            this.getValue(
                this.selectors.iconInput
            );


        const color =
            this.getValue(
                this.selectors.colorInput
            );


        if (
            !icon
        ) {

            this.setValue(
                this.selectors.iconInput,
                typeData.icon
            );

        }


        if (
            !color
        ) {

            this.setValue(
                this.selectors.colorInput,
                typeData.color
            );

        }

    },


    /* =====================================================
       عرض البيانات
       ===================================================== */

    render() {

        const container =
            document.querySelector(
                this.selectors.container
            );


        if (
            !container
        ) {

            return;

        }


        const contacts =
            this.getFilteredContacts();


        container.innerHTML =
            "";


        if (
            contacts.length === 0
        ) {

            this.renderEmpty();

            this.updateCount(
                0
            );

            return;

        }


        contacts.forEach(
            contact => {

                const card =
                    this.createContactCard(
                        contact
                    );


                container.appendChild(
                    card
                );

            }
        );


        this.updateCount(
            contacts.length
        );

    },


    /* =====================================================
       إنشاء Card
       ===================================================== */

    createContactCard(
        contact
    ) {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "contact-card glass-card";


        if (
            contact.active === false
        ) {

            card.classList.add(
                "contact-disabled"
            );

        }


        card.dataset.id =
            contact.id;


        const typeData =
            this.types[
                contact.type
            ] ||
            this.types.custom;


        const safeTitle =
            this.escapeHTML(
                contact.title
            );


        const safeDescription =
            this.escapeHTML(
                contact.description ||
                ""
            );


        card.innerHTML =
            `

                <div class="contact-card-glow"></div>


                <div class="contact-card-header">

                    <div
                        class="contact-icon"
                        style="
                            --contact-color:
                            ${
                                contact.color ||
                                typeData.color
                            }
                        "
                    >

                        ${
                            this.escapeHTML(
                                contact.icon ||
                                typeData.icon
                            )
                        }

                    </div>


                    <div class="contact-main-info">

                        <h3>
                            ${safeTitle}
                        </h3>


                        <span
                            class="contact-type"
                        >

                            ${
                                typeData.arabicName
                            }

                        </span>

                    </div>


                    <div
                        class="
                            contact-status
                            ${
                                contact.active !== false
                                    ? "active"
                                    : "disabled"
                            }
                        "
                    >

                        ${
                            contact.active !== false
                                ? "● نشط"
                                : "○ متوقف"
                        }

                    </div>

                </div>


                <div class="contact-card-body">

                    <div class="contact-value">

                        ${
                            this.escapeHTML(
                                this.getDisplayValue(
                                    contact
                                )
                            )
                        }

                    </div>


                    ${
                        safeDescription
                            ? `
                                <div
                                    class="
                                        contact-description
                                    "
                                >

                                    ${safeDescription}

                                </div>
                            `
                            : ""
                    }

                </div>


                <div class="contact-actions">

                    <button
                        type="button"
                        class="
                            contact-action-btn
                            open
                        "
                        data-action="open"
                        data-id="${contact.id}"
                        title="فتح"
                    >

                        ↗️

                        <span>
                            فتح
                        </span>

                    </button>


                    <button
                        type="button"
                        class="
                            contact-action-btn
                            toggle
                        "
                        data-action="toggle"
                        data-id="${contact.id}"
                        title="
                            ${
                                contact.active !== false
                                    ? "إيقاف"
                                    : "تفعيل"
                            }
                        "
                    >

                        ${
                            contact.active !== false
                                ? "⏸️"
                                : "▶️"
                        }

                        <span>

                            ${
                                contact.active !== false
                                    ? "إيقاف"
                                    : "تفعيل"
                            }

                        </span>

                    </button>


                    <button
                        type="button"
                        class="
                            contact-action-btn
                            edit
                        "
                        data-action="edit"
                        data-id="${contact.id}"
                        title="تعديل"
                    >

                        ✏️

                        <span>
                            تعديل
                        </span>

                    </button>


                    <button
                        type="button"
                        class="
                            contact-action-btn
                            delete
                        "
                        data-action="delete"
                        data-id="${contact.id}"
                        title="حذف"
                    >

                        🗑️

                        <span>
                            حذف
                        </span>

                    </button>

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

        const openButton =
            card.querySelector(
                '[data-action="open"]'
            );


        const toggleButton =
            card.querySelector(
                '[data-action="toggle"]'
            );


        const editButton =
            card.querySelector(
                '[data-action="edit"]'
            );


        const deleteButton =
            card.querySelector(
                '[data-action="delete"]'
            );


        openButton?.addEventListener(
            "click",
            () => {

                this.openContact(
                    openButton.dataset.id
                );

            }
        );


        toggleButton?.addEventListener(
            "click",
            async () => {

                await this.toggleContact(
                    toggleButton.dataset.id
                );

            }
        );


        editButton?.addEventListener(
            "click",
            () => {

                this.openEditModal(
                    editButton.dataset.id
                );

            }
        );


        deleteButton?.addEventListener(
            "click",
            async () => {

                await this.deleteContact(
                    deleteButton.dataset.id
                );

            }
        );

    },


    /* =====================================================
       فتح جهة التواصل
       ===================================================== */

    openContact(
        id
    ) {

        const contact =
            this.getContactById(
                id
            );


        if (
            !contact
        ) {

            return;

        }


        if (
            contact.active === false
        ) {

            this.showMessage(
                "وسيلة التواصل هذه متوقفة حالياً",
                "warning"
            );


            return;

        }


        const url =
            this.getContactURL(
                contact
            );


        if (
            !url
        ) {

            this.showMessage(
                "الرابط غير صالح",
                "error"
            );


            return;

        }


        window.open(
            url,
            "_blank",
            "noopener,noreferrer"
        );

    },


    /* =====================================================
       إنشاء الرابط
       ===================================================== */

    getContactURL(
        contact
    ) {

        const value =
            String(
                contact.value ||
                ""
            ).trim();


        if (
            !value
        ) {

            return null;

        }


        switch (
            contact.type
        ) {


            case "email":

                return value.startsWith(
                    "mailto:"
                )
                    ? value
                    : `mailto:${value}`;


            case "phone":

                return value.startsWith(
                    "tel:"
                )
                    ? value
                    : `tel:${value}`;


            case "telegram":

                if (
                    value.startsWith(
                        "http"
                    )
                ) {

                    return value;

                }


                return `https://t.me/${value.replace(
                    "@",
                    ""
                )}`;


            case "whatsapp":

                if (
                    value.startsWith(
                        "http"
                    )
                ) {

                    return value;

                }


                return `https://wa.me/${value.replace(
                    /\D/g,
                    ""
                )}`;


            default:

                if (
                    /^https?:\/\//i.test(
                        value
                    )
                ) {

                    return value;

                }


                return `https://${value}`;

        }

    },


    /* =====================================================
       تغيير حالة جهة التواصل
       ===================================================== */

    async toggleContact(
        id
    ) {

        const contact =
            this.getContactById(
                id
            );


        if (
            !contact
        ) {

            return;

        }


        contact.active =
            contact.active === false;


        contact.updatedAt =
            new Date()
                .toISOString();


        try {

            await this.update(
                contact
            );


            await this.refresh();


            this.dispatchUpdateEvent();


            this.showMessage(

                contact.active
                    ? "تم تفعيل وسيلة التواصل"
                    : "تم إيقاف وسيلة التواصل",

                "success"

            );


        } catch (error) {

            console.error(
                "Toggle contact error:",
                error
            );


            this.showMessage(
                "حدث خطأ أثناء تغيير الحالة",
                "error"
            );

        }

    },


    /* =====================================================
       البحث
       ===================================================== */

    search(
        query
    ) {

        this.searchQuery =
            String(
                query ||
                ""
            )
                .trim()
                .toLowerCase();


        this.render();

    },


    /* =====================================================
       تغيير الفلتر
       ===================================================== */

    setFilter(
        filter
    ) {

        this.activeFilter =
            filter ||
            "all";


        const filters =
            document.querySelectorAll(
                this.selectors.filters
            );


        filters.forEach(
            element => {

                element.classList.toggle(

                    "active",

                    element.dataset
                        .contactFilter ===
                        this.activeFilter

                );

            }
        );


        this.render();

    },


    /* =====================================================
       البيانات المفلترة
       ===================================================== */

    getFilteredContacts() {

        let result =
            [
                ...this.contacts
            ];


        if (
            this.activeFilter &&
            this.activeFilter !== "all"
        ) {

            result =
                result.filter(
                    contact =>

                        contact.type ===
                        this.activeFilter

                );

        }


        if (
            this.searchQuery
        ) {

            result =
                result.filter(
                    contact => {

                        const text =

                            `${contact.title || ""}
                            ${contact.value || ""}
                            ${contact.description || ""}
                            ${contact.type || ""}`

                                .toLowerCase();


                        return text.includes(
                            this.searchQuery
                        );

                    }
                );

        }


        return result.sort(
            (
                a,
                b
            ) => {

                return (
                    Number(
                        a.order
                    ) || 0
                ) -
                (
                    Number(
                        b.order
                    ) || 0
                );

            }
        );

    },


    /* =====================================================
       الحصول على جهة حسب ID
       ===================================================== */

    getContactById(
        id
    ) {

        return this.contacts.find(
            contact =>

                String(
                    contact.id
                ) ===
                String(
                    id
                )

        ) || null;

    },


    /* =====================================================
       القيمة المعروضة
       ===================================================== */

    getDisplayValue(
        contact
    ) {

        if (
            contact.type ===
            "telegram"
        ) {

            return contact.value.startsWith(
                "http"
            )
                ? contact.value
                : `@${contact.value.replace(
                    "@",
                    ""
                )}`;

        }


        return contact.value;

    },


    /* =====================================================
       الحالة الفارغة
       ===================================================== */

    renderEmpty() {

        const container =
            document.querySelector(
                this.selectors.container
            );


        if (
            !container
        ) {

            return;

        }


        container.innerHTML =
            `

                <div
                    class="
                        contacts-empty
                        glass-card
                    "
                >

                    <div
                        class="
                            contacts-empty-icon
                        "
                    >

                        📡

                    </div>


                    <h3>
                        لا توجد وسائل تواصل
                    </h3>


                    <p>
                        أضف حساباتك وروابط التواصل الخاصة بك
                    </p>


                    <button
                        type="button"
                        class="
                            contacts-add-empty
                        "
                    >

                        ✨ إضافة وسيلة تواصل

                    </button>

                </div>

            `;


        const button =
            container.querySelector(
                ".contacts-add-empty"
            );


        button?.addEventListener(
            "click",
            () => {

                this.openAddModal();

            }
        );

    },


    /* =====================================================
       تحديث العدد
       ===================================================== */

    updateCount(
        count
    ) {

        const element =
            document.querySelector(
                this.selectors.count
            );


        if (
            element
        ) {

            element.textContent =
                count;

        }

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
            "contact_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(
                    2,
                    10
                )
        );

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


        if (
            element
        ) {

            element.value =
                value ??
                "";

        }

    },


    /* =====================================================
       قراءة Checkbox
       ===================================================== */

    getChecked(
        selector,
        defaultValue = false
    ) {

        const element =
            document.querySelector(
                selector
            );


        return element
            ? element.checked
            : defaultValue;

    },


    /* =====================================================
       تعيين Checkbox
       ===================================================== */

    setChecked(
        selector,
        value
    ) {

        const element =
            document.querySelector(
                selector
            );


        if (
            element
        ) {

            element.checked =
                Boolean(
                    value
                );

        }

    },


    /* =====================================================
       حماية HTML
       ===================================================== */

    escapeHTML(
        value
    ) {

        return String(
            value ||
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
       رسالة
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
       حدث تحديث
       ===================================================== */

    dispatchUpdateEvent() {

        document.dispatchEvent(

            new CustomEvent(
                "contacts:updated",
                {

                    detail: {

                        source:
                            "ContactModule",

                        time:
                            Date.now(),

                        count:
                            this.contacts.length

                    }

                }
            )

        );

    },


    /* =====================================================
       حدث جاهزية
       ===================================================== */

    dispatchReadyEvent() {

        document.dispatchEvent(

            new CustomEvent(
                "contacts:ready",
                {

                    detail: {

                        source:
                            "ContactModule"

                    }

                }
            )

        );

    },


    /* =====================================================
       تحديث القسم
       ===================================================== */

    async refresh() {

        await this.loadContacts();


        this.render();

    },


    /* =====================================================
       الحصول على الحسابات النشطة
       ===================================================== */

    getActiveContacts() {

        return this.contacts.filter(
            contact =>

                contact.active !== false

        );

    },


    /* =====================================================
       الحصول على رابط حسب النوع
       ===================================================== */

    getContactByType(
        type
    ) {

        return this.contacts.find(
            contact =>

                contact.type === type &&
                contact.active !== false

        ) || null;

    },


    /* =====================================================
       فتح حسب النوع
       ===================================================== */

    openByType(
        type
    ) {

        const contact =
            this.getContactByType(
                type
            );


        if (
            !contact
        ) {

            this.showMessage(
                "هذه الوسيلة غير مضافة أو متوقفة",
                "warning"
            );


            return;

        }


        this.openContact(
            contact.id
        );

    },


    /* =====================================================
       تدمير القسم
       ===================================================== */

    destroy() {

        this.initialized =
            false;


        this.contacts =
            [];


        this.editingId =
            null;


        this.searchQuery =
            "";


        this.activeFilter =
            "all";

    }

};


/* =========================================================
   جعل القسم متاحاً عالمياً
   ========================================================= */

window.ContactModule =
    ContactModule;


/* =========================================================
   دوال مساعدة عامة
   ========================================================= */

window.openTeacherContact =
function (
    type
) {

    ContactModule.openByType(
        type
    );

};


window.openContactEditor =
function (
    id
) {

    ContactModule.openEditModal(
        id
    );

};


window.deleteTeacherContact =
async function (
    id
) {

    await ContactModule.deleteContact(
        id
    );

};


/* =========================================================
   التشغيل التلقائي
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            async () => {

                await ContactModule.init();

            },
            350
        );

    }
);