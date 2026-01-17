import asyncio
import logging
import os
import sqlite3
from datetime import datetime
from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import Message
from aiogram.enums import ParseMode
from dotenv import load_dotenv
from groq import Groq

# Загрузка переменных окружения
load_dotenv()

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Получение токенов из .env с проверкой
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN не найден в .env файле!")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY не найден в .env файле!")

# Инициализация бота и диспетчера
bot = Bot(token=TELEGRAM_BOT_TOKEN)
dp = Dispatcher()

# Инициализация Groq клиента
groq_client = Groq(api_key=GROQ_API_KEY)


# Инициализация базы данных
def init_db():
    conn = sqlite3.connect('homework_bot.db')
    cursor = conn.cursor()
    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS users
                   (
                       user_id
                       INTEGER
                       PRIMARY
                       KEY,
                       username
                       TEXT,
                       first_name
                       TEXT,
                       created_at
                       TIMESTAMP
                   )
                   ''')
    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS requests
                   (
                       id
                       INTEGER
                       PRIMARY
                       KEY
                       AUTOINCREMENT,
                       user_id
                       INTEGER,
                       question
                       TEXT,
                       answer
                       TEXT,
                       created_at
                       TIMESTAMP,
                       FOREIGN
                       KEY
                   (
                       user_id
                   ) REFERENCES users
                   (
                       user_id
                   )
                       )
                   ''')
    conn.commit()
    conn.close()


# Добавление пользователя в БД
def add_user(user_id: int, username: str, first_name: str):
    conn = sqlite3.connect('homework_bot.db')
    cursor = conn.cursor()
    cursor.execute('''
                   INSERT
                   OR IGNORE INTO users (user_id, username, first_name, created_at)
        VALUES (?, ?, ?, ?)
                   ''', (user_id, username, first_name, datetime.now()))
    conn.commit()
    conn.close()


# Сохранение запроса в БД
def save_request(user_id: int, question: str, answer: str):
    conn = sqlite3.connect('homework_bot.db')
    cursor = conn.cursor()
    cursor.execute('''
                   INSERT INTO requests (user_id, question, answer, created_at)
                   VALUES (?, ?, ?, ?)
                   ''', (user_id, question, answer, datetime.now()))
    conn.commit()
    conn.close()


# Получение ответа от Groq AI
async def get_ai_response(question: str) -> str:
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Ты - помощник для решения домашних заданий. Подробно объясняй решение задач, формул и упражнений. Отвечай на русском языке."
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=2048
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Ошибка при запросе к Groq API: {e}")
        return "Извините, произошла ошибка при обработке вашего запроса. Попробуйте позже."


# Обработчик команды /start
@dp.message(CommandStart())
async def cmd_start(message: Message):
    user_id = message.from_user.id
    username = message.from_user.username or ""
    first_name = message.from_user.first_name or ""

    add_user(user_id, username, first_name)

    welcome_text = (
        f"<b>👋 Привет, {first_name}!</b>\n\n"
        "🤖 Я - <b>ГДЗ бот с искусственным интеллектом</b>\n\n"
        "📚 <i>Отправь мне своё задание, и я помогу с решением!</i>\n\n"
        "💡 Можешь присылать:\n"
        "• Математические задачи\n"
        "• Вопросы по физике\n"
        "• Задания по химии\n"
        "• Любые другие учебные вопросы\n\n"
        "✨ <b>Просто напиши своё задание!</b>"
    )

    await message.answer(welcome_text, parse_mode=ParseMode.HTML)


# Обработчик текстовых сообщений
@dp.message(F.text)
async def handle_homework(message: Message):
    user_id = message.from_user.id
    question = message.text

    # Отправка сообщения о обработке
    processing_msg = await message.answer(
        "⏳ <i>Думаю над решением...</i>",
        parse_mode=ParseMode.HTML
    )

    # Получение ответа от ИИ
    answer = await get_ai_response(question)

    # Сохранение в базу данных
    save_request(user_id, question, answer)

    # Удаление сообщения о обработке
    await processing_msg.delete()

    # Отправка ответа
    response_text = (
        f"<b>📝 Ваш вопрос:</b>\n"
        f"<i>{question[:200]}{'...' if len(question) > 200 else ''}</i>\n\n"
        f"<b>💡 Решение:</b>\n"
        f"{answer}"
    )

    # Разбиваем на части, если ответ слишком длинный
    if len(response_text) > 4096:
        parts = [response_text[i:i + 4096] for i in range(0, len(response_text), 4096)]
        for part in parts:
            await message.answer(part, parse_mode=ParseMode.HTML)
    else:
        await message.answer(response_text, parse_mode=ParseMode.HTML)


# Обработчик фото (опционально)
@dp.message(F.photo)
async def handle_photo(message: Message):
    await message.answer(
        "📸 <b>Извините, я пока не умею распознавать текст с фотографий.</b>\n\n"
        "💬 <i>Пожалуйста, отправьте задание текстом.</i>",
        parse_mode=ParseMode.HTML
    )


# Главная функция
async def main():
    # Инициализация базы данных
    init_db()
    logger.info("База данных инициализирована")

    # Запуск бота
    logger.info("Бот запущен")
    await dp.start_polling(bot)


if __name__ == '__main__':
    asyncio.run(main())