'use strict';

/**
 * Bale Snake Game Bot
 *
 * Bale's Bot API is compatible with Telegram Bot API.
 * We override the base URL to point at tapi.bale.ai.
 *
 * Required env vars:
 *   BOT_TOKEN   – your Bale bot token
 *   MINIAPP_URL – public HTTPS URL where the game is hosted
 *                 e.g. https://yourdomain.com
 */

require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINIAPP_URL = process.env.MINIAPP_URL;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}

if (!MINIAPP_URL) {
  console.error('MINIAPP_URL is required');
  process.exit(1);
}

// Point the Telegram client at Bale's API endpoint
const bot = new TelegramBot(BOT_TOKEN, {
  polling: true,
  baseApiUrl: 'https://tapi.bale.ai/bot',
});

// ==========================================
// HELPER
// ==========================================

async function fetchLeaderboard() {
  const res = await fetch(`${MINIAPP_URL}/api/leaderboard?limit=10`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function formatLeaderboard(entries) {
  if (!entries.length) {
    return 'هنوز کسی در جدول امتیازات ثبت نشده! اول شما باشید 🎮';
  }

  const medals = ['🥇', '🥈', '🥉'];
  const lines = entries.map((e, i) => {
    const rank = medals[i] || `${i + 1}.`;
    const name = e.username ? `@${e.username}` : e.first_name;
    return `${rank} ${name}  —  ${e.score} امتیاز`;
  });

  return `🏆 *جدول برترین‌ها*\n\n${lines.join('\n')}`;
}

// ==========================================
// COMMANDS
// ==========================================

bot.onText(/\/start/, (msg) => {
  const name = msg.from?.first_name || 'دوست';

  bot.sendMessage(
    msg.chat.id,
    `سلام ${name}! 🐍\n\nبه *بازی مار* خوش آمدید.\nامتیاز کسب کنید و در جدول جهانی بدرخشید!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 شروع بازی',
              web_app: { url: MINIAPP_URL },
            },
          ],
          [
            {
              text: '🏆 جدول امتیازات',
              callback_data: 'show_leaderboard',
            },
          ],
        ],
      },
    }
  );
});

bot.onText(/\/leaderboard/, async (msg) => {
  try {
    const entries = await fetchLeaderboard();
    bot.sendMessage(msg.chat.id, formatLeaderboard(entries), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 بازی کن', web_app: { url: MINIAPP_URL } }],
        ],
      },
    });
  } catch {
    bot.sendMessage(msg.chat.id, '⚠️ خطا در دریافت جدول امتیازات. لطفاً بعداً تلاش کنید.');
  }
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `*راهنمای بازی مار* 🐍\n\n` +
      `/start – شروع و باز کردن بازی\n` +
      `/leaderboard – مشاهده جدول برترین‌ها\n` +
      `/help – نمایش این راهنما\n\n` +
      `*کنترل‌ها:*\n` +
      `• موبایل: جوی‌استیک لمسی\n` +
      `• کامپیوتر: کلیدهای جهت‌دار یا WASD\n` +
      `• توقف: Space یا P`,
    { parse_mode: 'Markdown' }
  );
});

// ==========================================
// CALLBACK QUERIES (inline keyboard buttons)
// ==========================================

bot.on('callback_query', async (query) => {
  if (query.data === 'show_leaderboard') {
    try {
      const entries = await fetchLeaderboard();
      bot.answerCallbackQuery(query.id);
      bot.sendMessage(query.message.chat.id, formatLeaderboard(entries), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 بازی کن', web_app: { url: MINIAPP_URL } }],
          ],
        },
      });
    } catch {
      bot.answerCallbackQuery(query.id, {
        text: 'خطا در دریافت جدول',
        show_alert: true,
      });
    }
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log('Bale Snake Game bot is running...');
