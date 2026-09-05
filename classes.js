/* ============================================================
   FILE 13: classes.js
   Project: Teacher Desktop Management System
   Description:
   إدارة الصفوف والشُعب وربط الطلاب بها
   ============================================================ */

"use strict";

/* ============================================================
   GLOBAL CONFIGURATION
   ============================================================ */

const CLASSES_CONFIG = {
    DB_NAME: "TeacherManagementDB",
    STORE_NAME: "classes",
    STUDENTS_STORE: "students",

    MAX_CLASS_NAME_LENGTH: 100,
    MAX_SECTION_NAME_LENGTH: 100,

    DEFAULT_CLASS_ICON: "🎓",
    DEFAULT_SECTION_ICON: "🏫",

    SEARCH_DELAY: 180
};


/* ============================================================
   CLASSES STATE
   ============================================================ */

const ClassesState = {
    classes: [],
    filteredClasses: [],

    selectedClassId: null,
    selectedSectionId: null,

    searchText: "",

    isLoading: false,
    isEditing: false,

    editingClassId: null,
    editingSectionId: null,

    currentView: "classes",

    initialized: false
};


/* ============================================================
   DOM HELPERS
   ============================================================ */

function classesGetElement(id) {
    return document.getElementById(id);
}

function classesQuery(selector, parent = document) {
    return parent.querySelector(selector);
}

function classesQueryAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

function classesEscapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ============================================================
   ID GENERATOR
   ============================================================ */

function classesGenerateId(prefix = "class") {
    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).substring(2, 10)
    );
}


/* ============================================================
   DATE HELPERS
   ============================================================ */

function classesNowISO() {
    return new Date().toISOString();
}

function classesFormatDate(dateValue) {
    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("ar-IQ", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function classesFormatTime(dateValue) {
    if (!dateValue) {
        return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleTimeString("ar-IQ", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* ============================================================
   NORMALIZE CLASS OBJECT
   ============================================================ */

function classesNormalizeClass(data = {}) {
    const sections = Array.isArray(data.sections)
        ? data.sections
        : [];

    return {
        id: data.id || classesGenerateId("class"),

        name: String(data.name || "").trim(),

        grade: String(data.grade || "").trim(),

        stage: String(data.stage || "").trim(),

        description: String(data.description || "").trim(),

        icon: data.icon || CLASSES_CONFIG.DEFAULT_CLASS_ICON,

        color: data.color || "",

        active:
            typeof data.active === "boolean"
                ? data.active
                : true,

        sections: sections.map(section =>
            classesNormalizeSection(section)
        ),

        createdAt:
            data.createdAt || classesNowISO(),

        updatedAt:
            data.updatedAt || classesNowISO()
    };
}


/* ============================================================
   NORMALIZE SECTION OBJECT
   ============================================================ */

function classesNormalizeSection(data = {}) {
    return {
        id: data.id || classesGenerateId("section"),

        name: String(data.name || "").trim(),

        code: String(data.code || "").trim(),

        capacity:
            Number.isFinite(Number(data.capacity))
                ? Number(data.capacity)
                : 0,

        teacher:
            String(data.teacher || "").trim(),

        room:
            String(data.room || "").trim(),

        schedule:
            Array.isArray(data.schedule)
                ? data.schedule
                : [],

        studentIds:
            Array.isArray(data.studentIds)
                ? [...new Set(data.studentIds)]
                : [],

        notes:
            String(data.notes || "").trim(),

        active:
            typeof data.active === "boolean"
                ? data.active
                : true,

        createdAt:
            data.createdAt || classesNowISO(),

        updatedAt:
            data.updatedAt || classesNowISO()
    };
}


/* ============================================================
   INDEXEDDB OPEN
   ============================================================ */

function classesOpenDatabase() {
    return new Promise((resolve, reject) => {

        if (!("indexedDB" in window)) {
            reject(
                new Error(
                    "IndexedDB غير مدعوم في هذا المتصفح."
                )
            );
            return;
        }

        const request =
            indexedDB.open(
                CLASSES_CONFIG.DB_NAME,
                4
            );

        request.onupgradeneeded = event => {

            const db = event.target.result;

            if (!db.objectStoreNames.contains("classes")) {

                const classStore =
                    db.createObjectStore(
                        "classes",
                        {
                            keyPath: "id"
                        }
                    );

                classStore.createIndex(
                    "name",
                    "name",
                    {
                        unique: false
                    }
                );

                classStore.createIndex(
                    "grade",
                    "grade",
                    {
                        unique: false
                    }
                );

                classStore.createIndex(
                    "stage",
                    "stage",
                    {
                        unique: false
                    }
                );
            }

            if (!db.objectStoreNames.contains("students")) {

                const studentStore =
                    db.createObjectStore(
                        "students",
                        {
                            keyPath: "id"
                        }
                    );

                studentStore.createIndex(
                    "name",
                    "name",
                    {
                        unique: false
                    }
                );

                studentStore.createIndex(
                    "classId",
                    "classId",
                    {
                        unique: false
                    }
                );

                studentStore.createIndex(
                    "sectionId",
                    "sectionId",
                    {
                        unique: false
                    }
                );
            }
        };

        request.onsuccess = event => {
            resolve(event.target.result);
        };

        request.onerror = event => {
            reject(event.target.error);
        };
    });
}


/* ============================================================
   SAVE CLASS
   ============================================================ */

async function classesSaveClass(classData) {

    const db =
        await classesOpenDatabase();

    const normalized =
        classesNormalizeClass(
            classData
        );

    normalized.updatedAt =
        classesNowISO();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                [CLASSES_CONFIG.STORE_NAME],
                "readwrite"
            );

        const store =
            transaction.objectStore(
                CLASSES_CONFIG.STORE_NAME
            );

        const request =
            store.put(normalized);

        request.onsuccess = () => {

            db.close();

            resolve(normalized);
        };

        request.onerror = event => {

            db.close();

            reject(event.target.error);
        };
    });
}


/* ============================================================
   LOAD ALL CLASSES
   ============================================================ */

async function classesLoadAll() {

    ClassesState.isLoading = true;

    try {

        const db =
            await classesOpenDatabase();

        const result =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            [CLASSES_CONFIG.STORE_NAME],
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            CLASSES_CONFIG.STORE_NAME
                        );

                    const request =
                        store.getAll();

                    request.onsuccess =
                        () => resolve(
                            request.result || []
                        );

                    request.onerror =
                        event =>
                            reject(
                                event.target.error
                            );
                }
            );

        db.close();

        ClassesState.classes =
            result.map(
                classesNormalizeClass
            );

        classesApplySearch();

        return ClassesState.classes;

    } catch (error) {

        console.error(
            "Classes load error:",
            error
        );

        classesShowToast(
            "تعذر تحميل الصفوف",
            "error"
        );

        return [];

    } finally {

        ClassesState.isLoading = false;
    }
}


/* ============================================================
   DELETE CLASS
   ============================================================ */

async function classesDeleteClass(classId) {

    const target =
        ClassesState.classes.find(
            item => item.id === classId
        );

    if (!target) {
        return false;
    }

    const confirmed =
        window.confirm(
            `هل تريد حذف الصف "${target.name}"؟\n\nسيتم حذف الصف وشُعبه من النظام.`
        );

    if (!confirmed) {
        return false;
    }

    try {

        const db =
            await classesOpenDatabase();

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        [CLASSES_CONFIG.STORE_NAME],
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        CLASSES_CONFIG.STORE_NAME
                    );

                const request =
                    store.delete(classId);

                request.onsuccess =
                    () => resolve();

                request.onerror =
                    event =>
                        reject(
                            event.target.error
                        );
            }
        );

        db.close();

        ClassesState.classes =
            ClassesState.classes.filter(
                item => item.id !== classId
            );

        if (
            ClassesState.selectedClassId ===
            classId
        ) {
            ClassesState.selectedClassId =
                null;

            ClassesState.selectedSectionId =
                null;
        }

        classesApplySearch();
        classesRender();

        classesShowToast(
            "تم حذف الصف بنجاح",
            "success"
        );

        return true;

    } catch (error) {

        console.error(
            "Delete class error:",
            error
        );

        classesShowToast(
            "حدث خطأ أثناء حذف الصف",
            "error"
        );

        return false;
    }
}


/* ============================================================
   ADD / UPDATE SECTION
   ============================================================ */

async function classesSaveSection(
    classId,
    sectionData
) {

    const targetClass =
        ClassesState.classes.find(
            item => item.id === classId
        );

    if (!targetClass) {

        classesShowToast(
            "الصف غير موجود",
            "error"
        );

        return null;
    }

    const section =
        classesNormalizeSection(
            sectionData
        );

    section.updatedAt =
        classesNowISO();

    const existingIndex =
        targetClass.sections.findIndex(
            item =>
                item.id === section.id
        );

    if (existingIndex >= 0) {

        targetClass.sections[
            existingIndex
        ] = section;

    } else {

        targetClass.sections.push(
            section
        );
    }

    targetClass.updatedAt =
        classesNowISO();

    await classesSaveClass(
        targetClass
    );

    ClassesState.classes =
        ClassesState.classes.map(
            item =>
                item.id === targetClass.id
                    ? targetClass
                    : item
        );

    classesApplySearch();
    classesRender();

    return section;
}


/* ============================================================
   DELETE SECTION
   ============================================================ */

async function classesDeleteSection(
    classId,
    sectionId
) {

    const targetClass =
        ClassesState.classes.find(
            item => item.id === classId
        );

    if (!targetClass) {
        return false;
    }

    const section =
        targetClass.sections.find(
            item => item.id === sectionId
        );

    if (!section) {
        return false;
    }

    const confirmed =
        window.confirm(
            `هل تريد حذف الشعبة "${section.name}"؟`
        );

    if (!confirmed) {
        return false;
    }

    targetClass.sections =
        targetClass.sections.filter(
            item =>
                item.id !== sectionId
        );

    targetClass.updatedAt =
        classesNowISO();

    await classesSaveClass(
        targetClass
    );

    if (
        ClassesState.selectedSectionId ===
        sectionId
    ) {

        ClassesState.selectedSectionId =
            null;
    }

    ClassesState.classes =
        ClassesState.classes.map(
            item =>
                item.id === targetClass.id
                    ? targetClass
                    : item
        );

    classesApplySearch();
    classesRender();

    classesShowToast(
        "تم حذف الشعبة",
        "success"
    );

    return true;
}


/* ============================================================
   SEARCH
   ============================================================ */

function classesApplySearch() {

    const search =
        ClassesState.searchText
            .trim()
            .toLowerCase();

    if (!search) {

        ClassesState.filteredClasses =
            [...ClassesState.classes];

        return;
    }

    ClassesState.filteredClasses =
        ClassesState.classes.filter(
            item => {

                const classText =
                    [
                        item.name,
                        item.grade,
                        item.stage,
                        item.description
                    ]
                    .join(" ")
                    .toLowerCase();

                const sectionText =
                    item.sections
                        .map(
                            section =>
                                [
                                    section.name,
                                    section.code,
                                    section.room,
                                    section.teacher
                                ].join(" ")
                        )
                        .join(" ")
                        .toLowerCase();

                return (
                    classText.includes(search) ||
                    sectionText.includes(search)
                );
            }
        );
}


/* ============================================================
   CLASS STATISTICS
   ============================================================ */

function classesGetClassStatistics(
    classItem
) {

    const sections =
        Array.isArray(classItem.sections)
            ? classItem.sections
            : [];

    const studentIds = [];

    sections.forEach(
        section => {

            if (
                Array.isArray(
                    section.studentIds
                )
            ) {

                studentIds.push(
                    ...section.studentIds
                );
            }
        }
    );

    return {
        sections: sections.length,

        students:
            [...new Set(studentIds)].length,

        activeSections:
            sections.filter(
                section =>
                    section.active !== false
            ).length
    };
}


/* ============================================================
   RENDER MAIN
   ============================================================ */

function classesRender() {

    const container =
        classesGetElement(
            "classes-container"
        );

    if (!container) {
        return;
    }

    const list =
        ClassesState.filteredClasses;

    container.innerHTML = "";

    if (!list.length) {

        container.innerHTML = `
            <div class="classes-empty-state">
                <div class="classes-empty-icon">
                    🎓
                </div>

                <h3>
                    لا توجد صفوف
                </h3>

                <p>
                    أضف أول صف دراسي حتى تبدأ بإدارة الطلاب والشُعب.
                </p>

                <button
                    type="button"
                    class="classes-primary-button"
                    onclick="classesOpenAddClassModal()"
                >
                    <span>＋</span>
                    إضافة صف
                </button>
            </div>
        `;

        return;
    }

    list.forEach(
        classItem => {

            container.appendChild(
                classesCreateClassCard(
                    classItem
                )
            );
        }
    );
}


/* ============================================================
   CREATE CLASS CARD
   ============================================================ */

function classesCreateClassCard(
    classItem
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "classes-glass-card";

    card.dataset.classId =
        classItem.id;

    const statistics =
        classesGetClassStatistics(
            classItem
        );

    const sections =
        Array.isArray(
            classItem.sections
        )
            ? classItem.sections
            : [];

    const sectionsHTML =
        sections.length
            ? sections
                .map(
                    section =>
                        classesCreateSectionHTML(
                            classItem,
                            section
                        )
                )
                .join("")
            : `
                <div class="classes-no-sections">
                    <span>🏫</span>
                    <span>
                        لا توجد شُعب مضافة لهذا الصف
                    </span>
                </div>
            `;

    card.innerHTML = `
        <div class="classes-card-header">

            <div class="classes-title-area">

                <div class="classes-class-icon">
                    ${classesEscapeHTML(
                        classItem.icon
                    )}
                </div>

                <div>
                    <h3>
                        ${classesEscapeHTML(
                            classItem.name
                        )}
                    </h3>

                    <div class="classes-subtitle">
                        ${
                            classItem.stage
                                ? classesEscapeHTML(
                                    classItem.stage
                                  )
                                : "مرحلة دراسية"
                        }

                        ${
                            classItem.grade
                                ? `
                                    <span>•</span>
                                    ${classesEscapeHTML(
                                        classItem.grade
                                    )}
                                  `
                                : ""
                        }
                    </div>
                </div>

            </div>

            <div class="classes-card-actions">

                <button
                    type="button"
                    class="classes-icon-button"
                    title="تعديل الصف"
                    onclick="classesEditClass('${classItem.id}')"
                >
                    ✏️
                </button>

                <button
                    type="button"
                    class="classes-icon-button danger"
                    title="حذف الصف"
                    onclick="classesDeleteClass('${classItem.id}')"
                >
                    🗑️
                </button>

            </div>

        </div>

        <div class="classes-statistics">

            <div class="classes-stat-item">
                <span class="classes-stat-icon">
                    👥
                </span>

                <div>
                    <strong>
                        ${statistics.students}
                    </strong>

                    <small>
                        طالب
                    </small>
                </div>
            </div>

            <div class="classes-stat-item">
                <span class="classes-stat-icon">
                    🏫
                </span>

                <div>
                    <strong>
                        ${statistics.sections}
                    </strong>

                    <small>
                        شعبة
                    </small>
                </div>
            </div>

            <div class="classes-stat-item">
                <span class="classes-stat-icon">
                    🟢
                </span>

                <div>
                    <strong>
                        ${statistics.activeSections}
                    </strong>

                    <small>
                        فعالة
                    </small>
                </div>
            </div>

        </div>

        ${
            classItem.description
                ? `
                    <div class="classes-description">
                        ${classesEscapeHTML(
                            classItem.description
                        )}
                    </div>
                  `
                : ""
        }

        <div class="classes-sections-header">

            <div>
                <span class="classes-section-header-icon">
                    🏫
                </span>

                <strong>
                    الشُعب
                </strong>
            </div>

            <button
                type="button"
                class="classes-small-button"
                onclick="classesOpenAddSectionModal('${classItem.id}')"
            >
                ＋ شعبة
            </button>

        </div>

        <div class="classes-sections-list">
            ${sectionsHTML}
        </div>

        <div class="classes-card-footer">

            <span>
                آخر تعديل:
                ${classesFormatDate(
                    classItem.updatedAt
                )}
                ${classesFormatTime(
                    classItem.updatedAt
                )}
            </span>

            <button
                type="button"
                class="classes-details-button"
                onclick="classesOpenClassDetails('${classItem.id}')"
            >
                عرض التفاصيل
                <span>←</span>
            </button>

        </div>
    `;

    return card;
}


/* ============================================================
   SECTION HTML
   ============================================================ */

function classesCreateSectionHTML(
    classItem,
    section
) {

    const studentsCount =
        Array.isArray(
            section.studentIds
        )
            ? section.studentIds.length
            : 0;

    const activeClass =
        section.active !== false
            ? "active"
            : "inactive";

    return `
        <div
            class="classes-section-item ${activeClass}"
            data-section-id="${classesEscapeHTML(
                section.id
            )}"
        >

            <div class="classes-section-main">

                <div class="classes-section-icon">
                    🏫
                </div>

                <div class="classes-section-info">

                    <strong>
                        ${classesEscapeHTML(
                            section.name ||
                            "شعبة بدون اسم"
                        )}
                    </strong>

                    <div class="classes-section-meta">

                        ${
                            section.code
                                ? `
                                    <span>
                                        #${classesEscapeHTML(
                                            section.code
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                        <span>
                            👥 ${studentsCount}
                        </span>

                        ${
                            section.room
                                ? `
                                    <span>
                                        🚪 ${classesEscapeHTML(
                                            section.room
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>

                </div>

            </div>

            <div class="classes-section-actions">

                <button
                    type="button"
                    title="عرض طلاب الشعبة"
                    onclick="classesOpenSectionStudents('${classItem.id}', '${section.id}')"
                >
                    👥
                </button>

                <button
                    type="button"
                    title="تعديل الشعبة"
                    onclick="classesEditSection('${classItem.id}', '${section.id}')"
                >
                    ✏️
                </button>

                <button
                    type="button"
                    title="حذف الشعبة"
                    onclick="classesDeleteSection('${classItem.id}', '${section.id}')"
                >
                    🗑️
                </button>

            </div>

        </div>
    `;
}


/* ============================================================
   ADD CLASS MODAL
   ============================================================ */

function classesOpenAddClassModal() {

    ClassesState.isEditing = false;
    ClassesState.editingClassId = null;

    const modal =
        classesGetElement(
            "class-modal"
        );

    if (!modal) {

        classesCreateClassModal();

        setTimeout(
            classesOpenAddClassModal,
            0
        );

        return;
    }

    classesSetClassModalData(null);

    classesShowModal(
        modal
    );
}


/* ============================================================
   EDIT CLASS
   ============================================================ */

function classesEditClass(classId) {

    const classItem =
        ClassesState.classes.find(
            item => item.id === classId
        );

    if (!classItem) {
        return;
    }

    ClassesState.isEditing = true;
    ClassesState.editingClassId =
        classId;

    let modal =
        classesGetElement(
            "class-modal"
        );

    if (!modal) {

        classesCreateClassModal();

        modal =
            classesGetElement(
                "class-modal"
            );
    }

    classesSetClassModalData(
        classItem
    );

    classesShowModal(
        modal
    );
}


/* ============================================================
   CLASS MODAL
   ============================================================ */

function classesCreateClassModal() {

    if (
        classesGetElement(
            "class-modal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "class-modal";

    modal.className =
        "classes-modal-overlay";

    modal.innerHTML = `

        <div
            class="classes-modal"
            role="dialog"
            aria-modal="true"
        >

            <div class="classes-modal-header">

                <div>
                    <span class="classes-modal-icon">
                        🎓
                    </span>

                    <h2 id="class-modal-title">
                        إضافة صف جديد
                    </h2>
                </div>

                <button
                    type="button"
                    class="classes-modal-close"
                    onclick="classesCloseModal('class-modal')"
                >
                    ×
                </button>

            </div>

            <form
                id="class-form"
                class="classes-form"
            >

                <div class="classes-form-grid">

                    <div class="classes-field">

                        <label>
                            اسم الصف
                        </label>

                        <input
                            id="class-name"
                            name="name"
                            type="text"
                            maxlength="100"
                            required
                            placeholder="مثال: الصف الثالث"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            المرحلة
                        </label>

                        <input
                            id="class-stage"
                            name="stage"
                            type="text"
                            maxlength="100"
                            placeholder="مثال: المرحلة الابتدائية"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            رقم / مستوى الصف
                        </label>

                        <input
                            id="class-grade"
                            name="grade"
                            type="text"
                            maxlength="100"
                            placeholder="مثال: 3"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            أيقونة الصف
                        </label>

                        <input
                            id="class-icon"
                            name="icon"
                            type="text"
                            maxlength="8"
                            value="🎓"
                            placeholder="🎓"
                        >

                    </div>

                </div>

                <div class="classes-field">

                    <label>
                        وصف / ملاحظة
                    </label>

                    <textarea
                        id="class-description"
                        name="description"
                        rows="4"
                        maxlength="500"
                        placeholder="اكتب أي معلومات إضافية عن الصف..."
                    ></textarea>

                </div>

                <div class="classes-form-status">
                    <span class="classes-pulse-dot"></span>
                    سيتم حفظ الصف مباشرة داخل IndexedDB
                </div>

                <div class="classes-modal-footer">

                    <button
                        type="button"
                        class="classes-secondary-button"
                        onclick="classesCloseModal('class-modal')"
                    >
                        إلغاء
                    </button>

                    <button
                        type="submit"
                        class="classes-primary-button"
                    >
                        💾 حفظ الصف
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    const form =
        classesGetElement(
            "class-form"
        );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await classesSubmitClassForm();
        }
    );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                classesCloseModal(
                    "class-modal"
                );
            }
        }
    );
}


/* ============================================================
   SET CLASS MODAL DATA
   ============================================================ */

function classesSetClassModalData(
    classItem
) {

    const title =
        classesGetElement(
            "class-modal-title"
        );

    const name =
        classesGetElement(
            "class-name"
        );

    const stage =
        classesGetElement(
            "class-stage"
        );

    const grade =
        classesGetElement(
            "class-grade"
        );

    const icon =
        classesGetElement(
            "class-icon"
        );

    const description =
        classesGetElement(
            "class-description"
        );

    if (!name) {
        return;
    }

    if (!classItem) {

        title.textContent =
            "إضافة صف جديد";

        name.value = "";
        stage.value = "";
        grade.value = "";
        icon.value = "🎓";
        description.value = "";

        return;
    }

    title.textContent =
        "تعديل الصف";

    name.value =
        classItem.name || "";

    stage.value =
        classItem.stage || "";

    grade.value =
        classItem.grade || "";

    icon.value =
        classItem.icon || "🎓";

    description.value =
        classItem.description || "";
}


/* ============================================================
   SUBMIT CLASS FORM
   ============================================================ */

async function classesSubmitClassForm() {

    const name =
        classesGetElement(
            "class-name"
        ).value.trim();

    const stage =
        classesGetElement(
            "class-stage"
        ).value.trim();

    const grade =
        classesGetElement(
            "class-grade"
        ).value.trim();

    const icon =
        classesGetElement(
            "class-icon"
        ).value.trim() ||
        "🎓";

    const description =
        classesGetElement(
            "class-description"
        ).value.trim();

    if (!name) {

        classesShowToast(
            "اكتب اسم الصف أولاً",
            "warning"
        );

        return;
    }

    let existing = null;

    if (
        ClassesState.isEditing &&
        ClassesState.editingClassId
    ) {

        existing =
            ClassesState.classes.find(
                item =>
                    item.id ===
                    ClassesState.editingClassId
            );
    }

    const data =
        classesNormalizeClass({

            id:
                existing
                    ? existing.id
                    : classesGenerateId(
                        "class"
                    ),

            name,

            stage,

            grade,

            icon,

            description,

            active:
                existing
                    ? existing.active
                    : true,

            sections:
                existing
                    ? existing.sections
                    : [],

            createdAt:
                existing
                    ? existing.createdAt
                    : classesNowISO(),

            updatedAt:
                classesNowISO()
        });

    try {

        const saved =
            await classesSaveClass(
                data
            );

        const index =
            ClassesState.classes.findIndex(
                item =>
                    item.id === saved.id
            );

        if (index >= 0) {

            ClassesState.classes[index] =
                saved;

        } else {

            ClassesState.classes.push(
                saved
            );
        }

        classesApplySearch();
        classesRender();

        classesCloseModal(
            "class-modal"
        );

        classesShowToast(
            ClassesState.isEditing
                ? "تم تعديل الصف بنجاح"
                : "تمت إضافة الصف بنجاح",
            "success"
        );

        ClassesState.isEditing = false;
        ClassesState.editingClassId =
            null;

    } catch (error) {

        console.error(
            "Save class error:",
            error
        );

        classesShowToast(
            "تعذر حفظ الصف",
            "error"
        );
    }
}


/* ============================================================
   SECTION MODAL
   ============================================================ */

function classesCreateSectionModal() {

    if (
        classesGetElement(
            "section-modal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "section-modal";

    modal.className =
        "classes-modal-overlay";

    modal.innerHTML = `

        <div class="classes-modal">

            <div class="classes-modal-header">

                <div>

                    <span class="classes-modal-icon">
                        🏫
                    </span>

                    <h2 id="section-modal-title">
                        إضافة شعبة
                    </h2>

                </div>

                <button
                    type="button"
                    class="classes-modal-close"
                    onclick="classesCloseModal('section-modal')"
                >
                    ×
                </button>

            </div>

            <form
                id="section-form"
                class="classes-form"
            >

                <div class="classes-form-grid">

                    <div class="classes-field">

                        <label>
                            اسم الشعبة
                        </label>

                        <input
                            id="section-name"
                            type="text"
                            maxlength="100"
                            required
                            placeholder="مثال: أ"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            رمز الشعبة
                        </label>

                        <input
                            id="section-code"
                            type="text"
                            maxlength="50"
                            placeholder="مثال: A"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            عدد المقاعد
                        </label>

                        <input
                            id="section-capacity"
                            type="number"
                            min="0"
                            max="1000"
                            value="0"
                            placeholder="0"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            القاعة
                        </label>

                        <input
                            id="section-room"
                            type="text"
                            maxlength="100"
                            placeholder="مثال: قاعة 3"
                        >

                    </div>

                    <div class="classes-field">

                        <label>
                            المدرس
                        </label>

                        <input
                            id="section-teacher"
                            type="text"
                            maxlength="150"
                            placeholder="اسم المدرس"
                        >

                    </div>

                </div>

                <div class="classes-field">

                    <label>
                        ملاحظات الشعبة
                    </label>

                    <textarea
                        id="section-notes"
                        rows="4"
                        maxlength="500"
                        placeholder="ملاحظات إضافية..."
                    ></textarea>

                </div>

                <div class="classes-modal-footer">

                    <button
                        type="button"
                        class="classes-secondary-button"
                        onclick="classesCloseModal('section-modal')"
                    >
                        إلغاء
                    </button>

                    <button
                        type="submit"
                        class="classes-primary-button"
                    >
                        💾 حفظ الشعبة
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    const form =
        classesGetElement(
            "section-form"
        );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await classesSubmitSectionForm();
        }
    );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                classesCloseModal(
                    "section-modal"
                );
            }
        }
    );
}


/* ============================================================
   OPEN ADD SECTION
   ============================================================ */

function classesOpenAddSectionModal(
    classId
) {

    ClassesState.isEditing = false;
    ClassesState.editingClassId =
        classId;

    ClassesState.editingSectionId =
        null;

    if (
        !classesGetElement(
            "section-modal"
        )
    ) {

        classesCreateSectionModal();
    }

    classesSetSectionModalData(
        null
    );

    classesShowModal(
        classesGetElement(
            "section-modal"
        )
    );
}


/* ============================================================
   EDIT SECTION
   ============================================================ */

function classesEditSection(
    classId,
    sectionId
) {

    const classItem =
        ClassesState.classes.find(
            item =>
                item.id === classId
        );

    if (!classItem) {
        return;
    }

    const section =
        classItem.sections.find(
            item =>
                item.id === sectionId
        );

    if (!section) {
        return;
    }

    ClassesState.isEditing = true;

    ClassesState.editingClassId =
        classId;

    ClassesState.editingSectionId =
        sectionId;

    if (
        !classesGetElement(
            "section-modal"
        )
    ) {

        classesCreateSectionModal();
    }

    classesSetSectionModalData(
        section
    );

    classesShowModal(
        classesGetElement(
            "section-modal"
        )
    );
}


/* ============================================================
   SET SECTION MODAL DATA
   ============================================================ */

function classesSetSectionModalData(
    section
) {

    const title =
        classesGetElement(
            "section-modal-title"
        );

    const name =
        classesGetElement(
            "section-name"
        );

    const code =
        classesGetElement(
            "section-code"
        );

    const capacity =
        classesGetElement(
            "section-capacity"
        );

    const room =
        classesGetElement(
            "section-room"
        );

    const teacher =
        classesGetElement(
            "section-teacher"
        );

    const notes =
        classesGetElement(
            "section-notes"
        );

    if (!name) {
        return;
    }

    if (!section) {

        title.textContent =
            "إضافة شعبة";

        name.value = "";
        code.value = "";
        capacity.value = 0;
        room.value = "";
        teacher.value = "";
        notes.value = "";

        return;
    }

    title.textContent =
        "تعديل الشعبة";

    name.value =
        section.name || "";

    code.value =
        section.code || "";

    capacity.value =
        section.capacity || 0;

    room.value =
        section.room || "";

    teacher.value =
        section.teacher || "";

    notes.value =
        section.notes || "";
}


/* ============================================================
   SUBMIT SECTION FORM
   ============================================================ */

async function classesSubmitSectionForm() {

    const classId =
        ClassesState.editingClassId;

    if (!classId) {
        return;
    }

    const name =
        classesGetElement(
            "section-name"
        ).value.trim();

    const code =
        classesGetElement(
            "section-code"
        ).value.trim();

    const capacity =
        Number(
            classesGetElement(
                "section-capacity"
            ).value
        ) || 0;

    const room =
        classesGetElement(
            "section-room"
        ).value.trim();

    const teacher =
        classesGetElement(
            "section-teacher"
        ).value.trim();

    const notes =
        classesGetElement(
            "section-notes"
        ).value.trim();

    if (!name) {

        classesShowToast(
            "اكتب اسم الشعبة",
            "warning"
        );

        return;
    }

    const classItem =
        ClassesState.classes.find(
            item =>
                item.id === classId
        );

    if (!classItem) {

        classesShowToast(
            "الصف غير موجود",
            "error"
        );

        return;
    }

    let existing = null;

    if (
        ClassesState.isEditing &&
        ClassesState.editingSectionId
    ) {

        existing =
            classItem.sections.find(
                item =>
                    item.id ===
                    ClassesState.editingSectionId
            );
    }

    const section =
        classesNormalizeSection({

            id:
                existing
                    ? existing.id
                    : classesGenerateId(
                        "section"
                    ),

            name,

            code,

            capacity,

            room,

            teacher,

            notes,

            studentIds:
                existing
                    ? existing.studentIds
                    : [],

            schedule:
                existing
                    ? existing.schedule
                    : [],

            active:
                existing
                    ? existing.active
                    : true,

            createdAt:
                existing
                    ? existing.createdAt
                    : classesNowISO(),

            updatedAt:
                classesNowISO()
        });

    try {

        await classesSaveSection(
            classId,
            section
        );

        classesCloseModal(
            "section-modal"
        );

        classesShowToast(
            existing
                ? "تم تعديل الشعبة"
                : "تمت إضافة الشعبة",
            "success"
        );

        ClassesState.isEditing = false;

        ClassesState.editingClassId =
            null;

        ClassesState.editingSectionId =
            null;

    } catch (error) {

        console.error(
            "Save section error:",
            error
        );

        classesShowToast(
            "تعذر حفظ الشعبة",
            "error"
        );
    }
}


/* ============================================================
   CLASS DETAILS
   ============================================================ */

function classesOpenClassDetails(
    classId
) {

    const classItem =
        ClassesState.classes.find(
            item =>
                item.id === classId
        );

    if (!classItem) {
        return;
    }

    ClassesState.selectedClassId =
        classId;

    ClassesState.currentView =
        "details";

    let modal =
        classesGetElement(
            "class-details-modal"
        );

    if (!modal) {

        classesCreateClassDetailsModal();

        modal =
            classesGetElement(
                "class-details-modal"
            );
    }

    classesRenderClassDetails(
        classItem
    );

    classesShowModal(
        modal
    );
}


/* ============================================================
   CREATE DETAILS MODAL
   ============================================================ */

function classesCreateClassDetailsModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "class-details-modal";

    modal.className =
        "classes-modal-overlay";

    modal.innerHTML = `

        <div
            class="classes-modal classes-large-modal"
        >

            <div class="classes-modal-header">

                <div>

                    <span class="classes-modal-icon">
                        📚
                    </span>

                    <h2>
                        تفاصيل الصف
                    </h2>

                </div>

                <button
                    type="button"
                    class="classes-modal-close"
                    onclick="classesCloseModal('class-details-modal')"
                >
                    ×
                </button>

            </div>

            <div
                id="class-details-content"
                class="classes-details-content"
            ></div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                classesCloseModal(
                    "class-details-modal"
                );
            }
        }
    );
}


/* ============================================================
   RENDER CLASS DETAILS
   ============================================================ */

function classesRenderClassDetails(
    classItem
) {

    const container =
        classesGetElement(
            "class-details-content"
        );

    if (!container) {
        return;
    }

    const statistics =
        classesGetClassStatistics(
            classItem
        );

    container.innerHTML = `

        <div class="classes-detail-top">

            <div class="classes-detail-icon">
                ${classesEscapeHTML(
                    classItem.icon
                )}
            </div>

            <div>

                <h3>
                    ${classesEscapeHTML(
                        classItem.name
                    )}
                </h3>

                <p>
                    ${
                        classItem.stage
                            ? classesEscapeHTML(
                                classItem.stage
                              )
                            : ""
                    }

                    ${
                        classItem.grade
                            ? `
                                • الصف
                                ${classesEscapeHTML(
                                    classItem.grade
                                )}
                              `
                            : ""
                    }
                </p>

            </div>

        </div>

        <div class="classes-detail-stats">

            <div>
                <span>👥</span>
                <strong>
                    ${statistics.students}
                </strong>
                <small>الطلاب</small>
            </div>

            <div>
                <span>🏫</span>
                <strong>
                    ${statistics.sections}
                </strong>
                <small>الشُعب</small>
            </div>

            <div>
                <span>🟢</span>
                <strong>
                    ${statistics.activeSections}
                </strong>
                <small>الشُعب الفعالة</small>
            </div>

        </div>

        ${
            classItem.description
                ? `
                    <div class="classes-detail-note">
                        <strong>
                            📝 ملاحظة الصف
                        </strong>

                        <p>
                            ${classesEscapeHTML(
                                classItem.description
                            )}
                        </p>
                    </div>
                  `
                : ""
        }

        <div class="classes-detail-section-title">
            🏫 الشُعب التابعة للصف
        </div>

        <div class="classes-detail-sections">

            ${
                classItem.sections.length
                    ? classItem.sections
                        .map(
                            section => `
                                <button
                                    type="button"
                                    class="classes-detail-section-button"
                                    onclick="classesOpenSectionStudents('${classItem.id}', '${section.id}')"
                                >

                                    <span>
                                        🏫
                                    </span>

                                    <div>

                                        <strong>
                                            ${classesEscapeHTML(
                                                section.name
                                            )}
                                        </strong>

                                        <small>
                                            ${
                                                Array.isArray(
                                                    section.studentIds
                                                )
                                                    ? section.studentIds.length
                                                    : 0
                                            }
                                            طالب
                                        </small>

                                    </div>

                                    <span>
                                        ←
                                    </span>

                                </button>
                            `
                        )
                        .join("")
                    : `
                        <div class="classes-no-sections">
                            لا توجد شُعب.
                        </div>
                      `
            }

        </div>

    `;
}


/* ============================================================
   SECTION STUDENTS
   ============================================================ */

async function classesOpenSectionStudents(
    classId,
    sectionId
) {

    const classItem =
        ClassesState.classes.find(
            item =>
                item.id === classId
        );

    if (!classItem) {
        return;
    }

    const section =
        classItem.sections.find(
            item =>
                item.id === sectionId
        );

    if (!section) {
        return;
    }

    ClassesState.selectedClassId =
        classId;

    ClassesState.selectedSectionId =
        sectionId;

    let modal =
        classesGetElement(
            "section-students-modal"
        );

    if (!modal) {

        classesCreateSectionStudentsModal();

        modal =
            classesGetElement(
                "section-students-modal"
            );
    }

    await classesRenderSectionStudents(
        classItem,
        section
    );

    classesShowModal(
        modal
    );
}


/* ============================================================
   CREATE SECTION STUDENTS MODAL
   ============================================================ */

function classesCreateSectionStudentsModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "section-students-modal";

    modal.className =
        "classes-modal-overlay";

    modal.innerHTML = `

        <div
            class="classes-modal classes-large-modal"
        >

            <div class="classes-modal-header">

                <div>

                    <span class="classes-modal-icon">
                        👥
                    </span>

                    <h2 id="section-students-title">
                        طلاب الشعبة
                    </h2>

                </div>

                <button
                    type="button"
                    class="classes-modal-close"
                    onclick="classesCloseModal('section-students-modal')"
                >
                    ×
                </button>

            </div>

            <div
                id="section-students-content"
                class="classes-students-content"
            ></div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                classesCloseModal(
                    "section-students-modal"
                );
            }
        }
    );
}


/* ============================================================
   LOAD STUDENTS FROM INDEXEDDB
   ============================================================ */

async function classesLoadStudentsBySection(
    sectionId
) {

    try {

        const db =
            await classesOpenDatabase();

        const students =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            [CLASSES_CONFIG.STUDENTS_STORE],
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            CLASSES_CONFIG.STUDENTS_STORE
                        );

                    const index =
                        store.index(
                            "sectionId"
                        );

                    const request =
                        index.getAll(
                            sectionId
                        );

                    request.onsuccess =
                        () =>
                            resolve(
                                request.result ||
                                []
                            );

                    request.onerror =
                        event =>
                            reject(
                                event.target.error
                            );
                }
            );

        db.close();

        return students;

    } catch (error) {

        console.warn(
            "Could not load students:",
            error
        );

        return [];
    }
}


/* ============================================================
   RENDER SECTION STUDENTS
   ============================================================ */

async function classesRenderSectionStudents(
    classItem,
    section
) {

    const container =
        classesGetElement(
            "section-students-content"
        );

    const title =
        classesGetElement(
            "section-students-title"
        );

    if (!container) {
        return;
    }

    if (title) {

        title.textContent =
            `${classItem.name} — ${section.name}`;
    }

    container.innerHTML = `

        <div class="classes-student-toolbar">

            <div>
                <strong>
                    👥 الطلاب
                </strong>

                <span>
                    ${section.studentIds.length}
                    طالب مسجل
                </span>
            </div>

            <button
                type="button"
                class="classes-primary-button"
                onclick="classesAddStudentToSection('${classItem.id}', '${section.id}')"
            >
                ＋ إضافة طالب
            </button>

        </div>

        <div
            id="section-students-list"
            class="classes-students-list"
        >
            <div class="classes-loading">
                جاري تحميل الطلاب...
            </div>
        </div>
    `;

    const students =
        await classesLoadStudentsBySection(
            section.id
        );

    const list =
        classesGetElement(
            "section-students-list"
        );

    if (!list) {
        return;
    }

    if (!students.length) {

        list.innerHTML = `

            <div class="classes-empty-state compact">

                <div class="classes-empty-icon">
                    👤
                </div>

                <h3>
                    لا يوجد طلاب
                </h3>

                <p>
                    لم تتم إضافة أي طالب إلى هذه الشعبة حتى الآن.
                </p>

            </div>
        `;

        return;
    }

    list.innerHTML =
        students
            .sort(
                (a, b) =>
                    String(
                        a.name || ""
                    ).localeCompare(
                        String(
                            b.name || ""
                        ),
                        "ar"
                    )
            )
            .map(
                (student, index) => `

                    <button
                        type="button"
                        class="classes-student-row"
                        onclick="classesOpenStudent('${student.id}')"
                    >

                        <span class="classes-student-number">
                            ${index + 1}
                        </span>

                        <span class="classes-student-avatar">
                            👤
                        </span>

                        <span class="classes-student-name">
                            ${classesEscapeHTML(
                                student.name ||
                                "طالب بدون اسم"
                            )}
                        </span>

                        <span class="classes-student-code">
                            ${
                                student.code
                                    ? classesEscapeHTML(
                                        student.code
                                      )
                                    : "—"
                            }
                        </span>

                        <span>
                            ←
                        </span>

                    </button>
                `
            )
            .join("");
}


/* ============================================================
   ADD STUDENT TO SECTION
   ============================================================ */

async function classesAddStudentToSection(
    classId,
    sectionId
) {

    /*
       هذا الجزء يربط قسم الصفوف بقسم الطلاب.
       إذا كان students.js موجوداً، يتم فتح نموذج
       إضافة الطالب مع تمرير الصف والشعبة.
    */

    ClassesState.selectedClassId =
        classId;

    ClassesState.selectedSectionId =
        sectionId;

    if (
        typeof window.openStudentModal ===
        "function"
    ) {

        window.openStudentModal({
            classId,
            sectionId
        });

        return;
    }

    if (
        typeof window.studentsOpenAddModal ===
        "function"
    ) {

        window.studentsOpenAddModal({
            classId,
            sectionId
        });

        return;
    }

    classesShowToast(
        "قسم الطلاب غير متصل بعد بهذه الوظيفة",
        "info"
    );
}


/* ============================================================
   OPEN STUDENT
   ============================================================ */

function classesOpenStudent(
    studentId
) {

    if (
        typeof window.openStudentDetails ===
        "function"
    ) {

        window.openStudentDetails(
            studentId
        );

        return;
    }

    if (
        typeof window.studentsOpenDetails ===
        "function"
    ) {

        window.studentsOpenDetails(
            studentId
        );

        return;
    }

    classesShowToast(
        "سيتم فتح ملف الطالب من قسم الطلاب",
        "info"
    );
}


/* ============================================================
   SEARCH INPUT
   ============================================================ */

function classesSetupSearch() {

    const input =
        classesGetElement(
            "classes-search"
        );

    if (!input) {
        return;
    }

    let timer = null;

    input.addEventListener(
        "input",
        event => {

            clearTimeout(timer);

            timer =
                setTimeout(
                    () => {

                        ClassesState.searchText =
                            event.target.value;

                        classesApplySearch();

                        classesRender();

                    },
                    CLASSES_CONFIG.SEARCH_DELAY
                );
        }
    );
}


/* ============================================================
   PAGE HEADER
   ============================================================ */

function classesCreatePageHeader() {

    const container =
        classesGetElement(
            "classes-page"
        );

    if (!container) {
        return;
    }

    const existing =
        classesGetElement(
            "classes-header"
        );

    if (existing) {
        return;
    }

    const header =
        document.createElement(
            "div"
        );

    header.id =
        "classes-header";

    header.className =
        "classes-page-header";

    header.innerHTML = `

        <div class="classes-page-heading">

            <div class="classes-page-heading-icon">
                🎓
            </div>

            <div>

                <h1>
                    الصفوف والشُعب
                </h1>

                <p>
                    إدارة الصفوف، الشُعب، والطلاب المرتبطين بها
                </p>

            </div>

        </div>

        <div class="classes-page-tools">

            <div class="classes-search-box">

                <span>
                    🔎
                </span>

                <input
                    id="classes-search"
                    type="search"
                    placeholder="ابحث عن صف أو شعبة..."
                    autocomplete="off"
                >

            </div>

            <button
                type="button"
                class="classes-primary-button"
                onclick="classesOpenAddClassModal()"
            >
                <span>＋</span>
                إضافة صف
            </button>

        </div>
    `;

    container.prepend(
        header
    );
}


/* ============================================================
   TOAST SYSTEM
   ============================================================ */

function classesShowToast(
    message,
    type = "info"
) {

    let container =
        classesGetElement(
            "classes-toast-container"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "classes-toast-container";

        container.className =
            "classes-toast-container";

        document.body.appendChild(
            container
        );
    }

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `classes-toast classes-toast-${type}`;

    const icons = {
        success: "✓",
        error: "×",
        warning: "!",
        info: "i"
    };

    toast.innerHTML = `

        <span class="classes-toast-icon">
            ${icons[type] || "i"}
        </span>

        <span class="classes-toast-message">
            ${classesEscapeHTML(
                message
            )}
        </span>

    `;

    container.appendChild(
        toast
    );

    requestAnimationFrame(
        () => {
            toast.classList.add(
                "show"
            );
        }
    );

    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        3500
    );
}


/* ============================================================
   MODAL HELPERS
   ============================================================ */

function classesShowModal(
    modal
) {

    if (!modal) {
        return;
    }

    modal.classList.add(
        "visible"
    );

    document.body.classList.add(
        "classes-modal-open"
    );

    setTimeout(
        () => {

            const focusable =
                modal.querySelector(
                    "input, textarea, button"
                );

            if (
                focusable &&
                !focusable.classList.contains(
                    "classes-modal-close"
                )
            ) {

                focusable.focus();
            }

        },
        80
    );
}

function classesCloseModal(
    modalId
) {

    const modal =
        classesGetElement(
            modalId
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "visible"
    );

    setTimeout(
        () => {

            if (
                !classesQuery(
                    ".classes-modal-overlay.visible"
                )
            ) {

                document.body.classList.remove(
                    "classes-modal-open"
                );
            }

        },
        250
    );
}


/* ============================================================
   KEYBOARD EVENTS
   ============================================================ */

function classesSetupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                const visibleModals =
                    classesQueryAll(
                        ".classes-modal-overlay.visible"
                    );

                const last =
                    visibleModals[
                        visibleModals.length - 1
                    ];

                if (last) {

                    classesCloseModal(
                        last.id
                    );
                }
            }

            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "k"
            ) {

                const search =
                    classesGetElement(
                        "classes-search"
                    );

                if (search) {

                    event.preventDefault();

                    search.focus();
                }
            }
        }
    );
}


/* ============================================================
   CREATE REQUIRED CONTAINER
   ============================================================ */

function classesEnsureContainer() {

    let page =
        classesGetElement(
            "classes-page"
        );

    if (!page) {

        page =
            document.createElement(
                "section"
            );

        page.id =
            "classes-page";

        page.className =
            "classes-page";

        page.innerHTML = `

            <div id="classes-container"
                 class="classes-container">
            </div>
        `;

        const main =
            classesGetElement(
                "app-main"
            ) ||
            classesGetElement(
                "main-content"
            ) ||
            document.querySelector(
                "main"
            );

        if (main) {

            main.appendChild(
                page
            );

        } else {

            document.body.appendChild(
                page
            );
        }

    } else if (
        !classesGetElement(
            "classes-container"
        )
    ) {

        const container =
            document.createElement(
                "div"
            );

        container.id =
            "classes-container";

        container.className =
            "classes-container";

        page.appendChild(
            container
        );
    }
}


/* ============================================================
   INITIALIZE
   ============================================================ */

async function classesInit() {

    if (
        ClassesState.initialized
    ) {
        return;
    }

    try {

        classesEnsureContainer();

        classesCreatePageHeader();

        classesCreateClassModal();

        classesCreateSectionModal();

        classesSetupSearch();

        classesSetupKeyboard();

        await classesLoadAll();

        classesRender();

        ClassesState.initialized =
            true;

    } catch (error) {

        console.error(
            "Classes initialization error:",
            error
        );

        classesShowToast(
            "تعذر تشغيل قسم الصفوف",
            "error"
        );
    }
}


/* ============================================================
   REFRESH
   ============================================================ */

async function classesRefresh() {

    await classesLoadAll();

    classesRender();
}


/* ============================================================
   EXPORT DATA
   ============================================================ */

async function classesExportData() {

    try {

        const data =
            JSON.stringify(
                ClassesState.classes,
                null,
                4
            );

        const blob =
            new Blob(
                [data],
                {
                    type:
                        "application/json;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const anchor =
            document.createElement(
                "a"
            );

        anchor.href =
            url;

        anchor.download =
            `classes-backup-${new Date()
                .toISOString()
                .slice(0, 10)}.json`;

        document.body.appendChild(
            anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
            url
        );

        classesShowToast(
            "تم تصدير بيانات الصفوف",
            "success"
        );

    } catch (error) {

        console.error(
            "Export error:",
            error
        );

        classesShowToast(
            "تعذر تصدير البيانات",
            "error"
        );
    }
}


/* ============================================================
   IMPORT DATA
   ============================================================ */

async function classesImportData(
    file
) {

    if (!file) {
        return;
    }

    try {

        const text =
            await file.text();

        const data =
            JSON.parse(text);

        if (!Array.isArray(data)) {

            throw new Error(
                "Invalid classes data"
            );
        }

        for (
            const item of data
        ) {

            await classesSaveClass(
                classesNormalizeClass(
                    item
                )
            );
        }

        await classesRefresh();

        classesShowToast(
            "تم استيراد بيانات الصفوف",
            "success"
        );

    } catch (error) {

        console.error(
            "Import error:",
            error
        );

        classesShowToast(
            "ملف البيانات غير صالح",
            "error"
        );
    }
}


/* ============================================================
   PUBLIC API
   ============================================================ */

window.ClassesModule = {

    init:
        classesInit,

    refresh:
        classesRefresh,

    getAll:
        () =>
            [...ClassesState.classes],

    getById:
        id =>
            ClassesState.classes.find(
                item =>
                    item.id === id
            ) || null,

    getSection:
        (
            classId,
            sectionId
        ) => {

            const classItem =
                ClassesState.classes.find(
                    item =>
                        item.id === classId
                );

            if (!classItem) {
                return null;
            }

            return (
                classItem.sections.find(
                    item =>
                        item.id === sectionId
                ) || null
            );
        },

    addClass:
        async data => {

            const saved =
                await classesSaveClass(
                    classesNormalizeClass(
                        data
                    )
                );

            ClassesState.classes.push(
                saved
            );

            classesApplySearch();
            classesRender();

            return saved;
        },

    addSection:
        async (
            classId,
            data
        ) =>
            classesSaveSection(
                classId,
                data
            ),

    deleteClass:
        classesDeleteClass,

    deleteSection:
        classesDeleteSection,

    export:
        classesExportData,

    import:
        classesImportData,

    state:
        ClassesState
};


/* ============================================================
   AUTO START
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        classesInit,
        {
            once: true
        }
    );

} else {

    classesInit();
}


/* ============================================================
   OPTIONAL GLOBAL FUNCTIONS
   ============================================================ */

window.classesInit =
    classesInit;

window.classesRefresh =
    classesRefresh;

window.classesOpenAddClassModal =
    classesOpenAddClassModal;

window.classesEditClass =
    classesEditClass;

window.classesDeleteClass =
    classesDeleteClass;

window.classesOpenAddSectionModal =
    classesOpenAddSectionModal;

window.classesEditSection =
    classesEditSection;

window.classesDeleteSection =
    classesDeleteSection;

window.classesOpenClassDetails =
    classesOpenClassDetails;

window.classesOpenSectionStudents =
    classesOpenSectionStudents;

window.classesAddStudentToSection =
    classesAddStudentToSection;

window.classesOpenStudent =
    classesOpenStudent;

window.classesShowToast =
    classesShowToast;

window.classesCloseModal =
    classesCloseModal;


/* ============================================================
   END OF FILE 13 — classes.js
   ============================================================ */