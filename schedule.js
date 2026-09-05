/* =========================================================
   Teacher Management System
   File: schedule.js
   Version: 1.0.0

   قسم الجدول الدراسي
   - إضافة وتعديل وحذف الحصص
   - ربط الحصة بالصف والشعبة
   - تحديد اليوم والوقت والدرس
   - عرض جدول أسبوعي
   - تحديد الحصة الحالية والقادمة
   - حفظ جميع البيانات داخل IndexedDB
   - تحديث تلقائي بدون إعادة تحميل الصفحة
   ========================================================= */

(function () {
    "use strict";

    /* =====================================================
       إعدادات قاعدة البيانات
       ===================================================== */

    const DB_NAME = "TeacherManagementDB";
    const DB_VERSION = 1;

    const STORE_SCHEDULE = "schedule";
    const STORE_CLASSES = "classes";

    let database = null;

    /* =====================================================
       أيام الأسبوع
       ===================================================== */

    const DAYS = [
        {
            id: 0,
            key: "saturday",
            name: "السبت",
            short: "سبت"
        },
        {
            id: 1,
            key: "sunday",
            name: "الأحد",
            short: "أحد"
        },
        {
            id: 2,
            key: "monday",
            name: "الاثنين",
            short: "اثنين"
        },
        {
            id: 3,
            key: "tuesday",
            name: "الثلاثاء",
            short: "ثلاثاء"
        },
        {
            id: 4,
            key: "wednesday",
            name: "الأربعاء",
            short: "أربعاء"
        },
        {
            id: 5,
            key: "thursday",
            name: "الخميس",
            short: "خميس"
        },
        {
            id: 6,
            key: "friday",
            name: "الجمعة",
            short: "جمعة"
        }
    ];

    /* =====================================================
       أوقات افتراضية للحصص
       ===================================================== */

    const DEFAULT_PERIODS = [
        {
            id: 1,
            name: "الحصة الأولى",
            start: "08:00",
            end: "08:45"
        },
        {
            id: 2,
            name: "الحصة الثانية",
            start: "08:50",
            end: "09:35"
        },
        {
            id: 3,
            name: "الحصة الثالثة",
            start: "09:40",
            end: "10:25"
        },
        {
            id: 4,
            name: "الحصة الرابعة",
            start: "10:30",
            end: "11:15"
        },
        {
            id: 5,
            name: "الحصة الخامسة",
            start: "11:20",
            end: "12:05"
        },
        {
            id: 6,
            name: "الحصة السادسة",
            start: "12:10",
            end: "12:55"
        },
        {
            id: 7,
            name: "الحصة السابعة",
            start: "13:00",
            end: "13:45"
        },
        {
            id: 8,
            name: "الحصة الثامنة",
            start: "13:50",
            end: "14:35"
        }
    ];

    /* =====================================================
       أدوات عامة
       ===================================================== */

    function generateId(prefix = "schedule") {
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

    function nowISO() {
        return new Date().toISOString();
    }

    function escapeHTML(value) {
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

    function normalize(value) {
        return String(value || "")
            .trim()
            .toLowerCase();
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function pad(number) {
        return String(number).padStart(2, "0");
    }

    function timeToMinutes(time) {
        if (!time) {
            return null;
        }

        const parts =
            String(time).split(":");

        if (parts.length < 2) {
            return null;
        }

        const hours =
            Number(parts[0]);

        const minutes =
            Number(parts[1]);

        if (
            Number.isNaN(hours) ||
            Number.isNaN(minutes)
        ) {
            return null;
        }

        return (
            hours * 60 +
            minutes
        );
    }

    function minutesToTime(minutes) {
        const h =
            Math.floor(minutes / 60);

        const m =
            minutes % 60;

        return (
            pad(h) +
            ":" +
            pad(m)
        );
    }

    function formatTime12(time) {
        if (!time) {
            return "-";
        }

        const minutes =
            timeToMinutes(time);

        if (minutes === null) {
            return escapeHTML(time);
        }

        let hour =
            Math.floor(minutes / 60);

        const minute =
            minutes % 60;

        const period =
            hour >= 12
                ? "م"
                : "ص";

        hour =
            hour % 12;

        if (hour === 0) {
            hour = 12;
        }

        return (
            hour +
            ":" +
            pad(minute) +
            " " +
            period
        );
    }

    function getTodayDayId() {
        const date =
            new Date();

        /*
         * JavaScript:
         * Sunday = 0
         * Monday = 1
         * ...
         * Saturday = 6
         *
         * نظامنا:
         * Saturday = 0
         * Sunday = 1
         * ...
         */

        const jsDay =
            date.getDay();

        if (jsDay === 6) {
            return 0;
        }

        return jsDay + 1;
    }

    function getDayName(dayId) {
        const day =
            DAYS.find(
                item =>
                    item.id ===
                    Number(dayId)
            );

        return day
            ? day.name
            : "غير محدد";
    }

    function getDayShort(dayId) {
        const day =
            DAYS.find(
                item =>
                    item.id ===
                    Number(dayId)
            );

        return day
            ? day.short
            : "-";
    }

    /* =====================================================
       IndexedDB
       ===================================================== */

    function openDatabase() {
        return new Promise(
            (resolve, reject) => {

                if (database) {
                    resolve(database);
                    return;
                }

                const request =
                    indexedDB.open(
                        DB_NAME,
                        DB_VERSION
                    );

                request.onupgradeneeded =
                    function (event) {

                        const db =
                            event.target.result;

                        if (
                            !db.objectStoreNames.contains(
                                STORE_SCHEDULE
                            )
                        ) {

                            const store =
                                db.createObjectStore(
                                    STORE_SCHEDULE,
                                    {
                                        keyPath:
                                            "id"
                                    }
                                );

                            store.createIndex(
                                "day",
                                "day",
                                {
                                    unique:
                                        false
                                }
                            );

                            store.createIndex(
                                "classId",
                                "classId",
                                {
                                    unique:
                                        false
                                }
                            );

                            store.createIndex(
                                "sectionId",
                                "sectionId",
                                {
                                    unique:
                                        false
                                }
                            );

                            store.createIndex(
                                "start",
                                "start",
                                {
                                    unique:
                                        false
                                }
                            );
                        }

                        if (
                            !db.objectStoreNames.contains(
                                STORE_CLASSES
                            )
                        ) {

                            db.createObjectStore(
                                STORE_CLASSES,
                                {
                                    keyPath:
                                        "id"
                                }
                            );
                        }
                    };

                request.onsuccess =
                    function (event) {

                        database =
                            event.target.result;

                        database.onversionchange =
                            function () {
                                database.close();
                            };

                        resolve(
                            database
                        );
                    };

                request.onerror =
                    function () {
                        reject(
                            request.error
                        );
                    };
            }
        );
    }

    async function ensureDatabase() {
        return await openDatabase();
    }

    function getAll(storeName) {
        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        await ensureDatabase();

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

                } catch (error) {
                    reject(error);
                }
            }
        );
    }

    function getById(
        storeName,
        id
    ) {
        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        await ensureDatabase();

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

                } catch (error) {
                    reject(error);
                }
            }
        );
    }

    function put(
        storeName,
        value
    ) {
        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        await ensureDatabase();

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
                        store.put(value);

                    request.onsuccess =
                        () => {
                            resolve(value);
                        };

                    request.onerror =
                        () => {
                            reject(
                                request.error
                            );
                        };

                } catch (error) {
                    reject(error);
                }
            }
        );
    }

    function remove(
        storeName,
        id
    ) {
        return new Promise(
            async (resolve, reject) => {

                try {

                    const db =
                        await ensureDatabase();

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
                        store.delete(id);

                    request.onsuccess =
                        () => {
                            resolve(true);
                        };

                    request.onerror =
                        () => {
                            reject(
                                request.error
                            );
                        };

                } catch (error) {
                    reject(error);
                }
            }
        );
    }

    /* =====================================================
       التنبيهات
       ===================================================== */

    function showToast(
        message,
        type = "success"
    ) {

        let container =
            document.querySelector(
                ".schedule-toast-container"
            );

        if (!container) {

            container =
                document.createElement(
                    "div"
                );

            container.className =
                "schedule-toast-container";

            Object.assign(
                container.style,
                {
                    position:
                        "fixed",

                    right:
                        "20px",

                    bottom:
                        "20px",

                    zIndex:
                        "999999",

                    display:
                        "flex",

                    flexDirection:
                        "column",

                    gap:
                        "10px"
                }
            );

            document.body.appendChild(
                container
            );
        }

        const toast =
            document.createElement(
                "div"
            );

        let icon = "✓";

        if (type === "error") {
            icon = "❌";
        }

        if (type === "warning") {
            icon = "⚠️";
        }

        toast.innerHTML = `
            <span style="
                font-size:18px;
                margin-left:8px;
            ">
                ${icon}
            </span>

            <span>
                ${escapeHTML(message)}
            </span>
        `;

        Object.assign(
            toast.style,
            {
                direction:
                    "rtl",

                color:
                    "#fff",

                background:
                    "rgba(12,14,24,.92)",

                border:
                    "1px solid rgba(255,255,255,.14)",

                boxShadow:
                    "0 18px 50px rgba(0,0,0,.35)",

                backdropFilter:
                    "blur(18px)",

                WebkitBackdropFilter:
                    "blur(18px)",

                padding:
                    "13px 17px",

                borderRadius:
                    "14px",

                fontSize:
                    "13px",

                display:
                    "flex",

                alignItems:
                    "center",

                opacity:
                    "0",

                transform:
                    "translateY(15px)",

                transition:
                    "all .3s ease"
            }
        );

        container.appendChild(
            toast
        );

        requestAnimationFrame(
            () => {
                toast.style.opacity =
                    "1";

                toast.style.transform =
                    "translateY(0)";
            }
        );

        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translateY(15px)";

                setTimeout(
                    () => {
                        toast.remove();
                    },
                    300
                );

            },
            3000
        );
    }

    /* =====================================================
       CSS
       ===================================================== */

    function injectStyles() {

        if (
            document.getElementById(
                "schedule-module-style"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "schedule-module-style";

        style.textContent = `

            .schedule-module {
                width: 100%;
                direction: rtl;
                color: #fff;
            }

            .schedule-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }

            .schedule-title-area {
                display: flex;
                align-items: center;
                gap: 13px;
            }

            .schedule-icon {
                width: 52px;
                height: 52px;
                border-radius: 17px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 25px;
                background:
                    linear-gradient(
                        135deg,
                        rgba(0,180,255,.2),
                        rgba(130,50,255,.2)
                    );
                border:
                    1px solid rgba(255,255,255,.12);
                box-shadow:
                    0 12px 35px rgba(0,0,0,.22);
            }

            .schedule-title {
                margin: 0;
                font-size: 24px;
                font-weight: 800;
            }

            .schedule-subtitle {
                margin: 5px 0 0;
                color:
                    rgba(255,255,255,.55);
                font-size: 12px;
            }

            .schedule-primary {
                border: 0;
                color: #fff;
                cursor: pointer;
                padding: 13px 18px;
                border-radius: 14px;
                font-weight: 800;
                background:
                    linear-gradient(
                        135deg,
                        #6947ff,
                        #c13cff
                    );
                box-shadow:
                    0 12px 30px
                    rgba(105,71,255,.25);
                transition:
                    .2s ease;
            }

            .schedule-primary:hover {
                transform:
                    translateY(-2px);
            }

            .schedule-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }

            .schedule-toolbar-group {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }

            .schedule-select,
            .schedule-search {
                color: #fff;
                background:
                    rgba(255,255,255,.055);
                border:
                    1px solid rgba(255,255,255,.11);
                border-radius: 12px;
                padding: 10px 12px;
                outline: none;
                min-width: 150px;
                box-sizing: border-box;
            }

            .schedule-select option {
                background:
                    #171823;
                color: #fff;
            }

            .schedule-search {
                min-width: 220px;
            }

            .schedule-week {
                display: grid;
                grid-template-columns:
                    repeat(7, minmax(150px, 1fr));
                gap: 10px;
                overflow-x: auto;
                padding-bottom: 6px;
            }

            .schedule-day {
                min-width: 150px;
                min-height: 430px;
                border-radius: 19px;
                padding: 11px;
                background:
                    linear-gradient(
                        145deg,
                        rgba(255,255,255,.075),
                        rgba(255,255,255,.028)
                    );
                border:
                    1px solid rgba(255,255,255,.11);
                backdrop-filter:
                    blur(18px);
                -webkit-backdrop-filter:
                    blur(18px);
                box-shadow:
                    0 18px 45px
                    rgba(0,0,0,.16);
            }

            .schedule-day.today {
                border-color:
                    rgba(111,97,255,.55);
                box-shadow:
                    0 0 35px
                    rgba(111,97,255,.12);
            }

            .schedule-day-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 9px 8px 13px;
                margin-bottom: 6px;
                border-bottom:
                    1px solid
                    rgba(255,255,255,.08);
            }

            .schedule-day-name {
                font-weight: 800;
                font-size: 14px;
            }

            .schedule-day-badge {
                font-size: 10px;
                color:
                    rgba(255,255,255,.5);
            }

            .schedule-lessons {
                display: flex;
                flex-direction: column;
                gap: 9px;
            }

            .schedule-lesson {
                position: relative;
                overflow: hidden;
                border-radius: 15px;
                padding: 12px;
                cursor: pointer;
                background:
                    rgba(255,255,255,.05);
                border:
                    1px solid
                    rgba(255,255,255,.09);
                transition:
                    transform .2s ease,
                    border-color .2s ease,
                    background .2s ease;
            }

            .schedule-lesson:hover {
                transform:
                    translateY(-2px);
                background:
                    rgba(255,255,255,.085);
                border-color:
                    rgba(255,255,255,.18);
            }

            .schedule-lesson.current {
                border-color:
                    rgba(72,220,140,.55);
                box-shadow:
                    0 0 25px
                    rgba(72,220,140,.1);
            }

            .schedule-lesson.current::before {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                width: 4px;
                height: 100%;
                background:
                    #43e58c;
                box-shadow:
                    0 0 12px
                    #43e58c;
            }

            .schedule-lesson-time {
                color:
                    rgba(255,255,255,.52);
                font-size: 10px;
                margin-bottom: 6px;
            }

            .schedule-lesson-title {
                font-size: 14px;
                font-weight: 800;
                margin-bottom: 7px;
            }

            .schedule-lesson-class {
                font-size: 11px;
                color:
                    rgba(255,255,255,.62);
                line-height: 1.7;
            }

            .schedule-lesson-room {
                font-size: 10px;
                color:
                    rgba(255,255,255,.42);
                margin-top: 5px;
            }

            .schedule-empty-day {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100px;
                text-align: center;
                color:
                    rgba(255,255,255,.3);
                font-size: 11px;
            }

            .schedule-current-box {
                margin-bottom: 17px;
                padding: 16px;
                border-radius: 18px;
                background:
                    linear-gradient(
                        135deg,
                        rgba(55,225,140,.08),
                        rgba(70,100,255,.07)
                    );
                border:
                    1px solid
                    rgba(255,255,255,.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                flex-wrap: wrap;
            }

            .schedule-current-main {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .schedule-live-dot {
                width: 11px;
                height: 11px;
                border-radius: 50%;
                background:
                    #43e58c;
                box-shadow:
                    0 0 0 0
                    rgba(67,229,140,.5);
                animation:
                    schedulePulse 1.5s infinite;
            }

            @keyframes schedulePulse {
                0% {
                    box-shadow:
                        0 0 0 0
                        rgba(67,229,140,.5);
                }

                70% {
                    box-shadow:
                        0 0 0 10px
                        rgba(67,229,140,0);
                }

                100% {
                    box-shadow:
                        0 0 0 0
                        rgba(67,229,140,0);
                }
            }

            .schedule-current-title {
                font-weight: 800;
                font-size: 14px;
            }

            .schedule-current-description {
                color:
                    rgba(255,255,255,.55);
                font-size: 11px;
                margin-top: 4px;
            }

            .schedule-modal {
                position: fixed;
                inset: 0;
                z-index: 999990;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background:
                    rgba(0,0,0,.65);
                backdrop-filter:
                    blur(10px);
                -webkit-backdrop-filter:
                    blur(10px);
            }

            .schedule-modal.show {
                display: flex;
            }

            .schedule-modal-content {
                width:
                    min(700px, 100%);
                max-height:
                    90vh;
                overflow-y:
                    auto;
                padding:
                    22px;
                border-radius:
                    23px;
                box-sizing:
                    border-box;
                background:
                    linear-gradient(
                        145deg,
                        rgba(25,27,42,.97),
                        rgba(10,12,22,.97)
                    );
                border:
                    1px solid
                    rgba(255,255,255,.13);
                box-shadow:
                    0 30px 90px
                    rgba(0,0,0,.55);
            }

            .schedule-modal-header {
                display:
                    flex;
                align-items:
                    center;
                justify-content:
                    space-between;
                margin-bottom:
                    18px;
            }

            .schedule-modal-header h3 {
                margin:
                    0;
                font-size:
                    20px;
            }

            .schedule-close {
                width:
                    38px;
                height:
                    38px;
                border:
                    0;
                border-radius:
                    11px;
                background:
                    rgba(255,255,255,.07);
                color:
                    #fff;
                font-size:
                    21px;
                cursor:
                    pointer;
            }

            .schedule-form {
                display:
                    grid;
                grid-template-columns:
                    repeat(
                        2,
                        minmax(0,1fr)
                    );
                gap:
                    13px;
            }

            .schedule-field {
                display:
                    flex;
                flex-direction:
                    column;
                gap:
                    7px;
            }

            .schedule-field.full {
                grid-column:
                    1 / -1;
            }

            .schedule-field label {
                color:
                    rgba(255,255,255,.56);
                font-size:
                    12px;
            }

            .schedule-field input,
            .schedule-field select,
            .schedule-field textarea {
                width:
                    100%;
                box-sizing:
                    border-box;
                color:
                    #fff;
                background:
                    rgba(255,255,255,.055);
                border:
                    1px solid
                    rgba(255,255,255,.11);
                border-radius:
                    12px;
                padding:
                    11px 12px;
                outline:
                    none;
                font-family:
                    inherit;
            }

            .schedule-field textarea {
                min-height:
                    85px;
                resize:
                    vertical;
            }

            .schedule-field option {
                background:
                    #171823;
                color:
                    #fff;
            }

            .schedule-form-actions {
                grid-column:
                    1 / -1;
                display:
                    flex;
                justify-content:
                    flex-end;
                gap:
                    9px;
                margin-top:
                    5px;
            }

            .schedule-secondary {
                color:
                    #fff;
                cursor:
                    pointer;
                border:
                    1px solid
                    rgba(255,255,255,.1);
                background:
                    rgba(255,255,255,.05);
                border-radius:
                    12px;
                padding:
                    11px 16px;
            }

            .schedule-danger {
                color:
                    #ff9a9a;
                cursor:
                    pointer;
                border:
                    1px solid
                    rgba(255,70,70,.18);
                background:
                    rgba(255,70,70,.07);
                border-radius:
                    12px;
                padding:
                    11px 16px;
            }

            .schedule-error {
                display:
                    none;
                margin-bottom:
                    12px;
                padding:
                    10px 12px;
                border-radius:
                    11px;
                background:
                    rgba(255,60,60,.1);
                border:
                    1px solid
                    rgba(255,60,60,.18);
                color:
                    #ff9696;
                font-size:
                    12px;
            }

            .schedule-detail-grid {
                display:
                    grid;
                grid-template-columns:
                    repeat(
                        2,
                        minmax(0,1fr)
                    );
                gap:
                    9px;
            }

            .schedule-detail-item {
                padding:
                    12px;
                border-radius:
                    12px;
                background:
                    rgba(255,255,255,.04);
                border:
                    1px solid
                    rgba(255,255,255,.07);
            }

            .schedule-detail-label {
                color:
                    rgba(255,255,255,.45);
                font-size:
                    10px;
                margin-bottom:
                    5px;
            }

            .schedule-detail-value {
                font-size:
                    13px;
                font-weight:
                    700;
            }

            @media (max-width: 760px) {

                .schedule-week {
                    grid-template-columns:
                        repeat(
                            7,
                            minmax(190px,1fr)
                        );
                }

                .schedule-form {
                    grid-template-columns:
                        1fr;
                }

                .schedule-field.full {
                    grid-column:
                        auto;
                }

                .schedule-form-actions {
                    grid-column:
                        auto;
                }

                .schedule-detail-grid {
                    grid-template-columns:
                        1fr;
                }

                .schedule-primary {
                    width:
                        100%;
                }

                .schedule-header {
                    align-items:
                        stretch;
                }

                .schedule-search {
                    min-width:
                        100%;
                }
            }

        `;

        document.head.appendChild(
            style
        );
    }

    /* =====================================================
       الصفوف
       ===================================================== */

    function getClassName(
        classId,
        classes
    ) {

        if (!classId) {
            return "جميع الصفوف";
        }

        const item =
            classes.find(
                cls =>
                    cls.id === classId
            );

        if (!item) {
            return "صف غير معروف";
        }

        return (
            item.name ||
            item.className ||
            item.title ||
            "صف"
        );
    }

    function getSections(
        classId,
        classes
    ) {

        if (!classId) {
            return [];
        }

        const item =
            classes.find(
                cls =>
                    cls.id === classId
            );

        if (
            !item ||
            !Array.isArray(
                item.sections
            )
        ) {
            return [];
        }

        return item.sections;
    }

    function getSectionName(
        classId,
        sectionId,
        classes
    ) {

        if (!sectionId) {
            return "جميع الشعب";
        }

        const sections =
            getSections(
                classId,
                classes
            );

        const section =
            sections.find(
                item =>
                    item.id ===
                    sectionId
            );

        if (!section) {
            return String(
                sectionId
            );
        }

        return (
            section.name ||
            section.title ||
            "شعبة"
        );
    }

    /* =====================================================
       مطابقة الفلترة
       ===================================================== */

    function lessonMatchesFilter(
        lesson,
        classFilter,
        sectionFilter,
        search
    ) {

        if (
            classFilter &&
            lesson.classId !==
                classFilter
        ) {
            return false;
        }

        if (
            sectionFilter &&
            lesson.sectionId !==
                sectionFilter
        ) {
            return false;
        }

        if (search) {

            const text =
                normalize(
                    [
                        lesson.subject,
                        lesson.lesson,
                        lesson.topic,
                        lesson.notes
                    ].join(" ")
                );

            if (
                !text.includes(
                    normalize(search)
                )
            ) {
                return false;
            }
        }

        return true;
    }

    /* =====================================================
       الحصة الحالية
       ===================================================== */

    function getCurrentLesson(
        lessons
    ) {

        const dayId =
            getTodayDayId();

        const todayLessons =
            lessons
                .filter(
                    lesson =>
                        Number(
                            lesson.day
                        ) === dayId
                )
                .sort(
                    (a,b) =>
                        timeToMinutes(
                            a.start
                        ) -
                        timeToMinutes(
                            b.start
                        )
                );

        const now =
            new Date();

        const currentMinutes =
            now.getHours() * 60 +
            now.getMinutes();

        for (
            const lesson
            of todayLessons
        ) {

            const start =
                timeToMinutes(
                    lesson.start
                );

            const end =
                timeToMinutes(
                    lesson.end
                );

            if (
                start !== null &&
                end !== null &&
                currentMinutes >= start &&
                currentMinutes < end
            ) {

                return {
                    type:
                        "current",

                    lesson
                };
            }
        }

        for (
            const lesson
            of todayLessons
        ) {

            const start =
                timeToMinutes(
                    lesson.start
                );

            if (
                start !== null &&
                start > currentMinutes
            ) {

                return {
                    type:
                        "next",

                    lesson
                };
            }
        }

        return null;
    }

    /* =====================================================
       بناء واجهة القسم
       ===================================================== */

    async function render(
        container
    ) {

        injectStyles();

        const [
            lessons,
            classes
        ] = await Promise.all([
            getAll(
                STORE_SCHEDULE
            ),
            getAll(
                STORE_CLASSES
            )
        ]);

        container.innerHTML = `

            <section class="schedule-module">

                <div class="schedule-header">

                    <div class="schedule-title-area">

                        <div class="schedule-icon">
                            📅
                        </div>

                        <div>

                            <h2 class="schedule-title">
                                الجدول الدراسي
                            </h2>

                            <p class="schedule-subtitle">
                                نظّم حصصك واربط كل درس بالصف والشعبة
                            </p>

                        </div>

                    </div>

                    <button
                        class="schedule-primary"
                        id="scheduleAddButton"
                    >
                        ＋ إضافة حصة
                    </button>

                </div>

                <div
                    id="scheduleCurrentBox"
                    class="schedule-current-box"
                ></div>

                <div class="schedule-toolbar">

                    <div class="schedule-toolbar-group">

                        <select
                            id="scheduleClassFilter"
                            class="schedule-select"
                        >

                            <option value="">
                                كل الصفوف
                            </option>

                            ${classes.map(
                                cls => `
                                    <option
                                        value="${escapeHTML(
                                            cls.id
                                        )}"
                                    >
                                        ${escapeHTML(
                                            cls.name ||
                                            cls.className ||
                                            cls.title ||
                                            "صف"
                                        )}
                                    </option>
                                `
                            ).join("")}

                        </select>

                        <select
                            id="scheduleSectionFilter"
                            class="schedule-select"
                        >

                            <option value="">
                                كل الشعب
                            </option>

                        </select>

                    </div>

                    <input
                        id="scheduleSearch"
                        class="schedule-search"
                        type="search"
                        placeholder="🔎 بحث عن درس أو مادة..."
                    >

                </div>

                <div
                    id="scheduleWeek"
                    class="schedule-week"
                ></div>

            </section>
        `;

        const classFilter =
            getElement(
                "scheduleClassFilter"
            );

        const sectionFilter =
            getElement(
                "scheduleSectionFilter"
            );

        const search =
            getElement(
                "scheduleSearch"
            );

        const week =
            getElement(
                "scheduleWeek"
            );

        const currentBox =
            getElement(
                "scheduleCurrentBox"
            );

        function updateSections() {

            const selected =
                classFilter.value;

            const sections =
                getSections(
                    selected,
                    classes
                );

            sectionFilter.innerHTML = `
                <option value="">
                    كل الشعب
                </option>

                ${sections.map(
                    section => `
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
                    `
                ).join("")}
            `;
        }

        function renderCurrent() {

            const current =
                getCurrentLesson(
                    lessons
                );

            if (!current) {

                currentBox.innerHTML = `
                    <div class="schedule-current-main">

                        <div
                            class="schedule-live-dot"
                            style="
                                background:#888;
                                animation:none;
                            "
                        ></div>

                        <div>

                            <div class="schedule-current-title">
                                لا توجد حصة الآن
                            </div>

                            <div class="schedule-current-description">
                                لا توجد حصة قادمة مسجلة لليوم.
                            </div>

                        </div>

                    </div>
                `;

                return;
            }

            const lesson =
                current.lesson;

            const isCurrent =
                current.type ===
                "current";

            currentBox.innerHTML = `

                <div class="schedule-current-main">

                    <div class="schedule-live-dot"></div>

                    <div>

                        <div class="schedule-current-title">

                            ${
                                isCurrent
                                    ? "🟢 الحصة الحالية"
                                    : "⏳ الحصة القادمة"
                            }

                            — 

                            ${escapeHTML(
                                lesson.subject ||
                                lesson.lesson ||
                                "درس"
                            )}

                        </div>

                        <div class="schedule-current-description">

                            ${escapeHTML(
                                getClassName(
                                    lesson.classId,
                                    classes
                                )
                            )}

                            • 

                            ${escapeHTML(
                                getSectionName(
                                    lesson.classId,
                                    lesson.sectionId,
                                    classes
                                )
                            )}

                            •

                            ${formatTime12(
                                lesson.start
                            )}

                            -

                            ${formatTime12(
                                lesson.end
                            )}

                        </div>

                    </div>

                </div>

                <div style="
                    color:rgba(255,255,255,.5);
                    font-size:11px;
                ">
                    ${
                        lesson.topic
                            ? escapeHTML(
                                lesson.topic
                            )
                            : "لا يوجد موضوع محدد"
                    }
                </div>
            `;
        }

        function renderWeek() {

            const selectedClass =
                classFilter.value;

            const selectedSection =
                sectionFilter.value;

            const searchValue =
                search.value;

            week.innerHTML =
                DAYS.map(
                    day => {

                        const isToday =
                            day.id ===
                            getTodayDayId();

                        const dayLessons =
                            lessons
                                .filter(
                                    lesson =>
                                        Number(
                                            lesson.day
                                        ) ===
                                        day.id
                                )
                                .filter(
                                    lesson =>
                                        lessonMatchesFilter(
                                            lesson,
                                            selectedClass,
                                            selectedSection,
                                            searchValue
                                        )
                                )
                                .sort(
                                    (a,b) =>
                                        timeToMinutes(
                                            a.start
                                        ) -
                                        timeToMinutes(
                                            b.start
                                        )
                                );

                        return `

                            <div
                                class="
                                    schedule-day
                                    ${isToday ? "today" : ""}
                                "
                                data-day="${day.id}"
                            >

                                <div
                                    class="schedule-day-header"
                                >

                                    <span
                                        class="schedule-day-name"
                                    >
                                        ${day.name}
                                    </span>

                                    <span
                                        class="schedule-day-badge"
                                    >
                                        ${dayLessons.length}
                                        حصة
                                    </span>

                                </div>

                                <div
                                    class="schedule-lessons"
                                >

                                    ${
                                        dayLessons.length
                                            ? dayLessons
                                                .map(
                                                    lesson =>
                                                        renderLesson(
                                                            lesson
                                                        )
                                                )
                                                .join("")
                                            : `
                                                <div
                                                    class="schedule-empty-day"
                                                >
                                                    لا توجد حصص
                                                </div>
                                            `
                                    }

                                </div>

                            </div>
                        `;
                    }
                ).join("");

            attachLessonEvents();
        }

        function renderLesson(
            lesson
        ) {

            const now =
                new Date();

            const today =
                getTodayDayId();

            const currentMinutes =
                now.getHours() * 60 +
                now.getMinutes();

            const start =
                timeToMinutes(
                    lesson.start
                );

            const end =
                timeToMinutes(
                    lesson.end
                );

            const current =
                Number(
                    lesson.day
                ) === today &&
                start !== null &&
                end !== null &&
                currentMinutes >= start &&
                currentMinutes < end;

            return `

                <div
                    class="
                        schedule-lesson
                        ${current ? "current" : ""}
                    "
                    data-id="${escapeHTML(
                        lesson.id
                    )}"
                >

                    <div
                        class="schedule-lesson-time"
                    >
                        ${
                            formatTime12(
                                lesson.start
                            )
                        }

                        -

                        ${
                            formatTime12(
                                lesson.end
                            )
                        }
                    </div>

                    <div
                        class="schedule-lesson-title"
                    >
                        ${
                            escapeHTML(
                                lesson.subject ||
                                lesson.lesson ||
                                "درس"
                            )
                        }
                    </div>

                    <div
                        class="schedule-lesson-class"
                    >
                        ${
                            escapeHTML(
                                getClassName(
                                    lesson.classId,
                                    classes
                                )
                            )
                        }

                        <br>

                        ${
                            escapeHTML(
                                getSectionName(
                                    lesson.classId,
                                    lesson.sectionId,
                                    classes
                                )
                            )
                        }
                    </div>

                    ${
                        lesson.room
                            ? `
                                <div
                                    class="schedule-lesson-room"
                                >
                                    📍
                                    ${escapeHTML(
                                        lesson.room
                                    )}
                                </div>
                            `
                            : ""
                    }

                </div>
            `;
        }

        function attachLessonEvents() {

            week
                .querySelectorAll(
                    ".schedule-lesson"
                )
                .forEach(
                    lessonElement => {

                        lessonElement.addEventListener(
                            "click",
                            async () => {

                                const id =
                                    lessonElement
                                        .dataset
                                        .id;

                                await viewLesson(
                                    id,
                                    classes
                                );
                            }
                        );

                    }
                );
        }

        classFilter.addEventListener(
            "change",
            () => {

                updateSections();
                renderWeek();

            }
        );

        sectionFilter.addEventListener(
            "change",
            renderWeek
        );

        search.addEventListener(
            "input",
            renderWeek
        );

        getElement(
            "scheduleAddButton"
        ).addEventListener(
            "click",
            () => {

                openScheduleModal({
                    classes
                });

            }
        );

        updateSections();
        renderCurrent();
        renderWeek();

        /*
         * تحديث تلقائي للحصة الحالية
         * بدون إعادة تحميل الصفحة.
         */

        const interval =
            setInterval(
                () => {

                    if (
                        !document.body.contains(
                            container
                        )
                    ) {
                        clearInterval(
                            interval
                        );
                        return;
                    }

                    renderCurrent();
                    renderWeek();

                },
                30000
            );
    }

    /* =====================================================
       نافذة إضافة / تعديل الحصة
       ===================================================== */

    async function openScheduleModal({
        classes = [],
        lesson = null
    } = {}) {

        const editing =
            Boolean(lesson);

        const oldModal =
            document.querySelector(
                ".schedule-modal"
            );

        if (oldModal) {
            oldModal.remove();
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.className =
            "schedule-modal show";

        const selectedSections =
            lesson
                ? getSections(
                    lesson.classId,
                    classes
                )
                : [];

        modal.innerHTML = `

            <div
                class="schedule-modal-content"
            >

                <div
                    class="schedule-modal-header"
                >

                    <h3>
                        ${
                            editing
                                ? "✏️ تعديل الحصة"
                                : "📅 إضافة حصة جديدة"
                        }
                    </h3>

                    <button
                        class="schedule-close"
                        data-close
                    >
                        ×
                    </button>

                </div>

                <div
                    id="scheduleFormError"
                    class="schedule-error"
                ></div>

                <form
                    id="scheduleForm"
                    class="schedule-form"
                >

                    <div
                        class="schedule-field"
                    >

                        <label>
                            اليوم *
                        </label>

                        <select
                            name="day"
                            required
                        >

                            ${DAYS.map(
                                day => `
                                    <option
                                        value="${day.id}"
                                        ${
                                            Number(
                                                lesson?.day
                                            ) ===
                                            day.id
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${day.name}
                                    </option>
                                `
                            ).join("")}

                        </select>

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            الصف
                        </label>

                        <select
                            name="classId"
                            id="scheduleFormClass"
                        >

                            <option value="">
                                جميع الصفوف
                            </option>

                            ${classes.map(
                                cls => `
                                    <option
                                        value="${escapeHTML(
                                            cls.id
                                        )}"
                                        ${
                                            lesson?.classId ===
                                            cls.id
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${escapeHTML(
                                            cls.name ||
                                            cls.className ||
                                            cls.title ||
                                            "صف"
                                        )}
                                    </option>
                                `
                            ).join("")}

                        </select>

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            الشعبة
                        </label>

                        <select
                            name="sectionId"
                            id="scheduleFormSection"
                        >

                            <option value="">
                                جميع الشعب
                            </option>

                            ${selectedSections.map(
                                section => `
                                    <option
                                        value="${escapeHTML(
                                            section.id
                                        )}"
                                        ${
                                            lesson?.sectionId ===
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
                                `
                            ).join("")}

                        </select>

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            المادة *
                        </label>

                        <input
                            name="subject"
                            required
                            maxlength="100"
                            placeholder="مثلاً: الرياضيات"
                            value="${escapeHTML(
                                lesson?.subject ||
                                ""
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            اسم الدرس
                        </label>

                        <input
                            name="lesson"
                            maxlength="150"
                            placeholder="مثلاً: المعادلات"
                            value="${escapeHTML(
                                lesson?.lesson ||
                                ""
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            موضوع الدرس
                        </label>

                        <input
                            name="topic"
                            maxlength="200"
                            placeholder="موضوع الحصة"
                            value="${escapeHTML(
                                lesson?.topic ||
                                ""
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            بداية الحصة *
                        </label>

                        <input
                            name="start"
                            type="time"
                            required
                            value="${escapeHTML(
                                lesson?.start ||
                                "08:00"
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            نهاية الحصة *
                        </label>

                        <input
                            name="end"
                            type="time"
                            required
                            value="${escapeHTML(
                                lesson?.end ||
                                "08:45"
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            القاعة
                        </label>

                        <input
                            name="room"
                            maxlength="80"
                            placeholder="مثلاً: قاعة 3"
                            value="${escapeHTML(
                                lesson?.room ||
                                ""
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field"
                    >

                        <label>
                            رقم الحصة
                        </label>

                        <input
                            name="period"
                            type="number"
                            min="1"
                            max="20"
                            step="1"
                            placeholder="1"
                            value="${escapeHTML(
                                lesson?.period ||
                                ""
                            )}"
                        >

                    </div>

                    <div
                        class="schedule-field full"
                    >

                        <label>
                            ملاحظة الحصة
                        </label>

                        <textarea
                            name="notes"
                            maxlength="1500"
                            placeholder="أضف ملاحظتك..."
                        >${escapeHTML(
                            lesson?.notes ||
                            ""
                        )}</textarea>

                    </div>

                    <div
                        class="schedule-form-actions"
                    >

                        ${
                            editing
                                ? `
                                    <button
                                        type="button"
                                        class="schedule-danger"
                                        id="scheduleDeleteFromModal"
                                    >
                                        🗑 حذف
                                    </button>
                                `
                                : ""
                        }

                        <button
                            type="button"
                            class="schedule-secondary"
                            data-close
                        >
                            إلغاء
                        </button>

                        <button
                            type="submit"
                            class="schedule-primary"
                        >
                            ${
                                editing
                                    ? "حفظ التعديلات"
                                    : "حفظ الحصة"
                            }
                        </button>

                    </div>

                </form>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        const classSelect =
            modal.querySelector(
                "#scheduleFormClass"
            );

        const sectionSelect =
            modal.querySelector(
                "#scheduleFormSection"
            );

        classSelect.addEventListener(
            "change",
            function () {

                const sections =
                    getSections(
                        this.value,
                        classes
                    );

                sectionSelect.innerHTML = `
                    <option value="">
                        جميع الشعب
                    </option>

                    ${sections.map(
                        section => `
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
                        `
                    ).join("")}
                `;
            }
        );

        modal
            .querySelectorAll(
                "[data-close]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {
                            modal.remove();
                        }
                    );

                }
            );

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    modal.remove();
                }

            }
        );

        const deleteButton =
            modal.querySelector(
                "#scheduleDeleteFromModal"
            );

        if (deleteButton) {

            deleteButton.addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            "هل تريد حذف هذه الحصة؟"
                        );

                    if (!confirmed) {
                        return;
                    }

                    await deleteLesson(
                        lesson.id
                    );

                    modal.remove();
                    await refreshView();

                }
            );
        }

        modal
            .querySelector(
                "#scheduleForm"
            )
            .addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const form =
                        event.currentTarget;

                    const formData =
                        new FormData(
                            form
                        );

                    const day =
                        Number(
                            formData.get(
                                "day"
                            )
                        );

                    const start =
                        String(
                            formData.get(
                                "start"
                            ) || ""
                        );

                    const end =
                        String(
                            formData.get(
                                "end"
                            ) || ""
                        );

                    const subject =
                        String(
                            formData.get(
                                "subject"
                            ) || ""
                        ).trim();

                    if (
                        !subject
                    ) {

                        showFormError(
                            "اكتب اسم المادة."
                        );

                        return;
                    }

                    if (
                        !start ||
                        !end
                    ) {

                        showFormError(
                            "حدد وقت بداية ونهاية الحصة."
                        );

                        return;
                    }

                    const startMinutes =
                        timeToMinutes(
                            start
                        );

                    const endMinutes =
                        timeToMinutes(
                            end
                        );

                    if (
                        startMinutes ===
                            null ||
                        endMinutes ===
                            null ||
                        endMinutes <=
                            startMinutes
                    ) {

                        showFormError(
                            "وقت نهاية الحصة يجب أن يكون بعد وقت البداية."
                        );

                        return;
                    }

                    const classId =
                        String(
                            formData.get(
                                "classId"
                            ) || ""
                        );

                    const sectionId =
                        String(
                            formData.get(
                                "sectionId"
                            ) || ""
                        );

                    const newLesson = {

                        id:
                            lesson?.id ||
                            generateId(
                                "lesson"
                            ),

                        day,

                        classId,

                        sectionId,

                        subject,

                        lesson:
                            String(
                                formData.get(
                                    "lesson"
                                ) || ""
                            ).trim(),

                        topic:
                            String(
                                formData.get(
                                    "topic"
                                ) || ""
                            ).trim(),

                        start,

                        end,

                        room:
                            String(
                                formData.get(
                                    "room"
                                ) || ""
                            ).trim(),

                        period:
                            Number(
                                formData.get(
                                    "period"
                                )
                            ) || 0,

                        notes:
                            String(
                                formData.get(
                                    "notes"
                                ) || ""
                            ).trim(),

                        createdAt:
                            lesson?.createdAt ||
                            nowISO(),

                        updatedAt:
                            nowISO()
                    };

                    try {

                        /*
                         * منع تداخل الحصص لنفس الصف والشعبة.
                         */

                        const allLessons =
                            await getAll(
                                STORE_SCHEDULE
                            );

                        const conflict =
                            allLessons.find(
                                existing => {

                                    if (
                                        existing.id ===
                                        newLesson.id
                                    ) {
                                        return false;
                                    }

                                    if (
                                        Number(
                                            existing.day
                                        ) !==
                                        newLesson.day
                                    ) {
                                        return false;
                                    }

                                    if (
                                        existing.classId !==
                                        newLesson.classId
                                    ) {
                                        return false;
                                    }

                                    if (
                                        newLesson.sectionId &&
                                        existing.sectionId &&
                                        existing.sectionId !==
                                        newLesson.sectionId
                                    ) {
                                        return false;
                                    }

                                    const oldStart =
                                        timeToMinutes(
                                            existing.start
                                        );

                                    const oldEnd =
                                        timeToMinutes(
                                            existing.end
                                        );

                                    return (
                                        startMinutes <
                                            oldEnd &&
                                        endMinutes >
                                            oldStart
                                    );
                                }
                            );

                        if (conflict) {

                            const answer =
                                window.confirm(
                                    "هناك حصة أخرى متداخلة في هذا الوقت لنفس الصف. هل تريد الحفظ رغم ذلك؟"
                                );

                            if (!answer) {
                                return;
                            }
                        }

                        await put(
                            STORE_SCHEDULE,
                            newLesson
                        );

                        showToast(
                            editing
                                ? "تم تعديل الحصة بنجاح"
                                : "تمت إضافة الحصة بنجاح"
                        );

                        modal.remove();

                        await refreshView();

                    } catch (error) {

                        console.error(
                            error
                        );

                        showFormError(
                            "حدث خطأ أثناء حفظ الحصة."
                        );
                    }
                }
            );

        function showFormError(
            message
        ) {

            const box =
                modal.querySelector(
                    "#scheduleFormError"
                );

            box.textContent =
                message;

            box.style.display =
                "block";
        }
    }

    /* =====================================================
       عرض تفاصيل الحصة
       ===================================================== */

    async function viewLesson(
        id,
        classes
    ) {

        const lesson =
            await getById(
                STORE_SCHEDULE,
                id
            );

        if (!lesson) {

            showToast(
                "لم يتم العثور على الحصة",
                "error"
            );

            return;
        }

        const oldModal =
            document.querySelector(
                ".schedule-modal"
            );

        if (oldModal) {
            oldModal.remove();
        }

        const modal =
            document.createElement(
                "div"
            );

        modal.className =
            "schedule-modal show";

        modal.innerHTML = `

            <div
                class="schedule-modal-content"
            >

                <div
                    class="schedule-modal-header"
                >

                    <h3>
                        📚 تفاصيل الحصة
                    </h3>

                    <button
                        class="schedule-close"
                        data-close
                    >
                        ×
                    </button>

                </div>

                <div
                    class="schedule-detail-grid"
                >

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            اليوم
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                getDayName(
                                    lesson.day
                                )
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            الوقت
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${formatTime12(
                                lesson.start
                            )}

                            -

                            ${formatTime12(
                                lesson.end
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            المادة
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                lesson.subject ||
                                "-"
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            الدرس
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                lesson.lesson ||
                                "-"
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            الصف
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                getClassName(
                                    lesson.classId,
                                    classes
                                )
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            الشعبة
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                getSectionName(
                                    lesson.classId,
                                    lesson.sectionId,
                                    classes
                                )
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            موضوع الدرس
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                lesson.topic ||
                                "-"
                            )}
                        </div>

                    </div>

                    <div
                        class="schedule-detail-item"
                    >

                        <div
                            class="schedule-detail-label"
                        >
                            القاعة
                        </div>

                        <div
                            class="schedule-detail-value"
                        >
                            ${escapeHTML(
                                lesson.room ||
                                "-"
                            )}
                        </div>

                    </div>

                </div>

                ${
                    lesson.notes
                        ? `
                            <div
                                style="
                                    margin-top:14px;
                                    padding:13px;
                                    border-radius:13px;
                                    background:rgba(255,255,255,.04);
                                    border:1px solid rgba(255,255,255,.08);
                                "
                            >

                                <div
                                    style="
                                        font-size:10px;
                                        color:rgba(255,255,255,.45);
                                        margin-bottom:6px;
                                    "
                                >
                                    الملاحظة
                                </div>

                                <div
                                    style="
                                        font-size:13px;
                                        line-height:1.8;
                                    "
                                >
                                    ${escapeHTML(
                                        lesson.notes
                                    )}
                                </div>

                            </div>
                        `
                        : ""
                }

                <div
                    class="schedule-form-actions"
                    style="
                        margin-top:18px;
                    "
                >

                    <button
                        class="schedule-danger"
                        id="scheduleViewDelete"
                    >
                        🗑 حذف
                    </button>

                    <button
                        class="schedule-secondary"
                        id="scheduleViewEdit"
                    >
                        ✏️ تعديل
                    </button>

                    <button
                        class="schedule-primary"
                        data-close
                    >
                        إغلاق
                    </button>

                </div>

            </div>
        `;

        document.body.appendChild(
            modal
        );

        modal
            .querySelectorAll(
                "[data-close]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {
                            modal.remove();
                        }
                    );

                }
            );

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {
                    modal.remove();
                }

            }
        );

        modal
            .querySelector(
                "#scheduleViewEdit"
            )
            .addEventListener(
                "click",
                () => {

                    modal.remove();

                    openScheduleModal({
                        classes,
                        lesson
                    });
                }
            );

        modal
            .querySelector(
                "#scheduleViewDelete"
            )
            .addEventListener(
                "click",
                async () => {

                    const confirmed =
                        window.confirm(
                            `هل تريد حذف حصة "${lesson.subject}"؟`
                        );

                    if (!confirmed) {
                        return;
                    }

                    await deleteLesson(
                        lesson.id
                    );

                    modal.remove();

                    await refreshView();
                }
            );
    }

    /* =====================================================
       حذف الحصة
       ===================================================== */

    async function deleteLesson(
        id
    ) {

        try {

            await remove(
                STORE_SCHEDULE,
                id
            );

            showToast(
                "تم حذف الحصة"
            );

        } catch (error) {

            console.error(
                error
            );

            showToast(
                "تعذر حذف الحصة",
                "error"
            );
        }
    }

    /* =====================================================
       تحديث القسم
       ===================================================== */

    async function refreshView() {

        const container =
            document.querySelector(
                "[data-page='schedule']"
            ) ||
            document.querySelector(
                "#schedulePage"
            ) ||
            document.querySelector(
                ".schedule-page"
            );

        if (container) {

            await render(
                container
            );

            return;
        }

        if (
            window.TeacherApp &&
            typeof window.TeacherApp.refresh ===
                "function"
        ) {

            try {

                await window.TeacherApp.refresh(
                    "schedule"
                );

            } catch (error) {

                console.warn(
                    "Schedule refresh failed:",
                    error
                );
            }
        }
    }

    /* =====================================================
       API عامة
       ===================================================== */

    async function addLesson() {

        const classes =
            await getAll(
                STORE_CLASSES
            );

        openScheduleModal({
            classes
        });
    }

    async function getTodayLessons() {

        const lessons =
            await getAll(
                STORE_SCHEDULE
            );

        const today =
            getTodayDayId();

        return lessons
            .filter(
                lesson =>
                    Number(
                        lesson.day
                    ) === today
            )
            .sort(
                (a,b) =>
                    timeToMinutes(
                        a.start
                    ) -
                    timeToMinutes(
                        b.start
                    )
            );
    }

    async function getCurrentLessonPublic() {

        const lessons =
            await getAll(
                STORE_SCHEDULE
            );

        return getCurrentLesson(
            lessons
        );
    }

    async function getLessonsForClass(
        classId,
        sectionId = ""
    ) {

        const lessons =
            await getAll(
                STORE_SCHEDULE
            );

        return lessons
            .filter(
                lesson =>
                    lesson.classId ===
                    classId
            )
            .filter(
                lesson =>
                    !sectionId ||
                    lesson.sectionId ===
                    sectionId
            )
            .sort(
                (a,b) =>
                    Number(a.day) -
                    Number(b.day) ||
                    timeToMinutes(
                        a.start
                    ) -
                    timeToMinutes(
                        b.start
                    )
            );
    }

    async function getLessonsForDay(
        dayId
    ) {

        const lessons =
            await getAll(
                STORE_SCHEDULE
            );

        return lessons
            .filter(
                lesson =>
                    Number(
                        lesson.day
                    ) ===
                    Number(dayId)
            )
            .sort(
                (a,b) =>
                    timeToMinutes(
                        a.start
                    ) -
                    timeToMinutes(
                        b.start
                    )
            );
    }

    /* =====================================================
       تصدير الجدول
       ===================================================== */

    async function exportScheduleJSON() {

        const lessons =
            await getAll(
                STORE_SCHEDULE
            );

        const classes =
            await getAll(
                STORE_CLASSES
            );

        const payload = {

            version:
                "1.0.0",

            exportedAt:
                nowISO(),

            lessons,

            classes

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
            "teacher-schedule-backup.json";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();

        URL.revokeObjectURL(
            url
        );

        showToast(
            "تم تصدير الجدول بنجاح"
        );
    }

    /* =====================================================
      