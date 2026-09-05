/* =========================================================
   notes.js
   قسم ملاحظاتي - Teacher Management System
   الإصدار: 1.0.0
   =========================================================

   المسؤوليات:
   - إنشاء الملاحظات
   - تعديل الملاحظات
   - حذف الملاحظات
   - تثبيت / إلغاء تثبيت الملاحظة
   - البحث والتصفية
   - تصنيف الملاحظات
   - ربط الملاحظة بالصف والشعبة
   - النشر العام أو على صف أو شعبة
   - حفظ البيانات في IndexedDB
   - تحديث الواجهة تلقائياً
   - إنشاء تنبيهات مرتبطة بالملاحظات
   - دعم الملاحظات الخاصة بالمدرس
   - منع فقدان البيانات عند إعادة تحميل الصفحة

   ملاحظة:
   هذا الملف لا يستخدم eval ولا يعتمد على مكتبات خارجية.
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       إعدادات القسم
       ===================================================== */

    const NOTES_CONFIG = {
        storeName: "notes",
        version: 1,

        categories: [
            {
                id: "general",
                name: "عام",
                icon: "📝"
            },
            {
                id: "lesson",
                name: "الدرس",
                icon: "📚"
            },
            {
                id: "student",
                name: "طالب",
                icon: "👨‍🎓"
            },
            {
                id: "class",
                name: "صف",
                icon: "🏫"
            },
            {
                id: "exam",
                name: "امتحان",
                icon: "📋"
            },
            {
                id: "homework",
                name: "واجب",
                icon: "📖"
            },
            {
                id: "important",
                name: "مهم",
                icon: "⭐"
            },
            {
                id: "private",
                name: "خاص",
                icon: "🔒"
            }
        ],

        priorities: [
            {
                id: "low",
                name: "منخفض",
                icon: "🟢"
            },
            {
                id: "normal",
                name: "عادي",
                icon: "🔵"
            },
            {
                id: "high",
                name: "مهم",
                icon: "🟠"
            },
            {
                id: "urgent",
                name: "عاجل",
                icon: "🔴"
            }
        ],

        targets: [
            {
                id: "private",
                name: "خاصة بي",
                icon: "🔒"
            },
            {
                id: "all",
                name: "عام للجميع",
                icon: "🌍"
            },
            {
                id: "class",
                name: "صف كامل",
                icon: "🏫"
            },
            {
                id: "section",
                name: "شعبة",
                icon: "👥"
            }
        ]
    };

    /* =====================================================
       الحالة العامة
       ===================================================== */

    const NotesState = {
        notes: [],
        filteredNotes: [],

        search: "",
        category: "all",
        priority: "all",
        target: "all",

        selectedNoteId: null,
        editingNoteId: null,

        sortBy: "newest",

        initialized: false,
        dbReady: false,

        classes: [],
        sections: [],

        currentPage: 1,
        perPage: 12
    };

    /* =====================================================
       أدوات عامة
       ===================================================== */

    function safeString(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value);
    }

    function escapeHTML(value) {
        return safeString(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function generateId(prefix = "note") {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ) {
            return `${prefix}_${crypto.randomUUID()}`;
        }

        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).substring(2, 10)
        );
    }

    function nowISO() {
        return new Date().toISOString();
    }

    function formatDate(dateValue) {
        if (!dateValue) {
            return "غير محدد";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "غير محدد";
        }

        return date.toLocaleDateString("ar-IQ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
    }

    function formatDateTime(dateValue) {
        if (!dateValue) {
            return "غير محدد";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "غير محدد";
        }

        return date.toLocaleString("ar-IQ", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function getCategory(categoryId) {
        return (
            NOTES_CONFIG.categories.find(
                item => item.id === categoryId
            ) || NOTES_CONFIG.categories[0]
        );
    }

    function getPriority(priorityId) {
        return (
            NOTES_CONFIG.priorities.find(
                item => item.id === priorityId
            ) || NOTES_CONFIG.priorities[1]
        );
    }

    function getTarget(targetId) {
        return (
            NOTES_CONFIG.targets.find(
                item => item.id === targetId
            ) || NOTES_CONFIG.targets[0]
        );
    }

    function normalizeText(text) {
        return safeString(text)
            .trim()
            .toLowerCase()
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي");
    }

    function showMessage(message, type = "success") {
        if (
            typeof window.showToast === "function"
        ) {
            window.showToast(message, type);
            return;
        }

        if (
            typeof window.showNotification === "function"
        ) {
            window.showNotification(message, type);
            return;
        }

        console.log(`[${type}] ${message}`);
    }

    /* =====================================================
       IndexedDB
       ===================================================== */

    let notesDB = null;

    function openNotesDB() {
        return new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(
                    new Error(
                        "IndexedDB غير مدعوم في هذا المتصفح"
                    )
                );
                return;
            }

            const request = indexedDB.open(
                "TeacherManagementDB",
                8
            );

            request.onupgradeneeded = function (event) {
                const db = event.target.result;

                if (!db.objectStoreNames.contains("notes")) {
                    const store = db.createObjectStore(
                        "notes",
                        {
                            keyPath: "id"
                        }
                    );

                    store.createIndex(
                        "createdAt",
                        "createdAt",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "updatedAt",
                        "updatedAt",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "category",
                        "category",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "priority",
                        "priority",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "target",
                        "target",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "classId",
                        "classId",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "sectionId",
                        "sectionId",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "pinned",
                        "pinned",
                        {
                            unique: false
                        }
                    );
                }
            };

            request.onsuccess = function (event) {
                notesDB = event.target.result;

                notesDB.onversionchange = function () {
                    notesDB.close();
                };

                NotesState.dbReady = true;

                resolve(notesDB);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    async function ensureDB() {
        if (notesDB && NotesState.dbReady) {
            return notesDB;
        }

        return await openNotesDB();
    }

    function getObjectStore(
        mode = "readonly"
    ) {
        if (!notesDB) {
            throw new Error("قاعدة البيانات غير جاهزة");
        }

        const transaction = notesDB.transaction(
            NOTES_CONFIG.storeName,
            mode
        );

        return transaction.objectStore(
            NOTES_CONFIG.storeName
        );
    }

    async function getAllNotes() {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const store = getObjectStore("readonly");

            const request = store.getAll();

            request.onsuccess = function () {
                resolve(
                    Array.isArray(request.result)
                        ? request.result
                        : []
                );
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    async function getNoteById(id) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const store = getObjectStore("readonly");

            const request = store.get(id);

            request.onsuccess = function () {
                resolve(request.result || null);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    async function saveNote(note) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const store = getObjectStore("readwrite");

            const request = store.put(note);

            request.onsuccess = function () {
                resolve(note);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    async function deleteNoteFromDB(id) {
        await ensureDB();

        return new Promise((resolve, reject) => {
            const store = getObjectStore("readwrite");

            const request = store.delete(id);

            request.onsuccess = function () {
                resolve(true);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    /* =====================================================
       تحميل الصفوف والشعب
       ===================================================== */

    async function loadClassesAndSections() {
        NotesState.classes = [];
        NotesState.sections = [];

        try {
            if (
                window.AppData &&
                typeof window.AppData.getClasses === "function"
            ) {
                const classes =
                    await window.AppData.getClasses();

                if (Array.isArray(classes)) {
                    NotesState.classes = classes;
                }
            }
        } catch (error) {
            console.warn(
                "تعذر تحميل الصفوف من AppData:",
                error
            );
        }

        try {
            if (
                window.AppData &&
                typeof window.AppData.getSections === "function"
            ) {
                const sections =
                    await window.AppData.getSections();

                if (Array.isArray(sections)) {
                    NotesState.sections = sections;
                }
            }
        } catch (error) {
            console.warn(
                "تعذر تحميل الشعب من AppData:",
                error
            );
        }

        try {
            if (
                NotesState.classes.length === 0 &&
                window.DataStore &&
                typeof window.DataStore.getAll === "function"
            ) {
                const result =
                    await window.DataStore.getAll("classes");

                if (Array.isArray(result)) {
                    NotesState.classes = result;
                }
            }
        } catch (error) {
            console.warn(
                "تعذر تحميل الصفوف من DataStore:",
                error
            );
        }
    }

    function getClassName(classId) {
        if (!classId) {
            return "";
        }

        const found = NotesState.classes.find(
            item =>
                String(item.id) === String(classId) ||
                String(item.classId) === String(classId)
        );

        if (!found) {
            return "";
        }

        return (
            found.name ||
            found.className ||
            found.title ||
            found.grade ||
            ""
        );
    }

    function getSectionName(sectionId) {
        if (!sectionId) {
            return "";
        }

        const found = NotesState.sections.find(
            item =>
                String(item.id) === String(sectionId) ||
                String(item.sectionId) === String(sectionId)
        );

        if (!found) {
            return "";
        }

        return (
            found.name ||
            found.sectionName ||
            found.title ||
            ""
        );
    }

    /* =====================================================
       تطبيع الملاحظة
       ===================================================== */

    function normalizeNote(note) {
        const createdAt =
            note.createdAt || nowISO();

        return {
            id: note.id || generateId(),

            title:
                safeString(note.title).trim() ||
                "ملاحظة بدون عنوان",

            content:
                safeString(note.content).trim(),

            category:
                note.category || "general",

            priority:
                note.priority || "normal",

            target:
                note.target || "private",

            classId:
                note.classId || "",

            className:
                note.className ||
                getClassName(note.classId) ||
                "",

            sectionId:
                note.sectionId || "",

            sectionName:
                note.sectionName ||
                getSectionName(note.sectionId) ||
                "",

            studentId:
                note.studentId || "",

            studentName:
                note.studentName || "",

            tags:
                Array.isArray(note.tags)
                    ? note.tags
                    : [],

            pinned:
                Boolean(note.pinned),

            archived:
                Boolean(note.archived),

            published:
                Boolean(note.published),

            publishedAt:
                note.publishedAt || null,

            reminder:
                Boolean(note.reminder),

            reminderDate:
                note.reminderDate || null,

            color:
                note.color || "",

            icon:
                note.icon || "",

            createdAt,

            updatedAt:
                note.updatedAt || createdAt,

            createdBy:
                note.createdBy || "teacher",

            version:
                Number(note.version) || 1
        };
    }

    /* =====================================================
       تحميل البيانات
       ===================================================== */

    async function loadNotes() {
        try {
            const notes = await getAllNotes();

            NotesState.notes = notes
                .map(normalizeNote)
                .filter(note => !note.archived);

            applyFilters();

            renderNotes();

            updateNotesStatistics();

            return NotesState.notes;
        } catch (error) {
            console.error(
                "خطأ أثناء تحميل الملاحظات:",
                error
            );

            showMessage(
                "حدث خطأ أثناء تحميل الملاحظات",
                "error"
            );

            return [];
        }
    }

    /* =====================================================
       الفلترة والترتيب
       ===================================================== */

    function applyFilters() {
        const search =
            normalizeText(
                NotesState.search
            );

        let result = [
            ...NotesState.notes
        ];

        if (search) {
            result = result.filter(note => {
                const content =
                    normalizeText(
                        note.content
                    );

                const title =
                    normalizeText(
                        note.title
                    );

                const className =
                    normalizeText(
                        note.className
                    );

                const sectionName =
                    normalizeText(
                        note.sectionName
                    );

                const studentName =
                    normalizeText(
                        note.studentName
                    );

                const tags =
                    normalizeText(
                        note.tags.join(" ")
                    );

                return (
                    title.includes(search) ||
                    content.includes(search) ||
                    className.includes(search) ||
                    sectionName.includes(search) ||
                    studentName.includes(search) ||
                    tags.includes(search)
                );
            });
        }

        if (
            NotesState.category !== "all"
        ) {
            result = result.filter(
                note =>
                    note.category ===
                    NotesState.category
            );
        }

        if (
            NotesState.priority !== "all"
        ) {
            result = result.filter(
                note =>
                    note.priority ===
                    NotesState.priority
            );
        }

        if (
            NotesState.target !== "all"
        ) {
            result = result.filter(
                note =>
                    note.target ===
                    NotesState.target
            );
        }

        result.sort(
            (a, b) => {
                if (
                    NotesState.sortBy ===
                    "oldest"
                ) {
                    return (
                        new Date(a.createdAt) -
                        new Date(b.createdAt)
                    );
                }

                if (
                    NotesState.sortBy ===
                    "updated"
                ) {
                    return (
                        new Date(b.updatedAt) -
                        new Date(a.updatedAt)
                    );
                }

                if (
                    NotesState.sortBy ===
                    "priority"
                ) {
                    const weight = {
                        urgent: 4,
                        high: 3,
                        normal: 2,
                        low: 1
                    };

                    return (
                        (weight[b.priority] || 0) -
                        (weight[a.priority] || 0)
                    );
                }

                if (
                    NotesState.sortBy ===
                    "title"
                ) {
                    return a.title.localeCompare(
                        b.title,
                        "ar"
                    );
                }

                return (
                    Number(b.pinned) -
                        Number(a.pinned) ||
                    new Date(b.createdAt) -
                        new Date(a.createdAt)
                );
            }
        );

        NotesState.filteredNotes =
            result;

        NotesState.currentPage = 1;
    }

    /* =====================================================
       HTML الواجهة
       ===================================================== */

    function ensureNotesContainer() {
        let container =
            document.getElementById(
                "notesSection"
            );

        if (container) {
            return container;
        }

        container =
            document.createElement("section");

        container.id = "notesSection";

        container.className =
            "app-section notes-section";

        container.innerHTML =
            createNotesLayout();

        const main =
            document.querySelector(
                "main"
            ) ||
            document.querySelector(
                "#app"
            ) ||
            document.body;

        main.appendChild(container);

        return container;
    }

    function createNotesLayout() {
        return `
            <div class="notes-wrapper">

                <div class="notes-header glass-card">

                    <div class="notes-title-area">
                        <div class="notes-main-icon">
                            📝
                        </div>

                        <div>
                            <h2>
                                ملاحظاتي
                            </h2>

                            <p>
                                إدارة ملاحظاتك وتنظيمها وتثبيتها
                                ونشرها للطلاب عند الحاجة.
                            </p>
                        </div>
                    </div>

                    <div class="notes-header-actions">

                        <button
                            type="button"
                            class="notes-btn primary"
                            id="addNoteBtn"
                        >
                            <span>＋</span>
                            إضافة ملاحظة
                        </button>

                        <button
                            type="button"
                            class="notes-btn"
                            id="refreshNotesBtn"
                        >
                            <span>↻</span>
                            تحديث
                        </button>

                    </div>

                </div>


                <div
                    class="notes-statistics"
                    id="notesStatistics"
                ></div>


                <div class="notes-tools glass-card">

                    <div class="notes-search-box">

                        <span>🔎</span>

                        <input
                            type="search"
                            id="notesSearchInput"
                            placeholder="ابحث عن ملاحظة، طالب، صف، شعبة..."
                            autocomplete="off"
                        />

                    </div>


                    <select
                        id="notesCategoryFilter"
                        class="notes-select"
                    >
                        <option value="all">
                            كل التصنيفات
                        </option>

                        ${NOTES_CONFIG.categories
                            .map(
                                category => `
                                    <option
                                        value="${escapeHTML(
                                            category.id
                                        )}"
                                    >
                                        ${category.icon}
                                        ${escapeHTML(
                                            category.name
                                        )}
                                    </option>
                                `
                            )
                            .join("")}
                    </select>


                    <select
                        id="notesPriorityFilter"
                        class="notes-select"
                    >
                        <option value="all">
                            كل الأولويات
                        </option>

                        ${NOTES_CONFIG.priorities
                            .map(
                                priority => `
                                    <option
                                        value="${escapeHTML(
                                            priority.id
                                        )}"
                                    >
                                        ${priority.icon}
                                        ${escapeHTML(
                                            priority.name
                                        )}
                                    </option>
                                `
                            )
                            .join("")}
                    </select>


                    <select
                        id="notesTargetFilter"
                        class="notes-select"
                    >
                        <option value="all">
                            كل أنواع النشر
                        </option>

                        ${NOTES_CONFIG.targets
                            .map(
                                target => `
                                    <option
                                        value="${escapeHTML(
                                            target.id
                                        )}"
                                    >
                                        ${target.icon}
                                        ${escapeHTML(
                                            target.name
                                        )}
                                    </option>
                                `
                            )
                            .join("")}
                    </select>


                    <select
                        id="notesSortSelect"
                        class="notes-select"
                    >
                        <option value="newest">
                            الأحدث أولاً
                        </option>

                        <option value="oldest">
                            الأقدم أولاً
                        </option>

                        <option value="updated">
                            آخر تعديل
                        </option>

                        <option value="priority">
                            حسب الأولوية
                        </option>

                        <option value="title">
                            حسب الاسم
                        </option>
                    </select>

                </div>


                <div
                    class="notes-list"
                    id="notesList"
                ></div>


                <div
                    class="notes-pagination"
                    id="notesPagination"
                ></div>

            </div>


            <div
                class="notes-modal-container"
                id="notesModalContainer"
                hidden
            ></div>
        `;
    }

    /* =====================================================
       الإحصائيات
       ===================================================== */

    function updateNotesStatistics() {
        const container =
            document.getElementById(
                "notesStatistics"
            );

        if (!container) {
            return;
        }

        const total =
            NotesState.notes.length;

        const pinned =
            NotesState.notes.filter(
                note => note.pinned
            ).length;

        const published =
            NotesState.notes.filter(
                note => note.published
            ).length;

        const reminders =
            NotesState.notes.filter(
                note => note.reminder
            ).length;

        const urgent =
            NotesState.notes.filter(
                note =>
                    note.priority ===
                    "urgent"
            ).length;

        container.innerHTML = `
            <div class="notes-stat-card">
                <span class="stat-icon">📝</span>
                <div>
                    <small>كل الملاحظات</small>
                    <strong>${total}</strong>
                </div>
            </div>

            <div class="notes-stat-card">
                <span class="stat-icon">📌</span>
                <div>
                    <small>مثبتة</small>
                    <strong>${pinned}</strong>
                </div>
            </div>

            <div class="notes-stat-card">
                <span class="stat-icon">📢</span>
                <div>
                    <small>منشورة</small>
                    <strong>${published}</strong>
                </div>
            </div>

            <div class="notes-stat-card">
                <span class="stat-icon">⏰</span>
                <div>
                    <small>تذكيرات</small>
                    <strong>${reminders}</strong>
                </div>
            </div>

            <div class="notes-stat-card">
                <span class="stat-icon">🚨</span>
                <div>
                    <small>عاجلة</small>
                    <strong>${urgent}</strong>
                </div>
            </div>
        `;
    }

    /* =====================================================
       عرض الملاحظات
       ===================================================== */

    function renderNotes() {
        const container =
            document.getElementById(
                "notesList"
            );

        if (!container) {
            return;
        }

        const all =
            NotesState.filteredNotes;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    all.length /
                        NotesState.perPage
                )
            );

        if (
            NotesState.currentPage >
            totalPages
        ) {
            NotesState.currentPage =
                totalPages;
        }

        const start =
            (NotesState.currentPage - 1) *
            NotesState.perPage;

        const end =
            start +
            NotesState.perPage;

        const pageItems =
            all.slice(start, end);

        if (pageItems.length === 0) {
            container.innerHTML = `
                <div class="notes-empty glass-card">

                    <div class="empty-icon">
                        📝
                    </div>

                    <h3>
                        لا توجد ملاحظات
                    </h3>

                    <p>
                        لم يتم العثور على ملاحظات
                        مطابقة للبحث أو الفلاتر الحالية.
                    </p>

                    <button
                        type="button"
                        class="notes-btn primary"
                        data-action="new-note"
                    >
                        ＋ إضافة أول ملاحظة
                    </button>

                </div>
            `;

            renderPagination();

            return;
        }

        container.innerHTML =
            pageItems
                .map(
                    note =>
                        renderNoteCard(
                            note
                        )
                )
                .join("");

        renderPagination();
    }

    function renderNoteCard(note) {
        const category =
            getCategory(
                note.category
            );

        const priority =
            getPriority(
                note.priority
            );

        const target =
            getTarget(
                note.target
            );

        const content =
            escapeHTML(
                note.content
            );

        const shortContent =
            content.length > 260
                ? content.substring(
                      0,
                      260
                  ) + "..."
                : content;

        const tags =
            note.tags.length
                ? `
                    <div class="note-tags">
                        ${note.tags
                            .map(
                                tag => `
                                    <span class="note-tag">
                                        #${escapeHTML(
                                            tag
                                        )}
                                    </span>
                                `
                            )
                            .join("")}
                    </div>
                `
                : "";

        const targetInfo =
            note.target ===
            "class"
                ? note.className
                : note.target ===
                  "section"
                ? `${note.className} / ${note.sectionName}`
                : note.target ===
                  "student"
                ? note.studentName
                : target.name;

        return `
            <article
                class="note-card glass-card
                    priority-${escapeHTML(
                        note.priority
                    )}
                    ${note.pinned ? "is-pinned" : ""}
                    ${note.published ? "is-published" : ""}
                "
                data-note-id="${escapeHTML(
                    note.id
                )}"
            >

                <div class="note-card-top">

                    <div class="note-category">
                        <span>
                            ${category.icon}
                        </span>

                        <span>
                            ${escapeHTML(
                                category.name
                            )}
                        </span>
                    </div>

                    <div class="note-card-actions">

                        <button
                            type="button"
                            class="note-icon-btn"
                            title="${
                                note.pinned
                                    ? "إلغاء التثبيت"
                                    : "تثبيت"
                            }"
                            data-action="toggle-pin"
                            data-id="${escapeHTML(
                                note.id
                            )}"
                        >
                            ${
                                note.pinned
                                    ? "📌"
                                    : "📍"
                            }
                        </button>

                        <button
                            type="button"
                            class="note-icon-btn"
                            title="تعديل"
                            data-action="edit-note"
                            data-id="${escapeHTML(
                                note.id
                            )}"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="note-icon-btn danger"
                            title="حذف"
                            data-action="delete-note"
                            data-id="${escapeHTML(
                                note.id
                            )}"
                        >
                            🗑️
                        </button>

                    </div>

                </div>


                <div class="note-title-row">

                    <h3>
                        ${escapeHTML(
                            note.title
                        )}
                    </h3>

                    <span
                        class="note-priority priority-${escapeHTML(
                            note.priority
                        )}"
                    >
                        ${priority.icon}
                        ${escapeHTML(
                            priority.name
                        )}
                    </span>

                </div>


                <div class="note-content">
                    ${shortContent}
                </div>


                ${tags}


                <div class="note-meta">

                    <span>
                        🎯
                        ${escapeHTML(
                            targetInfo ||
                                "خاصة"
                        )}
                    </span>

                    <span>
                        🕒
                        ${formatDateTime(
                            note.updatedAt
                        )}
                    </span>

                </div>


                <div class="note-status-row">

                    ${
                        note.pinned
                            ? `
                                <span class="note-status pinned">
                                    📌 مثبتة
                                </span>
                            `
                            : ""
                    }

                    ${
                        note.published
                            ? `
                                <span class="note-status published">
                                    📢 منشورة
                                </span>
                            `
                            : ""
                    }

                    ${
                        note.reminder
                            ? `
                                <span class="note-status reminder">
                                    ⏰ ${formatDate(
                                        note.reminderDate
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>


                <button
                    type="button"
                    class="note-open-btn"
                    data-action="open-note"
                    data-id="${escapeHTML(
                        note.id
                    )}"
                >
                    عرض التفاصيل
                    <span>←</span>
                </button>

            </article>
        `;
    }

    /* =====================================================
       Pagination
       ===================================================== */

    function renderPagination() {
        const container =
            document.getElementById(
                "notesPagination"
            );

        if (!container) {
            return;
        }

        const total =
            NotesState.filteredNotes.length;

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    total /
                        NotesState.perPage
                )
            );

        if (totalPages <= 1) {
            container.innerHTML = "";
            return;
        }

        let html = `
            <button
                type="button"
                class="pagination-btn"
                data-page="${Math.max(
                    1,
                    NotesState.currentPage -
                        1
                )}"
                ${
                    NotesState.currentPage ===
                    1
                        ? "disabled"
                        : ""
                }
            >
                ‹
            </button>
        `;

        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {
            if (
                i === 1 ||
                i === totalPages ||
                Math.abs(
                    i -
                        NotesState.currentPage
                ) <= 2
            ) {
                html += `
                    <button
                        type="button"
                        class="pagination-btn ${
                            i ===
                            NotesState.currentPage
                                ? "active"
                                : ""
                        }"
                        data-page="${i}"
                    >
                        ${i}
                    </button>
                `;
            } else if (
                i ===
                NotesState.currentPage - 3 ||
                i ===
                NotesState.currentPage + 3
            ) {
                html += `
                    <span class="pagination-dots">
                        …
                    </span>
                `;
            }
        }

        html += `
            <button
                type="button"
                class="pagination-btn"
                data-page="${Math.min(
                    totalPages,
                    NotesState.currentPage +
                        1
                )}"
                ${
                    NotesState.currentPage ===
                    totalPages
                        ? "disabled"
                        : ""
                }
            >
                ›
            </button>
        `;

        container.innerHTML = html;
    }

    /* =====================================================
       نافذة الإضافة والتعديل
       ===================================================== */

    function openNoteModal(
        note = null
    ) {
        const container =
            document.getElementById(
                "notesModalContainer"
            );

        if (!container) {
            return;
        }

        NotesState.editingNoteId =
            note
                ? note.id
                : null;

        const isEdit =
            Boolean(note);

        const safeNote =
            note ||
            {
                title: "",
                content: "",
                category: "general",
                priority: "normal",
                target: "private",
                classId: "",
                className: "",
                sectionId: "",
                sectionName: "",
                studentId: "",
                studentName: "",
                tags: [],
                pinned: false,
                published: false,
                reminder: false,
                reminderDate: "",
                color: "",
                icon: ""
            };

        container.hidden = false;

        container.innerHTML = `
            <div class="notes-modal-backdrop">

                <div
                    class="notes-modal glass-card"
                    role="dialog"
                    aria-modal="true"
                >

                    <div class="notes-modal-header">

                        <div>
                            <span class="modal-icon">
                                ${
                                    isEdit
                                        ? "✏️"
                                        : "📝"
                                }
                            </span>

                            <h3>
                                ${
                                    isEdit
                                        ? "تعديل الملاحظة"
                                        : "إضافة ملاحظة جديدة"
                                }
                            </h3>
                        </div>

                        <button
                            type="button"
                            class="modal-close"
                            data-action="close-modal"
                        >
                            ×
                        </button>

                    </div>


                    <form
                        id="noteForm"
                        class="note-form"
                    >

                        <div class="form-group full">

                            <label>
                                عنوان الملاحظة
                            </label>

                            <input
                                type="text"
                                name="title"
                                maxlength="150"
                                required
                                value="${escapeHTML(
                                    safeNote.title
                                )}"
                                placeholder="مثال: مراجعة درس اليوم"
                            />

                        </div>


                        <div class="form-group full">

                            <label>
                                نص الملاحظة
                            </label>

                            <textarea
                                name="content"
                                rows="7"
                                maxlength="5000"
                                required
                                placeholder="اكتب ملاحظتك هنا..."
                            >${escapeHTML(
                                safeNote.content
                            )}</textarea>

                        </div>


                        <div class="form-row">

                            <div class="form-group">

                                <label>
                                    التصنيف
                                </label>

                                <select
                                    name="category"
                                    required
                                >
                                    ${NOTES_CONFIG.categories
                                        .map(
                                            category => `
                                                <option
                                                    value="${escapeHTML(
                                                        category.id
                                                    )}"
                                                    ${
                                                        safeNote.category ===
                                                        category.id
                                                            ? "selected"
                                                            : ""
                                                    }
                                                >
                                                    ${
                                                        category.icon
                                                    }
                                                    ${escapeHTML(
                                                        category.name
                                                    )}
                                                </option>
                                            `
                                        )
                                        .join("")}
                                </select>

                            </div>


                            <div class="form-group">

                                <label>
                                    الأولوية
                                </label>

                                <select
                                    name="priority"
                                    required
                                >
                                    ${NOTES_CONFIG.priorities
                                        .map(
                                            priority => `
                                                <option
                                                    value="${escapeHTML(
                                                        priority.id
                                                    )}"
                                                    ${
                                                        safeNote.priority ===
                                                        priority.id
                                                            ? "selected"
                                                            : ""
                                                    }
                                                >
                                                    ${
                                                        priority.icon
                                                    }
                                                    ${escapeHTML(
                                                        priority.name
                                                    )}
                                                </option>
                                            `
                                        )
                                        .join("")}
                                </select>

                            </div>

                        </div>


                        <div class="form-group full">

                            <label>
                                الجمهور
                            </label>

                            <select
                                name="target"
                                id="noteTarget"
                                required
                            >
                                ${NOTES_CONFIG.targets
                                    .map(
                                        target => `
                                            <option
                                                value="${escapeHTML(
                                                    target.id
                                                )}"
                                                ${
                                                    safeNote.target ===
                                                    target.id
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${
                                                    target.icon
                                                }
                                                ${escapeHTML(
                                                    target.name
                                                )}
                                            </option>
                                        `
                                    )
                                    .join("")}
                            </select>

                        </div>


                        <div
                            class="target-fields"
                            id="noteTargetFields"
                        >

                            ${renderTargetFields(
                                safeNote
                            )}

                        </div>


                        <div class="form-group full">

                            <label>
                                الوسوم
                            </label>

                            <input
                                type="text"
                                name="tags"
                                maxlength="300"
                                value="${escapeHTML(
                                    safeNote.tags.join(
                                        ", "
                                    )
                                )}"
                                placeholder="مثال: مراجعة، مهم، واجب"
                            />

                            <small>
                                افصل بين الوسوم باستخدام الفاصلة.
                            </small>

                        </div>


                        <div class="form-row">

                            <label
                                class="checkbox-card"
                            >
                                <input
                                    type="checkbox"
                                    name="pinned"
                                    ${
                                        safeNote.pinned
                                            ? "checked"
                                            : ""
                                    }
                                />

                                <span>
                                    📌 تثبيت الملاحظة
                                </span>
                            </label>


                            <label
                                class="checkbox-card"
                            >
                                <input
                                    type="checkbox"
                                    name="published"
                                    ${
                                        safeNote.published
                                            ? "checked"
                                            : ""
                                    }
                                />

                                <span>
                                    📢 نشر الملاحظة
                                </span>
                            </label>

                        </div>


                        <div class="form-row">

                            <label
                                class="checkbox-card"
                            >
                                <input
                                    type="checkbox"
                                    name="reminder"
                                    id="noteReminder"
                                    ${
                                        safeNote.reminder
                                            ? "checked"
                                            : ""
                                    }
                                />

                                <span>
                                    ⏰ إضافة كتذكير
                                </span>
                            </label>


                            <div
                                class="form-group"
                                id="reminderDateGroup"
                            >

                                <label>
                                    تاريخ التذكير
                                </label>

                                <input
                                    type="datetime-local"
                                    name="reminderDate"
                                    value="${formatDateTimeLocal(
                                        safeNote.reminderDate
                                    )}"
                                />

                            </div>

                        </div>


                        <div class="notes-form-warning">

                            <span>💡</span>

                            <p>
                                الملاحظة الخاصة بك تبقى داخل
                                الموقع، أما الملاحظة المنشورة
                                فتظهر حسب الجمهور الذي اخترته.
                            </p>

                        </div>


                        <div class="notes-modal-footer">

                            <button
                                type="button"
                                class="notes-btn"
                                data-action="close-modal"
                            >
                                إلغاء
                            </button>

                            <button
                                type="submit"
                                class="notes-btn primary"
                            >
                                ${
                                    isEdit
                                        ? "💾 حفظ التعديلات"
                                        : "💾 حفظ الملاحظة"
                                }
                            </button>

                        </div>

                    </form>

                </div>

            </div>
        `;

        setupModalEvents();
    }

    function formatDateTimeLocal(
        value
    ) {
        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        const hours =
            String(
                date.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                date.getMinutes()
            ).padStart(2, "0");

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    function renderTargetFields(
        note
    ) {
        if (
            note.target ===
            "class"
        ) {
            return `
                <div class="form-group full">

                    <label>
                        اختر الصف
                    </label>

                    <select
                        name="classId"
                        id="noteClassId"
                    >

                        <option value="">
                            اختر الصف
                        </option>

                        ${NotesState.classes
                            .map(
                                item => {
                                    const id =
                                        item.id ??
                                        item.classId ??
                                        "";

                                    const name =
                                        item.name ??
                                        item.className ??
                                        item.title ??
                                        item.grade ??
                                        id;

                                    return `
                                        <option
                                            value="${escapeHTML(
                                                id
                                            )}"
                                            ${
                                                String(
                                                    note.classId
                                                ) ===
                                                String(
                                                    id
                                                )
                                                    ? "selected"
                                                    : ""
                                            }
                                        >
                                            ${escapeHTML(
                                                name
                                            )}
                                        </option>
                                    `;
                                }
                            )
                            .join("")}

                    </select>

                </div>
            `;
        }

        if (
            note.target ===
            "section"
        ) {
            return `
                <div class="form-row">

                    <div class="form-group">

                        <label>
                            الصف
                        </label>

                        <select
                            name="classId"
                            id="noteClassId"
                        >

                            <option value="">
                                اختر الصف
                            </option>

                            ${NotesState.classes
                                .map(
                                    item => {
                                        const id =
                                            item.id ??
                                            item.classId ??
                                            "";

                                        const name =
                                            item.name ??
                                            item.className ??
                                            item.title ??
                                            item.grade ??
                                            id;

                                        return `
                                            <option
                                                value="${escapeHTML(
                                                    id
                                                )}"
                                                ${
                                                    String(
                                                        note.classId
                                                    ) ===
                                                    String(
                                                        id
                                                    )
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${escapeHTML(
                                                    name
                                                )}
                                            </option>
                                        `;
                                    }
                                )
                                .join("")}

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            الشعبة
                        </label>

                        <select
                            name="sectionId"
                            id="noteSectionId"
                        >

                            <option value="">
                                اختر الشعبة
                            </option>

                            ${NotesState.sections
                                .map(
                                    item => {
                                        const id =
                                            item.id ??
                                            item.sectionId ??
                                            "";

                                        const name =
                                            item.name ??
                                            item.sectionName ??
                                            item.title ??
                                            id;

                                        return `
                                            <option
                                                value="${escapeHTML(
                                                    id
                                                )}"
                                                ${
                                                    String(
                                                        note.sectionId
                                                    ) ===
                                                    String(
                                                        id
                                                    )
                                                        ? "selected"
                                                        : ""
                                                }
                                            >
                                                ${escapeHTML(
                                                    name
                                                )}
                                            </option>
                                        `;
                                    }
                                )
                                .join("")}

                        </select>

                    </div>

                </div>
            `;
        }

        if (
            note.target ===
            "all"
        ) {
            return `
                <div class="target-info-box">
                    🌍 ستظهر الملاحظة لجميع المستهدفين
                    في النظام عند توفر واجهة النشر.
                </div>
            `;
        }

        return `
            <div class="target-info-box">
                🔒 هذه الملاحظة خاصة بك ولن يتم نشرها.
            </div>
        `;
    }

    /* =====================================================
       أحداث النافذة
       ===================================================== */

    function setupModalEvents() {
        const container =
            document.getElementById(
                "notesModalContainer"
            );

        if (!container) {
            return;
        }

        const form =
            document.getElementById(
                "noteForm"
            );

        const target =
            document.getElementById(
                "noteTarget"
            );

        const reminder =
            document.getElementById(
                "noteReminder"
            );

        if (target) {
            target.addEventListener(
                "change",
                function () {
                    updateTargetFields(
                        this.value
                    );
                }
            );
        }

        if (reminder) {
            reminder.addEventListener(
                "change",
                function () {
                    toggleReminderDate(
                        this.checked
                    );
                }
            );

            toggleReminderDate(
                reminder.checked
            );
        }

        if (form) {
            form.addEventListener(
                "submit",
                async function (event) {
                    event.preventDefault();

                    await handleNoteSubmit(
                        form
                    );
                }
            );
        }

        container
            .querySelectorAll(
                '[data-action="close-modal"]'
            )
            .forEach(button => {
                button.addEventListener(
                    "click",
                    closeNoteModal
                );
            });

        const backdrop =
            container.querySelector(
                ".notes-modal-backdrop"
            );

        if (backdrop) {
            backdrop.addEventListener(
                "click",
                function (event) {
                    if (
                        event.target ===
                        backdrop
                    ) {
                        closeNoteModal();
                    }
                }
            );
        }

        document.addEventListener(
            "keydown",
            handleModalEscape,
            {
                once: true
            }
        );
    }

    function handleModalEscape(
        event
    ) {
        if (
            event.key ===
            "Escape"
        ) {
            closeNoteModal();
        }
    }

    function updateTargetFields(
        targetValue
    ) {
        const fields =
            document.getElementById(
                "noteTargetFields"
            );

        if (!fields) {
            return;
        }

        const form =
            document.getElementById(
                "noteForm"
            );

        const currentNote = {
            target:
                targetValue,

            classId:
                form?.elements
                    ?.classId?.value ||
                "",

            sectionId:
                form?.elements
                    ?.sectionId?.value ||
                ""
        };

        fields.innerHTML =
            renderTargetFields(
                currentNote
            );
    }

    function toggleReminderDate(
        enabled
    ) {
        const group =
            document.getElementById(
                "reminderDateGroup"
            );

        if (!group) {
            return;
        }

        group.style.opacity =
            enabled
                ? "1"
                : "0.45";

        const input =
            group.querySelector(
                'input[name="reminderDate"]'
            );

        if (input) {
            input.disabled =
                !enabled;

            input.required =
                enabled;
        }
    }

    function closeNoteModal() {
        const container =
            document.getElementById(
                "notesModalContainer"
            );

        if (!container) {
            return;
        }

        container.hidden = true;
        container.innerHTML = "";

        NotesState.editingNoteId =
            null;
    }

    /* =====================================================
       حفظ الملاحظة
       ===================================================== */

    async function handleNoteSubmit(
        form
    ) {
        const formData =
            new FormData(form);

        const title =
            safeString(
                formData.get(
                    "title"
                )
            ).trim();

        const content =
            safeString(
                formData.get(
                    "content"
                )
            ).trim();

        if (!title) {
            showMessage(
                "اكتب عنوان الملاحظة",
                "warning"
            );
            return;
        }

        if (!content) {
            showMessage(
                "اكتب نص الملاحظة",
                "warning"
            );
            return;
        }

        const target =
            safeString(
                formData.get(
                    "target"
                )
            ) ||
            "private";

        const classId =
            safeString(
                formData.get(
                    "classId"
                )
            );

        const sectionId =
            safeString(
                formData.get(
                    "sectionId"
                )
            );

        const tags =
            safeString(
                formData.get(
                    "tags"
                )
            )
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean)
                .slice(0, 30);

        const reminder =
            formData.get(
                "reminder"
            ) === "on";

        let reminderDate =
            formData.get(
                "reminderDate"
            );

        if (
            reminder &&
            !reminderDate
        ) {
            showMessage(
                "حدد تاريخ التذكير",
                "warning"
            );
            return;
        }

        if (!reminder) {
            reminderDate = null;
        } else {
            const date =
                new Date(
                    reminderDate
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                showMessage(
                    "تاريخ التذكير غير صحيح",
                    "warning"
                );
                return;
            }

            reminderDate =
                date.toISOString();
        }

        let note = null;

        if (
            NotesState.editingNoteId
        ) {
            note =
                await getNoteById(
                    NotesState.editingNoteId
                );
        }

        const createdAt =
            note?.createdAt ||
            nowISO();

        const className =
            classId
                ? getClassName(
                      classId
                  )
                : "";

        const sectionName =
            sectionId
                ? getSectionName(
                      sectionId
                  )
                : "";

        const normalized = normalizeNote(
            {
                ...(note || {}),

                id:
                    note?.id ||
                    generateId(
                        "note"
                    ),

                title,

                content,

                category:
                    safeString(
                        formData.get(
                            "category"
                        )
                    ) ||
                    "general",

                priority:
                    safeString(
                        formData.get(
                            "priority"
                        )
                    ) ||
                    "normal",

                target,

                classId,

                className,

                sectionId,

                sectionName,

                studentId:
                    safeString(
                        formData.get(
                            "studentId"
                        )
                    ),

                studentName:
                    safeString(
                        formData.get(
                            "studentName"
                        )
                    ),

                tags,

                pinned:
                    formData.get(
                        "pinned"
                    ) === "on",

                published:
                    formData.get(
                        "published"
                    ) === "on",

                publishedAt:
                    formData.get(
                        "published"
                    ) === "on"
                        ? note?.publishedAt ||
                          nowISO()
                        : null,

                reminder,

                reminderDate,

                createdAt,

                updatedAt:
                    nowISO(),

                version:
                    Number(
                        note?.version
                    ) + 1 || 1
            }
        );

        try {
            await saveNote(
                normalized
            );

            await loadNotes();

            closeNoteModal();

            showMessage(
                note
                    ? "تم تعديل الملاحظة بنجاح"
                    : "تمت إضافة الملاحظة بنجاح",
                "success"
            );

            dispatchNotesEvent(
                note
                    ? "note-updated"
                    : "note-created",
                normalized
            );

            if (
                normalized.reminder
            ) {
                dispatchNotesEvent(
                    "reminder-created",
                    normalized
                );
            }

            if (
                normalized.published
            ) {
                await publishNoteEvent(
                    normalized
                );
            }
        } catch (error) {
            console.error(
                "خطأ في حفظ الملاحظة:",
                error
            );

            showMessage(
                "تعذر حفظ الملاحظة",
                "error"
            );
        }
    }

    /* =====================================================
       تعديل الملاحظة
       ===================================================== */

    async function editNote(id) {
        try {
            const note =
                await getNoteById(
                    id
                );

            if (!note) {
                showMessage(
                    "الملاحظة غير موجودة",
                    "error"
                );
                return;
            }

            openNoteModal(
                normalizeNote(note)
            );
        } catch (error) {
            console.error(
                error
            );

            showMessage(
                "تعذر فتح الملاحظة",
                "error"
            );
        }
    }

    /* =====================================================
       حذف الملاحظة
       ===================================================== */

    async function deleteNote(
        id
    ) {
        const note =
            NotesState.notes.find(
                item =>
                    item.id === id
            );

        if (!note) {
            return;
        }

        const confirmed =
            await confirmAction(
                `هل تريد حذف الملاحظة "${note.title}"؟`
            );

        if (!confirmed) {
            return;
        }

        try {
            await deleteNoteFromDB(
                id
            );

            NotesState.notes =
                NotesState.notes.filter(
                    item =>
                        item.id !== id
                );

            applyFilters();

            renderNotes();

            updateNotesStatistics();

            showMessage(
                "تم حذف الملاحظة",
                "success"
            );

            dispatchNotesEvent(
                "note-deleted",
                {
                    id
                }
            );
        } catch (error) {
            console.error(
                "خطأ في حذف الملاحظة:",
                error
            );

            showMessage(
                "تعذر حذف الملاحظة",
                "error"
            );
        }
    }

    function confirmAction(
        message
    ) {
        return new Promise(
            resolve => {
                if (
                    typeof window.confirm ===
                    "function"
                ) {
                    resolve(
                        window.confirm(
                            message
                        )
                    );
                    return;
                }

                resolve(true);
            }
        );
    }

    /* =====================================================
       تثبيت / إلغاء تثبيت
       ===================================================== */

    async function togglePinNote(
        id
    ) {
        try {
            const note =
                await getNoteById(
                    id
                );

            if (!note) {
                return;
            }

            note.pinned =
                !Boolean(
                    note.pinned
                );

            note.updatedAt =
                nowISO();

            await saveNote(
                normalizeNote(
                    note
                )
            );

            await loadNotes();

            showMessage(
                note.pinned
                    ? "تم تثبيت الملاحظة"
                    : "تم إلغاء تثبيت الملاحظة",
                "success"
            );

            dispatchNotesEvent(
                "note-pin-changed",
                note
            );
        } catch (error) {
            console.error(
                error
            );

            showMessage(
                "تعذر تغيير حالة التثبيت",
                "error"
            );
        }
    }

    /* =====================================================
       عرض التفاصيل
       ===================================================== */

    async function openNoteDetails(
        id
    ) {
        try {
            const note =
                await getNoteById(
                    id
                );

            if (!note) {
                return;
            }

            NotesState.selectedNoteId =
                id;

            renderNoteDetails(
                normalizeNote(note)
            );
        } catch (error) {
            console.error(
                error
            );

            showMessage(
                "تعذر عرض تفاصيل الملاحظة",
                "error"
            );
        }
    }

    function renderNoteDetails(
        note
    ) {
        const container =
            document.getElementById(
                "notesModalContainer"
            );

        if (!container) {
            return;
        }

        const category =
            getCategory(
                note.category
            );

        const priority =
            getPriority(
                note.priority
            );

        const target =
            getTarget(
                note.target
            );

        container.hidden = false;

        container.innerHTML = `
            <div class="notes-modal-backdrop">

                <div
                    class="notes-modal notes-details-modal glass-card"
                >

                    <div class="notes-modal-header">

                        <div>

                            <span class="modal-icon">
                                ${category.icon}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    note.title
                                )}
                            </h3>

                        </div>

                        <button
                            type="button"
                            class="modal-close"
                            data-action="close-modal"
                        >
                            ×
                        </button>

                    </div>


                    <div class="note-details-content">

                        <div class="detail-badges">

                            <span>
                                ${category.icon}
                                ${escapeHTML(
                                    category.name
                                )}
                            </span>

                            <span>
                                ${priority.icon}
                                ${escapeHTML(
                                    priority.name
                                )}
                            </span>

                            <span>
                                ${target.icon}
                                ${escapeHTML(
                                    target.name
                                )}
                            </span>

                            ${
                                note.pinned
                                    ? `
                                        <span>
                                            📌 مثبتة
                                        </span>
                                    `
                                    : ""
                            }

                        </div>


                        <div class="details-main-text">

                            ${escapeHTML(
                                note.content
                            )
                                .replace(
                                    /\n/g,
                                    "<br>"
                                )}

                        </div>


                        <div class="details-grid">

                            <div>
                                <small>
                                    تاريخ الإنشاء
                                </small>

                                <strong>
                                    ${formatDateTime(
                                        note.createdAt
                                    )}
                                </strong>
                            </div>


                            <div>
                                <small>
                                    آخر تعديل
                                </small>

                                <strong>
                                    ${formatDateTime(
                                        note.updatedAt
                                    )}
                                </strong>
                            </div>


                            <div>
                                <small>
                                    الصف
                                </small>

                                <strong>
                                    ${
                                        escapeHTML(
                                            note.className
                                        ) ||
                                        "غير مرتبط"
                                    }
                                </strong>
                            </div>


                            <div>
                                <