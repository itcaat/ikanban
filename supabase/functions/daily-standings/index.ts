import { getSupabaseClient, assertAuth, jsonResponse } from "../_shared/supabase.ts";
import { getCurrentTournamentId, formatDateRange, daysLeft } from "../_shared/tournament.ts";
import { sendTelegram, formatLeaderboard, pickRandom } from "../_shared/telegram.ts";
import { fetchTop, countPlayers } from "../_shared/queries.ts";

const DAILY_PHRASES = [
  "Обеденный перерыв. Самое время проверить кто впереди.",
  "Ежедневная сводка с канбан-фронта:",
  "Пока ты читаешь это — кто-то закрывает таски.",
  "Текущие лидеры. Может, пора их подвинуть?",
  "Полдень. Солнце в зените. Бэклог в огне. Вот кто справляется:",
  "Стендап окончен. Вот кто реально работает:",
  "Напоминаем: таски сами себя не закроют. А эти люди — закрывают:",
  "Ситуация на доске. Спойлер: ты можешь лучше.",
  "Дневной чекпоинт. Кто тут канбан-герой?",
  "Промежуточные результаты. Финал — в пятницу.",
  "Кофе выпит, стендап пережит. Вот текущий расклад:",
  "Ежедневная доза мотивации (или демотивации):",
  "Кто-то уже на первом месте. А ты?",
  "Обновление рейтинга. Интрига сохраняется.",
  "Турнир в разгаре. Вот кто пока впереди:",
];

Deno.serve(async (req) => {
  try {
    assertAuth(req);
    const supabase = getSupabaseClient();

    const tournamentId = getCurrentTournamentId();
    const range = formatDateRange(tournamentId);
    const remaining = daysLeft(tournamentId);

    const top10 = await fetchTop(supabase, tournamentId, 10);
    const total = await countPlayers(supabase, tournamentId);

    let message = `${pickRandom(DAILY_PHRASES)}\n\n📊 <b>Текущий рейтинг турнира</b>\n📅 ${range}\n\n`;

    if (top10.length > 0) {
      message += formatLeaderboard(top10);
      message += `\n\nВсего участников: ${total}`;
      if (remaining > 0) {
        message += `\n⏳ До конца турнира: ${remaining} дн.`;
      }
    } else {
      message += "Пока никто не играл. Будь первым!";
    }

    message += `\n\n🎮 <a href="https://ikanban.ru">Играть</a>`;

    const result = await sendTelegram(message);
    return jsonResponse(result, result.ok ? 200 : 500);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("Unauthorized")) return new Response("Unauthorized", { status: 401 });
    return jsonResponse({ error: msg }, 500);
  }
});
