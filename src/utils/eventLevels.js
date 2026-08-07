export function endOfRange({ dateRange, unit = 'day', localizer }) {
  return {
    first: dateRange[0],
    last: localizer.add(dateRange[dateRange.length - 1], 1, unit),
  }
}

// properly calculating segments requires working with dates in
// the timezone we're working with, so we use the localizer
//
// `rangeInfo` is an optional `{ first, last, slots }` (see `endOfRange`,
// plus the `slots` day-diff between them) precomputed by the caller. It's
// identical for every event sharing the same `range`, so a caller mapping
// this over many events (DateSlotMetrics) can compute it once instead of
// paying for `endOfRange`'s `localizer.add` and an extra `localizer.diff`
// on every single call.
export function eventSegments(event, range, accessors, localizer, rangeInfo) {
  let { first, last, slots } =
    rangeInfo ||
    (() => {
      const bounds = endOfRange({ dateRange: range, localizer })
      return {
        ...bounds,
        slots: localizer.diff(bounds.first, bounds.last, 'day'),
      }
    })()

  let start = localizer.max(
    localizer.startOf(accessors.start(event), 'day'),
    first
  )
  let end = localizer.min(localizer.ceil(accessors.end(event), 'day'), last)

  // `start` is always clamped to be >= `first` (`range[0]`) and both are
  // day-aligned, so its position within `range` is exactly their day
  // difference - equivalent to, but far cheaper than, scanning `range`
  // with a per-day `isSameDate` check.
  let padding = localizer.diff(first, start, 'day')
  let span = localizer.diff(start, end, 'day')

  span = Math.min(span, slots)
  // The segmentOffset is necessary when adjusting for timezones
  // ahead of the browser timezone
  span = Math.max(span - localizer.segmentOffset, 1)

  return {
    event,
    span,
    left: padding + 1,
    right: Math.max(padding + span, 1),
  }
}

export function eventLevels(rowSegments, limit = Infinity) {
  let i,
    j,
    seg,
    levels = [],
    extra = []

  // Process segments ordered by `left` so that, within any level, the
  // segments already placed there are mutually non-overlapping (that's
  // what makes them a valid level) *and* sorted by `left` - which, given
  // non-overlap, also means their `right` values are strictly increasing
  // (if seg B follows seg A in the same level with A.left <= B.left, non-
  // overlap forces A.right < B.left <= B.right). So a new segment's `left`
  // either exceeds the level's last (rightmost) segment's `right` - no
  // overlap with *anything* in the level - or it doesn't, in which case it
  // can't be placed there. Checking just the last segment replaces what
  // was an O(level size) scan per level per segment (quadratic in the
  // event count for a heavily-populated week) with an O(1) check.
  const sorted = [...rowSegments].sort((a, b) => a.left - b.left)

  for (i = 0; i < sorted.length; i++) {
    seg = sorted[i]

    for (j = 0; j < levels.length; j++) {
      const level = levels[j]
      if (level[level.length - 1].right < seg.left) break
    }

    if (j >= limit) {
      extra.push(seg)
    } else {
      ;(levels[j] || (levels[j] = [])).push(seg)
    }
  }

  for (i = 0; i < levels.length; i++) {
    levels[i].sort((a, b) => a.left - b.left) //eslint-disable-line
  }

  return { levels, extra }
}

export function inRange(e, start, end, accessors, localizer) {
  const event = {
    start: accessors.start(e),
    end: accessors.end(e),
  }
  const range = { start, end }
  return localizer.inEventRange({ event, range })
}

export function segsOverlap(seg, otherSegs) {
  return otherSegs.some(
    (otherSeg) => otherSeg.left <= seg.right && otherSeg.right >= seg.left
  )
}

export function sortWeekEvents(events, accessors, localizer) {
  // `localizer.sortEvents` (moment/dayjs/luxon, and the shared default used
  // by date-fns/globalize) is always built from just `startOf(start, 'day')`
  // and `daySpan(start, end)`, each of which allocates date-library objects
  // internally. Calling it as a sort comparator re-derives both for every
  // pairwise comparison - O(m log m) allocations for a sort of m events.
  // Decorating each event with those two values once up front (O(m)) and
  // comparing the plain numbers instead reproduces the exact same ordering
  // at a fraction of the cost.
  const decorated = events.map((event) => {
    const start = accessors.start(event)
    const end = accessors.end(event)
    return {
      event,
      start,
      end,
      allDay: accessors.allDay(event),
      startOfDay: +localizer.startOf(start, 'day'),
      daySpan: localizer.daySpan(start, end),
    }
  })

  const multiDayEvents = []
  const standardEvents = []
  decorated.forEach((d) =>
    (d.daySpan > 1 ? multiDayEvents : standardEvents).push(d)
  )

  const compare = (a, b) =>
    a.startOfDay - b.startOfDay || // sort by start Day first
    b.daySpan - a.daySpan || // events spanning multiple days go first
    !!b.allDay - !!a.allDay || // then allDay single day events
    +a.start - +b.start || // then sort by start time
    +a.end - +b.end // then sort by end time

  multiDayEvents.sort(compare)
  standardEvents.sort(compare)

  return [...multiDayEvents, ...standardEvents].map((d) => d.event)
}

export function sortEvents(eventA, eventB, accessors, localizer) {
  const evtA = {
    start: accessors.start(eventA),
    end: accessors.end(eventA),
    allDay: accessors.allDay(eventA),
  }
  const evtB = {
    start: accessors.start(eventB),
    end: accessors.end(eventB),
    allDay: accessors.allDay(eventB),
  }
  return localizer.sortEvents({ evtA, evtB })
}
