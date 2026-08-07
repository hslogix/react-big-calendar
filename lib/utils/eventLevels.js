'use strict'

var _interopRequireDefault =
  require('@babel/runtime/helpers/interopRequireDefault').default
Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.endOfRange = endOfRange
exports.eventLevels = eventLevels
exports.eventSegments = eventSegments
exports.inRange = inRange
exports.segsOverlap = segsOverlap
exports.sortEvents = sortEvents
exports.sortWeekEvents = sortWeekEvents
var _objectSpread2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectSpread2')
)
function endOfRange(_ref) {
  var dateRange = _ref.dateRange,
    _ref$unit = _ref.unit,
    unit = _ref$unit === void 0 ? 'day' : _ref$unit,
    localizer = _ref.localizer
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
function eventSegments(event, range, accessors, localizer, rangeInfo) {
  var _ref2 =
      rangeInfo ||
      (function () {
        var bounds = endOfRange({
          dateRange: range,
          localizer: localizer,
        })
        return (0, _objectSpread2.default)(
          (0, _objectSpread2.default)({}, bounds),
          {},
          {
            slots: localizer.diff(bounds.first, bounds.last, 'day'),
          }
        )
      })(),
    first = _ref2.first,
    last = _ref2.last,
    slots = _ref2.slots
  var start = localizer.max(
    localizer.startOf(accessors.start(event), 'day'),
    first
  )
  var end = localizer.min(localizer.ceil(accessors.end(event), 'day'), last)

  // `start` is always clamped to be >= `first` (`range[0]`) and both are
  // day-aligned, so its position within `range` is exactly their day
  // difference - equivalent to, but far cheaper than, scanning `range`
  // with a per-day `isSameDate` check.
  var padding = localizer.diff(first, start, 'day')
  var span = localizer.diff(start, end, 'day')
  span = Math.min(span, slots)
  // The segmentOffset is necessary when adjusting for timezones
  // ahead of the browser timezone
  span = Math.max(span - localizer.segmentOffset, 1)
  return {
    event: event,
    span: span,
    left: padding + 1,
    right: Math.max(padding + span, 1),
  }
}
function eventLevels(rowSegments) {
  var limit =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : Infinity
  var i,
    j,
    seg,
    levels = [],
    extra = []
  for (i = 0; i < rowSegments.length; i++) {
    seg = rowSegments[i]
    for (j = 0; j < levels.length; j++) if (!segsOverlap(seg, levels[j])) break
    if (j >= limit) {
      extra.push(seg)
    } else {
      ;(levels[j] || (levels[j] = [])).push(seg)
    }
  }
  for (i = 0; i < levels.length; i++) {
    levels[i].sort(function (a, b) {
      return a.left - b.left
    }) //eslint-disable-line
  }
  return {
    levels: levels,
    extra: extra,
  }
}
function inRange(e, start, end, accessors, localizer) {
  var event = {
    start: accessors.start(e),
    end: accessors.end(e),
  }
  var range = {
    start: start,
    end: end,
  }
  return localizer.inEventRange({
    event: event,
    range: range,
  })
}
function segsOverlap(seg, otherSegs) {
  return otherSegs.some(function (otherSeg) {
    return otherSeg.left <= seg.right && otherSeg.right >= seg.left
  })
}
function sortWeekEvents(events, accessors, localizer) {
  // `localizer.sortEvents` (moment/dayjs/luxon, and the shared default used
  // by date-fns/globalize) is always built from just `startOf(start, 'day')`
  // and `daySpan(start, end)`, each of which allocates date-library objects
  // internally. Calling it as a sort comparator re-derives both for every
  // pairwise comparison - O(m log m) allocations for a sort of m events.
  // Decorating each event with those two values once up front (O(m)) and
  // comparing the plain numbers instead reproduces the exact same ordering
  // at a fraction of the cost.
  var decorated = events.map(function (event) {
    var start = accessors.start(event)
    var end = accessors.end(event)
    return {
      event: event,
      start: start,
      end: end,
      allDay: accessors.allDay(event),
      startOfDay: +localizer.startOf(start, 'day'),
      daySpan: localizer.daySpan(start, end),
    }
  })
  var multiDayEvents = []
  var standardEvents = []
  decorated.forEach(function (d) {
    return (d.daySpan > 1 ? multiDayEvents : standardEvents).push(d)
  })
  var compare = function compare(a, b) {
    return (
      a.startOfDay - b.startOfDay ||
      // sort by start Day first
      b.daySpan - a.daySpan ||
      // events spanning multiple days go first
      !!b.allDay - !!a.allDay ||
      // then allDay single day events
      +a.start - +b.start ||
      // then sort by start time
      +a.end - +b.end
    )
  } // then sort by end time

  multiDayEvents.sort(compare)
  standardEvents.sort(compare)
  return [].concat(multiDayEvents, standardEvents).map(function (d) {
    return d.event
  })
}
function sortEvents(eventA, eventB, accessors, localizer) {
  var evtA = {
    start: accessors.start(eventA),
    end: accessors.end(eventA),
    allDay: accessors.allDay(eventA),
  }
  var evtB = {
    start: accessors.start(eventB),
    end: accessors.end(eventB),
    allDay: accessors.allDay(eventB),
  }
  return localizer.sortEvents({
    evtA: evtA,
    evtB: evtB,
  })
}
