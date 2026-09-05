/* ============================================================
   FILE 15: grades.js
   نظام إدارة الدرجات - Teacher Desktop System
   ============================================================ */

(() => {
    "use strict";

    /* ============================================================
       إعدادات عامة
       ============================================================ */

    const DB_NAME = "TeacherDesktopDB";
    const DB_VERSION = 1;

    const STORE_GRADES = "grades";
    const STORE_STUDENTS = "students";
    const STORE_CLASSES = "classes";
    const STORE_SETTINGS = "settings";

    let db = null;

    /* ============================================================
       فتح IndexedDB
       ============================================================ */

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                if (!database.objectStoreNames.contains(STORE_GRADES)) {
                    const gradesStore = database.createObjectStore(
                        STORE_GRADES,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );

                    gradesStore.createIndex(
                        "studentId",
                        "studentId",
                        { unique: false }
                    );

                    gradesStore.createIndex(
                        "classId",
                        "classId",
                        { unique: false }
                    );

                    gradesStore.createIndex(
                        "type",
                        "type",
                        { unique: false }
                    );

                    gradesStore.createIndex(
                        "date",
                        "date",
                        { unique: false }
                    );
                }

                if (!database.objectStoreNames.contains(STORE_STUDENTS)) {
                    database.createObjectStore(
                        STORE_STUDENTS,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );
                }

                if (!database.objectStoreNames.contains(STORE_CLASSES)) {
                    database.createObjectStore(
                        STORE_CLASSES,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );
                }

                if (!database.objectStoreNames.contains(STORE_SETTINGS)) {
                    database.createObjectStore(
                        STORE_SETTINGS,
                        {
                            keyPath: "key"
                        }
                    );
                }
            };
        });
    }

    /* ============================================================
       أدوات مساعدة
       ============================================================ */

    function generateId(prefix = "GR") {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random().toString(36).substring(2, 9)
        ).toUpperCase();
    }

    function nowISO() {
        return new Date().toISOString();
    }

    function safeNumber(value, fallback = 0) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return fallback;
        }

        return number;
    }

    function clamp(value, min, max) {
        return Math.min(
            Math.max(value, min),
            max
        );
    }

    function roundNumber(value, digits = 2) {
        const multiplier = Math.pow(10, digits);

        return Math.round(
            (safeNumber(value) + Number.EPSILON) *
            multiplier
        ) / multiplier;
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function notify(message, type = "info") {
        if (typeof window.showToast === "function") {
            window.showToast(message, type);
            return;
        }

        if (typeof window.showNotification === "function") {
            window.showNotification(message, type);
            return;
        }

        console.log(`[${type}] ${message}`);
    }

    /* ============================================================
       عمليات IndexedDB
       ============================================================ */

    async function addRecord(storeName, data) {
        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readwrite"
            );

            const store = transaction.objectStore(storeName);

            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function putRecord(storeName, data) {
        const database = await openDatabase();

        return new Promise((resolve, reject) => {
            const transaction = database.transaction(
                storeName,
                "readwrite"
            );

            const store = transaction.objectStore(storeName);

            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async function getRecord(storeName, id) {
        const database = await openDatabase();

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

    async function getAllRecords(storeName) {
        const database = await openDatabase();

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

    async function deleteRecord(storeName, id) {
        const database = await openDatabase();

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

    /* ============================================================
       أنواع الدرجات
       ============================================================ */

    const GRADE_TYPES = {
        daily: {
            label: "اليومي",
            icon: "📝",
            max: 10
        },

        oral: {
            label: "الشفهي",
            icon: "🎤",
            max: 10
        },

        homework: {
            label: "الواجب",
            icon: "📚",
            max: 10
        },

        month1: {
            label: "الشهر الأول",
            icon: "1️⃣",
            max: 100
        },

        month2: {
            label: "الشهر الثاني",
            icon: "2️⃣",
            max: 100
        },

        midyear: {
            label: "النصف السنوي",
            icon: "📊",
            max: 100
        },

        exemption: {
            label: "الإعفاء",
            icon: "⭐",
            max: 100
        },

        final: {
            label: "آخر السنة",
            icon: "🏆",
            max: 100
        },

        custom: {
            label: "درجة مخصصة",
            icon: "✏️",
            max: 100
        }
    };

    /* ============================================================
       إنشاء سجل درجة
       ============================================================ */

    function createGradeObject({
        studentId,
        classId,
        type,
        name,
        value,
        maxValue,
        note = "",
        column = "",
        row = "",
        date = null
    }) {
        const max = safeNumber(
            maxValue,
            GRADE_TYPES[type]?.max || 100
        );

        const numericValue = clamp(
            safeNumber(value),
            0,
            max
        );

        return {
            id: generateId("GR"),

            studentId:
                studentId ?? null,

            classId:
                classId ?? null,

            type:
                type || "custom",

            name:
                name ||
                GRADE_TYPES[type]?.label ||
                "درجة",

            value:
                roundNumber(numericValue),

            maxValue:
                roundNumber(max),

            note:
                note || "",

            column:
                column || "",

            row:
                row || "",

            date:
                date || nowISO(),

            createdAt:
                nowISO(),

            updatedAt:
                nowISO()
        };
    }

    /* ============================================================
       إضافة درجة
       ============================================================ */

    async function addGrade(options) {
        try {
            const grade = createGradeObject(options);

            await addRecord(
                STORE_GRADES,
                grade
            );

            notify(
                "تمت إضافة الدرجة بنجاح",
                "success"
            );

            await refreshGrades();

            return grade;

        } catch (error) {
            console.error(
                "addGrade error:",
                error
            );

            notify(
                "حدث خطأ أثناء إضافة الدرجة",
                "error"
            );

            return null;
        }
    }

    /* ============================================================
       تعديل درجة
       ============================================================ */

    async function updateGrade(id, changes) {
        try {
            const existing = await getRecord(
                STORE_GRADES,
                id
            );

            if (!existing) {
                notify(
                    "الدرجة غير موجودة",
                    "error"
                );

                return null;
            }

            const updated = {
                ...existing,
                ...changes,

                value:
                    changes.value !== undefined
                        ? roundNumber(
                            clamp(
                                safeNumber(changes.value),
                                0,
                                safeNumber(
                                    changes.maxValue ??
                                    existing.maxValue,
                                    100
                                )
                            )
                        )
                        : existing.value,

                maxValue:
                    changes.maxValue !== undefined
                        ? roundNumber(
                            safeNumber(
                                changes.maxValue,
                                existing.maxValue
                            )
                        )
                        : existing.maxValue,

                updatedAt:
                    nowISO()
            };

            await putRecord(
                STORE_GRADES,
                updated
            );

            notify(
                "تم تعديل الدرجة",
                "success"
            );

            await refreshGrades();

            return updated;

        } catch (error) {
            console.error(
                "updateGrade error:",
                error
            );

            notify(
                "تعذر تعديل الدرجة",
                "error"
            );

            return null;
        }
    }

    /* ============================================================
       حذف درجة
       ============================================================ */

    async function removeGrade(id) {
        try {
            await deleteRecord(
                STORE_GRADES,
                id
            );

            notify(
                "تم حذف الدرجة",
                "success"
            );

            await refreshGrades();

            return true;

        } catch (error) {
            console.error(
                "removeGrade error:",
                error
            );

            notify(
                "تعذر حذف الدرجة",
                "error"
            );

            return false;
        }
    }

    /* ============================================================
       الحصول على درجات طالب
       ============================================================ */

    async function getStudentGrades(studentId) {
        const grades =
            await getAllRecords(
                STORE_GRADES
            );

        return grades.filter(
            grade =>
                String(grade.studentId) ===
                String(studentId)
        );
    }

    /* ============================================================
       الحصول على درجات صف
       ============================================================ */

    async function getClassGrades(classId) {
        const grades =
            await getAllRecords(
                STORE_GRADES
            );

        return grades.filter(
            grade =>
                String(grade.classId) ===
                String(classId)
        );
    }

    /* ============================================================
       الحصول على درجة حسب النوع
       ============================================================ */

    async function getStudentGradeByType(
        studentId,
        type
    ) {
        const grades =
            await getStudentGrades(
                studentId
            );

        return grades.filter(
            grade =>
                grade.type === type
        );
    }

    /* ============================================================
       حساب النسبة المئوية
       ============================================================ */

    function calculatePercentage(
        value,
        maxValue
    ) {
        const valueNumber =
            safeNumber(value);

        const maxNumber =
            safeNumber(maxValue);

        if (maxNumber <= 0) {
            return 0;
        }

        return roundNumber(
            (
                valueNumber /
                maxNumber
            ) * 100,
            2
        );
    }

    /* ============================================================
       حساب مجموع درجات الطالب
       ============================================================ */

    function calculateTotal(grades) {
        if (!Array.isArray(grades)) {
            return 0;
        }

        return roundNumber(
            grades.reduce(
                (
                    total,
                    grade
                ) =>
                    total +
                    safeNumber(
                        grade.value
                    ),
                0
            ),
            2
        );
    }

    /* ============================================================
       مجموع الدرجات العظمى
       ============================================================ */

    function calculateMaxTotal(grades) {
        if (!Array.isArray(grades)) {
            return 0;
        }

        return roundNumber(
            grades.reduce(
                (
                    total,
                    grade
                ) =>
                    total +
                    safeNumber(
                        grade.maxValue
                    ),
                0
            ),
            2
        );
    }

    /* ============================================================
       معدل الطالب
       ============================================================ */

    function calculateAverage(grades) {
        if (
            !Array.isArray(grades) ||
            grades.length === 0
        ) {
            return 0;
        }

        let obtained = 0;
        let maximum = 0;

        grades.forEach(
            grade => {
                obtained +=
                    safeNumber(
                        grade.value
                    );

                maximum +=
                    safeNumber(
                        grade.maxValue
                    );
            }
        );

        if (maximum <= 0) {
            return 0;
        }

        return roundNumber(
            (
                obtained /
                maximum
            ) * 100,
            2
        );
    }

    /* ============================================================
       حساب متوسط نوع معين
       ============================================================ */

    function calculateTypeAverage(
        grades,
        type
    ) {
        const filtered =
            grades.filter(
                grade =>
                    grade.type === type
            );

        return calculateAverage(
            filtered
        );
    }

    /* ============================================================
       حساب الإعفاء
       ============================================================ */

    function calculateExemption(
        grades,
        minimum = 85
    ) {
        const average =
            calculateAverage(
                grades
            );

        return {
            average,
            eligible:
                average >= minimum
        };
    }

    /* ============================================================
       تحويل أسماء الأعمدة
       ============================================================ */

    function columnToNumber(column) {
        if (
            typeof column !== "string" ||
            !column.trim()
        ) {
            return null;
        }

        let result = 0;

        const text =
            column
                .trim()
                .toUpperCase();

        for (
            let i = 0;
            i < text.length;
            i++
        ) {
            const code =
                text.charCodeAt(i) -
                64;

            if (
                code < 1 ||
                code > 26
            ) {
                return null;
            }

            result =
                result * 26 +
                code;
        }

        return result;
    }

    function numberToColumn(number) {
        let result = "";

        let n =
            Math.floor(
                safeNumber(
                    number
                )
            );

        if (n <= 0) {
            return "";
        }

        while (n > 0) {
            const remainder =
                (n - 1) % 26;

            result =
                String.fromCharCode(
                    65 + remainder
                ) +
                result;

            n =
                Math.floor(
                    (n - 1) / 26
                );
        }

        return result;
    }

    /* ============================================================
       استخراج رموز الدرجات
       مثال:
       B1 + C2 + D2 / 2
       ============================================================ */

    function buildGradeMap(grades) {
        const map = {};

        grades.forEach(
            grade => {
                if (
                    grade.column &&
                    grade.row
                ) {
                    const key =
                        `${String(
                            grade.column
                        ).toUpperCase()}${grade.row}`;

                    map[key] =
                        safeNumber(
                            grade.value
                        );
                }
            }
        );

        return map;
    }

    /* ============================================================
       محلل المعادلات
       ============================================================ */

    function normalizeFormula(
        formula
    ) {
        if (
            typeof formula !== "string"
        ) {
            return "";
        }

        let normalized =
            formula
                .trim()
                .toUpperCase();

        normalized =
            normalized.replace(
                /×/g,
                "*"
            );

        normalized =
            normalized.replace(
                /÷/g,
                "/"
            );

        normalized =
            normalized.replace(
                /,/g,
                "."
            );

        normalized =
            normalized.replace(
                /\s+/g,
                ""
            );

        return normalized;
    }

    /* ============================================================
       أمان المعادلات
       ============================================================ */

    function isFormulaSafe(
        formula
    ) {
        if (
            !formula ||
            typeof formula !== "string"
        ) {
            return false;
        }

        const normalized =
            normalizeFormula(
                formula
            );

        return /^[A-Z]+[0-9]+(?:[+\-*/().]|[0-9]+)*$/
            .test(
                normalized
            );
    }

    /* ============================================================
       استبدال مراجع الدرجات
       ============================================================ */

    function replaceGradeReferences(
        formula,
        gradeMap
    ) {
        return formula.replace(
            /([A-Z]+)([0-9]+)/g,
            (
                full,
                column,
                row
            ) => {
                const key =
                    `${column}${row}`;

                if (
                    Object.prototype.hasOwnProperty.call(
                        gradeMap,
                        key
                    )
                ) {
                    return String(
                        gradeMap[key]
                    );
                }

                return "0";
            }
        );
    }

    /* ============================================================
       تقييم المعادلة
       ============================================================ */

    function evaluateFormula(
        formula,
        grades
    ) {
        const normalized =
            normalizeFormula(
                formula
            );

        if (!normalized) {
            return 0;
        }

        if (
            !isFormulaSafe(
                normalized
            )
        ) {
            throw new Error(
                "المعادلة غير صالحة"
            );
        }

        const gradeMap =
            buildGradeMap(
                grades
            );

        const expression =
            replaceGradeReferences(
                normalized,
                gradeMap
            );

        if (
            !/^[0-9+\-*/().]+$/.test(
                expression
            )
        ) {
            throw new Error(
                "المعادلة تحتوي على رموز غير مسموحة"
            );
        }

        try {
            const result =
                Function(
                    `"use strict"; return (${expression});`
                )();

            if (
                !Number.isFinite(
                    result
                )
            ) {
                return 0;
            }

            return roundNumber(
                result,
                4
            );

        } catch (error) {
            console.error(
                "Formula evaluation error:",
                error
            );

            throw new Error(
                "تعذر حساب المعادلة"
            );
        }
    }

    /* ============================================================
       تطبيق معادلة على طالب
       ============================================================ */

    async function calculateStudentFormula(
        studentId,
        formula
    ) {
        const grades =
            await getStudentGrades(
                studentId
            );

        return evaluateFormula(
            formula,
            grades
        );
    }

    /* ============================================================
       حساب المعادلة لكل طلاب الصف
       ============================================================ */

    async function calculateClassFormula(
        classId,
        formula
    ) {
        const students =
            await getAllRecords(
                STORE_STUDENTS
            );

        const classStudents =
            students.filter(
                student =>
                    String(
                        student.classId
                    ) ===
                    String(classId)
            );

        const results = [];

        for (
            const student of classStudents
        ) {
            const grades =
                await getStudentGrades(
                    student.id
                );

            let result = 0;

            try {
                result =
                    evaluateFormula(
                        formula,
                        grades
                    );
            } catch {
                result = 0;
            }

            results.push({
                studentId:
                    student.id,

                studentName:
                    student.fullName ||
                    student.name ||
                    "بدون اسم",

                result
            });
        }

        return results;
    }

    /* ============================================================
       إنشاء عمود درجة جديد
       ============================================================ */

    async function createGradeColumn({
        classId,
        type = "custom",
        name = "درجة جديدة",
        maxValue = 100,
        column = "",
        row = ""
    }) {
        const settings = {
            id:
                generateId(
                    "COL"
                ),

            classId,

            type,

            name,

            maxValue:
                safeNumber(
                    maxValue,
                    100
                ),

            column:
                String(
                    column || ""
                ).toUpperCase(),

            row:
                String(
                    row || ""
                ),

            createdAt:
                nowISO()
        };

        await putRecord(
            STORE_SETTINGS,
            {
                key:
                    `gradeColumn_${settings.id}`,

                value:
                    settings
            }
        );

        return settings;
    }

    /* ============================================================
       جلب أعمدة الصف
       ============================================================ */

    async function getGradeColumns(
        classId
    ) {
        const database =
            await openDatabase();

        return new Promise(
            (resolve, reject) => {
                const transaction =
                    database.transaction(
                        STORE_SETTINGS,
                        "readonly"
                    );

                const store =
                    transaction.objectStore(
                        STORE_SETTINGS
                    );

                const request =
                    store.getAll();

                request.onsuccess =
                    () => {
                        const rows =
                            request.result
                                .filter(
                                    item =>
                                        item.key.startsWith(
                                            "gradeColumn_"
                                        )
                                )
                                .map(
                                    item =>
                                        item.value
                                )
                                .filter(
                                    column =>
                                        String(
                                            column.classId
                                        ) ===
                                        String(
                                            classId
                                        )
                                );

                        resolve(rows);
                    };

                request.onerror =
                    () => {
                        reject(
                            request.error
                        );
                    };
            }
        );
    }

    /* ============================================================
       حفظ معادلة الصف
       ============================================================ */

    async function saveClassFormula(
        classId,
        formula,
        name = "المعدل"
    ) {
        const key =
            `classFormula_${classId}`;

        const value = {
            classId,

            name,

            formula:
                normalizeFormula(
                    formula
                ),

            updatedAt:
                nowISO()
        };

        await putRecord(
            STORE_SETTINGS,
            {
                key,
                value
            }
        );

        notify(
            "تم حفظ معادلة الصف",
            "success"
        );

        return value;
    }

    /* ============================================================
       جلب معادلة الصف
       ============================================================ */

    async function getClassFormula(
        classId
    ) {
        const record =
            await getRecord(
                STORE_SETTINGS,
                `classFormula_${classId}`
            );

        return record
            ? record.value
            : null;
    }

    /* ============================================================
       حساب النقص
       ============================================================ */

    function calculateMissing(
        value,
        maxValue
    ) {
        const current =
            safeNumber(value);

        const max =
            safeNumber(maxValue);

        if (current >= max) {
            return 0;
        }

        return roundNumber(
            max - current,
            2
        );
    }

    /* ============================================================
       حالة الدرجة
       ============================================================ */

    function getGradeStatus(
        value,
        maxValue
    ) {
        const percentage =
            calculatePercentage(
                value,
                maxValue
            );

        if (percentage >= 90) {
            return {
                key: "excellent",
                label: "ممتاز",
                icon: "🟢"
            };
        }

        if (percentage >= 80) {
            return {
                key: "very-good",
                label: "جيد جداً",
                icon: "🔵"
            };
        }

        if (percentage >= 70) {
            return {
                key: "good",
                label: "جيد",
                icon: "🟡"
            };
        }

        if (percentage >= 50) {
            return {
                key: "pass",
                label: "ناجح",
                icon: "🟠"
            };
        }

        return {
            key: "fail",
            label: "يحتاج متابعة",
            icon: "🔴"
        };
    }

    /* ============================================================
       إحصائيات الدرجات
       ============================================================ */

    function calculateGradeStatistics(
        grades
    ) {
        if (
            !Array.isArray(grades) ||
            grades.length === 0
        ) {
            return {
                count: 0,
                total: 0,
                maxTotal: 0,
                average: 0,
                highest: 0,
                lowest: 0,
                passed: 0,
                failed: 0
            };
        }

        const values =
            grades.map(
                grade =>
                    calculatePercentage(
                        grade.value,
                        grade.maxValue
                    )
            );

        const passed =
            values.filter(
                value =>
                    value >= 50
            ).length;

        return {
            count:
                grades.length,

            total:
                calculateTotal(
                    grades
                ),

            maxTotal:
                calculateMaxTotal(
                    grades
                ),

            average:
                roundNumber(
                    values.reduce(
                        (
                            a,
                            b
                        ) =>
                            a + b,
                        0
                    ) /
                    values.length,
                    2
                ),

            highest:
                roundNumber(
                    Math.max(
                        ...values
                    ),
                    2
                ),

            lowest:
                roundNumber(
                    Math.min(
                        ...values
                    ),
                    2
                ),

            passed,

            failed:
                values.length -
                passed
        };
    }

    /* ============================================================
       HTML بطاقة درجة
       ============================================================ */

    function gradeCardHTML(
        grade
    ) {
        const type =
            GRADE_TYPES[
                grade.type
            ] ||
            GRADE_TYPES.custom;

        const percentage =
            calculatePercentage(
                grade.value,
                grade.maxValue
            );

        const status =
            getGradeStatus(
                grade.value,
                grade.maxValue
            );

        return `
            <div
                class="grade-card glass-card"
                data-grade-id="${escapeHTML(
                    grade.id
                )}"
            >

                <div class="grade-card-icon">
                    ${type.icon}
                </div>

                <div class="grade-card-content">

                    <div class="grade-card-title">
                        ${escapeHTML(
                            grade.name ||
                            type.label
                        )}
                    </div>

                    <div class="grade-card-value">
                        ${escapeHTML(
                            grade.value
                        )}
                        /
                        ${escapeHTML(
                            grade.maxValue
                        )}
                    </div>

                    <div class="grade-card-percent">
                        ${percentage}%
                    </div>

                    <div class="grade-card-status">
                        ${status.icon}
                        ${status.label}
                    </div>

                    ${
                        grade.note
                            ? `
                                <div class="grade-card-note">
                                    ${escapeHTML(
                                        grade.note
                                    )}
                                </div>
                              `
                            : ""
                    }

                </div>

                <div class="grade-card-actions">

                    <button
                        type="button"
                        class="grade-edit-btn"
                        data-grade-edit="${escapeHTML(
                            grade.id
                        )}"
                        title="تعديل"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="grade-delete-btn"
                        data-grade-delete="${escapeHTML(
                            grade.id
                        )}"
                        title="حذف"
                    >
                        🗑️
                    </button>

                </div>

            </div>
        `;
    }

    /* ============================================================
       جدول درجات الطالب
       ============================================================ */

    function studentGradeTableHTML(
        grades
    ) {
        if (
            !grades ||
            grades.length === 0
        ) {
            return `
                <div class="grades-empty">
                    لا توجد درجات لهذا الطالب حالياً
                </div>
            `;
        }

        return `
            <div class="grades-table-wrapper">

                <table class="grades-table">

                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الدرجة</th>
                            <th>القيمة</th>
                            <th>النسبة</th>
                            <th>الحالة</th>
                            <th>التاريخ</th>
                            <th>الإجراء</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${grades
                            .map(
                                (
                                    grade,
                                    index
                                ) => {
                                    const percentage =
                                        calculatePercentage(
                                            grade.value,
                                            grade.maxValue
                                        );

                                    const status =
                                        getGradeStatus(
                                            grade.value,
                                            grade.maxValue
                                        );

                                    return `
                                        <tr
                                            data-grade-row="${escapeHTML(
                                                grade.id
                                            )}"
                                        >

                                            <td>
                                                ${
                                                    index +
                                                    1
                                                }
                                            </td>

                                            <td>
                                                ${
                                                    GRADE_TYPES[
                                                        grade.type
                                                    ]?.icon ||
                                                    "📝"
                                                }
                                                ${escapeHTML(
                                                    grade.name
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    ${escapeHTML(
                                                        grade.value
                                                    )}
                                                </strong>
                                                /
                                                ${escapeHTML(
                                                    grade.maxValue
                                                )}
                                            </td>

                                            <td>
                                                ${percentage}%
                                            </td>

                                            <td>
                                                ${status.icon}
                                                ${status.label}
                                            </td>

                                            <td>
                                                ${formatDate(
                                                    grade.date
                                                )}
                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    class="grade-edit-btn"
                                                    data-grade-edit="${escapeHTML(
                                                        grade.id
                                                    )}"
                                                >
                                                    ✏️
                                                </button>

                                                <button
                                                    type="button"
                                                    class="grade-delete-btn"
                                                    data-grade-delete="${escapeHTML(
                                                        grade.id
                                                    )}"
                                                >
                                                    🗑️
                                                </button>

                                            </td>

                                        </tr>
                                    `;
                                }
                            )
                            .join("")}

                    </tbody>

                </table>

            </div>
        `;
    }

    /* ============================================================
       تنسيق التاريخ
       ============================================================ */

    function formatDate(
        value
    ) {
        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return String(value);
        }

        return date.toLocaleDateString(
            "ar-IQ",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );
    }

    /* ============================================================
       لوحة إحصائيات
       ============================================================ */

    function statisticsHTML(
        grades
    ) {
        const stats =
            calculateGradeStatistics(
                grades
            );

        return `
            <div class="grades-statistics">

                <div class="stat-card glass-card">
                    <span class="stat-icon">
                        📚
                    </span>

                    <span class="stat-label">
                        عدد الدرجات
                    </span>

                    <strong class="stat-value">
                        ${stats.count}
                    </strong>
                </div>

                <div class="stat-card glass-card">
                    <span class="stat-icon">
                        ➕
                    </span>

                    <span class="stat-label">
                        المجموع
                    </span>

                    <strong class="stat-value">
                        ${stats.total}
                    </strong>
                </div>

                <div class="stat-card glass-card">
                    <span class="stat-icon">
                        📊
                    </span>

                    <span class="stat-label">
                        المعدل
                    </span>

                    <strong class="stat-value">
                        ${stats.average}%
                    </strong>
                </div>

                <div class="stat-card glass-card">
                    <span class="stat-icon">
                        🟢
                    </span>

                    <span class="stat-label">
                        الناجحون
                    </span>

                    <strong class="stat-value">
                        ${stats.passed}
                    </strong>
                </div>

                <div class="stat-card glass-card">
                    <span class="stat-icon">
                        🔴
                    </span>

                    <span class="stat-label">
                        يحتاج متابعة
                    </span>

                    <strong class="stat-value">
                        ${stats.failed}
                    </strong>
                </div>

            </div>
        `;
    }

    /* ============================================================
       نافذة إضافة درجة
       ============================================================ */

    function createGradeModal() {
        const oldModal =
            document.getElementById(
                "gradeModal"
            );

        if (oldModal) {
            oldModal.remove();
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "gradeModal";

        modal.className =
            "grade-modal-overlay";

        modal.innerHTML = `
            <div class="grade-modal glass-panel">

                <div class="grade-modal-header">

                    <div>
                        <span class="grade-modal-icon">
                            📝
                        </span>

                        <h3>
                            إضافة درجة
                        </h3>
                    </div>

                    <button
                        type="button"
                        id="closeGradeModal"
                        class="modal-close"
                    >
                        ✕
                    </button>

                </div>

                <form
                    id="gradeForm"
                    class="grade-form"
                >

                    <input
                        type="hidden"
                        id="gradeId"
                    >

                    <div class="form-group">

                        <label>
                            الطالب
                        </label>

                        <select
                            id="gradeStudent"
                            required
                        >
                            <option value="">
                                اختر الطالب
                            </option>
                        </select>

                    </div>

                    <div class="form-group">

                        <label>
                            نوع الدرجة
                        </label>

                        <select
                            id="gradeType"
                            required
                        >

                            ${Object.entries(
                                GRADE_TYPES
                            )
                                .map(
                                    (
                                        [
                                            key,
                                            item
                                        ]
                                    ) => `
                                        <option value="${key}">
                                            ${item.icon}
                                            ${item.label}
                                        </option>
                                    `
                                )
                                .join("")}

                        </select>

                    </div>

                    <div class="form-group">

                        <label>
                            اسم الدرجة
                        </label>

                        <input
                            type="text"
                            id="gradeName"
                            placeholder="مثلاً: امتحان الفصل الأول"
                            autocomplete="off"
                        >

                    </div>

                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                الدرجة
                            </label>

                            <input
                                type="number"
                                id="gradeValue"
                                min="0"
                                step="0.01"
                                required
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                الدرجة القصوى
                            </label>

                            <input
                                type="number"
                                id="gradeMaxValue"
                                min="1"
                                step="0.01"
                                value="100"
                                required
                            >

                        </div>

                    </div>

                    <div class="form-row">

                        <div class="form-group">

                            <label>
                                رمز العمود
                            </label>

                            <input
                                type="text"
                                id="gradeColumn"
                                placeholder="B"
                                maxlength="3"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                رقم الصف
                            </label>

                            <input
                                type="number"
                                id="gradeRow"
                                placeholder="1"
                                min="1"
                            >

                        </div>

                    </div>

                    <div class="form-group">

                        <label>
                            ملاحظة
                        </label>

                        <textarea
                            id="gradeNote"
                            rows="3"
                            placeholder="أضف ملاحظة عن الدرجة..."
                        ></textarea>

                    </div>

                    <div class="grade-form-actions">

                        <button
                            type="button"
                            id="cancelGrade"
                            class="btn-secondary"
                        >
                            إلغاء
                        </button>

                        <button
                            type="submit"
                            class="btn-primary"
                        >
                            💾 حفظ الدرجة
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        bindGradeModalEvents();
    }

    /* ============================================================
       فتح نافذة الإضافة
       ============================================================ */

    async function openGradeModal(
        studentId = null
    ) {
        createGradeModal();

        await loadStudentsIntoGradeSelect();

        const modal =
            document.getElementById(
                "gradeModal"
            );

        if (modal) {
            modal.classList.add(
                "active"
            );
        }

        if (studentId) {
            const select =
                document.getElementById(
                    "gradeStudent"
                );

            if (select) {
                select.value =
                    String(
                        studentId
                    );
            }
        }
    }

    /* ============================================================
       تحميل الطلاب داخل select
       ============================================================ */

    async function loadStudentsIntoGradeSelect() {
        const select =
            document.getElementById(
                "gradeStudent"
            );

        if (!select) {
            return;
        }

        try {
            const students =
                await getAllRecords(
                    STORE_STUDENTS
                );

            students.sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.fullName ||
                        a.name ||
                        ""
                    ).localeCompare(
                        String(
                            b.fullName ||
                            b.name ||
                            ""
                        ),
                        "ar"
                    )
            );

            select.innerHTML = `
                <option value="">
                    اختر الطالب
                </option>
            `;

            students.forEach(
                student => {
                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        student.id;

                    option.textContent =
                        student.fullName ||
                        student.name ||
                        "طالب بدون اسم";

                    select.appendChild(
                        option
                    );
                }
            );

        } catch (error) {
            console.error(
                error
            );
        }
    }

    /* ============================================================
       ربط أحداث النافذة
       ============================================================ */

    function bindGradeModalEvents() {
        const close =
            document.getElementById(
                "closeGradeModal"
            );

        const cancel =
            document.getElementById(
                "cancelGrade"
            );

        const form =
            document.getElementById(
                "gradeForm"
            );

        if (close) {
            close.onclick =
                closeGradeModal;
        }

        if (cancel) {
            cancel.onclick =
                closeGradeModal;
        }

        if (form) {
            form.addEventListener(
                "submit",
                handleGradeFormSubmit
            );
        }

        const typeSelect =
            document.getElementById(
                "gradeType"
            );

        if (typeSelect) {
            typeSelect.addEventListener(
                "change",
                () => {
                    const type =
                        GRADE_TYPES[
                            typeSelect.value
                        ];

                    if (!type) {
                        return;
                    }

                    const max =
                        document.getElementById(
                            "gradeMaxValue"
                        );

                    if (max) {
                        max.value =
                            type.max;
                    }
                }
            );
        }
    }

    /* ============================================================
       إغلاق النافذة
       ============================================================ */

    function closeGradeModal() {
        const modal =
            document.getElementById(
                "gradeModal"
            );

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "active"
        );

        setTimeout(
            () => {
                modal.remove();
            },
            250
        );
    }

    /* ============================================================
       حفظ نموذج الدرجة
       ============================================================ */

    async function handleGradeFormSubmit(
        event
    ) {
        event.preventDefault();

        const id =
            document.getElementById(
                "gradeId"
            )?.value;

        const studentId =
            document.getElementById(
                "gradeStudent"
            )?.value;

        const type =
            document.getElementById(
                "gradeType"
            )?.value;

        const name =
            document.getElementById(
                "gradeName"
            )?.value;

        const value =
            document.getElementById(
                "gradeValue"
            )?.value;

        const maxValue =
            document.getElementById(
                "gradeMaxValue"
            )?.value;

        const column =
            document.getElementById(
                "gradeColumn"
            )?.value;

        const row =
            document.getElementById(
                "gradeRow"
            )?.value;

        const note =
            document.getElementById(
                "gradeNote"
            )?.value;

        if (!studentId) {
            notify(
                "اختر الطالب أولاً",
                "warning"
            );

            return;
        }

        if (!type) {
            notify(
                "اختر نوع الدرجة",
                "warning"
            );

            return;
        }

        if (
            safeNumber(
                maxValue
            ) <= 0
        ) {
            notify(
                "الدرجة القصوى غير صحيحة",
                "warning"
            );

            return;
        }

        if (
            safeNumber(
                value
            ) < 0 ||
            safeNumber(
                value
            ) >
                safeNumber(
                    maxValue
                )
        ) {
            notify(
                "قيمة الدرجة يجب أن تكون بين 0 والدرجة القصوى",
                "warning"
            );

            return;
        }

        if (id) {
            await updateGrade(
                id,
                {
                    studentId,
                    type,
                    name:
                        name ||
                        GRADE_TYPES[
                            type
                        ]?.label ||
                        "درجة",

                    value:
                        safeNumber(
                            value
                        ),

                    maxValue:
                        safeNumber(
                            maxValue
                        ),

                    column:
                        String(
                            column || ""
                        ).toUpperCase(),

                    row:
                        String(
                            row || ""
                        ),

                    note
                }
            );
        } else {
            await addGrade({
                studentId,
                type,

                name:
                    name ||
                    GRADE_TYPES[
                        type
                    ]?.label ||
                    "درجة",

                value:
                    safeNumber(
                        value
                    ),

                maxValue:
                    safeNumber(
                        maxValue
                    ),

                column:
                    String(
                        column || ""
                    ).toUpperCase(),

                row:
                    String(
                        row || ""
                    ),

                note
            });
        }

        closeGradeModal();
    }

    /* ============================================================
       تعديل درجة من الواجهة
       ============================================================ */

    async function editGrade(id) {
        const grade =
            await getRecord(
                STORE_GRADES,
                id
            );

        if (!grade) {
            notify(
                "الدرجة غير موجودة",
                "error"
            );

            return;
        }

        await openGradeModal(
            grade.studentId
        );

        const idInput =
            document.getElementById(
                "gradeId"
            );

        const typeInput =
            document.getElementById(
                "gradeType"
            );

        const nameInput =
            document.getElementById(
                "gradeName"
            );

        const valueInput =
            document.getElementById(
                "gradeValue"
            );

        const maxInput =
            document.getElementById(
                "gradeMaxValue"
            );

        const columnInput =
            document.getElementById(
                "gradeColumn"
            );

        const rowInput =
            document.getElementById(
                "gradeRow"
            );

        const noteInput =
            document.getElementById(
                "gradeNote"
            );

        if (idInput) {
            idInput.value =
                grade.id;
        }

        if (typeInput) {
            typeInput.value =
                grade.type;
        }

        if (nameInput) {
            nameInput.value =
                grade.name || "";
        }

        if (valueInput) {
            valueInput.value =
                grade.value;
        }

        if (maxInput) {
            maxInput.value =
                grade.maxValue;
        }

        if (columnInput) {
            columnInput.value =
                grade.column || "";
        }

        if (rowInput) {
            rowInput.value =
                grade.row || "";
        }

        if (noteInput) {
            noteInput.value =
                grade.note || "";
        }

        const submit =
            document.querySelector(
                "#gradeForm button[type='submit']"
            );

        if (submit) {
            submit.textContent =
                "💾 حفظ التعديل";
        }
    }

    /* ============================================================
       تأكيد حذف درجة
       ============================================================ */

    async function confirmDeleteGrade(
        id
    ) {
        const grade =
            await getRecord(
                STORE_GRADES,
                id
            );

        if (!grade) {
            return;
        }

        const message =
            `هل تريد حذف الدرجة "${grade.name}"؟`;

        let confirmed = false;

        if (
            typeof window.confirmAction ===
            "function"
        ) {
            confirmed =
                await window.confirmAction(
                    message
                );
        } else {
            confirmed =
                window.confirm(
                    message
                );
        }

        if (!confirmed) {
            return;
        }

        await removeGrade(
            id
        );
    }

    /* ============================================================
       ربط أزرار الدرجات
       ============================================================ */

    function bindGradeButtons(
        container = document
    ) {
        container
            .querySelectorAll(
                "[data-grade-edit]"
            )
            .forEach(
                button => {
                    button.onclick =
                        () =>
                            editGrade(
                                button.dataset
                                    .gradeEdit
                            );
                }
            );

        container
            .querySelectorAll(
                "[data-grade-delete]"
            )
            .forEach(
                button => {
                    button.onclick =
                        () =>
                            confirmDeleteGrade(
                                button.dataset
                                    .gradeDelete
                            );
                }
            );
    }

    /* ============================================================
       تحميل درجات الطالب إلى عنصر
       ============================================================ */

    async function renderStudentGrades(
        studentId,
        container
    ) {
        if (!container) {
            return;
        }

        try {
            const grades =
                await getStudentGrades(
                    studentId
                );

            container.innerHTML =
                statisticsHTML(
                    grades
                ) +
                studentGradeTableHTML(
                    grades
                );

            bindGradeButtons(
                container
            );

        } catch (error) {
            console.error(
                error
            );

            container.innerHTML = `
                <div class="grades-error">
                    تعذر تحميل الدرجات
                </div>
            `;
        }
    }

    /* ============================================================
       عرض درجات الصف
       ============================================================ */

    async function renderClassGrades(
        classId,
        container
    ) {
        if (!container) {
            return;
        }

        try {
            const grades =
                await getClassGrades(
                    classId
                );

            const students =
                await getAllRecords(
                    STORE_STUDENTS
                );

            const classStudents =
                students.filter(
                    student =>
                        String(
                            student.classId
                        ) ===
                        String(
                            classId
                        )
                );

            const grouped =
                {};

            classStudents.forEach(
                student => {
                    grouped[
                        student.id
                    ] = {
                        student,
                        grades: []
                    };
                }
            );

            grades.forEach(
                grade => {
                    if (
                        grouped[
                            grade.studentId
                        ]
                    ) {
                        grouped[
                            grade.studentId
                        ].grades.push(
                            grade
                        );
                    }
                }
            );

            const rows =
                Object.values(
                    grouped
                )
                    .map(
                        item => {
                            const average =
                                calculateAverage(
                                    item.grades
                                );

                            const exemption =
                                calculateExemption(
                                    item.grades
                                );

                            return `
                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            item.student.fullName ||
                                            item.student.name ||
                                            ""
                                        )}
                                    </td>

                                    <td>
                                        ${item.grades.length}
                                    </td>

                                    <td>
                                        ${average}%
                                    </td>

                                    <td>
                                        ${
                                            exemption.eligible
                                                ? "⭐ مؤهل"
                                                : "—"
                                        }
                                    </td>

                                    <td>

                                        <button
                                            type="button"
                                            class="view-student-grades"
                                            data-student-id="${escapeHTML(
                                                item.student.id
                                            )}"
                                        >
                                            👁️
                                        </button>

                                    </td>

                                </tr>
                            `;
                        }
                    )
                    .join("");

            container.innerHTML = `
                <div class="class-grades-wrapper">

                    <div class="class-grades-header">
                        <h3>
                            📊 درجات الصف
                        </h3>

                        <button
                            type="button"
                            id="addGradeFromClass"
                            class="btn-primary"
                        >
                            ➕ إضافة درجة
                        </button>
                    </div>

                    <div class="grades-table-wrapper">

                        <table class="grades-table">

                            <thead>
                                <tr>
                                    <th>الطالب</th>
                                    <th>عدد الدرجات</th>
                                    <th>المعدل</th>
                                    <th>الإعفاء</th>
                                    <th>التفاصيل</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${
                                    rows ||
                                    `
                                        <tr>
                                            <td colspan="5">
                                                لا توجد بيانات
                                            </td>
                                        </tr>
                                    `
                                }
                            </tbody>

                        </table>

                    </div>

                </div>
            `;

            bindGradeButtons(
                container
            );

            container
                .querySelectorAll(
                    ".view-student-grades"
                )
                .forEach(
                    button => {
                        button.onclick =
                            () => {
                                const event =
                                    new CustomEvent(
                                        "openStudentGrades",
                                        {
                                            detail: {
                                                studentId:
                                                    button.dataset
                                                        .studentId
                                            }
                                        }
                                    );

                                document.dispatchEvent(
                                    event
                                );
                            };
                    }
                );

            const addButton =
                container.querySelector(
                    "#addGradeFromClass"
                );

            if (addButton) {
                addButton.onclick =
                    () =>
                        openGradeModal();
            }

        } catch (error) {
            console.error(
                error
            );

            container.innerHTML = `
                <div class="grades-error">
                    حدث خطأ أثناء تحميل درجات الصف
                </div>
            `;
        }
    }

    /* ============================================================
       تحديث الواجهة
       ============================================================ */

    async function refreshGrades() {
        document.dispatchEvent(
            new CustomEvent(
                "gradesUpdated",
                {
                    detail: {
                        time:
                            nowISO()
                    }
                }
            )
        );

        const studentContainer =
            document.querySelector(
                "[data-grades-student]"
            );

        if (
            studentContainer
        ) {
            const studentId =
                studentContainer.dataset
                    .gradesStudent;

            if (studentId) {
                await renderStudentGrades(
                    studentId,
                    studentContainer
                );
            }
        }

        const classContainer =
            document.querySelector(
                "[data-grades-class]"
            );

        if (
            classContainer
        ) {
            const classId =
                classContainer.dataset
                    .gradesClass;

            if (classId) {
                await renderClassGrades(
                    classId,
                    classContainer
                );
            }
        }
    }

    /* ============================================================
       التصدير CSV
       ============================================================ */

    function gradesToCSV(
        grades
    ) {
        const headers = [
            "ID",
            "Student ID",
            "Class ID",
            "Type",
            "Name",
            "Value",
            "Max Value",
            "Percentage",
            "Column",
            "Row",
            "Note",
            "Date"
        ];

        const rows =
            grades.map(
                grade => [
                    grade.id,
                    grade.studentId,
                    grade.classId,
                    grade.type,
                    grade.name,
                    grade.value,
                    grade.maxValue,
                    calculatePercentage(
                        grade.value,
                        grade.maxValue
                    ),
                    grade.column,
                    grade.row,
                    grade.note,
                    grade.date
                ]
            );

        const escapeCSV =
            value => {
                const text =
                    String(
                        value ?? ""
                    );

                if (
                    /[",\n]/.test(
                        text
                    )
                ) {
                    return `"${text.replace(
                        /"/g,
                        '""'
                    )}"`;
                }

                return text;
            };

        return [
            headers,
            ...rows
        ]
            .map(
                row =>
                    row
                        .map(
                            escapeCSV
                        )
                        .join(",")
            )
            .join("\n");
    }

    /* ============================================================
       تنزيل CSV
       ============================================================ */

    async function exportGradesCSV(
        studentId = null,
        classId = null
    ) {
        let grades =
            await getAllRecords(
                STORE_GRADES
            );

        if (studentId) {
            grades =
                grades.filter(
                    grade =>
                        String(
                            grade.studentId
                        ) ===
                        String(
                            studentId
                        )
                );
        }

        if (classId) {
            grades =
                grades.filter(
                    grade =>
                        String(
                            grade.classId
                        ) ===
                        String(
                            classId
                        )
                );
        }

        const csv =
            "\uFEFF" +
            gradesToCSV(
                grades
            );

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;"
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
            `grades_${Date.now()}.csv`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        notify(
            "تم تصدير الدرجات",
            "success"
        );
    }

    /* ============================================================
       استيراد درجات من JSON
       ============================================================ */

    async function importGradesJSON(
        json
    ) {
        try {
            const parsed =
                typeof json === "string"
                    ? JSON.parse(json)
                    : json;

            if (
                !Array.isArray(
                    parsed
                )
            ) {
                throw new Error(
                    "صيغة البيانات غير صحيحة"
                );
            }

            let imported = 0;

            for (
                const item of parsed
            ) {
                if (
                    !item.studentId
                ) {
                    continue;
                }

                const grade =
                    createGradeObject({
                        ...item,

                        id:
                            item.id ||
                            generateId(
                                "GR"
                            )
                    });

                await putRecord(
                    STORE_GRADES,
                    grade
                );

                imported++;
            }

            await refreshGrades();

            notify(
                `تم استيراد ${imported} درجة`,
                "success"
            );

            return imported;

        } catch (error) {
            console.error(
                error
            );

            notify(
                "فشل استيراد الدرجات",
                "error"
            );

            return 0;
        }
    }

    /* ============================================================
       API عامة للملف
       ============================================================ */

    window.GradesSystem = {

        DB_NAME,

        GRADE_TYPES,

        openDatabase,

        addGrade,

        updateGrade,

        removeGrade,

        getStudentGrades,

        getClassGrades,

        getStudentGradeByType,

        calculatePercentage,

        calculateTotal,

        calculateMaxTotal,

        calculateAverage,

        calculateTypeAverage,

        calculateExemption,

        calculateMissing,

        calculateGradeStatistics,

        getGradeStatus,

        buildGradeMap,

        evaluateFormula,

        calculateStudentFormula,

        calculateClassFormula,

        createGradeColumn,

        getGradeColumns,

        saveClassFormula,

        getClassFormula,

        openGradeModal,

        closeGradeModal,

        editGrade,

        confirmDeleteGrade,

        renderStudentGrades,

        renderClassGrades,

        refreshGrades,

        exportGradesCSV,

        importGradesJSON,

        formatDate
    };

    /* ============================================================
       أحداث عامة
       ============================================================ */

    document.addEventListener(
        "click",
        event => {
            const addButton =
                event.target.closest(
                    "[data-add-grade]"
                );

            if (addButton) {
                const studentId =
                    addButton.dataset
                        .studentId ||
                    null;

                openGradeModal(
                    studentId
                );

                return;
            }

            const editButton =
                event.target.closest(
                    "[data-grade-edit]"
                );

            if (editButton) {
                editGrade(
                    editButton.dataset
                        .gradeEdit
                );

                return;
            }

            const deleteButton =
                event.target.closest(
                    "[data-grade-delete]"
                );

            if (deleteButton) {
                confirmDeleteGrade(
                    deleteButton.dataset
                        .gradeDelete
                );
            }
        }
    );

    /* ============================================================
       تشغيل أولي
       ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        async () => {
            try {
                await openDatabase();

                console.log(
                    "Grades system initialized."
                );

            } catch (error) {
                console.error(
                    "Grades system initialization failed:",
                    error
                );
            }
        }
    );

})();