// Draws every chart and table of the goals dashboard into `root`. Plain d3, ported from
// the standalone page; d3 comes in as an argument because it is loaded as a script.

const M = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const C = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)']
const CH = ['Качалка', 'Друзья и семья', 'Коллеги', 'Random Coffee и айтишники', 'Threads']
const chColor = (ch) => C[Math.max(0, CH.indexOf(ch))]
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
const sum = (a) => a.reduce((s, v) => s + (v || 0), 0)

// Totals for the tiles: recorded trainings, best lifts, talks in the last 6 weeks vs the 6 before.
function summary(weeks, lifts) {
  const max = (a) => a.filter((v) => v !== null).reduce((m, v) => (m === null || v > m ? v : m), null)
  const best = (name) => max(lifts.filter((l) => l.lift === name).map((l) => num(l.weight)))
  const talks = weeks.map((w) => num(w.talks))
  return {
    trainings_total: sum(weeks.map((w) => num(w.trainings))),
    best_squat: best('Присед'),
    best_bench: best('Жим'),
    talks_recent: sum(talks.slice(-6)),
    talks_before: sum(talks.slice(-12, -6)),
  }
}

// One row per week and channel, with the names, for the stacked talks chart.
function channelWeek(weeks, contacts) {
  const out = []
  weeks.forEach((w) => {
    const cs = contacts.filter((c) => c.week === w.id)
    const chans = cs.map((c) => c.channel).filter((c, i, a) => a.indexOf(c) === i)
    if (!chans.length) out.push({ week: w.id, label: w.label, start: w.start, channel: '', n: 0, who: '' })
    chans.forEach((ch) => {
      const g = cs.filter((c) => c.channel === ch)
      out.push({ week: w.id, label: w.label, start: w.start, channel: ch, n: g.reduce((s, c) => s + Number(c.count), 0), who: g.map((c) => c.who).join(', ') })
    })
  })
  return out
}

// Contacts per channel: all time and the last 6 weeks.
function byChannel(weeks, contacts) {
  const recent = weeks.slice(-6).map((w) => w.id)
  const m = {}
  contacts.forEach((c) => {
    const r = m[c.channel] || (m[c.channel] = { channel: c.channel, total: 0, recent: 0 })
    const n = Number(c.count)
    r.total += n
    if (recent.indexOf(c.week) >= 0) r.recent += n
  })
  return Object.keys(m).map((k) => m[k]).sort((a, b) => b.total - a.total)
}

export function renderDashboard(root, d3, DATA) {
  const $ = (sel) => root.querySelector(sel)
  const parse = d3.utcParse('%Y-%m-%d')
  const ru = d3.formatLocale({ decimal: ',', thousands: ' ', grouping: [3], currency: ['', ' ₽'] })
  const fmt = ru.format(',')
  const fmtW = (v) => ru.format(',.1~f')(v)
  const dshort = (d) => d.getUTCDate() + ' ' + M[d.getUTCMonth()]

  function prep(box) {
    d3.select(box).selectAll('svg').remove()
    return box
  }

  function tip(box) {
    let t = box.querySelector('.tip')
    if (!t) {
      t = document.createElement('div')
      t.className = 'tip'
      box.appendChild(t)
    }
    return {
      show(lines, x, y) {
        t.replaceChildren()
        lines.forEach((l, i) => {
          const d = document.createElement('div')
          if (i === 0) d.className = 'h'
          if (l.color) {
            const s = document.createElement('span')
            s.className = 'sw'
            s.style.background = l.color
            d.appendChild(s)
          }
          d.appendChild(document.createTextNode(l.text))
          t.appendChild(d)
        })
        t.style.display = 'block'
        const bw = box.clientWidth, tw = t.offsetWidth, th = t.offsetHeight
        let left = x + 12
        if (left + tw > bw) left = Math.max(0, x - 12 - tw)
        t.style.left = left + 'px'
        t.style.top = Math.max(0, y - th - 8) + 'px'
      },
      hide() {
        t.style.display = 'none'
      },
    }
  }

  function textW(svg, cls, strs) {
    const g = svg.append('g')
    const w = d3.max(strs, (s) => g.append('text').attr('class', cls).text(s).node().getComputedTextLength()) || 0
    g.remove()
    return w
  }

  // Generic bars: rows, series [{key,name,color(r,i)}]
  function bars(box, rows, o) {
    const W = Math.max(240, box.clientWidth), H = o.h || 200
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    const vmax = o.yMax || d3.max(rows, (r) => d3.max(o.series, (s) => num(r[s.key]))) || 1
    const y = d3.scaleLinear([0, vmax], [H - 22, 8]).nice()
    const ticks = y.ticks(o.ticks || 4).filter((t) => Number.isInteger(t) || !o.intOnly)
    const tf = o.yFmt || fmt
    const ml = Math.ceil(textW(svg, 'tick', ticks.map(tf))) + 8, mr = 4
    const x = d3.scaleBand(rows.map((r, i) => i), [ml, W - mr]).paddingInner(0.25).paddingOuter(0.1)
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', ml).attr('x2', W - mr).attr('y1', (d) => y(d)).attr('y2', (d) => y(d)).style('stroke', 'var(--chart-grid)')
    svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'tick').attr('x', ml - 6).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text(tf)
    const ns = o.series.length
    const inner = d3.scaleBand(o.series.map((s, i) => i), [0, x.bandwidth()]).paddingInner(ns > 1 ? 0.12 : 0)
    const bw = Math.min(inner.bandwidth(), 32)
    const g = svg.append('g')
    rows.forEach((r, i) => {
      o.series.forEach((s, j) => {
        const v = num(r[s.key])
        const cx = x(i) + inner(j) + inner.bandwidth() / 2
        if (v === null) {
          if (o.showMissing) g.append('line').attr('x1', cx - bw / 4).attr('x2', cx + bw / 4).attr('y1', y(0) - 1).attr('y2', y(0) - 1).style('stroke', 'var(--chart-muted)').attr('stroke-width', 2).attr('stroke-linecap', 'round')
          return
        }
        const h = Math.max(2, y(0) - y(v))
        g.append('rect').attr('x', cx - bw / 2).attr('width', bw).attr('y', y(0) - h).attr('height', h).attr('rx', 4).style('fill', s.color(r, i)).attr('class', 'bar b' + i)
      })
    })
    svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'var(--chart-axis)')
    if (o.goal != null) {
      svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(o.goal)).attr('y2', y(o.goal)).style('stroke', 'var(--chart-reference)').attr('stroke-dasharray', '4 3')
    }
    const labels = rows.map(o.xLabel)
    const lw = textW(svg, 'tick', labels)
    const k = Math.max(1, Math.ceil((lw + 10) / x.step()))
    svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'tick').attr('text-anchor', 'middle').attr('x', (r, i) => x(i) + x.bandwidth() / 2).attr('y', H - 4).text((r, i) => ((rows.length - 1 - i) % k === 0 ? labels[i] : ''))
    const t = tip(box)
    svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r, i) => x(i) - (x.step() - x.bandwidth()) / 2).attr('width', x.step()).attr('y', 0).attr('height', H - 22).style('fill', 'transparent')
      .on('mousemove', function (ev, r) {
        const i = rows.indexOf(r)
        g.selectAll('.bar').attr('opacity', 0.45)
        g.selectAll('.b' + i).attr('opacity', 1)
        const [mx, my] = d3.pointer(ev, box)
        const lines = [{ text: r.label }].concat(o.series.map((s) => ({ color: ns > 1 ? s.color(r, i) : null, text: (ns > 1 ? s.name + ': ' : '') + (num(r[s.key]) === null ? 'нет данных' : (o.tipFmt || fmt)(num(r[s.key]))) + (o.unit ? ' ' + o.unit : '') })))
        t.show(lines, mx, my)
      })
      .on('mouseleave', () => {
        g.selectAll('.bar').attr('opacity', 1)
        t.hide()
      })
  }

  function heat(box, rows) {
    const areas = [['s_money', 'Деньги'], ['s_health', 'Здоровье'], ['s_social', 'Связи'], ['s_fame', 'Популярность']]
    const W = Math.max(240, box.clientWidth), rh = 20, gap = 3, H = areas.length * (rh + gap) + 20
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    const ml = Math.ceil(textW(svg, 'tick', areas.map((a) => a[1]))) + 10
    const x = d3.scaleBand(rows.map((r, i) => i), [ml, W]).paddingInner(0.12)
    const fill = (v) => (v === 2 || v === 1 ? C[0] : v === 0 ? 'var(--chart-grid)' : 'transparent')
    areas.forEach(([k, name], ai) => {
      const yy = ai * (rh + gap)
      svg.append('text').attr('class', 'tick').attr('x', 0).attr('y', yy + rh / 2).attr('dy', '0.32em').text(name)
      rows.forEach((r, i) => {
        const v = num(r[k])
        svg.append('rect').attr('x', x(i)).attr('y', yy).attr('width', x.bandwidth()).attr('height', rh).attr('rx', 3)
          .style('fill', fill(v)).attr('fill-opacity', v === 1 ? 0.38 : 1)
          .style('stroke', v === null ? 'var(--chart-muted)' : 'none').attr('stroke-dasharray', v === null ? '2 2' : null)
          .attr('class', 'cell').datum({ r, name, v })
      })
    })
    let lastM = -1, lastX = -999
    rows.forEach((r, i) => {
      const m = parse(r.start).getUTCMonth()
      if (m !== lastM && x(i) - lastX > 28) {
        svg.append('text').attr('class', 'tick').attr('x', x(i)).attr('y', H - 4).text(MS[m])
        lastX = x(i)
      }
      lastM = m
    })
    const t = tip(box)
    const word = (v) => (v === 2 ? 'заметный результат' : v === 1 ? 'что-то сделано' : v === 0 ? 'пусто' : 'нет записи')
    svg.selectAll('.cell').on('mousemove', function (ev, d) {
      const [mx, my] = d3.pointer(ev, box)
      t.show([{ text: d.r.label }, { text: d.name + ': ' + word(d.v) }], mx, my)
      d3.select(this).style('stroke', 'var(--fg)').attr('stroke-dasharray', null)
    }).on('mouseleave', function (ev, d) {
      t.hide()
      d3.select(this).style('stroke', d.v === null ? 'var(--chart-muted)' : 'none').attr('stroke-dasharray', d.v === null ? '2 2' : null)
    })
  }

  function liftChart(box, rows) {
    const order = ['Присед', 'Жим']
    const pts = rows.filter((r) => order.includes(r.lift)).map((r) => ({ ...r, d: parse(r.date), w: num(r.weight) }))
    const W = Math.max(240, box.clientWidth), H = 200
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    const y = d3.scaleLinear([d3.min(pts, (p) => p.w) - 5, d3.max(pts, (p) => p.w) + 5], [H - 22, 10]).nice()
    const ticks = y.ticks(4)
    const ml = Math.ceil(textW(svg, 'tick', ticks.map(fmtW))) + 8
    const series = order.map((name, i) => {
      const p = pts.filter((q) => q.lift === name).sort((a, b) => a.d - b.d)
      return { name, i, p, last: p[p.length - 1] }
    })
    const endTxt = (s) => s.name + ' ' + fmtW(s.last.w)
    const mr = Math.ceil(textW(svg, 'endlbl', series.map(endTxt))) + 12
    const x = d3.scaleUtc(d3.extent(pts, (p) => p.d), [ml, W - mr])
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', ml).attr('x2', W - mr).attr('y1', (d) => y(d)).attr('y2', (d) => y(d)).style('stroke', 'var(--chart-grid)')
    svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'tick').attr('x', ml - 6).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text(fmtW)
    const months = d3.utcMonth.range(d3.utcMonth.ceil(x.domain()[0]), x.domain()[1])
    const step = Math.max(1, Math.ceil(months.length / Math.max(1, Math.floor((W - ml - mr) / 40))))
    svg.append('g').selectAll('text').data(months.filter((m, i) => i % step === 0)).join('text').attr('class', 'tick').attr('text-anchor', 'middle').attr('x', (d) => x(d)).attr('y', H - 4).text((d) => MS[d.getUTCMonth()])
    const line = d3.line().x((p) => x(p.d)).y((p) => y(p.w))
    series.forEach((s) => {
      svg.append('path').datum(s.p).attr('d', line).style('fill', 'none').style('stroke', C[s.i]).attr('stroke-width', 2).attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
      svg.append('g').selectAll('circle').data(s.p).join('circle').attr('cx', (p) => x(p.d)).attr('cy', (p) => y(p.w)).attr('r', 3.5)
        .style('fill', (p) => (p.kind === 'рабочий' ? 'var(--panel)' : C[s.i])).style('stroke', C[s.i]).attr('stroke-width', 1.5)
    })
    const ends = series.map((s) => ({ s, y: y(s.last.w) }))
    if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 14) {
      const mid = (ends[0].y + ends[1].y) / 2, up = ends[0].y <= ends[1].y ? 0 : 1
      ends[up].y = mid - 7
      ends[1 - up].y = mid + 7
    }
    ends.forEach((e) => svg.append('text').attr('class', 'endlbl').attr('x', x(e.s.last.d) + 8).attr('y', e.y).attr('dy', '0.32em').style('fill', C[e.s.i]).text(endTxt(e.s)))
    const t = tip(box)
    const hi = svg.append('circle').attr('r', 6).style('fill', 'none').attr('stroke-width', 2).attr('opacity', 0)
    svg.append('rect').attr('x', ml).attr('y', 0).attr('width', W - ml - mr).attr('height', H - 22).style('fill', 'transparent')
      .on('mousemove', function (ev) {
        const [px, py] = d3.pointer(ev, svg.node())
        const p = d3.least(pts, (q) => Math.hypot(x(q.d) - px, y(q.w) - py))
        if (!p) return
        const si = order.indexOf(p.lift)
        hi.attr('cx', x(p.d)).attr('cy', y(p.w)).style('stroke', C[si]).attr('opacity', 1)
        const [mx, my] = d3.pointer(ev, box)
        const reps = p.reps ? ' × ' + p.reps : ''
        t.show([{ text: dshort(p.d) }, { color: C[si], text: p.lift + ': ' + fmtW(p.w) + ' кг' + reps + ' (' + p.kind + ')' }], mx, my)
      })
      .on('mouseleave', () => {
        hi.attr('opacity', 0)
        t.hide()
      })
  }

  function stackChart(box, cw) {
    const order = []
    const byWeek = {}
    cw.forEach((r) => {
      if (!byWeek[r.week]) {
        byWeek[r.week] = { week: r.week, label: r.label, start: r.start, segs: [] }
        order.push(r.week)
      }
      if (r.channel) byWeek[r.week].segs.push(r)
    })
    const rows = order.map((id) => byWeek[id])
    rows.forEach((r) => {
      r.segs.sort((a, b) => CH.indexOf(a.channel) - CH.indexOf(b.channel))
      r.total = r.segs.reduce((s, x) => s + num(x.n), 0)
    })
    const W = Math.max(240, box.clientWidth), H = 220
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    const y = d3.scaleLinear([0, d3.max(rows, (r) => r.total) || 1], [H - 22, 8]).nice()
    const ticks = y.ticks(4).filter(Number.isInteger)
    const ml = Math.ceil(textW(svg, 'tick', ticks.map(fmt))) + 8, mr = 4
    const x = d3.scaleBand(rows.map((r, i) => i), [ml, W - mr]).paddingInner(0.25).paddingOuter(0.1)
    const bw = Math.min(x.bandwidth(), 32)
    svg.append('g').selectAll('line').data(ticks).join('line').attr('x1', ml).attr('x2', W - mr).attr('y1', (d) => y(d)).attr('y2', (d) => y(d)).style('stroke', 'var(--chart-grid)')
    svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'tick').attr('x', ml - 6).attr('y', (d) => y(d)).attr('dy', '0.32em').attr('text-anchor', 'end').text(fmt)
    const g = svg.append('g')
    rows.forEach((r, i) => {
      const cx = x(i) + x.bandwidth() / 2
      let acc = 0
      r.segs.forEach((s, j) => {
        const v = num(s.n)
        const y0 = y(acc), y1 = y(acc + v)
        const top = j === r.segs.length - 1
        g.append('rect').attr('x', cx - bw / 2).attr('width', bw).attr('y', y1).attr('height', Math.max(1, y0 - y1 - (top ? 0 : 1)))
          .attr('rx', top ? 4 : 1).style('fill', chColor(s.channel)).attr('class', 'bar b' + i)
        acc += v
      })
    })
    svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(0)).attr('y2', y(0)).style('stroke', 'var(--chart-axis)')
    const labels = rows.map((r) => dshort(parse(r.start)))
    const k = Math.max(1, Math.ceil((textW(svg, 'tick', labels) + 10) / x.step()))
    svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'tick').attr('text-anchor', 'middle').attr('x', (r, i) => x(i) + x.bandwidth() / 2).attr('y', H - 4).text((r, i) => ((rows.length - 1 - i) % k === 0 ? labels[i] : ''))
    const t = tip(box)
    svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r, i) => x(i) - (x.step() - x.bandwidth()) / 2).attr('width', x.step()).attr('y', 0).attr('height', H - 22).style('fill', 'transparent')
      .on('mousemove', function (ev, r) {
        const i = rows.indexOf(r)
        g.selectAll('.bar').attr('opacity', 0.45)
        g.selectAll('.b' + i).attr('opacity', 1)
        const [mx, my] = d3.pointer(ev, box)
        const lines = [{ text: r.label + ' · ' + fmt(r.total) }]
        if (!r.segs.length) lines.push({ text: 'никого' })
        r.segs.forEach((s) => lines.push({ color: chColor(s.channel), text: s.who }))
        t.show(lines, mx, my)
      })
      .on('mouseleave', () => {
        g.selectAll('.bar').attr('opacity', 1)
        t.hide()
      })
  }

  function chanChart(box, rows) {
    const W = Math.max(240, box.clientWidth), rh = 40, H = rows.length * rh
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('height', H).attr('viewBox', `0 0 ${W} ${H}`)
    const valTxt = (r) => fmt(num(r.total)) + ' · ' + fmt(num(r.recent)) + ' за 6 нед.'
    const vw = Math.ceil(textW(svg, 'tick', rows.map(valTxt))) + 10
    const x = d3.scaleLinear([0, d3.max(rows, (r) => num(r.total)) || 1], [0, Math.max(40, W - vw)])
    rows.forEach((r, i) => {
      const yy = i * rh, c = chColor(r.channel), tot = num(r.total), rec = num(r.recent)
      svg.append('text').attr('class', 'tick').attr('x', 0).attr('y', yy + 12).text(r.channel)
      const by = yy + 18, bh = 14
      svg.append('rect').attr('x', 0).attr('y', by).attr('height', bh).attr('width', Math.max(4, x(tot))).attr('rx', 4).style('fill', c).attr('opacity', 0.3)
      if (rec > 0) svg.append('rect').attr('x', Math.max(0, x(tot) - x(rec))).attr('y', by).attr('height', bh).attr('width', Math.max(4, x(rec))).attr('rx', 4).style('fill', c)
      svg.append('text').attr('class', 'tick').attr('x', Math.max(4, x(tot)) + 6).attr('y', by + bh / 2).attr('dy', '0.32em').text(valTxt(r))
    })
  }

  function contactsTable(rows) {
    const tb = $('#ct tbody')
    tb.replaceChildren()
    rows.slice().reverse().forEach((r) => {
      const tr = document.createElement('tr')
      const w = document.createElement('td')
      w.className = 'd'
      w.textContent = r.week_label
      const who = document.createElement('td')
      who.textContent = r.who
      if (r.note) {
        const n = document.createElement('div')
        n.className = 'sub'
        n.textContent = r.note
        who.appendChild(n)
      }
      const ch = document.createElement('td')
      ch.className = 'a'
      const i = document.createElement('i')
      i.style.background = chColor(r.channel)
      ch.append(i, document.createTextNode(r.channel))
      const f = document.createElement('td')
      f.className = 'd'
      f.textContent = r.format
      tr.append(w, who, ch, f)
      tb.appendChild(tr)
    })
  }

  const { weeks, lifts, contacts } = DATA

  const sm = summary(weeks, lifts)
  root.querySelectorAll('[data-field]').forEach((el) => {
    const v = sm[el.dataset.field]
    el.textContent = v === null || v === undefined ? '—' : el.dataset.field.startsWith('best_') ? fmtW(v) : fmt(v)
  })
  const bodyWeight = lifts.find((r) => r.id === 'l02')
  $('#body-weight').textContent = bodyWeight ? fmtW(num(bodyWeight.weight)) : '—'

  const wl = (r) => dshort(parse(r.start))
  heat(prep($('#heat')), weeks)
  bars(prep($('#train')), weeks, { series: [{ key: 'trainings', name: 'Тренировки', color: () => C[1] }], xLabel: wl, showMissing: true, intOnly: true, yMax: 5 })
  bars(prep($('#cal')), weeks.filter((r) => num(r.calories_days) !== null), { series: [{ key: 'calories_days', name: 'Дни', color: () => C[1] }], xLabel: wl, yMax: 7, goal: 4, intOnly: true, unit: 'из 7' })
  liftChart(prep($('#lifts')), lifts)

  const tl = $('#talks-legend')
  tl.replaceChildren()
  CH.forEach((ch) => {
    const sp = document.createElement('span')
    const i = document.createElement('i')
    i.style.background = chColor(ch)
    sp.append(i, document.createTextNode(ch))
    tl.appendChild(sp)
  })

  stackChart(prep($('#talks')), channelWeek(weeks, contacts))
  chanChart(prep($('#chan')), byChannel(weeks, contacts))
  contactsTable(contacts)
}
