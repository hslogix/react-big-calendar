"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _react = _interopRequireWildcard(require("react"));
var _clsx = _interopRequireDefault(require("clsx"));
var _height = _interopRequireDefault(require("dom-helpers/height"));
var _querySelectorAll = _interopRequireDefault(require("dom-helpers/querySelectorAll"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _BackgroundCells = _interopRequireDefault(require("./BackgroundCells"));
var _EventRow = _interopRequireDefault(require("./EventRow"));
var _EventEndingRow = _interopRequireDefault(require("./EventEndingRow"));
var _NoopWrapper = _interopRequireDefault(require("./NoopWrapper"));
var _ScrollableWeekWrapper = _interopRequireDefault(require("./ScrollableWeekWrapper"));
var DateSlotMetrics = _interopRequireWildcard(require("./utils/DateSlotMetrics"));
var _selection = require("./utils/selection");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _callSuper(t, o, e) { return o = (0, _getPrototypeOf2.default)(o), (0, _possibleConstructorReturn2.default)(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], (0, _getPrototypeOf2.default)(t).constructor) : o.apply(t, e)); }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
var DateContentRow = /*#__PURE__*/function (_React$Component) {
  function DateContentRow() {
    var _this;
    (0, _classCallCheck2.default)(this, DateContentRow);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _callSuper(this, DateContentRow, [].concat(args));
    _this.handleSelectSlot = function (slot) {
      var _this$props = _this.props,
        range = _this$props.range,
        onSelectSlot = _this$props.onSelectSlot;
      onSelectSlot(range.slice(slot.start, slot.end + 1), slot);
    };
    _this.handleShowMore = function (slot, target) {
      var _this$props2 = _this.props,
        range = _this$props2.range,
        onShowMore = _this$props2.onShowMore;
      var metrics = _this.slotMetrics(_this.props);
      var row = (0, _querySelectorAll.default)(_this.containerRef.current, '.rbc-row-bg')[0];
      var cell;
      if (row) cell = row.children[slot - 1];
      var events = metrics.getEventsForSlot(slot);
      onShowMore(events, range[slot - 1], cell, slot, target);
    };
    _this.getContainer = function () {
      var container = _this.props.container;
      return container ? container() : _this.containerRef.current;
    };
    _this.renderHeadingCell = function (date, index) {
      var _this$props3 = _this.props,
        renderHeader = _this$props3.renderHeader,
        getNow = _this$props3.getNow,
        localizer = _this$props3.localizer;
      return renderHeader({
        date: date,
        key: "header_".concat(index),
        className: (0, _clsx.default)('rbc-date-cell', localizer.isSameDate(date, getNow()) && 'rbc-now')
      });
    };
    _this.renderDummy = function () {
      var _this$props4 = _this.props,
        className = _this$props4.className,
        range = _this$props4.range,
        renderHeader = _this$props4.renderHeader,
        showAllEvents = _this$props4.showAllEvents;
      return /*#__PURE__*/_react.default.createElement("div", {
        className: className,
        ref: _this.containerRef
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: (0, _clsx.default)('rbc-row-content', showAllEvents && 'rbc-row-content-scrollable')
      }, renderHeader && /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-row",
        ref: _this.headingRowRef
      }, range.map(_this.renderHeadingCell)), /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-row",
        ref: _this.eventRowRef
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-row-segment"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-event"
      }, /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-event-content"
      }, "\xA0"))))));
    };
    _this.containerRef = /*#__PURE__*/(0, _react.createRef)();
    _this.headingRowRef = /*#__PURE__*/(0, _react.createRef)();
    _this.eventRowRef = /*#__PURE__*/(0, _react.createRef)();
    _this.slotMetrics = DateSlotMetrics.getSlotMetrics();
    return _this;
  }

  // `selected` is a single shared event reference threaded uniformly to
  // every week row, so it changes identity for all of them whenever any
  // event anywhere in the month is (de)selected. Without this check every
  // week would re-render (and re-walk all of its events) on every
  // selection change, even weeks with no relation to it.
  (0, _inherits2.default)(DateContentRow, _React$Component);
  return (0, _createClass2.default)(DateContentRow, [{
    key: "shouldComponentUpdate",
    value: function shouldComponentUpdate(nextProps) {
      var _this2 = this;
      var keys = new Set([].concat((0, _toConsumableArray2.default)(Object.keys(this.props)), (0, _toConsumableArray2.default)(Object.keys(nextProps))));
      var _iterator = _createForOfIteratorHelper(keys),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var key = _step.value;
          if (key === 'selected') continue;
          if (this.props[key] !== nextProps[key]) return true;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      if (this.props.selected === nextProps.selected) return false;
      var concernsThisWeek = function concernsThisWeek(selected) {
        return _this2.props.events.some(function (event) {
          return (0, _selection.isSelected)(event, selected);
        });
      };
      return concernsThisWeek(this.props.selected) || concernsThisWeek(nextProps.selected);
    }
  }, {
    key: "getRowLimit",
    value: function getRowLimit() {
      var _this$headingRowRef;
      /* Guessing this only gets called on the dummyRow */
      var eventHeight = (0, _height.default)(this.eventRowRef.current);
      var headingHeight = (_this$headingRowRef = this.headingRowRef) !== null && _this$headingRowRef !== void 0 && _this$headingRowRef.current ? (0, _height.default)(this.headingRowRef.current) : 0;
      var eventSpace = (0, _height.default)(this.containerRef.current) - headingHeight;
      return Math.max(Math.floor(eventSpace / eventHeight), 1);
    }
  }, {
    key: "render",
    value: function render() {
      var _this$props5 = this.props,
        date = _this$props5.date,
        rtl = _this$props5.rtl,
        range = _this$props5.range,
        className = _this$props5.className,
        selected = _this$props5.selected,
        selectable = _this$props5.selectable,
        renderForMeasure = _this$props5.renderForMeasure,
        accessors = _this$props5.accessors,
        getters = _this$props5.getters,
        components = _this$props5.components,
        getNow = _this$props5.getNow,
        renderHeader = _this$props5.renderHeader,
        onSelect = _this$props5.onSelect,
        localizer = _this$props5.localizer,
        onSelectStart = _this$props5.onSelectStart,
        onSelectEnd = _this$props5.onSelectEnd,
        onDoubleClick = _this$props5.onDoubleClick,
        onKeyPress = _this$props5.onKeyPress,
        resourceId = _this$props5.resourceId,
        longPressThreshold = _this$props5.longPressThreshold,
        isAllDay = _this$props5.isAllDay,
        resizable = _this$props5.resizable,
        showAllEvents = _this$props5.showAllEvents;
      if (renderForMeasure) return this.renderDummy();
      var metrics = this.slotMetrics(this.props);
      var levels = metrics.levels,
        extra = metrics.extra;
      var ScrollableWeekComponent = showAllEvents ? _ScrollableWeekWrapper.default : _NoopWrapper.default;
      var WeekWrapper = components.weekWrapper;
      var eventRowProps = {
        selected: selected,
        accessors: accessors,
        getters: getters,
        localizer: localizer,
        components: components,
        onSelect: onSelect,
        onDoubleClick: onDoubleClick,
        onKeyPress: onKeyPress,
        resourceId: resourceId,
        slotMetrics: metrics,
        resizable: resizable
      };
      return /*#__PURE__*/_react.default.createElement("div", {
        className: className,
        role: "rowgroup",
        ref: this.containerRef
      }, /*#__PURE__*/_react.default.createElement(_BackgroundCells.default, {
        localizer: localizer,
        date: date,
        getNow: getNow,
        rtl: rtl,
        range: range,
        selectable: selectable,
        container: this.getContainer,
        getters: getters,
        onSelectStart: onSelectStart,
        onSelectEnd: onSelectEnd,
        onSelectSlot: this.handleSelectSlot,
        components: components,
        longPressThreshold: longPressThreshold,
        resourceId: resourceId
      }), /*#__PURE__*/_react.default.createElement("div", {
        className: (0, _clsx.default)('rbc-row-content', showAllEvents && 'rbc-row-content-scrollable'),
        role: "row"
      }, renderHeader && /*#__PURE__*/_react.default.createElement("div", {
        className: "rbc-row ",
        ref: this.headingRowRef
      }, range.map(this.renderHeadingCell)), /*#__PURE__*/_react.default.createElement(ScrollableWeekComponent, null, /*#__PURE__*/_react.default.createElement(WeekWrapper, (0, _extends2.default)({
        isAllDay: isAllDay
      }, eventRowProps, {
        rtl: this.props.rtl
      }), levels.map(function (segs, idx) {
        return /*#__PURE__*/_react.default.createElement(_EventRow.default, (0, _extends2.default)({
          key: idx,
          segments: segs
        }, eventRowProps));
      }), !!extra.length && /*#__PURE__*/_react.default.createElement(_EventEndingRow.default, (0, _extends2.default)({
        segments: extra,
        onShowMore: this.handleShowMore
      }, eventRowProps))))));
    }
  }]);
}(_react.default.Component);
DateContentRow.propTypes = process.env.NODE_ENV !== "production" ? {
  date: _propTypes.default.instanceOf(Date),
  events: _propTypes.default.array.isRequired,
  range: _propTypes.default.array.isRequired,
  rtl: _propTypes.default.bool,
  resizable: _propTypes.default.bool,
  resourceId: _propTypes.default.any,
  renderForMeasure: _propTypes.default.bool,
  renderHeader: _propTypes.default.func,
  container: _propTypes.default.func,
  selected: _propTypes.default.object,
  selectable: _propTypes.default.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: _propTypes.default.number,
  onShowMore: _propTypes.default.func,
  showAllEvents: _propTypes.default.bool,
  onSelectSlot: _propTypes.default.func,
  onSelect: _propTypes.default.func,
  onSelectEnd: _propTypes.default.func,
  onSelectStart: _propTypes.default.func,
  onDoubleClick: _propTypes.default.func,
  onKeyPress: _propTypes.default.func,
  dayPropGetter: _propTypes.default.func,
  getNow: _propTypes.default.func.isRequired,
  isAllDay: _propTypes.default.bool,
  accessors: _propTypes.default.object.isRequired,
  components: _propTypes.default.object.isRequired,
  getters: _propTypes.default.object.isRequired,
  localizer: _propTypes.default.object.isRequired,
  minRows: _propTypes.default.number.isRequired,
  maxRows: _propTypes.default.number.isRequired
} : {};
DateContentRow.defaultProps = {
  minRows: 0,
  maxRows: Infinity
};
var _default = exports.default = DateContentRow;