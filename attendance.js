/* ============================================================
   FILE 14: attendance.js
   Project: Teacher Management System
   Description:
   نظام الحضور والغياب والتأخير والإجازات
   التخزين: IndexedDB
   ============================================================ */

"use strict";

/* ============================================================
   CONFIGURATION
   ============================================================ */

const ATTENDANCE_CONFIG = {
    DB_NAME: "TeacherManagementDB",

    ATTENDANCE_STORE: "attendance",

    STUDENTS_STORE: "students",

    CLASSES_STORE: "classes",

    DB_VERSION: 5,

    DEFAULT_STATUS: "present",

    STATUSES: {
        PRESENT: "present",
        ABSENT: "absent",
        EXCUSED: "excused",
        LATE: "late"
    },

    STATUS_LABELS: {
        present: "حاضر",
        absent: "غائب",
        excused: "مجاز",
        late: "متأخر"
    },

    STATUS_ICONS: {
        present: "🟢",
        absent: "🔴",
        excused: "🟡",
        late: "🟠"
    },

    STATUS_CLASSES: {
        present: "attendance-present",
        absent: "attendance-absent",
        excused: "attendance-excused",
        late: "attendance-late"
    },

    MAX_NOTE_LENGTH: 1000,

    SEARCH_DELAY: 180
};


/* ============================================================
   STATE
   ============================================================ */

const AttendanceState = {

    initialized: false,

    loading: false,

    records: [],

    students: [],

    classes: [],

    filteredStudents: [],

    selectedClassId: null,

    selectedSectionId: null,

    selectedDate: "",

    searchText: "",

    currentFilter: "all",

    currentStudentId: null,

    currentStudentHistory: [],

    currentView: "attendance",

    pendingChanges: new Map(),

    autoSave: true
};


/* ============================================================
   BASIC HELPERS
   ============================================================ */

function attendanceGetElement(id) {

    return document.getElementById(id);
}


function attendanceQuery(selector, parent = document) {

    return parent.querySelector(selector);
}


function attendanceQueryAll(selector, parent = document) {

    return Array.from(
        parent.querySelectorAll(selector)
    );
}


function attendanceEscapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function attendanceGenerateId(prefix = "attendance") {

    return (
        prefix +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 10)
    );
}


function attendanceNowISO() {

    return new Date().toISOString();
}


/* ============================================================
   DATE HELPERS
   ============================================================ */

function attendanceDateInputValue(
    date = new Date()
) {

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

    return `${year}-${month}-${day}`;
}


function attendanceFormatDate(
    value
) {

    if (!value) {

        return "—";
    }

    const date =
        new Date(
            value.includes("T")
                ? value
                : `${value}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }

    return date.toLocaleDateString(
        "ar-IQ",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


function attendanceFormatShortDate(
    value
) {

    if (!value) {

        return "—";
    }

    const date =
        new Date(
            value.includes("T")
                ? value
                : `${value}T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
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


function attendanceFormatTime(
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

        return "—";
    }

    return date.toLocaleTimeString(
        "ar-IQ",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* ============================================================
   STATUS HELPERS
   ============================================================ */

function attendanceGetStatusLabel(
    status
) {

    return (
        ATTENDANCE_CONFIG.STATUS_LABELS[
            status
        ] ||
        "غير محدد"
    );
}


function attendanceGetStatusIcon(
    status
) {

    return (
        ATTENDANCE_CONFIG.STATUS_ICONS[
            status
        ] ||
        "⚪"
    );
}


function attendanceGetStatusClass(
    status
) {

    return (
        ATTENDANCE_CONFIG.STATUS_CLASSES[
            status
        ] ||
        ""
    );
}


function attendanceIsValidStatus(
    status
) {

    return Object.values(
        ATTENDANCE_CONFIG.STATUSES
    ).includes(
        status
    );
}


/* ============================================================
   NORMALIZE ATTENDANCE RECORD
   ============================================================ */

function attendanceNormalizeRecord(
    data = {}
) {

    const status =
        attendanceIsValidStatus(
            data.status
        )
            ? data.status
            : ATTENDANCE_CONFIG.DEFAULT_STATUS;

    return {

        id:
            data.id ||
            attendanceGenerateId(
                "attendance"
            ),

        studentId:
            String(
                data.studentId || ""
            ),

        studentName:
            String(
                data.studentName || ""
            ),

        classId:
            String(
                data.classId || ""
            ),

        sectionId:
            String(
                data.sectionId || ""
            ),

        date:
            String(
                data.date ||
                attendanceDateInputValue()
            ),

        time:
            String(
                data.time ||
                attendanceFormatTime(
                    attendanceNowISO()
                )
            ),

        timestamp:
            data.timestamp ||
            attendanceNowISO(),

        status,

        note:
            String(
                data.note || ""
            ).slice(
                0,
                ATTENDANCE_CONFIG.MAX_NOTE_LENGTH
            ),

        subject:
            String(
                data.subject || ""
            ),

        lesson:
            String(
                data.lesson || ""
            ),

        period:
            String(
                data.period || ""
            ),

        teacherNote:
            String(
                data.teacherNote || ""
            ),

        createdAt:
            data.createdAt ||
            attendanceNowISO(),

        updatedAt:
            data.updatedAt ||
            attendanceNowISO()
    };
}


/* ============================================================
   OPEN INDEXEDDB
   ============================================================ */

function attendanceOpenDatabase() {

    return new Promise(
        (resolve, reject) => {

            if (
                !(
                    "indexedDB" in
                    window
                )
            ) {

                reject(
                    new Error(
                        "IndexedDB غير مدعوم"
                    )
                );

                return;
            }

            const request =
                indexedDB.open(
                    ATTENDANCE_CONFIG.DB_NAME,
                    ATTENDANCE_CONFIG.DB_VERSION
                );

            request.onupgradeneeded =
                event => {

                    const db =
                        event.target.result;

                    if (
                        !db.objectStoreNames.contains(
                            ATTENDANCE_CONFIG.ATTENDANCE_STORE
                        )
                    ) {

                        const store =
                            db.createObjectStore(
                                ATTENDANCE_CONFIG.ATTENDANCE_STORE,
                                {
                                    keyPath: "id"
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

                        store.createIndex(
                            "studentDate",
                            [
                                "studentId",
                                "date"
                            ],
                            {
                                unique: false
                            }
                        );
                    }

                    if (
                        !db.objectStoreNames.contains(
                            ATTENDANCE_CONFIG.STUDENTS_STORE
                        )
                    ) {

                        const studentStore =
                            db.createObjectStore(
                                ATTENDANCE_CONFIG.STUDENTS_STORE,
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

                    if (
                        !db.objectStoreNames.contains(
                            ATTENDANCE_CONFIG.CLASSES_STORE
                        )
                    ) {

                        const classStore =
                            db.createObjectStore(
                                ATTENDANCE_CONFIG.CLASSES_STORE,
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
                    }
                };

            request.onsuccess =
                event => {

                    resolve(
                        event.target.result
                    );
                };

            request.onerror =
                event => {

                    reject(
                        event.target.error
                    );
                };
        }
    );
}


/* ============================================================
   SAVE ATTENDANCE RECORD
   ============================================================ */

async function attendanceSaveRecord(
    record
) {

    const normalized =
        attendanceNormalizeRecord(
            record
        );

    normalized.updatedAt =
        attendanceNowISO();

    const db =
        await attendanceOpenDatabase();

    return new Promise(
        (resolve, reject) => {

            const transaction =
                db.transaction(
                    [
                        ATTENDANCE_CONFIG
                            .ATTENDANCE_STORE
                    ],
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    ATTENDANCE_CONFIG
                        .ATTENDANCE_STORE
                );

            const request =
                store.put(
                    normalized
                );

            request.onsuccess =
                () => {

                    db.close();

                    resolve(
                        normalized
                    );
                };

            request.onerror =
                event => {

                    db.close();

                    reject(
                        event.target.error
                    );
                };
        }
    );
}


/* ============================================================
   GET ALL ATTENDANCE
   ============================================================ */

async function attendanceLoadAllRecords() {

    try {

        const db =
            await attendanceOpenDatabase();

        const records =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            [
                                ATTENDANCE_CONFIG
                                    .ATTENDANCE_STORE
                            ],
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            ATTENDANCE_CONFIG
                                .ATTENDANCE_STORE
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
                        event => {

                            reject(
                                event.target.error
                            );
                        };
                }
            );

        db.close();

        AttendanceState.records =
            records.map(
                attendanceNormalizeRecord
            );

        return AttendanceState.records;

    } catch (error) {

        console.error(
            "Attendance load error:",
            error
        );

        attendanceShowToast(
            "تعذر تحميل سجل الحضور",
            "error"
        );

        return [];
    }
}


/* ============================================================
   GET STUDENTS
   ============================================================ */

async function attendanceLoadStudents() {

    try {

        const db =
            await attendanceOpenDatabase();

        const students =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            [
                                ATTENDANCE_CONFIG
                                    .STUDENTS_STORE
                            ],
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            ATTENDANCE_CONFIG
                                .STUDENTS_STORE
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
                        event => {

                            reject(
                                event.target.error
                            );
                        };
                }
            );

        db.close();

        AttendanceState.students =
            students;

        return students;

    } catch (error) {

        console.warn(
            "Students loading error:",
            error
        );

        AttendanceState.students =
            [];

        return [];
    }
}


/* ============================================================
   GET CLASSES
   ============================================================ */

async function attendanceLoadClasses() {

    try {

        const db =
            await attendanceOpenDatabase();

        const classes =
            await new Promise(
                (resolve, reject) => {

                    const transaction =
                        db.transaction(
                            [
                                ATTENDANCE_CONFIG
                                    .CLASSES_STORE
                            ],
                            "readonly"
                        );

                    const store =
                        transaction.objectStore(
                            ATTENDANCE_CONFIG
                                .CLASSES_STORE
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
                        event => {

                            reject(
                                event.target.error
                            );
                        };
                }
            );

        db.close();

        AttendanceState.classes =
            classes;

        return classes;

    } catch (error) {

        console.warn(
            "Classes loading error:",
            error
        );

        AttendanceState.classes =
            [];

        return [];
    }
}


/* ============================================================
   FIND STUDENT
   ============================================================ */

function attendanceFindStudent(
    studentId
) {

    return (
        AttendanceState.students.find(
            student =>
                String(
                    student.id
                ) ===
                String(studentId)
        ) ||
        null
    );
}


/* ============================================================
   FIND CLASS
   ============================================================ */

function attendanceFindClass(
    classId
) {

    return (
        AttendanceState.classes.find(
            classItem =>
                String(
                    classItem.id
                ) ===
                String(classId)
        ) ||
        null
    );
}


/* ============================================================
   FIND SECTION
   ============================================================ */

function attendanceFindSection(
    classId,
    sectionId
) {

    const classItem =
        attendanceFindClass(
            classId
        );

    if (!classItem) {

        return null;
    }

    const sections =
        Array.isArray(
            classItem.sections
        )
            ? classItem.sections
            : [];

    return (
        sections.find(
            section =>
                String(
                    section.id
                ) ===
                String(sectionId)
        ) ||
        null
    );
}


/* ============================================================
   FILTER STUDENTS
   ============================================================ */

function attendanceApplyStudentFilters() {

    let students =
        [...AttendanceState.students];

    if (
        AttendanceState.selectedClassId
    ) {

        students =
            students.filter(
                student =>
                    String(
                        student.classId || ""
                    ) ===
                    String(
                        AttendanceState
                            .selectedClassId
                    )
            );
    }

    if (
        AttendanceState.selectedSectionId
    ) {

        students =
            students.filter(
                student =>
                    String(
                        student.sectionId || ""
                    ) ===
                    String(
                        AttendanceState
                            .selectedSectionId
                    )
            );
    }

    const search =
        AttendanceState.searchText
            .trim()
            .toLowerCase();

    if (search) {

        students =
            students.filter(
                student => {

                    const text =
                        [
                            student.name,
                            student.code,
                            student.studentNumber,
                            student.phone
                        ]
                        .join(" ")
                        .toLowerCase();

                    return text.includes(
                        search
                    );
                }
            );
    }

    AttendanceState.filteredStudents =
        students;

    return students;
}


/* ============================================================
   GET RECORD FOR STUDENT + DATE
   ============================================================ */

function attendanceGetRecordForDate(
    studentId,
    date,
    classId = "",
    sectionId = ""
) {

    const matches =
        AttendanceState.records.filter(
            record => {

                if (
                    String(
                        record.studentId
                    ) !==
                    String(studentId)
                ) {

                    return false;
                }

                if (
                    record.date !== date
                ) {

                    return false;
                }

                if (
                    classId &&
                    record.classId &&
                    String(
                        record.classId
                    ) !==
                    String(classId)
                ) {

                    return false;
                }

                if (
                    sectionId &&
                    record.sectionId &&
                    String(
                        record.sectionId
                    ) !==
                    String(sectionId)
                ) {

                    return false;
                }

                return true;
            }
        );

    if (!matches.length) {

        return null;
    }

    return matches[
        matches.length - 1
    ];
}


/* ============================================================
   MARK STUDENT ATTENDANCE
   ============================================================ */

async function attendanceMarkStudent(
    studentId,
    status,
    options = {}
) {

    if (
        !attendanceIsValidStatus(
            status
        )
    ) {

        attendanceShowToast(
            "حالة الحضور غير صحيحة",
            "error"
        );

        return null;
    }

    const student =
        attendanceFindStudent(
            studentId
        );

    if (!student) {

        attendanceShowToast(
            "الطالب غير موجود",
            "error"
        );

        return null;
    }

    const date =
        options.date ||
        AttendanceState.selectedDate ||
        attendanceDateInputValue();

    const classId =
        options.classId ||
        student.classId ||
        AttendanceState.selectedClassId ||
        "";

    const sectionId =
        options.sectionId ||
        student.sectionId ||
        AttendanceState.selectedSectionId ||
        "";

    const existing =
        attendanceGetRecordForDate(
            studentId,
            date,
            classId,
            sectionId
        );

    const record =
        attendanceNormalizeRecord({

            id:
                existing
                    ? existing.id
                    : attendanceGenerateId(
                        "attendance"
                    ),

            studentId,

            studentName:
                student.name || "",

            classId,

            sectionId,

            date,

            time:
                options.time ||
                attendanceFormatTime(
                    attendanceNowISO()
                ),

            timestamp:
                options.timestamp ||
                attendanceNowISO(),

            status,

            note:
                options.note ||
                (
                    existing
                        ? existing.note
                        : ""
                ),

            subject:
                options.subject ||
                (
                    existing
                        ? existing.subject
                        : ""
                ),

            lesson:
                options.lesson ||
                (
                    existing
                        ? existing.lesson
                        : ""
                ),

            period:
                options.period ||
                (
                    existing
                        ? existing.period
                        : ""
                ),

            teacherNote:
                options.teacherNote ||
                (
                    existing
                        ? existing.teacherNote
                        : ""
                ),

            createdAt:
                existing
                    ? existing.createdAt
                    : attendanceNowISO(),

            updatedAt:
                attendanceNowISO()
        });

    try {

        const saved =
            await attendanceSaveRecord(
                record
            );

        const index =
            AttendanceState.records.findIndex(
                item =>
                    item.id === saved.id
            );

        if (index >= 0) {

            AttendanceState.records[index] =
                saved;

        } else {

            AttendanceState.records.push(
                saved
            );
        }

        AttendanceState.pendingChanges.delete(
            studentId
        );

        return saved;

    } catch (error) {

        console.error(
            "Mark attendance error:",
            error
        );

        attendanceShowToast(
            "تعذر حفظ الحضور",
            "error"
        );

        return null;
    }
}


/* ============================================================
   MARK ALL STUDENTS
   ============================================================ */

async function attendanceMarkAll(
    status
) {

    if (
        !attendanceIsValidStatus(
            status
        )
    ) {

        return;
    }

    const students =
        attendanceApplyStudentFilters();

    if (!students.length) {

        attendanceShowToast(
            "لا يوجد طلاب لتسجيل الحضور",
            "warning"
        );

        return;
    }

    const confirmed =
        window.confirm(
            `سيتم تسجيل "${attendanceGetStatusLabel(status)}" لجميع الطلاب الظاهرين.\n\nهل تريد المتابعة؟`
        );

    if (!confirmed) {

        return;
    }

    attendanceSetLoading(
        true
    );

    try {

        for (
            const student of students
        ) {

            await attendanceMarkStudent(
                student.id,
                status
            );
        }

        attendanceShowToast(
            `تم تسجيل ${attendanceGetStatusLabel(status)} للجميع`,
            "success"
        );

        attendanceRender();

    } catch (error) {

        console.error(
            "Mark all error:",
            error
        );

        attendanceShowToast(
            "حدث خطأ أثناء التسجيل",
            "error"
        );

    } finally {

        attendanceSetLoading(
            false
        );
    }
}


/* ============================================================
   DELETE ATTENDANCE RECORD
   ============================================================ */

async function attendanceDeleteRecord(
    recordId
) {

    const record =
        AttendanceState.records.find(
            item =>
                item.id === recordId
        );

    if (!record) {

        return false;
    }

    const confirmed =
        window.confirm(
            `هل تريد حذف سجل ${attendanceGetStatusLabel(record.status)} بتاريخ ${attendanceFormatShortDate(record.date)}؟`
        );

    if (!confirmed) {

        return false;
    }

    try {

        const db =
            await attendanceOpenDatabase();

        await new Promise(
            (resolve, reject) => {

                const transaction =
                    db.transaction(
                        [
                            ATTENDANCE_CONFIG
                                .ATTENDANCE_STORE
                        ],
                        "readwrite"
                    );

                const store =
                    transaction.objectStore(
                        ATTENDANCE_CONFIG
                            .ATTENDANCE_STORE
                    );

                const request =
                    store.delete(
                        recordId
                    );

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

        AttendanceState.records =
            AttendanceState.records.filter(
                item =>
                    item.id !== recordId
            );

        attendanceShowToast(
            "تم حذف السجل",
            "success"
        );

        attendanceRender();

        return true;

    } catch (error) {

        console.error(
            "Delete attendance error:",
            error
        );

        attendanceShowToast(
            "تعذر حذف السجل",
            "error"
        );

        return false;
    }
}


/* ============================================================
   STUDENT STATISTICS
   ============================================================ */

function attendanceGetStudentStatistics(
    studentId
) {

    const records =
        AttendanceState.records.filter(
            record =>
                String(
                    record.studentId
                ) ===
                String(studentId)
        );

    const result = {

        total: records.length,

        present: 0,

        absent: 0,

        excused: 0,

        late: 0,

        attendanceRate: 0,

        absenceRate: 0,

        repeatedAbsence: false,

        consecutiveAbsences: 0,

        lastRecord: null
    };

    records.forEach(
        record => {

            if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .PRESENT
            ) {

                result.present++;

            } else if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .ABSENT
            ) {

                result.absent++;

            } else if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .EXCUSED
            ) {

                result.excused++;

            } else if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .LATE
            ) {

                result.late++;
            }
        }
    );

    if (result.total > 0) {

        result.attendanceRate =
            Math.round(
                (
                    (
                        result.present +
                        result.late
                    ) /
                    result.total
                ) *
                100
            );

        result.absenceRate =
            Math.round(
                (
                    result.absent /
                    result.total
                ) *
                100
            );
    }

    const sorted =
        [...records].sort(
            (a, b) =>
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    )
        );

    result.lastRecord =
        sorted[0] ||
        null;

    let consecutive = 0;

    for (
        const record of sorted
    ) {

        if (
            record.status ===
            ATTENDANCE_CONFIG.STATUSES
                .ABSENT
        ) {

            consecutive++;

        } else {

            break;
        }
    }

    result.consecutiveAbsences =
        consecutive;

    result.repeatedAbsence =
        result.absent >= 3 ||
        result.consecutiveAbsences >= 2;

    return result;
}


/* ============================================================
   CLASS STATISTICS
   ============================================================ */

function attendanceGetClassStatistics(
    classId,
    sectionId = "",
    date = ""
) {

    let students =
        AttendanceState.students.filter(
            student =>
                String(
                    student.classId || ""
                ) ===
                String(classId)
        );

    if (sectionId) {

        students =
            students.filter(
                student =>
                    String(
                        student.sectionId || ""
                    ) ===
                    String(sectionId)
            );
    }

    let records =
        AttendanceState.records.filter(
            record =>
                String(
                    record.classId
                ) ===
                String(classId)
        );

    if (sectionId) {

        records =
            records.filter(
                record =>
                    String(
                        record.sectionId
                    ) ===
                    String(sectionId)
            );
    }

    if (date) {

        records =
            records.filter(
                record =>
                    record.date === date
            );
    }

    const statistics = {

        students:
            students.length,

        present: 0,

        absent: 0,

        excused: 0,

        late: 0,

        notRecorded: 0,

        percentage: 0
    };

    students.forEach(
        student => {

            const record =
                records.find(
                    item =>
                        String(
                            item.studentId
                        ) ===
                        String(student.id)
                );

            if (!record) {

                statistics.notRecorded++;

                return;
            }

            if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .PRESENT
            ) {

                statistics.present++;

            } else if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .ABSENT
            ) {

                statistics.absent++;

            } else if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .EXCUSED
            ) {

                statistics.excused++;

            } else if (
                record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .LATE
            ) {

                statistics.late++;
            }
        }
    );

    if (
        statistics.students > 0
    ) {

        statistics.percentage =
            Math.round(
                (
                    (
                        statistics.present +
                        statistics.late
                    ) /
                    statistics.students
                ) *
                100
            );
    }

    return statistics;
}


/* ============================================================
   REPEATED ABSENCE STUDENTS
   ============================================================ */

function attendanceGetRepeatedAbsenceStudents() {

    return AttendanceState.students
        .map(
            student => {

                const statistics =
                    attendanceGetStudentStatistics(
                        student.id
                    );

                return {
                    student,
                    statistics
                };
            }
        )
        .filter(
            item =>
                item.statistics
                    .repeatedAbsence
        )
        .sort(
            (a, b) =>
                b.statistics.absent -
                a.statistics.absent
        );
}


/* ============================================================
   RENDER MAIN
   ============================================================ */

function attendanceRender() {

    const container =
        attendanceGetElement(
            "attendance-container"
        );

    if (!container) {

        return;
    }

    attendanceApplyStudentFilters();

    const date =
        AttendanceState.selectedDate ||
        attendanceDateInputValue();

    AttendanceState.selectedDate =
        date;

    const statistics =
        AttendanceState.selectedClassId
            ? attendanceGetClassStatistics(
                AttendanceState.selectedClassId,
                AttendanceState.selectedSectionId,
                date
            )
            : attendanceGetGlobalStatistics(
                date
            );

    container.innerHTML = `

        <div class="attendance-header">

            <div class="attendance-heading">

                <div class="attendance-heading-icon">
                    📋
                </div>

                <div>

                    <h1>
                        الحضور والغياب
                    </h1>

                    <p>
                        إدارة حضور الطلاب وحفظ سجل الحضور الكامل
                    </p>

                </div>

            </div>

            <div class="attendance-header-actions">

                <button
                    type="button"
                    class="attendance-secondary-button"
                    onclick="attendanceOpenHistory()"
                >
                    📚 سجل الحضور
                </button>

                <button
                    type="button"
                    class="attendance-primary-button"
                    onclick="attendanceOpenRepeatedAbsence()"
                >
                    ⚠️ الغياب المتكرر
                </button>

            </div>

        </div>


        <div class="attendance-toolbar">

            <div class="attendance-filter-field">

                <label>
                    📅 التاريخ
                </label>

                <input
                    id="attendance-date"
                    type="date"
                    value="${attendanceEscapeHTML(
                        date
                    )}"
                >

            </div>

            <div class="attendance-filter-field">

                <label>
                    🎓 الصف
                </label>

                <select
                    id="attendance-class-select"
                >
                    ${attendanceRenderClassOptions()}
                </select>

            </div>

            <div class="attendance-filter-field">

                <label>
                    🏫 الشعبة
                </label>

                <select
                    id="attendance-section-select"
                >
                    ${attendanceRenderSectionOptions()}
                </select>

            </div>

            <div class="attendance-search-field">

                <span>
                    🔎
                </span>

                <input
                    id="attendance-search"
                    type="search"
                    placeholder="ابحث باسم الطالب..."
                    value="${attendanceEscapeHTML(
                        AttendanceState.searchText
                    )}"
                >

            </div>

        </div>


        <div class="attendance-statistics-grid">

            ${attendanceCreateStatisticCard(
                "👥",
                statistics.students,
                "إجمالي الطلاب"
            )}

            ${attendanceCreateStatisticCard(
                "🟢",
                statistics.present,
                "حاضر"
            )}

            ${attendanceCreateStatisticCard(
                "🔴",
                statistics.absent,
                "غائب"
            )}

            ${attendanceCreateStatisticCard(
                "🟠",
                statistics.late,
                "متأخر"
            )}

            ${attendanceCreateStatisticCard(
                "🟡",
                statistics.excused,
                "مجاز"
            )}

            ${attendanceCreateStatisticCard(
                "⚪",
                statistics.notRecorded,
                "لم يسجل"
            )}

        </div>


        <div class="attendance-quick-actions">

            <button
                type="button"
                class="attendance-action attendance-action-present"
                onclick="attendanceMarkAll('present')"
            >
                🟢 تسجيل الكل حضور
            </button>

            <button
                type="button"
                class="attendance-action attendance-action-absent"
                onclick="attendanceMarkAll('absent')"
            >
                🔴 تسجيل الكل غياب
            </button>

            <button
                type="button"
                class="attendance-action attendance-action-excused"
                onclick="attendanceMarkAll('excused')"
            >
                🟡 تسجيل الكل مجاز
            </button>

            <button
                type="button"
                class="attendance-action attendance-action-late"
                onclick="attendanceMarkAll('late')"
            >
                🟠 تسجيل الكل متأخر
            </button>

        </div>


        <div class="attendance-table-card">

            <div class="attendance-table-header">

                <div>

                    <h2>
                        👥 قائمة الطلاب
                    </h2>

                    <p>
                        ${attendanceFormatDate(date)}
                    </p>

                </div>

                <div class="attendance-live-indicator">

                    <span></span>

                    حفظ تلقائي

                </div>

            </div>

            <div
                id="attendance-students-list"
                class="attendance-students-list"
            >
                ${attendanceRenderStudentRows()}
            </div>

        </div>


        <div class="attendance-tips-grid">

            <div class="attendance-tip-card">

                <span class="attendance-tip-icon">
                    💡
                </span>

                <div>

                    <strong>
                        تلميح
                    </strong>

                    <p>
                        يمكنك تحديد حضور الجميع دفعة واحدة ثم تعديل حالة طالب معين.
                    </p>

                </div>

            </div>

            <div class="attendance-tip-card">

                <span class="attendance-tip-icon">
                    ⚠️
                </span>

                <div>

                    <strong>
                        الغياب المتكرر
                    </strong>

                    <p>
                        يتم تمييز الطلاب الذين لديهم غياب متكرر لمساعدتك على متابعتهم.
                    </p>

                </div>

            </div>

            <div class="attendance-tip-card">

                <span class="attendance-tip-icon">
                    📚
                </span>

                <div>

                    <strong>
                        السجل
                    </strong>

                    <p>
                        كل سجل يحفظ بتاريخ ووقت وحالة وملاحظة ويمكن فتح سجل الطالب بالكامل.
                    </p>

                </div>

            </div>

        </div>

    `;

    attendanceBindEvents();

    attendanceRenderStudentRowsOnly();
}


/* ============================================================
   GLOBAL STATISTICS
   ============================================================ */

function attendanceGetGlobalStatistics(
    date
) {

    const students =
        AttendanceState.students;

    const records =
        AttendanceState.records.filter(
            record =>
                record.date === date
        );

    const result = {

        students:
            students.length,

        present: 0,

        absent: 0,

        excused: 0,

        late: 0,

        notRecorded: 0
    };

    students.forEach(
        student => {

            const record =
                records.find(
                    item =>
                        String(
                            item.studentId
                        ) ===
                        String(student.id)
                );

            if (!record) {

                result.notRecorded++;

                return;
            }

            if (
                record.status === "present"
            ) {

                result.present++;

            } else if (
                record.status === "absent"
            ) {

                result.absent++;

            } else if (
                record.status === "excused"
            ) {

                result.excused++;

            } else if (
                record.status === "late"
            ) {

                result.late++;
            }
        }
    );

    return result;
}


/* ============================================================
   STATISTIC CARD
   ============================================================ */

function attendanceCreateStatisticCard(
    icon,
    value,
    label
) {

    return `

        <div class="attendance-stat-card">

            <div class="attendance-stat-icon">
                ${icon}
            </div>

            <div class="attendance-stat-content">

                <strong>
                    ${value}
                </strong>

                <span>
                    ${label}
                </span>

            </div>

        </div>
    `;
}


/* ============================================================
   CLASS OPTIONS
   ============================================================ */

function attendanceRenderClassOptions() {

    let html = `
        <option value="">
            كل الصفوف
        </option>
    `;

    AttendanceState.classes.forEach(
        classItem => {

            const selected =
                String(
                    AttendanceState
                        .selectedClassId
                ) ===
                String(classItem.id)
                    ? "selected"
                    : "";

            html += `
                <option
                    value="${classesSafeValue(
                        classItem.id
                    )}"
                    ${selected}
                >
                    ${attendanceEscapeHTML(
                        classItem.name ||
                        "صف بدون اسم"
                    )}
                </option>
            `;
        }
    );

    return html;
}


/* ============================================================
   SECTION OPTIONS
   ============================================================ */

function attendanceRenderSectionOptions() {

    if (
        !AttendanceState.selectedClassId
    ) {

        return `
            <option value="">
                كل الشُعب
            </option>
        `;
    }

    const classItem =
        attendanceFindClass(
            AttendanceState.selectedClassId
        );

    if (!classItem) {

        return `
            <option value="">
                كل الشُعب
            </option>
        `;
    }

    const sections =
        Array.isArray(
            classItem.sections
        )
            ? classItem.sections
            : [];

    let html = `
        <option value="">
            كل الشُعب
        </option>
    `;

    sections.forEach(
        section => {

            const selected =
                String(
                    AttendanceState
                        .selectedSectionId
                ) ===
                String(section.id)
                    ? "selected"
                    : "";

            html += `
                <option
                    value="${classesSafeValue(
                        section.id
                    )}"
                    ${selected}
                >
                    ${attendanceEscapeHTML(
                        section.name ||
                        "شعبة"
                    )}
                </option>
            `;
        }
    );

    return html;
}


/* ============================================================
   SAFE ATTRIBUTE VALUE
   ============================================================ */

function classesSafeValue(
    value
) {

    return attendanceEscapeHTML(
        String(
            value ?? ""
        )
    );
}


/* ============================================================
   STUDENT ROWS
   ============================================================ */

function attendanceRenderStudentRows() {

    const students =
        attendanceApplyStudentFilters();

    if (!students.length) {

        return `

            <div class="attendance-empty-state">

                <div class="attendance-empty-icon">
                    👥
                </div>

                <h3>
                    لا يوجد طلاب
                </h3>

                <p>
                    أضف الطلاب من قسم الطلاب أو اختر صفاً وشعبة تحتوي على طلاب.
                </p>

            </div>
        `;
    }

    return students
        .map(
            (student, index) =>
                attendanceCreateStudentRow(
                    student,
                    index
                )
        )
        .join("");
}


/* ============================================================
   STUDENT ROW
   ============================================================ */

function attendanceCreateStudentRow(
    student,
    index
) {

    const date =
        AttendanceState.selectedDate;

    const record =
        attendanceGetRecordForDate(
            student.id,
            date,
            AttendanceState.selectedClassId,
            AttendanceState.selectedSectionId
        );

    const status =
        record
            ? record.status
            : "";

    const statistics =
        attendanceGetStudentStatistics(
            student.id
        );

    const repeatedClass =
        statistics.repeatedAbsence
            ? "repeated-absence"
            : "";

    return `

        <div
            class="attendance-student-row ${repeatedClass}"
            data-student-id="${classesSafeValue(
                student.id
            )}"
        >

            <div class="attendance-student-number">
                ${index + 1}
            </div>


            <button
                type="button"
                class="attendance-student-info"
                onclick="attendanceOpenStudentHistory('${classesSafeValue(
                    student.id
                )}')"
            >

                <div class="attendance-student-avatar">
                    ${
                        student.avatar
                            ? `
                                <img
                                    src="${attendanceEscapeHTML(
                                        student.avatar
                                    )}"
                                    alt=""
                                >
                              `
                            : "👤"
                    }
                </div>

                <div class="attendance-student-name-area">

                    <strong>
                        ${attendanceEscapeHTML(
                            student.name ||
                            "طالب بدون اسم"
                        )}
                    </strong>

                    <small>
                        ${
                            student.code
                                ? `رمز: ${attendanceEscapeHTML(
                                    student.code
                                  )}`
                                : "اضغط لعرض سجل الطالب"
                        }
                    </small>

                </div>

            </button>


            <div class="attendance-student-summary">

                <span>
                    حضور:
                    ${statistics.present}
                </span>

                <span>
                    غياب:
                    ${statistics.absent}
                </span>

                ${
                    statistics.repeatedAbsence
                        ? `
                            <span class="attendance-warning-badge">
                                ⚠️ متكرر
                            </span>
                          `
                        : ""
                }

            </div>


            <div class="attendance-status-buttons">

                ${attendanceStatusButton(
                    student.id,
                    "present",
                    status
                )}

                ${attendanceStatusButton(
                    student.id,
                    "absent",
                    status
                )}

                ${attendanceStatusButton(
                    student.id,
                    "excused",
                    status
                )}

                ${attendanceStatusButton(
                    student.id,
                    "late",
                    status
                )}

            </div>


            <div class="attendance-row-note">

                <button
                    type="button"
                    class="attendance-note-button"
                    title="إضافة أو تعديل ملاحظة"
                    onclick="attendanceOpenNoteModal('${classesSafeValue(
                        student.id
                    )}')"
                >
                    📝
                </button>

                ${
                    record &&
                    record.note
                        ? `
                            <span
                                class="attendance-note-indicator"
                                title="${attendanceEscapeHTML(
                                    record.note
                                )}"
                            >
                                ●
                            </span>
                          `
                        : ""
                }

            </div>

        </div>
    `;
}


/* ============================================================
   STATUS BUTTON
   ============================================================ */

function attendanceStatusButton(
    studentId,
    status,
    currentStatus
) {

    const active =
        currentStatus === status
            ? "active"
            : "";

    return `

        <button
            type="button"
            class="attendance-status-button ${attendanceGetStatusClass(
                status
            )} ${active}"
            onclick="attendanceQuickMark('${classesSafeValue(
                studentId
            )}', '${status}')"
            title="${attendanceGetStatusLabel(
                status
            )}"
        >

            <span>
                ${attendanceGetStatusIcon(
                    status
                )}
            </span>

            <small>
                ${attendanceGetStatusLabel(
                    status
                )}
            </small>

        </button>
    `;
}


/* ============================================================
   RENDER ROWS ONLY
   ============================================================ */

function attendanceRenderStudentRowsOnly() {

    const list =
        attendanceGetElement(
            "attendance-students-list"
        );

    if (!list) {

        return;
    }

    list.innerHTML =
        attendanceRenderStudentRows();
}


/* ============================================================
   QUICK MARK
   ============================================================ */

async function attendanceQuickMark(
    studentId,
    status
) {

    const saved =
        await attendanceMarkStudent(
            studentId,
            status
        );

    if (!saved) {

        return;
    }

    attendanceRenderStudentRowsOnly();

    attendanceRefreshStatistics();

    attendanceShowToast(
        `${attendanceGetStatusIcon(status)} تم تسجيل ${attendanceGetStatusLabel(status)}`,
        "success"
    );
}


/* ============================================================
   REFRESH STATISTICS
   ============================================================ */

function attendanceRefreshStatistics() {

    const date =
        AttendanceState.selectedDate;

    const statistics =
        AttendanceState.selectedClassId
            ? attendanceGetClassStatistics(
                AttendanceState.selectedClassId,
                AttendanceState.selectedSectionId,
                date
            )
            : attendanceGetGlobalStatistics(
                date
            );

    const cards =
        attendanceQueryAll(
            ".attendance-stat-card"
        );

    if (cards.length < 6) {

        return;
    }

    const values = [
        statistics.students,
        statistics.present,
        statistics.absent,
        statistics.late,
        statistics.excused,
        statistics.notRecorded
    ];

    cards.forEach(
        (card, index) => {

            const strong =
                attendanceQuery(
                    "strong",
                    card
                );

            if (strong) {

                strong.textContent =
                    values[index];
            }
        }
    );
}


/* ============================================================
   BIND EVENTS
   ============================================================ */

function attendanceBindEvents() {

    const dateInput =
        attendanceGetElement(
            "attendance-date"
        );

    if (dateInput) {

        dateInput.addEventListener(
            "change",
            event => {

                AttendanceState
                    .selectedDate =
                    event.target.value;

                attendanceRender();
            }
        );
    }


    const classSelect =
        attendanceGetElement(
            "attendance-class-select"
        );

    if (classSelect) {

        classSelect.addEventListener(
            "change",
            event => {

                AttendanceState
                    .selectedClassId =
                    event.target.value ||
                    null;

                AttendanceState
                    .selectedSectionId =
                    null;

                attendanceRender();
            }
        );
    }


    const sectionSelect =
        attendanceGetElement(
            "attendance-section-select"
        );

    if (sectionSelect) {

        sectionSelect.addEventListener(
            "change",
            event => {

                AttendanceState
                    .selectedSectionId =
                    event.target.value ||
                    null;

                attendanceRender();
            }
        );
    }


    const searchInput =
        attendanceGetElement(
            "attendance-search"
        );

    if (searchInput) {

        let timer = null;

        searchInput.addEventListener(
            "input",
            event => {

                clearTimeout(
                    timer
                );

                timer =
                    setTimeout(
                        () => {

                            AttendanceState
                                .searchText =
                                event.target.value;

                            attendanceRenderStudentRowsOnly();

                        },
                        ATTENDANCE_CONFIG
                            .SEARCH_DELAY
                    );
            }
        );
    }
}


/* ============================================================
   STUDENT HISTORY
   ============================================================ */

function attendanceGetStudentHistory(
    studentId
) {

    return AttendanceState.records
        .filter(
            record =>
                String(
                    record.studentId
                ) ===
                String(studentId)
        )
        .sort(
            (a, b) => {

                const first =
                    `${b.date} ${b.timestamp || ""}`;

                const second =
                    `${a.date} ${a.timestamp || ""}`;

                return first.localeCompare(
                    second
                );
            }
        );
}


/* ============================================================
   OPEN STUDENT HISTORY
   ============================================================ */

function attendanceOpenStudentHistory(
    studentId
) {

    const student =
        attendanceFindStudent(
            studentId
        );

    if (!student) {

        attendanceShowToast(
            "الطالب غير موجود",
            "error"
        );

        return;
    }

    AttendanceState.currentStudentId =
        studentId;

    AttendanceState.currentStudentHistory =
        attendanceGetStudentHistory(
            studentId
        );

    let modal =
        attendanceGetElement(
            "attendance-student-history-modal"
        );

    if (!modal) {

        attendanceCreateStudentHistoryModal();

        modal =
            attendanceGetElement(
                "attendance-student-history-modal"
            );
    }

    attendanceRenderStudentHistory(
        student
    );

    attendanceShowModal(
        modal
    );
}


/* ============================================================
   CREATE STUDENT HISTORY MODAL
   ============================================================ */

function attendanceCreateStudentHistoryModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "attendance-student-history-modal";

    modal.className =
        "attendance-modal-overlay";

    modal.innerHTML = `

        <div class="attendance-modal attendance-large-modal">

            <div class="attendance-modal-header">

                <div>

                    <span class="attendance-modal-icon">
                        📚
                    </span>

                    <h2>
                        سجل حضور الطالب
                    </h2>

                </div>

                <button
                    type="button"
                    class="attendance-modal-close"
                    onclick="attendanceCloseModal('attendance-student-history-modal')"
                >
                    ×
                </button>

            </div>

            <div
                id="attendance-student-history-content"
                class="attendance-history-content"
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

                attendanceCloseModal(
                    "attendance-student-history-modal"
                );
            }
        }
    );
}


/* ============================================================
   RENDER STUDENT HISTORY
   ============================================================ */

function attendanceRenderStudentHistory(
    student
) {

    const container =
        attendanceGetElement(
            "attendance-student-history-content"
        );

    if (!container) {

        return;
    }

    const statistics =
        attendanceGetStudentStatistics(
            student.id
        );

    const history =
        attendanceGetStudentHistory(
            student.id
        );

    const classItem =
        attendanceFindClass(
            student.classId
        );

    const section =
        attendanceFindSection(
            student.classId,
            student.sectionId
        );

    container.innerHTML = `

        <div class="attendance-history-profile">

            <div class="attendance-history-avatar">
                👤
            </div>

            <div class="attendance-history-student-info">

                <h3>
                    ${attendanceEscapeHTML(
                        student.name ||
                        "طالب بدون اسم"
                    )}
                </h3>

                <p>
                    ${
                        classItem
                            ? attendanceEscapeHTML(
                                classItem.name
                              )
                            : "بدون صف"
                    }

                    ${
                        section
                            ? `
                                •
                                ${attendanceEscapeHTML(
                                    section.name
                                )}
                              `
                            : ""
                    }
                </p>

            </div>

            ${
                statistics.repeatedAbsence
                    ? `
                        <div class="attendance-history-warning">
                            ⚠️ غياب متكرر
                        </div>
                      `
                    : ""
            }

        </div>


        <div class="attendance-history-statistics">

            ${attendanceCreateStatisticCard(
                "🟢",
                statistics.present,
                "حضور"
            )}

            ${attendanceCreateStatisticCard(
                "🔴",
                statistics.absent,
                "غياب"
            )}

            ${attendanceCreateStatisticCard(
                "🟠",
                statistics.late,
                "تأخير"
            )}

            ${attendanceCreateStatisticCard(
                "🟡",
                statistics.excused,
                "إجازة"
            )}

            ${attendanceCreateStatisticCard(
                "📊",
                `${statistics.attendanceRate}%`,
                "نسبة الحضور"
            )}

        </div>


        <div class="attendance-history-actions">

            <button
                type="button"
                class="attendance-primary-button"
                onclick="attendanceExportStudentHistory('${classesSafeValue(
                    student.id
                )}')"
            >
                ⬇️ تنزيل سجل الطالب
            </button>

            <button
                type="button"
                class="attendance-secondary-button"
                onclick="attendanceOpenNoteModal('${classesSafeValue(
                    student.id
                )}')"
            >
                📝 إضافة ملاحظة
            </button>

        </div>


        <div class="attendance-history-table">

            <div class="attendance-history-table-header">

                <span>
                    التاريخ
                </span>

                <span>
                    الوقت
                </span>

                <span>
                    الحالة
                </span>

                <span>
                    المادة
                </span>

                <span>
                    الملاحظة
                </span>

                <span>
                    إجراء
                </span>

            </div>

            ${
                history.length
                    ? history
                        .map(
                            record =>
                                attendanceCreateHistoryRow(
                                    record
                                )
                        )
                        .join("")
                    : `
                        <div class="attendance-empty-state compact">

                            <div class="attendance-empty-icon">
                                📭
                            </div>

                            <h3>
                                لا يوجد سجل
                            </h3>

                            <p>
                                لم يتم تسجيل حضور لهذا الطالب حتى الآن.
                            </p>

                        </div>
                      `
            }

        </div>

    `;
}


/* ============================================================
   HISTORY ROW
   ============================================================ */

function attendanceCreateHistoryRow(
    record
) {

    return `

        <div class="attendance-history-row">

            <span>
                ${attendanceFormatDate(
                    record.date
                )}
            </span>

            <span>
                ${attendanceEscapeHTML(
                    record.time ||
                    "—"
                )}
            </span>

            <span class="attendance-history-status ${attendanceGetStatusClass(
                record.status
            )}">

                ${attendanceGetStatusIcon(
                    record.status
                )}

                ${attendanceGetStatusLabel(
                    record.status
                )}

            </span>

            <span>
                ${attendanceEscapeHTML(
                    record.subject ||
                    "—"
                )}
            </span>

            <span>
                ${
                    record.note
                        ? attendanceEscapeHTML(
                            record.note
                          )
                        : "—"
                }
            </span>

            <button
                type="button"
                class="attendance-delete-button"
                onclick="attendanceDeleteHistoryRecord('${classesSafeValue(
                    record.id
                )}')"
            >
                🗑️
            </button>

        </div>
    `;
}


/* ============================================================
   DELETE HISTORY RECORD
   ============================================================ */

async function attendanceDeleteHistoryRecord(
    recordId
) {

    const deleted =
        await attendanceDeleteRecord(
            recordId
        );

    if (!deleted) {

        return;
    }

    const student =
        attendanceFindStudent(
            AttendanceState
                .currentStudentId
        );

    if (student) {

        AttendanceState
            .currentStudentHistory =
            attendanceGetStudentHistory(
                student.id
            );

        attendanceRenderStudentHistory(
            student
        );
    }
}


/* ============================================================
   NOTE MODAL
   ============================================================ */

function attendanceOpenNoteModal(
    studentId
) {

    const student =
        attendanceFindStudent(
            studentId
        );

    if (!student) {

        attendanceShowToast(
            "الطالب غير موجود",
            "error"
        );

        return;
    }

    const date =
        AttendanceState.selectedDate ||
        attendanceDateInputValue();

    const record =
        attendanceGetRecordForDate(
            studentId,
            date,
            AttendanceState.selectedClassId,
            AttendanceState.selectedSectionId
        );

    let modal =
        attendanceGetElement(
            "attendance-note-modal"
        );

    if (!modal) {

        attendanceCreateNoteModal();

        modal =
            attendanceGetElement(
                "attendance-note-modal"
            );
    }

    const title =
        attendanceGetElement(
            "attendance-note-title"
        );

    const noteInput =
        attendanceGetElement(
            "attendance-note-input"
        );

    const subjectInput =
        attendanceGetElement(
            "attendance-note-subject"
        );

    const lessonInput =
        attendanceGetElement(
            "attendance-note-lesson"
        );

    const studentIdInput =
        attendanceGetElement(
            "attendance-note-student-id"
        );

    if (title) {

        title.textContent =
            `ملاحظة: ${student.name}`;
    }

    if (noteInput) {

        noteInput.value =
            record
                ? record.note || ""
                : "";
    }

    if (subjectInput) {

        subjectInput.value =
            record
                ? record.subject || ""
                : "";
    }

    if (lessonInput) {

        lessonInput.value =
            record
                ? record.lesson || ""
                : "";
    }

    if (studentIdInput) {

        studentIdInput.value =
            studentId;
    }

    attendanceShowModal(
        modal
    );
}


/* ============================================================
   CREATE NOTE MODAL
   ============================================================ */

function attendanceCreateNoteModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "attendance-note-modal";

    modal.className =
        "attendance-modal-overlay";

    modal.innerHTML = `

        <div class="attendance-modal">

            <div class="attendance-modal-header">

                <div>

                    <span class="attendance-modal-icon">
                        📝
                    </span>

                    <h2 id="attendance-note-title">
                        ملاحظة الطالب
                    </h2>

                </div>

                <button
                    type="button"
                    class="attendance-modal-close"
                    onclick="attendanceCloseModal('attendance-note-modal')"
                >
                    ×
                </button>

            </div>

            <form
                id="attendance-note-form"
                class="attendance-form"
            >

                <input
                    type="hidden"
                    id="attendance-note-student-id"
                >

                <div class="attendance-field">

                    <label>
                        المادة
                    </label>

                    <input
                        id="attendance-note-subject"
                        type="text"
                        maxlength="150"
                        placeholder="مثال: الرياضيات"
                    >

                </div>

                <div class="attendance-field">

                    <label>
                        الدرس
                    </label>

                    <input
                        id="attendance-note-lesson"
                        type="text"
                        maxlength="200"
                        placeholder="موضوع الدرس"
                    >

                </div>

                <div class="attendance-field">

                    <label>
                        الملاحظة
                    </label>

                    <textarea
                        id="attendance-note-input"
                        rows="6"
                        maxlength="1000"
                        placeholder="اكتب ملاحظة الطالب..."
                    ></textarea>

                </div>

                <div class="attendance-note-date">

                    📅
                    ${attendanceFormatDate(
                        AttendanceState.selectedDate
                    )}

                </div>

                <div class="attendance-modal-footer">

                    <button
                        type="button"
                        class="attendance-secondary-button"
                        onclick="attendanceCloseModal('attendance-note-modal')"
                    >
                        إلغاء
                    </button>

                    <button
                        type="submit"
                        class="attendance-primary-button"
                    >
                        💾 حفظ الملاحظة
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    const form =
        attendanceGetElement(
            "attendance-note-form"
        );

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await attendanceSaveNote();
        }
    );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                attendanceCloseModal(
                    "attendance-note-modal"
                );
            }
        }
    );
}


/* ============================================================
   SAVE NOTE
   ============================================================ */

async function attendanceSaveNote() {

    const studentId =
        attendanceGetElement(
            "attendance-note-student-id"
        ).value;

    const note =
        attendanceGetElement(
            "attendance-note-input"
        ).value.trim();

    const subject =
        attendanceGetElement(
            "attendance-note-subject"
        ).value.trim();

    const lesson =
        attendanceGetElement(
            "attendance-note-lesson"
        ).value.trim();

    const student =
        attendanceFindStudent(
            studentId
        );

    if (!student) {

        return;
    }

    const date =
        AttendanceState.selectedDate ||
        attendanceDateInputValue();

    let record =
        attendanceGetRecordForDate(
            studentId,
            date,
            AttendanceState.selectedClassId,
            AttendanceState.selectedSectionId
        );

    if (!record) {

        record =
            attendanceNormalizeRecord({

                id:
                    attendanceGenerateId(
                        "attendance"
                    ),

                studentId,

                studentName:
                    student.name || "",

                classId:
                    student.classId ||
                    AttendanceState
                        .selectedClassId ||
                    "",

                sectionId:
                    student.sectionId ||
                    AttendanceState
                        .selectedSectionId ||
                    "",

                date,

                time:
                    attendanceFormatTime(
                        attendanceNowISO()
                    ),

                timestamp:
                    attendanceNowISO(),

                status:
                    ATTENDANCE_CONFIG
                        .DEFAULT_STATUS,

                note,

                subject,

                lesson
            });

    } else {

        record.note =
            note;

        record.subject =
            subject;

        record.lesson =
            lesson;

        record.updatedAt =
            attendanceNowISO();
    }

    try {

        const saved =
            await attendanceSaveRecord(
                record
            );

        const index =
            AttendanceState.records.findIndex(
                item =>
                    item.id === saved.id
            );

        if (index >= 0) {

            AttendanceState.records[index] =
                saved;

        } else {

            AttendanceState.records.push(
                saved
            );
        }

        attendanceCloseModal(
            "attendance-note-modal"
        );

        attendanceRenderStudentRowsOnly();

        attendanceShowToast(
            "تم حفظ الملاحظة",
            "success"
        );

    } catch (error) {

        console.error(
            "Save note error:",
            error
        );

        attendanceShowToast(
            "تعذر حفظ الملاحظة",
            "error"
        );
    }
}


/* ============================================================
   OPEN GLOBAL HISTORY
   ============================================================ */

function attendanceOpenHistory() {

    let modal =
        attendanceGetElement(
            "attendance-history-modal"
        );

    if (!modal) {

        attendanceCreateHistoryModal();

        modal =
            attendanceGetElement(
                "attendance-history-modal"
            );
    }

    attendanceRenderGlobalHistory();

    attendanceShowModal(
        modal
    );
}


/* ============================================================
   CREATE HISTORY MODAL
   ============================================================ */

function attendanceCreateHistoryModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "attendance-history-modal";

    modal.className =
        "attendance-modal-overlay";

    modal.innerHTML = `

        <div class="attendance-modal attendance-large-modal">

            <div class="attendance-modal-header">

                <div>

                    <span class="attendance-modal-icon">
                        📚
                    </span>

                    <h2>
                        سجل الحضور
                    </h2>

                </div>

                <button
                    type="button"
                    class="attendance-modal-close"
                    onclick="attendanceCloseModal('attendance-history-modal')"
                >
                    ×
                </button>

            </div>

            <div
                id="attendance-history-content"
                class="attendance-history-content"
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

                attendanceCloseModal(
                    "attendance-history-modal"
                );
            }
        }
    );
}


/* ============================================================
   GLOBAL HISTORY RENDER
   ============================================================ */

function attendanceRenderGlobalHistory() {

    const container =
        attendanceGetElement(
            "attendance-history-content"
        );

    if (!container) {

        return;
    }

    let records =
        [...AttendanceState.records];

    if (
        AttendanceState.selectedClassId
    ) {

        records =
            records.filter(
                record =>
                    String(
                        record.classId
                    ) ===
                    String(
                        AttendanceState
                            .selectedClassId
                    )
            );
    }

    if (
        AttendanceState.selectedSectionId
    ) {

        records =
            records.filter(
                record =>
                    String(
                        record.sectionId
                    ) ===
                    String(
                        AttendanceState
                            .selectedSectionId
                    )
            );
    }

    records.sort(
        (a, b) => {

            const first =
                `${b.date} ${b.timestamp}`;

            const second =
                `${a.date} ${a.timestamp}`;

            return first.localeCompare(
                second
            );
        }
    );

    container.innerHTML = `

        <div class="attendance-history-summary">

            <div>
                <strong>
                    ${records.length}
                </strong>

                <span>
                    سجل
                </span>
            </div>

            <button
                type="button"
                class="attendance-primary-button"
                onclick="attendanceExportAllRecords()"
            >
                ⬇️ تصدير السجل
            </button>

        </div>

        <div class="attendance-history-table">

            <div class="attendance-history-table-header">

                <span>
                    الطالب
                </span>

                <span>
                    التاريخ
                </span>

                <span>
                    الوقت
                </span>

                <span>
                    الحالة
                </span>

                <span>
                    الملاحظة
                </span>

                <span>
                    إجراء
                </span>

            </div>

            ${
                records.length
                    ? records
                        .map(
                            record =>
                                attendanceCreateGlobalHistoryRow(
                                    record
                                )
                        )
                        .join("")
                    : `
                        <div class="attendance-empty-state compact">

                            <div class="attendance-empty-icon">
                                📭
                            </div>

                            <h3>
                                لا توجد سجلات
                            </h3>

                        </div>
                      `
            }

        </div>
    `;
}


/* ============================================================
   GLOBAL HISTORY ROW
   ============================================================ */

function attendanceCreateGlobalHistoryRow(
    record
) {

    return `

        <div class="attendance-history-row">

            <button
                type="button"
                class="attendance-history-student-link"
                onclick="attendanceOpenStudentHistory('${classesSafeValue(
                    record.studentId
                )}')"
            >
                ${attendanceEscapeHTML(
                    record.studentName ||
                    "طالب"
                )}
            </button>

            <span>
                ${attendanceFormatShortDate(
                    record.date
                )}
            </span>

            <span>
                ${attendanceEscapeHTML(
                    record.time ||
                    "—"
                )}
            </span>

            <span class="attendance-history-status ${attendanceGetStatusClass(
                record.status
            )}">
                ${attendanceGetStatusIcon(
                    record.status
                )}
                ${attendanceGetStatusLabel(
                    record.status
                )}
            </span>

            <span>
                ${
                    record.note
                        ? attendanceEscapeHTML(
                            record.note
                          )
                        : "—"
                }
            </span>

            <button
                type="button"
                class="attendance-delete-button"
                onclick="attendanceDeleteHistoryRecord('${classesSafeValue(
                    record.id
                )}')"
            >
                🗑️
            </button>

        </div>
    `;
}


/* ============================================================
   REPEATED ABSENCE MODAL
   ============================================================ */

function attendanceOpenRepeatedAbsence() {

    let modal =
        attendanceGetElement(
            "attendance-repeated-modal"
        );

    if (!modal) {

        attendanceCreateRepeatedAbsenceModal();

        modal =
            attendanceGetElement(
                "attendance-repeated-modal"
            );
    }

    attendanceRenderRepeatedAbsence();

    attendanceShowModal(
        modal
    );
}


/* ============================================================
   CREATE REPEATED ABSENCE MODAL
   ============================================================ */

function attendanceCreateRepeatedAbsenceModal() {

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "attendance-repeated-modal";

    modal.className =
        "attendance-modal-overlay";

    modal.innerHTML = `

        <div class="attendance-modal attendance-large-modal">

            <div class="attendance-modal-header">

                <div>

                    <span class="attendance-modal-icon">
                        ⚠️
                    </span>

                    <h2>
                        الغياب المتكرر
                    </h2>

                </div>

                <button
                    type="button"
                    class="attendance-modal-close"
                    onclick="attendanceCloseModal('attendance-repeated-modal')"
                >
                    ×
                </button>

            </div>

            <div
                id="attendance-repeated-content"
                class="attendance-repeated-content"
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

                attendanceCloseModal(
                    "attendance-repeated-modal"
                );
            }
        }
    );
}


/* ============================================================
   RENDER REPEATED ABSENCE
   ============================================================ */

function attendanceRenderRepeatedAbsence() {

    const container =
        attendanceGetElement(
            "attendance-repeated-content"
        );

    if (!container) {

        return;
    }

    const repeated =
        attendanceGetRepeatedAbsenceStudents();

    container.innerHTML = `

        <div class="attendance-warning-description">

            <span>
                ⚠️
            </span>

            <p>
                يتم هنا عرض الطلاب الذين لديهم ثلاثة غيابات أو أكثر
                أو غياب متتالي مسجل في النظام.
            </p>

        </div>

        ${
            repeated.length
                ? repeated
                    .map(
                        item => `

                            <button
                                type="button"
                                class="attendance-repeated-student"
                                onclick="attendanceOpenStudentHistory('${classesSafeValue(
                                    item.student.id
                                )}')"
                            >

                                <div class="attendance-repeated-avatar">
                                    👤
                                </div>

                                <div>

                                    <strong>
                                        ${attendanceEscapeHTML(
                                            item.student.name ||
                                            "طالب"
                                        )}
                                    </strong>

                                    <span>
                                        غياب:
                                        ${item.statistics.absent}
                                        • حضور:
                                        ${item.statistics.present}
                                    </span>

                                </div>

                                <div class="attendance-repeated-count">
                                    ${item.statistics.absent}
                                </div>

                            </button>
                        `
                    )
                    .join("")
                : `
                    <div class="attendance-empty-state">

                        <div class="attendance-empty-icon">
                            🟢
                        </div>

                        <h3>
                            لا يوجد غياب متكرر
                        </h3>

                        <p>
                            جميع الطلاب ضمن الحدود المسجلة حالياً.
                        </p>

                    </div>
                  `
        }

    `;
}


/* ============================================================
   EXPORT STUDENT HISTORY
   ============================================================ */

function attendanceExportStudentHistory(
    studentId
) {

    const student =
        attendanceFindStudent(
            studentId
        );

    if (!student) {

        attendanceShowToast(
            "الطالب غير موجود",
            "error"
        );

        return;
    }

    const records =
        attendanceGetStudentHistory(
            studentId
        );

    const statistics =
        attendanceGetStudentStatistics(
            studentId
        );

    const data = {

        generatedAt:
            attendanceNowISO(),

        student: {

            id:
                student.id,

            name:
                student.name || "",

            code:
                student.code || "",

            classId:
                student.classId || "",

            sectionId:
                student.sectionId || ""
        },

        statistics,

        attendance:
            records
    };

    attendanceDownloadJSON(
        data,
        `student-attendance-${student.id}.json`
    );

    attendanceShowToast(
        "تم تنزيل سجل الطالب",
        "success"
    );
}


/* ============================================================
   EXPORT ALL RECORDS
   ============================================================ */

function attendanceExportAllRecords() {

    const data = {

        generatedAt:
            attendanceNowISO(),

        filters: {

            classId:
                AttendanceState.selectedClassId,

            sectionId:
                AttendanceState.selectedSectionId,

            date:
                AttendanceState.selectedDate
        },

        records:
            AttendanceState.records
    };

    attendanceDownloadJSON(
        data,
        `attendance-backup-${attendanceDateInputValue()}.json`
    );

    attendanceShowToast(
        "تم تصدير سجل الحضور",
        "success"
    );
}


/* ============================================================
   DOWNLOAD JSON
   ============================================================ */

function attendanceDownloadJSON(
    data,
    filename
) {

    try {

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

        const anchor =
            document.createElement(
                "a"
            );

        anchor.href =
            url;

        anchor.download =
            filename;

        document.body.appendChild(
            anchor
        );

        anchor.click();

        anchor.remove();

        URL.revokeObjectURL(
            url
        );

    } catch (error) {

        console.error(
            "Download JSON error:",
            error
        );

        attendanceShowToast(
            "تعذر إنشاء الملف",
            "error"
        );
    }
}


/* ============================================================
   IMPORT ATTENDANCE
   ============================================================ */

async function attendanceImportRecords(
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

        const records =
            Array.isArray(data)
                ? data
                : Array.isArray(
                    data.records
                  )
                    ? data.records
                    : [];

        if (!records.length) {

            throw new Error(
                "No attendance records"
            );
        }

        for (
            const item of records
        ) {

            const normalized =
                attendanceNormalizeRecord(
                    item
                );

            await attendanceSaveRecord(
                normalized
            );
        }

        await attendanceLoadAllRecords();

        attendanceRender();

        attendanceShowToast(
            "تم استيراد سجل الحضور",
            "success"
        );

    } catch (error) {

        console.error(
            "Import attendance error:",
            error
        );

        attendanceShowToast(
            "ملف الحضور غير صالح",
            "error"
        );
    }
}


/* ============================================================
   MODAL HELPERS
   ============================================================ */

function attendanceShowModal(
    modal
) {

    if (!modal) {

        return;
    }

    modal.classList.add(
        "visible"
    );

    document.body.classList.add(
        "attendance-modal-open"
    );
}


function attendanceCloseModal(
    modalId
) {

    const modal =
        attendanceGetElement(
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
                !attendanceQuery(
                    ".attendance-modal-overlay.visible"
                )
            ) {

                document.body.classList.remove(
                    "attendance-modal-open"
                );
            }

        },
        250
    );
}


/* ============================================================
   LOADING
   ============================================================ */

function attendanceSetLoading(
    loading
) {

    AttendanceState.loading =
        loading;

    const container =
        attendanceGetElement(
            "attendance-container"
        );

    if (!container) {

        return;
    }

    if (loading) {

        container.classList.add(
            "attendance-loading"
        );

    } else {

        container.classList.remove(
            "attendance-loading"
        );
    }
}


/* ============================================================
   TOAST
   ============================================================ */

function attendanceShowToast(
    message,
    type = "info"
) {

    let container =
        attendanceGetElement(
            "attendance-toast-container"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "attendance-toast-container";

        container.className =
            "attendance-toast-container";

        document.body.appendChild(
            container
        );
    }

    const icons = {

        success: "✓",

        error: "×",

        warning: "!",

        info: "i"
    };

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `attendance-toast attendance-toast-${type}`;

    toast.innerHTML = `

        <span class="attendance-toast-icon">
            ${icons[type] || "i"}
        </span>

        <span>
            ${attendanceEscapeHTML(
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
   KEYBOARD SHORTCUTS
   ============================================================ */

function attendanceSetupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                const modals =
                    attendanceQueryAll(
                        ".attendance-modal-overlay.visible"
                    );

                const last =
                    modals[
                        modals.length - 1
                    ];

                if (last) {

                    attendanceCloseModal(
                        last.id
                    );
                }
            }


            if (
                event.ctrlKey &&
                event.key.toLowerCase() === "k"
            ) {

                const search =
                    attendanceGetElement(
                        "attendance-search"
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
   ENSURE CONTAINER
   ============================================================ */

function attendanceEnsureContainer() {

    let page =
        attendanceGetElement(
            "attendance-page"
        );

    if (!page) {

        page =
            document.createElement(
                "section"
            );

        page.id =
            "attendance-page";

        page.className =
            "attendance-page";

        page.innerHTML = `

            <div
                id="attendance-container"
                class="attendance-container"
            ></div>

        `;

        const main =
            attendanceGetElement(
                "app-main"
            ) ||
            attendanceGetElement(
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
        !attendanceGetElement(
            "attendance-container"
        )
    ) {

        const container =
            document.createElement(
                "div"
            );

        container.id =
            "attendance-container";

        container.className =
            "attendance-container";

        page.appendChild(
            container
        );
    }
}


/* ============================================================
   INITIALIZE
   ============================================================ */

async function attendanceInit() {

    if (
        AttendanceState.initialized
    ) {

        return;
    }

    attendanceEnsureContainer();

    AttendanceState.selectedDate =
        attendanceDateInputValue();

    attendanceSetLoading(
        true
    );

    try {

        await attendanceLoadAllRecords();

        await attendanceLoadStudents();

        await attendanceLoadClasses();

        attendanceSetupKeyboard();

        attendanceRender();

        AttendanceState.initialized =
            true;

    } catch (error) {

        console.error(
            "Attendance init error:",
            error
        );

        attendanceShowToast(
            "تعذر تشغيل قسم الحضور",
            "error"
        );

    } finally {

        attendanceSetLoading(
            false
        );
    }
}


/* ============================================================
   REFRESH
   ============================================================ */

async function attendanceRefresh() {

    attendanceSetLoading(
        true
    );

    try {

        await attendanceLoadAllRecords();

        await attendanceLoadStudents();

        await attendanceLoadClasses();

        attendanceRender();

    } finally {

        attendanceSetLoading(
            false
        );
    }
}


/* ============================================================
   SET CLASS
   ============================================================ */

function attendanceSetClass(
    classId
) {

    AttendanceState.selectedClassId =
        classId || null;

    AttendanceState.selectedSectionId =
        null;

    attendanceRender();
}


/* ============================================================
   SET SECTION
   ============================================================ */

function attendanceSetSection(
    sectionId
) {

    AttendanceState.selectedSectionId =
        sectionId || null;

    attendanceRender();
}


/* ============================================================
   SET DATE
   ============================================================ */

function attendanceSetDate(
    date
) {

    AttendanceState.selectedDate =
        date ||
        attendanceDateInputValue();

    attendanceRender();
}


/* ============================================================
   CLEAR FILTERS
   ============================================================ */

function attendanceClearFilters() {

    AttendanceState.selectedClassId =
        null;

    AttendanceState.selectedSectionId =
        null;

    AttendanceState.searchText =
        "";

    AttendanceState.currentFilter =
        "all";

    attendanceRender();
}


/* ============================================================
   GET RECORDS FOR DATE
   ============================================================ */

function attendanceGetRecordsForDate(
    date
) {

    return AttendanceState.records.filter(
        record =>
            record.date === date
    );
}


/* ============================================================
   GET STUDENT ABSENCES
   ============================================================ */

function attendanceGetStudentAbsences(
    studentId
) {

    return attendanceGetStudentHistory(
        studentId
    ).filter(
        record =>
            record.status ===
            ATTENDANCE_CONFIG.STATUSES
                .ABSENT
    );
}


/* ============================================================
   GET STUDENT PRESENCE
   ============================================================ */

function attendanceGetStudentPresence(
    studentId
) {

    return attendanceGetStudentHistory(
        studentId
    ).filter(
        record =>
            record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .PRESENT ||
            record.status ===
                ATTENDANCE_CONFIG.STATUSES
                    .LATE
    );
}


/* ============================================================
   GET STUDENT EXCUSES
   ============================================================ */

function attendanceGetStudentExcuses(
    studentId
) {

    return attendanceGetStudentHistory(
        studentId
    ).filter(
        record =>
            record.status ===
            ATTENDANCE_CONFIG.STATUSES
                .EXCUSED
    );
}


/* ============================================================
   DATABASE INTEGRITY
   ============================================================ */

async function attendanceRepairRecords() {

    try {

        const records =
            await attendanceLoadAllRecords();

        let repaired = 0;

        for (
            const record of records
        ) {

            const normalized =
                attendanceNormalizeRecord(
                    record
                );

            const changed =
                JSON.stringify(
                    normalized
                ) !==
                JSON.stringify(
                    record
                );

            if (changed) {

                await attendanceSaveRecord(
                    normalized
                );

                repaired++;
            }
        }

        await attendanceLoadAllRecords();

        attendanceRender();

        attendanceShowToast(
            `تم فحص السجل وإصلاح ${repaired} سجل`,
            "success"
        );

    } catch (error) {

        console.error(
            "Repair records error:",
            error
        );

        attendanceShowToast(
            "تعذر فحص السجل",
            "error"
        );
    }
}


/* ============================================================
   PUBLIC MODULE API
   ============================================================ */

window.AttendanceModule = {

    init:
        attendanceInit,

    refresh:
        attendanceRefresh,

    getAll:
        () =>
            [
                ...AttendanceState.records
            ],

    getStudentHistory:
        attendanceGetStudentHistory,

    getStudentStatistics:
        attendanceGetStudentStatistics,

    getClassStatistics:
        attendanceGetClassStatistics,

    getRepeatedAbsence:
        attendanceGetRepeatedAbsenceStudents,

    markStudent:
        attendanceMarkStudent,

    markAll:
        attendanceMarkAll,

    deleteRecord:
        attendanceDeleteRecord,

    exportStudent:
        attendanceExportStudentHistory,

    exportAll:
        attendanceExportAllRecords,

    import:
        attendanceImportRecords,

    repair:
        attendanceRepairRecords,

    setClass:
        attendanceSetClass,

    setSection:
        attendanceSetSection,

    setDate:
        attendanceSetDate,

    clearFilters:
        attendanceClearFilters,

    state:
        AttendanceState,

    config:
        ATTENDANCE_CONFIG
};


/* ============================================================
   GLOBAL FUNCTIONS
   ============================================================ */

window.attendanceInit =
    attendanceInit;

window.attendanceRefresh =
    attendanceRefresh;

window.attendanceRender =
    attendanceRender;

window.attendanceQuickMark =
    attendanceQuickMark;

window.attendanceMarkAll =
    attendanceMarkAll;

window.attendanceMarkStudent =
    attendanceMarkStudent;

window.attendanceOpenHistory =
    attendanceOpenHistory;

window.attendanceOpenStudentHistory =
    attendanceOpenStudentHistory;

window.attendanceOpenRepeatedAbsence =
    attendanceOpenRepeatedAbsence;

window.attendanceOpenNoteModal =
    attendanceOpenNoteModal;

window.attendanceDeleteRecord =
    attendanceDeleteRecord;

window.attendanceDeleteHistoryRecord =
    attendanceDeleteHistoryRecord;

window.attendanceExportStudentHistory =
    attendanceExportStudentHistory;

window.attendanceExportAllRecords =
    attendanceExportAllRecords;

window.attendanceImportRecords =
    attendanceImportRecords;

window.attendanceSetClass =
    attendanceSetClass;

window.attendanceSetSection =
    attendanceSetSection;

window.attendanceSetDate =
    attendanceSetDate;

window.attendanceClearFilters =
    attendanceClearFilters;

window.attendanceShowToast =
    attendanceShowToast;

window.attendanceCloseModal =
    attendanceCloseModal;


/* ============================================================
   AUTO START
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        attendanceInit,
        {
            once: true
        }
    );

} else {

    attendanceInit();
}


/* ============================================================
   END OF FILE 14 — attendance.js
   ============================================================ */