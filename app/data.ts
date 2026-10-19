export type Project = {
  name: string
  description: string
  link: string
  video?: string
  id: string,
  images?: string[],
  tags?: string[],
}

type SocialLink = {
  label: string
  link: string
}

export const STACK = ['Laravel', 'Django', 'Vue', 'React']

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

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Github',
    link: 'https://github.com/sagadav',
  },
]
