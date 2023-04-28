// reuse __VUE_DEVTOOLS_ (@vuejs/devtools) instance first
const hook = window.__VUE_DEVTOOLS_GLOBAL_HOOK__ ??= {
  events: new Map(),
  on(event, fn) {
    if (!this.events.has(event))
      this.events.set(event, [])

    this.events.get(event).push(fn)
  },
  emit(event, ...payload) {
    if (this.events.has(event))
      this.events.get(event).forEach(fn => fn(...payload))
  },
}

window.__GET_VUE_DEVTOOLS_GLOBAL_HOOK__ = function () {
  return hook
}

// print for iframe console
window.print = (...s) => {
  console.log('print', ...s)
}

const iframeId = '__vue_devtools_iframe__'

function injectDevtools() {
  const iframe = document.createElement('iframe')
  iframe.id = iframeId
  iframe.src = '/__devtools/'
  iframe.style.position = 'fixed'
  iframe.style.bottom = '0'
  iframe.style.left = '50%'
  iframe.style.outline = 'none'
  iframe.style.border = '1px solid rgba(125,125,125,0.2)'
  iframe.style.borderRadius = '8px'
  iframe.style.transform = 'translateX(-50%)'
  iframe.style.width = 'calc(80vw - 20px)'
  iframe.style.height = 'calc(60vh - 20px)'
  document.body.appendChild(iframe)
}

const performanceTimeline = []
let performanceTimelineSortId = 0
const performTimelineSortKey = {
  start: -1,
  end: 1,
}

window.__VUE_DEVTOOLS_GET_PERFORMANCE_TIMELINE__ = function () {
  const data = performanceTimeline
    // .sort((a, b) => a.sortId - b.sortId)
    .sort((a, b) => performTimelineSortKey[a.event.data.measure] - performTimelineSortKey[b.event.data.measure])
    .sort((a, b) => a.event.time - b.event.time)

  return data
}

hook.on('perf:start', (app, uid, component, type, time) => {
  const filename = component.type.__file?.match(/\/?([^/]+?)(\.[^/.]+)?$/)?.[1]
  const name = component.type.__name ?? component.type.name ?? filename
  if (!name)
    return

  performanceTimeline.push({
    layerId: 'performance',
    groupKey: `${uid}-${type}`,
    sortId: performanceTimelineSortId++,

    event: {
      title: name,
      subtitle: type,
      time,
      now: Date.now(),
      data: {
        component: name,
        // name,
        type,
        measure: 'start',
      },
    },
  })
})

hook.on('perf:end', async (app, uid, component, type, time) => {
  const filename = component.type.__file?.match(/\/?([^/]+?)(\.[^/.]+)?$/)?.[1]
  const name = component.type.__name ?? component.type.name ?? filename
  if (!name)
    return
  const item = performanceTimeline.reverse().find(item => item.groupKey === `${uid}-${type}`)
  performanceTimeline.push({
    layerId: 'performance',
    groupKey: `${uid}-${type}`,
    sortId: performanceTimelineSortId++,

    event: {
      title: name,
      subtitle: type,
      time,
      now: Date.now(),
      data: {
        component: name,
        // name,
        type,
        measure: 'end',
        duration: `${time - item.event.time}ms`,
      },
    },
  })
})

injectDevtools()
