/* ============================================================
   FILE 16: assignments.js
   نظام إدارة الواجبات
   Teacher Desktop System
   ============================================================ */

(() => {
    "use strict";

    /* ============================================================
       إعدادات قاعدة البيانات
       ============================================================ */

    const DB_NAME = "TeacherDesktopDB";
    const DB_VERSION = 1;

    const STORE_ASSIGNMENTS = "assignments";
    const STORE_SUBMISSIONS = "assignmentSubmissions";
    const STORE_STUDENTS = "students";
    const STORE_CLASSES = "classes";
    const STORE_SETTINGS = "settings";

    let db = null;

    /* ============================================================
       أنواع الواجبات
       ============================================================ */

    const ASSIGNMENT_TYPES = {
        homework: {
            label: "واجب منزلي",
            icon: "📚"
        },

        classroom: {
            label: "واجب صفي",
            icon: "📝"
        },

        research: {
            label: "بحث",
            icon: "🔎"
        },

        project: {
            label: "مشروع",
            icon: "💡"
        },

        exercise: {
            label: "تمارين",
            icon: "✏️"
        },

        reading: {
            label: "قراءة",
            icon: "📖"
        },

        custom: {
            label: "واجب مخصص",
            icon: "📌"
        }
    };

    /* ============================================================
       حالات التسليم
       ============================================================ */

    const SUBMISSION_STATUS = {
        pending: {
            label: "لم يسلم",
            icon: "🔴"
        },

        submitted: {
            label: "تم التسليم",
            icon: "🟢"
        },

        late: {
            label: "متأخر",
            icon: "🟠"
        },

        excused: {
            label: "معذور",
            icon: "🔵"
        }
    };

    /* ============================================================
       فتح قاعدة البيانات
       ============================================================ */

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (db) {
                resolve(db);
                return;
            }

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;

                db.onversionchange = () => {
                    db.close();
                    db = null;
                };

                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database =
                    event.target.result;

                if (
                    !database.objectStoreNames.contains(
                        STORE_ASSIGNMENTS
                    )
                ) {
                    const store =
                        database.createObjectStore(
                            STORE_ASSIGNMENTS,
                            {
                                keyPath: "id",
                                autoIncrement: true
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
                        "type",
                        "type",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "dueDate",
                        "dueDate",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "createdAt",
                        "createdAt",
                        {
                            unique: false
                        }
                    );
                }

                if (
                    !database.objectStoreNames.contains(
                        STORE_ASSIGNMENT_SUBMISSIONS
                    )
                ) {
                    const store =
                        database.createObjectStore(
                            STORE_ASSIGNMENT_SUBMISSIONS,
                            {
                                keyPath: "id",
                                autoIncrement: true
                            }
                        );

                    store.createIndex(
                        "assignmentId",
                        "assignmentId",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "studentId",
                        "studentId",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "status",
                        "status",
                        {
                            unique: false
                        }
                    );

                    store.createIndex(
                        "date",
                        "date",
                        {
                            unique: false
                        }
                    );
                }

                if (
                    !database.objectStoreNames.contains(
                        STORE_STUDENTS
                    )
                ) {
                    database.createObjectStore(
                        STORE_STUDENTS,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );
                }

                if (
                    !database.objectStoreNames.contains(
                        STORE_CLASSES
                    )
                ) {
                    database.createObjectStore(
                        STORE_CLASSES,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );
                }

                if (
                    !database.objectStoreNames.contains(
                        STORE_SETTINGS
                    )
                ) {
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
       ملاحظة توافق
       ============================================================ */

    const STORE_ASSIGNMENT_SUBMISSIONS =
        "assignmentSubmissions";

    /* ============================================================
       أدوات عامة
       ============================================================ */

    function generateId(prefix = "ASG") {
        return (
            prefix +
            "_" +
            Date.now().toString(36) +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 9)
        ).toUpperCase();
    }

    function nowISO() {
        return new Date().toISOString();
    }

    function safeNumber(
        value,
        fallback = 0
    ) {
        const number =
            Number(value);

        if (
            !Number.isFinite(
                number
            )
        ) {
            return fallback;
        }

        return number;
    }

    function escapeHTML(value) {
        return String(
            value ?? ""
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
    }

    function notify(
        message,
        type = "info"
    ) {
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

        if (
            typeof window.showNotification ===
            "function"
        ) {
            window.showNotification(
                message,
                type
            );

            return;
        }

        console.log(
            `[${type}] ${message}`
        );
    }

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

    function formatDateTime(
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

        return date.toLocaleString(
            "ar-IQ",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }

    /* ============================================================
       عمليات IndexedDB
       ============================================================ */

    async function addRecord(
        storeName,
        data
    ) {
        const database =
            await openDatabase();

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const transaction =
                    database.transaction(
                        storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        storeName
                    );

                const request =
                    store.add(data);

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
    }

    async function putRecord(
        storeName,
        data
    ) {
        const database =
            await openDatabase();

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const transaction =
                    database.transaction(
                        storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        storeName
                    );

                const request =
                    store.put(data);

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
    }

    async function getRecord(
        storeName,
        id
    ) {
        const database =
            await openDatabase();

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
                    store.get(id);

                request.onsuccess =
                    () => {
                        resolve(
                            request.result ||
                            null
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
    }

    async function getAllRecords(
        storeName
    ) {
        const database =
            await openDatabase();

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
                        resolve(
                            request.result ||
                            []
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
    }

    async function deleteRecord(
        storeName,
        id
    ) {
        const database =
            await openDatabase();

        return new Promise(
            (
                resolve,
                reject
            ) => {
                const transaction =
                    database.transaction(
                        storeName,
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        storeName
                    );

                const request =
                    store.delete(id);

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
            }
        );
    }

    /* ============================================================
       إنشاء كائن الواجب
       ============================================================ */

    function createAssignmentObject(
        options = {}
    ) {
        const {
            title = "",
            description = "",
            type = "homework",
            classId = null,
            sectionId = null,
            lesson = "",
            subject = "",
            dueDate = null,
            dueTime = "",
            maxGrade = 10,
            note = "",
            priority = "normal",
            status = "active",
            attachments = []
        } = options;

        return {
            id:
                options.id ||
                generateId("ASG"),

            title:
                String(title).trim(),

            description:
                String(
                    description
                ).trim(),

            type:
                ASSIGNMENT_TYPES[type]
                    ? type
                    : "custom",

            classId,

            sectionId,

            lesson:
                String(lesson).trim(),

            subject:
                String(subject).trim(),

            dueDate,

            dueTime:
                String(dueTime).trim(),

            maxGrade:
                Math.max(
                    0,
                    safeNumber(
                        maxGrade,
                        10
                    )
                ),

            note:
                String(note).trim(),

            priority:
                [
                    "low",
                    "normal",
                    "high"
                ].includes(priority)
                    ? priority
                    : "normal",

            status,

            attachments:
                Array.isArray(
                    attachments
                )
                    ? attachments
                    : [],

            createdAt:
                options.createdAt ||
                nowISO(),

            updatedAt:
                nowISO()
        };
    }

    /* ============================================================
       إضافة واجب
       ============================================================ */

    async function addAssignment(
        options
    ) {
        try {
            const assignment =
                createAssignmentObject(
                    options
                );

            if (
                !assignment.title
            ) {
                notify(
                    "اكتب اسم الواجب أولاً",
                    "warning"
                );

                return null;
            }

            await addRecord(
                STORE_ASSIGNMENTS,
                assignment
            );

            notify(
                "تمت إضافة الواجب بنجاح",
                "success"
            );

            await initializeAssignmentSubmissions(
                assignment
            );

            await refreshAssignments();

            return assignment;
        } catch (error) {
            console.error(
                "addAssignment:",
                error
            );

            notify(
                "حدث خطأ أثناء إضافة الواجب",
                "error"
            );

            return null;
        }
    }

    /* ============================================================
       تعديل واجب
       ============================================================ */

    async function updateAssignment(
        id,
        changes
    ) {
        try {
            const existing =
                await getRecord(
                    STORE_ASSIGNMENTS,
                    id
                );

            if (!existing) {
                notify(
                    "الواجب غير موجود",
                    "error"
                );

                return null;
            }

            const updated =
                createAssignmentObject(
                    {
                        ...existing,
                        ...changes,
                        id:
                            existing.id,
                        createdAt:
                            existing.createdAt
                    }
                );

            await putRecord(
                STORE_ASSIGNMENTS,
                updated
            );

            notify(
                "تم تعديل الواجب",
                "success"
            );

            await refreshAssignments();

            return updated;
        } catch (error) {
            console.error(
                "updateAssignment:",
                error
            );

            notify(
                "تعذر تعديل الواجب",
                "error"
            );

            return null;
        }
    }

    /* ============================================================
       حذف واجب
       ============================================================ */

    async function removeAssignment(
        id
    ) {
        try {
            const submissions =
                await getAllRecords(
                    STORE_ASSIGNMENT_SUBMISSIONS
                );

            const related =
                submissions.filter(
                    item =>
                        String(
                            item.assignmentId
                        ) ===
                        String(id)
                );

            for (
                const submission of related
            ) {
                await deleteRecord(
                    STORE_ASSIGNMENT_SUBMISSIONS,
                    submission.id
                );
            }

            await deleteRecord(
                STORE_ASSIGNMENTS,
                id
            );

            notify(
                "تم حذف الواجب",
                "success"
            );

            await refreshAssignments();

            return true;
        } catch (error) {
            console.error(
                "removeAssignment:",
                error
            );

            notify(
                "تعذر حذف الواجب",
                "error"
            );

            return false;
        }
    }

    /* ============================================================
       جلب جميع الواجبات
       ============================================================ */

    async function getAssignments() {
        const assignments =
            await getAllRecords(
                STORE_ASSIGNMENTS
            );

        return assignments.sort(
            (
                a,
                b
            ) =>
                new Date(
                    b.createdAt
                ) -
                new Date(
                    a.createdAt
                )
        );
    }

    /* ============================================================
       جلب واجبات الصف
       ============================================================ */

    async function getClassAssignments(
        classId
    ) {
        const assignments =
            await getAssignments();

        return assignments.filter(
            assignment =>
                String(
                    assignment.classId
                ) ===
                String(classId)
        );
    }

    /* ============================================================
       جلب واجبات الشعبة
       ============================================================ */

    async function getSectionAssignments(
        sectionId
    ) {
        const assignments =
            await getAssignments();

        return assignments.filter(
            assignment =>
                String(
                    assignment.sectionId
                ) ===
                String(sectionId)
        );
    }

    /* ============================================================
       البحث بالواجبات
       ============================================================ */

    async function searchAssignments(
        query
    ) {
        const assignments =
            await getAssignments();

        const text =
            String(
                query || ""
            )
                .trim()
                .toLowerCase();

        if (!text) {
            return assignments;
        }

        return assignments.filter(
            assignment =>
                [
                    assignment.title,
                    assignment.description,
                    assignment.subject,
                    assignment.lesson,
                    assignment.note
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(text)
        );
    }

    /* ============================================================
       التحقق من موعد التسليم
       ============================================================ */

    function getAssignmentState(
        assignment
    ) {
        if (
            !assignment ||
            !assignment.dueDate
        ) {
            return {
                key: "no-date",
                label: "بدون موعد",
                icon: "⚪"
            };
        }

        const due =
            new Date(
                assignment.dueDate
            );

        if (
            assignment.dueTime
        ) {
            const [
                hours,
                minutes
            ] =
                assignment.dueTime
                    .split(":")
                    .map(Number);

            if (
                Number.isFinite(
                    hours
                )
            ) {
                due.setHours(
                    hours,
                    Number.isFinite(
                        minutes
                    )
                        ? minutes
                        : 0,
                    0,
                    0
                );
            }
        }

        const now =
            new Date();

        const diff =
            due.getTime() -
            now.getTime();

        if (
            diff < 0
        ) {
            return {
                key: "overdue",
                label: "انتهى الموعد",
                icon: "🔴"
            };
        }

        const hoursLeft =
            diff /
            (
                1000 *
                60 *
                60
            );

        if (
            hoursLeft <= 24
        ) {
            return {
                key: "soon",
                label: "قريباً",
                icon: "🟠"
            };
        }

        return {
            key: "upcoming",
            label: "قادم",
            icon: "🟢"
        };
    }

    /* ============================================================
       إنشاء سجل تسليم لطالب
       ============================================================ */

    function createSubmissionObject(
        assignmentId,
        studentId,
        options = {}
    ) {
        return {
            id:
                options.id ||
                generateId("SUB"),

            assignmentId,

            studentId,

            status:
                SUBMISSION_STATUS[
                    options.status
                ]
                    ? options.status
                    : "pending",

            grade:
                options.grade === null ||
                options.grade === undefined
                    ? null
                    : safeNumber(
                        options.grade
                    ),

            maxGrade:
                safeNumber(
                    options.maxGrade,
                    10
                ),

            note:
                String(
                    options.note || ""
                ).trim(),

            submittedAt:
                options.submittedAt ||
                null,

            correctedAt:
                options.correctedAt ||
                null,

            createdAt:
                options.createdAt ||
                nowISO(),

            updatedAt:
                nowISO()
        };
    }

    /* ============================================================
       إنشاء سجلات لجميع طلاب الواجب
       ============================================================ */

    async function initializeAssignmentSubmissions(
        assignment
    ) {
        if (!assignment) {
            return;
        }

        try {
            const students =
                await getAllRecords(
                    STORE_STUDENTS
                );

            let filtered =
                students;

            if (
                assignment.classId
            ) {
                filtered =
                    filtered.filter(
                        student =>
                            String(
                                student.classId
                            ) ===
                            String(
                                assignment.classId
                            )
                    );
            }

            if (
                assignment.sectionId
            ) {
                filtered =
                    filtered.filter(
                        student =>
                            String(
                                student.sectionId
                            ) ===
                            String(
                                assignment.sectionId
                            )
                    );
            }

            for (
                const student of filtered
            ) {
                const existing =
                    await getStudentAssignmentSubmission(
                        assignment.id,
                        student.id
                    );

                if (!existing) {
                    const submission =
                        createSubmissionObject(
                            assignment.id,
                            student.id,
                            {
                                maxGrade:
                                    assignment.maxGrade
                            }
                        );

                    await addRecord(
                        STORE_ASSIGNMENT_SUBMISSIONS,
                        submission
                    );
                }
            }
        } catch (error) {
            console.error(
                "initializeAssignmentSubmissions:",
                error
            );
        }
    }

    /* ============================================================
       جلب جميع عمليات التسليم
       ============================================================ */

    async function getSubmissions() {
        return getAllRecords(
            STORE_ASSIGNMENT_SUBMISSIONS
        );
    }

    /* ============================================================
       جلب عمليات تسليم واجب
       ============================================================ */

    async function getAssignmentSubmissions(
        assignmentId
    ) {
        const submissions =
            await getSubmissions();

        return submissions.filter(
            submission =>
                String(
                    submission.assignmentId
                ) ===
                String(
                    assignmentId
                )
        );
    }

    /* ============================================================
       جلب تسليم طالب لواجب
       ============================================================ */

    async function getStudentAssignmentSubmission(
        assignmentId,
        studentId
    ) {
        const submissions =
            await getSubmissions();

        return (
            submissions.find(
                submission =>
                    String(
                        submission.assignmentId
                    ) ===
                    String(
                        assignmentId
                    ) &&
                    String(
                        submission.studentId
                    ) ===
                    String(
                        studentId
                    )
            ) || null
        );
    }

    /* ============================================================
       تسجيل تسليم
       ============================================================ */

    async function markSubmitted(
        assignmentId,
        studentId,
        note = ""
    ) {
        try {
            let submission =
                await getStudentAssignmentSubmission(
                    assignmentId,
                    studentId
                );

            const assignment =
                await getRecord(
                    STORE_ASSIGNMENTS,
                    assignmentId
                );

            if (!assignment) {
                throw new Error(
                    "الواجب غير موجود"
                );
            }

            if (!submission) {
                submission =
                    createSubmissionObject(
                        assignmentId,
                        studentId,
                        {
                            maxGrade:
                                assignment.maxGrade
                        }
                    );
            }

            submission.status =
                "submitted";

            submission.submittedAt =
                nowISO();

            submission.note =
                note ||
                submission.note ||
                "";

            submission.updatedAt =
                nowISO();

            if (
                submission.id
            ) {
                await putRecord(
                    STORE_ASSIGNMENT_SUBMISSIONS,
                    submission
                );
            } else {
                await addRecord(
                    STORE_ASSIGNMENT_SUBMISSIONS,
                    submission
                );
            }

            notify(
                "تم تسجيل التسليم",
                "success"
            );

            await refreshAssignments();

            return submission;
        } catch (error) {
            console.error(
                "markSubmitted:",
                error
            );

            notify(
                "تعذر تسجيل التسليم",
                "error"
            );

            return null;
        }
    }

    /* ============================================================
       تسجيل عدم التسليم
       ============================================================ */

    async function markPending(
        assignmentId,
        studentId,
        note = ""
    ) {
        try {
            let submission =
                await getStudentAssignmentSubmission(
                    assignmentId,
                    studentId
                );

            const assignment =
                await getRecord(
                    STORE_ASSIGNMENTS,
                    assignmentId
                );

            if (!assignment) {
                throw new Error(
                    "الواجب غير موجود"
                );
            }

            if (!submission) {
                submission =
                    createSubmissionObject(
                        assignmentId,
                        studentId,
                        {
                            maxGrade:
                                assignment.maxGrade
                        }
                    );
            }

            submission.status =
                "pending";

            submission.note =
                note ||
                submission.note ||
                "";

            submission.updatedAt =
                nowISO();

            await putRecord(
                STORE_ASSIGNMENT_SUBMISSIONS,
                submission
            );

            notify(
                "تم تسجيل عدم التسليم",
                "success"
            );

            await refreshAssignments();

            return submission;
        } catch (error) {
            console.error(
                error
            );

            return null;
        }
    }

    /* ============================================================
       تسجيل التسليم المتأخر
       ============================================================ */

    async function markLate(
        assignmentId,
        studentId,
        note = ""
    ) {
        try {
            let submission =
                await getStudentAssignmentSubmission(
                    assignmentId,
                    studentId
                );

            const assignment =
                await getRecord(
                    STORE_ASSIGNMENTS,
                    assignmentId
                );

            if (!assignment) {
                return null;
            }

            if (!submission) {
                submission =
                    createSubmissionObject(
                        assignmentId,
                        studentId,
                        {
                            maxGrade:
                                assignment.maxGrade
                        }
                    );
            }

            submission.status =
                "late";

            submission.submittedAt =
                nowISO();

            submission.note =
                note ||
                submission.note ||
                "";

            submission.updatedAt =
                nowISO();

            await putRecord(
                STORE_ASSIGNMENT_SUBMISSIONS,
                submission
            );

            notify(
                "تم تسجيل التسليم المتأخر",
                "success"
            );

            await refreshAssignments();

            return submission;
        } catch (error) {
            console.error(
                error
            );

            return null;
        }
    }

    /* ============================================================
       تسجيل عذر
       ============================================================ */

    async function markExcused(
        assignmentId,
        studentId,
        note = ""
    ) {
        try {
            let submission =
                await getStudentAssignmentSubmission(
                    assignmentId,
                    studentId
                );

            const assignment =
                await getRecord(
                    STORE_ASSIGNMENTS,
                    assignmentId
                );

            if (!assignment) {
                return null;
            }

            if (!submission) {
                submission =
                    createSubmissionObject(
                        assignmentId,
                        studentId,
                        {
                            maxGrade:
                                assignment.maxGrade
                        }
                    );
            }

            submission.status =
                "excused";

            submission.note =
                note ||
                submission.note ||
                "";

            submission.updatedAt =
                nowISO();

            await putRecord(
                STORE_ASSIGNMENT_SUBMISSIONS,
                submission
            );

            notify(
                "تم تسجيل العذر",
                "success"
            );

            await refreshAssignments();

            return submission;
        } catch (error) {
            console.error(
                error
            );

            return null;
        }
    }

    /* ============================================================
       إضافة أو تعديل درجة الواجب
       ============================================================ */

    async function setAssignmentGrade(
        assignmentId,
        studentId,
        grade,
        note = ""
    ) {
        try {
            const assignment =
                await getRecord(
                    STORE_ASSIGNMENTS,
                    assignmentId
                );

            if (!assignment) {
                throw new Error(
                    "الواجب غير موجود"
                );
            }

            const maxGrade =
                safeNumber(
                    assignment.maxGrade,
                    10
                );

            const numericGrade =
                Math.min(
                    Math.max(
                        safeNumber(
                            grade
                        ),
                        0
                    ),
                    maxGrade
                );

            let submission =
                await getStudentAssignmentSubmission(
                    assignmentId,
                    studentId
                );

            if (!submission) {
                submission =
                    createSubmissionObject(
                        assignmentId,
                        studentId,
                        {
                            maxGrade
                        }
                    );
            }

            submission.grade =
                numericGrade;

            submission.maxGrade =
                maxGrade;

            submission.status =
                submission.status ===
                "pending"
                    ? "submitted"
                    : submission.status;

            submission.note =
                note ||
                submission.note ||
                "";

            submission.correctedAt =
                nowISO();

            submission.updatedAt =
                nowISO();

            await putRecord(
                STORE_ASSIGNMENT_SUBMISSIONS,
                submission
            );

            notify(
                "تم حفظ درجة الواجب",
                "success"
            );

            await refreshAssignments();

            return submission;
        } catch (error) {
            console.error(
                "setAssignmentGrade:",
                error
            );

            notify(
                "تعذر حفظ الدرجة",
                "error"
            );

            return null;
        }
    }

    /* ============================================================
       حذف درجة الواجب
       ============================================================ */

    async function clearAssignmentGrade(
        assignmentId,
        studentId
    ) {
        const submission =
            await getStudentAssignmentSubmission(
                assignmentId,
                studentId
            );

        if (!submission) {
            return false;
        }

        submission.grade =
            null;

        submission.correctedAt =
            null;

        submission.updatedAt =
            nowISO();

        await putRecord(
            STORE_ASSIGNMENT_SUBMISSIONS,
            submission
        );

        notify(
            "تم حذف درجة الواجب",
            "success"
        );

        await refreshAssignments();

        return true;
    }

    /* ============================================================
       حساب نسبة درجة الواجب
       ============================================================ */

    function calculateAssignmentPercentage(
        grade,
        maxGrade
    ) {
        const value =
            safeNumber(
                grade
            );

        const max =
            safeNumber(
                maxGrade
            );

        if (
            max <= 0 ||
            grade === null ||
            grade === undefined
        ) {
            return 0;
        }

        return Math.round(
            (
                value /
                max
            ) *
            10000
        ) / 100;
    }

    /* ============================================================
       إحصائيات واجب
       ============================================================ */

    async function getAssignmentStatistics(
        assignmentId
    ) {
        const submissions =
            await getAssignmentSubmissions(
                assignmentId
            );

        let submitted = 0;
        let pending = 0;
        let late = 0;
        let excused = 0;

        const graded =
            [];

        submissions.forEach(
            submission => {
                if (
                    submission.status ===
                    "submitted"
                ) {
                    submitted++;
                } else if (
                    submission.status ===
                    "late"
                ) {
                    late++;
                } else if (
                    submission.status ===
                    "excused"
                ) {
                    excused++;
                } else {
                    pending++;
                }

                if (
                    submission.grade !==
                    null &&
                    submission.grade !==
                    undefined
                ) {
                    graded.push(
                        safeNumber(
                            submission.grade
                        )
                    );
                }
            }
        );

        const total =
            submissions.length;

        const gradeAverage =
            graded.length
                ? graded.reduce(
                    (
                        sum,
                        value
                    ) =>
                        sum + value,
                    0
                ) /
                graded.length
                : 0;

        return {
            total,

            submitted,

            pending,

            late,

            excused,

            graded:
                graded.length,

            gradeAverage:
                Math.round(
                    gradeAverage *
                    100
                ) / 100,

            submissionRate:
                total
                    ? Math.round(
                        (
                            (
                                submitted +
                                late
                            ) /
                            total
                        ) *
                        10000
                    ) / 100
                    : 0
        };
    }

    /* ============================================================
       بطاقة الواجب
       ============================================================ */

    function assignmentCardHTML(
        assignment,
        statistics = null
    ) {
        const type =
            ASSIGNMENT_TYPES[
                assignment.type
            ] ||
            ASSIGNMENT_TYPES.custom;

        const state =
            getAssignmentState(
                assignment
            );

        const stats =
            statistics || {
                total: 0,
                submitted: 0,
                pending: 0,
                late: 0,
                excused: 0,
                gradeAverage: 0,
                submissionRate: 0
            };

        const priorityIcon =
            assignment.priority ===
            "high"
                ? "🔴"
                : assignment.priority ===
                  "low"
                ? "🔵"
                : "🟡";

        return `
            <article
                class="assignment-card glass-card"
                data-assignment-id="${escapeHTML(
                    assignment.id
                )}"
            >

                <div class="assignment-card-top">

                    <div class="assignment-icon">
                        ${type.icon}
                    </div>

                    <div class="assignment-title-area">

                        <h3>
                            ${escapeHTML(
                                assignment.title
                            )}
                        </h3>

                        <span class="assignment-type">
                            ${type.label}
                        </span>

                    </div>

                    <div
                        class="assignment-priority"
                        title="الأولوية"
                    >
                        ${priorityIcon}
                    </div>

                </div>

                <div class="assignment-description">
                    ${escapeHTML(
                        assignment.description ||
                        "لا توجد تفاصيل إضافية"
                    )}
                </div>

                <div class="assignment-meta">

                    ${
                        assignment.subject
                            ? `
                                <span>
                                    📖
                                    ${escapeHTML(
                                        assignment.subject
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${
                        assignment.lesson
                            ? `
                                <span>
                                    🧠
                                    ${escapeHTML(
                                        assignment.lesson
                                    )}
                                </span>
                              `
                            : ""
                    }

                    <span>
                        📅
                        ${formatDate(
                            assignment.dueDate
                        )}
                    </span>

                    ${
                        assignment.dueTime
                            ? `
                                <span>
                                    🕐
                                    ${escapeHTML(
                                        assignment.dueTime
                                    )}
                                </span>
                              `
                            : ""
                    }

                    <span>
                        💯
                        ${escapeHTML(
                            assignment.maxGrade
                        )}
                    </span>

                </div>

                <div class="assignment-state">
                    ${state.icon}
                    ${state.label}
                </div>

                <div class="assignment-statistics">

                    <div>
                        <span>
                            🟢
                        </span>

                        <strong>
                            ${stats.submitted}
                        </strong>

                        <small>
                            مسلم
                        </small>
                    </div>

                    <div>
                        <span>
                            🔴
                        </span>

                        <strong>
                            ${stats.pending}
                        </strong>

                        <small>
                            لم يسلم
                        </small>
                    </div>

                    <div>
                        <span>
                            🟠
                        </span>

                        <strong>
                            ${stats.late}
                        </strong>

                        <small>
                            متأخر
                        </small>
                    </div>

                    <div>
                        <span>
                            📊
                        </span>

                        <strong>
                            ${stats.gradeAverage}
                        </strong>

                        <small>
                            معدل
                        </small>
                    </div>

                </div>

                <div class="assignment-actions">

                    <button
                        type="button"
                        class="assignment-view-btn"
                        data-assignment-view="${escapeHTML(
                            assignment.id
                        )}"
                    >
                        👁️
                        التفاصيل
                    </button>

                    <button
                        type="button"
                        class="assignment-edit-btn"
                        data-assignment-edit="${escapeHTML(
                            assignment.id
                        )}"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="assignment-delete-btn"
                        data-assignment-delete="${escapeHTML(
                            assignment.id
                        )}"
                    >
                        🗑️
                    </button>

                </div>

            </article>
        `;
    }

    /* ============================================================
       إنشاء نافذة الواجب
       ============================================================ */

    function createAssignmentModal() {
        const old =
            document.getElementById(
                "assignmentModal"
            );

        if (old) {
            old.remove();
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "assignmentModal";

        modal.className =
            "assignment-modal-overlay";

        modal.innerHTML = `
            <div class="assignment-modal glass-panel">

                <div class="assignment-modal-header">

                    <div>
                        <span class="assignment-modal-icon">
                            📚
                        </span>

                        <h2>
                            إضافة واجب
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="assignment-modal-close"
                        id="closeAssignmentModal"
                    >
                        ✕
                    </button>

                </div>

                <form
                    id="assignmentForm"
                    class="assignment-form"
                >

                    <input
                        type="hidden"
                        id="assignmentId"
                    >

                    <div class="assignment-form-grid">

                        <div class="form-group full">

                            <label>
                                عنوان الواجب
                            </label>

                            <input
                                type="text"
                                id="assignmentTitle"
                                required
                                maxlength="200"
                                placeholder="اكتب اسم الواجب..."
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                النوع
                            </label>

                            <select
                                id="assignmentType"
                            >

                                ${Object.entries(
                                    ASSIGNMENT_TYPES
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
                                المادة
                            </label>

                            <input
                                type="text"
                                id="assignmentSubject"
                                placeholder="اسم المادة"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                الصف
                            </label>

                            <select
                                id="assignmentClass"
                            >
                                <option value="">
                                    اختر الصف
                                </option>
                            </select>

                        </div>

                        <div class="form-group">

                            <label>
                                الشعبة
                            </label>

                            <select
                                id="assignmentSection"
                            >
                                <option value="">
                                    اختر الشعبة
                                </option>
                            </select>

                        </div>

                        <div class="form-group">

                            <label>
                                الدرس
                            </label>

                            <input
                                type="text"
                                id="assignmentLesson"
                                placeholder="موضوع الدرس"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                تاريخ التسليم
                            </label>

                            <input
                                type="date"
                                id="assignmentDueDate"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                وقت التسليم
                            </label>

                            <input
                                type="time"
                                id="assignmentDueTime"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                الدرجة القصوى
                            </label>

                            <input
                                type="number"
                                id="assignmentMaxGrade"
                                value="10"
                                min="0"
                                step="0.01"
                            >

                        </div>

                        <div class="form-group">

                            <label>
                                الأولوية
                            </label>

                            <select
                                id="assignmentPriority"
                            >
                                <option value="low">
                                    🔵 منخفضة
                                </option>

                                <option
                                    value="normal"
                                    selected
                                >
                                    🟡 عادية
                                </option>

                                <option value="high">
                                    🔴 عالية
                                </option>
                            </select>

                        </div>

                        <div class="form-group full">

                            <label>
                                وصف الواجب
                            </label>

                            <textarea
                                id="assignmentDescription"
                                rows="4"
                                placeholder="اكتب تفاصيل الواجب..."
                            ></textarea>

                        </div>

                        <div class="form-group full">

                            <label>
                                ملاحظة
                            </label>

                            <textarea
                                id="assignmentNote"
                                rows="3"
                                placeholder="ملاحظات للطلاب أو للمدرس..."
                            ></textarea>

                        </div>

                    </div>

                    <div class="assignment-form-actions">

                        <button
                            type="button"
                            id="cancelAssignment"
                            class="btn-secondary"
                        >
                            إلغاء
                        </button>

                        <button
                            type="submit"
                            class="btn-primary"
                        >
                            💾 حفظ الواجب
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        bindAssignmentModalEvents();

        loadAssignmentClasses();
    }

    /* ============================================================
       فتح نافذة الإضافة
       ============================================================ */

    async function openAssignmentModal(
        assignmentId = null
    ) {
        createAssignmentModal();

        const modal =
            document.getElementById(
                "assignmentModal"
            );

        if (modal) {
            requestAnimationFrame(
                () => {
                    modal.classList.add(
                        "active"
                    );
                }
            );
        }

        if (
            assignmentId
        ) {
            await fillAssignmentForm(
                assignmentId
            );
        }
    }

    /* ============================================================
       تحميل الصفوف
       ============================================================ */

    async function loadAssignmentClasses() {
        const select =
            document.getElementById(
                "assignmentClass"
            );

        if (!select) {
            return;
        }

        try {
            const classes =
                await getAllRecords(
                    STORE_CLASSES
                );

            select.innerHTML = `
                <option value="">
                    اختر الصف
                </option>
            `;

            classes.forEach(
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
                        "صف بدون اسم";

                    select.appendChild(
                        option
                    );
                }
            );

            select.addEventListener(
                "change",
                () => {
                    loadAssignmentSections(
                        select.value
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
       تحميل الشعب
       ============================================================ */

    async function loadAssignmentSections(
        classId
    ) {
        const select =
            document.getElementById(
                "assignmentSection"
            );

        if (!select) {
            return;
        }

        select.innerHTML = `
            <option value="">
                جميع الشعب
            </option>
        `;

        if (!classId) {
            return;
        }

        try {
            const classes =
                await getAllRecords(
                    STORE_CLASSES
                );

            const current =
                classes.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(
                            classId
                        )
                );

            const sections =
                current?.sections ||
                current?.divisions ||
                current?.branches ||
                [];

            if (
                Array.isArray(
                    sections
                )
            ) {
                sections.forEach(
                    section => {
                        const option =
                            document.createElement(
                                "option"
                            );

                        if (
                            typeof section ===
                            "object"
                        ) {
                            option.value =
                                section.id ??
                                section.name;

                            option.textContent =
                                section.name ??
                                section.title ??
                                "شعبة";
                        } else {
                            option.value =
                                section;

                            option.textContent =
                                section;
                        }

                        select.appendChild(
                            option
                        );
                    }
                );
            }
        } catch (error) {
            console.error(
                error
            );
        }
    }

    /* ============================================================
       ملء نموذج التعديل
       ============================================================ */

    async function fillAssignmentForm(
        id
    ) {
        const assignment =
            await getRecord(
                STORE_ASSIGNMENTS,
                id
            );

        if (!assignment) {
            return;
        }

        const fields = {
            assignmentId:
                assignment.id,

            assignmentTitle:
                assignment.title,

            assignmentType:
                assignment.type,

            assignmentSubject:
                assignment.subject,

            assignmentLesson:
                assignment.lesson,

            assignmentDueDate:
                assignment.dueDate,

            assignmentDueTime:
                assignment.dueTime,

            assignmentMaxGrade:
                assignment.maxGrade,

            assignmentPriority:
                assignment.priority,

            assignmentDescription:
                assignment.description,

            assignmentNote:
                assignment.note
        };

        Object.entries(
            fields
        ).forEach(
            (
                [
                    idName,
                    value
                ]
            ) => {
                const input =
                    document.getElementById(
                        idName
                    );

                if (input) {
                    input.value =
                        value ??
                        "";
                }
            }
        );

        const classSelect =
            document.getElementById(
                "assignmentClass"
            );

        if (
            classSelect &&
            assignment.classId
        ) {
            classSelect.value =
                assignment.classId;

            await loadAssignmentSections(
                assignment.classId
            );
        }

        const sectionSelect =
            document.getElementById(
                "assignmentSection"
            );

        if (
            sectionSelect &&
            assignment.sectionId
        ) {
            sectionSelect.value =
                assignment.sectionId;
        }

        const heading =
            document.querySelector(
                "#assignmentModal h2"
            );

        if (heading) {
            heading.textContent =
                "تعديل الواجب";
        }

        const submit =
            document.querySelector(
                "#assignmentForm button[type='submit']"
            );

        if (submit) {
            submit.textContent =
                "💾 حفظ التعديل";
        }
    }

    /* ============================================================
       أحداث نافذة الواجب
       ============================================================ */

    function bindAssignmentModalEvents() {
        const close =
            document.getElementById(
                "closeAssignmentModal"
            );

        const cancel =
            document.getElementById(
                "cancelAssignment"
            );

        const form =
            document.getElementById(
                "assignmentForm"
            );

        if (close) {
            close.onclick =
                closeAssignmentModal;
        }

        if (cancel) {
            cancel.onclick =
                closeAssignmentModal;
        }

        if (form) {
            form.addEventListener(
                "submit",
                handleAssignmentSubmit
            );
        }
    }

    /* ============================================================
       إغلاق النافذة
       ============================================================ */

    function closeAssignmentModal() {
        const modal =
            document.getElementById(
                "assignmentModal"
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
       حفظ الواجب
       ============================================================ */

    async function handleAssignmentSubmit(
        event
    ) {
        event.preventDefault();

        const id =
            document.getElementById(
                "assignmentId"
            )?.value;

        const title =
            document.getElementById(
                "assignmentTitle"
            )?.value;

        const type =
            document.getElementById(
                "assignmentType"
            )?.value;

        const subject =
            document.getElementById(
                "assignmentSubject"
            )?.value;

        const classId =
            document.getElementById(
                "assignmentClass"
            )?.value ||
            null;

        const sectionId =
            document.getElementById(
                "assignmentSection"
            )?.value ||
            null;

        const lesson =
            document.getElementById(
                "assignmentLesson"
            )?.value;

        const dueDate =
            document.getElementById(
                "assignmentDueDate"
            )?.value ||
            null;

        const dueTime =
            document.getElementById(
                "assignmentDueTime"
            )?.value;

        const maxGrade =
            document.getElementById(
                "assignmentMaxGrade"
            )?.value;

        const priority =
            document.getElementById(
                "assignmentPriority"
            )?.value;

        const description =
            document.getElementById(
                "assignmentDescription"
            )?.value;

        const note =
            document.getElementById(
                "assignmentNote"
            )?.value;

        if (
            !String(
                title || ""
            ).trim()
        ) {
            notify(
                "عنوان الواجب مطلوب",
                "warning"
            );

            return;
        }

        const data = {
            title,

            type,

            subject,

            classId,

            sectionId,

            lesson,

            dueDate,

            dueTime,

            maxGrade:
                safeNumber(
                    maxGrade,
                    10
                ),

            priority,

            description,

            note
        };

        if (id) {
            await updateAssignment(
                id,
                data
            );
        } else {
            await addAssignment(
                data
            );
        }

        closeAssignmentModal();
    }

    /* ============================================================
       تأكيد الحذف
       ============================================================ */

    async function confirmDeleteAssignment(
        id
    ) {
        const assignment =
            await getRecord(
                STORE_ASSIGNMENTS,
                id
            );

        if (!assignment) {
            return;
        }

        const message =
            `هل تريد حذف الواجب "${assignment.title}"؟`;

        const confirmed =
            window.confirm(
                message
            );

        if (!confirmed) {
            return;
        }

        await removeAssignment(
            id
        );
    }

    /* ============================================================
       نافذة تفاصيل الواجب
       ============================================================ */

    async function showAssignmentDetails(
        assignmentId
    ) {
        const assignment =
            await getRecord(
                STORE_ASSIGNMENTS,
                assignmentId
            );

        if (!assignment) {
            notify(
                "الواجب غير موجود",
                "error"
            );

            return;
        }

        const submissions =
            await getAssignmentSubmissions(
                assignmentId
            );

        const students =
            await getAllRecords(
                STORE_STUDENTS
            );

        const studentMap =
            new Map();

        students.forEach(
            student => {
                studentMap.set(
                    String(
                        student.id
                    ),
                    student
                );
            }
        );

        const statistics =
            await getAssignmentStatistics(
                assignmentId
            );

        const old =
            document.getElementById(
                "assignmentDetailsModal"
            );

        if (old) {
            old.remove();
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.id =
            "assignmentDetailsModal";

        modal.className =
            "assignment-modal-overlay active";

        const type =
            ASSIGNMENT_TYPES[
                assignment.type
            ] ||
            ASSIGNMENT_TYPES.custom;

        modal.innerHTML = `
            <div class="assignment-details-modal glass-panel">

                <div class="assignment-modal-header">

                    <div>
                        <span class="assignment-modal-icon">
                            ${type.icon}
                        </span>

                        <h2>
                            ${escapeHTML(
                                assignment.title
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        id="closeAssignmentDetails"
                        class="assignment-modal-close"
                    >
                        ✕
                    </button>

                </div>

                <div class="assignment-details-info">

                    <div class="detail-item glass-card">
                        <span>
                            📚 النوع
                        </span>

                        <strong>
                            ${type.label}
                        </strong>
                    </div>

                    <div class="detail-item glass-card">
                        <span>
                            📅 الموعد
                        </span>

                        <strong>
                            ${formatDate(
                                assignment.dueDate
                            )}
                        </strong>
                    </div>

                    <div class="detail-item glass-card">
                        <span>
                            💯 الدرجة
                        </span>

                        <strong>
                            ${assignment.maxGrade}
                        </strong>
                    </div>

                    <div class="detail-item glass-card">
                        <span>
                            🟢 نسبة التسليم
                        </span>

                        <strong>
                            ${statistics.submissionRate}%
                        </strong>
                    </div>

                </div>

                ${
                    assignment.description
                        ? `
                            <div class="assignment-detail-description glass-card">
                                <h3>
                                    📖 تفاصيل الواجب
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        assignment.description
                                    )}
                                </p>
                            </div>
                          `
                        : ""
                }

                <div class="assignment-student-list">

                    <div class="assignment-student-list-header">

                        <h3>
                            👨‍🎓 الطلاب
                        </h3>

                        <span>
                            ${submissions.length}
                            طالب
                        </span>

                    </div>

                    <div class="assignment-students-table-wrapper">

                        <table class="grades-table">

                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الطالب</th>
                                    <th>الحالة</th>
                                    <th>الدرجة</th>
                                    <th>الملاحظة</th>
                                    <th>الإجراء</th>
                                </tr>
                            </thead>

                            <tbody>

                                ${
                                    submissions.length
                                        ? submissions
                                            .map(
                                                (
                                                    submission,
                                                    index
                                                ) => {
                                                    const student =
                                                        studentMap.get(
                                                            String(
                                                                submission.studentId
                                                            )
                                                        );

                                                    const status =
                                                        SUBMISSION_STATUS[
                                                            submission.status
                                                        ] ||
                                                        SUBMISSION_STATUS.pending;

                                                    return `
                                                        <tr>

                                                            <td>
                                                                ${
                                                                    index +
                                                                    1
                                                                }
                                                            </td>

                                                            <td>
                                                                ${escapeHTML(
                                                                    student?.fullName ||
                                                                    student?.name ||
                                                                    "طالب غير معروف"
                                                                )}
                                                            </td>

                                                            <td>
                                                                ${status.icon}
                                                                ${status.label}
                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="number"
                                                                    class="assignment-grade-input"
                                                                    min="0"
                                                                    max="${escapeHTML(
                                                                        assignment.maxGrade
                                                                    )}"
                                                                    step="0.01"
                                                                    value="${
                                                                        submission.grade ??
                                                                        ""
                                                                    }"
                                                                    data-assignment-grade="${escapeHTML(
                                                                        assignment.id
                                                                    )}"
                                                                    data-student-id="${escapeHTML(
                                                                        submission.studentId
                                                                    )}"
                                                                >

                                                                /
                                                                ${assignment.maxGrade}

                                                            </td>

                                                            <td>

                                                                <input
                                                                    type="text"
                                                                    class="assignment-note-input"
                                                                    value="${escapeHTML(
                                                                        submission.note ||
                                                                        ""
                                                                    )}"
                                                                    data-assignment-note="${escapeHTML(
                                                                        assignment.id
                                                                    )}"
                                                                    data-student-id="${escapeHTML(
                                                                        submission.studentId
                                                                    )}"
                                                                >

                                                            </td>

                                                            <td>

                                                                <div class="submission-actions">

                                                                    <button
                                                                        type="button"
                                                                        data-submission-status="submitted"
                                                                        data-assignment-id="${escapeHTML(
                                                                            assignment.id
                                                                        )}"
                                                                        data-student-id="${escapeHTML(
                                                                            submission.studentId
                                                                        )}"
                                                                        title="تم التسليم"
                                                                    >
                                                                        🟢
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        data-submission-status="pending"
                                                                        data-assignment-id="${escapeHTML(
                                                                            assignment.id
                                                                        )}"
                                                                        data-student-id="${escapeHTML(
                                                                            submission.studentId
                                                                        )}"
                                                                        title="لم يسلم"
                                                                    >
                                                                        🔴
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        data-submission-status="late"
                                                                        data-assignment-id="${escapeHTML(
                                                                            assignment.id
                                                                        )}"
                                                                        data-student-id="${escapeHTML(
                                                                            submission.studentId
                                                                        )}"
                                                                        title="متأخر"
                                                                    >
                                                                        🟠
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        data-submission-status="excused"
                                                                        data-assignment-id="${escapeHTML(
                                                                            assignment.id
                                                                        )}"
                                                                        data-student-id="${escapeHTML(
                                                                            submission.studentId
                                                                        )}"
                                                                        title="معذور"
                                                                    >
                                                                        🔵
                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>
                                                    `;
                                                }
                                            )
                                            .join("")
                                        : `
                                            <tr>
                                                <td colspan="6">
                                                    لا توجد بيانات طلاب
                                                </td>
                                            </tr>
                                        `
                                }

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        bindAssignmentDetailsEvents();
    }

    /* ============================================================
       أحداث التفاصيل
       ============================================================ */

    function bindAssignmentDetailsEvents() {
        const close =
            document.getElementById(
                "closeAssignmentDetails"
            );

        if (close) {
            close.onclick =
                () => {
                    const modal =
                        document.getElementById(
                            "assignmentDetailsModal"
                        );

                    if (modal) {
                        modal.remove();
                    }
                };
        }

        document
            .querySelectorAll(
                "[data-submission-status]"
            )
            .forEach(
                button => {
                    button.onclick =
                        async () => {
                            const assignmentId =
                                button.dataset
                                    .assignmentId;

                            const studentId =
                                button.dataset
                                    .studentId;

                            const status =
                                button.dataset
                                    .submissionStatus;

                            if (
                                status ===
                                "submitted"
                            ) {
                                await markSubmitted(
                                    assignmentId,
                                    studentId
                                );
                            } else if (
                                status ===
                                "pending"
                            ) {
                                await markPending(
                                    assignmentId,
                                    studentId
                                );
                            } else if (
                                status ===
                                "late"
                            ) {
                                await markLate(
                                    assignmentId,
                                    studentId
                                );
                            } else if (
                                status ===
                                "excused"
                            ) {
                                await markExcused(
                                    assignmentId,
                                    studentId
                                );
                            }

                            await showAssignmentDetails(
                                assignmentId
                            );
                        };
                }
            );

        document
            .querySelectorAll(
                ".assignment-grade-input"
            )
            .forEach(
                input => {
                    input.addEventListener(
                        "change",
                        async () => {
                            await setAssignmentGrade(
                                input.dataset
                                    .assignmentGrade,

                                input.dataset
                                    .studentId,

                                input.value
                            );

                            const modal =
                                document.getElementById(
                                    "assignmentDetailsModal"
                                );

                            if (
                                modal
                            ) {
                                await showAssignmentDetails(
                                    input
                                        .dataset
                                        .assignmentGrade
                                );
                            }
                        }
                    );
                }
            );

        document
            .querySelectorAll(
                ".assignment-note-input"
            )
            .forEach(
                input => {
                    input.addEventListener(
                        "change",
                        async () => {
                            const submission =
                                await getStudentAssignmentSubmission(
                                    input
                                        .dataset
                                        .assignmentNote,

                                    input
                                        .dataset
                                        .studentId
                                );

                            if (
                                submission
                            ) {
                                submission.note =
                                    input.value;

                                submission.updatedAt =
                                    nowISO();

                                await putRecord(
                                    STORE_ASSIGNMENT_SUBMISSIONS,
                                    submission
                                );

                                notify(
                                    "تم حفظ الملاحظة",
                                    "success"
                                );
                            }
                        }
                    );
                }
            );
    }

    /* ============================================================
       عرض الواجبات
       ============================================================ */

    async function renderAssignments(
        container,
        options = {}
    ) {
        if (!container) {
            return;
        }

        try {
            let assignments =
                await getAssignments();

            if (
                options.classId
            ) {
                assignments =
                    assignments.filter(
                        assignment =>
                            String(
                                assignment.classId
                            ) ===
                            String(
                                options.classId
                            )
                    );
            }

            if (
                options.sectionId
            ) {
                assignments =
                    assignments.filter(
                        assignment =>
                            String(
                                assignment.sectionId
                            ) ===
                            String(
                                options.sectionId
                            )
                    );
            }

            if (
                options.type
            ) {
                assignments =
                    assignments.filter(
                        assignment =>
                            assignment.type ===
                            options.type
                    );
            }

            if (
                options.search
            ) {
                const query =
                    String(
                        options.search
                    )
                        .toLowerCase()
                        .trim();

                assignments =
                    assignments.filter(
                        assignment =>
                            [
                                assignment.title,
                                assignment.description,
                                assignment.subject,
                                assignment.lesson
                            ]
                                .join(
                                    " "
                                )
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    );
            }

            if (
                options.status
            ) {
                assignments =
                    assignments.filter(
                        assignment => {
                            const state =
                                getAssignmentState(
                                    assignment
                                );

                            return (
                                state.key ===
                                options.status
                            );
                        }
                    );
            }

            const cards =
                [];

            for (
                const assignment of assignments
            ) {
                const statistics =
                    await getAssignmentStatistics(
                        assignment.id
                    );

                cards.push(
                    assignmentCardHTML(
                        assignment,
                        statistics
                    )
                );
            }

            container.innerHTML = `
                <div class="assignments-section">

                    <div class="assignments-header">

                        <div>
                            <span class="section-icon">
                                📚
                            </span>

                            <div>
                                <h2>
                                    الواجبات
                                </h2>

                                <p>
                                    إدارة الواجبات ودرجات الطلاب وحالة التسليم
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            class="btn-primary"
                            data-add-assignment
                        >
                            ➕ إضافة واجب
                        </button>

                    </div>

                    <div class="assignments-toolbar">

                        <div class="assignment-search-box">

                            <span>
                                🔎
                            </span>

                            <input
                                type="search"
                                id="assignmentSearch"
                                placeholder="ابحث عن واجب..."
                                value="${escapeHTML(
                                    options.search ||
                                    ""
                                )}"
                            >

                        </div>

                        <select
                            id="assignmentFilterStatus"
                        >
                            <option value="">
                                كل الحالات
                            </option>

                            <option value="upcoming">
                                🟢 قادم
                            </option>

                            <option value="soon">
                                🟠 قريباً
                            </option>

                            <option value="overdue">
                                🔴 منتهي
                            </option>
                        </select>

                        <select
                            id="assignmentFilterType"
                        >
                            <option value="">
                                كل الأنواع
                            </option>

                            ${Object.entries(
                                ASSIGNMENT_TYPES
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

                    <div
                        class="assignments-grid"
                        data-assignments-grid
                    >

                        ${
                            cards.length
                                ? cards.join(
                                    ""
                                )
                                : `
                                    <div class="assignments-empty glass-card">

                                        <div>
                                            📚
                                        </div>

                                        <h3>
                                            لا توجد واجبات
                                        </h3>

                                        <p>
                                            أضف أول واجب للصف لبدء المتابعة.
                                        </p>

                                        <button
                                            type="button"
                                            class="btn-primary"
                                            data-add-assignment
                                        >
                                            ➕ إضافة واجب
                                        </button>

                                    </div>
                                  `
                        }

                    </div>

                </div>
            `;

            bindAssignmentButtons(
                container
            );

            bindAssignmentFilters(
                container
            );
        } catch (error) {
            console.error(
                "renderAssignments:",
                error
            );

            container.innerHTML = `
                <div class="assignments-error glass-card">
                    ❌ تعذر تحميل قسم الواجبات.
                </div>
            `;
        }
    }

    /* ============================================================
       أزرار الواجبات
       ============================================================ */

    function bindAssignmentButtons(
        container = document
    ) {
        container
            .querySelectorAll(
                "[data-add-assignment]"
            )
            .forEach(
                button => {
                    button.onclick =
                        () =>
                            openAssignmentModal();
                }
            );

        container
            .querySelectorAll(
                "[data-assignment-view]"
            )
            .forEach(
                button => {
                    button.onclick =
                        () =>
                            showAssignmentDetails(
                                button.dataset
                                    .assignmentView
                            );
                }
            );

        container
            .querySelectorAll(
                "[data-assignment-edit]"
            )
            .forEach(
                button => {
                    button.onclick =
                        () =>
                            openAssignmentModal(
                                button.dataset
                                    .assignmentEdit
                            );
                }
            );

        container
            .querySelectorAll(
                "[data-assignment-delete]"
            )
            .forEach(
                button => {
                    button.onclick =
                        () =>
                            confirmDeleteAssignment(
                                button.dataset
                                    .assignmentDelete
                            );
                }
            );
    }

    /* ============================================================
       فلاتر الواجبات
       ============================================================ */

    function bindAssignmentFilters(
        container
    ) {
        const search =
            container.querySelector(
                "#assignmentSearch"
            );

        const status =
            container.querySelector(
                "#assignmentFilterStatus"
            );

        const type =
            container.querySelector(
                "#assignmentFilterType"
            );

        let timer = null;

        const apply =
            () => {
                clearTimeout(
                    timer
                );

                timer =
                    setTimeout(
                        () => {
                            const target =
                                container.querySelector(
                                    "[data-assignments-grid]"
                                );

                            if (!target) {
                                return;
                            }

                            renderAssignments(
                                container,
                                {
                                    search:
                                        search?.value ||
                                        "",

                                    status:
                                        status?.value ||
                                        "",

                                    type:
                                        type?.value ||
                                        ""
                                }
                            );
                        },
                        120
                    );
            };

        if (search) {
            search.addEventListener(
                "input",
                apply
            );
        }

        if (status) {
            status.addEventListener(
                "change",
                apply
            );
        }

        if (type) {
            type.addEventListener(
                "change",
                apply
            );
        }
    }

    /* ============================================================
       تحديث الواجهة تلقائياً
       ============================================================ */

    async function refreshAssignments() {
        const containers =
            document.querySelectorAll(
                "[data-assignments]"
            );

        for (
            const container of containers
        ) {
            const options = {
                classId:
                    container.dataset
                        .classId ||
                    null,

                sectionId:
                    container.dataset
                        .sectionId ||
                    null,

                search:
                    container.dataset
                        .search ||
                    "",

                status:
                    container.dataset
                        .status ||
                    "",

                type:
                    container.dataset
                        .type ||
                    ""
            };

            await renderAssignments(
                container,
                options
            );
        }

        document.dispatchEvent(
            new CustomEvent(
                "assignmentsUpdated",
                {
                    detail: {
                        time:
                            nowISO()
                    }
                }
            )
        );
    }

    /* ============================================================
       الواجبات القادمة
       ============================================================ */

    async function getUpcomingAssignments(
        limit = 10
    ) {
        const assignments =
            await getAssignments();

        const now =
            new Date();

        return assignments
            .filter(
                assignment => {
                    if (
                        !assignment.dueDate
                    ) {
                        return false;
                    }

                    const date =
                        new Date(
                            assignment.dueDate
                        );

                    return (
                        date >= now
                    );
                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        a.dueDate
                    ) -
                    new Date(
                        b.dueDate
                    )
            )
            .slice(
                0,
                limit
            );
    }

    /* ============================================================
       الواجبات المنتهية
       ============================================================ */

    async function getOverdueAssignments() {
        const assignments =
            await getAssignments();

        return assignments.filter(
            assignment =>
                getAssignmentState(
                    assignment
                ).key ===
                "overdue"
        );
    }

    /* ============================================================
       عدد الواجبات للطالب
       ============================================================ */

    async function getStudentAssignmentStatistics(
        studentId
    ) {
        const submissions =
            await getSubmissions();

        const studentSubmissions =
            submissions.filter(
                submission =>
                    String(
                        submission.studentId
                    ) ===
                    String(
                        studentId
                    )
            );

        let submitted = 0;
        let pending = 0;
        let late = 0;
        let excused = 0;

        const grades =
            [];

        studentSubmissions.forEach(
            submission => {
                switch (
                    submission.status
                ) {
                    case "submitted":
                        submitted++;
                        break;

                    case "late":
                        late++;
                        break;

                    case "excused":
                        excused++;
                        break;

                    default:
                        pending++;
                        break;
                }

                if (
                    submission.grade !==
                    null &&
                    submission.grade !==
                    undefined
                ) {
                    grades.push(
                        safeNumber(
                            submission.grade
                        )
                    );
                }
            }
        );

        const average =
            grades.length
                ? grades.reduce(
                    (
                        sum,
                        grade
                    ) =>
                        sum + grade,
                    0
                ) /
                grades.length
                : 0;

        return {
            total:
                studentSubmissions.length,

            submitted,

            pending,

            late,

            excused,

            graded:
                grades.length,

            average:
                Math.round(
                    average *
                    100
                ) / 100
        };
    }

    /* ============================================================
       تقرير الطالب
       ============================================================ */

    async function getStudentAssignmentReport(
        studentId
    ) {
        const submissions =
            await getSubmissions();

        const assignments =
            await getAssignments();

        const assignmentMap =
            new Map();

        assignments.forEach(
            assignment => {
                assignmentMap.set(
                    String(
                        assignment.id
                    ),
                    assignment
                );
            }
        );

        return submissions
            .filter(
                submission =>
                    String(
                        submission.studentId
                    ) ===
                    String(
                        studentId
                    )
            )
            .map(
                submission => ({
                    ...submission,

                    assignment:
                        assignmentMap.get(
                            String(
                                submission.assignmentId
                            )
                        ) ||
                        null
                })
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.updatedAt
                    ) -
                    new Date(
                        a.updatedAt
                    )
            );
    }

    /* ============================================================
       تصدير تقرير الواجبات CSV
       ============================================================ */

    function rowsToCSV(
        rows
    ) {
        const escapeCSV =
            value => {
                const text =
                    String(
                        value ??
                        ""
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

        return rows
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

    async function exportAssignmentCSV(
        assignmentId
    ) {
        const assignment =
            await getRecord(
                STORE_ASSIGNMENTS,
                assignmentId
            );

        if (!assignment) {
            notify(
                "الواجب غير موجود",
                "error"
            );

            return;
        }

        const submissions =
            await getAssignmentSubmissions(
                assignmentId
            );

        const students =
            await getAllRecords(
                STORE_STUDENTS
            );

        const studentMap =
            new Map();

        students.forEach(
            student => {
                studentMap.set(
                    String(
                        student.id
                    ),
                    student
                );
            }
        );

        const headers = [
            "#",
            "اسم الطالب",
            "الحالة",
            "الدرجة",
            "الدرجة القصوى",
            "النسبة",
            "وقت التسليم",
            "الملاحظة"
        ];

        const rows =
            submissions.map(
                (
                    submission,
                    index
                ) => {
                    const student =
                        studentMap.get(
                            String(
                                submission.studentId
                            )
                        );

                    const percentage =
                        calculateAssignmentPercentage(
                            submission.grade,
                            submission.maxGrade
                        );

                    return [
                        index + 1,

                        student?.fullName ||
                        student?.name ||
                        "غير معروف",

                        SUBMISSION_STATUS[
                            submission.status
                        ]?.label ||
                        "لم يسلم",

                        submission.grade ??
                        "",

                        submission.maxGrade,

                        percentage + "%",

                        submission.submittedAt
                            ? formatDateTime(
                                submission.submittedAt
                            )
                            : "",

                        submission.note ||
                        ""
                    ];
                }
            );

        const csv =
            "\uFEFF" +
            rowsToCSV(
                [
                    headers,
                    ...rows
                ]
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
            `assignment_${assignment.id}_${Date.now()}.csv`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        notify(
            "تم تصدير تقرير الواجب",
            "success"
        );
    }

    /* ============================================================
       تصدير تقرير الطالب
       ============================================================ */

    async function exportStudentAssignmentsCSV(
        studentId
    ) {
        const report =
            await getStudentAssignmentReport(
                studentId
            );

        const headers = [
            "#",
            "الواجب",
            "النوع",
            "التاريخ",
            "الحالة",
            "الدرجة",
            "الدرجة القصوى",
            "النسبة",
            "الملاحظة"
        ];

        const rows =
            report.map(
                (
                    item,
                    index
                ) => {
                    const assignment =
                        item.assignment;

                    return [
                        index + 1,

                        assignment?.title ||
                        "واجب محذوف",

                        ASSIGNMENT_TYPES[
                            assignment?.type
                        ]?.label ||
                        "",

                        formatDate(
                            assignment?.dueDate
                        ),

                        SUBMISSION_STATUS[
                            item.status
                        ]?.label ||
                        "",

                        item.grade ??
                        "",

                        item.maxGrade ??
                        "",

                        calculateAssignmentPercentage(
                            item.grade,
                            item.maxGrade
                        ) + "%",

                        item.note ||
                        ""
                    ];
                }
            );

        const csv =
            "\uFEFF" +
            rowsToCSV(
                [
                    headers,
                    ...rows
                ]
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
            `student_assignments_${studentId}_${Date.now()}.csv`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        notify(
            "تم تصدير تقرير الطالب",
            "success"
        );
    }

    /* ============================================================
       استيراد واجبات JSON
       ============================================================ */

    async function importAssignmentsJSON(
        json
    ) {
        try {
            const parsed =
                typeof json ===
                "string"
                    ? JSON.parse(
                        json
                    )
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

            let count = 0;

            for (
                const item of parsed
            ) {
                const assignment =
                    createAssignmentObject(
                        item
                    );

                await putRecord(
                    STORE_ASSIGNMENTS,
                    assignment
                );

                await initializeAssignmentSubmissions(
                    assignment
                );

                count++;
            }

            await refreshAssignments();

            notify(
                `تم استيراد ${count} واجب`,
                "success"
            );

            return count;
        } catch (error) {
            console.error(
                "importAssignmentsJSON:",
                error
            );

            notify(
                "فشل استيراد الواجبات",
                "error"
            );

            return 0;
        }
    }

    /* ============================================================
       تصدير جميع الواجبات JSON
       ============================================================ */

    async function exportAssignmentsJSON() {
        const assignments =
            await getAssignments();

        const submissions =
            await getSubmissions();

        const data = {
            version: 1,

            exportedAt:
                nowISO(),

            assignments,

            submissions
        };

        const blob =
            new Blob(
                [
                    JSON.stringify(
                        data,
                        null,
                        2
                    )
                ],
                {
                    type:
                        "application/json;charset=utf-8"
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
            `assignments_backup_${Date.now()}.json`;

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        notify(
            "تم إنشاء نسخة احتياطية للواجبات",
            "success"
        );
    }

    /* ============================================================
       حذف كل واجبات الصف
       ============================================================ */

    async function deleteClassAssignments(
        classId
    ) {
        const assignments =
            await getClassAssignments(
                classId
            );

        const confirmed =
            window.confirm(
                `سيتم حذف ${assignments.length} واجب. هل أنت متأكد؟`
            );

        if (!confirmed) {
            return false;
        }

        for (
            const assignment of assignments
        ) {
            await removeAssignment(
                assignment.id
            );
        }

        notify(
            "تم حذف واجبات الصف",
            "success"
        );

        return true;
    }

    /* ============================================================
       API العامة
       ============================================================ */

    window.AssignmentsSystem = {

        DB_NAME,

        ASSIGNMENT_TYPES,

        SUBMISSION_STATUS,

        openDatabase,

        createAssignmentObject,

        addAssignment,

        updateAssignment,

        removeAssignment,

        getAssignments,

        getClassAssignments,

        getSectionAssignments,

        searchAssignments,

        getAssignmentState,

        getSubmissions,

        getAssignmentSubmissions,

        getStudentAssignmentSubmission,

        markSubmitted,

        markPending,

        markLate,

        markExcused,

        setAssignmentGrade,

        clearAssignmentGrade,

        calculateAssignmentPercentage,

        getAssignmentStatistics,

        getUpcomingAssignments,

        getOverdueAssignments,

        getStudentAssignmentStatistics,

        getStudentAssignmentReport,

        initializeAssignmentSubmissions,

        openAssignmentModal,

        closeAssignmentModal,

        showAssignmentDetails,

        renderAssignments,

        refreshAssignments,

        exportAssignmentCSV,

        exportStudentAssignmentsCSV,

        importAssignmentsJSON,

        exportAssignmentsJSON,

        deleteClassAssignments,

        formatDate,

        formatDateTime
    };

    /* ============================================================
       أحداث عامة للأزرار
       ============================================================ */

    document.addEventListener(
        "click",
        event => {

            const addButton =
                event.target.closest(
                    "[data-add-assignment]"
                );

            if (addButton) {
                openAssignmentModal();

                return;
            }

            const viewButton =
                event.target.closest(
                    "[data-assignment-view]"
                );

            if (viewButton) {
                showAssignmentDetails(
                    viewButton.dataset
                        .assignmentView
                );

                return;
            }

            const editButton =
                event.target.closest(
                    "[data-assignment-edit]"
                );

            if (editButton) {
                openAssignmentModal(
                    editButton.dataset
                        .assignmentEdit
                );

                return;
            }

            const deleteButton =
                event.target.closest(
                    "[data-assignment-delete]"
                );

            if (deleteButton) {
                confirmDeleteAssignment(
                    deleteButton.dataset
                        .assignmentDelete
                );
            }
        }
    );

    /* ============================================================
       التشغيل الأولي
       ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        async () => {
            try {
                await openDatabase();

                console.log(
                    "Assignments system initialized."
                );

                await refreshAssignments();
            } catch (error) {
                console.error(
                    "Assignments initialization failed:",
                    error
                );
            }
        }
    );

})();