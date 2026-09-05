/* ============================================================
   TEACHER PRO
   FILE: js/dashboard.js
   MODULE: DASHBOARD
   VERSION: 1.0.0
   ============================================================ */

"use strict";


/* ============================================================
   DASHBOARD STATE
   ============================================================ */

const DashboardState = {

    initialized: false,

    activeClassId: null,

    activeSectionId: null,

    activeLessonId: null,

    today: null,

    totalStudents: 0,

    presentStudents: 0,

    absentStudents: 0,

    lateStudents: 0,

    excusedStudents: 0,

    unknownStudents: 0,

    attendancePercentage: 0,

    currentClass: null,

    currentSection: null,

    currentLesson: null,

    currentTopic: null,

    todayNote: null,

    pinnedNote: null,

    nextReminder: null,

    reminders: [],

    recentNotes: [],

    refreshTimer: null,

    clockTimer: null,

    lastRefresh: null,

    loading: false

};


/* ============================================================
   DASHBOARD SELECTORS
   ============================================================ */

const DASHBOARD_SELECTORS = {

    dashboard:
        "[data-dashboard]",

    totalStudents:
        "[data-dashboard-total-students]",

    presentStudents:
        "[data-dashboard-present-students]",

    absentStudents:
        "[data-dashboard-absent-students]",

    lateStudents:
        "[data-dashboard-late-students]",

    excusedStudents:
        "[data-dashboard-excused-students]",

    attendancePercentage:
        "[data-dashboard-attendance-percentage]",

    attendanceProgress:
        "[data-dashboard-attendance-progress]",

    className:
        "[data-dashboard-class]",

    sectionName:
        "[data-dashboard-section]",

    lessonName:
        "[data-dashboard-lesson]",

    lessonTopic:
        "[data-dashboard-topic]",

    lessonTime:
        "[data-dashboard-lesson-time]",

    note:
        "[data-dashboard-note]",

    reminder:
        "[data-dashboard-reminder]",

    reminderDate:
        "[data-dashboard-reminder-date]",

    reminderTime:
        "[data-dashboard-reminder-time]",

    today:
        "[data-dashboard-today]",

    clock:
        "[data-dashboard-clock]",

    date:
        "[data-dashboard-date]",

    lastUpdate:
        "[data-dashboard-last-update]",

    currentClassCard:
        "[data-dashboard-class-card]",

    currentLessonCard:
        "[data-dashboard-lesson-card]",

    reminderCard:
        "[data-dashboard-reminder-card]",

    noteCard:
        "[data-dashboard-note-card]",

    attendanceCard:
        "[data-dashboard-attendance-card]",

    stat:
        "[data-dashboard-stat]"

};


/* ============================================================
   SAFE DOM HELPERS
   ============================================================ */

function dashboardQuery(selector, parent = document) {

    try {

        return parent.querySelector(selector);

    } catch (error) {

        console.warn(
            "Dashboard selector error:",
            selector,
            error
        );

        return null;

    }

}


function dashboardQueryAll(selector, parent = document) {

    try {

        return Array.from(
            parent.querySelectorAll(selector)
        );

    } catch (error) {

        console.warn(
            "Dashboard selector error:",
            selector,
            error
        );

        return [];

    }

}


/* ============================================================
   DATABASE HELPER
   ============================================================ */

function getDashboardDB() {

    if (
        window.TeacherProDB
    ) {

        return window.TeacherProDB;

    }

    return null;

}


/* ============================================================
   GENERIC DATABASE CALL
   ============================================================ */

async function dashboardDBCall(
    methodNames,
    ...args
) {

    const db =
        getDashboardDB();


    if (
        !db
    ) {

        return null;

    }


    const methods =
        Array.isArray(
            methodNames
        )
            ? methodNames
            : [methodNames];


    for (
        const methodName
        of methods
    ) {

        if (
            typeof db[methodName] ===
            "function"
        ) {

            try {

                return await db[
                    methodName
                ](
                    ...args
                );

            } catch (error) {

                console.warn(
                    `Dashboard DB call failed: ${methodName}`,
                    error
                );

            }

        }

    }


    return null;

}


/* ============================================================
   INITIALIZE DASHBOARD
   ============================================================ */

async function initializeDashboard() {

    if (
        DashboardState.initialized
    ) {

        return;

    }


    DashboardState.initialized =
        true;


    DashboardState.today =
        new Date();


    bindDashboardEvents();

    updateDashboardClock();

    updateDashboardDate();

    await loadDashboardData();

    renderDashboard();

    startDashboardAutoRefresh();

}


/* ============================================================
   MODULE INITIALIZATION
   ============================================================ */

const TeacherProDashboard = {

    init:
        initializeDashboard,

    activate:
        async function () {

            await loadDashboardData();

            renderDashboard();

        },

    refresh:
        async function () {

            await refreshDashboard();

        },

    state:
        DashboardState

};


window.TeacherProDashboard =
    TeacherProDashboard;


/* ============================================================
   LOAD ALL DASHBOARD DATA
   ============================================================ */

async function loadDashboardData() {

    if (
        DashboardState.loading
    ) {

        return;

    }


    DashboardState.loading =
        true;


    try {

        DashboardState.today =
            new Date();


        await detectActiveClass();

        await detectActiveSection();

        await loadStudentStatistics();

        await loadAttendanceStatistics();

        await loadCurrentLesson();

        await loadTodayNote();

        await loadNextReminder();

        DashboardState.lastRefresh =
            new Date();

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    } finally {

        DashboardState.loading =
            false;

    }

}


/* ============================================================
   DETECT ACTIVE CLASS
   ============================================================ */

async function detectActiveClass() {

    let activeClass =
        null;


    if (
        DashboardState.activeClassId
    ) {

        activeClass =
            await dashboardDBCall(
                [
                    "getClassById",
                    "getClass"
                ],
                DashboardState.activeClassId
            );

    }


    if (
        !activeClass
    ) {

        activeClass =
            await dashboardDBCall(
                [
                    "getSelectedClass",
                    "getActiveClass"
                ]
            );

    }


    if (
        !activeClass
    ) {

        const classes =
            await dashboardDBCall(
                [
                    "getAllClasses",
                    "getClasses"
                ]
            );


        if (
            Array.isArray(classes) &&
            classes.length
        ) {

            activeClass =
                classes.find(
                    item =>
                        item &&
                        (
                            item.active === true ||
                            item.selected === true
                        )
                ) ||
                classes[0];

        }

    }


    if (
        activeClass
    ) {

        DashboardState.currentClass =
            activeClass;

        DashboardState.activeClassId =
            activeClass.id ||
            activeClass.classId ||
            null;

    } else {

        DashboardState.currentClass =
            null;

    }

}


/* ============================================================
   DETECT ACTIVE SECTION
   ============================================================ */

async function detectActiveSection() {

    if (
        !DashboardState.activeClassId
    ) {

        DashboardState.currentSection =
            null;

        return;

    }


    let section =
        null;


    if (
        DashboardState.activeSectionId
    ) {

        section =
            await dashboardDBCall(
                [
                    "getSectionById",
                    "getSection"
                ],
                DashboardState.activeSectionId
            );

    }


    if (
        !section
    ) {

        section =
            await dashboardDBCall(
                [
                    "getSelectedSection",
                    "getActiveSection"
                ],
                DashboardState.activeClassId
            );

    }


    if (
        !section
    ) {

        const sections =
            await dashboardDBCall(
                [
                    "getSectionsByClassId",
                    "getSectionsForClass"
                ],
                DashboardState.activeClassId
            );


        if (
            Array.isArray(sections) &&
            sections.length
        ) {

            section =
                sections.find(
                    item =>
                        item &&
                        (
                            item.active === true ||
                            item.selected === true
                        )
                ) ||
                sections[0];

        }

    }


    DashboardState.currentSection =
        section ||
        null;


    if (
        section
    ) {

        DashboardState.activeSectionId =
            section.id ||
            section.sectionId ||
            null;

    }

}


/* ============================================================
   LOAD STUDENT STATISTICS
   ============================================================ */

async function loadStudentStatistics() {

    let students =
        [];


    if (
        DashboardState.activeSectionId
    ) {

        students =
            await dashboardDBCall(
                [
                    "getStudentsBySectionId",
                    "getStudentsForSection"
                ],
                DashboardState.activeSectionId
            ) ||
            [];

    }


    if (
        !students.length &&
        DashboardState.activeClassId
    ) {

        students =
            await dashboardDBCall(
                [
                    "getStudentsByClassId",
                    "getStudentsForClass"
                ],
                DashboardState.activeClassId
            ) ||
            [];

    }


    if (
        !students.length
    ) {

        students =
            await dashboardDBCall(
                [
                    "getAllStudents",
                    "getStudents"
                ]
            ) ||
            [];

    }


    const activeStudents =
        students.filter(
            student =>
                student &&
                student.active !== false &&
                student.deleted !== true
        );


    DashboardState.totalStudents =
        activeStudents.length;

}


/* ============================================================
   LOAD ATTENDANCE STATISTICS
   ============================================================ */

async function loadAttendanceStatistics() {

    const dateKey =
        getDashboardDateKey(
            new Date()
        );


    let records =
        [];


    if (
        DashboardState.activeSectionId
    ) {

        records =
            await dashboardDBCall(
                [
                    "getAttendanceBySectionAndDate",
                    "getAttendanceForSection"
                ],
                DashboardState.activeSectionId,
                dateKey
            ) ||
            [];

    }


    if (
        !records.length
    ) {

        records =
            await dashboardDBCall(
                [
                    "getAttendanceByDate",
                    "getAttendanceForDate"
                ],
                dateKey
            ) ||
            [];

    }


    if (
        !Array.isArray(records)
    ) {

        records =
            [];

    }


    DashboardState.presentStudents =
        countAttendanceStatus(
            records,
            "present"
        );


    DashboardState.absentStudents =
        countAttendanceStatus(
            records,
            "absent"
        );


    DashboardState.lateStudents =
        countAttendanceStatus(
            records,
            "late"
        );


    DashboardState.excusedStudents =
        countAttendanceStatus(
            records,
            "excused"
        );


    const accounted =
        DashboardState.presentStudents +
        DashboardState.absentStudents +
        DashboardState.lateStudents +
        DashboardState.excusedStudents;


    DashboardState.unknownStudents =
        Math.max(
            0,
            DashboardState.totalStudents -
            accounted
        );


    if (
        DashboardState.totalStudents > 0
    ) {

        DashboardState.attendancePercentage =
            Math.round(
                (
                    DashboardState.presentStudents /
                    DashboardState.totalStudents
                ) *
                100
            );

    } else {

        DashboardState.attendancePercentage =
            0;

    }

}


/* ============================================================
   COUNT ATTENDANCE STATUS
   ============================================================ */

function countAttendanceStatus(
    records,
    status
) {

    return records.filter(
        record =>
            record &&
            normalizeAttendanceStatus(
                record.status
            ) === status
    ).length;

}


/* ============================================================
   NORMALIZE ATTENDANCE STATUS
   ============================================================ */

function normalizeAttendanceStatus(
    status
) {

    if (
        !status
    ) {

        return "unknown";

    }


    const value =
        String(
            status
        )
            .trim()
            .toLowerCase();


    const map = {

        present:
            "present",

        حاضر:
            "present",

        حضور:
            "present",

        absent:
            "absent",

        غائب:
            "absent",

        غياب:
            "absent",

        late:
            "late",

        متأخر:
            "late",

        متاخر:
            "late",

        excused:
            "excused",

        مجاز:
            "excused",

        إجازة:
            "excused",

        اجازه:
            "excused"

    };


    return (
        map[value] ||
        "unknown"
    );

}


/* ============================================================
   LOAD CURRENT LESSON
   ============================================================ */

async function loadCurrentLesson() {

    const now =
        new Date();


    const day =
        getDashboardDayId(
            now
        );


    let lesson =
        await dashboardDBCall(
            [
                "getCurrentScheduleItem",
                "getCurrentLesson"
            ],
            day,
            now
        );


    if (
        !lesson &&
        DashboardState.activeClassId
    ) {

        lesson =
            await dashboardDBCall(
                [
                    "getCurrentLessonForClass",
                    "getCurrentScheduleForClass"
                ],
                DashboardState.activeClassId,
                day,
                now
            );

    }


    DashboardState.currentLesson =
        lesson ||
        null;


    if (
        lesson
    ) {

        DashboardState.activeLessonId =
            lesson.id ||
            lesson.lessonId ||
            null;


        DashboardState.currentTopic =
            lesson.topic ||
            lesson.subject ||
            lesson.lesson ||
            null;

    } else {

        DashboardState.activeLessonId =
            null;

        DashboardState.currentTopic =
            null;

    }

}


/* ============================================================
   LOAD TODAY NOTE
   ============================================================ */

async function loadTodayNote() {

    let note =
        null;


    if (
        DashboardState.activeSectionId
    ) {

        note =
            await dashboardDBCall(
                [
                    "getTodayNoteForSection",
                    "getSectionTodayNote"
                ],
                DashboardState.activeSectionId
            );

    }


    if (
        !note
    ) {

        note =
            await dashboardDBCall(
                [
                    "getPinnedNote",
                    "getTodayNote",
                    "getActiveNote"
                ]
            );

    }


    DashboardState.todayNote =
        note ||
        null;


    DashboardState.pinnedNote =
        note ||
        null;

}


/* ============================================================
   LOAD NEXT REMINDER
   ============================================================ */

async function loadNextReminder() {

    let reminder =
        null;


    reminder =
        await dashboardDBCall(
            [
                "getNextReminder",
                "getUpcomingReminder"
            ]
        );


    if (
        !reminder
    ) {

        const reminders =
            await dashboardDBCall(
                [
                    "getActiveReminders",
                    "getAllReminders"
                ]
            );


        if (
            Array.isArray(reminders)
        ) {

            const now =
                Date.now();


            const upcoming =
                reminders
                    .filter(
                        item =>
                            item &&
                            item.active !== false &&
                            item.deleted !== true
                    )
                    .map(
                        item => {

                            const timestamp =
                                getReminderTimestamp(
                                    item
                                );


                            return {

                                item,
                                timestamp

                            };

                        }
                    )
                    .filter(
                        item =>
                            item.timestamp &&
                            item.timestamp >= now
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.timestamp -
                            b.timestamp
                    );


            if (
                upcoming.length
            ) {

                reminder =
                    upcoming[0].item;

            }

        }

    }


    DashboardState.nextReminder =
        reminder ||
        null;

}


/* ============================================================
   GET REMINDER TIMESTAMP
   ============================================================ */

function getReminderTimestamp(
    reminder
) {

    if (
        !reminder
    ) {

        return null;

    }


    if (
        reminder.timestamp
    ) {

        const timestamp =
            Number(
                reminder.timestamp
            );


        if (
            Number.isFinite(
                timestamp
            )
        ) {

            return timestamp;

        }

    }


    const dateValue =
        reminder.date ||
        reminder.datetime ||
        reminder.dateTime;


    if (
        dateValue
    ) {

        const timestamp =
            new Date(
                dateValue
            ).getTime();


        if (
            !Number.isNaN(
                timestamp
            )
        ) {

            return timestamp;

        }

    }


    return null;

}


/* ============================================================
   RENDER DASHBOARD
   ============================================================ */

function renderDashboard() {

    renderDashboardStatistics();

    renderCurrentClass();

    renderCurrentSection();

    renderCurrentLesson();

    renderTodayNote();

    renderNextReminder();

    renderDashboardDate();

    renderLastUpdate();

}


/* ============================================================
   RENDER STATISTICS
   ============================================================ */

function renderDashboardStatistics() {

    setDashboardValue(
        DASHBOARD_SELECTORS.totalStudents,
        DashboardState.totalStudents
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.presentStudents,
        DashboardState.presentStudents
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.absentStudents,
        DashboardState.absentStudents
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.lateStudents,
        DashboardState.lateStudents
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.excusedStudents,
        DashboardState.excusedStudents
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.attendancePercentage,
        `${DashboardState.attendancePercentage}%`,
        false
    );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.attendanceProgress
    ).forEach(
        element => {

            element.style.width =
                `${DashboardState.attendancePercentage}%`;

            element.setAttribute(
                "aria-valuenow",
                String(
                    DashboardState.attendancePercentage
                )
            );

        }
    );


    dashboardQueryAll(
        "[data-dashboard-unknown-students]"
    ).forEach(
        element => {

            element.textContent =
                String(
                    DashboardState.unknownStudents
                );

        }
    );

}


/* ============================================================
   RENDER CLASS
   ============================================================ */

function renderCurrentClass() {

    const currentClass =
        DashboardState.currentClass;


    const name =
        currentClass
            ? (
                currentClass.name ||
                currentClass.className ||
                currentClass.title ||
                currentClass.grade ||
                "—"
            )
            : "لم يتم تحديد الصف";


    setDashboardValue(
        DASHBOARD_SELECTORS.className,
        name,
        false
    );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.currentClassCard
    ).forEach(
        card => {

            card.dataset.active =
                currentClass
                    ? "true"
                    : "false";

        }
    );

}


/* ============================================================
   RENDER SECTION
   ============================================================ */

function renderCurrentSection() {

    const section =
        DashboardState.currentSection;


    const name =
        section
            ? (
                section.name ||
                section.sectionName ||
                section.title ||
                section.label ||
                "—"
            )
            : "لم يتم تحديد الشعبة";


    setDashboardValue(
        DASHBOARD_SELECTORS.sectionName,
        name,
        false
    );


    dashboardQueryAll(
        "[data-dashboard-class-section]"
    ).forEach(
        element => {

            const className =
                DashboardState.currentClass
                    ? (
                        DashboardState.currentClass.name ||
                        DashboardState.currentClass.className ||
                        ""
                    )
                    : "";


            element.textContent =
                className
                    ? `${className} — ${name}`
                    : name;

        }
    );

}


/* ============================================================
   RENDER LESSON
   ============================================================ */

function renderCurrentLesson() {

    const lesson =
        DashboardState.currentLesson;


    const lessonName =
        lesson
            ? (
                lesson.lesson ||
                lesson.subject ||
                lesson.title ||
                lesson.name ||
                "درس"
            )
            : "لا توجد حصة حالية";


    const topic =
        lesson
            ? (
                lesson.topic ||
                lesson.lessonTopic ||
                lesson.description ||
                "لم يتم تحديد موضوع"
            )
            : "—";


    const time =
        lesson
            ? formatLessonTime(
                lesson
            )
            : "—";


    setDashboardValue(
        DASHBOARD_SELECTORS.lessonName,
        lessonName,
        false
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.lessonTopic,
        topic,
        false
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.lessonTime,
        time,
        false
    );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.currentLessonCard
    ).forEach(
        card => {

            card.dataset.active =
                lesson
                    ? "true"
                    : "false";

        }
    );

}


/* ============================================================
   FORMAT LESSON TIME
   ============================================================ */

function formatLessonTime(
    lesson
) {

    if (
        lesson.startTime &&
        lesson.endTime
    ) {

        return `${lesson.startTime} - ${lesson.endTime}`;

    }


    if (
        lesson.time
    ) {

        return String(
            lesson.time
        );

    }


    if (
        lesson.start
    ) {

        return String(
            lesson.start
        );

    }


    return "الوقت غير محدد";

}


/* ============================================================
   RENDER NOTE
   ============================================================ */

function renderTodayNote() {

    const note =
        DashboardState.todayNote;


    const text =
        note
            ? (
                note.content ||
                note.text ||
                note.body ||
                note.title ||
                "—"
            )
            : "لا توجد ملاحظة مثبتة اليوم";


    setDashboardValue(
        DASHBOARD_SELECTORS.note,
        text,
        false
    );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.noteCard
    ).forEach(
        card => {

            card.dataset.active =
                note
                    ? "true"
                    : "false";

        }
    );

}


/* ============================================================
   RENDER REMINDER
   ============================================================ */

function renderNextReminder() {

    const reminder =
        DashboardState.nextReminder;


    const title =
        reminder
            ? (
                reminder.title ||
                reminder.name ||
                reminder.text ||
                "لديك تذكير"
            )
            : "لا توجد تنبيهات قريبة";


    setDashboardValue(
        DASHBOARD_SELECTORS.reminder,
        title,
        false
    );


    const date =
        reminder
            ? (
                reminder.date ||
                reminder.datetime ||
                reminder.dateTime ||
                "—"
            )
            : "—";


    const time =
        reminder
            ? (
                reminder.time ||
                ""
            )
            : "";


    setDashboardValue(
        DASHBOARD_SELECTORS.reminderDate,
        formatReminderDate(
            date
        ),
        false
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.reminderTime,
        time,
        false
    );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.reminderCard
    ).forEach(
        card => {

            card.dataset.active =
                reminder
                    ? "true"
                    : "false";

        }
    );

}


/* ============================================================
   FORMAT REMINDER DATE
   ============================================================ */

function formatReminderDate(
    value
) {

    if (
        !value ||
        value === "—"
    ) {

        return "—";

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

        return String(
            value
        );

    }


    return formatDashboardDate(
        date
    );

}


/* ============================================================
   RENDER DATE
   ============================================================ */

function renderDashboardDate() {

    const now =
        new Date();


    const arabicDate =
        formatDashboardDate(
            now
        );


    const day =
        getDashboardArabicDay(
            now
        );


    setDashboardValue(
        DASHBOARD_SELECTORS.today,
        day,
        false
    );


    setDashboardValue(
        DASHBOARD_SELECTORS.date,
        arabicDate,
        false
    );


    updateDashboardClock();

}


/* ============================================================
   RENDER LAST UPDATE
   ============================================================ */

function renderLastUpdate() {

    if (
        !DashboardState.lastRefresh
    ) {

        return;

    }


    const text =
        formatDashboardClock(
            DashboardState.lastRefresh
        );


    setDashboardValue(
        DASHBOARD_SELECTORS.lastUpdate,
        text,
        false
    );

}


/* ============================================================
   SET DASHBOARD VALUE
   ============================================================ */

function setDashboardValue(
    selector,
    value,
    animate = true
) {

    dashboardQueryAll(
        selector
    ).forEach(
        element => {

            if (
                animate &&
                typeof window.animateNumber ===
                "function" &&
                Number.isFinite(
                    Number(value)
                )
            ) {

                window.animateNumber(
                    element,
                    Number(value)
                );

            } else {

                element.textContent =
                    String(
                        value
                    );

            }

        }
    );

}


/* ============================================================
   UPDATE CLOCK
   ============================================================ */

function updateDashboardClock() {

    const now =
        new Date();


    const clock =
        formatDashboardClock(
            now
        );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.clock
    ).forEach(
        element => {

            element.textContent =
                clock;

        }
    );

}


/* ============================================================
   UPDATE DATE
   ============================================================ */

function updateDashboardDate() {

    const now =
        new Date();


    const date =
        formatDashboardDate(
            now
        );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.date
    ).forEach(
        element => {

            element.textContent =
                date;

        }
    );


    dashboardQueryAll(
        DASHBOARD_SELECTORS.today
    ).forEach(
        element => {

            element.textContent =
                getDashboardArabicDay(
                    now
                );

        }
    );

}


/* ============================================================
   CLOCK FORMAT
   ============================================================ */

function formatDashboardClock(
    date
) {

    let hours =
        date.getHours();


    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const seconds =
        String(
            date.getSeconds()
        ).padStart(
            2,
            "0"
        );


    const format =
        window.TeacherProApp &&
        window.TeacherProApp.state
            ? window.TeacherProApp.state.clockFormat
            : "12";


    if (
        format ===
        "24"
    ) {

        return `${String(hours).padStart(2, "0")}:${minutes}:${seconds}`;

    }


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12;


    if (
        hours === 0
    ) {

        hours =
            12;

    }


    return `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${period}`;

}


/* ============================================================
   DATE FORMAT
   ============================================================ */

function formatDashboardDate(
    date
) {

    const days = [

        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"

    ];


    const months = [

        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر"

    ];


    return `${days[date.getDay()]}، ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;

}


/* ============================================================
   ARABIC DAY
   ============================================================ */

function getDashboardArabicDay(
    date
) {

    const days = [

        "الأحد",
        "الإثنين",
        "الثلاثاء",
        "الأربعاء",
        "الخميس",
        "الجمعة",
        "السبت"

    ];


    return (
        days[
            date.getDay()
        ] ||
        "—"
    );

}


/* ============================================================
   DATE KEY
   ============================================================ */

function getDashboardDateKey(
    date
) {

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

}


/* ============================================================
   DAY ID
   ============================================================ */

function getDashboardDayId(
    date
) {

    const days = [

        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"

    ];


    return (
        days[
            date.getDay()
        ] ||
        "sunday"
    );

}


/* ============================================================
   AUTO REFRESH
   ============================================================ */

function startDashboardAutoRefresh() {

    stopDashboardAutoRefresh();


    DashboardState.clockTimer =
        window.setInterval(
            () => {

                updateDashboardClock();

                updateDashboardDate();

            },
            1000
        );


    DashboardState.refreshTimer =
        window.setInterval(
            async () => {

                if (
                    document.hidden
                ) {

                    return;

                }


                await refreshDashboard(
                    false
                );

            },
            30000
        );

}


/* ============================================================
   STOP AUTO REFRESH
   ============================================================ */

function stopDashboardAutoRefresh() {

    if (
        DashboardState.clockTimer
    ) {

        clearInterval(
            DashboardState.clockTimer
        );

        DashboardState.clockTimer =
            null;

    }


    if (
        DashboardState.refreshTimer
    ) {

        clearInterval(
            DashboardState.refreshTimer
        );

        DashboardState.refreshTimer =
            null;

    }

}


/* ============================================================
   REFRESH DASHBOARD
   ============================================================ */

async function refreshDashboard(
    showEffect = true
) {

    if (
        DashboardState.loading
    ) {

        return;

    }


    if (
        showEffect
    ) {

        triggerDashboardRefreshEffect();

    }


    await loadDashboardData();

    renderDashboard();

}


/* ============================================================
   REFRESH EFFECT
   ============================================================ */

function triggerDashboardRefreshEffect() {

    const dashboard =
        dashboardQuery(
            DASHBOARD_SELECTORS.dashboard
        );


    if (
        !dashboard
    ) {

        return;

    }


    dashboard.classList.remove(
        "dashboard-refreshing"
    );


    void dashboard.offsetWidth;


    dashboard.classList.add(
        "dashboard-refreshing"
    );


    window.setTimeout(
        () => {

            dashboard.classList.remove(
                "dashboard-refreshing"
            );

        },
        700
    );

}


/* ============================================================
   DASHBOARD EVENTS
   ============================================================ */

function bindDashboardEvents() {

    document.addEventListener(
        "click",
        handleDashboardClick
    );


    document.addEventListener(
        "teacherpro:class-changed",
        handleClassChanged
    );


    document.addEventListener(
        "teacherpro:section-changed",
        handleSectionChanged
    );


    document.addEventListener(
        "teacherpro:attendance-updated",
        handleAttendanceUpdated
    );


    document.addEventListener(
        "teacherpro:student-updated",
        handleStudentUpdated
    );


    document.addEventListener(
        "teacherpro:note-updated",
        handleNoteUpdated
    );


    document.addEventListener(
        "teacherpro:reminder-updated",
        handleReminderUpdated
    );


    document.addEventListener(
        "teacherpro:schedule-updated",
        handleScheduleUpdated
    );

}


/* ============================================================
   DASHBOARD CLICK
   ============================================================ */

function handleDashboardClick(
    event
) {

    const refreshButton =
        event.target.closest(
            "[data-dashboard-refresh]"
        );


    if (
        refreshButton
    ) {

        event.preventDefault();

        refreshDashboard();

        return;

    }


    const classButton =
        event.target.closest(
            "[data-dashboard-open-class]"
        );


    if (
        classButton
    ) {

        event.preventDefault();

        openDashboardPage(
            "classes"
        );

        return;

    }


    const attendanceButton =
        event.target.closest(
            "[data-dashboard-open-attendance]"
        );


    if (
        attendanceButton
    ) {

        event.preventDefault();

        openDashboardPage(
            "attendance"
        );

        return;

    }


    const lessonButton =
        event.target.closest(
            "[data-dashboard-open-schedule]"
        );


    if (
        lessonButton
    ) {

        event.preventDefault();

        openDashboardPage(
            "schedule"
        );

        return;

    }


    const noteButton =
        event.target.closest(
            "[data-dashboard-open-notes]"
        );


    if (
        noteButton
    ) {

        event.preventDefault();

        openDashboardPage(
            "notes"
        );

        return;

    }


    const reminderButton =
        event.target.closest(
            "[data-dashboard-open-reminders]"
        );


    if (
        reminderButton
    ) {

        event.preventDefault();

        openDashboardPage(
            "reminders"
        );

    }

}


/* ============================================================
   OPEN PAGE
   ============================================================ */

function openDashboardPage(
    page
) {

    if (
        window.TeacherProApp &&
        typeof window.TeacherProApp.navigate ===
        "function"
    ) {

        window.TeacherProApp.navigate(
            page
        );

        return;

    }


    if (
        typeof window.navigateTo ===
        "function"
    ) {

        window.navigateTo(
            page
        );

    }

}


/* ============================================================
   CLASS CHANGED
   ============================================================ */

async function handleClassChanged(
    event
) {

    const detail =
        event.detail ||
        {};


    DashboardState.activeClassId =
        detail.id ||
        detail.classId ||
        null;


    DashboardState.activeSectionId =
        null;


    await refreshDashboard();

}


/* ============================================================
   SECTION CHANGED
   ============================================================ */

async function handleSectionChanged(
    event
) {

    const detail =
        event.detail ||
        {};


    DashboardState.activeSectionId =
        detail.id ||
        detail.sectionId ||
        null;


    await refreshDashboard();

}


/* ============================================================
   ATTENDANCE UPDATED
   ============================================================ */

async function handleAttendanceUpdated() {

    await refreshDashboard(
        false
    );

}


/* ============================================================
   STUDENT UPDATED
   ============================================================ */

async function handleStudentUpdated() {

    await refreshDashboard(
        false
    );

}


/* ============================================================
   NOTE UPDATED
   ============================================================ */

async function handleNoteUpdated() {

    await loadTodayNote();

    renderTodayNote();

}


/* ============================================================
   REMINDER UPDATED
   ============================================================ */

async function handleReminderUpdated() {

    await loadNextReminder();

    renderNextReminder();

}


/* ============================================================
   SCHEDULE UPDATED
   ============================================================ */

async function handleScheduleUpdated() {

    await loadCurrentLesson();

    renderCurrentLesson();

}


/* ============================================================
   SET ACTIVE CLASS
   ============================================================ */

async function setDashboardClass(
    classId
) {

    DashboardState.activeClassId =
        classId ||
        null;


    DashboardState.activeSectionId =
        null;


    await refreshDashboard();

}


/* ============================================================
   SET ACTIVE SECTION
   ============================================================ */

async function setDashboardSection(
    sectionId
) {

    DashboardState.activeSectionId =
        sectionId ||
        null;


    await refreshDashboard();

}


/* ============================================================
   GET DASHBOARD DATA
   ============================================================ */

function getDashboardData() {

    return {

        totalStudents:
            DashboardState.totalStudents,

        presentStudents:
            DashboardState.presentStudents,

        absentStudents:
            DashboardState.absentStudents,

        lateStudents:
            DashboardState.lateStudents,

        excusedStudents:
            DashboardState.excusedStudents,

        unknownStudents:
            DashboardState.unknownStudents,

        attendancePercentage:
            DashboardState.attendancePercentage,

        currentClass:
            DashboardState.currentClass,

        currentSection:
            DashboardState.currentSection,

        currentLesson:
            DashboardState.currentLesson,

        currentTopic:
            DashboardState.currentTopic,

        todayNote:
            DashboardState.todayNote,

        nextReminder:
            DashboardState.nextReminder,

        lastRefresh:
            DashboardState.lastRefresh

    };

}


/* ============================================================
   DASHBOARD PUBLIC API
   ============================================================ */

window.TeacherProDashboardAPI = {

    state:
        DashboardState,

    init:
        initializeDashboard,

    refresh:
        refreshDashboard,

    render:
        renderDashboard,

    setClass:
        setDashboardClass,

    setSection:
        setDashboardSection,

    getData:
        getDashboardData,

    updateClock:
        updateDashboardClock,

    updateDate:
        updateDashboardDate,

    load:
        loadDashboardData,

    formatDate:
        formatDashboardDate,

    formatClock:
        formatDashboardClock

};


/* ============================================================
   CROSS MODULE EVENTS
   ============================================================ */

function dispatchDashboardEvent(
    name,
    detail = {}
) {

    try {

        document.dispatchEvent(
            new CustomEvent(
                name,
                {
                    detail
                }
            )
        );

    } catch (error) {

        console.warn(
            "Could not dispatch dashboard event:",
            error
        );

    }

}


/* ============================================================
   PUBLIC EVENTS
   ============================================================ */

window.TeacherProDashboardEvents = {

    classChanged:
        function (
            classData
        ) {

            dispatchDashboardEvent(
                "teacherpro:class-changed",
                classData
            );

        },

    sectionChanged:
        function (
            sectionData
        ) {

            dispatchDashboardEvent(
                "teacherpro:section-changed",
                sectionData
            );

        },

    attendanceUpdated:
        function (
            data
        ) {

            dispatchDashboardEvent(
                "teacherpro:attendance-updated",
                data
            );

        },

    studentUpdated:
        function (
            data
        ) {

            dispatchDashboardEvent(
                "teacherpro:student-updated",
                data
            );

        },

    noteUpdated:
        function (
            data
        ) {

            dispatchDashboardEvent(
                "teacherpro:note-updated",
                data
            );

        },

    reminderUpdated:
        function (
            data
        ) {

            dispatchDashboardEvent(
                "teacherpro:reminder-updated",
                data
            );

        },

    scheduleUpdated:
        function (
            data
        ) {

            dispatchDashboardEvent(
                "teacherpro:schedule-updated",
                data
            );

        }

};


/* ============================================================
   PAGE VISIBILITY HANDLING
   ============================================================ */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden
        ) {

            stopDashboardAutoRefresh();

        } else {

            updateDashboardClock();

            updateDashboardDate();

            startDashboardAutoRefresh();

            refreshDashboard(
                false
            );

        }

    }
);


/* ============================================================
   WINDOW RESIZE
   ============================================================ */

window.addEventListener(
    "resize",
    () => {

        const root =
            document.documentElement;


        root.classList.toggle(
            "dashboard-mobile",
            window.innerWidth <= 767
        );


        root.classList.toggle(
            "dashboard-tablet",
            window.innerWidth > 767 &&
            window.innerWidth < 1024
        );


        root.classList.toggle(
            "dashboard-desktop",
            window.innerWidth >= 1024
        );

    },
    {
        passive:
            true
    }
);


/* ============================================================
   INITIAL START
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            initializeDashboard();

        },
        {
            once:
                true
        }
    );

} else {

    initializeDashboard();

}


/* ============================================================
   END OF DASHBOARD.JS
   ============================================================ */