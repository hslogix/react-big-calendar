import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import chunk from 'lodash/chunk'
import memoize from 'memoize-one'

import { navigate, views } from './utils/constants'
import { notify } from './utils/helpers'
import getPosition from 'dom-helpers/position'
import * as animationFrame from 'dom-helpers/animationFrame'

/* import Popup from './Popup'
import Overlay from 'react-overlays/Overlay' */
import PopOverlay from './PopOverlay'
import DateContentRow from './DateContentRow'
import Header from './Header'
import DateHeader from './DateHeader'

import { inRange, sortWeekEvents } from './utils/eventLevels'

const DAY_MS = 24 * 60 * 60 * 1000

// Buckets the month's events into weeks in a single pass, rather than
// scanning the full event list once per week - the previous approach cost
// events*weeks calls into `inRange`, which is backed by several date-library
// object allocations per call (moment/dayjs/luxon) and dominates render time
// once there are a few thousand events.
//
// For each event we first do a cheap primitive-timestamp overlap check
// against every week, padded by a full day to safely absorb any
// day-boundary/timezone slack in `inRange`'s own (authoritative,
// day-granularity) semantics - a week can only ever be wrongly *included*
// as a candidate by this padding, never wrongly excluded, so it's safe to
// use as a pre-filter. Only candidate weeks that pass it pay for the real
// `inRange` check.
function bucketEventsByWeek(events, weeks, accessors, localizer) {
  const buckets = weeks.map(() => [])
  const weekBounds = weeks.map((week) => ({
    from: +week[0] - DAY_MS,
    to: +week[week.length - 1] + DAY_MS,
  }))

  events.forEach((event) => {
    const start = +accessors.start(event)
    const end = +accessors.end(event)

    for (let w = 0; w < weeks.length; w++) {
      const { from, to } = weekBounds[w]
      if (start > to || end < from) continue

      const week = weeks[w]
      if (
        inRange(event, week[0], week[week.length - 1], accessors, localizer)
      ) {
        buckets[w].push(event)
      }
    }
  })

  return buckets
}

// `date` and `localizer` don't change identity on every render (`localizer`
// is now stable from Calendar, `date` is stable while uncontrolled/unchanged),
// but we still guard on the month itself rather than raw reference equality
// so a freshly-constructed but equivalent `date` doesn't bust the cache.
const weeksAreEqual = ([date, localizer], [prevDate, prevLocalizer]) =>
  localizer === prevLocalizer && !localizer.neq(date, prevDate, 'month')

class MonthView extends React.Component {
  constructor(...args) {
    super(...args)

    this.state = {
      rowLimit: 5,
      needLimitMeasure: true,
      date: null,
    }
    this.containerRef = createRef()
    this.slotRowRef = createRef()

    this._bgRows = []
    this._pendingSelection = []

    // Split the month grid into weeks only when the visible month actually
    // changes, instead of on every render, so downstream per-week
    // memoization (below, and DateSlotMetrics in DateContentRow) can rely on
    // stable `range`/`events` array references across unrelated re-renders
    // (e.g. opening the "show more" popup, a resize measurement).
    this.getWeeks = memoize(
      (date, localizer) => chunk(localizer.visibleDays(date, localizer), 7),
      weeksAreEqual
    )

    // Bucketing (see `bucketEventsByWeek`) runs once for the whole month;
    // reference equality on `events`/`weeks`/`accessors`/`localizer` (all
    // already stable across unrelated re-renders) is enough to cache it.
    this.getEventsByWeek = memoize(bucketEventsByWeek)

    // One memoized sort per week row, keyed by week index, since a single
    // shared memoize-one cache would be invalidated by every other week's
    // call on the same render pass.
    this._weekEventsMemo = []
  }

  getWeekEventsMemo(weekIdx) {
    return (
      this._weekEventsMemo[weekIdx] ||
      (this._weekEventsMemo[weekIdx] = memoize(
        (weekEvents, accessors, localizer) =>
          sortWeekEvents(weekEvents, accessors, localizer)
      ))
    )
  }

  static getDerivedStateFromProps({ date, localizer }, state) {
    return {
      date,
      needLimitMeasure:
        state.needLimitMeasure || localizer.neq(date, state.date, 'month'),
    }
  }

  componentDidMount() {
    let running

    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)

    window.addEventListener(
      'resize',
      (this._resizeListener = () => {
        if (!running) {
          animationFrame.request(() => {
            running = false
            this.setState({ needLimitMeasure: true }) //eslint-disable-line
          })
        }
      }),
      false
    )
  }

  componentDidUpdate() {
    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeListener, false)
  }

  getContainer = () => {
    return this.containerRef.current
  }

  render() {
    let { date, localizer, className, events, accessors } = this.props,
      weeks = this.getWeeks(date, localizer)

    this._weekCount = weeks.length
    this._eventsByWeek = this.getEventsByWeek(
      events,
      weeks,
      accessors,
      localizer
    )

    return (
      <div
        className={clsx('rbc-month-view', className)}
        role="table"
        aria-label="Month View"
        ref={this.containerRef}
      >
        <div className="rbc-row rbc-month-header" role="row">
          {this.renderHeaders(weeks[0])}
        </div>
        {weeks.map(this.renderWeek)}
        {this.props.popup && this.renderOverlay()}
      </div>
    )
  }

  renderWeek = (week, weekIdx) => {
    let {
      components,
      selectable,
      getNow,
      selected,
      date,
      localizer,
      longPressThreshold,
      accessors,
      getters,
      showAllEvents,
    } = this.props

    const { needLimitMeasure, rowLimit } = this.state

    const sorted = this.getWeekEventsMemo(weekIdx)(
      this._eventsByWeek[weekIdx],
      accessors,
      localizer
    )

    return (
      <DateContentRow
        key={weekIdx}
        ref={weekIdx === 0 ? this.slotRowRef : undefined}
        container={this.getContainer}
        className="rbc-month-row"
        getNow={getNow}
        date={date}
        range={week}
        events={sorted}
        maxRows={showAllEvents ? Infinity : rowLimit}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onSelect={this.handleSelectEvent}
        onDoubleClick={this.handleDoubleClickEvent}
        onKeyPress={this.handleKeyPressEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
        resizable={this.props.resizable}
        showAllEvents={showAllEvents}
      />
    )
  }

  readerDateHeading = ({ date, className, ...props }) => {
    let { date: currentDate, getDrilldownView, localizer } = this.props
    let isOffRange = localizer.neq(currentDate, date, 'month')
    let isCurrent = localizer.isSameDate(date, currentDate)
    let drilldownView = getDrilldownView(date)
    let label = localizer.format(date, 'dateFormat')
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader

    return (
      <div
        {...props}
        className={clsx(
          className,
          isOffRange && 'rbc-off-range',
          isCurrent && 'rbc-current'
        )}
        role="cell"
      >
        <DateHeaderComponent
          label={label}
          date={date}
          drilldownView={drilldownView}
          isOffRange={isOffRange}
          onDrillDown={(e) => this.handleHeadingClick(date, drilldownView, e)}
        />
      </div>
    )
  }

  renderHeaders(row) {
    let { localizer, components } = this.props
    let first = row[0]
    let last = row[row.length - 1]
    let HeaderComponent = components.header || Header

    return localizer.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className="rbc-header">
        <HeaderComponent
          date={day}
          localizer={localizer}
          label={localizer.format(day, 'weekdayFormat')}
        />
      </div>
    ))
  }

  renderOverlay() {
    let overlay = this.state?.overlay ?? {}
    let {
      accessors,
      localizer,
      components,
      getters,
      selected,
      popupOffset,
      handleDragStart,
    } = this.props

    const onHide = () => this.setState({ overlay: null })

    return (
      <PopOverlay
        overlay={overlay}
        accessors={accessors}
        localizer={localizer}
        components={components}
        getters={getters}
        selected={selected}
        popupOffset={popupOffset}
        ref={this.containerRef}
        handleKeyPressEvent={this.handleKeyPressEvent}
        handleSelectEvent={this.handleSelectEvent}
        handleDoubleClickEvent={this.handleDoubleClickEvent}
        handleDragStart={handleDragStart}
        show={!!overlay.position}
        overlayDisplay={this.overlayDisplay}
        onHide={onHide}
      />
    )

    /* return (
      <Overlay
        rootClose
        placement="bottom"
        show={!!overlay.position}
        onHide={() => this.setState({ overlay: null })}
        target={() => overlay.target}
      >
        {({ props }) => (
          <Popup
            {...props}
            popupOffset={popupOffset}
            accessors={accessors}
            getters={getters}
            selected={selected}
            components={components}
            localizer={localizer}
            position={overlay.position}
            show={this.overlayDisplay}
            events={overlay.events}
            slotStart={overlay.date}
            slotEnd={overlay.end}
            onSelect={this.handleSelectEvent}
            onDoubleClick={this.handleDoubleClickEvent}
            onKeyPress={this.handleKeyPressEvent}
            handleDragStart={this.props.handleDragStart}
          />
        )}
      </Overlay>
    ) */
  }

  measureRowLimit() {
    this.setState({
      needLimitMeasure: false,
      rowLimit: this.slotRowRef.current.getRowLimit(),
    })
  }

  handleSelectSlot = (range, slotInfo) => {
    this._pendingSelection = this._pendingSelection.concat(range)

    clearTimeout(this._selectTimer)
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo))
  }

  handleHeadingClick = (date, view, e) => {
    e.preventDefault()
    this.clearSelection()
    notify(this.props.onDrillDown, [date, view])
  }

  handleSelectEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onSelectEvent, args)
  }

  handleDoubleClickEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onDoubleClickEvent, args)
  }

  handleKeyPressEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onKeyPressEvent, args)
  }

  handleShowMore = (events, date, cell, slot, target) => {
    const {
      popup,
      onDrillDown,
      onShowMore,
      getDrilldownView,
      doShowMoreDrillDown,
    } = this.props
    //cancel any pending selections so only the event click goes through.
    this.clearSelection()

    if (popup) {
      let position = getPosition(cell, this.containerRef.current)

      this.setState({
        overlay: { date, events, position, target },
      })
    } else if (doShowMoreDrillDown) {
      notify(onDrillDown, [date, getDrilldownView(date) || views.DAY])
    }

    notify(onShowMore, [events, date, slot])
  }

  overlayDisplay = () => {
    this.setState({
      overlay: null,
    })
  }

  selectDates(slotInfo) {
    let slots = this._pendingSelection.slice()

    this._pendingSelection = []

    slots.sort((a, b) => +a - +b)

    const start = new Date(slots[0])
    const end = new Date(slots[slots.length - 1])
    end.setDate(slots[slots.length - 1].getDate() + 1)

    notify(this.props.onSelectSlot, {
      slots,
      start,
      end,
      action: slotInfo.action,
      bounds: slotInfo.bounds,
      box: slotInfo.box,
    })
  }

  clearSelection() {
    clearTimeout(this._selectTimer)
    this._pendingSelection = []
  }
}

MonthView.propTypes = {
  events: PropTypes.array.isRequired,
  date: PropTypes.instanceOf(Date),

  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),

  step: PropTypes.number,
  getNow: PropTypes.func.isRequired,

  scrollToTime: PropTypes.instanceOf(Date),
  enableAutoScroll: PropTypes.bool,
  rtl: PropTypes.bool,
  resizable: PropTypes.bool,
  width: PropTypes.number,

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,

  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEvent: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onKeyPressEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  showAllEvents: PropTypes.bool,
  doShowMoreDrillDown: PropTypes.bool,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,

  popup: PropTypes.bool,
  handleDragStart: PropTypes.func,

  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ]),
}

MonthView.range = (date, { localizer }) => {
  let start = localizer.firstVisibleDay(date, localizer)
  let end = localizer.lastVisibleDay(date, localizer)
  return { start, end }
}

MonthView.navigate = (date, action, { localizer }) => {
  switch (action) {
    case navigate.PREVIOUS:
      return localizer.add(date, -1, 'month')

    case navigate.NEXT:
      return localizer.add(date, 1, 'month')

    default:
      return date
  }
}

MonthView.title = (date, { localizer }) =>
  localizer.format(date, 'monthHeaderFormat')

export default MonthView
