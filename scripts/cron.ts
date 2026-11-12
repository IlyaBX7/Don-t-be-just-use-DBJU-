// Нагадування за часом (повернення завтра, прострочення, «сьогодні забирати»).
// Сайт запускає їх і сам, коли користувачі відкривають сповіщення; цей скрипт — для cron на сервері:
//   */15 * * * * cd /шлях/до/dbju && npm run cron
import { runSweep } from "../src/lib/scheduler";

runSweep()
  .then((r) => {
    console.log(`Нагадування: створено ${r.created} (повтори пропущено)`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
