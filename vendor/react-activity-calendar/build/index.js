'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var React = require('react')
var color = require('tinycolor2')
var dateFns = require('date-fns')

function _interopDefault(e) {
  return e && e.__esModule ? e : { default: e }
}

var React__default = /*#__PURE__*/ _interopDefault(React)
var color__default = /*#__PURE__*/ _interopDefault(color)

function _extends() {
  _extends = Object.assign
    ? Object.assign.bind()
    : function (target) {
        for (var i = 1; i < arguments.length; i++) {
          var source = arguments[i]
          for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              target[key] = source[key]
            }
          }
        }
        return target
      }
  return _extends.apply(this, arguments)
}

function styleInject(css, ref) {
  if (ref === void 0) ref = {}
  var insertAt = ref.insertAt

  if (!css || typeof document === 'undefined') {
    return
  }

  var head = document.head || document.getElementsByTagName('head')[0]
  var style = document.createElement('style')
  style.type = 'text/css'

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild)
    } else {
      head.appendChild(style)
    }
  } else {
    head.appendChild(style)
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css
  } else {
    style.appendChild(document.createTextNode(css))
  }
}

var css_248z =
  '.styles_calendar__kghkr {\n  display: block;\n  max-width: 100%;\n  height: auto;\n  overflow: visible;\n}\n\n.styles_calendar__kghkr text {\n  fill: currentColor;\n}\n\n.styles_block__zu71P {\n  stroke: rgba(0, 0, 0, 0.1);\n  stroke-width: 1px;\n  shape-rendering: geometricPrecision;\n}\n\n.styles_footer__ltlVl {\n  display: flex;\n}\n\n.styles_legendColors__FYXRi {\n  margin-left: auto;\n  display: flex;\n  align-items: center;\n  gap: 0.2em;\n}\n\n/*noinspection CssUnresolvedCustomProperty*/\n@keyframes styles_loadingAnimation__zshgF {\n  0% {\n    fill: var(--react-activity-calendar-loading);\n  }\n  50% {\n    fill: var(--react-activity-calendar-loading-active);\n  }\n  100% {\n    fill: var(--react-activity-calendar-loading);\n  }\n}\n'
var styles = {
  calendar: 'styles_calendar__kghkr',
  block: 'styles_block__zu71P',
  footer: 'styles_footer__ltlVl',
  legendColors: 'styles_legendColors__FYXRi',
  loadingAnimation: 'styles_loadingAnimation__zshgF',
}
styleInject(css_248z)

const NAMESPACE = 'react-activity-calendar'
const MIN_DISTANCE_MONTH_LABELS = 2
const DEFAULT_THEME = createCalendarTheme('#042a33')
function groupByWeeks(days) {
  let weekStart = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0
  if (days.length === 0) {
    return []
  }

  // The calendar expects a continuous sequence of days, so fill gaps with empty
  // activity data.
  const normalizedDays = normalizeCalendarDays(days)

  // Determine the first date of the calendar. If the first contribution date is
  // not the specified weekday, the desired day one week earlier is selected.
  const firstDate = dateFns.parseISO(normalizedDays[0].date)
  const firstCalendarDate =
    dateFns.getDay(firstDate) === weekStart
      ? firstDate
      : dateFns.subWeeks(dateFns.nextDay(firstDate, weekStart), 1)

  // To correctly group contributions by week, it is necessary to left pad the
  // list because the first date might not be desired weekday.
  const paddedDays = [
    ...Array(dateFns.differenceInCalendarDays(firstDate, firstCalendarDate)).fill(undefined),
    ...normalizedDays,
  ]
  return Array(Math.ceil(paddedDays.length / 7))
    .fill(undefined)
    .map((_, calendarWeek) => paddedDays.slice(calendarWeek * 7, calendarWeek * 7 + 7))
}
function normalizeCalendarDays(days) {
  const daysMap = days.reduce((map, day) => {
    map.set(day.date, day)
    return map
  }, new Map())
  return dateFns
    .eachDayOfInterval({
      start: dateFns.parseISO(days[0].date),
      end: dateFns.parseISO(days[days.length - 1].date),
    })
    .map((day) => {
      const date = dateFns.formatISO(day, {
        representation: 'date',
      })
      if (daysMap.has(date)) {
        return daysMap.get(date)
      }
      return {
        date,
        count: 0,
        level: 0,
      }
    })
}
function getMonthLabels(weeks) {
  let monthNames =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_MONTH_LABELS
  return weeks
    .reduce((labels, week, index) => {
      const firstWeekDay = week.find((day) => day !== undefined)
      if (!firstWeekDay) {
        throw new Error(`Unexpected error: Week is empty: [${week}]`)
      }
      const month = monthNames[dateFns.getMonth(dateFns.parseISO(firstWeekDay.date))]
      const prev = labels[labels.length - 1]
      if (index === 0 || prev.text !== month) {
        return [
          ...labels,
          {
            x: index,
            y: 0,
            text: month,
          },
        ]
      }
      return labels
    }, [])
    .filter((label, index, labels) => {
      if (index === 0) {
        return labels[1] && labels[1].x - label.x > MIN_DISTANCE_MONTH_LABELS
      }
      return true
    })
}
function createCalendarTheme(baseColor) {
  let emptyColor =
    arguments.length > 1 && arguments[1] !== undefined
      ? arguments[1]
      : color__default.default('white').darken(8).toHslString()
  const base = color__default.default(baseColor)
  if (!base.isValid()) {
    return DEFAULT_THEME
  }
  return {
    level4: base.setAlpha(0.92).toHslString(),
    level3: base.setAlpha(0.76).toHslString(),
    level2: base.setAlpha(0.6).toHslString(),
    level1: base.setAlpha(0.44).toHslString(),
    level0: emptyColor,
  }
}
function getTheme(theme, color) {
  if (theme) {
    return Object.assign({}, DEFAULT_THEME, theme)
  }
  if (color) {
    return createCalendarTheme(color)
  }
  return DEFAULT_THEME
}
function getClassName(name, styles) {
  if (styles) {
    return `${NAMESPACE}__${name} ${styles}`
  }
  return `${NAMESPACE}__${name}`
}
function generateEmptyData() {
  const year = new Date().getFullYear()
  const days = dateFns.eachDayOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31),
  })
  return days.map((date) => ({
    date: dateFns.formatISO(date, {
      representation: 'date',
    }),
    count: 0,
    level: 0,
  }))
}
const DEFAULT_MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const DEFAULT_WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DEFAULT_LABELS = {
  months: DEFAULT_MONTH_LABELS,
  weekdays: DEFAULT_WEEKDAY_LABELS,
  totalCount: '{{count}} contributions in {{year}}',
  tooltip: '<strong>{{count}} contributions</strong> on {{date}}',
  legend: {
    less: 'Less',
    more: 'More',
  },
}

const ActivityCalendar = (_ref) => {
  let {
    data,
    blockMargin = 4,
    blockRadius = 2,
    blockSize = 12,
    children,
    color = undefined,
    dateFormat = 'MMM do, yyyy',
    eventHandlers = {},
    fontSize = 14,
    hideColorLegend = false,
    hideMonthLabels = false,
    hideTotalCount = false,
    labels: labelsProp,
    loading = false,
    showWeekdayLabels = false,
    style = {},
    theme: themeProp,
    totalCount: totalCountProp,
    weekStart = 0, // Sunday
  } = _ref
  if (loading) {
    data = generateEmptyData()
  }
  if (data.length === 0) {
    return null
  }
  const year = dateFns.getYear(dateFns.parseISO(data[0]?.date))
  const weeks = groupByWeeks(data, weekStart)
  const totalCount =
    typeof totalCountProp === 'number'
      ? totalCountProp
      : data.reduce((sum, day) => sum + day.count, 0)
  const theme = getTheme(themeProp, color)
  const labels = Object.assign({}, DEFAULT_LABELS, labelsProp)
  const textHeight = hideMonthLabels ? 0 : fontSize + 2 * blockMargin
  function getDimensions() {
    return {
      width: weeks.length * (blockSize + blockMargin) - blockMargin,
      height: textHeight + (blockSize + blockMargin) * 7 - blockMargin,
    }
  }
  const getTooltipMessage =
    typeof labels.tooltip === 'function'
      ? labels.tooltip
      : (contribution) => {
          var _labels$tooltip
          const date = dateFns.format(dateFns.parseISO(contribution.date), dateFormat)
          const tooltip =
            (_labels$tooltip = labels.tooltip) !== null && _labels$tooltip !== void 0
              ? _labels$tooltip
              : DEFAULT_LABELS.tooltip
          return tooltip
            .replaceAll('{{count}}', String(contribution.count))
            .replaceAll('{{date}}', date)
        }
  function getEventHandlers(data) {
    return Object.keys(eventHandlers).reduce(
      (handlers, key) => ({
        ...handlers,
        [key]: (event) => eventHandlers[key]?.(event)(data),
      }),
      {}
    )
  }
  function renderLabels() {
    const style = {
      fontSize,
    }
    if (!showWeekdayLabels && hideMonthLabels) {
      return null
    }
    return /*#__PURE__*/ React__default.default.createElement(
      React__default.default.Fragment,
      null,
      showWeekdayLabels &&
        /*#__PURE__*/ React__default.default.createElement(
          'g',
          {
            className: getClassName('legend-weekday'),
            style: style,
          },
          weeks[0].map((day, index) => {
            if (index % 2 === 0) {
              return null
            }
            const dayIndex = (index + weekStart) % 7
            return /*#__PURE__*/ React__default.default.createElement(
              'text',
              {
                x: -2 * blockMargin,
                y: textHeight + (fontSize / 2 + blockMargin) + (blockSize + blockMargin) * index,
                textAnchor: 'end',
                key: index,
              },
              labels.weekdays ? labels.weekdays[dayIndex] : DEFAULT_WEEKDAY_LABELS[dayIndex]
            )
          })
        ),
      !hideMonthLabels &&
        /*#__PURE__*/ React__default.default.createElement(
          'g',
          {
            className: getClassName('legend-month'),
            style: style,
          },
          getMonthLabels(weeks, labels.months).map((_ref2, index, labels) => {
            let { text, x } = _ref2
            // Skip the first month label if there's not enough space to the next one
            if (index === 0 && labels[1] && labels[1].x - x <= MIN_DISTANCE_MONTH_LABELS) {
              return null
            }
            return /*#__PURE__*/ React__default.default.createElement(
              'text',
              {
                x: (blockSize + blockMargin) * x,
                alignmentBaseline: 'hanging',
                key: x,
              },
              text
            )
          })
        )
    )
  }
  function renderBlocks() {
    return weeks
      .map((week, weekIndex) =>
        week.map((day, dayIndex) => {
          if (!day) {
            return null
          }
          const style = loading
            ? {
                animation: `${styles.loadingAnimation} 1.5s ease-in-out infinite`,
                animationDelay: `${weekIndex * 20 + dayIndex * 20}ms`,
              }
            : undefined
          return /*#__PURE__*/ React__default.default.createElement(
            'rect',
            _extends({}, getEventHandlers(day), {
              x: 0,
              y: textHeight + (blockSize + blockMargin) * dayIndex,
              width: blockSize,
              height: blockSize,
              fill: theme[`level${day.level}`],
              rx: blockRadius,
              ry: blockRadius,
              className: styles.block,
              'data-date': day.date,
              'data-tip': children ? getTooltipMessage(day) : undefined,
              key: day.date,
              style: style,
            })
          )
        })
      )
      .map((week, x) =>
        /*#__PURE__*/ React__default.default.createElement(
          'g',
          {
            key: x,
            transform: `translate(${(blockSize + blockMargin) * x}, 0)`,
          },
          week
        )
      )
  }
  function renderFooter() {
    var _labels$legend$less, _labels$legend$more
    if (hideTotalCount && hideColorLegend) {
      return null
    }
    return /*#__PURE__*/ React__default.default.createElement(
      'footer',
      {
        className: getClassName('footer', styles.footer),
        style: {
          marginTop: 2 * blockMargin,
          fontSize,
        },
      },
      loading && /*#__PURE__*/ React__default.default.createElement('div', null, '\xA0'),
      !loading &&
        !hideTotalCount &&
        /*#__PURE__*/ React__default.default.createElement(
          'div',
          {
            className: getClassName('count'),
          },
          labels.totalCount
            ? labels.totalCount
                .replace('{{count}}', String(totalCount))
                .replace('{{year}}', String(year))
            : `${totalCount} contributions in ${year}`
        ),
      !loading &&
        !hideColorLegend &&
        /*#__PURE__*/ React__default.default.createElement(
          'div',
          {
            className: getClassName('legend-colors', styles.legendColors),
          },
          /*#__PURE__*/ React__default.default.createElement(
            'span',
            {
              style: {
                marginRight: '0.4em',
              },
            },
            (_labels$legend$less = labels?.legend?.less) !== null && _labels$legend$less !== void 0
              ? _labels$legend$less
              : 'Less'
          ),
          Array(5)
            .fill(undefined)
            .map((_, index) =>
              /*#__PURE__*/ React__default.default.createElement(
                'svg',
                {
                  width: blockSize,
                  height: blockSize,
                  key: index,
                },
                /*#__PURE__*/ React__default.default.createElement('rect', {
                  width: blockSize,
                  height: blockSize,
                  fill: theme[`level${index}`],
                  rx: blockRadius,
                  ry: blockRadius,
                })
              )
            ),
          /*#__PURE__*/ React__default.default.createElement(
            'span',
            {
              style: {
                marginLeft: '0.4em',
              },
            },
            (_labels$legend$more = labels?.legend?.more) !== null && _labels$legend$more !== void 0
              ? _labels$legend$more
              : 'More'
          )
        )
    )
  }
  const { width, height } = getDimensions()
  const additionalStyles = {
    maxWidth: width,
    // Required for correct colors in CSS loading animation
    [`--${NAMESPACE}-loading`]: theme.level0,
    [`--${NAMESPACE}-loading-active`]: color__default.default(theme.level0).darken(8).toString(),
  }
  return /*#__PURE__*/ React__default.default.createElement(
    'article',
    {
      className: NAMESPACE,
      style: {
        ...style,
        ...additionalStyles,
      },
    },
    /*#__PURE__*/ React__default.default.createElement(
      'svg',
      {
        width: width,
        height: height,
        viewBox: `0 0 ${width} ${height}`,
        className: getClassName('calendar', styles.calendar),
      },
      !loading && renderLabels(),
      renderBlocks()
    ),
    renderFooter(),
    children
  )
}
const Skeleton = (props) =>
  /*#__PURE__*/ React__default.default.createElement(
    ActivityCalendar,
    _extends(
      {
        data: [],
      },
      props
    )
  )

exports.Skeleton = Skeleton
exports.createCalendarTheme = createCalendarTheme
exports.default = ActivityCalendar
//# sourceMappingURL=index.js.map