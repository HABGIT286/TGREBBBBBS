# ============================================================
# ASTRO BOT
# bot.py
# All bot logic is contained in this file.
# ============================================================

import os
import re
import io
import html
import json
import random
import calendar
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputFile,
)
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    ContextTypes,
    filters,
)

import database


# ============================================================
# CONFIG
# ============================================================

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()

OWNER_ID = int(
    os.getenv(
        "OWNER_ID",
        "910624538",
    )
)

DEV_USERNAME = os.getenv(
    "DEV_USERNAME",
    "FDF01",
).strip().lstrip("@")

WELCOME_IMAGE_URL = os.getenv(
    "WELCOME_IMAGE_URL",
    "",
).strip()

BOT_NAME = os.getenv(
    "BOT_NAME",
    "ASTRO BOT",
).strip()

ASTROTHEME_URL = os.getenv(
    "ASTROTHEME_URL",
    "https://www.astrotheme.com/birth-chart-sign-ascendant.php",
).strip()

HISTORY_PAGE_SIZE = int(
    os.getenv(
        "HISTORY_PAGE_SIZE",
        "10",
    )
)

HTTP_TIMEOUT = float(
    os.getenv(
        "HTTP_TIMEOUT",
        "30",
    )
)

HTTP_RETRIES = int(
    os.getenv(
        "HTTP_RETRIES",
        "3",
    )
)


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    format=(
        "%(asctime)s | "
        "%(levelname)s | "
        "%(name)s | "
        "%(message)s"
    ),
    level=logging.INFO,
)

logger = logging.getLogger(
    "ASTRO_BOT"
)


# ============================================================
# USER AGENTS
# ============================================================

USER_AGENTS = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/140.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/139.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/18.6 Safari/605.1.15"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) "
        "Gecko/20100101 Firefox/142.0"
    ),
    (
        "Mozilla/5.0 (Linux; Android 15; Mobile) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/140.0.0.0 Mobile Safari/537.36"
    ),
]


def random_user_agent():
    return random.choice(
        USER_AGENTS
    )


# ============================================================
# IN-MEMORY USER STATES
# ============================================================

STATES = {}


def new_state():
    return {
        "step": "idle",
        "name": None,
        "year": None,
        "month": None,
        "day": None,
        "hour": None,
        "minute": None,
        "period": None,
        "country": None,
        "city": None,
    }


def get_state(user_id):
    if user_id not in STATES:
        STATES[user_id] = new_state()

    return STATES[user_id]


def reset_state(user_id):
    STATES[user_id] = new_state()


# ============================================================
# TEXTS
# ============================================================

def welcome_text(user):
    name = (
        user.full_name
        or user.first_name
        or "مستخدم"
    )

    username = ""

    if user.username:
        username = (
            f"\n🔗 Username: @{user.username}"
        )

    return f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🌌 {BOT_NAME}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

أهلاً وسهلاً بك
👤 {html.escape(name)}

🆔 ID: <code>{user.id}</code>{username}

🔮 مركز البحث الفلكي

استخدم الأزرار بالأسفل للبدء.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎧 𝗦𝗢𝗞𝗢・𝙳𝙹
👨‍💻 DEV: @{DEV_USERNAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip()


def main_text():
    return f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🌌 {BOT_NAME}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🔮 <b>مركز البحث الفلكي</b>

اختر العملية التي تريد تنفيذها:

🔍 البحث الفلكي
📚 السجل
📖 التعليمات
👨‍💻 DEV

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip()


def help_text():
    return """
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          📖 التعليمات
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🔍 <b>البحث الفلكي</b>

1️⃣ اضغط البحث الفلكي.

2️⃣ اكتب الاسم.
مثال:
<code>أحمد محمد</code>

3️⃣ اختر سنة الميلاد.

4️⃣ اختر الشهر.

5️⃣ اختر اليوم.

6️⃣ اختر ساعة الولادة.

7️⃣ اختر الدقائق.

8️⃣ اختر AM أو PM.

9️⃣ اكتب الدولة.
مثال:
<code>Iraq</code>
أو:
<code>العراق</code>

🔟 اكتب المدينة.
مثال:
<code>Baghdad</code>
أو:
<code>بغداد</code>

بعدها ستظهر لك مراجعة كاملة
للبيانات قبل بدء البحث.

💡 <b>ملاحظة:</b>
وقت الولادة اختياري، لكنه مهم لبعض
البيانات المرتبطة بالطالع والبيوت.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip()


# ============================================================
# KEYBOARDS
# ============================================================

def main_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🔍 البحث الفلكي",
                callback_data="search:start",
            ),
        ],
        [
            InlineKeyboardButton(
                "📚 السجل",
                callback_data="history:0",
            ),
            InlineKeyboardButton(
                "📖 التعليمات",
                callback_data="help",
            ),
        ],
        [
            InlineKeyboardButton(
                "👨‍💻 DEV",
                url=f"https://t.me/{DEV_USERNAME}",
            ),
        ],
    ])


def cancel_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "✖️ إلغاء",
                callback_data="search:cancel",
            ),
        ],
    ])


def year_keyboard():
    now = datetime.now()

    current_year = now.year

    buttons = []

    years = list(
        range(
            current_year,
            current_year - 80,
            -1,
        )
    )

    for index in range(
        0,
        len(years),
        4,
    ):

        row = []

        for year in years[
            index:index + 4
        ]:
            row.append(
                InlineKeyboardButton(
                    str(year),
                    callback_data=f"year:{year}",
                )
            )

        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(
            "✖️ إلغاء",
            callback_data="search:cancel",
        ),
    ])

    return InlineKeyboardMarkup(
        buttons
    )


MONTHS = [
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
    "ديسمبر",
]


def month_keyboard():
    buttons = []

    for index in range(
        0,
        12,
        3,
    ):

        row = []

        for month in range(
            index + 1,
            min(index + 4, 13),
        ):
            row.append(
                InlineKeyboardButton(
                    MONTHS[month - 1],
                    callback_data=f"month:{month}",
                )
            )

        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(
            "✖️ إلغاء",
            callback_data="search:cancel",
        ),
    ])

    return InlineKeyboardMarkup(
        buttons
    )


def day_keyboard(
    year,
    month,
):
    buttons = []

    max_day = calendar.monthrange(
        year,
        month,
    )[1]

    for index in range(
        1,
        max_day + 1,
        7,
    ):

        row = []

        for day in range(
            index,
            min(index + 7, max_day + 1),
        ):
            row.append(
                InlineKeyboardButton(
                    str(day),
                    callback_data=f"day:{day}",
                )
            )

        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(
            "↩️ الشهر",
            callback_data="date:month",
        ),
        InlineKeyboardButton(
            "✖️ إلغاء",
            callback_data="search:cancel",
        ),
    ])

    return InlineKeyboardMarkup(
        buttons
    )


def hour_keyboard():
    buttons = []

    for start in range(
        1,
        13,
        4,
    ):

        row = []

        for hour in range(
            start,
            min(start + 4, 13),
        ):
            row.append(
                InlineKeyboardButton(
                    f"{hour:02d}",
                    callback_data=f"hour:{hour}",
                )
            )

        buttons.append(row)

    buttons.append([
        InlineKeyboardButton(
            "⏭️ تخطي الوقت",
            callback_data="time:skip",
        ),
    ])

    buttons.append([
        InlineKeyboardButton(
            "✖️ إلغاء",
            callback_data="search:cancel",
        ),
    ])

    return InlineKeyboardMarkup(
        buttons
    )


def minute_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "00",
                callback_data="minute:0",
            ),
            InlineKeyboardButton(
                "15",
                callback_data="minute:15",
            ),
            InlineKeyboardButton(
                "30",
                callback_data="minute:30",
            ),
            InlineKeyboardButton(
                "45",
                callback_data="minute:45",
            ),
        ],
        [
            InlineKeyboardButton(
                "✖️ إلغاء",
                callback_data="search:cancel",
            ),
        ],
    ])


def period_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🌅 AM",
                callback_data="period:AM",
            ),
            InlineKeyboardButton(
                "🌙 PM",
                callback_data="period:PM",
            ),
        ],
        [
            InlineKeyboardButton(
                "✖️ إلغاء",
                callback_data="search:cancel",
            ),
        ],
    ])


def confirm_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🚀 بدء البحث",
                callback_data="search:confirm",
            ),
        ],
        [
            InlineKeyboardButton(
                "✏️ إعادة الإدخال",
                callback_data="search:restart",
            ),
            InlineKeyboardButton(
                "✖️ إلغاء",
                callback_data="search:cancel",
            ),
        ],
    ])


def result_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "🔍 بحث جديد",
                callback_data="search:start",
            ),
        ],
        [
            InlineKeyboardButton(
                "📚 السجل",
                callback_data="history:0",
            ),
            InlineKeyboardButton(
                "🏠 الرئيسية",
                callback_data="home",
            ),
        ],
    ])


# ============================================================
# ADMIN HISTORY KEYBOARD
# ============================================================

def history_keyboard(
    searches,
    page,
    total,
):
    rows = []

    for item in searches:

        search_id = item["id"]

        name = (
            item["search_name"]
            or "بدون اسم"
        )

        if len(name) > 24:
            name = name[:21] + "..."

        rows.append([
            InlineKeyboardButton(
                f"👤 {name}",
                callback_data=f"history:item:{search_id}",
            )
        ])

    total_pages = max(
        1,
        (total + HISTORY_PAGE_SIZE - 1)
        // HISTORY_PAGE_SIZE,
    )

    navigation = []

    if page > 0:
        navigation.append(
            InlineKeyboardButton(
                "⏪",
                callback_data=f"history:{page - 1}",
            )
        )

    navigation.append(
        InlineKeyboardButton(
            f"{page + 1}/{total_pages}",
            callback_data="noop",
        )
    )

    if page < total_pages - 1:
        navigation.append(
            InlineKeyboardButton(
                "⏩",
                callback_data=f"history:{page + 1}",
            )
        )

    if navigation:
        rows.append(
            navigation
        )

    rows.append([
        InlineKeyboardButton(
            "🏠 الرئيسية",
            callback_data="home",
        ),
    ])

    return InlineKeyboardMarkup(
        rows
    )


def history_item_keyboard(
    search_id,
):
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "📄 ملف TXT",
                callback_data=f"history:file:{search_id}",
            ),
        ],
        [
            InlineKeyboardButton(
                "🗑 حذف",
                callback_data=f"history:delete:{search_id}",
            ),
        ],
        [
            InlineKeyboardButton(
                "↩️ رجوع للسجل",
                callback_data="history:0",
            ),
        ],
    ])


def delete_keyboard(
    search_id,
):
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "✅ نعم، احذف",
                callback_data=f"history:delete_yes:{search_id}",
            ),
            InlineKeyboardButton(
                "❌ إلغاء",
                callback_data=f"history:item:{search_id}",
            ),
        ],
    ])


# ============================================================
# UTILS
# ============================================================

def now_string():
    return datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )


def normalize_space(text):
    return " ".join(
        str(text or "").strip().split()
    )


def valid_name(text):
    text = normalize_space(text)

    if len(text) < 2:
        return False

    if len(text) > 100:
        return False

    return True


def valid_country(text):
    text = normalize_space(text)

    return (
        2 <= len(text) <= 100
    )


def valid_city(text):
    text = normalize_space(text)

    return (
        2 <= len(text) <= 100
    )


def format_date(
    year,
    month,
    day,
):
    return (
        f"{day:02d}/"
        f"{month:02d}/"
        f"{year:04d}"
    )


def format_time(
    hour,
    minute,
    period,
):
    if (
        hour is None
        or minute is None
        or not period
    ):
        return "غير محدد"

    return (
        f"{hour:02d}:"
        f"{minute:02d} "
        f"{period}"
    )


def location_for_astrotheme(
    country,
    city,
):
    return (
        f"{city} ({country}), {country}"
    )


# ============================================================
# TELEGRAM USER LOGGING
# ============================================================

async def register_user(
    user,
):
    try:
        database.upsert_user(
            telegram_id=user.id,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            language_code=(
                user.language_code
            ),
        )
    except Exception:
        logger.exception(
            "Could not register user"
        )


async def notify_owner(
    application,
    text,
):
    try:
        await application.bot.send_message(
            chat_id=OWNER_ID,
            text=text,
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True,
        )
    except Exception:
        logger.exception(
            "Could not notify owner"
        )


def user_admin_info(user):
    username = (
        f"@{user.username}"
        if user.username
        else "غير متوفر"
    )

    return (
        f"👤 الاسم: "
        f"<code>{html.escape(user.full_name or '—')}</code>\n"
        f"🔗 Username: "
        f"<code>{html.escape(username)}</code>\n"
        f"🆔 ID: "
        f"<code>{user.id}</code>\n"
        f"🌐 Language: "
        f"<code>{html.escape(user.language_code or '—')}</code>"
    )


# ============================================================
# /START
# ============================================================

async def start_command(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    user = update.effective_user

    if not user:
        return

    await register_user(
        user
    )

    database.add_search_log(
        None,
        user.id,
        "bot_start",
        "User opened the bot",
    )

    owner_message = f"""
🟢 <b>مستخدم جديد / تشغيل البوت</b>

{user_admin_info(user)}

🕐 الوقت:
<code>{now_string()}</code>
""".strip()

    await notify_owner(
        context.application,
        owner_message,
    )

    text = welcome_text(
        user
    )

    if WELCOME_IMAGE_URL:

        try:
            await update.message.reply_photo(
                photo=WELCOME_IMAGE_URL,
                caption=text,
                parse_mode=ParseMode.HTML,
                reply_markup=main_keyboard(),
            )
            return

        except Exception:
            logger.exception(
                "Welcome image failed"
            )

    await update.message.reply_text(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=main_keyboard(),
    )


# ============================================================
# HOME
# ============================================================

async def show_home(
    query,
):

    user = query.from_user

    await query.edit_message_text(
        welcome_text(user),
        parse_mode=ParseMode.HTML,
        reply_markup=main_keyboard(),
    )


# ============================================================
# SEARCH START
# ============================================================

async def start_search(
    query,
):

    user_id = query.from_user.id

    reset_state(
        user_id
    )

    state = get_state(
        user_id
    )

    state["step"] = "name"

    await query.edit_message_text(
        """
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🔍 البحث الفلكي
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 <b>الخطوة 1</b>

اكتب الاسم الذي تريد استخدامه.

📝 مثال:
<code>GOOOOODe</code>

أو:
<code>أحمد محمد</code>

💡 يدعم العربي والإنجليزي.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip(),
        parse_mode=ParseMode.HTML,
        reply_markup=cancel_keyboard(),
    )


# ============================================================
# TEXT MESSAGE ROUTER
# ============================================================

async def message_handler(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    user = update.effective_user
    message = update.effective_message

    if not user or not message:
        return

    await register_user(
        user
    )

    state = get_state(
        user.id
    )

    if state["step"] == "idle":

        await message.reply_text(
            main_text(),
            parse_mode=ParseMode.HTML,
            reply_markup=main_keyboard(),
        )

        return

    text = normalize_space(
        message.text or ""
    )

    if not text:
        return

    # --------------------------------------------------------
    # NAME
    # --------------------------------------------------------

    if state["step"] == "name":

        if not valid_name(text):

            await message.reply_text(
                """
⚠️ <b>الاسم غير صحيح.</b>

اكتب اسماً واضحاً.

مثال:
<code>أحمد محمد</code>
""".strip(),
                parse_mode=ParseMode.HTML,
                reply_markup=cancel_keyboard(),
            )

            return

        state["name"] = text
        state["step"] = "year"

        await message.reply_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ✅ تم حفظ الاسم
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 الاسم:
<b>{html.escape(text)}</b>

📅 الآن اختر سنة الميلاد.
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=year_keyboard(),
        )

        return

    # --------------------------------------------------------
    # COUNTRY
    # --------------------------------------------------------

    if state["step"] == "country":

        if not valid_country(text):

            await message.reply_text(
                """
⚠️ <b>اسم الدولة غير صحيح.</b>

مثال:
<code>Iraq</code>

أو:
<code>العراق</code>
""".strip(),
                parse_mode=ParseMode.HTML,
                reply_markup=cancel_keyboard(),
            )

            return

        state["country"] = text
        state["step"] = "city"

        await message.reply_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ✅ تم حفظ الدولة
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🌍 الدولة:
<b>{html.escape(text)}</b>

🏙 الآن اكتب اسم المدينة.

مثال:
<code>Baghdad</code>
أو:
<code>بغداد</code>
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=cancel_keyboard(),
        )

        return

    # --------------------------------------------------------
    # CITY
    # --------------------------------------------------------

    if state["step"] == "city":

        if not valid_city(text):

            await message.reply_text(
                """
⚠️ <b>اسم المدينة غير صحيح.</b>

مثال:
<code>Baghdad</code>

أو:
<code>بغداد</code>
""".strip(),
                parse_mode=ParseMode.HTML,
                reply_markup=cancel_keyboard(),
            )

            return

        state["city"] = text
        state["step"] = "confirm"

        await send_confirmation(
            message,
            state,
        )

        return

    # --------------------------------------------------------
    # OTHER STEPS
    # --------------------------------------------------------

    await message.reply_text(
        "⚠️ استخدم الأزرار الظاهرة أمامك لإكمال العملية.",
        reply_markup=cancel_keyboard(),
    )


# ============================================================
# CONFIRMATION
# ============================================================

async def send_confirmation(
    message,
    state,
):

    date_value = format_date(
        state["year"],
        state["month"],
        state["day"],
    )

    time_value = format_time(
        state["hour"],
        state["minute"],
        state["period"],
    )

    text = f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🔎 مراجعة البيانات
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 <b>الاسم:</b>
{html.escape(state["name"])}

🎂 <b>تاريخ الميلاد:</b>
<code>{date_value}</code>

🕐 <b>وقت الولادة:</b>
<code>{time_value}</code>

🌍 <b>الدولة:</b>
{html.escape(state["country"])}

🏙 <b>المدينة:</b>
{html.escape(state["city"])}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ راجع المعلومات قبل بدء البحث.

""".strip()

    await message.reply_text(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=confirm_keyboard(),
    )


# ============================================================
# CALLBACK ROUTER
# ============================================================

async def callback_handler(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE,
):

    query = update.callback_query

    if not query:
        return

    await query.answer()

    user = query.from_user

    await register_user(
        user
    )

    data = query.data or ""

    # --------------------------------------------------------
    # NOOP
    # --------------------------------------------------------

    if data == "noop":
        return

    # --------------------------------------------------------
    # HOME
    # --------------------------------------------------------

    if data == "home":

        reset_state(
            user.id
        )

        await show_home(
            query
        )

        return

    # --------------------------------------------------------
    # HELP
    # --------------------------------------------------------

    if data == "help":

        await query.edit_message_text(
            help_text(),
            parse_mode=ParseMode.HTML,
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🏠 الرئيسية",
                        callback_data="home",
                    )
                ]
            ]),
        )

        return

    # --------------------------------------------------------
    # DEV
    # --------------------------------------------------------

    if data == "dev":

        await query.edit_message_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          👨‍💻 DEV
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🎧 𝗦𝗢𝗞𝗢・𝙳𝙹

🔗 Telegram:
@{DEV_USERNAME}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "👨‍💻 فتح حساب DEV",
                        url=f"https://t.me/{DEV_USERNAME}",
                    )
                ],
                [
                    InlineKeyboardButton(
                        "🏠 الرئيسية",
                        callback_data="home",
                    )
                ],
            ]),
        )

        return

    # --------------------------------------------------------
    # SEARCH START
    # --------------------------------------------------------

    if data == "search:start":

        await start_search(
            query
        )

        return

    # --------------------------------------------------------
    # SEARCH CANCEL
    # --------------------------------------------------------

    if data == "search:cancel":

        reset_state(
            user.id
        )

        await query.edit_message_text(
            """
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ✖️ تم الإلغاء
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

تم إلغاء عملية البحث الحالية.

يمكنك بدء بحث جديد من القائمة الرئيسية.
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=main_keyboard(),
        )

        return

    # --------------------------------------------------------
    # SEARCH RESTART
    # --------------------------------------------------------

    if data == "search:restart":

        await start_search(
            query
        )

        return

    # --------------------------------------------------------
    # YEAR
    # --------------------------------------------------------

    if data.startswith("year:"):

        state = get_state(
            user.id
        )

        try:
            year = int(
                data.split(
                    ":",
                    1,
                )[1]
            )
        except Exception:
            return

        if not (
            1900 <= year <= datetime.now().year
        ):
            return

        state["year"] = year
        state["step"] = "month"

        await query.edit_message_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          📅 الشهر
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

السنة المختارة:
<b>{year}</b>

اختر شهر الميلاد.
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=month_keyboard(),
        )

        return

    # --------------------------------------------------------
    # MONTH BACK
    # --------------------------------------------------------

    if data == "date:month":

        state = get_state(
            user.id
        )

        state["step"] = "month"

        await query.edit_message_text(
            "📅 اختر شهر الميلاد:",
            reply_markup=month_keyboard(),
        )

        return

    # --------------------------------------------------------
    # MONTH
    # --------------------------------------------------------

    if data.startswith("month:"):

        state = get_state(
            user.id
        )

        try:
            month = int(
                data.split(
                    ":",
                    1,
                )[1]
            )
        except Exception:
            return

        if month < 1 or month > 12:
            return

        state["month"] = month
        state["step"] = "day"

        await query.edit_message_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          📅 اليوم
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

السنة:
<b>{state["year"]}</b>

الشهر:
<b>{MONTHS[month - 1]}</b>

اختر يوم الميلاد.
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=day_keyboard(
                state["year"],
                month,
            ),
        )

        return

    # --------------------------------------------------------
    # DAY
    # --------------------------------------------------------

    if data.startswith("day:"):

        state = get_state(
            user.id
        )

        try:
            day = int(
                data.split(
                    ":",
                    1,
                )[1]
            )
        except Exception:
            return

        try:
            max_day = calendar.monthrange(
                state["year"],
                state["month"],
            )[1]
        except Exception:
            return

        if day < 1 or day > max_day:
            return

        state["day"] = day
        state["step"] = "hour"

        await query.edit_message_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ✅ تم حفظ التاريخ
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🎂 التاريخ:
<code>{format_date(
    state["year"],
    state["month"],
    state["day"],
)}</code>

🕐 الآن اختر ساعة الولادة.

💡 إذا كنت لا تعرف الوقت يمكنك
اختيار «تخطي الوقت».
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=hour_keyboard(),
        )

        return

    # --------------------------------------------------------
    # HOUR
    # --------------------------------------------------------

    if data.startswith("hour:"):

        state = get_state(
            user.id
        )

        try:
            hour = int(
                data.split(
                    ":",
                    1,
                )[1]
            )
        except Exception:
            return

        if hour < 1 or hour > 12:
            return

        state["hour"] = hour
        state["step"] = "minute"

        await query.edit_message_text(
            f"""
🕐 <b>ساعة الولادة:</b>
<code>{hour:02d}</code>

الآن اختر الدقائق.

مثال:
00 / 15 / 30 / 45
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=minute_keyboard(),
        )

        return

    # --------------------------------------------------------
    # TIME SKIP
    # --------------------------------------------------------

    if data == "time:skip":

        state = get_state(
            user.id
        )

        state["hour"] = None
        state["minute"] = None
        state["period"] = None

        state["step"] = "country"

        await query.edit_message_text(
            """
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ℹ️ تم تخطي الوقت
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

لم يتم تحديد وقت الولادة.

🌍 الآن اكتب اسم الدولة.

مثال:
<code>Iraq</code>

أو:
<code>العراق</code>
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=cancel_keyboard(),
        )

        return

    # --------------------------------------------------------
    # MINUTE
    # --------------------------------------------------------

    if data.startswith("minute:"):

        state = get_state(
            user.id
        )

        try:
            minute = int(
                data.split(
                    ":",
                    1,
                )[1]
            )
        except Exception:
            return

        if minute not in (
            0,
            15,
            30,
            45,
        ):
            return

        state["minute"] = minute
        state["step"] = "period"

        await query.edit_message_text(
            f"""
🕐 الوقت الحالي:
<code>{state["hour"]:02d}:{minute:02d}</code>

اختر الفترة:

🌅 AM
🌙 PM
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=period_keyboard(),
        )

        return

    # --------------------------------------------------------
    # PERIOD
    # --------------------------------------------------------

    if data.startswith("period:"):

        state = get_state(
            user.id
        )

        period = data.split(
            ":",
            1,
        )[1].upper()

        if period not in (
            "AM",
            "PM",
        ):
            return

        state["period"] = period
        state["step"] = "country"

        await query.edit_message_text(
            f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ✅ تم حفظ الوقت
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

🕐 الوقت:
<code>{state["hour"]:02d}:{state["minute"]:02d} {period}</code>

🌍 الآن اكتب اسم الدولة.

مثال:
<code>Iraq</code>

أو:
<code>العراق</code>
""".strip(),
            parse_mode=ParseMode.HTML,
            reply_markup=cancel_keyboard(),
        )

        return

    # --------------------------------------------------------
    # CONFIRM SEARCH
    # --------------------------------------------------------

    if data == "search:confirm":

        state = get_state(
            user.id
        )

        if not (
            state["name"]
            and state["year"]
            and state["month"]
            and state["day"]
            and state["country"]
            and state["city"]
        ):
            await query.edit_message_text(
                "⚠️ البيانات غير مكتملة. ابدأ البحث من جديد.",
                reply_markup=main_keyboard(),
            )
            return

        search_id = database.create_search(
            telegram_id=user.id,
            search_name=state["name"],
            birth_year=state["year"],
            birth_month=state["month"],
            birth_day=state["day"],
            birth_hour=state["hour"],
            birth_minute=state["minute"],
            birth_period=state["period"],
            country=state["country"],
            city=state["city"],
        )

        state["search_id"] = search_id
        state["step"] = "searching"

        database.add_search_log(
            search_id,
            user.id,
            "search_started",
            "Astro search started",
        )

        await query.edit_message_text(
            """
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🔮 جاري البحث
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

⏳ يتم الآن معالجة بيانات البحث...

🌌 الاتصال بخدمة البحث
📊 معالجة البيانات
✨ يرجى الانتظار قليلاً
""".strip(),
            parse_mode=ParseMode.HTML,
        )

        asyncio.create_task(
            execute_search(
                context.application,
                user.id,
                search_id,
            )
        )

        return

    # --------------------------------------------------------
    # HISTORY
    # --------------------------------------------------------

    if data.startswith("history:"):

        parts = data.split(":")

        if len(parts) == 2:

            try:
                page = int(
                    parts[1]
                )
            except Exception:
                page = 0

            await show_history(
                query,
                page,
            )

            return

        if len(parts) >= 3:

            action = parts[1]

            try:
                search_id = int(
                    parts[2]
                )
            except Exception:
                return

            if action == "item":

                await show_history_item(
                    query,
                    search_id,
                )

                return

            if action == "file":

                await send_history_file(
                    query,
                    context.application,
                    search_id,
                )

                return

            if action == "delete":

                await query.edit_message_text(
                    """
⚠️ هل أنت متأكد من حذف عملية البحث؟

لن تستطيع استرجاعها بعد الحذف.
""".strip(),
                    reply_markup=delete_keyboard(
                        search_id
                    ),
                )

                return

            if action == "delete_yes":

                if user.id != OWNER_ID:
                    await query.answer(
                        "غير مسموح.",
                        show_alert=True,
                    )
                    return

                database.delete_search(
                    search_id
                )

                await query.edit_message_text(
                    "🗑 تم حذف عملية البحث.",
                    reply_markup=InlineKeyboardMarkup([
                        [
                            InlineKeyboardButton(
                                "📚 السجل",
                                callback_data="history:0",
                            )
                        ]
                    ]),
                )

                return


# ============================================================
# EXECUTE SEARCH
# ============================================================

async def execute_search(
    application,
    user_id,
    search_id,
):

    search = database.get_search(
        search_id
    )

    if not search:
        return

    try:

        result = await astro_search(
            name=search["search_name"],
            day=search["birth_day"],
            month=search["birth_month"],
            year=search["birth_year"],
            hour=search["birth_hour"],
            minute=search["birth_minute"],
            period=search["birth_period"],
            country=search["country"],
            city=search["city"],
        )

        if result["success"]:

            result_text = result["text"]

            database.update_search(
                search_id,
                result_text=result_text,
                status="success",
            )

            database.increment_user_searches(
                user_id
            )

            database.add_search_log(
                search_id,
                user_id,
                "search_success",
                "Astro search completed",
            )

            final_text = format_result(
                search,
                result_text,
            )

            await application.bot.send_message(
                chat_id=user_id,
                text=final_text,
                parse_mode=ParseMode.HTML,
                reply_markup=result_keyboard(),
                disable_web_page_preview=True,
            )

            owner_message = f"""
🟢 <b>اكتمل بحث فلكي</b>

{user_admin_info_from_search(search)}

🕐 الوقت:
<code>{now_string()}</code>

🆔 Search ID:
<code>{search_id}</code>
""".strip()

            await notify_owner(
                application,
                owner_message,
            )

        else:

            error = result.get(
                "error",
                "تعذر إكمال البحث.",
            )

            database.update_search(
                search_id,
                result_text=error,
                status="failed",
            )

            database.add_search_log(
                search_id,
                user_id,
                "search_failed",
                error,
            )

            await application.bot.send_message(
                chat_id=user_id,
                text=f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          ⚠️ فشل البحث
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

تعذر الحصول على النتيجة.

السبب:
{html.escape(error)}

يمكنك المحاولة مرة أخرى لاحقاً.
""".strip(),
                parse_mode=ParseMode.HTML,
                reply_markup=result_keyboard(),
            )

    except Exception as exc:

        logger.exception(
            "Search execution failed"
        )

        database.update_search(
            search_id,
            result_text=str(exc),
            status="failed",
        )

        database.add_search_log(
            search_id,
            user_id,
            "search_exception",
            str(exc),
        )

        try:
            await application.bot.send_message(
                chat_id=user_id,
                text="""
⚠️ حدث خطأ غير متوقع أثناء البحث.

تم حفظ العملية في السجل ويمكنك
إعادة المحاولة من القائمة.
""".strip(),
                reply_markup=result_keyboard(),
            )
        except Exception:
            pass


def user_admin_info_from_search(
    search,
):

    username = "غير متوفر"

    try:
        user = database.get_user(
            search["telegram_id"]
        )

        if user and user["username"]:
            username = (
                f"@{user['username']}"
            )

    except Exception:
        pass

    return f"""
👤 الاسم:
<code>{html.escape(str(search["search_name"]))}</code>

🔗 Username:
<code>{html.escape(username)}</code>

🆔 Telegram ID:
<code>{search["telegram_id"]}</code>

🎂 تاريخ الميلاد:
<code>{format_date(
    search["birth_year"],
    search["birth_month"],
    search["birth_day"],
)}</code>

🕐 وقت الولادة:
<code>{format_time(
    search["birth_hour"],
    search["birth_minute"],
    search["birth_period"],
)}</code>

🌍 الدولة:
<code>{html.escape(str(search["country"]))}</code>

🏙 المدينة:
<code>{html.escape(str(search["city"]))}</code>
""".strip()


# ============================================================
# ASTROTHEME SEARCH
# ============================================================

async def astro_search(
    name,
    day,
    month,
    year,
    hour,
    minute,
    period,
    country,
    city,
):

    final_hour = 12

    if hour is not None:

        final_hour = int(
            hour
        )

        if period:

            p = str(
                period
            ).upper()

            if p == "AM":

                if final_hour == 12:
                    final_hour = 0

            elif p == "PM":

                if final_hour != 12:
                    final_hour += 12

    final_minute = (
        int(minute)
        if minute is not None
        else 0
    )

    location = (
        f"{city} ({country}), {country}"
    )

    form = {
        "prenom": str(name),
        "jour": f"{int(day):02d}",
        "mois": f"{int(month):02d}",
        "annee": f"{int(year):04d}",
        "heure": (
            f"{final_hour:02d}:"
            f"{final_minute:02d}"
        ),
        "ville": location,
        "domification": "0",
        "seuil": "1",
        "_qf_s1_next.x": "30",
        "_qf_s1_next.y": "11",
        "atlas": "",
        "celebrite": "null",
        "_qf_default": "s1:next",
    }

    timeout = httpx.Timeout(
        HTTP_TIMEOUT
    )

    last_error = ""

    for attempt in range(
        max(1, HTTP_RETRIES)
    ):

        try:

            headers = {
                "User-Agent":
                    random_user_agent(),
                "Accept":
                    (
                        "text/html,"
                        "application/xhtml+xml,"
                        "application/xml;q=0.9,"
                        "*/*;q=0.8"
                    ),
                "Accept-Language":
                    "en-US,en;q=0.9,fr;q=0.8",
                "Cache-Control":
                    "no-cache",
                "Pragma":
                    "no-cache",
                "Upgrade-Insecure-Requests":
                    "1",
            }

            async with httpx.AsyncClient(
                timeout=timeout,
                follow_redirects=True,
                headers=headers,
            ) as client:

                response = await client.post(
                    ASTROTHEME_URL,
                    data=form,
                )

                if response.status_code >= 400:

                    last_error = (
                        f"HTTP {response.status_code}"
                    )

                    continue

                first_html = response.text

                display_url = (
                    f"{ASTROTHEME_URL}"
                    "?_qf_s2_display=true"
                )

                headers["Referer"] = str(
                    response.url
                )

                second = await client.get(
                    display_url,
                    headers=headers,
                )

                if second.status_code >= 400:

                    last_error = (
                        f"HTTP {second.status_code}"
                    )

                    continue

                second_html = second.text

                final_html = second_html

                if not looks_like_result(
                    final_html
                ):
                    if looks_like_result(
                        first_html
                    ):
                        final_html = first_html

                parsed = parse_astro_html(
                    final_html
                )

                if not parsed:

                    last_error = (
                        "لم يتم العثور على "
                        "محتوى النتيجة."
                    )

                    continue

                return {
                    "success": True,
                    "text": parsed,
                    "error": "",
                }

        except httpx.TimeoutException:

            last_error = (
                "انتهت مهلة الاتصال بالموقع."
            )

        except httpx.ConnectError:

            last_error = (
                "تعذر الاتصال بالموقع."
            )

        except httpx.HTTPError as exc:

            last_error = (
                f"خطأ HTTP: {exc}"
            )

        except Exception as exc:

            last_error = (
                f"خطأ غير متوقع: {exc}"
            )

        if attempt < HTTP_RETRIES - 1:

            await asyncio.sleep(
                min(
                    2 ** attempt,
                    8,
                )
            )

    return {
        "success": False,
        "text": "",
        "error": last_error
        or "فشلت عملية البحث.",
    }


def looks_like_result(
    html_text,
):

    if not html_text:
        return False

    low = html_text.lower()

    words = [
        "ascendant",
        "birth chart",
        "natal chart",
        "zodiac",
        "astrological",
        "astrotheme",
        "domification",
    ]

    found = sum(
        1
        for word in words
        if word in low
    )

    return found >= 2


def parse_astro_html(
    html_text,
):

    if not html_text:
        return ""

    soup = BeautifulSoup(
        html_text,
        "lxml",
    )

    # إزالة العناصر غير المطلوبة
    for tag in soup.find_all([
        "script",
        "style",
        "noscript",
        "svg",
        "iframe",
        "form",
    ]):
        try:
            tag.decompose()
        except Exception:
            pass

    # حذف الإعلانات والعناصر الواضحة
    ad_words = [
        "advertisement",
        "advertising",
        "adsbygoogle",
        "criteo",
        "prebid",
        "banner-ad",
    ]

    for tag in soup.find_all([
        "div",
        "section",
        "aside",
    ]):

        classes = " ".join(
            tag.get("class", [])
        ).lower()

        tag_id = str(
            tag.get("id", "")
        ).lower()

        combined = (
            f"{classes} {tag_id}"
        )

        if any(
            word in combined
            for word in ad_words
        ):

            try:
                tag.decompose()
            except Exception:
                pass

    root = (
        soup.find("main")
        or soup.find("article")
        or soup.body
        or soup
    )

    text = root.get_text(
        "\n",
        strip=True,
    )

    lines = []

    for line in text.splitlines():

        line = normalize_space(
            line
        )

        if not line:
            continue

        low = line.lower()

        if any(
            word in low
            for word in [
                "advertisement",
                "ads by google",
                "criteo",
                "prebid",
            ]
        ):
            continue

        lines.append(
            line
        )

    # منع النص الضخم جداً
    text = "\n".join(
        lines
    )

    if len(text) > 12000:
        text = text[:12000] + (
            "\n\n[تم اختصار النص]"
        )

    return text.strip()


# ============================================================
# FORMAT RESULT
# ============================================================

def format_result(
    search,
    result_text,
):

    name = html.escape(
        str(
            search["search_name"]
        )
    )

    date_value = format_date(
        search["birth_year"],
        search["birth_month"],
        search["birth_day"],
    )

    time_value = format_time(
        search["birth_hour"],
        search["birth_minute"],
        search["birth_period"],
    )

    return f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🌌 النتيجة الفلكية
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 الاسم:
<b>{name}</b>

🎂 تاريخ الميلاد:
<code>{date_value}</code>

🕐 وقت الولادة:
<code>{time_value}</code>

🌍 الدولة:
<b>{html.escape(str(search["country"]))}</b>

🏙 المدينة:
<b>{html.escape(str(search["city"]))}</b>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{html.escape(result_text)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎧 ASTRO BOT
👨‍💻 DEV: @{DEV_USERNAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip()


# ============================================================
# HISTORY
# ============================================================

async def show_history(
    query,
    page=0,
):

    user = query.from_user

    if user.id != OWNER_ID:

        await query.edit_message_text(
            "🔐 هذا القسم متاح للمطور فقط.",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🏠 الرئيسية",
                        callback_data="home",
                    )
                ]
            ]),
        )

        return

    total = database.count_all_searches()

    if total <= 0:

        await query.edit_message_text(
            """
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          📚 السجل فارغ
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

لا توجد عمليات بحث محفوظة حالياً.
""".strip(),
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "🏠 الرئيسية",
                        callback_data="home",
                    )
                ]
            ]),
        )

        return

    total_pages = max(
        1,
        (
            total
            + HISTORY_PAGE_SIZE
            - 1
        )
        // HISTORY_PAGE_SIZE,
    )

    page = max(
        0,
        min(
            page,
            total_pages - 1,
        ),
    )

    offset = (
        page
        * HISTORY_PAGE_SIZE
    )

    searches = database.get_all_searches(
        limit=HISTORY_PAGE_SIZE,
        offset=offset,
    )

    text = f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          🔐 ADMIN HISTORY
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👥 إجمالي العمليات:
<b>{total}</b>

📄 الصفحة:
<b>{page + 1} / {total_pages}</b>

اضغط على اسم لعرض التفاصيل.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 OWNER
🆔 <code>{OWNER_ID}</code>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip()

    await query.edit_message_text(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=history_keyboard(
            searches,
            page,
            total,
        ),
    )


# ============================================================
# HISTORY ITEM
# ============================================================

async def show_history_item(
    query,
    search_id,
):

    user = query.from_user

    if user.id != OWNER_ID:

        await query.answer(
            "غير مسموح.",
            show_alert=True,
        )

        return

    search = database.get_search(
        search_id
    )

    if not search:

        await query.edit_message_text(
            "⚠️ لم يتم العثور على العملية.",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton(
                        "📚 السجل",
                        callback_data="history:0",
                    )
                ]
            ]),
        )

        return

    text = f"""
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
          📄 تفاصيل البحث
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 الاسم:
<b>{html.escape(str(search["search_name"]))}</b>

🆔 Telegram ID:
<code>{search["telegram_id"]}</code>

🎂 تاريخ الميلاد:
<code>{format_date(
    search["birth_year"],
    search["birth_month"],
    search["birth_day"],
)}</code>

🕐 وقت الولادة:
<code>{format_time(
    search["birth_hour"],
    search["birth_minute"],
    search["birth_period"],
)}</code>

🌍 الدولة:
<b>{html.escape(str(search["country"]))}</b>

🏙 المدينة:
<b>{html.escape(str(search["city"]))}</b>

📅 وقت البحث:
<code>{html.escape(str(search["created_at"]))}</code>

📌 الحالة:
<code>{html.escape(str(search["status"]))}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""".strip()

    await query.edit_message_text(
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=history_item_keyboard(
            search_id
        ),
    )


# ============================================================
# HISTORY TXT
# ============================================================

def create_history_txt(
    search,
):

    user = database.get_user(
        search["telegram_id"]
    )

    username = ""

    first_name = ""
    last_name = ""

    language = ""

    if user:

        username = (
            user["username"]
            or ""
        )

        first_name = (
            user["first_name"]
            or ""
        )

        last_name = (
            user["last_name"]
            or ""
        )

        language = (
            user["language"]
            or ""
        )

    date_value = format_date(
        search["birth_year"],
        search["birth_month"],
        search["birth_day"],
    )

    time_value = format_time(
        search["birth_hour"],
        search["birth_minute"],
        search["birth_period"],
    )

    result = search["result_text"] or ""

    content = f"""
============================================================
                     ASTRO BOT
                  ASTRO SEARCH FILE
============================================================

DEVELOPER:
FDF01
Telegram: @{DEV_USERNAME}

BOT:
{BOT_NAME}

============================================================
                    USER INFORMATION
============================================================

Telegram ID:
{search["telegram_id"]}

Username:
@{username if username else "غير متوفر"}

First Name:
{first_name}

Last Name:
{last_name}

Language:
{language}

============================================================
                    SEARCH INFORMATION
============================================================

Search ID:
{search["id"]}

Search Time:
{search["created_at"]}

Status:
{search["status"]}

Name:
{search["search_name"]}

Birth Date:
{date_value}

Birth Time:
{time_value}

Country:
{search["country"]}

City:
{search["city"]}

============================================================
                       ASTRO RESULT
============================================================

{result}

============================================================
                         CREDITS
============================================================

ASTRO BOT
Developer: FDF01
Telegram: @{DEV_USERNAME}

This file was generated automatically
by ASTRO BOT.

============================================================
""".strip()

    return content


async def send_history_file(
    query,
    application,
    search_id,
):

    user = query.from_user

    if user.id != OWNER_ID:

        await query.answer(
            "غير مسموح.",
            show_alert=True,
        )

        return

    search = database.get_search(
        search_id
    )

    if not search:

        await query.answer(
            "لم يتم العثور على العملية.",
            show_alert=True,
        )

        return

    content = create_history_txt(
        search
    )

    filename = (
        f"ASTRO_{search_id}_"
        f"{search['telegram_id']}.txt"
    )

    file_data = io.BytesIO(
        content.encode(
            "utf-8"
        )
    )

    file_data.name = filename

    await application.bot.send_document(
        chat_id=user.id,
        document=InputFile(
            file_data,
            filename=filename,
        ),
        caption=(
            "📄 تم إنشاء ملف TXT "
            "لعملية البحث."
        ),
    )

    await query.answer(
        "📄 تم إرسال الملف.",
        show_alert=False,
    )


# ============================================================
# ERROR HANDLER
# ============================================================

async def error_handler(
    update,
    context,
):

    logger.exception(
        "Unhandled exception",
        exc_info=context.error,
    )

    try:

        if (
            update
            and update.effective_message
        ):

            await update.effective_message.reply_text(
                """
⚠️ حدث خطأ غير متوقع.

حاول مرة أخرى من القائمة الرئيسية.
""".strip(),
                reply_markup=main_keyboard(),
            )

    except Exception:
        pass


# ============================================================
# APPLICATION BUILDER
# ============================================================

def create_application():

    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN غير موجود في GitHub Secrets."
        )

    database.init_database()

    application = (
        Application.builder()
        .token(BOT_TOKEN)
        .build()
    )

    # --------------------------------------------------------
    # COMMANDS
    # --------------------------------------------------------

    application.add_handler(
        CommandHandler(
            "start",
            start_command,
        )
    )

    # --------------------------------------------------------
    # CALLBACKS
    # --------------------------------------------------------

    application.add_handler(
        CallbackQueryHandler(
            callback_handler
        )
    )

    # --------------------------------------------------------
    # TEXT
    # --------------------------------------------------------

    application.add_handler(
        MessageHandler(
            filters.TEXT
            & ~filters.COMMAND,
            message_handler,
        )
    )

    # --------------------------------------------------------
    # ERRORS
    # --------------------------------------------------------

    application.add_error_handler(
        error_handler
    )

    return application


# ============================================================
# RUN FUNCTION
# ============================================================

def run_bot():

    application = create_application()

    logger.info(
        "ASTRO BOT is starting..."
    )

    application.run_polling(
        allowed_updates=Update.ALL_TYPES,
        drop_pending_updates=True,
    )


# ============================================================
# DIRECT EXECUTION
# ============================================================

if __name__ == "__main__":
    run_bot()
