/* ============================================================
   TEACHER PRO
   FILE: js/students.js
   MODULE: STUDENTS
   VERSION: 1.0.0
   ============================================================ */

"use strict";

/* ============================================================
   STUDENTS STATE
   ============================================================ */

const StudentsState = {

    initialized: false,

    students: [],

    filteredStudents: [],

    classes: [],

    sections: [],

    selectedClassId: null,

    selectedSectionId: null,

    selectedStudentId: null,

    selectedStudent: null,

    searchQuery: "",

    sortBy: "name",

    sortDirection: "asc",

    loading: false,

    editing: false,

    modalOpen: false,

    currentPage: 1,

    pageSize: 50,

    totalStudents: 0,

    activeStudents: 0,

    inactiveStudents: 0,

    lastRefresh: null

};


/* ============================================================
   SELECTORS
   ============================================================ */

const STUDENTS_SELECTORS = {

    root:
        "[data-students]",

    list:
        "[data-students-list]",

    empty:
        "[data-students-empty]",

    loading:
        "[data-students-loading]",

    search:
        "[data-students-search]",

    classFilter:
        "[data-students-class-filter]",

    sectionFilter:
        "[data-students-section-filter]",

    total:
        "[data-students-total]",

    active:
        "[data-students-active]",

    inactive:
        "[data-students-inactive]",

    count:
        "[data-students-count]",

    selectedClass:
        "[data-students-selected-class]",

    selectedSection:
        "[data-students-selected-section]",

    addButton:
        "[data-student-add]",

    refreshButton:
        "[data-students-refresh]",

    studentRow:
        "[data-student-id]",

    studentName:
        "[data-student-name]",

    modal:
        "[data-student-modal]",

    profile:
        "[data-student-profile]",

    profileName:
        "[data-student-profile-name]",

    profileNumber:
        "[data-student-profile-number]",

    profileClass:
        "[data-student-profile-class]",

    profileSection:
        "[data-student-profile-section]",

    profileFatherPhone:
        "[data-student-profile-father-phone]",

    profileMotherPhone:
        "[data-student-profile-mother-phone]",

    profileCode:
        "[data-student-profile-code]",

    profileNotes:
        "[data-student-profile-notes]",

    profileAttendance:
        "[data-student-profile-attendance]",

    profileAbsence:
        "[data-student-profile-absence]",

    profileLate:
        "[data-student-profile-late]",

    profileExcused:
        "[data-student-profile-excused]",

    profileAverage:
        "[data-student-profile-average]",

    profileDaily:
        "[data-student-profile-daily]",

    profileMonthOne:
        "[data-student-profile-month-one]",

    profileMonthTwo:
        "[data-student-profile-month-two]",

    profileMidyear:
        "[data-student-profile-midyear]",

    profileOral:
        "[data-student-profile-oral]",

    profileExemption:
        "[data-student-profile-exemption]",

    profileFinal:
        "[data-student-profile-final]",

    profileExtra:
        "[data-student-profile-extra]",

    profileRecords:
        "[data-student-profile-records]",

    form:
        "[data-student-form]",

    formId:
        "[data-student-form-id]",

    formName:
        "[data-student-form-name]",

    formClass:
        "[data-student-form-class]",

    formSection:
        "[data-student-form-section]",

    formParent:
        "[data-student-form-parent]",

    formFatherPhone:
        "[data-student-form-father-phone]",

    formMotherPhone:
        "[data-student-form-mother-phone]",

    formCode:
        "[data-student-form-code]",

    formNotes:
        "[data-student-form-notes]",

    formActive:
        "[data-student-form-active]",

    saveButton:
        "[data-student-save]",

    deleteButton:
        "[data-student-delete]",

    closeButton:
        "[data-student-close]",

    editButton:
        "[data-student-edit]",

    exportButton:
        "[data-student-export]",

    attendanceButton:
        "[data-student-attendance]",

    gradesButton:
        "[data-student-grades]",

    notesButton:
        "[data-student-notes]",

    previousPage:
        "[data-students-prev]",

    nextPage:
        "[data-students-next]",

    page:
        "[data-students-page]"

};


/* ============================================================
   DOM HELPERS
   ============================================================ */

function studentsQuery(
    selector,
    parent = document
) {

    try {

        return parent.querySelector(
            selector
        );

    } catch (error) {

        console.warn(
            "Students selector error:",
            selector,
            error
        );

        return null;

    }

}


function studentsQueryAll(
    selector,
    parent = document
) {

    try {

        return Array.from(
            parent.querySelectorAll(
                selector
            )
        );

    } catch (error) {

        console.warn(
            "Students selector error:",
            selector,
            error
        );

        return [];

    }

}


/* ============================================================
   DATABASE ACCESS
   ============================================================ */

function getStudentsDB() {

    if (
        window.TeacherProDB
    ) {

        return window.TeacherProDB;

    }

    return null;

}


async function studentsDBCall(
    methods,
    ...args
) {

    const db =
        getStudentsDB();


    if (
        !db
    ) {

        return null;

    }


    const methodList =
        Array.isArray(
            methods
        )
            ? methods
            : [methods];


    for (
        const method
        of methodList
    ) {

        if (
            typeof db[method] ===
            "function"
        ) {

            try {

                return await db[
                    method
                ](
                    ...args
                );

            } catch (error) {

                console.warn(
                    `Students DB error: ${method}`,
                    error
                );

            }

        }

    }


    return null;

}


/* ============================================================
   INITIALIZATION
   ============================================================ */

async function initializeStudents() {

    if (
        StudentsState.initialized
    ) {

        return;

    }


    StudentsState.initialized =
        true;


    bindStudentsEvents();

    await loadStudentsClasses();

    await loadStudentsSections();

    await loadStudents();

    renderStudents();

}


/* ============================================================
   PUBLIC MODULE
   ============================================================ */

window.TeacherProStudents = {

    init:
        initializeStudents,

    refresh:
        refreshStudents,

    load:
        loadStudents,

    render:
        renderStudents,

    add:
        openAddStudent,

    edit:
        openEditStudent,

    delete:
        deleteStudent,

    select:
        selectStudent,

    getSelected:
        function () {

            return StudentsState.selectedStudent;

        },

    getAll:
        function () {

            return StudentsState.students;

        },

    state:
        StudentsState

};


/* ============================================================
   LOAD CLASSES
   ============================================================ */

async function loadStudentsClasses() {

    let classes =
        await studentsDBCall(
            [
                "getAllClasses",
                "getClasses"
            ]
        );


    if (
        !Array.isArray(classes)
    ) {

        classes =
            [];

    }


    StudentsState.classes =
        classes.filter(
            item =>
                item &&
                item.deleted !== true
        );


    renderClassFilters();

}


/* ============================================================
   LOAD SECTIONS
   ============================================================ */

async function loadStudentsSections() {

    let sections =
        [];


    if (
        StudentsState.selectedClassId
    ) {

        sections =
            await studentsDBCall(
                [
                    "getSectionsByClassId",
                    "getSectionsForClass"
                ],
                StudentsState.selectedClassId
            );

    } else {

        sections =
            await studentsDBCall(
                [
                    "getAllSections",
                    "getSections"
                ]
            );

    }


    if (
        !Array.isArray(sections)
    ) {

        sections =
            [];

    }


    StudentsState.sections =
        sections.filter(
            item =>
                item &&
                item.deleted !== true
        );


    renderSectionFilters();

}


/* ============================================================
   LOAD STUDENTS
   ============================================================ */

async function loadStudents() {

    if (
        StudentsState.loading
    ) {

        return;

    }


    StudentsState.loading =
        true;


    toggleStudentsLoading(
        true
    );


    try {

        let students =
            [];


        if (
            StudentsState.selectedSectionId
        ) {

            students =
                await studentsDBCall(
                    [
                        "getStudentsBySectionId",
                        "getStudentsForSection"
                    ],
                    StudentsState.selectedSectionId
                ) ||
                [];

        } else if (
            StudentsState.selectedClassId
        ) {

            students =
                await studentsDBCall(
                    [
                        "getStudentsByClassId",
                        "getStudentsForClass"
                    ],
                    StudentsState.selectedClassId
                ) ||
                [];

        } else {

            students =
                await studentsDBCall(
                    [
                        "getAllStudents",
                        "getStudents"
                    ]
                ) ||
                [];

        }


        if (
            !Array.isArray(students)
        ) {

            students =
                [];

        }


        StudentsState.students =
            students
                .filter(
                    student =>
                        student &&
                        student.deleted !== true
                )
                .map(
                    normalizeStudent
                );


        StudentsState.totalStudents =
            StudentsState.students.length;


        StudentsState.activeStudents =
            StudentsState.students.filter(
                student =>
                    student.active !== false
            ).length;


        StudentsState.inactiveStudents =
            StudentsState.totalStudents -
            StudentsState.activeStudents;


        StudentsState.lastRefresh =
            new Date();


        applyStudentFilters();

    } catch (error) {

        console.error(
            "Could not load students:",
            error
        );

    } finally {

        StudentsState.loading =
            false;

        toggleStudentsLoading(
            false
        );

    }

}


/* ============================================================
   NORMALIZE STUDENT
   ============================================================ */

function normalizeStudent(
    student
) {

    const result = {

        ...student,

        id:
            student.id ||
            student.studentId ||
            createTemporaryStudentId(),

        name:
            student.name ||
            student.fullName ||
            student.studentName ||
            "طالب بدون اسم",

        fullName:
            student.fullName ||
            student.name ||
            student.studentName ||
            "طالب بدون اسم",

        classId:
            student.classId ||
            student.gradeId ||
            student.class_id ||
            null,

        sectionId:
            student.sectionId ||
            student.section_id ||
            null,

        fatherPhone:
            student.fatherPhone ||
            student.parentPhone ||
            student.phone ||
            "",

        motherPhone:
            student.motherPhone ||
            "",

        parentName:
            student.parentName ||
            student.guardianName ||
            "",

        code:
            student.code ||
            student.studentCode ||
            generateStudentCode(
                student
            ),

        notes:
            student.notes ||
            "",

        active:
            student.active !== false,

        createdAt:
            student.createdAt ||
            new Date().toISOString(),

        updatedAt:
            student.updatedAt ||
            new Date().toISOString(),

        grades:
            student.grades ||
            {},

        attendance:
            student.attendance ||
            [],

        extra:
            student.extra ||
            0

    };


    return result;

}


/* ============================================================
   TEMPORARY ID
   ============================================================ */

function createTemporaryStudentId() {

    return (
        "student_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );

}


/* ============================================================
   GENERATE STUDENT CODE
   ============================================================ */

function generateStudentCode(
    student
) {

    const seed =
        String(
            student.name ||
            "STUDENT"
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            )
            .slice(
                0,
                4
            )
            .toUpperCase();


    const random =
        Math.random()
            .toString(36)
            .slice(
                2,
                8
            )
            .toUpperCase();


    return `TP-${seed}-${random}`;

}


/* ============================================================
   APPLY FILTERS
   ============================================================ */

function applyStudentFilters() {

    const query =
        StudentsState.searchQuery
            .trim()
            .toLowerCase();


    let students =
        [
            ...StudentsState.students
        ];


    if (
        query
    ) {

        students =
            students.filter(
                student => {

                    const values = [

                        student.name,

                        student.fullName,

                        student.code,

                        student.fatherPhone,

                        student.motherPhone,

                        student.parentName

                    ];


                    return values.some(
                        value =>
                            String(
                                value ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    );

                }
            );

    }


    if (
        StudentsState.selectedClassId
    ) {

        students =
            students.filter(
                student =>
                    String(
                        student.classId
                    ) ===
                    String(
                        StudentsState.selectedClassId
                    )
            );

    }


    if (
        StudentsState.selectedSectionId
    ) {

        students =
            students.filter(
                student =>
                    String(
                        student.sectionId
                    ) ===
                    String(
                        StudentsState.selectedSectionId
                    )
            );

    }


    students =
        sortStudents(
            students
        );


    StudentsState.filteredStudents =
        students;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                students.length /
                StudentsState.pageSize
            )
        );


    if (
        StudentsState.currentPage >
        totalPages
    ) {

        StudentsState.currentPage =
            totalPages;

    }


    renderStudentsList();

    updateStudentsCounters();

}


/* ============================================================
   SORT STUDENTS
   ============================================================ */

function sortStudents(
    students
) {

    const sorted =
        [
            ...students
        ];


    sorted.sort(
        (
            a,
            b
        ) => {

            let first;
            let second;


            if (
                StudentsState.sortBy ===
                "name"
            ) {

                first =
                    String(
                        a.name ||
                        ""
                    ).toLowerCase();

                second =
                    String(
                        b.name ||
                        ""
                    ).toLowerCase();

            } else if (
                StudentsState.sortBy ===
                "code"
            ) {

                first =
                    String(
                        a.code ||
                        ""
                    );

                second =
                    String(
                        b.code ||
                        ""
                    );

            } else if (
                StudentsState.sortBy ===
                "createdAt"
            ) {

                first =
                    new Date(
                        a.createdAt ||
                        0
                    ).getTime();

                second =
                    new Date(
                        b.createdAt ||
                        0
                    ).getTime();

            } else {

                first =
                    String(
                        a.name ||
                        ""
                    ).toLowerCase();

                second =
                    String(
                        b.name ||
                        ""
                    ).toLowerCase();

            }


            if (
                first <
                second
            ) {

                return StudentsState.sortDirection ===
                    "asc"
                    ? -1
                    : 1;

            }


            if (
                first >
                second
            ) {

                return StudentsState.sortDirection ===
                    "asc"
                    ? 1
                    : -1;

            }


            return 0;

        }
    );


    return sorted;

}


/* ============================================================
   RENDER
   ============================================================ */

function renderStudents() {

    renderClassFilters();

    renderSectionFilters();

    renderStudentsList();

    updateStudentsCounters();

    renderSelectedFilters();

}


/* ============================================================
   RENDER CLASS FILTERS
   ============================================================ */

function renderClassFilters() {

    const selects =
        studentsQueryAll(
            STUDENTS_SELECTORS.classFilter
        );


    selects.forEach(
        select => {

            const current =
                StudentsState.selectedClassId;


            select.innerHTML =
                "";


            const allOption =
                document.createElement(
                    "option"
                );


            allOption.value =
                "";

            allOption.textContent =
                "جميع الصفوف";


            select.appendChild(
                allOption
            );


            StudentsState.classes.forEach(
                classItem => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        classItem.id ||
                        classItem.classId;


                    option.textContent =
                        classItem.name ||
                        classItem.className ||
                        classItem.title ||
                        classItem.grade ||
                        "صف";


                    select.appendChild(
                        option
                    );

                }
            );


            select.value =
                current ||
                "";

        }
    );

}


/* ============================================================
   RENDER SECTION FILTERS
   ============================================================ */

function renderSectionFilters() {

    const selects =
        studentsQueryAll(
            STUDENTS_SELECTORS.sectionFilter
        );


    selects.forEach(
        select => {

            const current =
                StudentsState.selectedSectionId;


            select.innerHTML =
                "";


            const allOption =
                document.createElement(
                    "option"
                );


            allOption.value =
                "";

            allOption.textContent =
                "جميع الشعب";


            select.appendChild(
                allOption
            );


            StudentsState.sections.forEach(
                section => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        section.id ||
                        section.sectionId;


                    option.textContent =
                        section.name ||
                        section.sectionName ||
                        section.title ||
                        section.label ||
                        "شعبة";


                    select.appendChild(
                        option
                    );

                }
            );


            select.value =
                current ||
                "";

        }
    );

}


/* ============================================================
   RENDER STUDENTS LIST
   ============================================================ */

function renderStudentsList() {

    const containers =
        studentsQueryAll(
            STUDENTS_SELECTORS.list
        );


    containers.forEach(
        container => {

            container.innerHTML =
                "";


            const students =
                getCurrentPageStudents();


            if (
                !students.length
            ) {

                renderStudentsEmpty(
                    container
                );

                return;

            }


            students.forEach(
                (
                    student,
                    index
                ) => {

                    const row =
                        createStudentRow(
                            student,
                            index
                        );


                    container.appendChild(
                        row
                    );

                }
            );

        }
    );


    updatePagination();

}


/* ============================================================
   GET CURRENT PAGE
   ============================================================ */

function getCurrentPageStudents() {

    const start =
        (
            StudentsState.currentPage -
            1
        ) *
        StudentsState.pageSize;


    const end =
        start +
        StudentsState.pageSize;


    return StudentsState.filteredStudents.slice(
        start,
        end
    );

}


/* ============================================================
   CREATE STUDENT ROW
   ============================================================ */

function createStudentRow(
    student,
    index
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "student-item";


    row.dataset.studentId =
        student.id;


    row.setAttribute(
        "data-student-id",
        student.id
    );


    const sequence =
        (
            (
                StudentsState.currentPage -
                1
            ) *
            StudentsState.pageSize
        ) +
        index +
        1;


    const className =
        getClassName(
            student.classId
        );


    const sectionName =
        getSectionName(
            student.sectionId
        );


    const attendance =
        calculateStudentAttendance(
            student
        );


    row.innerHTML = `

        <div class="student-item__number">
            ${sequence}
        </div>

        <div class="student-item__identity">

            <div class="student-item__avatar">
                ${escapeStudentHTML(
                    getStudentInitials(
                        student.name
                    )
                )}
            </div>

            <div class="student-item__name-area">

                <strong
                    class="student-item__name"
                    data-student-name
                >
                    ${escapeStudentHTML(
                        student.name
                    )}
                </strong>

                <span class="student-item__code">
                    ${escapeStudentHTML(
                        student.code
                    )}
                </span>

            </div>

        </div>

        <div class="student-item__class">
            ${escapeStudentHTML(
                className
            )}
        </div>

        <div class="student-item__section">
            ${escapeStudentHTML(
                sectionName
            )}
        </div>

        <div class="student-item__attendance">
            ${attendance.present}
            <span>/</span>
            ${attendance.total}
        </div>

        <div class="student-item__status">

            <span class="student-status ${
                student.active
                    ? "student-status--active"
                    : "student-status--inactive"
            }">

                <span class="student-status__dot"></span>

                ${
                    student.active
                        ? "نشط"
                        : "غير نشط"
                }

            </span>

        </div>

        <div class="student-item__actions">

            <button
                type="button"
                class="student-action student-action--view"
                data-student-view="${escapeStudentAttribute(
                    student.id
                )}"
                title="فتح ملف الطالب"
            >
                <span>👁</span>
            </button>

            <button
                type="button"
                class="student-action student-action--edit"
                data-student-edit="${escapeStudentAttribute(
                    student.id
                )}"
                title="تعديل الطالب"
            >
                <span>✦</span>
            </button>

            <button
                type="button"
                class="student-action student-action--delete"
                data-student-delete="${escapeStudentAttribute(
                    student.id
                )}"
                title="حذف الطالب"
            >
                <span>×</span>
            </button>

        </div>

    `;


    row.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    "button"
                )
            ) {

                return;

            }


            selectStudent(
                student.id
            );

        }
    );


    return row;

}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function renderStudentsEmpty(
    container
) {

    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "students-empty";


    empty.innerHTML = `

        <div class="students-empty__icon">
            👨‍🎓
        </div>

        <h3>
            لا يوجد طلاب
        </h3>

        <p>
            لم يتم العثور على طلاب حسب الاختيارات الحالية.
        </p>

        <button
            type="button"
            class="students-empty__button"
            data-student-add
        >
            إضافة طالب
        </button>

    `;


    container.appendChild(
        empty
    );

}


/* ============================================================
   COUNTERS
   ============================================================ */

function updateStudentsCounters() {

    setStudentsText(
        STUDENTS_SELECTORS.total,
        StudentsState.totalStudents
    );


    setStudentsText(
        STUDENTS_SELECTORS.active,
        StudentsState.activeStudents
    );


    setStudentsText(
        STUDENTS_SELECTORS.inactive,
        StudentsState.inactiveStudents
    );


    setStudentsText(
        STUDENTS_SELECTORS.count,
        StudentsState.filteredStudents.length
    );

}


/* ============================================================
   SELECTED FILTERS
   ============================================================ */

function renderSelectedFilters() {

    const className =
        StudentsState.selectedClassId
            ? getClassName(
                StudentsState.selectedClassId
            )
            : "جميع الصفوف";


    const sectionName =
        StudentsState.selectedSectionId
            ? getSectionName(
                StudentsState.selectedSectionId
            )
            : "جميع الشعب";


    setStudentsText(
        STUDENTS_SELECTORS.selectedClass,
        className
    );


    setStudentsText(
        STUDENTS_SELECTORS.selectedSection,
        sectionName
    );

}


/* ============================================================
   SET TEXT
   ============================================================ */

function setStudentsText(
    selector,
    value
) {

    studentsQueryAll(
        selector
    ).forEach(
        element => {

            element.textContent =
                String(
                    value ??
                    ""
                );

        }
    );

}


/* ============================================================
   LOADING
   ============================================================ */

function toggleStudentsLoading(
    state
) {

    studentsQueryAll(
        STUDENTS_SELECTORS.loading
    ).forEach(
        element => {

            element.hidden =
                !state;

        }
    );


    studentsQueryAll(
        STUDENTS_SELECTORS.list
    ).forEach(
        element => {

            element.classList.toggle(
                "is-loading",
                state
            );

        }
    );

}


/* ============================================================
   FILTER SEARCH
   ============================================================ */

function setStudentsSearch(
    value
) {

    StudentsState.searchQuery =
        String(
            value ||
            ""
        );


    StudentsState.currentPage =
        1;


    applyStudentFilters();

}


/* ============================================================
   CLASS FILTER
   ============================================================ */

async function setStudentsClass(
    classId
) {

    StudentsState.selectedClassId =
        classId ||
        null;


    StudentsState.selectedSectionId =
        null;


    StudentsState.currentPage =
        1;


    await loadStudentsSections();

    await loadStudents();

    renderStudents();

}


/* ============================================================
   SECTION FILTER
   ============================================================ */

async function setStudentsSection(
    sectionId
) {

    StudentsState.selectedSectionId =
        sectionId ||
        null;


    StudentsState.currentPage =
        1;


    await loadStudents();

    renderStudents();

}


/* ============================================================
   SELECT STUDENT
   ============================================================ */

async function selectStudent(
    studentId
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return;

    }


    StudentsState.selectedStudentId =
        student.id;


    StudentsState.selectedStudent =
        student;


    await loadCompleteStudentData(
        student
    );


    renderStudentProfile(
        student
    );


    openStudentProfile();

}


/* ============================================================
   LOAD COMPLETE STUDENT DATA
   ============================================================ */

async function loadCompleteStudentData(
    student
) {

    const attendance =
        await studentsDBCall(
            [
                "getAttendanceByStudentId",
                "getStudentAttendance"
            ],
            student.id
        );


    if (
        Array.isArray(
            attendance
        )
    ) {

        student.attendance =
            attendance;

    }


    const grades =
        await studentsDBCall(
            [
                "getGradesByStudentId",
                "getStudentGrades"
            ],
            student.id
        );


    if (
        Array.isArray(
            grades
        )
    ) {

        student.gradeRecords =
            grades;

    }


    const notes =
        await studentsDBCall(
            [
                "getNotesByStudentId",
                "getStudentNotes"
            ],
            student.id
        );


    if (
        Array.isArray(
            notes
        )
    ) {

        student.noteRecords =
            notes;

    }


    const assignments =
        await studentsDBCall(
            [
                "getAssignmentsByStudentId",
                "getStudentAssignments"
            ],
            student.id
        );


    if (
        Array.isArray(
            assignments
        )
    ) {

        student.assignments =
            assignments;

    }


    const exams =
        await studentsDBCall(
            [
                "getExamsByStudentId",
                "getStudentExams"
            ],
            student.id
        );


    if (
        Array.isArray(
            exams
        )
    ) {

        student.examRecords =
            exams;

    }


    return student;

}


/* ============================================================
   OPEN PROFILE
   ============================================================ */

function openStudentProfile() {

    const profile =
        studentsQuery(
            STUDENTS_SELECTORS.profile
        );


    if (
        profile
    ) {

        profile.hidden =
            false;


        profile.classList.add(
            "is-open"
        );

    }


    const modal =
        studentsQuery(
            STUDENTS_SELECTORS.modal
        );


    if (
        modal
    ) {

        modal.hidden =
            false;


        modal.classList.add(
            "is-open"
        );

    }


    StudentsState.modalOpen =
        true;


    document.body.classList.add(
        "student-profile-open"
    );

}


/* ============================================================
   CLOSE PROFILE
   ============================================================ */

function closeStudentProfile() {

    const profile =
        studentsQuery(
            STUDENTS_SELECTORS.profile
        );


    if (
        profile
    ) {

        profile.classList.remove(
            "is-open"
        );

        profile.hidden =
            true;

    }


    const modal =
        studentsQuery(
            STUDENTS_SELECTORS.modal
        );


    if (
        modal
    ) {

        modal.classList.remove(
            "is-open"
        );

        modal.hidden =
            true;

    }


    StudentsState.modalOpen =
        false;


    document.body.classList.remove(
        "student-profile-open"
    );

}


/* ============================================================
   RENDER STUDENT PROFILE
   ============================================================ */

function renderStudentProfile(
    student
) {

    if (
        !student
    ) {

        return;

    }


    setStudentsText(
        STUDENTS_SELECTORS.profileName,
        student.name
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileNumber,
        getStudentSequence(
            student.id
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileClass,
        getClassName(
            student.classId
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileSection,
        getSectionName(
            student.sectionId
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileFatherPhone,
        student.fatherPhone ||
        "غير مسجل"
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileMotherPhone,
        student.motherPhone ||
        "غير مسجل"
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileCode,
        student.code
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileNotes,
        student.notes ||
        "لا توجد ملاحظات"
    );


    const attendance =
        calculateStudentAttendance(
            student
        );


    setStudentsText(
        STUDENTS_SELECTORS.profileAttendance,
        attendance.present
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileAbsence,
        attendance.absent
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileLate,
        attendance.late
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileExcused,
        attendance.excused
    );


    const grades =
        calculateStudentGrades(
            student
        );


    setStudentsText(
        STUDENTS_SELECTORS.profileAverage,
        formatGrade(
            grades.average
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileDaily,
        formatGrade(
            grades.daily
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileMonthOne,
        formatGrade(
            grades.monthOne
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileMonthTwo,
        formatGrade(
            grades.monthTwo
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileMidyear,
        formatGrade(
            grades.midyear
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileOral,
        formatGrade(
            grades.oral
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileExemption,
        formatGrade(
            grades.exemption
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileFinal,
        formatGrade(
            grades.final
        )
    );


    setStudentsText(
        STUDENTS_SELECTORS.profileExtra,
        formatGrade(
            grades.extra
        )
    );


    renderStudentRecords(
        student
    );

}


/* ============================================================
   STUDENT SEQUENCE
   ============================================================ */

function getStudentSequence(
    studentId
) {

    const index =
        StudentsState.students.findIndex(
            student =>
                String(
                    student.id
                ) ===
                String(
                    studentId
                )
        );


    return index >= 0
        ? index + 1
        : "—";

}


/* ============================================================
   ATTENDANCE CALCULATOR
   ============================================================ */

function calculateStudentAttendance(
    student
) {

    const records =
        Array.isArray(
            student.attendance
        )
            ? student.attendance
            : [];


    let present =
        0;

    let absent =
        0;

    let late =
        0;

    let excused =
        0;


    records.forEach(
        record => {

            const status =
                normalizeStudentAttendanceStatus(
                    record.status
                );


            if (
                status ===
                "present"
            ) {

                present++;

            } else if (
                status ===
                "absent"
            ) {

                absent++;

            } else if (
                status ===
                "late"
            ) {

                late++;

            } else if (
                status ===
                "excused"
            ) {

                excused++;

            }

        }
    );


    return {

        present,

        absent,

        late,

        excused,

        total:
            records.length

    };

}


/* ============================================================
   ATTENDANCE STATUS
   ============================================================ */

function normalizeStudentAttendanceStatus(
    status
) {

    const value =
        String(
            status ||
            ""
        )
            .trim()
            .toLowerCase();


    const map = {

        حاضر:
            "present",

        حضور:
            "present",

        present:
            "present",

        غائب:
            "absent",

        غياب:
            "absent",

        absent:
            "absent",

        متأخر:
            "late",

        متاخر:
            "late",

        late:
            "late",

        مجاز:
            "excused",

        إجازة:
            "excused",

        اجازه:
            "excused",

        excused:
            "excused"

    };


    return (
        map[value] ||
        "unknown"
    );

}


/* ============================================================
   GRADES CALCULATOR
   ============================================================ */

function calculateStudentGrades(
    student
) {

    const grades =
        student.grades ||
        {};


    const records =
        Array.isArray(
            student.gradeRecords
        )
            ? student.gradeRecords
            : [];


    let daily =
        getGradeValue(
            grades,
            [
                "daily",
                "day",
                "dailyGrade",
                "اليومي"
            ]
        );


    let monthOne =
        getGradeValue(
            grades,
            [
                "monthOne",
                "firstMonth",
                "monthly1",
                "الشهر الاول"
            ]
        );


    let monthTwo =
        getGradeValue(
            grades,
            [
                "monthTwo",
                "secondMonth",
                "monthly2",
                "الشهر الثاني"
            ]
        );


    let midyear =
        getGradeValue(
            grades,
            [
                "midyear",
                "midYear",
                "semester",
                "النصف السنوي"
            ]
        );


    let oral =
        getGradeValue(
            grades,
            [
                "oral",
                "شفهي"
            ]
        );


    let exemption =
        getGradeValue(
            grades,
            [
                "exemption",
                "exempt",
                "اعفاء"
            ]
        );


    let finalGrade =
        getGradeValue(
            grades,
            [
                "final",
                "finalYear",
                "آخر السنة",
                "اخر السنة"
            ]
        );


    let extra =
        Number(
            student.extra ||
            grades.extra ||
            0
        );


    if (
        records.length
    ) {

        const calculated =
            calculateGradeRecords(
                records
            );


        if (
            daily ===
            null
        ) {

            daily =
                calculated.daily;

        }


        if (
            monthOne ===
            null
        ) {

            monthOne =
                calculated.monthOne;

        }


        if (
            monthTwo ===
            null
        ) {

            monthTwo =
                calculated.monthTwo;

        }


        if (
            midyear ===
            null
        ) {

            midyear =
                calculated.midyear;

        }


        if (
            oral ===
            null
        ) {

            oral =
                calculated.oral;

        }


        if (
            finalGrade ===
            null
        ) {

            finalGrade =
                calculated.final;

        }

    }


    const values = [

        daily,
        monthOne,
        monthTwo,
        midyear,
        oral,
        finalGrade

    ]
        .filter(
            value =>
                value !== null &&
                Number.isFinite(
                    Number(
                        value
                    )
                )
        )
        .map(
            Number
        );


    const average =
        values.length
            ? (
                values.reduce(
                    (
                        total,
                        value
                    ) =>
                        total +
                        value,
                    0
                ) /
                values.length
            )
            : null;


    return {

        daily,

        monthOne,

        monthTwo,

        midyear,

        oral,

        exemption,

        final:
            finalGrade,

        extra,

        average

    };

}


/* ============================================================
   GET GRADE VALUE
   ============================================================ */

function getGradeValue(
    object,
    keys
) {

    for (
        const key
        of keys
    ) {

        if (
            Object.prototype.hasOwnProperty.call(
                object,
                key
            )
        ) {

            const value =
                object[key];


            if (
                value !==
                null &&
                value !==
                undefined &&
                value !==
                ""
            ) {

                return Number(
                    value
                );

            }

        }

    }


    return null;

}


/* ============================================================
   CALCULATE GRADE RECORDS
   ============================================================ */

function calculateGradeRecords(
    records
) {

    const result = {

        daily:
            null,

        monthOne:
            null,

        monthTwo:
            null,

        midyear:
            null,

        oral:
            null,

        final:
            null

    };


    records.forEach(
        record => {

            const type =
                String(
                    record.type ||
                    record.category ||
                    ""
                )
                    .toLowerCase();


            const value =
                Number(
                    record.value ??
                    record.grade ??
                    record.score
                );


            if (
                !Number.isFinite(
                    value
                )
            ) {

                return;

            }


            if (
                [
                    "daily",
                    "day",
                    "اليومي"
                ].includes(
                    type
                )
            ) {

                result.daily =
                    value;

            }


            if (
                [
                    "monthone",
                    "firstmonth",
                    "monthly1",
                    "الشهر الاول"
                ].includes(
                    type
                )
            ) {

                result.monthOne =
                    value;

            }


            if (
                [
                    "monthtwo",
                    "secondmonth",
                    "monthly2",
                    "الشهر الثاني"
                ].includes(
                    type
                )
            ) {

                result.monthTwo =
                    value;

            }


            if (
                [
                    "midyear",
                    "midyear",
                    "semester",
                    "النصف السنوي"
                ].includes(
                    type
                )
            ) {

                result.midyear =
                    value;

            }


            if (
                [
                    "oral",
                    "شفهي"
                ].includes(
                    type
                )
            ) {

                result.oral =
                    value;

            }


            if (
                [
                    "final",
                    "finalyear",
                    "اخر السنة"
                ].includes(
                    type
                )
            ) {

                result.final =
                    value;

            }

        }
    );


    return result;

}


/* ============================================================
   FORMAT GRADE
   ============================================================ */

function formatGrade(
    value
) {

    if (
        value ===
        null ||
        value ===
        undefined ||
        value ===
        ""
    ) {

        return "—";

    }


    const number =
        Number(
            value
        );


    if (
        !Number.isFinite(
            number
        )
    ) {

        return "—";

    }


    return Number.isInteger(
        number
    )
        ? String(
            number
        )
        : number.toFixed(
            2
        );

}


/* ============================================================
   RENDER RECORDS
   ============================================================ */

function renderStudentRecords(
    student
) {

    const containers =
        studentsQueryAll(
            STUDENTS_SELECTORS.profileRecords
        );


    containers.forEach(
        container => {

            container.innerHTML =
                "";


            const records = [];


            if (
                Array.isArray(
                    student.attendance
                )
            ) {

                student.attendance.forEach(
                    record => {

                        records.push({

                            type:
                                "attendance",

                            title:
                                getAttendanceTitle(
                                    record.status
                                ),

                            date:
                                record.date ||
                                record.createdAt,

                            value:
                                record.note ||
                                ""

                        });

                    }
                );

            }


            if (
                Array.isArray(
                    student.gradeRecords
                )
            ) {

                student.gradeRecords.forEach(
                    record => {

                        records.push({

                            type:
                                "grade",

                            title:
                                record.title ||
                                record.name ||
                                "درجة",

                            date:
                                record.date ||
                                record.createdAt,

                            value:
                                record.value ??
                                record.grade ??
                                record.score ??
                                ""

                        });

                    }
                );

            }


            if (
                Array.isArray(
                    student.noteRecords
                )
            ) {

                student.noteRecords.forEach(
                    record => {

                        records.push({

                            type:
                                "note",

                            title:
                                record.title ||
                                "ملاحظة",

                            date:
                                record.date ||
                                record.createdAt,

                            value:
                                record.content ||
                                record.text ||
                                record.note ||
                                ""

                        });

                    }
                );

            }


            records.sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.date ||
                        0
                    ).getTime() -
                    new Date(
                        a.date ||
                        0
                    ).getTime()
            );


            if (
                !records.length
            ) {

                container.innerHTML = `

                    <div class="student-records-empty">
                        لا يوجد سجل محفوظ لهذا الطالب حالياً.
                    </div>

                `;

                return;

            }


            records
                .slice(
                    0,
                    100
                )
                .forEach(
                    record => {

                        const item =
                            document.createElement(
                                "div"
                            );


                        item.className =
                            "student-record";


                        item.innerHTML = `

                            <div class="student-record__icon">
                                ${getRecordIcon(
                                    record.type
                                )}
                            </div>

                            <div class="student-record__content">

                                <strong>
                                    ${escapeStudentHTML(
                                        record.title
                                    )}
                                </strong>

                                <span>
                                    ${escapeStudentHTML(
                                        record.value
                                    )}
                                </span>

                            </div>

                            <time>
                                ${escapeStudentHTML(
                                    formatStudentDate(
                                        record.date
                                    )
                                )}
                            </time>

                        `;


                        container.appendChild(
                            item
                        );

                    }
                );

        }
    );

}


/* ============================================================
   ATTENDANCE TITLE
   ============================================================ */

function getAttendanceTitle(
    status
) {

    const normalized =
        normalizeStudentAttendanceStatus(
            status
        );


    const titles = {

        present:
            "حضور",

        absent:
            "غياب",

        late:
            "تأخر",

        excused:
            "إجازة",

        unknown:
            "حالة غير محددة"

    };


    return (
        titles[
            normalized
        ] ||
        "حضور"

    );

}


/* ============================================================
   RECORD ICON
   ============================================================ */

function getRecordIcon(
    type
) {

    if (
        type ===
        "attendance"
    ) {

        return "🟢";

    }


    if (
        type ===
        "grade"
    ) {

        return "🏆";

    }


    if (
        type ===
        "note"
    ) {

        return "📝";

    }


    return "📌";

}


/* ============================================================
   ADD STUDENT
   ============================================================ */

function openAddStudent() {

    StudentsState.editing =
        false;


    StudentsState.selectedStudentId =
        null;


    StudentsState.selectedStudent =
        null;


    const form =
        studentsQuery(
            STUDENTS_SELECTORS.form
        );


    if (
        !form
    ) {

        dispatchStudentEvent(
            "teacherpro:student-add-requested"
        );

        return;

    }


    form.reset();


    setFormValue(
        STUDENTS_SELECTORS.formId,
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formName,
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formClass,
        StudentsState.selectedClassId ||
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formSection,
        StudentsState.selectedSectionId ||
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formParent,
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formFatherPhone,
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formMotherPhone,
        ""
    );


    setFormValue(
        STUDENTS_SELECTORS.formCode,
        generateStudentCode(
            {
                name:
                    "STUDENT"
            }
        )
    );


    setFormValue(
        STUDENTS_SELECTORS.formNotes,
        ""
    );


    setFormChecked(
        STUDENTS_SELECTORS.formActive,
        true
    );


    toggleStudentForm(
        true
    );

}


/* ============================================================
   EDIT STUDENT
   ============================================================ */

async function openEditStudent(
    studentId
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return;

    }


    StudentsState.editing =
        true;


    StudentsState.selectedStudentId =
        student.id;


    StudentsState.selectedStudent =
        student;


    const form =
        studentsQuery(
            STUDENTS_SELECTORS.form
        );


    if (
        !form
    ) {

        dispatchStudentEvent(
            "teacherpro:student-edit-requested",
            {
                student
            }
        );

        return;

    }


    setFormValue(
        STUDENTS_SELECTORS.formId,
        student.id
    );


    setFormValue(
        STUDENTS_SELECTORS.formName,
        student.name
    );


    setFormValue(
        STUDENTS_SELECTORS.formClass,
        student.classId
    );


    setFormValue(
        STUDENTS_SELECTORS.formSection,
        student.sectionId
    );


    setFormValue(
        STUDENTS_SELECTORS.formParent,
        student.parentName
    );


    setFormValue(
        STUDENTS_SELECTORS.formFatherPhone,
        student.fatherPhone
    );


    setFormValue(
        STUDENTS_SELECTORS.formMotherPhone,
        student.motherPhone
    );


    setFormValue(
        STUDENTS_SELECTORS.formCode,
        student.code
    );


    setFormValue(
        STUDENTS_SELECTORS.formNotes,
        student.notes
    );


    setFormChecked(
        STUDENTS_SELECTORS.formActive,
        student.active
    );


    toggleStudentForm(
        true
    );

}


/* ============================================================
   FORM VALUE
   ============================================================ */

function setFormValue(
    selector,
    value
) {

    const elements =
        studentsQueryAll(
            selector
        );


    elements.forEach(
        element => {

            element.value =
                value ??
                "";

        }
    );

}


/* ============================================================
   FORM CHECKED
   ============================================================ */

function setFormChecked(
    selector,
    value
) {

    studentsQueryAll(
        selector
    ).forEach(
        element => {

            element.checked =
                Boolean(
                    value
                );

        }
    );

}


/* ============================================================
   FORM GET VALUE
   ============================================================ */

function getFormValue(
    selector
) {

    const element =
        studentsQuery(
            selector
        );


    if (
        !element
    ) {

        return "";

    }


    return String(
        element.value ||
        ""
    ).trim();

}


/* ============================================================
   FORM GET CHECKED
   ============================================================ */

function getFormChecked(
    selector
) {

    const element =
        studentsQuery(
            selector
        );


    return Boolean(
        element &&
        element.checked
    );

}


/* ============================================================
   SAVE STUDENT
   ============================================================ */

async function saveStudentFromForm(
    event
) {

    if (
        event
    ) {

        event.preventDefault();

    }


    const name =
        getFormValue(
            STUDENTS_SELECTORS.formName
        );


    if (
        !name
    ) {

        showStudentMessage(
            "يرجى إدخال اسم الطالب.",
            "error"
        );

        return false;

    }


    const id =
        getFormValue(
            STUDENTS_SELECTORS.formId
        );


    const student = {

        id:
            id ||
            createTemporaryStudentId(),

        name,

        fullName:
            name,

        classId:
            getFormValue(
                STUDENTS_SELECTORS.formClass
            ) ||
            null,

        sectionId:
            getFormValue(
                STUDENTS_SELECTORS.formSection
            ) ||
            null,

        parentName:
            getFormValue(
                STUDENTS_SELECTORS.formParent
            ),

        fatherPhone:
            getFormValue(
                STUDENTS_SELECTORS.formFatherPhone
            ),

        motherPhone:
            getFormValue(
                STUDENTS_SELECTORS.formMotherPhone
            ),

        code:
            getFormValue(
                STUDENTS_SELECTORS.formCode
            ) ||
            generateStudentCode(
                {
                    name
                }
            ),

        notes:
            getFormValue(
                STUDENTS_SELECTORS.formNotes
            ),

        active:
            getFormChecked(
                STUDENTS_SELECTORS.formActive
            ),

        updatedAt:
            new Date().toISOString()

    };


    if (
        StudentsState.editing
    ) {

        await updateStudent(
            student
        );

    } else {

        student.createdAt =
            new Date().toISOString();


        student.grades =
            {};

        student.attendance =
            [];

        await createStudent(
            student
        );

    }


    toggleStudentForm(
        false
    );


    await refreshStudents();

    return true;

}


/* ============================================================
   CREATE STUDENT
   ============================================================ */

async function createStudent(
    student
) {

    let result =
        await studentsDBCall(
            [
                "addStudent",
                "createStudent",
                "saveStudent"
            ],
            student
        );


    if (
        result ===
        null
    ) {

        const existing =
            [
                ...StudentsState.students
            ];


        existing.push(
            student
        );


        StudentsState.students =
            existing;

    }


    dispatchStudentEvent(
        "teacherpro:student-created",
        {
            student,
            result
        }
    );


    showStudentMessage(
        "تمت إضافة الطالب بنجاح.",
        "success"
    );


    return result ||
        student;

}


/* ============================================================
   UPDATE STUDENT
   ============================================================ */

async function updateStudent(
    student
) {

    let result =
        await studentsDBCall(
            [
                "updateStudent",
                "editStudent",
                "saveStudent"
            ],
            student.id,
            student
        );


    if (
        result ===
        null
    ) {

        const index =
            StudentsState.students.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        student.id
                    )
            );


        if (
            index >= 0
        ) {

            StudentsState.students[
                index
            ] = {

                ...StudentsState.students[
                    index
                ],

                ...student

            };

        }

    }


    dispatchStudentEvent(
        "teacherpro:student-updated",
        {
            student,
            result
        }
    );


    showStudentMessage(
        "تم تعديل بيانات الطالب.",
        "success"
    );


    return result ||
        student;

}


/* ============================================================
   DELETE STUDENT
   ============================================================ */

async function deleteStudent(
    studentId
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return false;

    }


    const confirmed =
        await confirmStudentDelete(
            student
        );


    if (
        !confirmed
    ) {

        return false;

    }


    let result =
        await studentsDBCall(
            [
                "deleteStudent",
                "removeStudent"
            ],
            student.id
        );


    if (
        result ===
        null
    ) {

        const softDelete = {

            ...student,

            deleted:
                true,

            active:
                false,

            deletedAt:
                new Date().toISOString()

        };


        await studentsDBCall(
            [
                "updateStudent",
                "saveStudent"
            ],
            student.id,
            softDelete
        );


        StudentsState.students =
            StudentsState.students.filter(
                item =>
                    String(
                        item.id
                    ) !==
                    String(
                        student.id
                    )
            );

    } else {

        StudentsState.students =
            StudentsState.students.filter(
                item =>
                    String(
                        item.id
                    ) !==
                    String(
                        student.id
                    )
            );

    }


    if (
        String(
            StudentsState.selectedStudentId
        ) ===
        String(
            student.id
        )
    ) {

        StudentsState.selectedStudentId =
            null;

        StudentsState.selectedStudent =
            null;

        closeStudentProfile();

    }


    dispatchStudentEvent(
        "teacherpro:student-deleted",
        {
            student,
            result
        }
    );


    showStudentMessage(
        "تم حذف الطالب.",
        "success"
    );


    renderStudents();

    return true;

}


/* ============================================================
   CONFIRM DELETE
   ============================================================ */

async function confirmStudentDelete(
    student
) {

    if (
        typeof window.showConfirm ===
        "function"
    ) {

        return Boolean(
            await window.showConfirm(
                `هل تريد حذف الطالب "${student.name}"؟`
            )
        );

    }


    return window.confirm(
        `هل تريد حذف الطالب "${student.name}"؟`
    );

}


/* ============================================================
   FORM TOGGLE
   ============================================================ */

function toggleStudentForm(
    open
) {

    const form =
        studentsQuery(
            STUDENTS_SELECTORS.form
        );


    if (
        !form
    ) {

        return;

    }


    const modal =
        form.closest(
            "[data-student-form-modal]"
        );


    if (
        modal
    ) {

        modal.hidden =
            !open;


        modal.classList.toggle(
            "is-open",
            open
        );

    }


    form.hidden =
        !open;


    StudentsState.modalOpen =
        open;


    if (
        open
    ) {

        document.body.classList.add(
            "student-form-open"
        );

    } else {

        document.body.classList.remove(
            "student-form-open"
        );

    }

}


/* ============================================================
   DELETE FROM PROFILE
   ============================================================ */

async function deleteSelectedStudent() {

    if (
        !StudentsState.selectedStudentId
    ) {

        return;

    }


    await deleteStudent(
        StudentsState.selectedStudentId
    );

}


/* ============================================================
   EXPORT STUDENT
   ============================================================ */

async function exportStudent(
    studentId
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return;

    }


    await loadCompleteStudentData(
        student
    );


    const grades =
        calculateStudentGrades(
            student
        );


    const attendance =
        calculateStudentAttendance(
            student
        );


    const data = {

        الطالب:
            student.name,

        الرقم:
            getStudentSequence(
                student.id
            ),

        الكود:
            student.code,

        الصف:
            getClassName(
                student.classId
            ),

        الشعبة:
            getSectionName(
                student.sectionId
            ),

        ولي_الامر:
            student.parentName,

        هاتف_الوالد:
            student.fatherPhone,

        هاتف_الوالدة:
            student.motherPhone,

        الحضور:
            attendance.present,

        الغياب:
            attendance.absent,

        التأخير:
            attendance.late,

        الاجازات:
            attendance.excused,

        اليومي:
            grades.daily,

        الشهر_الأول:
            grades.monthOne,

        الشهر_الثاني:
            grades.monthTwo,

        النصف_السنوي:
            grades.midyear,

        الشفهي:
            grades.oral,

        الاعفاء:
            grades.exemption,

        آخر_السنة:
            grades.final,

        الإضافة:
            grades.extra,

        المعدل:
            grades.average,

        الملاحظات:
            student.notes,

        سجل_الحضور:
            student.attendance || [],

        سجل_الدرجات:
            student.gradeRecords || [],

        سجل_الملاحظات:
            student.noteRecords || [],

        الواجبات:
            student.assignments || [],

        الامتحانات:
            student.examRecords || []

    };


    downloadStudentJSON(
        data,
        student.name
    );


    dispatchStudentEvent(
        "teacherpro:student-exported",
        {
            student
        }
    );

}


/* ============================================================
   DOWNLOAD JSON
   ============================================================ */

function downloadStudentJSON(
    data,
    studentName
) {

    const json =
        JSON.stringify(
            data,
            null,
            2
        );


    const blob =
        new Blob(
            [
                "\uFEFF",
                json
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


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        `student-${sanitizeStudentFileName(
            studentName
        )}.json`;


    document.body.appendChild(
        anchor
    );


    anchor.click();


    anchor.remove();


    window.setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );

}


/* ============================================================
   FILE NAME
   ============================================================ */

function sanitizeStudentFileName(
    name
) {

    return String(
        name ||
        "student"
    )
        .replace(
            /[\\/:*?"<>|]/g,
            "_"
        )
        .replace(
            /\s+/g,
            "_"
        )
        .slice(
            0,
            100
        );

}


/* ============================================================
   PAGINATION
   ============================================================ */

function updatePagination() {

    const total =
        StudentsState.filteredStudents.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                StudentsState.pageSize
            )
        );


    studentsQueryAll(
        STUDENTS_SELECTORS.page
    ).forEach(
        element => {

            element.textContent =
                `${StudentsState.currentPage} / ${totalPages}`;

        }
    );


    studentsQueryAll(
        STUDENTS_SELECTORS.previousPage
    ).forEach(
        button => {

            button.disabled =
                StudentsState.currentPage <=
                1;

        }
    );


    studentsQueryAll(
        STUDENTS_SELECTORS.nextPage
    ).forEach(
        button => {

            button.disabled =
                StudentsState.currentPage >=
                totalPages;

        }
    );

}


/* ============================================================
   PREVIOUS PAGE
   ============================================================ */

function previousStudentsPage() {

    if (
        StudentsState.currentPage <=
        1
    ) {

        return;

    }


    StudentsState.currentPage--;

    renderStudentsList();

}


/* ============================================================
   NEXT PAGE
   ============================================================ */

function nextStudentsPage() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                StudentsState.filteredStudents.length /
                StudentsState.pageSize
            )
        );


    if (
        StudentsState.currentPage >=
        totalPages
    ) {

        return;

    }


    StudentsState.currentPage++;

    renderStudentsList();

}


/* ============================================================
   REFRESH
   ============================================================ */

async function refreshStudents() {

    await loadStudentsClasses();

    await loadStudentsSections();

    await loadStudents();

    renderStudents();

}


/* ============================================================
   CLASS NAME
   ============================================================ */

function getClassName(
    classId
) {

    if (
        !classId
    ) {

        return "غير محدد";

    }


    const classItem =
        StudentsState.classes.find(
            item =>
                String(
                    item.id ||
                    item.classId
                ) ===
                String(
                    classId
                )
        );


    if (
        !classItem
    ) {

        return "غير محدد";

    }


    return (
        classItem.name ||
        classItem.className ||
        classItem.title ||
        classItem.grade ||
        "صف"
    );

}


/* ============================================================
   SECTION NAME
   ============================================================ */

function getSectionName(
    sectionId
) {

    if (
        !sectionId
    ) {

        return "غير محددة";

    }


    const section =
        StudentsState.sections.find(
            item =>
                String(
                    item.id ||
                    item.sectionId
                ) ===
                String(
                    sectionId
                )
        );


    if (
        !section
    ) {

        return "غير محددة";

    }


    return (
        section.name ||
        section.sectionName ||
        section.title ||
        section.label ||
        "شعبة"
    );

}


/* ============================================================
   INITIALS
   ============================================================ */

function getStudentInitials(
    name
) {

    const parts =
        String(
            name ||
            ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (
        !parts.length
    ) {

        return "ط";

    }


    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .slice(
                0,
                2
            );

    }


    return (
        parts[0][0] +
        parts[1][0]
    );

}


/* ============================================================
   FORMAT DATE
   ============================================================ */

function formatStudentDate(
    value
) {

    if (
        !value
    ) {

        return "بدون تاريخ";

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


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const year =
        date.getFullYear();


    return `${day}/${month}/${year}`;

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeStudentHTML(
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

}


/* ============================================================
   ESCAPE ATTRIBUTE
   ============================================================ */

function escapeStudentAttribute(
    value
) {

    return escapeStudentHTML(
        value
    );

}


/* ============================================================
   SHOW MESSAGE
   ============================================================ */

function showStudentMessage(
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


    const existing =
        document.querySelector(
            ".student-module-toast"
        );


    if (
        existing
    ) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `student-module-toast student-module-toast--${type}`;


    toast.textContent =
        message;


    document.body.appendChild(
        toast
    );


    window.setTimeout(
        () => {

            toast.classList.add(
                "is-hidden"
            );


            window.setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        2500
    );

}


/* ============================================================
   EVENT BINDINGS
   ============================================================ */

function bindStudentsEvents() {

    document.addEventListener(
        "submit",
        handleStudentSubmit
    );


    document.addEventListener(
        "input",
        handleStudentInput
    );


    document.addEventListener(
        "change",
        handleStudentChange
    );


    document.addEventListener(
        "click",
        handleStudentClick
    );


    document.addEventListener(
        "keydown",
        handleStudentKeyboard
    );


    document.addEventListener(
        "teacherpro:class-changed",
        handleExternalClassChange
    );


    document.addEventListener(
        "teacherpro:section-changed",
        handleExternalSectionChange
    );

}


/* ============================================================
   SUBMIT EVENT
   ============================================================ */

async function handleStudentSubmit(
    event
) {

    const form =
        event.target.closest(
            STUDENTS_SELECTORS.form
        );


    if (
        !form
    ) {

        return;

    }


    await saveStudentFromForm(
        event
    );

}


/* ============================================================
   INPUT EVENT
   ============================================================ */

function handleStudentInput(
    event
) {

    const search =
        event.target.closest(
            STUDENTS_SELECTORS.search
        );


    if (
        search
    ) {

        setStudentsSearch(
            search.value
        );

    }

}


/* ============================================================
   CHANGE EVENT
   ============================================================ */

async function handleStudentChange(
    event
) {

    const classFilter =
        event.target.closest(
            STUDENTS_SELECTORS.classFilter
        );


    if (
        classFilter
    ) {

        await setStudentsClass(
            classFilter.value
        );

        return;

    }


    const sectionFilter =
        event.target.closest(
            STUDENTS_SELECTORS.sectionFilter
        );


    if (
        sectionFilter
    ) {

        await setStudentsSection(
            sectionFilter.value
        );

    }

}


/* ============================================================
   CLICK EVENT
   ============================================================ */

async function handleStudentClick(
    event
) {

    const viewButton =
        event.target.closest(
            "[data-student-view]"
        );


    if (
        viewButton
    ) {

        event.preventDefault();


        await selectStudent(
            viewButton.dataset.studentView
        );


        return;

    }


    const editButton =
        event.target.closest(
            "[data-student-edit]"
        );


    if (
        editButton
    ) {

        event.preventDefault();


        await openEditStudent(
            editButton.dataset.studentEdit
        );


        return;

    }


    const deleteButton =
        event.target.closest(
            "[data-student-delete]"
        );


    if (
        deleteButton
    ) {

        event.preventDefault();


        await deleteStudent(
            deleteButton.dataset.studentDelete
        );


        return;

    }


    const addButton =
        event.target.closest(
            STUDENTS_SELECTORS.addButton
        );


    if (
        addButton
    ) {

        event.preventDefault();

        openAddStudent();

        return;

    }


    const refreshButton =
        event.target.closest(
            STUDENTS_SELECTORS.refreshButton
        );


    if (
        refreshButton
    ) {

        event.preventDefault();

        await refreshStudents();

        return;

    }


    const closeButton =
        event.target.closest(
            STUDENTS_SELECTORS.closeButton
        );


    if (
        closeButton
    ) {

        event.preventDefault();

        closeStudentProfile();

        toggleStudentForm(
            false
        );

        return;

    }


    const editProfileButton =
        event.target.closest(
            STUDENTS_SELECTORS.editButton
        );


    if (
        editProfileButton
    ) {

        event.preventDefault();


        if (
            StudentsState.selectedStudentId
        ) {

            await openEditStudent(
                StudentsState.selectedStudentId
            );

        }


        return;

    }


    const deleteProfileButton =
        event.target.closest(
            STUDENTS_SELECTORS.deleteButton
        );


    if (
        deleteProfileButton
    ) {

        event.preventDefault();

        await deleteSelectedStudent();

        return;

    }


    const exportButton =
        event.target.closest(
            STUDENTS_SELECTORS.exportButton
        );


    if (
        exportButton
    ) {

        event.preventDefault();


        if (
            StudentsState.selectedStudentId
        ) {

            await exportStudent(
                StudentsState.selectedStudentId
            );

        }


        return;

    }


    const attendanceButton =
        event.target.closest(
            STUDENTS_SELECTORS.attendanceButton
        );


    if (
        attendanceButton
    ) {

        event.preventDefault();

        openStudentModule(
            "attendance"
        );

        return;

    }


    const gradesButton =
        event.target.closest(
            STUDENTS_SELECTORS.gradesButton
        );


    if (
        gradesButton
    ) {

        event.preventDefault();

        openStudentModule(
            "grades"
        );

        return;

    }


    const notesButton =
        event.target.closest(
            STUDENTS_SELECTORS.notesButton
        );


    if (
        notesButton
    ) {

        event.preventDefault();

        openStudentModule(
            "notes"
        );

        return;

    }


    const previousButton =
        event.target.closest(
            STUDENTS_SELECTORS.previousPage
        );


    if (
        previousButton
    ) {

        event.preventDefault();

        previousStudentsPage();

        return;

    }


    const nextButton =
        event.target.closest(
            STUDENTS_SELECTORS.nextPage
        );


    if (
        nextButton
    ) {

        event.preventDefault();

        nextStudentsPage();

        return;

    }


    const sortButton =
        event.target.closest(
            "[data-students-sort]"
        );


    if (
        sortButton
    ) {

        event.preventDefault();


        const sortBy =
            sortButton.dataset.studentsSort ||
            "name";


        if (
            StudentsState.sortBy ===
            sortBy
        ) {

            StudentsState.sortDirection =
                StudentsState.sortDirection ===
                    "asc"
                    ? "desc"
                    : "asc";

        } else {

            StudentsState.sortBy =
                sortBy;

            StudentsState.sortDirection =
                "asc";

        }


        applyStudentFilters();

    }

}


/* ============================================================
   KEYBOARD
   ============================================================ */

function handleStudentKeyboard(
    event
) {

    if (
        event.key ===
        "Escape"
    ) {

        if (
            StudentsState.modalOpen
        ) {

            closeStudentProfile();

            toggleStudentForm(
                false
            );

        }

    }

}


/* ============================================================
   OPEN STUDENT MODULE
   ============================================================ */

function openStudentModule(
    moduleName
) {

    if (
        moduleName ===
        "attendance"
    ) {

        if (
            window.TeacherProApp &&
            typeof window.TeacherProApp.navigate ===
            "function"
        ) {

            window.TeacherProApp.navigate(
                "attendance",
                {
                    studentId:
                        StudentsState.selectedStudentId
                }
            );

            return;

        }

    }


    if (
        moduleName ===
        "grades"
    ) {

        if (
            window.TeacherProApp &&
            typeof window.TeacherProApp.navigate ===
            "function"
        ) {

            window.TeacherProApp.navigate(
                "grades",
                {
                    studentId:
                        StudentsState.selectedStudentId
                }
            );

            return;

        }

    }


    if (
        moduleName ===
        "notes"
    ) {

        if (
            window.TeacherProApp &&
            typeof window.TeacherProApp.navigate ===
            "function"
        ) {

            window.TeacherProApp.navigate(
                "notes",
                {
                    studentId:
                        StudentsState.selectedStudentId
                }
            );

        }

    }

}


/* ============================================================
   EXTERNAL CLASS EVENT
   ============================================================ */

async function handleExternalClassChange(
    event
) {

    const detail =
        event.detail ||
        {};


    StudentsState.selectedClassId =
        detail.id ||
        detail.classId ||
        null;


    StudentsState.selectedSectionId =
        null;


    await loadStudentsSections();

    await loadStudents();

    renderStudents();

}


/* ============================================================
   EXTERNAL SECTION EVENT
   ============================================================ */

async function handleExternalSectionChange(
    event
) {

    const detail =
        event.detail ||
        {};


    StudentsState.selectedSectionId =
        detail.id ||
        detail.sectionId ||
        null;


    await loadStudents();

    renderStudents();

}


/* ============================================================
   DISPATCH EVENT
   ============================================================ */

function dispatchStudentEvent(
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
            "Students event error:",
            error
        );

    }

}


/* ============================================================
   EXTERNAL PUBLIC EVENTS
   ============================================================ */

window.TeacherProStudentsEvents = {

    created:
        function (
            student
        ) {

            dispatchStudentEvent(
                "teacherpro:student-created",
                {
                    student
                }
            );

        },

    updated:
        function (
            student
        ) {

            dispatchStudentEvent(
                "teacherpro:student-updated",
                {
                    student
                }
            );

        },

    deleted:
        function (
            student
        ) {

            dispatchStudentEvent(
                "teacherpro:student-deleted",
                {
                    student
                }
            );

        }

};


/* ============================================================
   STUDENT ATTENDANCE QUICK UPDATE
   ============================================================ */

async function updateStudentAttendance(
    studentId,
    status,
    note = ""
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return false;

    }


    const record = {

        id:
            createTemporaryStudentId(),

        studentId:
            student.id,

        classId:
            student.classId,

        sectionId:
            student.sectionId,

        date:
            getStudentDateKey(
                new Date()
            ),

        status,

        note,

        createdAt:
            new Date().toISOString()

    };


    const result =
        await studentsDBCall(
            [
                "addAttendance",
                "saveAttendance",
                "createAttendance"
            ],
            record
        );


    if (
        !Array.isArray(
            student.attendance
        )
    ) {

        student.attendance =
            [];

    }


    student.attendance.push(
        record
    );


    dispatchStudentEvent(
        "teacherpro:attendance-updated",
        {
            student,
            record,
            result
        }
    );


    renderStudentsList();


    return true;

}


/* ============================================================
   DATE KEY
   ============================================================ */

function getStudentDateKey(
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
   UPDATE STUDENT GRADE
   ============================================================ */

async function updateStudentGrade(
    studentId,
    type,
    value,
    note = ""
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return false;

    }


    const numericValue =
        Number(
            value
        );


    if (
        !Number.isFinite(
            numericValue
        )
    ) {

        return false;

    }


    const record = {

        id:
            createTemporaryStudentId(),

        studentId:
            student.id,

        classId:
            student.classId,

        sectionId:
            student.sectionId,

        type,

        value:
            numericValue,

        note,

        date:
            getStudentDateKey(
                new Date()
            ),

        createdAt:
            new Date().toISOString()

    };


    const result =
        await studentsDBCall(
            [
                "addGrade",
                "saveGrade",
                "createGrade"
            ],
            record
        );


    if (
        !Array.isArray(
            student.gradeRecords
        )
    ) {

        student.gradeRecords =
            [];

    }


    student.gradeRecords.push(
        record
    );


    if (
        !student.grades
    ) {

        student.grades =
            {};

    }


    student.grades[
        type
    ] =
        numericValue;


    dispatchStudentEvent(
        "teacherpro:grade-updated",
        {
            student,
            record,
            result
        }
    );


    return true;

}


/* ============================================================
   UPDATE STUDENT NOTE
   ============================================================ */

async function addStudentNote(
    studentId,
    text
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student ||
        !String(
            text ||
            ""
        ).trim()
    ) {

        return false;

    }


    const record = {

        id:
            createTemporaryStudentId(),

        studentId:
            student.id,

        classId:
            student.classId,

        sectionId:
            student.sectionId,

        text:
            String(
                text
            ).trim(),

        content:
            String(
                text
            ).trim(),

        date:
            getStudentDateKey(
                new Date()
            ),

        createdAt:
            new Date().toISOString()

    };


    const result =
        await studentsDBCall(
            [
                "addStudentNote",
                "addNote",
                "saveNote"
            ],
            record
        );


    if (
        !Array.isArray(
            student.noteRecords
        )
    ) {

        student.noteRecords =
            [];

    }


    student.noteRecords.push(
        record
    );


    dispatchStudentEvent(
        "teacherpro:student-note-updated",
        {
            student,
            record,
            result
        }
    );


    return true;

}


/* ============================================================
   SET STUDENT EXTRA GRADE
   ============================================================ */

async function setStudentExtraGrade(
    studentId,
    value
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return false;

    }


    const extra =
        Number(
            value
        );


    if (
        !Number.isFinite(
            extra
        )
    ) {

        return false;

    }


    student.extra =
        extra;


    const result =
        await studentsDBCall(
            [
                "updateStudent",
                "saveStudent"
            ],
            student.id,
            {
                extra
            }
        );


    dispatchStudentEvent(
        "teacherpro:student-extra-grade-updated",
        {
            student,
            value:
                extra,
            result
        }
    );


    return true;

}


/* ============================================================
   SET STUDENT ACTIVE STATE
   ============================================================ */

async function setStudentActive(
    studentId,
    active
) {

    const student =
        StudentsState.students.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    studentId
                )
        );


    if (
        !student
    ) {

        return false;

    }


    student.active =
        Boolean(
            active
        );


    student.updatedAt =
        new Date().toISOString();


    const result =
        await studentsDBCall(
            [
                "updateStudent",
                "saveStudent"
            ],
            student.id,
            {
                active:
                    student.active,

                updatedAt:
                    student.updatedAt
            }
        );


    StudentsState.activeStudents =
        StudentsState.students.filter(
            item =>
                item.active !== false
        ).length;


    StudentsState.inactiveStudents =
        StudentsState.totalStudents -
        StudentsState.activeStudents;


    renderStudents();


    dispatchStudentEvent(
        "teacherpro:student-status-updated",
        {
            student,
            result
        }
    );


    return true;

}


/* ============================================================
   FIND STUDENT
   ============================================================ */

function findStudent(
    query
) {

    const value =
        String(
            query ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !value
    ) {

        return [];

    }


    return StudentsState.students.filter(
        student => {

            return [

                student.name,

                student.fullName,

                student.code,

                student.fatherPhone,

                student.motherPhone,

                student.parentName

            ].some(
                item =>
                    String(
                        item ||
                        ""
                    )
                        .toLowerCase()
                        .includes(
                            value
                        )
            );

        }
    );

}


/* ============================================================
   GET STUDENT BY ID
   ============================================================ */

function getStudentById(
    studentId
) {

    return StudentsState.students.find(
        student =>
            String(
                student.id
            ) ===
            String(
                studentId
            )
    ) || null;

}


/* ============================================================
   SET PAGE SIZE
   ============================================================ */

function setStudentsPageSize(
    size
) {

    const value =
        Number(
            size
        );


    if (
        !Number.isFinite(
            value
        ) ||
        value <=
        0
    ) {

        return;

    }


    StudentsState.pageSize =
        Math.min(
            value,
            500
        );


    StudentsState.currentPage =
        1;


    renderStudentsList();

}


/* ============================================================
   DESTROY
   ============================================================ */

function destroyStudentsModule() {

    StudentsState.initialized =
        false;


    StudentsState.students =
        [];

    StudentsState.filteredStudents =
        [];

    StudentsState.classes =
        [];

    StudentsState.sections =
        [];

    StudentsState.selectedClassId =
        null;

    StudentsState.selectedSectionId =
        null;

    StudentsState.selectedStudentId =
        null;

    StudentsState.selectedStudent =
        null;


    document.body.classList.remove(
        "student-profile-open"
    );


    document.body.classList.remove(
        "student-form-open"
    );

}


/* ============================================================
   EXTENDED PUBLIC API
   ============================================================ */

window.TeacherProStudentsAPI = {

    init:
        initializeStudents,

    refresh:
        refreshStudents,

    destroy:
        destroyStudentsModule,

    load:
        loadStudents,

    render:
        renderStudents,

    search:
        setStudentsSearch,

    filterClass:
        setStudentsClass,

    filterSection:
        setStudentsSection,

    find:
        findStudent,

    get:
        getStudentById,

    getAll:
        function () {

            return [
                ...StudentsState.students
            ];

        },

    getFiltered:
        function () {

            return [
                ...StudentsState.filteredStudents
            ];

        },

    select:
        selectStudent,

    add:
        openAddStudent,

    edit:
        openEditStudent,

    delete:
        deleteStudent,

    save:
        saveStudentFromForm,

    export:
        exportStudent,

    attendance:
        updateStudentAttendance,

    grade:
        updateStudentGrade,

    note:
        addStudentNote,

    extra:
        setStudentExtraGrade,

    setActive:
        setStudentActive,

    nextPage:
        nextStudentsPage,

    previousPage:
        previousStudentsPage,

    setPageSize:
        setStudentsPageSize,

    state:
        StudentsState

};


/* ============================================================
   AUTO REFRESH EVENTS
   ============================================================ */

document.addEventListener(
    "teacherpro:attendance-updated",
    async () => {

        await refreshStudents();

    }
);


document.addEventListener(
    "teacherpro:grade-updated",
    async () => {

        await refreshStudents();

    }
);


document.addEventListener(
    "teacherpro:student-note-updated",
    async () => {

        if (
            StudentsState.selectedStudentId
        ) {

            const student =
                getStudentById(
                    StudentsState.selectedStudentId
                );


            if (
                student
            ) {

                await loadCompleteStudentData(
                    student
                );


                renderStudentProfile(
                    student
                );

            }

        }

    }
);


/* ============================================================
   PAGE VISIBILITY
   ============================================================ */

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            !document.hidden &&
            StudentsState.initialized
        ) {

            await refreshStudents();

        }

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

            initializeStudents();

        },
        {
            once:
                true
        }
    );

} else {

    initializeStudents();

}


/* ============================================================
   END OF STUDENTS.JS
   ============================================================ */