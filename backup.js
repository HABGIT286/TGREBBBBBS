/* =========================================================
   TEACHER PRO
   backup.js

   مسؤول عن:
   - إنشاء نسخة احتياطية كاملة لجميع بيانات الموقع
   - تصدير النسخة بصيغة JSON
   - استيراد نسخة احتياطية
   - استعادة البيانات إلى IndexedDB
   - حذف البيانات القديمة قبل الاستعادة عند الاختيار
   - نسخة احتياطية انتقائية لأقسام محددة
   - معلومات النسخة وتاريخ إنشائها
   - التحقق من صحة ملف النسخة
   - تنزيل ملف النسخة تلقائياً
   - تحديث الأقسام بعد الاستعادة بدون إعادة تحميل الصفحة
   ========================================================= */

"use strict";


/* =========================================================
   الوحدة الرئيسية
   ========================================================= */

const BackupModule = {

    initialized: false,

    appName: "Teacher Pro",

    appVersion: "1.0.0",

    backupVersion: "1.0",

    databaseName: "TeacherProDB",

    lastBackupKey: "teacher_pro_last_backup",

    autoBackupKey: "teacher_pro_auto_backup",

    stores: [

        "students",

        "classes",

        "sections",

        "attendance",

        "grades",

        "assignments",

        "exams",

        "schedule",

        "notes",

        "notifications",

        "settings",

        "themes",

        "contacts",

        "messages",

        "studentRecords",

        "studentNotes",

        "teachingTips",

        "gallery",

        "backups"

    ],


    selectors: {

        createButton:
            "#createBackupBtn",

        fullBackupButton:
            "#fullBackupBtn",

        exportButton:
            "#exportBackupBtn",

        importInput:
            "#importBackupInput",

        restoreButton:
            "#restoreBackupBtn",

        validateButton:
            "#validateBackupBtn",

        clearBeforeRestore:
            "#clearBeforeRestore",

        backupInfo:
            "#backupInfo",

        lastBackupDate:
            "#lastBackupDate",

        backupStatus:
            "#backupStatus",

        backupFileName:
            "#backupFileName",

        selectedFileName:
            "#selectedBackupFileName",

        selectedFileInfo:
            "#selectedBackupInfo",

        progress:
            "#backupProgress",

        progressBar:
            "#backupProgressBar",

        storesList:
            "#backupStoresList",

        backupCount:
            "#backupCount",

        autoBackupInput:
            "#autoBackupEnabled",

        autoBackupInterval:
            "#autoBackupInterval"

    },


    selectedBackup: null,

    lastBackup: null,

    autoBackupTimer: null

};


/* =========================================================
   تشغيل القسم
   ========================================================= */

BackupModule.init =
async function () {

    try {

        if (this.initialized) {

            await this.refresh();

            return;

        }


        this.initialized =
            true;


        this.bindEvents();


        this.loadLastBackupInfo();


        this.renderStoresList();


        this.setupAutoBackup();


    } catch (error) {

        console.error(
            "BackupModule initialization error:",
            error
        );

    }

};


/* =========================================================
   ربط الأحداث
   ========================================================= */

BackupModule.bindEvents =
function () {

    const createButton =
        document.querySelector(
            this.selectors.createButton
        );


    if (createButton) {

        createButton.addEventListener(
            "click",
            async () => {

                await this.createAndDownloadBackup();

            }
        );

    }


    const fullBackupButton =
        document.querySelector(
            this.selectors.fullBackupButton
        );


    if (fullBackupButton) {

        fullBackupButton.addEventListener(
            "click",
            async () => {

                await this.createAndDownloadBackup();

            }
        );

    }


    const exportButton =
        document.querySelector(
            this.selectors.exportButton
        );


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            () => {

                if (
                    this.lastBackup
                ) {

                    this.downloadBackup(
                        this.lastBackup
                    );

                } else {

                    this.showMessage(
                        "قم بإنشاء نسخة احتياطية أولاً",
                        "warning"
                    );

                }

            }
        );

    }


    const importInput =
        document.querySelector(
            this.selectors.importInput
        );


    if (importInput) {

        importInput.addEventListener(
            "change",
            async event => {

                await this.loadBackupFile(
                    event
                );

            }
        );

    }


    const restoreButton =
        document.querySelector(
            this.selectors.restoreButton
        );


    if (restoreButton) {

        restoreButton.addEventListener(
            "click",
            async () => {

                await this.restoreSelectedBackup();

            }
        );

    }


    const validateButton =
        document.querySelector(
            this.selectors.validateButton
        );


    if (validateButton) {

        validateButton.addEventListener(
            "click",
            () => {

                this.validateSelectedBackup();

            }
        );

    }


    const autoBackupInput =
        document.querySelector(
            this.selectors.autoBackupInput
        );


    if (autoBackupInput) {

        autoBackupInput.addEventListener(
            "change",
            () => {

                this.setupAutoBackup();

            }
        );

    }


    const autoBackupInterval =
        document.querySelector(
            this.selectors.autoBackupInterval
        );


    if (autoBackupInterval) {

        autoBackupInterval.addEventListener(
            "change",
            () => {

                this.setupAutoBackup();

            }
        );

    }

};


/* =========================================================
   إنشاء نسخة احتياطية كاملة
   ========================================================= */

BackupModule.createBackup =
async function (
    selectedStores = null
) {

    try {

        this.setStatus(
            "جاري إنشاء النسخة الاحتياطية..."
        );


        this.setProgress(
            0
        );


        const storesToBackup =
            Array.isArray(
                selectedStores
            )
                ? selectedStores
                : this.stores;


        const backup = {

            meta: {

                type:
                    "Teacher Pro Full Backup",

                appName:
                    this.appName,

                appVersion:
                    this.appVersion,

                backupVersion:
                    this.backupVersion,

                createdAt:
                    new Date().toISOString(),

                createdAtArabic:
                    this.formatDate(
                        new Date()
                    ),

                timestamp:
                    Date.now(),

                totalStores:
                    storesToBackup.length

            },

            data: {}

        };


        let completed =
            0;


        for (
            const storeName of
            storesToBackup
        ) {

            try {

                backup.data[
                    storeName
                ] =
                    await this.getAllFromStore(
                        storeName
                    );


            } catch (error) {

                console.warn(
                    `Cannot backup store: ${storeName}`,
                    error
                );


                backup.data[
                    storeName
                ] =
                    [];

            }


            completed++;


            const progress =
                Math.round(
                    (
                        completed /
                        storesToBackup.length
                    ) * 100
                );


            this.setProgress(
                progress
            );

        }


        backup.meta.statistics =
            this.getBackupStatistics(
                backup.data
            );


        backup.meta.fileName =
            this.generateBackupFileName();


        backup.meta.size =
            this.getObjectSize(
                backup
            );


        this.lastBackup =
            backup;


        this.saveLastBackupInfo(
            backup
        );


        this.setProgress(
            100
        );


        this.setStatus(
            "تم إنشاء النسخة الاحتياطية بنجاح"
        );


        return backup;


    } catch (error) {

        console.error(
            "Backup creation error:",
            error
        );


        this.setStatus(
            "فشل إنشاء النسخة الاحتياطية"
        );


        this.showMessage(
            "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
            "error"
        );


        return null;

    }

};


/* =========================================================
   إنشاء وتنزيل النسخة
   ========================================================= */

BackupModule.createAndDownloadBackup =
async function () {

    const backup =
        await this.createBackup();


    if (!backup) {

        return null;

    }


    this.downloadBackup(
        backup
    );


    this.showMessage(
        "تم إنشاء وتنزيل النسخة الاحتياطية بنجاح",
        "success"
    );


    return backup;

};


/* =========================================================
   تنزيل النسخة الاحتياطية
   ========================================================= */

BackupModule.downloadBackup =
function (backup) {

    try {

        if (!backup) {

            return;

        }


        const json =
            JSON.stringify(
                backup,
                null,
                2
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


        link.href =
            url;


        link.download =
            backup.meta?.fileName ||
            this.generateBackupFileName();


        document.body.appendChild(
            link
        );


        link.click();


        setTimeout(
            () => {

                link.remove();


                URL.revokeObjectURL(
                    url
                );

            },
            500
        );


    } catch (error) {

        console.error(
            "Backup download error:",
            error
        );


        this.showMessage(
            "تعذر تنزيل النسخة الاحتياطية",
            "error"
        );

    }

};


/* =========================================================
   تحميل ملف النسخة
   ========================================================= */

BackupModule.loadBackupFile =
async function (event) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return null;

    }


    try {

        this.setStatus(
            "جاري قراءة ملف النسخة..."
        );


        const text =
            await file.text();


        const backup =
            JSON.parse(
                text
            );


        const validation =
            this.validateBackup(
                backup
            );


        if (
            !validation.valid
        ) {

            this.selectedBackup =
                null;


            this.showMessage(
                validation.message,
                "error"
            );


            this.setStatus(
                "ملف النسخة غير صالح"
            );


            return null;

        }


        this.selectedBackup =
            backup;


        this.renderSelectedBackupInfo(
            backup,
            file
        );


        this.setStatus(
            "تم تحميل النسخة الاحتياطية بنجاح"
        );


        this.showMessage(
            "تم تحميل النسخة الاحتياطية",
            "success"
        );


        return backup;


    } catch (error) {

        console.error(
            "Backup file loading error:",
            error
        );


        this.selectedBackup =
            null;


        this.setStatus(
            "تعذر قراءة ملف النسخة"
        );


        this.showMessage(
            "ملف النسخة غير صالح",
            "error"
        );


        return null;


    } finally {

        event.target.value =
            "";

    }

};


/* =========================================================
   التحقق من النسخة المختارة
   ========================================================= */

BackupModule.validateSelectedBackup =
function () {

    if (
        !this.selectedBackup
    ) {

        this.showMessage(
            "لم يتم اختيار ملف نسخة احتياطية",
            "warning"
        );


        return false;

    }


    const result =
        this.validateBackup(
            this.selectedBackup
        );


    if (
        result.valid
    ) {

        this.showMessage(
            "ملف النسخة صالح ويمكن استعادته",
            "success"
        );

    } else {

        this.showMessage(
            result.message,
            "error"
        );

    }


    return result.valid;

};


/* =========================================================
   التحقق من صحة النسخة
   ========================================================= */

BackupModule.validateBackup =
function (backup) {

    if (
        !backup ||
        typeof backup !== "object"
    ) {

        return {

            valid: false,

            message:
                "ملف النسخة غير صالح"

        };

    }


    if (
        !backup.meta
    ) {

        return {

            valid: false,

            message:
                "ملف النسخة لا يحتوي على معلومات"

        };

    }


    if (
        !backup.data ||
        typeof backup.data !== "object"
    ) {

        return {

            valid: false,

            message:
                "ملف النسخة لا يحتوي على بيانات"

        };

    }


    if (
        backup.meta.type &&
        !String(
            backup.meta.type
        ).includes(
            "Teacher Pro"
        )
    ) {

        return {

            valid: false,

            message:
                "هذه النسخة ليست خاصة بالموقع"

        };

    }


    return {

        valid: true,

        message:
            "النسخة صالحة"

    };

};


/* =========================================================
   استعادة النسخة المختارة
   ========================================================= */

BackupModule.restoreSelectedBackup =
async function () {

    if (
        !this.selectedBackup
    ) {

        this.showMessage(
            "اختر ملف نسخة احتياطية أولاً",
            "warning"
        );


        return false;

    }


    const valid =
        this.validateBackup(
            this.selectedBackup
        );


    if (
        !valid.valid
    ) {

        this.showMessage(
            valid.message,
            "error"
        );


        return false;

    }


    const clearInput =
        document.querySelector(
            this.selectors.clearBeforeRestore
        );


    const clearExisting =
        clearInput
            ? clearInput.checked
            : true;


    const confirmed =
        await this.confirmRestore(
            clearExisting
        );


    if (!confirmed) {

        return false;

    }


    return await this.restoreBackup(

        this.selectedBackup,

        {

            clearExisting

        }

    );

};


/* =========================================================
   استعادة النسخة
   ========================================================= */

BackupModule.restoreBackup =
async function (
    backup,
    options = {}
) {

    const {

        clearExisting = true,

        selectedStores = null

    } = options;


    try {

        this.setStatus(
            "جاري استعادة النسخة الاحتياطية..."
        );


        this.setProgress(
            0
        );


        const validation =
            this.validateBackup(
                backup
            );


        if (
            !validation.valid
        ) {

            throw new Error(
                validation.message
            );

        }


        let storeNames =
            Object.keys(
                backup.data
            );


        if (
            Array.isArray(
                selectedStores
            )
        ) {

            storeNames =
                storeNames.filter(
                    name =>
                        selectedStores.includes(
                            name
                        )
                );

        }


        let completed =
            0;


        for (
            const storeName of
            storeNames
        ) {

            const records =
                Array.isArray(
                    backup.data[
                        storeName
                    ]
                )
                    ? backup.data[
                        storeName
                    ]
                    : [];


            if (
                clearExisting
            ) {

                await this.clearStore(
                    storeName
                );

            }


            for (
                const record of
                records
            ) {

                await this.putToStore(
                    storeName,
                    record
                );

            }


            completed++;


            const progress =
                Math.round(

                    (
                        completed /
                        storeNames.length
                    ) * 100

                );


            this.setProgress(
                progress
            );

        }


        this.setProgress(
            100
        );


        this.setStatus(
            "تمت استعادة النسخة الاحتياطية بنجاح"
        );


        await this.refreshApplication();


        this.showMessage(
            "تمت استعادة جميع البيانات بنجاح",
            "success"
        );


        return true;


    } catch (error) {

        console.error(
            "Backup restore error:",
            error
        );


        this.setStatus(
            "فشلت عملية استعادة النسخة"
        );


        this.showMessage(
            "حدث خطأ أثناء استعادة البيانات",
            "error"
        );


        return false;

    }

};


/* =========================================================
   استعادة قسم واحد
   ========================================================= */

BackupModule.restoreStore =
async function (
    storeName,
    backup,
    clearExisting = true
) {

    if (
        !backup ||
        !backup.data ||
        !Array.isArray(
            backup.data[
                storeName
            ]
        )
    ) {

        return false;

    }


    return await this.restoreBackup(

        backup,

        {

            clearExisting,

            selectedStores:
                [storeName]

        }

    );

};


/* =========================================================
   إنشاء نسخة لقسم واحد
   ========================================================= */

BackupModule.createStoreBackup =
async function (
    storeName
) {

    return await this.createBackup(
        [storeName]
    );

};


/* =========================================================
   الحصول على بيانات Store
   ========================================================= */

BackupModule.getAllFromStore =
async function (
    storeName
) {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.getAll ===
            "function"
        ) {

            return await TeacherDB.getAll(
                storeName
            );

        }


        if (
            window.DB &&
            typeof DB.getAll ===
            "function"
        ) {

            return await DB.getAll(
                storeName
            );

        }


        return await this.getAllFromIndexedDB(
            storeName
        );


    } catch (error) {

        console.warn(
            `Cannot read store ${storeName}:`,
            error
        );


        return [];

    }

};


/* =========================================================
   حفظ Record
   ========================================================= */

BackupModule.putToStore =
async function (
    storeName,
    record
) {

    if (
        window.TeacherDB &&
        typeof TeacherDB.put ===
        "function"
    ) {

        return await TeacherDB.put(
            storeName,
            record
        );

    }


    if (
        window.DB &&
        typeof DB.put ===
        "function"
    ) {

        return await DB.put(
            storeName,
            record
        );

    }


    return await this.putToIndexedDB(
        storeName,
        record
    );

};


/* =========================================================
   مسح Store
   ========================================================= */

BackupModule.clearStore =
async function (
    storeName
) {

    try {

        if (
            window.TeacherDB &&
            typeof TeacherDB.clear ===
            "function"
        ) {

            return await TeacherDB.clear(
                storeName
            );

        }


        if (
            window.DB &&
            typeof DB.clear ===
            "function"
        ) {

            return await DB.clear(
                storeName
            );

        }


        return await this.clearIndexedDBStore(
            storeName
        );


    } catch (error) {

        console.warn(
            `Cannot clear store ${storeName}:`,
            error
        );

    }

};


/* =========================================================
   IndexedDB مباشر
   ========================================================= */

BackupModule.openDatabase =
function () {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                indexedDB.open(
                    this.databaseName
                );


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

};


/* =========================================================
   قراءة Store مباشرة
   ========================================================= */

BackupModule.getAllFromIndexedDB =
async function (
    storeName
) {

    const database =
        await this.openDatabase();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                !database.objectStoreNames.contains(
                    storeName
                )
            ) {

                database.close();


                resolve([]);

                return;

            }


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

                    database.close();


                    resolve(
                        request.result ||
                        []
                    );

                };


            request.onerror =
                () => {

                    database.close();


                    reject(
                        request.error
                    );

                };

        }
    );

};


/* =========================================================
   حفظ مباشر IndexedDB
   ========================================================= */

BackupModule.putToIndexedDB =
async function (
    storeName,
    record
) {

    const database =
        await this.openDatabase();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                !database.objectStoreNames.contains(
                    storeName
                )
            ) {

                database.close();


                resolve(
                    false
                );

                return;

            }


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
                store.put(
                    record
                );


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


            transaction.oncomplete =
                () => {

                    database.close();

                };

        }
    );

};


/* =========================================================
   مسح IndexedDB مباشر
   ========================================================= */

BackupModule.clearIndexedDBStore =
async function (
    storeName
) {

    const database =
        await this.openDatabase();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            if (
                !database.objectStoreNames.contains(
                    storeName
                )
            ) {

                database.close();


                resolve(
                    false
                );

                return;

            }


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
                store.clear();


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


            transaction.oncomplete =
                () => {

                    database.close();

                };

        }
    );

};


/* =========================================================
   إحصائيات النسخة
   ========================================================= */

BackupModule.getBackupStatistics =
function (data) {

    const statistics = {

        totalRecords: 0,

        stores: {}

    };


    Object.keys(
        data
    ).forEach(
        storeName => {

            const count =
                Array.isArray(
                    data[storeName]
                )
                    ? data[storeName].length
                    : 0;


            statistics.stores[
                storeName
            ] =
                count;


            statistics.totalRecords +=
                count;

        }
    );


    return statistics;

};


/* =========================================================
   حجم البيانات
   ========================================================= */

BackupModule.getObjectSize =
function (object) {

    try {

        const bytes =
            new Blob(
                [
                    JSON.stringify(
                        object
                    )
                ]
            ).size;


        return {

            bytes,

            formatted:
                this.formatBytes(
                    bytes
                )

        };


    } catch (error) {

        return {

            bytes: 0,

            formatted: "0 B"

        };

    }

};


/* =========================================================
   تنسيق الحجم
   ========================================================= */

BackupModule.formatBytes =
function (bytes) {

    if (!bytes) {

        return "0 B";

    }


    const units =

        [
            "B",
            "KB",
            "MB",
            "GB"
        ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    const value =
        bytes /
        Math.pow(
            1024,
            index
        );


    return `${value.toFixed(2)} ${units[index]}`;

};


/* =========================================================
   إنشاء اسم الملف
   ========================================================= */

BackupModule.generateBackupFileName =
function () {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const hour =
        String(
            now.getHours()
        ).padStart(
            2,
            "0"
        );


    const minute =
        String(
            now.getMinutes()
        ).padStart(
            2,
            "0"
        );


    const second =
        String(
            now.getSeconds()
        ).padStart(
            2,
            "0"
        );


    return `Teacher-Pro-Backup-${year}-${month}-${day}_${hour}-${minute}-${second}.json`;

};


/* =========================================================
   حفظ معلومات آخر نسخة
   ========================================================= */

BackupModule.saveLastBackupInfo =
function (backup) {

    try {

        const info = {

            createdAt:
                backup.meta.createdAt,

            createdAtArabic:
                backup.meta.createdAtArabic,

            fileName:
                backup.meta.fileName,

            statistics:
                backup.meta.statistics,

            size:
                backup.meta.size

        };


        localStorage.setItem(

            this.lastBackupKey,

            JSON.stringify(
                info
            )

        );


        this.renderLastBackupInfo(
            info
        );


    } catch (error) {

        console.error(
            "Cannot save backup info:",
            error
        );

    }

};


/* =========================================================
   تحميل معلومات آخر نسخة
   ========================================================= */

BackupModule.loadLastBackupInfo =
function () {

    try {

        const data =
            localStorage.getItem(
                this.lastBackupKey
            );


        if (!data) {

            return;

        }


        const info =
            JSON.parse(
                data
            );


        this.renderLastBackupInfo(
            info
        );


    } catch (error) {

        console.error(
            "Cannot load backup info:",
            error
        );

    }

};


/* =========================================================
   عرض معلومات آخر نسخة
   ========================================================= */

BackupModule.renderLastBackupInfo =
function (info) {

    const lastBackupDate =
        document.querySelector(
            this.selectors.lastBackupDate
        );


    if (lastBackupDate) {

        lastBackupDate.textContent =
            info.createdAtArabic ||
            info.createdAt ||
            "غير معروف";

    }


    const backupFileName =
        document.querySelector(
            this.selectors.backupFileName
        );


    if (backupFileName) {

        backupFileName.textContent =
            info.fileName ||
            "-";

    }


    const backupCount =
        document.querySelector(
            this.selectors.backupCount
        );


    if (
        backupCount &&
        info.statistics
    ) {

        backupCount.textContent =
            info.statistics.totalRecords ||
            0;

    }


    const backupInfo =
        document.querySelector(
            this.selectors.backupInfo
        );


    if (
        backupInfo &&
        info.size
    ) {

        backupInfo.dataset.size =
            info.size.formatted ||
            "0 B";

    }

};


/* =========================================================
   عرض Stores
   ========================================================= */

BackupModule.renderStoresList =
function () {

    const container =
        document.querySelector(
            this.selectors.storesList
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    this.stores.forEach(
        storeName => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "backup-store-item";


            item.dataset.store =
                storeName;


            item.innerHTML =
                `

                    <span class="backup-store-icon">
                        ${this.getStoreIcon(storeName)}
                    </span>

                    <span class="backup-store-name">
                        ${this.getStoreName(storeName)}
                    </span>

                    <span class="backup-store-id">
                        ${storeName}
                    </span>

                `;


            container.appendChild(
                item
            );

        }
    );

};


/* =========================================================
   عرض النسخة المختارة
   ========================================================= */

BackupModule.renderSelectedBackupInfo =
function (
    backup,
    file
) {

    const fileName =
        document.querySelector(
            this.selectors.selectedFileName
        );


    if (fileName) {

        fileName.textContent =
            file?.name ||
            backup.meta?.fileName ||
            "-";

    }


    const info =
        document.querySelector(
            this.selectors.selectedFileInfo
        );


    if (!info) {

        return;

    }


    const statistics =
        backup.meta?.statistics ||
        this.getBackupStatistics(
            backup.data
        );


    const size =
        file
            ? this.formatBytes(
                file.size
            )
            : (
                backup.meta?.size?.formatted ||
                "-"
            );


    info.innerHTML =
        `

            <div class="backup-info-row">

                <span>📅 تاريخ النسخة</span>

                <strong>
                    ${
                        backup.meta?.createdAtArabic ||
                        backup.meta?.createdAt ||
                        "-"
                    }
                </strong>

            </div>


            <div class="backup-info-row">

                <span>📦 عدد السجلات</span>

                <strong>
                    ${
                        statistics.totalRecords ||
                        0
                    }
                </strong>

            </div>


            <div class="backup-info-row">

                <span>🗂️ عدد الأقسام</span>

                <strong>
                    ${
                        Object.keys(
                            backup.data ||
                            {}
                        ).length
                    }
                </strong>

            </div>


            <div class="backup-info-row">

                <span>💾 الحجم</span>

                <strong>
                    ${size}
                </strong>

            </div>

        `;

};


/* =========================================================
   تأكيد الاستعادة
   ========================================================= */

BackupModule.confirmRestore =
async function (
    clearExisting
) {

    const message =
        clearExisting

            ? "سيتم حذف البيانات الحالية واستبدالها بالنسخة الاحتياطية. هل تريد المتابعة؟"

            : "سيتم دمج بيانات النسخة الاحتياطية مع البيانات الحالية. هل تريد المتابعة؟";


    if (
        window.App &&
        typeof App.confirm ===
        "function"
    ) {

        return await App.confirm(
            message
        );

    }


    return window.confirm(
        message
    );

};


/* =========================================================
   إعداد النسخ التلقائي
   ========================================================= */

BackupModule.setupAutoBackup =
function () {

    if (
        this.autoBackupTimer
    ) {

        clearInterval(
            this.autoBackupTimer
        );


        this.autoBackupTimer =
            null;

    }


    const enabledInput =
        document.querySelector(
            this.selectors.autoBackupInput
        );


    const intervalInput =
        document.querySelector(
            this.selectors.autoBackupInterval
        );


    const enabled =
        enabledInput
            ? enabledInput.checked
            : false;


    if (!enabled) {

        return;

    }


    let interval =
        intervalInput
            ? Number(
                intervalInput.value
            )
            : 60;


    if (
        !Number.isFinite(
            interval
        ) ||
        interval < 5
    ) {

        interval =
            60;

    }


    localStorage.setItem(

        this.autoBackupKey,

        JSON.stringify({

            enabled,

            interval

        })

    );


    this.autoBackupTimer =
        setInterval(

            async () => {

                const backup =
                    await this.createBackup();


                if (
                    backup
                ) {

                    localStorage.setItem(

                        "teacher_pro_auto_backup_data",

                        JSON.stringify(
                            backup
                        )

                    );

                }

            },

            interval *
            60 *
            1000

        );

};


/* =========================================================
   تحميل النسخة التلقائية
   ========================================================= */

BackupModule.getAutoBackup =
function () {

    try {

        const data =
            localStorage.getItem(
                "teacher_pro_auto_backup_data"
            );


        if (!data) {

            return null;

        }


        return JSON.parse(
            data
        );


    } catch (error) {

        return null;

    }

};


/* =========================================================
   حذف النسخة التلقائية
   ========================================================= */

BackupModule.clearAutoBackup =
function () {

    localStorage.removeItem(
        "teacher_pro_auto_backup_data"
    );

};


/* =========================================================
   تحديث الموقع بعد الاستعادة
   ========================================================= */

BackupModule.refreshApplication =
async function () {

    const events = [

        "data:updated",

        "students:updated",

        "classes:updated",

        "attendance:updated",

        "grades:updated",

        "assignments:updated",

        "exams:updated",

        "schedule:updated",

        "notes:updated",

        "notifications:updated",

        "settings:refresh",

        "themes:refresh"

    ];


    events.forEach(
        eventName => {

            document.dispatchEvent(

                new CustomEvent(
                    eventName,
                    {

                        detail: {

                            source:
                                "backup-restore",

                            time:
                                Date.now()

                        }

                    }
                )

            );

        }
    );


    const modules = [

        "DashboardModule",

        "StudentsModule",

        "ClassesModule",

        "AttendanceModule",

        "GradesModule",

        "AssignmentsModule",

        "ExamsModule",

        "ScheduleModule",

        "NotesModule",

        "NotificationsModule",

        "SettingsModule",

        "ThemesModule"

    ];


    for (
        const moduleName of
        modules
    ) {

        const module =
            window[moduleName];


        if (
            module &&
            typeof module.refresh ===
            "function"
        ) {

            try {

                await module.refresh();

            } catch (error) {

                console.warn(
                    `Cannot refresh ${moduleName}`,
                    error
                );

            }

        }

    }

};


/* =========================================================
   حالة النسخ
   ========================================================= */

BackupModule.setStatus =
function (message) {

    const element =
        document.querySelector(
            this.selectors.backupStatus
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;

};


/* =========================================================
   شريط التقدم
   ========================================================= */

BackupModule.setProgress =
function (percentage) {

    const progress =
        Math.max(

            0,

            Math.min(
                100,
                Number(percentage) || 0
            )

        );


    const bar =
        document.querySelector(
            this.selectors.progressBar
        );


    if (bar) {

        bar.style.width =
            `${progress}%`;

    }


    const progressElement =
        document.querySelector(
            this.selectors.progress
        );


    if (progressElement) {

        progressElement.dataset.progress =
            progress;


        progressElement.setAttribute(
            "aria-valuenow",
            progress
        );

    }

};


/* =========================================================
   أيقونة القسم
   ========================================================= */

BackupModule.getStoreIcon =
function (storeName) {

    const icons = {

        students:
            "👨‍🎓",

        classes:
            "🏫",

        sections:
            "🧩",

        attendance:
            "📋",

        grades:
            "📊",

        assignments:
            "📝",

        exams:
            "📚",

        schedule:
            "🗓️",

        notes:
            "📌",

        notifications:
            "🔔",

        settings:
            "⚙️",

        themes:
            "🎨",

        contacts:
            "📞",

        messages:
            "💬",

        studentRecords:
            "📁",

        studentNotes:
            "🗒️",

        teachingTips:
            "💡",

        gallery:
            "🖼️",

        backups:
            "💾"

    };


    return icons[
        storeName
    ] || "📦";

};


/* =========================================================
   اسم القسم
   ========================================================= */

BackupModule.getStoreName =
function (storeName) {

    const names = {

        students:
            "الطلاب",

        classes:
            "الصفوف",

        sections:
            "الشعب",

        attendance:
            "الحضور والغياب",

        grades:
            "الدرجات",

        assignments:
            "الواجبات",

        exams:
            "الامتحانات",

        schedule:
            "الجدول",

        notes:
            "الملاحظات",

        notifications:
            "التنبيهات",

        settings:
            "الإعدادات",

        themes:
            "الثيمات",

        contacts:
            "التواصل",

        messages:
            "المراسلات",

        studentRecords:
            "سجلات الطلاب",

        studentNotes:
            "ملاحظات الطلاب",

        teachingTips:
            "النصائح التدريسية",

        gallery:
            "معرض الصور",

        backups:
            "النسخ المحفوظة"

    };


    return names[
        storeName
    ] || storeName;

};


/* =========================================================
   تنسيق التاريخ
   ========================================================= */

BackupModule.formatDate =
function (date) {

    try {

        return new Intl.DateTimeFormat(

            "ar-IQ",

            {

                year:
                    "numeric",

                month:
                    "long",

                day:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit"

            }

        ).format(
            date
        );


    } catch (error) {

        return new Date(
            date
        ).toLocaleString();

    }

};


/* =========================================================
   رسالة
   ========================================================= */

BackupModule.showMessage =
function (
    message,
    type = "info"
) {

    if (
        window.App &&
        typeof App.showToast ===
        "function"
    ) {

        App.showToast(
            message,
            type
        );


        return;

    }


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


    console.log(
        `[${type}] ${message}`
    );

};


/* =========================================================
   الحصول على آخر نسخة
   ========================================================= */

BackupModule.getLastBackup =
function () {

    return this.lastBackup;

};


/* =========================================================
   الحصول على النسخة المختارة
   ========================================================= */

BackupModule.getSelectedBackup =
function () {

    return this.selectedBackup;

};


/* =========================================================
   حذف النسخة المختارة
   ========================================================= */

BackupModule.clearSelectedBackup =
function () {

    this.selectedBackup =
        null;


    const info =
        document.querySelector(
            this.selectors.selectedFileInfo
        );


    if (info) {

        info.innerHTML =
            "";

    }


    const name =
        document.querySelector(
            this.selectors.selectedFileName
        );


    if (name) {

        name.textContent =
            "لم يتم اختيار ملف";

    }

};


/* =========================================================
   تحديث القسم
   ========================================================= */

BackupModule.refresh =
async function () {

    this.loadLastBackupInfo();


    this.renderStoresList();

};


/* =========================================================
   تدمير الوحدة
   ========================================================= */

BackupModule.destroy =
function () {

    if (
        this.autoBackupTimer
    ) {

        clearInterval(
            this.autoBackupTimer
        );

    }


    this.autoBackupTimer =
        null;


    this.initialized =
        false;

};


/* =========================================================
   جعل الوحدة متاحة عالمياً
   ========================================================= */

window.BackupModule =
    BackupModule;


/* =========================================================
   تشغيل تلقائي
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            () => {

                BackupModule.init();

            },
            300
        );

    }
);