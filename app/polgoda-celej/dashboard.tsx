'use client'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { renderDashboard } from './render'
import DATA from './data.json'
import './dashboard.css'

const MONO = 'font-[family-name:var(--font-geist-mono)]'
const CARD = 'glass min-w-0 rounded-2xl p-5'

function Tile({ label, sub, children }: { label: string; sub: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={CARD}>
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-50 tabular-nums">{children}</div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  )
}

function Card({ title, note, children }: { title: string; note: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={CARD}>
      <h3 className="font-medium text-zinc-50">{title}</h3>
      <p className="mt-1 mb-4 text-xs text-zinc-500">{note}</p>
      {children}
    </section>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-4 text-xl font-medium text-zinc-50">{children}</h2>
}

export function Dashboard() {
  const ref = useRef<HTMLDivElement>(null)
  const [d3Ready, setD3Ready] = useState(false)

  useEffect(() => {
    const root = ref.current
    // d3 is a plain script, so it lands on window
    const d3 = (window as unknown as { d3?: unknown }).d3
    if (!root || !d3Ready || !d3) return
    renderDashboard(root, d3, DATA)
    let width = window.innerWidth
    let timer = 0
    const onResize = () => {
      clearTimeout(timer)
      timer = window.setTimeout(() => {
        if (window.innerWidth === width) return
        width = window.innerWidth
        renderDashboard(root, d3, DATA)
      }, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [d3Ready])

  return (
    <div ref={ref} className="gp mt-16 flex flex-col gap-4">
      <Script src="/vendor/d3.v7.9.0.min.js" onReady={() => setD3Ready(true)} />
      <header className="mb-4">
        <p className={`${MONO} mb-2 text-xs tracking-widest text-sky-300 uppercase`}>{'// '}цели</p>
        <h1 className="text-4xl font-semibold tracking-tighter text-zinc-50 sm:text-5xl">Полгода целей</h1>
        <p className="mt-3 max-w-xl text-zinc-400">
          Апрель — октябрь 2026 по недельным отчётам. В зал хожу стабильно, связи пошли вверх с сентября, а жим и
          подсчёт калорий стоят на месте.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Tile label="Тренировок записано" sub="в неделях, где указано число">
          <span data-field="trainings_total">—</span>
        </Tile>
        <Tile label="Лучший присед" sub="сейчас рабочий меньше">
          <span data-field="best_squat">—</span> кг
        </Tile>
        <Tile label="Лучший жим" sub="на раз, в мае; дальше плато">
          <span data-field="best_bench">—</span> кг
        </Tile>
        <Tile
          label="Разговоров за 6 недель"
          sub={
            <>
              против <span data-field="talks_before">—</span> за 6 недель до этого
            </>
          }
        >
          <span data-field="talks_recent">—</span>
        </Tile>
      </div>

      <Card title="Где было движение" note="Оценка по тексту каждой недели: насколько заметно продвинулось каждое направление.">
        <div className="chart heat" id="heat" />
        <div className="legend">
          <span><i className="lg2" />заметный результат</span>
          <span><i className="lg1" />что-то сделано</span>
          <span><i className="lg0" />пусто</span>
          <span><i className="lgn" />нет записи</span>
        </div>
      </Card>

      <SectionTitle>Здоровье</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Тренировки в неделю" note="Пропуски — недели без числа. 20 июл–2 авг — две недели одной записью.">
          <div className="chart" id="train" />
        </Card>
        <Card title="Дни с подсчётом калорий" note="Из 7. Пунктир — цель 4 из 7, поставленная в конце мая.">
          <div className="chart" id="cal" />
        </Card>
        <Card
          title="Присед и жим"
          note={
            <>
              Записанные веса. Полые точки — рабочий вес. Вес тела в мае — <span id="body-weight">—</span> кг.
            </>
          }
        >
          <div className="chart" id="lifts" />
        </Card>
      </div>

      <SectionTitle>Связи</SectionTitle>
      <Card
        title="Разговоры и встречи по неделям"
        note="Каждый человек или встреча из отчётов, по каналу, откуда он. Наведи на столбец — увидишь, кто это был."
      >
        <div className="chart" id="talks" />
        <div className="legend" id="talks-legend" />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Откуда связи" note="Яркая часть — последние 6 недель, бледная — всё, что было до них.">
          <div className="chart" id="chan" />
        </Card>
        <Card title="Кто это был" note="Свежие сверху.">
          <div className="max-h-[26rem] overflow-auto">
            <table id="ct">
              <thead>
                <tr>
                  <th>Неделя</th>
                  <th>Кто</th>
                  <th>Канал</th>
                  <th>Как</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
