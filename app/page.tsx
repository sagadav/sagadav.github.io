'use client'
import { motion } from 'motion/react'
import { ArrowDownIcon, XIcon } from 'lucide-react'
import { Magnetic } from '@/components/ui/magnetic'
import { TextEffect } from '@/components/ui/text-effect'
import { AsciiLightning } from '@/components/ui/ascii-lightning'
import {
  Carousel,
  CarouselContent,
  CarouselNavigation,
  CarouselIndicator,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogClose,
  MorphingDialogContainer,
} from '@/components/ui/morphing-dialog'
import { PROJECTS, SOCIAL_LINKS, STACK } from './data'
import type { Project } from './data'

const VARIANTS_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const VARIANTS_SECTION = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const TRANSITION_SECTION = {
  duration: 0.4,
}

const MONO = 'font-[family-name:var(--font-geist-mono)]'

type ProjectVideoProps = {
  project: Project,
}

function ProjectVideo({ project }: ProjectVideoProps) {
  const src = project.video
  return (
    <MorphingDialog
      transition={{
        type: 'spring',
        bounce: 0,
        duration: 0.3,
      }}
    >
      <MorphingDialogTrigger>
        {
          project.video ?
            <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="aspect-video w-full cursor-zoom-in rounded-xl object-cover"
          />
          : <img src={project.images ? project.images[0] : ''}
          alt={project.name}
          className="aspect-video w-full cursor-zoom-in rounded-xl object-cover"
          />
        }
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className="glass my-auto max-h-[100svh] w-full max-w-screen-md overflow-y-auto rounded-2xl pb-6">
          <div className="relative w-full">
            <Carousel>
              <CarouselContent>
                {
                  project.video &&
                  <CarouselItem className="p-4">
                    <div className="relative aspect-video max-h-[60vh] rounded-2xl bg-zinc-950 p-1 ring-1 ring-white/10 ring-inset">
                      <video
                        src={src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="aspect-video max-h-[60vh] w-full rounded-xl"
                      />
                    </div>
                  </CarouselItem>
                }

                {
                  project.images?.map((el, i) =>
                    <CarouselItem key={i} className="p-4">
                      <div className="relative aspect-video max-h-[50vh] rounded-2xl bg-zinc-950 p-1 ring-1 ring-white/10 ring-inset">
                        <div
                          style={{ backgroundImage: `url(${el})` }}
                          className="aspect-video max-h-[50vh] w-full rounded-xl bg-cover"
                        />
                      </div>
                    </CarouselItem>
                  )
                }
              </CarouselContent>
              <CarouselNavigation className="left-0 w-full" alwaysShow />
              <CarouselIndicator />
            </Carousel>
          </div>
          <div className="mx-6 mt-6 space-y-3 text-zinc-300">
            <h4 className="text-lg font-medium text-zinc-50">{project.name}</h4>
            <p>На первом слайде приложение для водителей сервиса mytripline.</p>
            <p>
              Скачать можно по ссылкам:{' '}
              <a href="https://play.google.com/store/apps/details?id=org.capacitor.mytripline.app" target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">Google Play</a>
              {' · '}
              <a href="https://apps.apple.com/ru/app/mytripliner/id1668656764" target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline">App Store</a>
            </p>
            <p>На втором слайде показана функция отслеживания водителей в реальном времени из приложения, которую я реализовал.</p>
            <p>На третьем слайде страница входа на сайт для водителей, которую я сделал: <a className="text-sky-300 hover:underline" href="https://drivermytripline.com/" target="_blank" rel="noopener noreferrer">drivermytripline.com</a>.</p>
            <p className={`${MONO} text-xs text-zinc-500`}>июнь 2024 — март 2025</p>
          </div>
        </MorphingDialogContent>
        <MorphingDialogClose
          className="fixed top-6 right-6 h-fit w-fit rounded-full bg-zinc-100 p-1"
          variants={{
            initial: { opacity: 0 },
            animate: {
              opacity: 1,
              transition: { delay: 0.3, duration: 0.1 },
            },
            exit: { opacity: 0, transition: { duration: 0 } },
          }}
        >
          <XIcon className="h-5 w-5 text-zinc-700" />
        </MorphingDialogClose>
      </MorphingDialogContainer>
    </MorphingDialog>
  )
}

function MagneticLink({
  children,
  link,
  external,
}: {
  children: React.ReactNode
  link: string
  external?: boolean
}) {
  return (
    <Magnetic springOptions={{ bounce: 0 }} intensity={0.3}>
      <a
        href={link}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-zinc-100 transition-colors duration-200 hover:border-sky-300/60 hover:text-sky-200"
      >
        {children}
      </a>
    </Magnetic>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className={`${MONO} mb-2 text-xs tracking-widest text-sky-300 uppercase`}>
      {'// '}{children}
    </p>
  )
}

export default function Personal() {
  return (
    <motion.main
      className="space-y-16"
      variants={VARIANTS_CONTAINER}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
        className="relative flex min-h-[72svh] flex-col justify-center pt-12 pb-8"
      >
        <div className="pointer-events-none absolute -top-24 bottom-0 right-[calc(50%-50vw)] left-[55%] opacity-50 [mask-image:linear-gradient(to_right,transparent,black_30%)] sm:left-[45%] sm:opacity-100">
          <AsciiLightning />
        </div>
        <SectionLabel>fullstack-developer</SectionLabel>
        <h1 className="relative text-5xl font-semibold tracking-tighter text-zinc-50 sm:text-7xl">
          Сагадеев<br />Артур
        </h1>
        <TextEffect
          as="p"
          preset="fade"
          per="word"
          delay={0.4}
          className="relative mt-6 max-w-md text-lg text-zinc-300"
        >
          Имею опыт работы с Laravel, Django на бэкенде. Vue, React на фронтенде.
        </TextEffect>
        <ul className={`${MONO} relative mt-6 flex flex-wrap gap-2 text-xs`}>
          {STACK.map((tech) => (
            <li key={tech} className="glass rounded-md px-2.5 py-1 text-zinc-300">
              {tech}
            </li>
          ))}
        </ul>
        <div className="relative mt-10 flex flex-wrap items-center gap-3">
          <MagneticLink link="#portfolio">
            Портфолио <ArrowDownIcon className="h-4 w-4" />
          </MagneticLink>
          {SOCIAL_LINKS.map((link) => (
            <MagneticLink key={link.label} link={link.link} external>
              {link.label} <span aria-hidden="true">↗</span>
            </MagneticLink>
          ))}
        </div>
      </motion.section>

      <motion.section
        id="portfolio"
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
        className="glass scroll-mt-8 rounded-3xl p-5 sm:p-8"
      >
        <SectionLabel>портфолио</SectionLabel>
        <h2 className="text-2xl font-medium text-zinc-50">Проекты</h2>
        <p className="mt-1 mb-6 text-sm text-zinc-500">Публикую только с разрешения заказчика.</p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {PROJECTS.map((project) => (
            <article key={project.id} className="group space-y-3">
              <div className="relative rounded-2xl bg-zinc-950/60 p-1 ring-1 ring-white/10 transition duration-300 ring-inset group-hover:shadow-[0_0_40px_-10px_rgba(120,180,255,0.4)] group-hover:ring-sky-300/40">
                <ProjectVideo project={project} />
              </div>
              <div className="px-1">
                <h3 className="font-medium text-zinc-50">{project.name}</h3>
                <p className="mt-1 text-zinc-400">{project.description}</p>
                {project.tags && (
                  <ul className={`${MONO} mt-3 flex flex-wrap gap-1.5 text-[11px] text-zinc-400`}>
                    {project.tags.map((tag) => (
                      <li key={tag} className="rounded border border-white/10 px-1.5 py-0.5">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}
