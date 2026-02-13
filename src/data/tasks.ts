import type { TaskTemplate, TaskType } from '../types';

export const TASK_TEMPLATES: TaskTemplate[] = [
  // Bugs
  { title: 'Кнопка работает только по четвергам', type: 'bug' },
  { title: 'CSS сломался в IE', type: 'bug' },
  { title: 'Форма отправляется 3 раза', type: 'bug' },
  { title: 'Пароль виден в URL', type: 'bug' },
  { title: 'Дата рождения из будущего', type: 'bug' },
  { title: 'Аватарка отображается вверх ногами', type: 'bug' },
  { title: 'Кнопка "Отмена" сохраняет данные', type: 'bug' },
  { title: 'Логин работает без пароля', type: 'bug' },
  { title: 'Уведомления приходят вчерашние', type: 'bug' },
  { title: 'Тёмная тема светлее светлой', type: 'bug' },
  { title: 'Поиск находит всё кроме нужного', type: 'bug' },
  { title: 'Скролл работает только влево', type: 'bug' },

  // Features
  { title: 'Добавить AI в логин-форму', type: 'feature' },
  { title: 'Сделать тёмную тему для тёмной темы', type: 'feature' },
  { title: 'Добавить блокчейн в TODO-лист', type: 'feature' },
  { title: 'Кнопка "Мне повезёт" в CRM', type: 'feature' },
  { title: 'Интеграция с холодильником', type: 'feature' },
  { title: 'Добавить NFT к аватаркам', type: 'feature' },
  { title: 'Виджет погоды в банковском приложении', type: 'feature' },
  { title: 'Добавить лайки к ошибкам', type: 'feature' },
  { title: 'Сделать приложение метавселенной', type: 'feature' },
  { title: 'AR-превью для текстовых файлов', type: 'feature' },

  // Hotfixes
  { title: 'ПРОД УПАЛ, ВСЁ ГОРИТ', type: 'hotfix' },
  { title: 'БД удалилась сама', type: 'hotfix' },
  { title: 'Деньги списываются дважды', type: 'hotfix' },
  { title: 'Пуши шлются CEO', type: 'hotfix' },
  { title: 'Логи пишутся в /dev/null', type: 'hotfix' },
  { title: 'SSL истёк 3 дня назад', type: 'hotfix' },
  { title: 'Бэкап — это README.md', type: 'hotfix' },
  { title: 'Миграции откатились в 2019', type: 'hotfix' },

  // Meetings
  { title: 'Синк по синку синков', type: 'meeting' },
  { title: 'Стендап на 2 часа', type: 'meeting' },
  { title: 'Ретро по ретро', type: 'meeting' },
  { title: 'Планирование планирования', type: 'meeting' },
  { title: 'Созвон "можно было письмом"', type: 'meeting' },
  { title: 'Демо без подготовки', type: 'meeting' },
  { title: 'Брейншторм в пятницу в 17:00', type: 'meeting' },
  { title: '1-on-1 с 8 людьми', type: 'meeting' },
  { title: 'Воркшоп по Agile для Agile-команды', type: 'meeting' },

  // Absurd
  { title: 'Объяснить бабушке Git', type: 'absurd' },
  { title: 'Починить интернет', type: 'absurd' },
  { title: 'Перевести легаси с COBOL', type: 'absurd' },
  { title: 'Выжить на стендапе', type: 'absurd' },
  { title: 'Сделать "быстренько"', type: 'absurd' },
  { title: 'Нарисовать 7 красных линий', type: 'absurd' },
  { title: 'Настроить принтер', type: 'absurd' },
  { title: 'Написать тесты на тесты', type: 'absurd' },
  { title: 'Оценить задачу за 5 минут', type: 'absurd' },
  { title: 'Сделать MVP за выходные', type: 'absurd' },
  { title: 'Разобраться в чужом коде', type: 'absurd' },
  { title: 'Найти баг без логов', type: 'absurd' },
  { title: 'Обновить зависимости без слёз', type: 'absurd' },
  { title: 'Пройти код-ревью с первой попытки', type: 'absurd' },
  { title: 'Объяснить менеджеру техдолг', type: 'absurd' },
  { title: 'Центрировать div', type: 'absurd' },
];

export const TASK_CONFIG: Record<TaskType, {
  maxTime: number;
  workTime: number;
  points: number;
  damage: number;
}> = {
  bug: { maxTime: 22, workTime: 3, points: 10, damage: 8 },
  feature: { maxTime: 30, workTime: 5, points: 25, damage: 12 },
  hotfix: { maxTime: 12, workTime: 2, points: 30, damage: 15 },
  meeting: { maxTime: 25, workTime: 4, points: 5, damage: 6 },
  absurd: { maxTime: 35, workTime: 6, points: 50, damage: 15 },
};

export const TASK_COLORS: Record<TaskType, string> = {
  bug: '#ffe600',
  feature: '#00d4ff',
  hotfix: '#ff3b3b',
  meeting: '#8e8e93',
  absurd: '#bf5af2',
};

export const TASK_LABELS: Record<TaskType, string> = {
  bug: 'BUG',
  feature: 'FEATURE',
  hotfix: 'HOTFIX',
  meeting: 'MEETING',
  absurd: '???',
};
