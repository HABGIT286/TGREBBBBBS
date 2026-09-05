/* =========================================================
   TEACHER PRO
   js/data.js
   Static Data / Constants / Default Configuration
   الإصدار: 1.0.0
   ========================================================= */

"use strict";


/* =========================================================
   APPLICATION INFORMATION
   ========================================================= */

const APP_INFO = {

    name:
        "TEACHER PRO",

    arabicName:
        "المعلم برو",

    version:
        "1.0.0",

    description:
        "نظام إدارة متكامل للمدرس",

    developer:
        "Teacher Pro",

    storage:
        "IndexedDB",

    direction:
        "rtl",

    language:
        "ar",

    defaultFont:
        "Audiowide",

    clockFont:
        "Orbitron"

};


/* =========================================================
   SITE DEFAULT CONFIGURATION
   ========================================================= */

const SITE_DEFAULTS = {

    name:
        "TEACHER PRO",

    subtitle:
        "نظام إدارة المدرس",

    logo:
        "AA.jpg",

    background:
        "A.jpg",

    galleryPath:
        "",

    galleryImages: [

        "1.jpg",
        "2.jpg",
        "3.jpg",
        "4.jpg",
        "5.jpg",
        "6.jpg",
        "7.jpg",
        "8.jpg",
        "9.jpg",
        "10.jpg"

    ],

    defaultTheme:
        "purple-pink",

    defaultLanguage:
        "ar",

    defaultTimeFormat:
        "12",

    enableAnimations:
        true,

    enableSounds:
        true,

    enableParticles:
        true,

    enableGlass:
        true,

    enableNotifications:
        true

};


/* =========================================================
   MAIN NAVIGATION
   ========================================================= */

const NAVIGATION_ITEMS = [

    {

        id:
            "home",

        title:
            "الرئيسية",

        icon:
            "⌂",

        emoji:
            "🏠",

        description:
            "لوحة التحكم الرئيسية ومعلومات اليوم",

        section:
            "main"

    },

    {

        id:
            "students",

        title:
            "الطلاب",

        icon:
            "👥",

        emoji:
            "👨‍🎓",

        description:
            "إدارة الطلاب وملفاتهم",

        section:
            "management"

    },

    {

        id:
            "classes",

        title:
            "الصفوف",

        icon:
            "▦",

        emoji:
            "🏫",

        description:
            "إدارة الصفوف والشعب والطلاب",

        section:
            "management"

    },

    {

        id:
            "attendance",

        title:
            "الحضور",

        icon:
            "✓",

        emoji:
            "🟢",

        description:
            "تسجيل ومتابعة الحضور والغياب",

        section:
            "academic"

    },

    {

        id:
            "grades",

        title:
            "الدرجات",

        icon:
            "★",

        emoji:
            "📊",

        description:
            "إدارة درجات الطلاب والحسابات",

        section:
            "academic"

    },

    {

        id:
            "assignments",

        title:
            "الواجبات",

        icon:
            "▤",

        emoji:
            "📝",

        description:
            "إدارة الواجبات والدرجات",

        section:
            "academic"

    },

    {

        id:
            "exams",

        title:
            "الامتحانات",

        icon:
            "✎",

        emoji:
            "📚",

        description:
            "إدارة الاختبارات ومواعيدها",

        section:
            "academic"

    },

    {

        id:
            "schedule",

        title:
            "الجدول",

        icon:
            "▦",

        emoji:
            "📅",

        description:
            "الجدول الدراسي والحصص",

        section:
            "academic"

    },

    {

        id:
            "notes",

        title:
            "ملاحظاتي",

        icon:
            "✦",

        emoji:
            "📌",

        description:
            "ملاحظات المدرس الخاصة والعامة",

        section:
            "tools"

    },

    {

        id:
            "reminders",

        title:
            "التنبيهات",

        icon:
            "◉",

        emoji:
            "🔔",

        description:
            "التذكيرات والتنبيهات المهمة",

        section:
            "tools"

    },

    {

        id:
            "data",

        title:
            "البيانات",

        icon:
            "▣",

        emoji:
            "🗂️",

        description:
            "البحث عن بيانات الطالب وتنزيل ملفه",

        section:
            "tools"

    },

    {

        id:
            "communication",

        title:
            "التواصل",

        icon:
            "☏",

        emoji:
            "🌐",

        description:
            "حسابات التواصل الخاصة بالمدرس",

        section:
            "communication"

    },

    {

        id:
            "messaging",

        title:
            "المراسلة",

        icon:
            "✉",

        emoji:
            "💬",

        description:
            "استقبال رسائل الطلاب وأولياء الأمور",

        section:
            "communication"

    },

    {

        id:
            "backup",

        title:
            "النسخ",

        icon:
            "↻",

        emoji:
            "💾",

        description:
            "النسخ الاحتياطي واستعادة البيانات",

        section:
            "system"

    },

    {

        id:
            "settings",

        title:
            "الإعدادات",

        icon:
            "⚙",

        emoji:
            "⚙️",

        description:
            "إعدادات الموقع والنظام",

        section:
            "system"

    },

    {

        id:
            "themes",

        title:
            "الثيمات",

        icon:
            "◈",

        emoji:
            "🎨",

        description:
            "اختيار مظهر الموقع",

        section:
            "system"

    }

];


/* =========================================================
   DASHBOARD CARDS
   ========================================================= */

const DASHBOARD_CARDS = [

    {

        id:
            "totalStudents",

        title:
            "عدد الطلاب",

        icon:
            "👥",

        color:
            "students",

        value:
            0,

        description:
            "إجمالي الطلاب المسجلين"

    },

    {

        id:
            "presentStudents",

        title:
            "الحضور",

        icon:
            "🟢",

        color:
            "present",

        value:
            0,

        description:
            "عدد الطلاب الحاضرين اليوم"

    },

    {

        id:
            "absentStudents",

        title:
            "الغياب",

        icon:
            "🔴",

        color:
            "absent",

        value:
            0,

        description:
            "عدد الطلاب الغائبين اليوم"

    },

    {

        id:
            "lateStudents",

        title:
            "التأخير",

        icon:
            "🟡",

        color:
            "late",

        value:
            0,

        description:
            "عدد الطلاب المتأخرين اليوم"

    },

    {

        id:
            "todayLesson",

        title:
            "درس اليوم",

        icon:
            "📖",

        color:
            "lesson",

        value:
            "—",

        description:
            "الدرس المرتبط بالجدول"

    },

    {

        id:
            "todayTopic",

        title:
            "موضوع الدرس",

        icon:
            "💡",

        color:
            "topic",

        value:
            "—",

        description:
            "موضوع الحصة الحالية"

    },

    {

        id:
            "className",

        title:
            "الصف",

        icon:
            "🏫",

        color:
            "class",

        value:
            "—",

        description:
            "الصف المحدد حالياً"

    },

    {

        id:
            "sectionName",

        title:
            "الشعبة",

        icon:
            "▦",

        color:
            "section",

        value:
            "—",

        description:
            "الشعبة المحددة حالياً"

    }

];


/* =========================================================
   ATTENDANCE STATUSES
   ========================================================= */

const ATTENDANCE_STATUSES = [

    {

        id:
            "present",

        title:
            "حاضر",

        shortTitle:
            "ح",

        icon:
            "🟢",

        color:
            "green",

        description:
            "الطالب حاضر"

    },

    {

        id:
            "absent",

        title:
            "غائب",

        shortTitle:
            "غ",

        icon:
            "🔴",

        color:
            "red",

        description:
            "الطالب غائب"

    },

    {

        id:
            "excused",

        title:
            "مجاز",

        shortTitle:
            "م",

        icon:
            "🔵",

        color:
            "blue",

        description:
            "غياب بعذر"

    },

    {

        id:
            "late",

        title:
            "متأخر",

        shortTitle:
            "ت",

        icon:
            "🟡",

        color:
            "yellow",

        description:
            "الطالب متأخر"

    }

];


/* =========================================================
   ATTENDANCE QUICK ACTIONS
   ========================================================= */

const ATTENDANCE_ACTIONS = [

    {

        id:
            "all-present",

        title:
            "تحديد الكل حضور",

        icon:
            "🟢",

        status:
            "present"

    },

    {

        id:
            "all-absent",

        title:
            "تحديد الكل غياب",

        icon:
            "🔴",

        status:
            "absent"

    },

    {

        id:
            "reset",

        title:
            "إلغاء التحديد",

        icon:
            "↺",

        status:
            null

    }

];


/* =========================================================
   GRADE TERMS
   ========================================================= */

const GRADE_TERMS = [

    {

        id:
            "daily",

        title:
            "اليومي",

        icon:
            "☀️",

        description:
            "درجة النشاط والمشاركة اليومية"

    },

    {

        id:
            "month1",

        title:
            "الشهر الأول",

        icon:
            "1️⃣",

        description:
            "درجة الشهر الأول"

    },

    {

        id:
            "month2",

        title:
            "الشهر الثاني",

        icon:
            "2️⃣",

        description:
            "درجة الشهر الثاني"

    },

    {

        id:
            "midyear",

        title:
            "النصف السنوي",

        icon:
            "📘",

        description:
            "درجة النصف السنوي"

    },

    {

        id:
            "oral",

        title:
            "الشفهي",

        icon:
            "🎤",

        description:
            "درجة الاختبار الشفهي"

    },

    {

        id:
            "exemption",

        title:
            "الإعفاء",

        icon:
            "🏅",

        description:
            "حالة الإعفاء"

    },

    {

        id:
            "finalMonth1",

        title:
            "الشهر الأول النهائي",

        icon:
            "📅",

        description:
            "درجة الشهر الأول النهائي"

    },

    {

        id:
            "finalMonth2",

        title:
            "الشهر الثاني النهائي",

        icon:
            "📅",

        description:
            "درجة الشهر الثاني النهائي"

    },

    {

        id:
            "finalYear",

        title:
            "آخر السنة",

        icon:
            "🏆",

        description:
            "الدرجة النهائية"

    },

    {

        id:
            "extra",

        title:
            "إضافة للمعدل",

        icon:
            "➕",

        description:
            "درجة إضافية للمعدل"

    }

];


/* =========================================================
   GRADE COLUMN TYPES
   ========================================================= */

const GRADE_COLUMN_TYPES = [

    {

        id:
            "daily",

        title:
            "يومي",

        icon:
            "☀️"

    },

    {

        id:
            "homework",

        title:
            "واجب",

        icon:
            "📝"

    },

    {

        id:
            "activity",

        title:
            "نشاط",

        icon:
            "⚡"

    },

    {

        id:
            "quiz",

        title:
            "اختبار قصير",

        icon:
            "✏️"

    },

    {

        id:
            "exam",

        title:
            "امتحان",

        icon:
            "📚"

    },

    {

        id:
            "oral",

        title:
            "شفهي",

        icon:
            "🎤"

    },

    {

        id:
            "extra",

        title:
            "إضافية",

        icon:
            "➕"

    },

    {

        id:
            "custom",

        title:
            "مخصصة",

        icon:
            "⚙️"

    }

];


/* =========================================================
   EXEMPTION TYPES
   ========================================================= */

const EXEMPTION_TYPES = [

    {

        id:
            "none",

        title:
            "غير معفى",

        icon:
            "○"

    },

    {

        id:
            "exempt",

        title:
            "معفى",

        icon:
            "✓"

    },

    {

        id:
            "partial",

        title:
            "إعفاء جزئي",

        icon:
            "◐"

    }

];


/* =========================================================
   EXAM TYPES
   ========================================================= */

const EXAM_TYPES = [

    {

        id:
            "quiz",

        title:
            "اختبار قصير",

        icon:
            "📝"

    },

    {

        id:
            "monthly",

        title:
            "اختبار شهري",

        icon:
            "📅"

    },

    {

        id:
            "midyear",

        title:
            "نصف سنوي",

        icon:
            "📘"

    },

    {

        id:
            "final",

        title:
            "نهائي",

        icon:
            "🏆"

    },

    {

        id:
            "oral",

        title:
            "شفهي",

        icon:
            "🎤"

    },

    {

        id:
            "practical",

        title:
            "عملي",

        icon:
            "🧪"

    },

    {

        id:
            "custom",

        title:
            "مخصص",

        icon:
            "⚙️"

    }

];


/* =========================================================
   ASSIGNMENT STATUSES
   ========================================================= */

const ASSIGNMENT_STATUSES = [

    {

        id:
            "active",

        title:
            "فعال",

        icon:
            "🟢"

    },

    {

        id:
            "completed",

        title:
            "مكتمل",

        icon:
            "🔵"

    },

    {

        id:
            "late",

        title:
            "متأخر",

        icon:
            "🟡"

    },

    {

        id:
            "cancelled",

        title:
            "ملغي",

        icon:
            "🔴"

    }

];


/* =========================================================
   DAYS OF WEEK
   ========================================================= */

const WEEK_DAYS = [

    {

        id:
            "saturday",

        title:
            "السبت",

        short:
            "سبت",

        number:
            6

    },

    {

        id:
            "sunday",

        title:
            "الأحد",

        short:
            "أحد",

        number:
            0

    },

    {

        id:
            "monday",

        title:
            "الإثنين",

        short:
            "إثن",

        number:
            1

    },

    {

        id:
            "tuesday",

        title:
            "الثلاثاء",

        short:
            "ثلا",

        number:
            2

    },

    {

        id:
            "wednesday",

        title:
            "الأربعاء",

        short:
            "أرب",

        number:
            3

    },

    {

        id:
            "thursday",

        title:
            "الخميس",

        short:
            "خمي",

        number:
            4

    },

    {

        id:
            "friday",

        title:
            "الجمعة",

        short:
            "جمع",

        number:
            5

    }

];


/* =========================================================
   PERIODS
   ========================================================= */

const SCHOOL_PERIODS = [

    {

        id:
            1,

        title:
            "الحصة الأولى",

        short:
            "1"

    },

    {

        id:
            2,

        title:
            "الحصة الثانية",

        short:
            "2"

    },

    {

        id:
            3,

        title:
            "الحصة الثالثة",

        short:
            "3"

    },

    {

        id:
            4,

        title:
            "الحصة الرابعة",

        short:
            "4"

    },

    {

        id:
            5,

        title:
            "الحصة الخامسة",

        short:
            "5"

    },

    {

        id:
            6,

        title:
            "الحصة السادسة",

        short:
            "6"

    },

    {

        id:
            7,

        title:
            "الحصة السابعة",

        short:
            "7"

    },

    {

        id:
            8,

        title:
            "الحصة الثامنة",

        short:
            "8"

    }

];


/* =========================================================
   NOTE SCOPES
   ========================================================= */

const NOTE_SCOPES = [

    {

        id:
            "general",

        title:
            "عام",

        icon:
            "🌐",

        description:
            "تظهر للجميع"

    },

    {

        id:
            "class",

        title:
            "صف كامل",

        icon:
            "🏫",

        description:
            "تخص صفاً كاملاً"

    },

    {

        id:
            "section",

        title:
            "شعبة",

        icon:
            "👥",

        description:
            "تخص شعبة محددة"

    },

    {

        id:
            "student",

        title:
            "طالب",

        icon:
            "👤",

        description:
            "تخص طالباً واحداً"

    }

];


/* =========================================================
   NOTE TYPES
   ========================================================= */

const NOTE_TYPES = [

    {

        id:
            "normal",

        title:
            "ملاحظة",

        icon:
            "📝"

    },

    {

        id:
            "important",

        title:
            "مهمة",

        icon:
            "⭐"

    },

    {

        id:
            "warning",

        title:
            "تحذير",

        icon:
            "⚠️"

    },

    {

        id:
            "success",

        title:
            "إنجاز",

        icon:
            "✅"

    },

    {

        id:
            "idea",

        title:
            "فكرة",

        icon:
            "💡"

    },

    {

        id:
            "reminder",

        title:
            "تذكير",

        icon:
            "🔔"

    }

];


/* =========================================================
   REMINDER TYPES
   ========================================================= */

const REMINDER_TYPES = [

    {

        id:
            "exam",

        title:
            "امتحان",

        icon:
            "📚"

    },

    {

        id:
            "quiz",

        title:
            "اختبار",

        icon:
            "📝"

    },

    {

        id:
            "lesson",

        title:
            "درس",

        icon:
            "📖"

    },

    {

        id:
            "homework",

        title:
            "واجب",

        icon:
            "✏️"

    },

    {

        id:
            "meeting",

        title:
            "اجتماع",

        icon:
            "👥"

    },

    {

        id:
            "general",

        title:
            "عام",

        icon:
            "🔔"

    }

];


/* =========================================================
   MESSAGE PARENT TYPES
   ========================================================= */

const PARENT_TYPES = [

    {

        id:
            "mother",

        title:
            "الأم",

        icon:
            "👩"

    },

    {

        id:
            "father",

        title:
            "الأب",

        icon:
            "👨"

    },

    {

        id:
            "guardian",

        title:
            "ولي أمر",

        icon:
            "👤"

    }

];


/* =========================================================
   MESSAGE REQUIREMENTS
   ========================================================= */

const MESSAGE_REQUIREMENTS = [

    {

        id:
            "studentName",

        title:
            "اسم الطالب",

        required:
            true

    },

    {

        id:
            "parentType",

        title:
            "صفة ولي الأمر",

        required:
            true

    },

    {

        id:
            "className",

        title:
            "الصف",

        required:
            true

    },

    {

        id:
            "sectionName",

        title:
            "الشعبة",

        required:
            true

    },

    {

        id:
            "message",

        title:
            "الرسالة",

        required:
            true

    }

];


/* =========================================================
   DATA EXPORT SECTIONS
   ========================================================= */

const DATA_EXPORT_SECTIONS = [

    {

        id:
            "personal",

        title:
            "البيانات الأساسية",

        icon:
            "👤",

        fields: [

            "fullName",
            "studentNumber",
            "parentPhone",
            "class",
            "section"

        ]

    },

    {

        id:
            "attendance",

        title:
            "الحضور والغياب",

        icon:
            "🟢",

        fields: [

            "attendance",
            "absence",
            "excused",
            "late",
            "attendanceNotes"

        ]

    },

    {

        id:
            "grades",

        title:
            "الدرجات",

        icon:
            "📊",

        fields: [

            "daily",
            "month1",
            "month2",
            "midyear",
            "oral",
            "exemption",
            "finalMonth1",
            "finalMonth2",
            "finalYear",
            "extra"

        ]

    },

    {

        id:
            "assignments",

        title:
            "الواجبات",

        icon:
            "📝",

        fields: [

            "assignments",
            "assignmentGrades",
            "assignmentNotes"

        ]

    },

    {

        id:
            "exams",

        title:
            "الامتحانات",

        icon:
            "📚",

        fields: [

            "exams",
            "examGrades",
            "examNotes"

        ]

    },

    {

        id:
            "notes",

        title:
            "الملاحظات",

        icon:
            "📌",

        fields: [

            "notes"

        ]

    }

];


/* =========================================================
   DATA SEARCH FILTERS
   ========================================================= */

const STUDENT_SEARCH_FIELDS = [

    {

        id:
            "fullName",

        title:
            "اسم الطالب",

        icon:
            "👤"

    },

    {

        id:
            "studentNumber",

        title:
            "رقم الطالب",

        icon:
            "🔢"

    },

    {

        id:
            "parentPhone",

        title:
            "رقم ولي الأمر",

        icon:
            "📱"

    },

    {

        id:
            "class",

        title:
            "الصف",

        icon:
            "🏫"

    },

    {

        id:
            "section",

        title:
            "الشعبة",

        icon:
            "👥"

    }

];


/* =========================================================
   CLASS STAGES
   ========================================================= */

const CLASS_STAGES = [

    {

        id:
            "primary",

        title:
            "المرحلة الابتدائية",

        icon:
            "🎒"

    },

    {

        id:
            "middle",

        title:
            "المرحلة المتوسطة",

        icon:
            "🏫"

    },

    {

        id:
            "secondary",

        title:
            "المرحلة الإعدادية",

        icon:
            "🎓"

    },

    {

        id:
            "other",

        title:
            "أخرى",

        icon:
            "📚"

    }

];


/* =========================================================
   CLASS SCOPES
   ========================================================= */

const PUBLISH_SCOPES = [

    {

        id:
            "global",

        title:
            "عام للجميع",

        icon:
            "🌐",

        description:
            "يصل إلى جميع الصفوف والشعب"

    },

    {

        id:
            "stage",

        title:
            "مرحلة كاملة",

        icon:
            "🏢",

        description:
            "يصل إلى جميع صفوف المرحلة"

    },

    {

        id:
            "class",

        title:
            "صف كامل",

        icon:
            "🏫",

        description:
            "يصل إلى جميع شعب الصف"

    },

    {

        id:
            "section",

        title:
            "شعبة محددة",

        icon:
            "👥",

        description:
            "يصل إلى شعبة واحدة"

    },

    {

        id:
            "student",

        title:
            "طالب محدد",

        icon:
            "👤",

        description:
            "يخص طالباً واحداً"

    }

];


/* =========================================================
   TEACHING TIPS
   ========================================================= */

const DEFAULT_TEACHING_TIPS = [

    {

        id:
            "tip-001",

        title:
            "حدد هدف الحصة",

        content:
            "ابدأ الحصة بتحديد الهدف الرئيسي الذي يجب أن يصل إليه الطلاب.",

        icon:
            "🎯",

        category:
            "lesson",

        pulse:
            true,

        active:
            true

    },

    {

        id:
            "tip-002",

        title:
            "وزع المشاركة",

        content:
            "امنح جميع الطلاب فرصة للمشاركة وعدم الاعتماد دائماً على نفس الطلاب.",

        icon:
            "👥",

        category:
            "students",

        pulse:
            true,

        active:
            true

    },

    {

        id:
            "tip-003",

        title:
            "استخدم أسئلة قصيرة",

        content:
            "الأسئلة القصيرة أثناء الشرح تساعدك على معرفة مستوى استيعاب الطلاب.",

        icon:
            "❓",

        category:
            "teaching",

        pulse:
            true,

        active:
            true

    },

    {

        id:
            "tip-004",

        title:
            "راجع نهاية الدرس",

        content:
            "خصص وقتاً قصيراً في نهاية الحصة لمراجعة أهم الأفكار.",

        icon:
            "🔄",

        category:
            "review",

        pulse:
            true,

        active:
            true

    },

    {

        id:
            "tip-005",

        title:
            "راقب الغياب",

        content:
            "راجع سجل الغياب باستمرار لمعرفة الطلاب الذين لديهم غياب متكرر.",

        icon:
            "🟢",

        category:
            "attendance",

        pulse:
            true,

        active:
            true

    },

    {

        id:
            "tip-006",

        title:
            "سجل الملاحظات فوراً",

        content:
            "تسجيل الملاحظة في وقتها يجعل متابعة الطالب أكثر دقة.",

        icon:
            "📌",

        category:
            "notes",

        pulse:
            true,

        active:
            true

    }

];


/* =========================================================
   TEN PREMIUM THEMES
   ========================================================= */

const DEFAULT_THEMES = [

    {

        id:
            "red-green",

        name:
            "أحمر × أخضر",

        description:
            "مزيج أحمر وأخضر فاخر",

        primary:
            "#ff1744",

        secondary:
            "#00e676",

        accent:
            "#ff5252",

        background:
            "#090909",

        surface:
            "rgba(255,255,255,0.07)",

        border:
            "rgba(255,255,255,0.14)",

        glow:
            "rgba(255,23,68,0.45)"

    },

    {

        id:
            "purple-pink",

        name:
            "بنفسجي × وردي",

        description:
            "مظهر بنفسجي وردي متوهج",

        primary:
            "#8b5cf6",

        secondary:
            "#ec4899",

        accent:
            "#c084fc",

        background:
            "#090711",

        surface:
            "rgba(255,255,255,0.07)",

        border:
            "rgba(255,255,255,0.15)",

        glow:
            "rgba(139,92,246,0.50)"

    },

    {

        id:
            "gray-red",

        name:
            "رمادي × أحمر",

        description:
            "مظهر داكن رمادي مع الأحمر",

        primary:
            "#ef4444",

        secondary:
            "#71717a",

        accent:
            "#f87171",

        background:
            "#090909",

        surface:
            "rgba(255,255,255,0.075)",

        border:
            "rgba(255,255,255,0.13)",

        glow:
            "rgba(239,68,68,0.45)"

    },

    {

        id:
            "red-blue",

        name:
            "أحمر × أزرق",

        description:
            "مظهر قوي بالأحمر والأزرق",

        primary:
            "#ef233c",

        secondary:
            "#2563eb",

        accent:
            "#38bdf8",

        background:
            "#070a10",

        surface:
            "rgba(255,255,255,0.065)",

        border:
            "rgba(255,255,255,0.14)",

        glow:
            "rgba(37,99,235,0.48)"

    },

    {

        id:
            "black-purple",

        name:
            "أسود × بنفسجي",

        description:
            "مظهر أسود فاخر مع بنفسجي",

        primary:
            "#7c3aed",

        secondary:
            "#a855f7",

        accent:
            "#d8b4fe",

        background:
            "#030305",

        surface:
            "rgba(255,255,255,0.055)",

        border:
            "rgba(168,85,247,0.18)",

        glow:
            "rgba(124,58,237,0.55)"

    },

    {

        id:
            "brown-white",

        name:
            "جوزي × أبيض",

        description:
            "مظهر هادئ جوزي وأبيض",

        primary:
            "#a16207",

        secondary:
            "#f5f5f4",

        accent:
            "#d6a85f",

        background:
            "#0c0a08",

        surface:
            "rgba(255,255,255,0.08)",

        border:
            "rgba(255,255,255,0.16)",

        glow:
            "rgba(161,98,7,0.42)"

    },

    {

        id:
            "cyan-green",

        name:
            "سماوي × أخضر",

        description:
            "مظهر مشرق سماوي وأخضر",

        primary:
            "#06b6d4",

        secondary:
            "#22c55e",

        accent:
            "#67e8f9",

        background:
            "#041011",

        surface:
            "rgba(255,255,255,0.065)",

        border:
            "rgba(103,232,249,0.16)",

        glow:
            "rgba(6,182,212,0.48)"

    },

    {

        id:
            "green-purple",

        name:
            "أخضر × بنفسجي",

        description:
            "مظهر أخضر بنفسجي متوهج",

        primary:
            "#22c55e",

        secondary:
            "#8b5cf6",

        accent:
            "#a78bfa",

        background:
            "#070b09",

        surface:
            "rgba(255,255,255,0.065)",

        border:
            "rgba(139,92,246,0.16)",

        glow:
            "rgba(34,197,94,0.44)"

    },

    {

        id:
            "blue-maroon",

        name:
            "أزرق × ماروني",

        description:
            "مظهر أزرق وماروني عميق",

        primary:
            "#2563eb",

        secondary:
            "#7f1d1d",

        accent:
            "#60a5fa",

        background:
            "#06080d",

        surface:
            "rgba(255,255,255,0.065)",

        border:
            "rgba(96,165,250,0.15)",

        glow:
            "rgba(37,99,235,0.48)"

    },

    {

        id:
            "orange-green",

        name:
            "برتقالي × أخضر",

        description:
            "مظهر برتقالي أخضر حيوي",

        primary:
            "#f97316",

        secondary:
            "#16a34a",

        accent:
            "#fb923c",

        background:
            "#0b0a06",

        surface:
            "rgba(255,255,255,0.065)",

        border:
            "rgba(251,146,60,0.16)",

        glow:
            "rgba(249,115,22,0.48)"

    }

];


/* =========================================================
   NOTIFICATION TYPES
   ========================================================= */

const NOTIFICATION_TYPES = [

    {

        id:
            "info",

        title:
            "معلومة",

        icon:
            "ℹ️"

    },

    {

        id:
            "success",

        title:
            "نجاح",

        icon:
            "✅"

    },

    {

        id:
            "warning",

        title:
            "تنبيه",

        icon:
            "⚠️"

    },

    {

        id:
            "error",

        title:
            "خطأ",

        icon:
            "❌"

    },

    {

        id:
            "exam",

        title:
            "امتحان",

        icon:
            "📚"

    },

    {

        id:
            "attendance",

        title:
            "حضور",

        icon:
            "🟢"

    }

];


/* =========================================================
   CONTACT TYPES
   ========================================================= */

const CONTACT_TYPES = [

    {

        id:
            "telegram",

        title:
            "Telegram",

        icon:
            "✈️",

        placeholder:
            "رابط حساب تيليجرام"

    },

    {

        id:
            "email",

        title:
            "البريد الإلكتروني",

        icon:
            "✉️",

        placeholder:
            "البريد الإلكتروني"

    },

    {

        id:
            "facebook",

        title:
            "Facebook",

        icon:
            "f",

        placeholder:
            "رابط حساب فيسبوك"

    },

    {

        id:
            "website",

        title:
            "موقع إلكتروني",

        icon:
            "🌐",

        placeholder:
            "رابط الموقع"

    },

    {

        id:
            "custom",

        title:
            "رابط مخصص",

        icon:
            "🔗",

        placeholder:
            "الرابط"

    }

];


/* =========================================================
   SYSTEM SETTINGS
   ========================================================= */

const SYSTEM_SETTINGS = [

    {

        key:
            "siteName",

        title:
            "اسم الموقع",

        category:
            "site",

        type:
            "text",

        default:
            "TEACHER PRO"

    },

    {

        key:
            "siteLogo",

        title:
            "صورة الموقع",

        category:
            "site",

        type:
            "image",

        default:
            "AA.jpg"

    },

    {

        key:
            "siteBackground",

        title:
            "خلفية الموقع",

        category:
            "site",

        type:
            "image",

        default:
            "A.jpg"

    },

    {

        key:
            "activeTheme",

        title:
            "الثيم الحالي",

        category:
            "theme",

        type:
            "theme",

        default:
            "purple-pink"

    },

    {

        key:
            "enableAnimations",

        title:
            "التأثيرات",

        category:
            "interface",

        type:
            "boolean",

        default:
            true

    },

    {

        key:
            "enableSounds",

        title:
            "أصوات النقر",

        category:
            "interface",

        type:
            "boolean",

        default:
            true

    },

    {

        key:
            "enableParticles",

        title:
            "الجسيمات المتحركة",

        category:
            "interface",

        type:
            "boolean",

        default:
            true

    },

    {

        key:
            "glassEffect",

        title:
            "التأثير الزجاجي",

        category:
            "interface",

        type:
            "boolean",

        default:
            true

    },

    {

        key:
            "clockFormat",

        title:
            "نظام الساعة",

        category:
            "clock",

        type:
            "select",

        default:
            "12"

    },

    {

        key:
            "showSeconds",

        title:
            "إظهار الثواني",

        category:
            "clock",

        type:
            "boolean",

        default:
            true

    },

    {

        key:
            "autoRefresh",

        title:
            "التحديث التلقائي",

        category:
            "system",

        type:
            "boolean",

        default:
            true

    }

];


/* =========================================================
   CLOCK CONFIGURATION
   ========================================================= */

const CLOCK_CONFIG = {

    formats: [

        {

            id:
                "12",

            title:
                "12 ساعة",

            example:
                "05:30:25 PM"

        },

        {

            id:
                "24",

            title:
                "24 ساعة",

            example:
                "17:30:25"

        }

    ],

    monthsArabic: [

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

    ],

    monthsShortArabic: [

        "ينا",
        "فبر",
        "مار",
        "أبر",
        "ماي",
        "يون",
        "يول",
        "أغس",
        "سبت",
        "أكت",
        "نوف",
        "ديس"

    ]

};


/* =========================================================
   UI EFFECT CONFIGURATION
   ========================================================= */

const UI_EFFECTS = {

    pageTransition:
        true,

    cardHover:
        true,

    buttonGlow:
        true,

    clickRipple:
        true,

    iconPulse:
        true,

    notificationPulse:
        true,

    loadingAnimation:
        true,

    backgroundAnimation:
        true,

    glassReflection:
        true,

    hoverSound:
        true

};


/* =========================================================
   LOADING SCREEN CONFIGURATION
   ========================================================= */

const LOADING_CONFIG = {

    minimumDuration:
        1000,

    maximumDuration:
        5000,

    logo:
        "AA.jpg",

    title:
        "TEACHER PRO",

    subtitle:
        "جاري تجهيز لوحة المدرس...",

    messages: [

        "جاري تحميل البيانات...",
        "جاري تجهيز لوحة التحكم...",
        "جاري تشغيل النظام...",
        "جاري تحميل الصفوف...",
        "جاري تجهيز السجلات...",
        "جاري تجهيز واجهة المدرس..."

    ]

};


/* =========================================================
   FILE CONFIGURATION
   ========================================================= */

const SITE_FILES = {

    logo:
        "AA.jpg",

    background:
        "A.jpg",

    gallery: [

        "1.jpg",
        "2.jpg",
        "3.jpg",
        "4.jpg",
        "5.jpg",
        "6.jpg",
        "7.jpg",
        "8.jpg",
        "9.jpg",
        "10.jpg"

    ]

};


/* =========================================================
   DATABASE STORE DESCRIPTIONS
   ========================================================= */

const DATABASE_STORE_INFO = [

    {

        store:
            "settings",

        title:
            "الإعدادات",

        icon:
            "⚙️"

    },

    {

        store:
            "students",

        title:
            "الطلاب",

        icon:
            "👥"

    },

    {

        store:
            "classes",

        title:
            "الصفوف",

        icon:
            "🏫"

    },

    {

        store:
            "sections",

        title:
            "الشعب",

        icon:
            "▦"

    },

    {

        store:
            "attendance",

        title:
            "الحضور",

        icon:
            "🟢"

    },

    {

        store:
            "grades",

        title:
            "الدرجات",

        icon:
            "📊"

    },

    {

        store:
            "gradeColumns",

        title:
            "أعمدة الدرجات",

        icon:
            "▥"

    },

    {

        store:
            "gradeFormulas",

        title:
            "معادلات الدرجات",

        icon:
            "∑"

    },

    {

        store:
            "assignments",

        title:
            "الواجبات",

        icon:
            "📝"

    },

    {

        store:
            "exams",

        title:
            "الامتحانات",

        icon:
            "📚"

    },

    {

        store:
            "schedule",

        title:
            "الجدول",

        icon:
            "📅"

    },

    {

        store:
            "notes",

        title:
            "الملاحظات",

        icon:
            "📌"

    },

    {

        store:
            "reminders",

        title:
            "التنبيهات",

        icon:
            "🔔"

    },

    {

        store:
            "tips",

        title:
            "النصائح",

        icon:
            "💡"

    },

    {

        store:
            "messages",

        title:
            "الرسائل",

        icon:
            "💬"

    },

    {

        store:
            "contacts",

        title:
            "التواصل",

        icon:
            "🌐"

    },

    {

        store:
            "themes",

        title:
            "الثيمات",

        icon:
            "🎨"

    },

    {

        store:
            "backups",

        title:
            "النسخ الاحتياطية",

        icon:
            "💾"

    },

    {

        store:
            "logs",

        title:
            "السجل",

        icon:
            "📜"

    },

    {

        store:
            "notifications",

        title:
            "الإشعارات",

        icon:
            "🔔"

    }

];


/* =========================================================
   DEFAULT STUDENT STRUCTURE
   ========================================================= */

const DEFAULT_STUDENT = {

    id:
        null,

    fullName:
        "",

    studentNumber:
        "",

    classId:
        null,

    sectionId:
        null,

    dailyGrade:
        0,

    monthOne:
        0,

    monthTwo:
        0,

    semesterGrade:
        0,

    oralGrade:
        0,

    exemption:
        "none",

    finalMonthOne:
        0,

    finalMonthTwo:
        0,

    finalGrade:
        0,

    extraGrade:
        0,

    parentPhone:
        "",

    notes:
        "",

    active:
        true,

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT CLASS STRUCTURE
   ========================================================= */

const DEFAULT_CLASS = {

    id:
        null,

    name:
        "",

    stage:
        "",

    academicYear:
        "",

    subject:
        "",

    teacher:
        "",

    notes:
        "",

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT SECTION STRUCTURE
   ========================================================= */

const DEFAULT_SECTION = {

    id:
        null,

    classId:
        null,

    name:
        "",

    capacity:
        0,

    notes:
        "",

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT ATTENDANCE RECORD
   ========================================================= */

const DEFAULT_ATTENDANCE = {

    id:
        null,

    studentId:
        null,

    classId:
        null,

    sectionId:
        null,

    date:
        "",

    status:
        "present",

    note:
        "",

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT GRADE RECORD
   ========================================================= */

const DEFAULT_GRADE = {

    id:
        null,

    studentId:
        null,

    classId:
        null,

    sectionId:
        null,

    columnId:
        null,

    code:
        "",

    value:
        0,

    max:
        100,

    term:
        "general",

    note:
        "",

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT NOTE
   ========================================================= */

const DEFAULT_NOTE = {

    id:
        null,

    title:
        "",

    content:
        "",

    scope:
        "general",

    classId:
        null,

    sectionId:
        null,

    studentId:
        null,

    pinned:
        false,

    color:
        "primary",

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT REMINDER
   ========================================================= */

const DEFAULT_REMINDER = {

    id:
        null,

    title:
        "",

    content:
        "",

    date:
        "",

    time:
        "",

    classId:
        null,

    sectionId:
        null,

    scope:
        "general",

    active:
        true,

    pinned:
        false,

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT SCHEDULE ITEM
   ========================================================= */

const DEFAULT_SCHEDULE_ITEM = {

    id:
        null,

    classId:
        null,

    sectionId:
        null,

    day:
        "",

    period:
        "",

    subject:
        "",

    lesson:
        "",

    topic:
        "",

    startTime:
        "",

    endTime:
        "",

    room:
        "",

    notes:
        "",

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   DEFAULT CONTACT
   ========================================================= */

const DEFAULT_CONTACT = {

    id:
        null,

    type:
        "",

    name:
        "",

    value:
        "",

    icon:
        "",

    enabled:
        true,

    createdAt:
        null,

    updatedAt:
        null

};


/* =========================================================
   HELPER: FIND NAV ITEM
   ========================================================= */

function getNavigationItem(id) {

    return (
        NAVIGATION_ITEMS.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND THEME
   ========================================================= */

function getThemeById(id) {

    return (
        DEFAULT_THEMES.find(
            theme =>
                theme.id === id
        ) ||
        DEFAULT_THEMES.find(
            theme =>
                theme.id ===
                SITE_DEFAULTS.defaultTheme
        ) ||
        DEFAULT_THEMES[0]
    );

}


/* =========================================================
   HELPER: FIND ATTENDANCE STATUS
   ========================================================= */

function getAttendanceStatus(id) {

    return (
        ATTENDANCE_STATUSES.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND GRADE TERM
   ========================================================= */

function getGradeTerm(id) {

    return (
        GRADE_TERMS.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND DAY
   ========================================================= */

function getWeekDay(id) {

    return (
        WEEK_DAYS.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND EXAM TYPE
   ========================================================= */

function getExamType(id) {

    return (
        EXAM_TYPES.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND NOTE SCOPE
   ========================================================= */

function getNoteScope(id) {

    return (
        NOTE_SCOPES.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND REMINDER TYPE
   ========================================================= */

function getReminderType(id) {

    return (
        REMINDER_TYPES.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: FIND CONTACT TYPE
   ========================================================= */

function getContactType(id) {

    return (
        CONTACT_TYPES.find(
            item =>
                item.id === id
        ) || null
    );

}


/* =========================================================
   HELPER: GET CURRENT DAY
   ========================================================= */

function getCurrentWeekDay() {

    const day =
        new Date().getDay();


    return (
        WEEK_DAYS.find(
            item =>
                item.number === day
        ) || null
    );

}


/* =========================================================
   HELPER: GET ACTIVE THEME
   ========================================================= */

function getDefaultTheme() {

    return getThemeById(
        SITE_DEFAULTS.defaultTheme
    );

}


/* =========================================================
   GLOBAL DATA OBJECT
   ========================================================= */

window.TeacherProData = {

    APP_INFO,

    SITE_DEFAULTS,

    NAVIGATION_ITEMS,

    DASHBOARD_CARDS,

    ATTENDANCE_STATUSES,

    ATTENDANCE_ACTIONS,

    GRADE_TERMS,

    GRADE_COLUMN_TYPES,

    EXEMPTION_TYPES,

    EXAM_TYPES,

    ASSIGNMENT_STATUSES,

    WEEK_DAYS,

    SCHOOL_PERIODS,

    NOTE_SCOPES,

    NOTE_TYPES,

    REMINDER_TYPES,

    PARENT_TYPES,

    MESSAGE_REQUIREMENTS,

    DATA_EXPORT_SECTIONS,

    STUDENT_SEARCH_FIELDS,

    CLASS_STAGES,

    PUBLISH_SCOPES,

    DEFAULT_TEACHING_TIPS,

    DEFAULT_THEMES,

    NOTIFICATION_TYPES,

    CONTACT_TYPES,

    SYSTEM_SETTINGS,

    CLOCK_CONFIG,

    UI_EFFECTS,

    LOADING_CONFIG,

    SITE_FILES,

    DATABASE_STORE_INFO,

    DEFAULT_STUDENT,

    DEFAULT_CLASS,

    DEFAULT_SECTION,

    DEFAULT_ATTENDANCE,

    DEFAULT_GRADE,

    DEFAULT_NOTE,

    DEFAULT_REMINDER,

    DEFAULT_SCHEDULE_ITEM,

    DEFAULT_CONTACT,

    getNavigationItem,

    getThemeById,

    getAttendanceStatus,

    getGradeTerm,

    getWeekDay,

    getExamType,

    getNoteScope,

    getReminderType,

    getContactType,

    getCurrentWeekDay,

    getDefaultTheme

};


/* =========================================================
   GLOBAL SHORTCUTS
   ========================================================= */

window.APP_INFO =
    APP_INFO;

window.SITE_DEFAULTS =
    SITE_DEFAULTS;

window.NAVIGATION_ITEMS =
    NAVIGATION_ITEMS;

window.DEFAULT_THEMES =
    DEFAULT_THEMES;

window.DEFAULT_TEACHING_TIPS =
    DEFAULT_TEACHING_TIPS;

window.ATTENDANCE_STATUSES =
    ATTENDANCE_STATUSES;

window.GRADE_TERMS =
    GRADE_TERMS;

window.EXAM_TYPES =
    EXAM_TYPES;

window.WEEK_DAYS =
    WEEK_DAYS;


/* =========================================================
   END OF DATA.JS
   ========================================================= */