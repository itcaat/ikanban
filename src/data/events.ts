import type { GameEventTemplate } from '../types';

export const EVENT_TEMPLATES: GameEventTemplate[] = [
  {
    type: 'fridayDeploy',
    title: 'ПЯТНИЧНЫЙ ДЕПЛОЙ',
    description: 'Все таймеры ускоряются x2!',
    duration: 8,
  },
  {
    type: 'investorCall',
    title: 'СОЗВОН С ИНВЕСТОРОМ',
    description: 'In Progress заблокирован!',
    duration: 5,
  },
  {
    type: 'coffeeBroken',
    title: 'КОФЕМАШИНА СЛОМАЛАСЬ',
    description: 'Кофе не восстанавливается!',
    duration: 10,
  },
  {
    type: 'internPushed',
    title: 'СТАЖЁР ПУШНУЛ В MAIN',
    description: '+3 хотфикса!',
    duration: 0,
  },
  {
    type: 'codeReview',
    title: 'CODE REVIEW',
    description: 'Задача вернулась из Done!',
    duration: 0,
  },
  {
    type: 'retro',
    title: 'РЕТРО',
    description: 'Все таймеры замедлены. Передышка!',
    duration: 6,
  },
];

export const COLUMN_TITLES: Record<string, string> = {
  backlog: 'BACKLOG',
  todo: 'TO DO',
  inProgress: 'IN PROGRESS',
  done: 'DONE',
};
