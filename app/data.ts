export type Project = {
  name: string
  description: string
  link: string
  video?: string
  id: string,
  images?: string[],
  tags?: string[],
}

export type BlogPost = {
  title: string
  description: string
  link: string
  uid: string
  date: string
  readingTime: string
}

type FunLink = {
  title: string
  description: string
  link: string
}

type SocialLink = {
  label: string
  link: string
}

export const STACK = ['Laravel', 'Symfony', 'Vue', 'Quasar', 'React', 'React Native']

export const PROJECTS: Project[] = [
  {
    name: 'Mytripline & Mytripliner',
    description:
      'Доработка сайта междугородних путешествий, приложения и сайта для водителей, сайта диспатчинга.',
    link: 'https://pro.motion-primitives.com/',
    video:
      '/test.mp4',
    id: 'project1',
    images: [
      '/img/Screenshot_3.png',
      '/img/Screenshot_1.png',
    ],
    tags: ['Мобильное приложение', 'Веб', '2024–2025'],
  },
]

export const BLOG_POSTS: BlogPost[] = [
  {
    title: 'ASCII-молния на canvas без библиотек',
    description:
      'Как устроена гроза на главной: дизеринг точками, генерация разряда и таймлайн вспышки.',
    link: '/blog/ascii-lightning',
    uid: 'ascii-lightning',
    date: '19 октября 2026',
    readingTime: '5 мин',
  },
]

export const FUN_LINKS: FunLink[] = [
  {
    title: 'Песочница с бомбами',
    description: 'Физическая игрушка: взрывай песок и блоки, бомбы детонируют цепочкой.',
    link: '/fun/pesochnica',
  },
  {
    title: 'Кружки из ТГ',
    description: 'Видеосообщения из Telegram.',
    link: '/krugi',
  },
  {
    title: 'Полгода целей',
    description: 'Дашборд целей на полгода: прогресс по неделям.',
    link: '/polgoda-celej',
  },
]

// newest first
export const VIDEO_NOTES: string[] = ['/krugi/1.mp4']

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Github',
    link: 'https://github.com/sagadav',
  },
  {
    label: 'Telegram',
    link: 'https://t.me/artursagadav',
  },
]
