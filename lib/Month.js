"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _objectWithoutProperties2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutProperties"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));
var _react = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _clsx = _interopRequireDefault(require("clsx"));
var _chunk = _interopRequireDefault(require("lodash/chunk"));
var _memoizeOne = _interopRequireDefault(require("memoize-one"));
var _constants = require("./utils/constants");
var _helpers = require("./utils/helpers");
var _position = _interopRequireDefault(require("dom-helpers/position"));
var animationFrame = _interopRequireWildcard(require("dom-helpers/animationFrame"));
var _PopOverlay = _interopRequireDefault(require("./PopOverlay"));
var _DateContentRow = _interopRequireDefault(require("./DateContentRow"));
var _Header = _interopRequireDefault(require("./Header"));
var _DateHeader = _interopRequireDefault(require("./DateHeader"));
var _eventLevels = require("./utils/eventLevels");
var _excluded = ["date", "className"];
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); } /* import Popup from './Popup'
import Overlay from 'react-overlays/Overlay' */
var DAY_MS = 24 * 60 * 60 * 1000;

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
  var buckets = weeks.map(function () {
    return [];
  });
  var weekBounds = weeks.map(function (week) {
    return {
      from: +week[0] - DAY_MS,
      to: +week[week.length - 1] + DAY_MS
    };
  });
  events.forEach(function (event) {
    var start = +accessors.start(event);
    var end = +accessors.end(event);
    for (var w = 0; w < weeks.length; w++) {
      var _weekBounds$w = weekBounds[w],
        from = _weekBounds$w.from,
        to = _weekBounds$w.to;
      if (start > to || end < from) continue;
      var week = weeks[w];
      if ((0, _eventLevels.inRange)(event, week[0], week[week.length - 1], accessors, localizer)) {
        buckets[w].push(event);
      }
    }
  });
  return buckets;
}

// `date` and `localizer` don't change identity on every render (`localizer`
// is now stable from Calendar, `date` is stable while uncontrolled/unchanged),
// but we still guard on the month itself rather than raw reference equality
// so a freshly-constructed but equivalent `date` doesn't bust the cache.
var weeksAreEqual = function weeksAreEqual(_ref, _ref2) {
  var _ref3 = (0, _slicedToArray2.default)(_ref, 2),
    date = _ref3[0],
    localizer = _ref3[1];
  var _ref4 = (0, _slicedToArray2.default)(_ref2, 2),
    prevDate = _ref4[0],
    prevLocalizer = _ref4[1];
  return localizer === prevLocalizer && !localizer.neq(date, prevDate, 'month');
};
var MonthView = /*#__PURE__*/function (_React$Component) {
  function MonthView() {
    var _this;
    (0, _classCallCheck2.default)(this, MonthView);
    for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) {
      _args[_key] = arguments[_key];
    }
    _this = _callSuper(this, MonthView, [].concat(_args));
    _this.getContainer = function () {
      return _this.containerRef.current;
    };
    _this.renderWeek = function (week, weekIdx) {
      var _this$props = _this.props,
        components = _this$props.components,
        selectable = _this$props.selectable,
        getNow = _this$props.getNow,
        selected = _this$props.selected,
        date = _this$props.date,
        localizer = _this$props.localizer,
        longPressThreshold = _this$props.longPressThreshold,
        accessors = _this$props.accessors,
        getters = _this$props.getters,
        showAllEvents = _this$props.showAllEvents;
      var _this$state = _this.state,
        needLimitMeasure = _this$state.needLimitMeasure,
        rowLimit = _this$state.rowLimit;
      var sorted = _this.getWeekEventsMemo(weekIdx)(_this._eventsByWeek[weekIdx], accessors, localizer);
      return /*#__PURE__*/_react.default.createElement(_DateContentRow.default, {
        key: weekIdx,
        ref: weekIdx === 0 ? _this.slotRowRef : undefined,
        container: _this.getContainer,
        className: "rbc-month-row",
        getNow: getNow,
        date: date,
        range: week,
        events: sorted,
        maxRows: showAllEvents ? Infinity : rowLimit,
        selected: selected,
        selectable: selectable,
        components: components,
        accessors: accessors,
        getters: getters,
        localizer: localizer,
        renderHeader: _this.readerDateHeading,
        renderForMeasure: needLimitMeasure,
        onShowMore: _this.handleShowMore,
        onSelect: _this.handleSelectEvent,
        onDoubleClick: _this.handleDoubleClickEvent,
        onKeyPress: _this.handleKeyPressEvent,
        onSelectSlot: _this.handleSelectSlot,
        longPressThreshold: longPressThreshold,
        rtl: _this.props.rtl,
        resizable: _this.props.resizable,
        showAllEvents: showAllEvents
      });
    };
    _this.readerDateHeading = function (_ref5) {
      var date = _ref5.date,
        className = _ref5.className,
        props = (0, _objectWithoutProperties2.default)(_ref5, _excluded);
      var _this$props2 = _this.props,
        currentDate = _this$props2.date,
        getDrilldownView = _this$props2.getDrilldownView,
        localizer = _this$props2.localizer;
      var isOffRange = localizer.neq(currentDate, date, 'month');
      var isCurrent = localizer.isSameDate(date, currentDate);
      var drilldownView = getDrilldownView(date);
      var label = localizer.format(date, 'dateFormat');
      var DateHeaderComponent = _this.props.components.dateHeader || _DateHeader.default;
      return /*#__PURE__*/_react.default.createElement("div", (0, _extends2.default)({}, props, {
        className: (0, _clsx.default)(className, isOffRange && 'rbc-off-range', isCurrent && 'rbc-current'),
        role: "cell"
      }), /*#__PURE__*/_react.default.createElement(DateHeaderComponent, {
        label: label,
        date: date,
        drilldownView: drilldownView,
        isOffRange: isOffRange,
        onDrillDown: function onDrillDown(e) {
          return _this.handleHeadingClick(date, drilldownView, e);
        }
      }));
    };
    _this.handleSelectSlot = function (range, slotInfo) {
      _this._pendingSelection = _this._pendingSelection.concat(range);
      clearTimeout(_this._selectTimer);
      _this._selectTimer = setTimeout(function () {
        return _this.selectDates(slotInfo);
      });
    };
    _this.handleHeadingClick = function (date, view, e) {
      e.preventDefault();
      _this.clearSelection();
      (0, _helpers.notify)(_this.props.onDrillDown, [date, view]);
    };
    _this.handleSelectEvent = function () {
      _this.clearSelection();
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      (0, _helpers.notify)(_this.props.onSelectEvent, args);
    };
    _this.handleDoubleClickEvent = function () {
      _this.clearSelection();
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      (0, _helpers.notify)(_this.props.onDoubleClickEvent, args);
    };
    _this.handleKeyPressEvent = function () {
      _this.clearSelection();
      for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }
      (0, _helpers.notify)(_this.props.onKeyPressEvent, args);
    };
    _this.handleShowMore = function (events, date, cell, slot, target) {
      var _this$props3 = _this.props,
        popup = _this$props3.popup,
        onDrillDown = _this$props3.onDrillDown,
        onShowMore = _this$props3.onShowMore,
        getDrilldownView = _this$props3.getDrilldownView,
        doShowMoreDrillDown = _this$props3.doShowMoreDrillDown;
      //cancel any pending selections so only the event click goes through.
      _this.clearSelection();
      if (popup) {
        var position = (0, _position.default)(cell, _this.containerRef.current);
        _this.setState({
          overlay: {
            date: date,
            events: events,
            position: position,
            target: target
          }
        });
      } else if (doShowMoreDrillDown) {
        (0, _helpers.notify)(onDrillDown, [date, getDrilldownView(date) || _constants.views.DAY]);
      }
      (0, _helpers.notify)(onShowMore, [events, date, slot]);
    };
    _this.overlayDisplay = function () {
      _this.setState({
        overlay: null
      });
    };
    _this.state = {
      rowLimit: 5,
      needLimitMeasure: true,
      date: null
    };
    _this.containerRef = /*#__PURE__*/(0, _react.createRef)();
    _this.slotRowRef = /*#__PURE__*/(0, _react.createRef)();
    _this._bgRows = [];
    _this._pendingSelection = [];

    // Split the month grid into weeks only when the visible month actually
    // changes, instead of on every render, so downstream per-week
    // memoization (below, and DateSlotMetrics in DateContentRow) can rely on
    // stable `range`/`events` array references across unrelated re-renders
    // (e.g. opening the "show more" popup, a resize measurement).
    _this.getWeeks = (0, _memoizeOne.default)(function (date, localizer) {
      return (0, _chunk.default)(localizer.visibleDays(date, localizer), 7);
    }, weeksAreEqual);

    // Bucketing (see `bucketEventsByWeek`) runs once for the whole month;
    // reference equality on `events`/`weeks`/`accessors`/`localizer` (all
    // already stable across unrelated re-renders) is enough to cache it.
    _this.getEventsByWeek = (0, _memoizeOne.default)(bucketEventsByWeek);

    // One memoized sort per week row, keyed by week index, since a single
    // shared memoize-one cache would be invalidated by every other week's
    // call on the same render pass.
    _this._weekEventsMemo = [];
    return _this;
  }
  (0, _inherits2.default)(MonthView, _React$Component);
  return (0, _createClass2.default)(MonthView, [{
    key: "getWeekEventsMemo",
    value: function getWeekEventsMemo(weekIdx) {
      return this._weekEventsMemo[weekIdx] || (this._weekEventsMemo[weekIdx] = (0, _memoizeOne.default)(function (weekEvents, accessors, localizer) {
        return (0, _eventLevels.sortWeekEvents)(weekEvents, accessors, localizer);
      }));
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;
      var running;
      if (this.state.needLimitMeasure) this.measureRowLimit(this.props);
      window.addEventListener('resize', this._resizeListener = function () {
        if (!running) {
          animationFrame.request(function () {
            running = false;
            _this2.setState({
              needLimitMeasure: true
            }); //eslint-disable-line
          });
        }
      }, false);
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      if (this.state.needLimitMeasure) this.measureRowLimit(this.props);
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      window.removeEventListener('resize', this._resizeListener, false);
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props4 = this.props,
        date = _this$props4.date,
        localizer = _this$props4.localizer,
        className = _this$props4.className,
        events = _this$props4.events,
        accessors = _this$props4.accessors,
        weeks = this.getWeeks(date, localizer);
      this._weekCount = weeks.length;
      this._eventsByWeek = this.getEventsByWeek(events, weeks, accessors, localizer);
      return /*#__PURE__*/_react.default.createElement("div", {
        className: (0, _clsx.default)('rbc-month-view', className),
        role: "table",
        "aria-label": "Month View",
        ref: this.containerRef
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-row rbc-month-header",
        role: "row"
      }, this.renderHeaders(weeks[0])), weeks.map(this.renderWeek), this.props.popup && this.renderOverlay());
    }
  }, {
    key: "renderHeaders",
    value: function renderHeaders(row) {
      var _this$props5 = this.props,
        localizer = _this$props5.localizer,
        components = _this$props5.components;
      var first = row[0];
      var last = row[row.length - 1];
      var HeaderComponent = components.header || _Header.default;
      return localizer.range(first, last, 'day').map(function (day, idx) {
        return /*#__PURE__*/_react.default.createElement("div", {
          key: 'header_' + idx,
          className: "rbc-header"
        }, /*#__PURE__*/_react.default.createElement(HeaderComponent, {
          date: day,
          localizer: localizer,
          label: localizer.format(day, 'weekdayFormat')
        }));
      });
    }
  }, {
    key: "renderOverlay",
    value: function renderOverlay() {
      var _this$state$overlay,
        _this$state2,
        _this3 = this;
      var overlay = (_this$state$overlay = (_this$state2 = this.state) === null || _this$state2 === void 0 ? void 0 : _this$state2.overlay) !== null && _this$state$overlay !== void 0 ? _this$state$overlay : {};
      var _this$props6 = this.props,
        accessors = _this$props6.accessors,
        localizer = _this$props6.localizer,
        components = _this$props6.components,
        getters = _this$props6.getters,
        selected = _this$props6.selected,
        popupOffset = _this$props6.popupOffset,
        handleDragStart = _this$props6.handleDragStart;
      var onHide = function onHide() {
        return _this3.setState({
          overlay: null
        });
      };
      return /*#__PURE__*/_react.default.createElement(_PopOverlay.default, {
        overlay: overlay,
        accessors: accessors,
        localizer: localizer,
        components: components,
        getters: getters,
        selected: selected,
        popupOffset: popupOffset,
        ref: this.containerRef,
        handleKeyPressEvent: this.handleKeyPressEvent,
        handleSelectEvent: this.handleSelectEvent,
        handleDoubleClickEvent: this.handleDoubleClickEvent,
        handleDragStart: handleDragStart,
        show: !!overlay.position,
        overlayDisplay: this.overlayDisplay,
        onHide: onHide
      });

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
  }, {
    key: "measureRowLimit",
    value: function measureRowLimit() {
      this.setState({
        needLimitMeasure: false,
        rowLimit: this.slotRowRef.current.getRowLimit()
      });
    }
  }, {
    key: "selectDates",
    value: function selectDates(slotInfo) {
      var slots = this._pendingSelection.slice();
      this._pendingSelection = [];
      slots.sort(function (a, b) {
        return +a - +b;
      });
      var start = new Date(slots[0]);
      var end = new Date(slots[slots.length - 1]);
      end.setDate(slots[slots.length - 1].getDate() + 1);
      (0, _helpers.notify)(this.props.onSelectSlot, {
        slots: slots,
        start: start,
        end: end,
        action: slotInfo.action,
        bounds: slotInfo.bounds,
        box: slotInfo.box
      });
    }
  }, {
    key: "clearSelection",
    value: function clearSelection() {
      clearTimeout(this._selectTimer);
      this._pendingSelection = [];
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(_ref6, state) {
      var date = _ref6.date,
        localizer = _ref6.localizer;
      return {
        date: date,
        needLimitMeasure: state.needLimitMeasure || localizer.neq(date, state.date, 'month')
      };
    }
  }]);
}(_react.default.Component);
MonthView.propTypes = process.env.NODE_ENV !== "production" ? {
  events: _propTypes.default.array.isRequired,
  date: _propTypes.default.instanceOf(Date),
  min: _propTypes.default.instanceOf(Date),
  max: _propTypes.default.instanceOf(Date),
  step: _propTypes.default.number,
  getNow: _propTypes.default.func.isRequired,
  scrollToTime: _propTypes.default.instanceOf(Date),
  enableAutoScroll: _propTypes.default.bool,
  rtl: _propTypes.default.bool,
  resizable: _propTypes.default.bool,
  width: _propTypes.default.number,
  accessors: _propTypes.default.object.isRequired,
  components: _propTypes.default.object.isRequired,
  getters: _propTypes.default.object.isRequired,
  localizer: _propTypes.default.object.isRequired,
  selected: _propTypes.default.object,
  selectable: _propTypes.default.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: _propTypes.default.number,
  onNavigate: _propTypes.default.func,
  onSelectSlot: _propTypes.default.func,
  onSelectEvent: _propTypes.default.func,
  onDoubleClickEvent: _propTypes.default.func,
  onKeyPressEvent: _propTypes.default.func,
  onShowMore: _propTypes.default.func,
  showAllEvents: _propTypes.default.bool,
  doShowMoreDrillDown: _propTypes.default.bool,
  onDrillDown: _propTypes.default.func,
  getDrilldownView: _propTypes.default.func.isRequired,
  popup: _propTypes.default.bool,
  handleDragStart: _propTypes.default.func,
  popupOffset: _propTypes.default.oneOfType([_propTypes.default.number, _propTypes.default.shape({
    x: _propTypes.default.number,
    y: _propTypes.default.number
  })])
} : {};
MonthView.range = function (date, _ref7) {
  var localizer = _ref7.localizer;
  var start = localizer.firstVisibleDay(date, localizer);
  var end = localizer.lastVisibleDay(date, localizer);
  return {
    start: start,
    end: end
  };
};
MonthView.navigate = function (date, action, _ref8) {
  var localizer = _ref8.localizer;
  switch (action) {
    case _constants.navigate.PREVIOUS:
      return localizer.add(date, -1, 'month');
    case _constants.navigate.NEXT:
      return localizer.add(date, 1, 'month');
    default:
      return date;
  }
};
MonthView.title = function (date, _ref9) {
  var localizer = _ref9.localizer;
  return localizer.format(date, 'monthHeaderFormat');
};
var _default = exports.default = MonthView;