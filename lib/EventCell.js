'use strict'

var _interopRequireDefault =
  require('@babel/runtime/helpers/interopRequireDefault').default
Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.default = void 0
var _objectSpread2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectSpread2')
)
var _objectWithoutProperties2 = _interopRequireDefault(
  require('@babel/runtime/helpers/objectWithoutProperties')
)
var _createForOfIteratorHelper2 = _interopRequireDefault(
  require('@babel/runtime/helpers/createForOfIteratorHelper')
)
var _toConsumableArray2 = _interopRequireDefault(
  require('@babel/runtime/helpers/toConsumableArray')
)
var _classCallCheck2 = _interopRequireDefault(
  require('@babel/runtime/helpers/classCallCheck')
)
var _createClass2 = _interopRequireDefault(
  require('@babel/runtime/helpers/createClass')
)
var _callSuper2 = _interopRequireDefault(
  require('@babel/runtime/helpers/callSuper')
)
var _inherits2 = _interopRequireDefault(
  require('@babel/runtime/helpers/inherits')
)
var _react = _interopRequireDefault(require('react'))
var _clsx = _interopRequireDefault(require('clsx'))
var _excluded = [
  'style',
  'className',
  'event',
  'selected',
  'isAllDay',
  'onSelect',
  'onDoubleClick',
  'onKeyPress',
  'localizer',
  'continuesPrior',
  'continuesAfter',
  'accessors',
  'getters',
  'children',
  'components',
  'slotStart',
  'slotEnd',
]
// Props that are intentionally rebuilt on every parent render (inline
// closures, or objects `render()` itself derives from `getters`) and so
// can never be reference-equal across renders. Excluding them from the
// shouldComponentUpdate check lets a single event's selection/content
// change skip re-rendering (and re-diffing the DOM for) every other event
// cell in the month - a click previously forced every EventCell to
// re-render because Component always re-renders on a parent update.
var VOLATILE_PROPS = [
  'style',
  'className',
  'children',
  'onDragStart',
  'onDragEnd',
]
var EventCell = /*#__PURE__*/ (function (_React$Component) {
  function EventCell() {
    ;(0, _classCallCheck2.default)(this, EventCell)
    return (0, _callSuper2.default)(this, EventCell, arguments)
  }
  ;(0, _inherits2.default)(EventCell, _React$Component)
  return (0, _createClass2.default)(EventCell, [
    {
      key: 'shouldComponentUpdate',
      value: function shouldComponentUpdate(nextProps) {
        var keys = new Set(
          [].concat(
            (0, _toConsumableArray2.default)(Object.keys(this.props)),
            (0, _toConsumableArray2.default)(Object.keys(nextProps))
          )
        )
        var _iterator = (0, _createForOfIteratorHelper2.default)(keys),
          _step
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done; ) {
            var key = _step.value
            if (VOLATILE_PROPS.includes(key)) continue
            if (this.props[key] !== nextProps[key]) return true
          }
        } catch (err) {
          _iterator.e(err)
        } finally {
          _iterator.f()
        }
        return false
      },
    },
    {
      key: 'render',
      value: function render() {
        var _this$props = this.props,
          style = _this$props.style,
          className = _this$props.className,
          event = _this$props.event,
          selected = _this$props.selected,
          isAllDay = _this$props.isAllDay,
          onSelect = _this$props.onSelect,
          _onDoubleClick = _this$props.onDoubleClick,
          onKeyPress = _this$props.onKeyPress,
          localizer = _this$props.localizer,
          continuesPrior = _this$props.continuesPrior,
          continuesAfter = _this$props.continuesAfter,
          accessors = _this$props.accessors,
          getters = _this$props.getters,
          children = _this$props.children,
          _this$props$component = _this$props.components,
          Event = _this$props$component.event,
          EventWrapper = _this$props$component.eventWrapper,
          slotStart = _this$props.slotStart,
          slotEnd = _this$props.slotEnd,
          props = (0, _objectWithoutProperties2.default)(_this$props, _excluded)
        delete props.resizable
        var title = accessors.title(event)
        var tooltip = accessors.tooltip(event)
        var end = accessors.end(event)
        var start = accessors.start(event)
        var allDay = accessors.allDay(event)
        var showAsAllDay =
          isAllDay ||
          allDay ||
          localizer.diff(start, localizer.ceil(end, 'day'), 'day') > 1
        var userProps = getters.eventProp(event, start, end, selected)
        var content = /*#__PURE__*/ _react.default.createElement(
          'div',
          {
            className: 'rbc-event-content',
            title: tooltip || undefined,
          },
          Event
            ? /*#__PURE__*/ _react.default.createElement(Event, {
                event: event,
                continuesPrior: continuesPrior,
                continuesAfter: continuesAfter,
                title: title,
                isAllDay: allDay,
                localizer: localizer,
                slotStart: slotStart,
                slotEnd: slotEnd,
              })
            : title
        )
        return /*#__PURE__*/ _react.default.createElement(
          EventWrapper,
          Object.assign({}, this.props, {
            type: 'date',
          }),
          /*#__PURE__*/ _react.default.createElement(
            'div',
            Object.assign({}, props, {
              style: (0, _objectSpread2.default)(
                (0, _objectSpread2.default)({}, userProps.style),
                style
              ),
              className: (0, _clsx.default)(
                'rbc-event',
                className,
                userProps.className,
                {
                  'rbc-selected': selected,
                  'rbc-event-allday': showAsAllDay,
                  'rbc-event-continues-prior': continuesPrior,
                  'rbc-event-continues-after': continuesAfter,
                }
              ),
              onClick: function onClick(e) {
                return onSelect && onSelect(event, e)
              },
              onDoubleClick: function onDoubleClick(e) {
                return _onDoubleClick && _onDoubleClick(event, e)
              },
              onKeyDown: function onKeyDown(e) {
                return onKeyPress && onKeyPress(event, e)
              },
            }),
            typeof children === 'function' ? children(content) : content
          )
        )
      },
    },
  ])
})(_react.default.Component)
var _default = (exports.default = EventCell)
