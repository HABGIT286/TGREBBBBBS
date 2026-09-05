/* =========================================================
   TEACHER PRO
   js/database.js
   IndexedDB Database Engine
   الإصدار: 1.0.0
   ========================================================= */

"use strict";

/* =========================================================
   DATABASE CONFIGURATION
   ========================================================= */

const TP_DB_NAME = "TeacherProDatabase";

const TP_DB_VERSION = 1;

let TP_DB = null;


/* =========================================================
   STORE NAMES
   ========================================================= */

const TP_STORES = {

    settings: "settings",

    students: "students",

    classes: "classes",

    sections: "sections",

    attendance: "attendance",

    grades: "grades",

    gradeColumns: "gradeColumns",

    gradeFormulas: "gradeFormulas",

    assignments: "assignments",

    exams: "exams",

    schedule: "schedule",

    notes: "notes",

    reminders: "reminders",

    tips: "tips",

    messages: "messages",

    contacts: "contacts",

    themes: "themes",

    backups: "backups",

    logs: "logs",

    notifications: "notifications",

    appData: "appData"

};


/* =========================================================
   DATABASE OPEN
   ========================================================= */

function openTeacherDatabase() {

    return new Promise((resolve, reject) => {

        if (!window.indexedDB) {

            reject(
                new Error(
                    "IndexedDB غير مدعوم في هذا المتصفح."
                )
            );

            return;
        }


        const request =
            indexedDB.open(
                TP_DB_NAME,
                TP_DB_VERSION
            );


        request.onupgradeneeded = function(event) {

            const db =
                event.target.result;


            createStores(db);

        };


        request.onsuccess = function(event) {

            TP_DB =
                event.target.result;


            TP_DB.onversionchange = function() {

                TP_DB.close();

            };


            resolve(TP_DB);

        };


        request.onerror = function(event) {

            reject(
                event.target.error ||
                new Error(
                    "تعذر فتح قاعدة البيانات."
                )
            );

        };


        request.onblocked = function() {

            console.warn(
                "قاعدة البيانات قيد الاستخدام من نافذة أخرى."
            );

        };

    });

}


/* =========================================================
   CREATE ALL STORES
   ========================================================= */

function createStores(db) {


    /* =====================================================
       SETTINGS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.settings)) {

        const store =
            db.createObjectStore(
                TP_STORES.settings,
                {
                    keyPath: "key"
                }
            );

        store.createIndex(
            "category",
            "category",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       STUDENTS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.students)) {

        const store =
            db.createObjectStore(
                TP_STORES.students,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

        store.createIndex(
            "fullName",
            "fullName",
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
            "studentNumber",
            "studentNumber",
            {
                unique: false
            }
        );

        store.createIndex(
            "parentPhone",
            "parentPhone",
            {
                unique: false
            }
        );

        store.createIndex(
            "active",
            "active",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       CLASSES
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.classes)) {

        const store =
            db.createObjectStore(
                TP_STORES.classes,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

        store.createIndex(
            "name",
            "name",
            {
                unique: false
            }
        );

        store.createIndex(
            "stage",
            "stage",
            {
                unique: false
            }
        );

        store.createIndex(
            "academicYear",
            "academicYear",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       SECTIONS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.sections)) {

        const store =
            db.createObjectStore(
                TP_STORES.sections,
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
            "name",
            "name",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       ATTENDANCE
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.attendance)) {

        const store =
            db.createObjectStore(
                TP_STORES.attendance,
                {
                    keyPath: "id",
                    autoIncrement: true
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
            "date",
            "date",
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

    }


    /* =====================================================
       GRADES
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.grades)) {

        const store =
            db.createObjectStore(
                TP_STORES.grades,
                {
                    keyPath: "id",
                    autoIncrement: true
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
            "columnId",
            "columnId",
            {
                unique: false
            }
        );

        store.createIndex(
            "term",
            "term",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       GRADE COLUMNS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.gradeColumns)) {

        const store =
            db.createObjectStore(
                TP_STORES.gradeColumns,
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
            "code",
            "code",
            {
                unique: false
            }
        );

        store.createIndex(
            "term",
            "term",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       GRADE FORMULAS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.gradeFormulas)) {

        const store =
            db.createObjectStore(
                TP_STORES.gradeFormulas,
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
            "name",
            "name",
            {
                unique: false
            }
        );

        store.createIndex(
            "active",
            "active",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       ASSIGNMENTS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.assignments)) {

        const store =
            db.createObjectStore(
                TP_STORES.assignments,
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
            "date",
            "date",
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

    }


    /* =====================================================
       EXAMS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.exams)) {

        const store =
            db.createObjectStore(
                TP_STORES.exams,
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
            "date",
            "date",
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
            "status",
            "status",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       SCHEDULE
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.schedule)) {

        const store =
            db.createObjectStore(
                TP_STORES.schedule,
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
            "day",
            "day",
            {
                unique: false
            }
        );

        store.createIndex(
            "period",
            "period",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       NOTES
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.notes)) {

        const store =
            db.createObjectStore(
                TP_STORES.notes,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

        store.createIndex(
            "scope",
            "scope",
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
            "studentId",
            "studentId",
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

        store.createIndex(
            "createdAt",
            "createdAt",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       REMINDERS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.reminders)) {

        const store =
            db.createObjectStore(
                TP_STORES.reminders,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

        store.createIndex(
            "date",
            "date",
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
            "active",
            "active",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       TEACHING TIPS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.tips)) {

        const store =
            db.createObjectStore(
                TP_STORES.tips,
                {
                    keyPath: "id",
                    autoIncrement: true
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
            "active",
            "active",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       MESSAGES
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.messages)) {

        const store =
            db.createObjectStore(
                TP_STORES.messages,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

        store.createIndex(
            "studentName",
            "studentName",
            {
                unique: false
            }
        );

        store.createIndex(
            "className",
            "className",
            {
                unique: false
            }
        );

        store.createIndex(
            "sectionName",
            "sectionName",
            {
                unique: false
            }
        );

        store.createIndex(
            "parentType",
            "parentType",
            {
                unique: false
            }
        );

        store.createIndex(
            "fingerprint",
            "fingerprint",
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


    /* =====================================================
       CONTACTS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.contacts)) {

        const store =
            db.createObjectStore(
                TP_STORES.contacts,
                {
                    keyPath: "id",
                    autoIncrement: true
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
            "enabled",
            "enabled",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       THEMES
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.themes)) {

        const store =
            db.createObjectStore(
                TP_STORES.themes,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

        store.createIndex(
            "name",
            "name",
            {
                unique: false
            }
        );

        store.createIndex(
            "active",
            "active",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       BACKUPS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.backups)) {

        const store =
            db.createObjectStore(
                TP_STORES.backups,
                {
                    keyPath: "id",
                    autoIncrement: true
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


    /* =====================================================
       LOGS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.logs)) {

        const store =
            db.createObjectStore(
                TP_STORES.logs,
                {
                    keyPath: "id",
                    autoIncrement: true
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
            "createdAt",
            "createdAt",
            {
                unique: false
            }
        );

        store.createIndex(
            "fingerprint",
            "fingerprint",
            {
                unique: false
            }
        );

    }


    /* =====================================================
       NOTIFICATIONS
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.notifications)) {

        const store =
            db.createObjectStore(
                TP_STORES.notifications,
                {
                    keyPath: "id",
                    autoIncrement: true
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
            "read",
            "read",
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


    /* =====================================================
       APP DATA
       ===================================================== */

    if (!db.objectStoreNames.contains(TP_STORES.appData)) {

        const store =
            db.createObjectStore(
                TP_STORES.appData,
                {
                    keyPath: "key"
                }
            );

        store.createIndex(
            "category",
            "category",
            {
                unique: false
            }
        );

    }

}


/* =========================================================
   ENSURE DATABASE
   ========================================================= */

async function ensureDatabase() {

    if (TP_DB) {

        return TP_DB;

    }

    return await openTeacherDatabase();

}


/* =========================================================
   GENERIC ADD
   ========================================================= */

async function dbAdd(storeName, data) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
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
            function() {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   GENERIC PUT
   ========================================================= */

async function dbPut(storeName, data) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
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
            function() {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   GENERIC GET
   ========================================================= */

async function dbGet(storeName, key) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readonly"
            );


        const store =
            transaction.objectStore(
                storeName
            );


        const request =
            store.get(key);


        request.onsuccess =
            function() {

                resolve(
                    request.result || null
                );

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   GENERIC DELETE
   ========================================================= */

async function dbDelete(storeName, key) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                storeName
            );


        const request =
            store.delete(key);


        request.onsuccess =
            function() {

                resolve(true);

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   GET ALL
   ========================================================= */

async function dbGetAll(storeName) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
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
            function() {

                resolve(
                    request.result || []
                );

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   COUNT
   ========================================================= */

async function dbCount(storeName) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readonly"
            );


        const store =
            transaction.objectStore(
                storeName
            );


        const request =
            store.count();


        request.onsuccess =
            function() {

                resolve(
                    request.result
                );

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   CLEAR STORE
   ========================================================= */

async function dbClear(storeName) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readwrite"
            );


        const store =
            transaction.objectStore(
                storeName
            );


        const request =
            store.clear();


        request.onsuccess =
            function() {

                resolve(true);

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   INDEX QUERY
   ========================================================= */

async function dbGetByIndex(
    storeName,
    indexName,
    value
) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeName,
                "readonly"
            );


        const store =
            transaction.objectStore(
                storeName
            );


        const index =
            store.index(
                indexName
            );


        const request =
            index.getAll(value);


        request.onsuccess =
            function() {

                resolve(
                    request.result || []
                );

            };


        request.onerror =
            function() {

                reject(
                    request.error
                );

            };

    });

}


/* =========================================================
   GENERIC TRANSACTION
   ========================================================= */

async function dbTransaction(
    storeNames,
    mode,
    callback
) {

    const db =
        await ensureDatabase();


    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                storeNames,
                mode
            );


        let result;


        try {

            result =
                callback(
                    transaction
                );

        } catch(error) {

            reject(error);

            return;

        }


        transaction.oncomplete =
            function() {

                resolve(result);

            };


        transaction.onerror =
            function() {

                reject(
                    transaction.error
                );

            };


        transaction.onabort =
            function() {

                reject(
                    transaction.error ||
                    new Error(
                        "تم إلغاء العملية."
                    )
                );

            };

    });

}


/* =========================================================
   SETTINGS API
   ========================================================= */

async function saveSetting(
    key,
    value,
    category = "general"
) {

    return await dbPut(
        TP_STORES.settings,
        {
            key,
            value,
            category,
            updatedAt:
                new Date().toISOString()
        }
    );

}


async function getSetting(
    key,
    defaultValue = null
) {

    const item =
        await dbGet(
            TP_STORES.settings,
            key
        );


    if (!item) {

        return defaultValue;

    }


    return item.value;

}


async function deleteSetting(key) {

    return await dbDelete(
        TP_STORES.settings,
        key
    );

}


/* =========================================================
   STUDENT API
   ========================================================= */

async function addStudent(student) {

    const now =
        new Date().toISOString();


    const data = {

        fullName:
            student.fullName || "",

        studentNumber:
            student.studentNumber || "",

        classId:
            student.classId ?? null,

        sectionId:
            student.sectionId ?? null,

        dailyGrade:
            Number(student.dailyGrade || 0),

        monthOne:
            Number(student.monthOne || 0),

        monthTwo:
            Number(student.monthTwo || 0),

        semesterGrade:
            Number(student.semesterGrade || 0),

        exemption:
            student.exemption || "",

        oralGrade:
            Number(student.oralGrade || 0),

        finalGrade:
            Number(student.finalGrade || 0),

        parentPhone:
            student.parentPhone || "",

        notes:
            student.notes || "",

        active:
            student.active !== false,

        createdAt:
            now,

        updatedAt:
            now

    };


    return await dbAdd(
        TP_STORES.students,
        data
    );

}


async function updateStudent(
    id,
    changes
) {

    const student =
        await dbGet(
            TP_STORES.students,
            id
        );


    if (!student) {

        throw new Error(
            "الطالب غير موجود."
        );

    }


    const updated = {

        ...student,

        ...changes,

        id,

        updatedAt:
            new Date().toISOString()

    };


    return await dbPut(
        TP_STORES.students,
        updated
    );

}


async function deleteStudent(id) {

    return await dbDelete(
        TP_STORES.students,
        id
    );

}


async function getStudent(id) {

    return await dbGet(
        TP_STORES.students,
        id
    );

}


async function getStudents() {

    return await dbGetAll(
        TP_STORES.students
    );

}


async function getStudentsByClass(
    classId
) {

    return await dbGetByIndex(
        TP_STORES.students,
        "classId",
        classId
    );

}


async function getStudentsBySection(
    sectionId
) {

    return await dbGetByIndex(
        TP_STORES.students,
        "sectionId",
        sectionId
    );

}


/* =========================================================
   CLASS API
   ========================================================= */

async function addClass(classData) {

    const now =
        new Date().toISOString();


    return await dbAdd(
        TP_STORES.classes,
        {

            name:
                classData.name || "",

            stage:
                classData.stage || "",

            academicYear:
                classData.academicYear || "",

            subject:
                classData.subject || "",

            teacher:
                classData.teacher || "",

            notes:
                classData.notes || "",

            createdAt:
                now,

            updatedAt:
                now

        }
    );

}


async function updateClass(
    id,
    changes
) {

    const item =
        await dbGet(
            TP_STORES.classes,
            id
        );


    if (!item) {

        throw new Error(
            "الصف غير موجود."
        );

    }


    return await dbPut(
        TP_STORES.classes,
        {

            ...item,

            ...changes,

            id,

            updatedAt:
                new Date().toISOString()

        }
    );

}


async function deleteClass(id) {

    return await dbDelete(
        TP_STORES.classes,
        id
    );

}


async function getClasses() {

    return await dbGetAll(
        TP_STORES.classes
    );

}


/* =========================================================
   SECTION API
   ========================================================= */

async function addSection(sectionData) {

    return await dbAdd(
        TP_STORES.sections,
        {

            classId:
                sectionData.classId,

            name:
                sectionData.name || "",

            capacity:
                Number(
                    sectionData.capacity || 0
                ),

            notes:
                sectionData.notes || "",

            createdAt:
                new Date().toISOString()

        }
    );

}


async function updateSection(
    id,
    changes
) {

    const item =
        await dbGet(
            TP_STORES.sections,
            id
        );


    if (!item) {

        throw new Error(
            "الشعبة غير موجودة."
        );

    }


    return await dbPut(
        TP_STORES.sections,
        {

            ...item,

            ...changes,

            id,

            updatedAt:
                new Date().toISOString()

        }
    );

}


async function deleteSection(id) {

    return await dbDelete(
        TP_STORES.sections,
        id
    );

}


async function getSections() {

    return await dbGetAll(
        TP_STORES.sections
    );

}


async function getSectionsByClass(
    classId
) {

    return await dbGetByIndex(
        TP_STORES.sections,
        "classId",
        classId
    );

}


/* =========================================================
   ATTENDANCE API
   ========================================================= */

async function saveAttendance(
    attendance
) {

    const data = {

        studentId:
            attendance.studentId,

        classId:
            attendance.classId ?? null,

        sectionId:
            attendance.sectionId ?? null,

        date:
            attendance.date ||
            new Date().toISOString().slice(0, 10),

        status:
            attendance.status || "present",

        note:
            attendance.note || "",

        createdAt:
            attendance.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (attendance.id) {

        data.id =
            attendance.id;

        return await dbPut(
            TP_STORES.attendance,
            data
        );

    }


    return await dbAdd(
        TP_STORES.attendance,
        data
    );

}


async function getStudentAttendance(
    studentId
) {

    return await dbGetByIndex(
        TP_STORES.attendance,
        "studentId",
        studentId
    );

}


async function getAttendanceByDate(
    date
) {

    return await dbGetByIndex(
        TP_STORES.attendance,
        "date",
        date
    );

}


/* =========================================================
   GRADE COLUMN API
   ========================================================= */

async function addGradeColumn(
    column
) {

    return await dbAdd(
        TP_STORES.gradeColumns,
        {

            classId:
                column.classId ?? null,

            sectionId:
                column.sectionId ?? null,

            code:
                column.code || "",

            name:
                column.name || "",

            max:
                Number(column.max || 100),

            term:
                column.term || "general",

            type:
                column.type || "grade",

            order:
                Number(column.order || 0),

            createdAt:
                new Date().toISOString()

        }
    );

}


async function updateGradeColumn(
    id,
    changes
) {

    const item =
        await dbGet(
            TP_STORES.gradeColumns,
            id
        );


    if (!item) {

        throw new Error(
            "عمود الدرجة غير موجود."
        );

    }


    return await dbPut(
        TP_STORES.gradeColumns,
        {

            ...item,

            ...changes,

            id,

            updatedAt:
                new Date().toISOString()

        }
    );

}


async function deleteGradeColumn(
    id
) {

    return await dbDelete(
        TP_STORES.gradeColumns,
        id
    );

}


async function getGradeColumns(
    classId
) {

    return await dbGetByIndex(
        TP_STORES.gradeColumns,
        "classId",
        classId
    );

}


/* =========================================================
   GRADES API
   ========================================================= */

async function saveGrade(grade) {

    const data = {

        studentId:
            grade.studentId,

        classId:
            grade.classId ?? null,

        sectionId:
            grade.sectionId ?? null,

        columnId:
            grade.columnId ?? null,

        code:
            grade.code || "",

        value:
            Number(grade.value || 0),

        max:
            Number(grade.max || 100),

        term:
            grade.term || "general",

        note:
            grade.note || "",

        createdAt:
            grade.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (grade.id) {

        data.id =
            grade.id;

        return await dbPut(
            TP_STORES.grades,
            data
        );

    }


    return await dbAdd(
        TP_STORES.grades,
        data
    );

}


async function getStudentGrades(
    studentId
) {

    return await dbGetByIndex(
        TP_STORES.grades,
        "studentId",
        studentId
    );

}


async function getGradesByColumn(
    columnId
) {

    return await dbGetByIndex(
        TP_STORES.grades,
        "columnId",
        columnId
    );

}


/* =========================================================
   FORMULA API
   ========================================================= */

async function saveGradeFormula(
    formula
) {

    const data = {

        name:
            formula.name || "المعادلة",

        classId:
            formula.classId ?? null,

        expression:
            formula.expression || "",

        description:
            formula.description || "",

        active:
            formula.active !== false,

        createdAt:
            formula.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (formula.id) {

        data.id =
            formula.id;

        return await dbPut(
            TP_STORES.gradeFormulas,
            data
        );

    }


    return await dbAdd(
        TP_STORES.gradeFormulas,
        data
    );

}


async function getGradeFormulas(
    classId
) {

    return await dbGetByIndex(
        TP_STORES.gradeFormulas,
        "classId",
        classId
    );

}


/* =========================================================
   ASSIGNMENTS API
   ========================================================= */

async function saveAssignment(
    assignment
) {

    const data = {

        title:
            assignment.title || "",

        description:
            assignment.description || "",

        classId:
            assignment.classId ?? null,

        sectionId:
            assignment.sectionId ?? null,

        date:
            assignment.date || "",

        dueDate:
            assignment.dueDate || "",

        maxGrade:
            Number(
                assignment.maxGrade || 100
            ),

        status:
            assignment.status || "active",

        notes:
            assignment.notes || "",

        createdAt:
            assignment.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (assignment.id) {

        data.id =
            assignment.id;

        return await dbPut(
            TP_STORES.assignments,
            data
        );

    }


    return await dbAdd(
        TP_STORES.assignments,
        data
    );

}


async function getAssignments() {

    return await dbGetAll(
        TP_STORES.assignments
    );

}


/* =========================================================
   EXAMS API
   ========================================================= */

async function saveExam(exam) {

    const data = {

        title:
            exam.title || "",

        type:
            exam.type || "exam",

        subject:
            exam.subject || "",

        classId:
            exam.classId ?? null,

        sectionId:
            exam.sectionId ?? null,

        date:
            exam.date || "",

        time:
            exam.time || "",

        duration:
            Number(
                exam.duration || 0
            ),

        maxGrade:
            Number(
                exam.maxGrade || 100
            ),

        room:
            exam.room || "",

        notes:
            exam.notes || "",

        status:
            exam.status || "scheduled",

        createdAt:
            exam.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (exam.id) {

        data.id =
            exam.id;

        return await dbPut(
            TP_STORES.exams,
            data
        );

    }


    return await dbAdd(
        TP_STORES.exams,
        data
    );

}


async function getExams() {

    return await dbGetAll(
        TP_STORES.exams
    );

}


/* =========================================================
   SCHEDULE API
   ========================================================= */

async function saveScheduleItem(
    item
) {

    const data = {

        classId:
            item.classId ?? null,

        sectionId:
            item.sectionId ?? null,

        day:
            item.day || "",

        period:
            item.period || "",

        subject:
            item.subject || "",

        lesson:
            item.lesson || "",

        topic:
            item.topic || "",

        startTime:
            item.startTime || "",

        endTime:
            item.endTime || "",

        room:
            item.room || "",

        notes:
            item.notes || "",

        createdAt:
            item.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (item.id) {

        data.id =
            item.id;

        return await dbPut(
            TP_STORES.schedule,
            data
        );

    }


    return await dbAdd(
        TP_STORES.schedule,
        data
    );

}


async function getSchedule() {

    return await dbGetAll(
        TP_STORES.schedule
    );

}


async function getScheduleByClass(
    classId
) {

    return await dbGetByIndex(
        TP_STORES.schedule,
        "classId",
        classId
    );

}


/* =========================================================
   NOTES API
   ========================================================= */

async function saveNote(note) {

    const data = {

        title:
            note.title || "",

        content:
            note.content || "",

        scope:
            note.scope || "general",

        classId:
            note.classId ?? null,

        sectionId:
            note.sectionId ?? null,

        studentId:
            note.studentId ?? null,

        pinned:
            note.pinned === true,

        color:
            note.color || "primary",

        createdAt:
            note.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (note.id) {

        data.id =
            note.id;

        return await dbPut(
            TP_STORES.notes,
            data
        );

    }


    return await dbAdd(
        TP_STORES.notes,
        data
    );

}


async function getNotes() {

    return await dbGetAll(
        TP_STORES.notes
    );

}


async function getStudentNotes(
    studentId
) {

    return await dbGetByIndex(
        TP_STORES.notes,
        "studentId",
        studentId
    );

}


/* =========================================================
   REMINDERS API
   ========================================================= */

async function saveReminder(
    reminder
) {

    const data = {

        title:
            reminder.title || "",

        content:
            reminder.content || "",

        date:
            reminder.date || "",

        time:
            reminder.time || "",

        classId:
            reminder.classId ?? null,

        sectionId:
            reminder.sectionId ?? null,

        scope:
            reminder.scope || "general",

        active:
            reminder.active !== false,

        pinned:
            reminder.pinned === true,

        createdAt:
            reminder.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (reminder.id) {

        data.id =
            reminder.id;

        return await dbPut(
            TP_STORES.reminders,
            data
        );

    }


    return await dbAdd(
        TP_STORES.reminders,
        data
    );

}


async function getReminders() {

    return await dbGetAll(
        TP_STORES.reminders
    );

}


/* =========================================================
   TEACHING TIPS API
   ========================================================= */

async function saveTip(tip) {

    const data = {

        title:
            tip.title || "",

        content:
            tip.content || "",

        category:
            tip.category || "general",

        icon:
            tip.icon || "💡",

        active:
            tip.active !== false,

        createdAt:
            tip.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (tip.id) {

        data.id =
            tip.id;

        return await dbPut(
            TP_STORES.tips,
            data
        );

    }


    return await dbAdd(
        TP_STORES.tips,
        data
    );

}


async function getTips() {

    return await dbGetAll(
        TP_STORES.tips
    );

}


/* =========================================================
   CONTACTS API
   ========================================================= */

async function saveContact(
    contact
) {

    const data = {

        type:
            contact.type || "",

        name:
            contact.name || "",

        value:
            contact.value || "",

        icon:
            contact.icon || "",

        enabled:
            contact.enabled !== false,

        createdAt:
            contact.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (contact.id) {

        data.id =
            contact.id;

        return await dbPut(
            TP_STORES.contacts,
            data
        );

    }


    return await dbAdd(
        TP_STORES.contacts,
        data
    );

}


async function getContacts() {

    return await dbGetAll(
        TP_STORES.contacts
    );

}


/* =========================================================
   THEMES API
   ========================================================= */

async function saveTheme(
    theme
) {

    const data = {

        name:
            theme.name || "",

        value:
            theme.value || "",

        active:
            theme.active === true,

        createdAt:
            theme.createdAt ||
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    };


    if (theme.id) {

        data.id =
            theme.id;

        return await dbPut(
            TP_STORES.themes,
            data
        );

    }


    return await dbAdd(
        TP_STORES.themes,
        data
    );

}


async function getThemes() {

    return await dbGetAll(
        TP_STORES.themes
    );

}


/* =========================================================
   MESSAGE API
   ========================================================= */

async function saveMessage(
    message
) {

    const data = {

        code:
            message.code ||
            generateMessageCode(),

        studentName:
            message.studentName || "",

        parentType:
            message.parentType || "",

        className:
            message.className || "",

        sectionName:
            message.sectionName || "",

        content:
            message.content || "",

        fingerprint:
            message.fingerprint || "",

        userAgent:
            message.userAgent ||
            navigator.userAgent,

        platform:
            message.platform ||
            navigator.platform,

        language:
            message.language ||
            navigator.language,

        createdAt:
            message.createdAt ||
            new Date().toISOString(),

        sent:
            message.sent === true

    };


    if (message.id) {

        data.id =
            message.id;

        return await dbPut(
            TP_STORES.messages,
            data
        );

    }


    return await dbAdd(
        TP_STORES.messages,
        data
    );

}


async function getMessages() {

    return await dbGetAll(
        TP_STORES.messages
    );

}


/* =========================================================
   NOTIFICATION API
   ========================================================= */

async function addNotification(
    notification
) {

    return await dbAdd(
        TP_STORES.notifications,
        {

            type:
                notification.type || "info",

            title:
                notification.title || "",

            message:
                notification.message || "",

            read:
                false,

            data:
                notification.data || null,

            createdAt:
                new Date().toISOString()

        }
    );

}


async function getNotifications() {

    return await dbGetAll(
        TP_STORES.notifications
    );

}


async function markNotificationRead(
    id
) {

    const item =
        await dbGet(
            TP_STORES.notifications,
            id
        );


    if (!item) {

        return false;

    }


    item.read =
        true;


    return await dbPut(
        TP_STORES.notifications,
        item
    );

}


/* =========================================================
   LOG API
   ========================================================= */

async function addLog(log) {

    return await dbAdd(
        TP_STORES.logs,
        {

            type:
                log.type || "system",

            action:
                log.action || "",

            description:
                log.description || "",

            studentId:
                log.studentId ?? null,

            fingerprint:
                log.fingerprint || "",

            data:
                log.data || null,

            createdAt:
                new Date().toISOString()

        }
    );

}


/* =========================================================
   APP DATA API
   ========================================================= */

async function saveAppData(
    key,
    value,
    category = "general"
) {

    return await dbPut(
        TP_STORES.appData,
        {

            key,

            value,

            category,

            updatedAt:
                new Date().toISOString()

        }
    );

}


async function getAppData(
    key,
    defaultValue = null
) {

    const item =
        await dbGet(
            TP_STORES.appData,
            key
        );


    if (!item) {

        return defaultValue;

    }


    return item.value;

}


/* =========================================================
   BACKUP API
   ========================================================= */

async function createDatabaseBackup() {

    const backup = {

        version:
            TP_DB_VERSION,

        database:
            TP_DB_NAME,

        createdAt:
            new Date().toISOString(),

        data: {}

    };


    for (
        const storeName
        of Object.values(TP_STORES)
    ) {

        backup.data[storeName] =
            await dbGetAll(
                storeName
            );

    }


    const id =
        await dbAdd(
            TP_STORES.backups,
            backup
        );


    backup.id =
        id;


    return backup;

}


/* =========================================================
   EXPORT DATABASE AS JSON
   ========================================================= */

async function exportDatabaseJSON() {

    const data = {

        app:
            "Teacher Pro",

        version:
            TP_DB_VERSION,

        exportedAt:
            new Date().toISOString(),

        database:
            TP_DB_NAME,

        stores: {}

    };


    for (
        const storeName
        of Object.values(TP_STORES)
    ) {

        data.stores[storeName] =
            await dbGetAll(
                storeName
            );

    }


    return data;

}


/* =========================================================
   DOWNLOAD DATABASE JSON
   ========================================================= */

async function downloadDatabaseJSON(
    fileName = null
) {

    const data =
        await exportDatabaseJSON();


    const json =
        JSON.stringify(
            data,
            null,
            4
        );


    const blob =
        new Blob(
            [json],
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


    const date =
        new Date()
            .toISOString()
            .slice(0, 10);


    link.href =
        url;


    link.download =
        fileName ||
        `teacher-pro-backup-${date}.json`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        () => {
            URL.revokeObjectURL(url);
        },
        1000
    );

}


/* =========================================================
   IMPORT DATABASE JSON
   ========================================================= */

async function importDatabaseJSON(
    jsonData
) {

    if (
        !jsonData ||
        !jsonData.stores
    ) {

        throw new Error(
            "ملف النسخة الاحتياطية غير صالح."
        );

    }


    const stores =
        jsonData.stores;


    for (
        const storeName
        of Object.keys(stores)
    ) {

        if (
            !Object.values(
                TP_STORES
            ).includes(storeName)
        ) {

            continue;

        }


        const records =
            stores[storeName];


        if (
            !Array.isArray(
                records
            )
        ) {

            continue;

        }


        for (
            const record
            of records
        ) {

            try {

                await dbPut(
                    storeName,
                    record
                );

            } catch(error) {

                console.warn(
                    `تعذر استيراد سجل من ${storeName}`,
                    error
                );

            }

        }

    }


    return true;

}


/* =========================================================
   SEARCH STUDENTS
   ========================================================= */

async function searchStudents(
    searchText
) {

    const students =
        await getStudents();


    const query =
        String(
            searchText || ""
        )
        .trim()
        .toLowerCase();


    if (!query) {

        return students;

    }


    return students.filter(
        student => {

            const name =
                String(
                    student.fullName || ""
                )
                .toLowerCase();


            const number =
                String(
                    student.studentNumber || ""
                )
                .toLowerCase();


            const phone =
                String(
                    student.parentPhone || ""
                )
                .toLowerCase();


            return (

                name.includes(query) ||

                number.includes(query) ||

                phone.includes(query)

            );

        }
    );

}


/* =========================================================
   GET STUDENT COMPLETE DATA
   ========================================================= */

async function getStudentCompleteData(
    studentId
) {

    const student =
        await getStudent(
            studentId
        );


    if (!student) {

        throw new Error(
            "الطالب غير موجود."
        );

    }


    const attendance =
        await getStudentAttendance(
            studentId
        );


    const grades =
        await getStudentGrades(
            studentId
        );


    const notes =
        await getStudentNotes(
            studentId
        );


    const classes =
        await getClasses();


    const sections =
        await getSections();


    const classInfo =
        classes.find(
            item =>
                item.id ===
                student.classId
        ) || null;


    const sectionInfo =
        sections.find(
            item =>
                item.id ===
                student.sectionId
        ) || null;


    const attendanceSummary = {

        present:
            attendance.filter(
                item =>
                    item.status ===
                    "present"
            ).length,

        absent:
            attendance.filter(
                item =>
                    item.status ===
                    "absent"
            ).length,

        excused:
            attendance.filter(
                item =>
                    item.status ===
                    "excused"
            ).length,

        late:
            attendance.filter(
                item =>
                    item.status ===
                    "late"
            ).length

    };


    return {

        student,

        classInfo,

        sectionInfo,

        attendance,

        attendanceSummary,

        grades,

        notes

    };

}


/* =========================================================
   GENERATE MESSAGE CODE
   ========================================================= */

function generateMessageCode() {

    const now =
        Date.now()
        .toString(36)
        .toUpperCase();


    const random =
        Math.random()
        .toString(36)
        .substring(
            2,
            8
        )
        .toUpperCase();


    return `TP-${now}-${random}`;

}


/* =========================================================
   DEVICE FINGERPRINT
   ========================================================= */

/*
   ملاحظة مهمة:
   هذا ليس بصمة بيومترية ولا رقم IMEI ولا رقم جهاز
   حقيقي. المتصفح لا يسمح للموقع بالحصول على IMEI
   أو الرقم التسلسلي للهاتف.

   يتم إنشاء معرف محلي للموقع باستخدام معلومات متاحة
   للمتصفح مع رقم عشوائي محفوظ في IndexedDB.
*/

async function getDeviceFingerprint() {

    let fingerprint =
        await getAppData(
            "deviceFingerprint",
            null
        );


    if (fingerprint) {

        return fingerprint;

    }


    const randomPart =
        cryptoRandomString(
            32
        );


    const baseData = [

        navigator.userAgent || "",

        navigator.language || "",

        navigator.platform || "",

        String(
            navigator.hardwareConcurrency ||
            ""
        ),

        String(
            navigator.deviceMemory ||
            ""
        ),

        String(
            screen.width ||
            ""
        ),

        String(
            screen.height ||
            ""
        ),

        String(
            screen.colorDepth ||
            ""
        ),

        randomPart

    ].join("|");


    fingerprint =
        await sha256(
            baseData
        );


    await saveAppData(
        "deviceFingerprint",
        fingerprint,
        "device"
    );


    return fingerprint;

}


/* =========================================================
   CRYPTO RANDOM STRING
   ========================================================= */

function cryptoRandomString(
    length = 32
) {

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";


    const array =
        new Uint32Array(
            length
        );


    if (
        window.crypto &&
        crypto.getRandomValues
    ) {

        crypto.getRandomValues(
            array
        );

    } else {

        for (
            let i = 0;
            i < length;
            i++
        ) {

            array[i] =
                Math.floor(
                    Math.random() *
                    4294967295
                );

        }

    }


    let result = "";


    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            chars[
                array[i] %
                chars.length
            ];

    }


    return result;

}


/* =========================================================
   SHA-256
   ========================================================= */

async function sha256(
    text
) {

    if (
        window.crypto &&
        crypto.subtle
    ) {

        const encoder =
            new TextEncoder();


        const data =
            encoder.encode(
                text
            );


        const hash =
            await crypto.subtle.digest(
                "SHA-256",
                data
            );


        return Array
            .from(
                new Uint8Array(
                    hash
                )
            )
            .map(
                byte =>
                    byte
                        .toString(16)
                        .padStart(
                            2,
                            "0"
                        )
            )
            .join("");

    }


    /*
       Fallback بسيط للبيئات التي لا تدعم
       Web Crypto API.
    */

    let hash = 0;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        hash =
            (
                (
                    hash << 5
                )
                -
                hash
                +
                text.charCodeAt(i)
            )
            |
            0;

    }


    return Math.abs(
        hash
    ).toString(16);

}


/* =========================================================
   DATABASE STATISTICS
   ========================================================= */

async function getDatabaseStatistics() {

    const result = {};


    for (
        const storeName
        of Object.values(TP_STORES)
    ) {

        try {

            result[storeName] =
                await dbCount(
                    storeName
                );

        } catch {

            result[storeName] =
                0;

        }

    }


    return result;

}


/* =========================================================
   DELETE ALL DATABASE DATA
   ========================================================= */

async function deleteAllDatabaseData() {

    const stores =
        Object.values(
            TP_STORES
        );


    for (
        const storeName
        of stores
    ) {

        await dbClear(
            storeName
        );

    }


    return true;

}


/* =========================================================
   INITIAL DEFAULT DATA
   ========================================================= */

async function initializeDefaultData() {

    const appInitialized =
        await getAppData(
            "initialized",
            false
        );


    if (appInitialized) {

        return false;

    }


    /* -----------------------------------------------------
       DEFAULT SETTINGS
       ----------------------------------------------------- */

    await saveSetting(
        "siteName",
        "TEACHER PRO",
        "site"
    );


    await saveSetting(
        "siteSubtitle",
        "نظام إدارة المدرس",
        "site"
    );


    await saveSetting(
        "activeTheme",
        "purple-pink",
        "theme"
    );


    await saveSetting(
        "timeFormat",
        "12",
        "clock"
    );


    await saveSetting(
        "language",
        "ar",
        "system"
    );


    /* -----------------------------------------------------
       DEFAULT TEACHING TIPS
       ----------------------------------------------------- */

    const defaultTips = [

        {

            title:
                "ابدأ الحصة بوضوح",

            content:
                "حدد هدف الدرس للطلاب قبل البدء حتى يعرفوا ما المتوقع منهم.",

            category:
                "lesson",

            icon:
                "🎯",

            active:
                true

        },

        {

            title:
                "راقب المشاركة",

            content:
                "حاول إشراك جميع الطلاب وعدم الاعتماد على نفس مجموعة الطلاب في الإجابات.",

            category:
                "students",

            icon:
                "👥",

            active:
                true

        },

        {

            title:
                "استخدم أمثلة عملية",

            content:
                "ربط الموضوع بأمثلة واقعية يساعد على تثبيت المعلومات.",

            category:
                "teaching",

            icon:
                "💡",

            active:
                true

        },

        {

            title:
                "راجع قبل إنهاء الحصة",

            content:
                "خصص دقائق قليلة لمراجعة أهم النقاط التي تم شرحها.",

            category:
                "review",

            icon:
                "📝",

            active:
                true

        },

        {

            title:
                "تابع الغياب المتكرر",

            content:
                "راقب سجل الحضور والغياب للطلاب الذين يتكرر غيابهم.",

            category:
                "attendance",

            icon:
                "🟢",

            active:
                true

        }

    ];


    for (
        const tip
        of defaultTips
    ) {

        await saveTip(
            tip
        );

    }


    /* -----------------------------------------------------
       DEFAULT THEMES
       ----------------------------------------------------- */

    const defaultThemes = [

        {
            name: "أحمر × أخضر",
            value: "red-green",
            active: false
        },

        {
            name: "بنفسجي × وردي",
            value: "purple-pink",
            active: true
        },

        {
            name: "رمادي × أحمر",
            value: "gray-red",
            active: false
        },

        {
            name: "أحمر × أزرق",
            value: "red-blue",
            active: false
        },

        {
            name: "أسود × بنفسجي",
            value: "black-purple",
            active: false
        },

        {
            name: "جوزي × أبيض",
            value: "brown-white",
            active: false
        },

        {
            name: "سماوي × أخضر",
            value: "cyan-green",
            active: false
        },

        {
            name: "أخضر × بنفسجي",
            value: "green-purple",
            active: false
        },

        {
            name: "أزرق × ماروني",
            value: "blue-maroon",
            active: false
        },

        {
            name: "برتقالي × أخضر",
            value: "orange-green",
            active: false
        }

    ];


    for (
        const theme
        of defaultThemes
    ) {

        await saveTheme(
            theme
        );

    }


    /* -----------------------------------------------------
       INITIALIZED
       ----------------------------------------------------- */

    await saveAppData(
        "initialized",
        true,
        "system"
    );


    await addLog({

        type:
            "system",

        action:
            "database_initialized",

        description:
            "تم إنشاء قاعدة بيانات Teacher Pro وتهيئة البيانات الافتراضية."

    });


    return true;

}


/* =========================================================
   DATABASE HEALTH CHECK
   ========================================================= */

async function databaseHealthCheck() {

    try {

        await ensureDatabase();


        const statistics =
            await getDatabaseStatistics();


        return {

            status:
                "ok",

            database:
                TP_DB_NAME,

            version:
                TP_DB_VERSION,

            stores:
                statistics,

            timestamp:
                new Date().toISOString()

        };

    } catch(error) {

        return {

            status:
                "error",

            database:
                TP_DB_NAME,

            version:
                TP_DB_VERSION,

            error:
                error.message,

            timestamp:
                new Date().toISOString()

        };

    }

}


/* =========================================================
   AUTOMATIC INITIALIZATION
   ========================================================= */

async function initializeTeacherProDatabase() {

    try {

        await openTeacherDatabase();

        await initializeDefaultData();

        console.log(
            "Teacher Pro IndexedDB جاهزة."
        );


        return true;

    } catch(error) {

        console.error(
            "خطأ في تهيئة قاعدة البيانات:",
            error
        );


        return false;

    }

}


/* =========================================================
   AUTO START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        function() {

            initializeTeacherProDatabase();

        },
        {
            once: true
        }
    );

} else {

    initializeTeacherProDatabase();

}


/* =========================================================
   PUBLIC API
   ========================================================= */

window.TeacherProDB = {

    open:
        openTeacherDatabase,

    add:
        dbAdd,

    put:
        dbPut,

    get:
        dbGet,

    delete:
        dbDelete,

    getAll:
        dbGetAll,

    count:
        dbCount,

    clear:
        dbClear,

    getByIndex:
        dbGetByIndex,

    transaction:
        dbTransaction,


    stores:
        TP_STORES,


    settings: {

        save:
            saveSetting,

        get:
            getSetting,

        delete:
            deleteSetting

    },


    students: {

        add:
            addStudent,

        update:
            updateStudent,

        delete:
            deleteStudent,

        get:
            getStudent,

        getAll:
            getStudents,

        byClass:
            getStudentsByClass,

        bySection:
            getStudentsBySection,

        search:
            searchStudents,

        complete:
            getStudentCompleteData

    },


    classes: {

        add:
            addClass,

        update:
            updateClass,

        delete:
            deleteClass,

        getAll:
            getClasses

    },


    sections: {

        add:
            addSection,

        update:
            updateSection,

        delete:
            deleteSection,

        getAll:
            getSections,

        byClass:
            getSectionsByClass

    },


    attendance: {

        save:
            saveAttendance,

        byStudent:
            getStudentAttendance,

        byDate:
            getAttendanceByDate

    },


    grades: {

        save:
            saveGrade,

        byStudent:
            getStudentGrades,

        byColumn:
            getGradesByColumn

    },


    gradeColumns: {

        add:
            addGradeColumn,

        update:
            updateGradeColumn,

        delete:
            deleteGradeColumn,

        byClass:
            getGradeColumns

    },


    formulas: {

        save:
            saveGradeFormula,

        byClass:
            getGradeFormulas

    },


    assignments: {

        save:
            saveAssignment,

        getAll:
            getAssignments

    },


    exams: {

        save:
            saveExam,

        getAll:
            getExams

    },


    schedule: {

        save:
            saveScheduleItem,

        getAll:
            getSchedule,

        byClass:
            getScheduleByClass

    },


    notes: {

        save:
            saveNote,

        getAll:
            getNotes,

        byStudent:
            getStudentNotes

    },


    reminders: {

        save:
            saveReminder,

        getAll:
            getReminders

    },


    tips: {

        save:
            saveTip,

        getAll:
            getTips

    },


    contacts: {

        save:
            saveContact,

        getAll:
            getContacts

    },


    themes: {

        save:
            saveTheme,

        getAll:
            getThemes

    },


    messages: {

        save:
            saveMessage,

        getAll:
            getMessages

    },


    notifications: {

        add:
            addNotification,

        getAll:
            getNotifications,

        markRead:
            markNotificationRead

    },


    logs: {

        add:
            addLog

    },


    appData: {

        save:
            saveAppData,

        get:
            getAppData

    },


    backup: {

        create:
            createDatabaseBackup,

        export:
            exportDatabaseJSON,

        download:
            downloadDatabaseJSON,

        import:
            importDatabaseJSON

    },


    device: {

        fingerprint:
            getDeviceFingerprint

    },


    stats:
        getDatabaseStatistics,


    health:
        databaseHealthCheck,


    deleteEverything:
        deleteAllDatabaseData

};


/* =========================================================
   END OF DATABASE.JS
   ========================================================= */