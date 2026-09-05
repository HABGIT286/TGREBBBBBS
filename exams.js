/* =========================================================
   Teacher Management System
   File: exams.js
   Version: 1.0.0
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       إعدادات عامة
       ===================================================== */

    const DB_NAME = "TeacherManagementDB";
    const DB_VERSION = 1;

    const STORE_EXAMS = "exams";
    const STORE_CLASSES = "classes";
    const STORE_STUDENTS = "students";

    let db = null;

    /* =====================================================
       أدوات مساعدة
       ===================================================== */

    function generateId(prefix = "id") {
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

    function escapeHTML(value) {
        if (value === null || value === undefined) return "";

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(dateValue) {
        if (!dateValue) return "-";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(dateValue);
        }

        return date.toLocaleDateString("ar-IQ", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function formatTime(timeValue) {
        if (!timeValue) return "-";

        const parts = String(timeValue).split(":");

        if (parts.length < 2) {
            return escapeHTML(timeValue);
        }

        let hour = Number(parts[0]);
        const minute = parts[1];

        if (Number.isNaN(hour)) {
            return escapeHTML(timeValue);
        }

        const period = hour >= 12 ? "م" : "ص";

        hour = hour % 12;

        if (hour === 0) {
            hour = 12;
        }

        return `${hour}:${minute} ${period}`;
    }

    function normalizeText(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    /* =====================================================
       IndexedDB
       ===================================================== */

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = function (event) {
                const database = event.target.result;

                if (!database.objectStoreNames.contains(STORE_EXAMS)) {
                    const examsStore = database.createObjectStore(
                        STORE_EXAMS,
                        {
                            keyPath: "id"
                        }
                    );

                    examsStore.createIndex(
                        "classId",
                        "classId",
                        { unique: false }
                    );

                    examsStore.createIndex(
                        "sectionId",
                        "sectionId",
                        { unique: false }
                    );

                    examsStore.createIndex(
                        "date",
                        "date",
                        { unique: false }
                    );

                    examsStore.createIndex(
                        "status",
                        "status",
                        { unique: false }
                    );
                }

                if (!database.objectStoreNames.contains(STORE_CLASSES)) {
                    database.createObjectStore(
                        STORE_CLASSES,
                        {
                            keyPath: "id"
                        }
                    );
                }

                if (!database.objectStoreNames.contains(STORE_STUDENTS)) {
                    const studentsStore = database.createObjectStore(
                        STORE_STUDENTS,
                        {
                            keyPath: "id"
                        }
                    );

                    studentsStore.createIndex(
                        "classId",
                        "classId",
                        { unique: false }
                    );

                    studentsStore.createIndex(
                        "sectionId",
                        "sectionId",
                        { unique: false }
                    );
                }
            };

            request.onsuccess = function (event) {
                db = event.target.result;

                db.onversionchange = function () {
                    db.close();
                };

                resolve(db);
            };

            request.onerror = function () {
                reject(request.error);
            };
        });
    }

    async function ensureDatabase() {
        try {
            return await openDatabase();
        } catch (error) {
            console.error("Database error:", error);
            showToast(
                "تعذر فتح قاعدة البيانات المحلية",
                "error"
            );
            throw error;
        }
    }

    /* =====================================================
       عمليات IndexedDB
       ===================================================== */

    async function getAll(storeName) {
        const database = await ensureDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readonly"
            );

            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function getById(storeName, id) {
        const database = await ensureDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readonly"
            );

            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function put(storeName, data) {
        const database = await ensureDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readwrite"
            );

            const store = transaction.objectStore(storeName);

            const request = store.put(data);

            request.onsuccess = () => {
                resolve(data);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function remove(storeName, id) {
        const database = await ensureDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readwrite"
            );

            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /* =====================================================
       التنبيهات
       ===================================================== */

    function showToast(message, type = "success") {
        let container = document.querySelector(
            ".teacher-toast-container"
        );

        if (!container) {
            container = document.createElement("div");
            container.className = "teacher-toast-container";

            Object.assign(container.style, {
                position: "fixed",
                left: "20px",
                bottom: "20px",
                zIndex: "999999",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                pointerEvents: "none"
            });

            document.body.appendChild(container);
        }

        const toast = document.createElement("div");

        const icon =
            type === "error"
                ? "❌"
                : type === "warning"
                    ? "⚠️"
                    : "✓";

        toast.innerHTML = `
            <span style="
                font-size:18px;
                margin-left:8px;
            ">${icon}</span>

            <span>${escapeHTML(message)}</span>
        `;

        Object.assign(toast.style, {
            background:
                "rgba(10, 12, 20, 0.88)",
            color: "#fff",
            border:
                "1px solid rgba(255,255,255,.15)",
            boxShadow:
                "0 15px 45px rgba(0,0,0,.35)",
            backdropFilter:
                "blur(18px)",
            WebkitBackdropFilter:
                "blur(18px)",
            padding:
                "13px 17px",
            borderRadius:
                "15px",
            minWidth:
                "230px",
            maxWidth:
                "380px",
            fontFamily:
                "Arial, sans-serif",
            fontSize:
                "14px",
            display:
                "flex",
            alignItems:
                "center",
            direction:
                "rtl",
            pointerEvents:
                "auto",
            transform:
                "translateY(20px)",
            opacity:
                "0",
            transition:
                "all .3s ease"
        });

        if (type === "error") {
            toast.style.borderColor =
                "rgba(255,70,70,.4)";
        }

        if (type === "warning") {
            toast.style.borderColor =
                "rgba(255,180,50,.4)";
        }

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform =
                "translateY(0)";
            toast.style.opacity =
                "1";
        });

        setTimeout(() => {
            toast.style.transform =
                "translateY(20px)";
            toast.style.opacity =
                "0";

            setTimeout(() => {
                toast.remove();
            }, 350);
        }, 3200);
    }

    /* =====================================================
       CSS داخلي خاص بالقسم
       ===================================================== */

    function injectStyles() {
        if (document.getElementById("exams-module-style")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "exams-module-style";

        style.textContent = `
            .exams-module {
                direction: rtl;
                width: 100%;
                color: #fff;
            }

            .exams-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                margin-bottom: 22px;
                flex-wrap: wrap;
            }

            .exams-title-area {
                display: flex;
                align-items: center;
                gap: 14px;
            }

            .exams-title-icon {
                width: 52px;
                height: 52px;
                border-radius: 17px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 26px;
                background:
                    linear-gradient(
                        145deg,
                        rgba(255,70,70,.25),
                        rgba(90,70,255,.18)
                    );
                border:
                    1px solid rgba(255,255,255,.14);
                box-shadow:
                    0 10px 30px rgba(0,0,0,.25);
            }

            .exams-title {
                margin: 0;
                font-size: 24px;
                font-weight: 800;
            }

            .exams-subtitle {
                margin: 5px 0 0;
                color: rgba(255,255,255,.62);
                font-size: 13px;
            }

            .exam-primary-button {
                border: 0;
                color: #fff;
                cursor: pointer;
                padding: 13px 18px;
                border-radius: 14px;
                font-weight: 700;
                background:
                    linear-gradient(
                        135deg,
                        #7c3cff,
                        #ff357d
                    );
                box-shadow:
                    0 10px 30px rgba(124,60,255,.28);
                transition:
                    transform .2s ease,
                    box-shadow .2s ease;
            }

            .exam-primary-button:hover {
                transform:
                    translateY(-2px);
                box-shadow:
                    0 15px 35px rgba(124,60,255,.38);
            }

            .exam-filters {
                display: grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(180px, 1fr)
                    );
                gap: 12px;
                margin-bottom: 20px;
            }

            .exam-filter {
                width: 100%;
                box-sizing: border-box;
                padding: 12px 13px;
                color: #fff;
                border-radius: 13px;
                border:
                    1px solid rgba(255,255,255,.12);
                outline: none;
                background:
                    rgba(255,255,255,.055);
                backdrop-filter:
                    blur(12px);
                -webkit-backdrop-filter:
                    blur(12px);
            }

            .exam-filter::placeholder {
                color:
                    rgba(255,255,255,.45);
            }

            .exam-filter option {
                background: #151520;
                color: #fff;
            }

            .exams-grid {
                display: grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(285px, 1fr)
                    );
                gap: 16px;
            }

            .exam-card {
                position: relative;
                overflow: hidden;
                padding: 18px;
                border-radius: 20px;
                background:
                    linear-gradient(
                        145deg,
                        rgba(255,255,255,.09),
                        rgba(255,255,255,.035)
                    );
                border:
                    1px solid rgba(255,255,255,.12);
                backdrop-filter:
                    blur(20px);
                -webkit-backdrop-filter:
                    blur(20px);
                box-shadow:
                    0 18px 45px rgba(0,0,0,.2);
                transition:
                    transform .25s ease,
                    border-color .25s ease;
            }

            .exam-card::before {
                content: "";
                position: absolute;
                width: 110px;
                height: 110px;
                border-radius: 50%;
                top: -55px;
                left: -35px;
                background:
                    rgba(124,60,255,.18);
                filter: blur(30px);
                pointer-events: none;
            }

            .exam-card:hover {
                transform:
                    translateY(-4px);
                border-color:
                    rgba(255,255,255,.22);
            }

            .exam-card-top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 14px;
            }

            .exam-card-title {
                margin: 0;
                font-size: 18px;
                font-weight: 800;
            }

            .exam-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 30px;
                padding: 6px 10px;
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
            }

            .exam-status.upcoming {
                background:
                    rgba(60,150,255,.14);
                color:
                    #75b8ff;
                border:
                    1px solid rgba(60,150,255,.2);
            }

            .exam-status.today {
                background:
                    rgba(255,180,50,.14);
                color:
                    #ffc65c;
                border:
                    1px solid rgba(255,180,50,.2);
            }

            .exam-status.finished {
                background:
                    rgba(120,120,120,.14);
                color:
                    #aaa;
                border:
                    1px solid rgba(255,255,255,.1);
            }

            .exam-info-list {
                display: flex;
                flex-direction: column;
                gap: 9px;
            }

            .exam-info-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 9px 10px;
                border-radius: 11px;
                background:
                    rgba(255,255,255,.035);
            }

            .exam-info-label {
                color:
                    rgba(255,255,255,.54);
                font-size: 12px;
            }

            .exam-info-value {
                color:
                    rgba(255,255,255,.94);
                font-size: 13px;
                font-weight: 600;
                text-align: left;
            }

            .exam-card-actions {
                display: grid;
                grid-template-columns:
                    repeat(3, 1fr);
                gap: 7px;
                margin-top: 15px;
            }

            .exam-action {
                cursor: pointer;
                border-radius: 11px;
                padding: 9px 5px;
                border:
                    1px solid rgba(255,255,255,.1);
                background:
                    rgba(255,255,255,.045);
                color: #fff;
                transition:
                    background .2s ease,
                    transform .2s ease;
            }

            .exam-action:hover {
                background:
                    rgba(255,255,255,.1);
                transform:
                    translateY(-1px);
            }

            .exam-action.delete:hover {
                background:
                    rgba(255,60,60,.14);
            }

            .exam-empty {
                min-height: 220px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                border:
                    1px dashed rgba(255,255,255,.14);
                border-radius: 20px;
                color:
                    rgba(255,255,255,.55);
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
            }

            .exam-empty-icon {
                font-size: 40px;
                opacity: .7;
            }

            .exam-modal {
                position: fixed;
                inset: 0;
                z-index: 999990;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background:
                    rgba(0,0,0,.62);
                backdrop-filter:
                    blur(10px);
                -webkit-backdrop-filter:
                    blur(10px);
            }

            .exam-modal.show {
                display: flex;
            }

            .exam-modal-content {
                width: min(680px, 100%);
                max-height: 90vh;
                overflow-y: auto;
                padding: 22px;
                box-sizing: border-box;
                border-radius: 24px;
                background:
                    linear-gradient(
                        145deg,
                        rgba(25,27,42,.96),
                        rgba(12,14,24,.96)
                    );
                border:
                    1px solid rgba(255,255,255,.13);
                box-shadow:
                    0 30px 80px rgba(0,0,0,.55);
            }

            .exam-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
            }

            .exam-modal-header h3 {
                margin: 0;
                font-size: 20px;
            }

            .exam-close {
                width: 38px;
                height: 38px;
                border: 0;
                border-radius: 12px;
                cursor: pointer;
                background:
                    rgba(255,255,255,.07);
                color: #fff;
                font-size: 20px;
            }

            .exam-form-grid {
                display: grid;
                grid-template-columns:
                    repeat(
                        2,
                        minmax(0, 1fr)
                    );
                gap: 13px;
            }

            .exam-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .exam-field.full {
                grid-column: 1 / -1;
            }

            .exam-field label {
                font-size: 12px;
                color:
                    rgba(255,255,255,.6);
            }

            .exam-field input,
            .exam-field select,
            .exam-field textarea {
                width: 100%;
                box-sizing: border-box;
                color: #fff;
                background:
                    rgba(255,255,255,.055);
                border:
                    1px solid rgba(255,255,255,.12);
                border-radius: 12px;
                padding: 11px 12px;
                outline: none;
                font-family: inherit;
            }

            .exam-field textarea {
                min-height: 90px;
                resize: vertical;
            }

            .exam-field input:focus,
            .exam-field select:focus,
            .exam-field textarea:focus {
                border-color:
                    rgba(124,60,255,.55);
                box-shadow:
                    0 0 0 3px rgba(124,60,255,.1);
            }

            .exam-field option {
                background: #171823;
                color: #fff;
            }

            .exam-form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 20px;
            }

            .exam-secondary-button {
                cursor: pointer;
                padding: 11px 17px;
                border-radius: 12px;
                color: #fff;
                background:
                    rgba(255,255,255,.06);
                border:
                    1px solid rgba(255,255,255,.12);
            }

            .exam-error {
                display: none;
                padding: 10px;
                margin-bottom: 12px;
                border-radius: 11px;
                background:
                    rgba(255,60,60,.1);
                border:
                    1px solid rgba(255,60,60,.18);
                color:
                    #ff9696;
                font-size: 13px;
            }

            @media (max-width: 600px) {
                .exam-form-grid {
                    grid-template-columns: 1fr;
                }

                .exam-field.full {
                    grid-column: auto;
                }

                .exams-header {
                    align-items: stretch;
                }

                .exam-primary-button {
                    width: 100%;
                }

                .exams-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* =====================================================
       تحديد حالة الامتحان
       ===================================================== */

    function getExamStatus(exam) {
        if (!exam || !exam.date) {
            return {
                key: "upcoming",
                label: "قادم"
            };
        }

        const today = new Date();

        const examDate = new Date(
            `${exam.date}T${exam.time || "00:00"}`
        );

        const todayOnly = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const examOnly = new Date(
            examDate.getFullYear(),
            examDate.getMonth(),
            examDate.getDate()
        );

        if (examOnly.getTime() === todayOnly.getTime()) {
            return {
                key: "today",
                label: "اليوم"
            };
        }

        if (examOnly < todayOnly) {
            return {
                key: "finished",
                label: "منتهي"
            };
        }

        return {
            key: "upcoming",
            label: "قادم"
        };
    }

    /* =====================================================
       اسم الصف والشعبة
       ===================================================== */

    function findClassName(classId, classes) {
        if (!classId) {
            return "عام";
        }

        const found = classes.find(
            item => item.id === classId
        );

        if (!found) {
            return "صف غير معروف";
        }

        return (
            found.name ||
            found.className ||
            found.title ||
            "صف"
        );
    }

    function findSectionName(sectionId, classId, classes) {
        if (!sectionId) {
            return "جميع الشعب";
        }

        const foundClass = classes.find(
            item => item.id === classId
        );

        if (
            foundClass &&
            Array.isArray(foundClass.sections)
        ) {
            const section = foundClass.sections.find(
                item => item.id === sectionId ||
                    item.name === sectionId
            );

            if (section) {
                return (
                    section.name ||
                    section.title ||
                    "شعبة"
                );
            }
        }

        return String(sectionId);
    }

    /* =====================================================
       حساب عدد الطلاب
       ===================================================== */

    async function getStudentsForExam(exam) {
        const students = await getAll(
            STORE_STUDENTS
        );

        return students.filter(student => {
            if (
                exam.classId &&
                student.classId !== exam.classId
            ) {
                return false;
            }

            if (
                exam.sectionId &&
                student.sectionId !== exam.sectionId
            ) {
                return false;
            }

            return true;
        });
    }

    /* =====================================================
       واجهة القسم
       ===================================================== */

    async function render(container) {
        injectStyles();

        const exams = await getAll(
            STORE_EXAMS
        );

        const classes = await getAll(
            STORE_CLASSES
        );

        const sortedExams = exams.sort(
            (a, b) => {
                const da = new Date(
                    `${a.date || "9999-12-31"}T${a.time || "00:00"}`
                );

                const dbb = new Date(
                    `${b.date || "9999-12-31"}T${b.time || "00:00"}`
                );

                return da - dbb;
            }
        );

        container.innerHTML = `
            <section class="exams-module">

                <div class="exams-header">

                    <div class="exams-title-area">

                        <div class="exams-title-icon">
                            📝
                        </div>

                        <div>
                            <h2 class="exams-title">
                                الامتحانات
                            </h2>

                            <p class="exams-subtitle">
                                إدارة الامتحانات والمواعيد والصفوف والدرجات
                            </p>
                        </div>

                    </div>

                    <button
                        class="exam-primary-button"
                        data-action="add-exam"
                    >
                        ＋ إضافة امتحان
                    </button>

                </div>

                <div class="exam-filters">

                    <input
                        id="examSearch"
                        class="exam-filter"
                        type="search"
                        placeholder="🔎 ابحث باسم الامتحان أو المادة..."
                    >

                    <select
                        id="examClassFilter"
                        class="exam-filter"
                    >
                        <option value="">
                            كل الصفوف
                        </option>

                        ${classes.map(item => `
                            <option value="${escapeHTML(item.id)}">
                                ${escapeHTML(
                                    item.name ||
                                    item.className ||
                                    item.title ||
                                    "صف"
                                )}
                            </option>
                        `).join("")}

                    </select>

                    <select
                        id="examStatusFilter"
                        class="exam-filter"
                    >
                        <option value="">
                            كل الحالات
                        </option>

                        <option value="upcoming">
                            القادم
                        </option>

                        <option value="today">
                            اليوم
                        </option>

                        <option value="finished">
                            المنتهي
                        </option>
                    </select>

                </div>

                <div
                    id="examsGrid"
                    class="exams-grid"
                ></div>

            </section>
        `;

        const grid = getElement(
            "examsGrid"
        );

        function renderCards() {
            const search = normalizeText(
                getElement("examSearch")?.value
            );

            const classFilter =
                getElement(
                    "examClassFilter"
                )?.value || "";

            const statusFilter =
                getElement(
                    "examStatusFilter"
                )?.value || "";

            const filtered =
                sortedExams.filter(exam => {

                    const status =
                        getExamStatus(exam);

                    const text = normalizeText(
                        `${exam.title || ""} ${exam.subject || ""} ${exam.notes || ""}`
                    );

                    if (
                        search &&
                        !text.includes(search)
                    ) {
                        return false;
                    }

                    if (
                        classFilter &&
                        exam.classId !== classFilter
                    ) {
                        return false;
                    }

                    if (
                        statusFilter &&
                        status.key !== statusFilter
                    ) {
                        return false;
                    }

                    return true;
                });

            if (!filtered.length) {
                grid.innerHTML = `
                    <div class="exam-empty">
                        <div class="exam-empty-icon">
                            📚
                        </div>

                        <strong>
                            لا توجد امتحانات
                        </strong>

                        <span>
                            أضف امتحاناً جديداً ليظهر هنا.
                        </span>
                    </div>
                `;

                return;
            }

            grid.innerHTML = filtered.map(
                exam => {

                    const status =
                        getExamStatus(exam);

                    const className =
                        findClassName(
                            exam.classId,
                            classes
                        );

                    const sectionName =
                        findSectionName(
                            exam.sectionId,
                            exam.classId,
                            classes
                        );

                    return `
                        <article
                            class="exam-card"
                            data-id="${escapeHTML(exam.id)}"
                        >

                            <div class="exam-card-top">

                                <div>
                                    <h3 class="exam-card-title">
                                        ${escapeHTML(
                                            exam.title ||
                                            "امتحان بدون اسم"
                                        )}
                                    </h3>
                                </div>

                                <span
                                    class="exam-status ${status.key}"
                                >
                                    ●
                                    ${status.label}
                                </span>

                            </div>

                            <div class="exam-info-list">

                                <div class="exam-info-row">
                                    <span class="exam-info-label">
                                        المادة
                                    </span>

                                    <span class="exam-info-value">
                                        ${escapeHTML(
                                            exam.subject ||
                                            "-"
                                        )}
                                    </span>
                                </div>

                                <div class="exam-info-row">
                                    <span class="exam-info-label">
                                        الصف
                                    </span>

                                    <span class="exam-info-value">
                                        ${escapeHTML(
                                            className
                                        )}
                                    </span>
                                </div>

                                <div class="exam-info-row">
                                    <span class="exam-info-label">
                                        الشعبة
                                    </span>

                                    <span class="exam-info-value">
                                        ${escapeHTML(
                                            sectionName
                                        )}
                                    </span>
                                </div>

                                <div class="exam-info-row">
                                    <span class="exam-info-label">
                                        التاريخ
                                    </span>

                                    <span class="exam-info-value">
                                        ${formatDate(
                                            exam.date
                                        )}
                                    </span>
                                </div>

                                <div class="exam-info-row">
                                    <span class="exam-info-label">
                                        الوقت
                                    </span>

                                    <span class="exam-info-value">
                                        ${formatTime(
                                            exam.time
                                        )}
                                    </span>
                                </div>

                            </div>

                            <div class="exam-card-actions">

                                <button
                                    class="exam-action"
                                    data-exam-action="view"
                                    data-id="${escapeHTML(exam.id)}"
                                >
                                    👁 عرض
                                </button>

                                <button
                                    class="exam-action"
                                    data-exam-action="edit"
                                    data-id="${escapeHTML(exam.id)}"
                                >
                                    ✏️ تعديل
                                </button>

                                <button
                                    class="exam-action delete"
                                    data-exam-action="delete"
                                    data-id="${escapeHTML(exam.id)}"
                                >
                                    🗑 حذف
                                </button>

                            </div>

                        </article>
                    `;
                }
            ).join("");

            attachCardEvents();
        }

        renderCards();

        getElement(
            "examSearch"
        )?.addEventListener(
            "input",
            renderCards
        );

        getElement(
            "examClassFilter"
        )?.addEventListener(
            "change",
            renderCards
        );

        getElement(
            "examStatusFilter"
        )?.addEventListener(
            "change",
            renderCards
        );

        getElement(
            "add-exam"
        );

        container
            .querySelector(
                '[data-action="add-exam"]'
            )
            ?.addEventListener(
                "click",
                () => {
                    openExamModal({
                        classes
                    });
                }
            );

        function attachCardEvents() {
            grid
                .querySelectorAll(
                    "[data-exam-action]"
                )
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        async function () {

                            const id =
                                this.dataset.id;

                            const action =
                                this.dataset.examAction;

                            if (
                                action === "view"
                            ) {
                                await viewExam(id);
                            }

                            if (
                                action === "edit"
                            ) {
                                await editExam(
                                    id,
                                    classes
                                );
                            }

                            if (
                                action === "delete"
                            ) {
                                await deleteExam(
                                    id,
                                    renderCards
                                );
                            }
                        }
                    );

                });
        }
    }

    /* =====================================================
       نافذة الامتحان
       ===================================================== */

    async function openExamModal({
        classes = [],
        exam = null
    } = {}) {

        const editing = Boolean(exam);

        let sections = [];

        if (
            editing &&
            exam.classId
        ) {
            sections =
                getSectionsForClass(
                    exam.classId,
                    classes
                );
        }

        const existing =
            document.querySelector(
                ".exam-modal"
            );

        if (existing) {
            existing.remove();
        }

        const modal =
            document.createElement("div");

        modal.className =
            "exam-modal show";

        modal.innerHTML = `

            <div class="exam-modal-content">

                <div class="exam-modal-header">

                    <h3>
                        ${editing
                            ? "✏️ تعديل الامتحان"
                            : "📝 إضافة امتحان جديد"}
                    </h3>

                    <button
                        class="exam-close"
                        data-close
                    >
                        ×
                    </button>

                </div>

                <div
                    id="examFormError"
                    class="exam-error"
                ></div>

                <form id="examForm">

                    <div class="exam-form-grid">

                        <div class="exam-field">
                            <label>
                                اسم الامتحان *
                            </label>

                            <input
                                name="title"
                                required
                                maxlength="150"
                                placeholder="مثلاً: امتحان الفصل الأول"
                                value="${escapeHTML(
                                    exam?.title || ""
                                )}"
                            >
                        </div>

                        <div class="exam-field">
                            <label>
                                المادة *
                            </label>

                            <input
                                name="subject"
                                required
                                maxlength="100"
                                placeholder="مثلاً: الرياضيات"
                                value="${escapeHTML(
                                    exam?.subject || ""
                                )}"
                            >
                        </div>

                        <div class="exam-field">
                            <label>
                                الصف
                            </label>

                            <select
                                name="classId"
                                id="examFormClass"
                            >

                                <option value="">
                                    جميع الصفوف
                                </option>

                                ${classes.map(item => {

                                    const id =
                                        item.id;

                                    const selected =
                                        exam?.classId === id
                                            ? "selected"
                                            : "";

                                    return `
                                        <option
                                            value="${escapeHTML(id)}"
                                            ${selected}
                                        >
                                            ${escapeHTML(
                                                item.name ||
                                                item.className ||
                                                item.title ||
                                                "صف"
                                            )}
                                        </option>
                                    `;
                                }).join("")}

                            </select>
                        </div>

                        <div class="exam-field">
                            <label>
                                الشعبة
                            </label>

                            <select
                                name="sectionId"
                                id="examFormSection"
                            >

                                <option value="">
                                    جميع الشعب
                                </option>

                                ${sections.map(section => `
                                    <option
                                        value="${escapeHTML(
                                            section.id
                                        )}"
                                        ${
                                            exam?.sectionId ===
                                            section.id
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${escapeHTML(
                                            section.name ||
                                            section.title ||
                                            "شعبة"
                                        )}
                                    </option>
                                `).join("")}

                            </select>
                        </div>

                        <div class="exam-field">
                            <label>
                                تاريخ الامتحان *
                            </label>

                            <input
                                name="date"
                                type="date"
                                required
                                value="${escapeHTML(
                                    exam?.date || ""
                                )}"
                            >
                        </div>

                        <div class="exam-field">
                            <label>
                                وقت الامتحان
                            </label>

                            <input
                                name="time"
                                type="time"
                                value="${escapeHTML(
                                    exam?.time || ""
                                )}"
                            >
                        </div>

                        <div class="exam-field">
                            <label>
                                الدرجة الكاملة
                            </label>

                            <input
                                name="maxGrade"
                                type="number"
                                min="0"
                                step="0.01"
                                value="${escapeHTML(
                                    exam?.maxGrade ?? 100
                                )}"
                            >
                        </div>

                        <div class="exam-field">
                            <label>
                                مدة الامتحان بالدقائق
                            </label>

                            <input
                                name="duration"
                                type="number"
                                min="0"
                                step="1"
                                value="${escapeHTML(
                                    exam?.duration ?? 60
                                )}"
                            >
                        </div>

                        <div class="exam-field full">
                            <label>
                                ملاحظات الامتحان
                            </label>

                            <textarea
                                name="notes"
                                maxlength="2000"
                                placeholder="أضف أي ملاحظات أو تعليمات للامتحان..."
                            >${escapeHTML(
                                exam?.notes || ""
                            )}</textarea>
                        </div>

                    </div>

                    <div class="exam-form-actions">

                        <button
                            type="button"
                            class="exam-secondary-button"
                            data-close
                        >
                            إلغاء
                        </button>

                        <button
                            type="submit"
                            class="exam-primary-button"
                        >
                            ${
                                editing
                                    ? "حفظ التعديلات"
                                    : "حفظ الامتحان"
                            }
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        const classSelect =
            modal.querySelector(
                "#examFormClass"
            );

        const sectionSelect =
            modal.querySelector(
                "#examFormSection"
            );

        classSelect.addEventListener(
            "change",
            function () {

                const selectedClass =
                    classes.find(
                        item =>
                            item.id ===
                            this.value
                    );

                const newSections =
                    selectedClass &&
                    Array.isArray(
                        selectedClass.sections
                    )
                        ? selectedClass.sections
                        : [];

                sectionSelect.innerHTML = `
                    <option value="">
                        جميع الشعب
                    </option>

                    ${newSections.map(section => `
                        <option
                            value="${escapeHTML(
                                section.id
                            )}"
                        >
                            ${escapeHTML(
                                section.name ||
                                section.title ||
                                "شعبة"
                            )}
                        </option>
                    `).join("")}
                `;
            }
        );

        modal
            .querySelectorAll(
                "[data-close]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        modal.remove();
                    }
                );

            });

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {
                    modal.remove();
                }

            }
        );

        modal
            .querySelector("#examForm")
            .addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const form =
                        event.currentTarget;

                    const formData =
                        new FormData(form);

                    const title =
                        String(
                            formData.get(
                                "title"
                            ) || ""
                        ).trim();

                    const subject =
                        String(
                            formData.get(
                                "subject"
                            ) || ""
                        ).trim();

                    const date =
                        String(
                            formData.get(
                                "date"
                            ) || ""
                        ).trim();

                    if (!title) {
                        showFormError(
                            "اكتب اسم الامتحان."
                        );
                        return;
                    }

                    if (!subject) {
                        showFormError(
                            "اكتب اسم المادة."
                        );
                        return;
                    }

                    if (!date) {
                        showFormError(
                            "حدد تاريخ الامتحان."
                        );
                        return;
                    }

                    const data = {
                        id:
                            exam?.id ||
                            generateId("exam"),

                        title,

                        subject,

                        classId:
                            String(
                                formData.get(
                                    "classId"
                                ) || ""
                            ),

                        sectionId:
                            String(
                                formData.get(
                                    "sectionId"
                                ) || ""
                            ),

                        date,

                        time:
                            String(
                                formData.get(
                                    "time"
                                ) || ""
                            ),

                        maxGrade:
                            Number(
                                formData.get(
                                    "maxGrade"
                                )
                            ) || 0,

                        duration:
                            Number(
                                formData.get(
                                    "duration"
                                )
                            ) || 0,

                        notes:
                            String(
                                formData.get(
                                    "notes"
                                ) || ""
                            ).trim(),

                        status:
                            "active",

                        updatedAt:
                            nowISO(),

                        createdAt:
                            exam?.createdAt ||
                            nowISO()
                    };

                    try {

                        await put(
                            STORE_EXAMS,
                            data
                        );

                        showToast(
                            editing
                                ? "تم تعديل الامتحان بنجاح"
                                : "تمت إضافة الامتحان بنجاح"
                        );

                        modal.remove();

                        await refreshCurrentExamsView();

                    } catch (error) {

                        console.error(
                            error
                        );

                        showFormError(
                            "حدث خطأ أثناء حفظ الامتحان."
                        );
                    }
                }
            );

        function showFormError(message) {
            const errorBox =
                modal.querySelector(
                    "#examFormError"
                );

            errorBox.textContent =
                message;

            errorBox.style.display =
                "block";
        }
    }

    /* =====================================================
       الشعب
       ===================================================== */

    function getSectionsForClass(
        classId,
        classes
    ) {

        const found =
            classes.find(
                item =>
                    item.id === classId
            );

        if (
            !found ||
            !Array.isArray(
                found.sections
            )
        ) {
            return [];
        }

        return found.sections;
    }

    /* =====================================================
       تعديل
       ===================================================== */

    async function editExam(
        id,
        classes
    ) {

        const exam =
            await getById(
                STORE_EXAMS,
                id
            );

        if (!exam) {
            showToast(
                "لم يتم العثور على الامتحان",
                "error"
            );
            return;
        }

        openExamModal({
            classes,
            exam
        });
    }

    /* =====================================================
       عرض
       ===================================================== */

    async function viewExam(id) {

        const exam =
            await getById(
                STORE_EXAMS,
                id
            );

        if (!exam) {
            showToast(
                "الامتحان غير موجود",
                "error"
            );
            return;
        }

        const students =
            await getStudentsForExam(
                exam
            );

        const existing =
            document.querySelector(
                ".exam-modal"
            );

        if (existing) {
            existing.remove();
        }

        const modal =
            document.createElement("div");

        modal.className =
            "exam-modal show";

        modal.innerHTML = `

            <div class="exam-modal-content">

                <div class="exam-modal-header">

                    <h3>
                        📋 تفاصيل الامتحان
                    </h3>

                    <button
                        class="exam-close"
                        data-close
                    >
                        ×
                    </button>

                </div>

                <div class="exam-info-list">

                    <div class="exam-info-row">
                        <span class="exam-info-label">
                            الامتحان
                        </span>

                        <span class="exam-info-value">
                            ${escapeHTML(
                                exam.title
                            )}
                        </span>
                    </div>

                    <div class="exam-info-row">
                        <span class="exam-info-label">
                            المادة
                        </span>

                        <span class="exam-info-value">
                            ${escapeHTML(
                                exam.subject
                            )}
                        </span>
                    </div>

                    <div class="exam-info-row">
                        <span class="exam-info-label">
                            التاريخ
                        </span>

                        <span class="exam-info-value">
                            ${formatDate(
                                exam.date
                            )}
                        </span>
                    </div>

                    <div class="exam-info-row">
                        <span class="exam-info-label">
                            الوقت
                        </span>

                        <span class="exam-info-value">
                            ${formatTime(
                                exam.time
                            )}
                        </span>
                    </div>

                    <div class="exam-info-row">
                        <span class="exam-info-label">
                            الدرجة الكاملة
                        </span>

                        <span class="exam-info-value">
                            ${escapeHTML(
                                exam.maxGrade
                            )}
                        </span>
                    </div>

                    <div class="exam-info-row">
                        <span class="exam-info-label">
                            عدد الطلاب
                        </span>

                        <span class="exam-info-value">
                            ${students.length}
                        </span>
                    </div>

                </div>

                ${
                    exam.notes
                        ? `
                            <div style="
                                margin-top:15px;
                                padding:14px;
                                border-radius:14px;
                                background:rgba(255,255,255,.045);
                                border:1px solid rgba(255,255,255,.1);
                            ">
                                <div style="
                                    font-size:12px;
                                    color:rgba(255,255,255,.5);
                                    margin-bottom:7px;
                                ">
                                    ملاحظات
                                </div>

                                <div style="
                                    line-height:1.8;
                                    font-size:13px;
                                ">
                                    ${escapeHTML(
                                        exam.notes
                                    )}
                                </div>
                            </div>
                        `
                        : ""
                }

                <div style="
                    margin-top:18px;
                ">

                    <div style="
                        font-size:14px;
                        font-weight:700;
                        margin-bottom:10px;
                    ">
                        👨‍🎓 الطلاب المشمولون
                    </div>

                    ${
                        students.length
                            ? `
                                <div style="
                                    display:grid;
                                    grid-template-columns:
                                        repeat(
                                            auto-fit,
                                            minmax(
                                                180px,
                                                1fr
                                            )
                                        );
                                    gap:8px;
                                ">
                                    ${students.map(
                                        (student, index) => `
                                            <div style="
                                                padding:10px;
                                                border-radius:11px;
                                                background:rgba(255,255,255,.04);
                                                border:1px solid rgba(255,255,255,.08);
                                                font-size:12px;
                                            ">
                                                <strong>
                                                    ${index + 1}.
                                                </strong>

                                                ${escapeHTML(
                                                    student.name ||
                                                    student.fullName ||
                                                    "طالب"
                                                )}
                                            </div>
                                        `
                                    ).join("")}
                                </div>
                            `
                            : `
                                <div style="
                                    padding:14px;
                                    border-radius:13px;
                                    background:rgba(255,255,255,.04);
                                    color:rgba(255,255,255,.55);
                                    font-size:13px;
                                ">
                                    لا يوجد طلاب مرتبطون بهذا الامتحان.
                                </div>
                            `
                    }

                </div>

                <div class="exam-form-actions">

                    <button
                        class="exam-secondary-button"
                        data-close
                    >
                        إغلاق
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelectorAll(
                "[data-close]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        modal.remove();
                    }
                );

            });

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {
                    modal.remove();
                }

            }
        );
    }

    /* =====================================================
       حذف
       ===================================================== */

    async function deleteExam(
        id,
        callback
    ) {

        const exam =
            await getById(
                STORE_EXAMS,
                id
            );

        if (!exam) {
            showToast(
                "الامتحان غير موجود",
                "error"
            );
            return;
        }

        const confirmed =
            window.confirm(
                `هل تريد حذف الامتحان "${exam.title}"؟\n\nلا يمكن التراجع عن عملية الحذف.`
            );

        if (!confirmed) {
            return;
        }

        try {

            await remove(
                STORE_EXAMS,
                id
            );

            showToast(
                "تم حذف الامتحان"
            );

            if (
                typeof callback ===
                "function"
            ) {
                callback();
            }

        } catch (error) {

            console.error(
                error
            );

            showToast(
                "تعذر حذف الامتحان",
                "error"
            );
        }
    }

    /* =====================================================
       تحديث الصفحة الحالية
       ===================================================== */

    async function refreshCurrentExamsView() {

        const container =
            document.querySelector(
                "[data-page='exams']"
            ) ||
            document.querySelector(
                "#examsPage"
            ) ||
            document.querySelector(
                ".exams-page"
            );

        if (container) {
            await render(container);
            return;
        }

        if (
            window.TeacherApp &&
            typeof window.TeacherApp.refresh ===
                "function"
        ) {
            try {
                await window.TeacherApp.refresh(
                    "exams"
                );
            } catch (error) {
                console.warn(
                    "TeacherApp refresh failed",
                    error
                );
            }
        }
    }

    /* =====================================================
       إضافة امتحان من أي مكان
       ===================================================== */

    async function addExam() {

        const classes =
            await getAll(
                STORE_CLASSES
            );

        openExamModal({
            classes
        });
    }

    /* =====================================================
       البحث عن امتحان
       ===================================================== */

    async function searchExams(query) {

        const exams =
            await getAll(
                STORE_EXAMS
            );

        const normalized =
            normalizeText(query);

        if (!normalized) {
            return exams;
        }

        return exams.filter(
            exam => {

                const text =
                    normalizeText(
                        [
                            exam.title,
                            exam.subject,
                            exam.notes
                        ].join(" ")
                    );

                return text.includes(
                    normalized
                );
            }
        );
    }

    /* =====================================================
       الحصول على الامتحانات القادمة
       ===================================================== */

    async function getUpcomingExams(
        limit = 5
    ) {

        const exams =
            await getAll(
                STORE_EXAMS
            );

        const now =
            new Date();

        return exams
            .filter(
                exam => {

                    if (!exam.date) {
                        return false;
                    }

                    const date =
                        new Date(
                            `${exam.date}T${exam.time || "23:59"}`
                        );

                    return date >= now;
                }
            )
            .sort(
                (a, b) => {

                    const da =
                        new Date(
                            `${a.date}T${a.time || "00:00"}`
                        );

                    const db =
                        new Date(
                            `${b.date}T${b.time || "00:00"}`
                        );

                    return da - db;
                }
            )
            .slice(0, limit);
    }

    /* =====================================================
       أقرب امتحان
       ===================================================== */

    async function getNextExam() {

        const upcoming =
            await getUpcomingExams(
                1
            );

        return upcoming[0] || null;
    }

    /* =====================================================
       تصدير بيانات الامتحان
       ===================================================== */

    async function exportExamJSON(
        id
    ) {

        const exam =
            await getById(
                STORE_EXAMS,
                id
            );

        if (!exam) {
            showToast(
                "الامتحان غير موجود",
                "error"
            );
            return;
        }

        const students =
            await getStudentsForExam(
                exam
            );

        const payload = {
            exportedAt:
                nowISO(),

            exam,

            students
        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        payload,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "