import React from 'react'
import ActivityCalendar from 'react-activity-calendar'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Tooltip as ReactTooltip } from 'react-tooltip'

const RANGES = [0, 15 * 60, 45 * 60, 2 * 60 * 60]

const valueToLevel = (value) => {
  for (let i = 0; i < RANGES.length; i++) {
    const element = RANGES[i]
    if (value <= element) {
      return i
    }
  }
  return RANGES.length
}

const readCalData = (data) => {
  let days = []
  const now = dayjs()
  const nowDate = now.toDate().toISOString()
  const lastyear = now.subtract(1, 'year')
  const year = lastyear.toDate().toISOString()

  let foundToday = false
  let totalReadTime = 0

  for (const [date, value] of Object.entries(data)) {
    if (date < year) {
      continue
    }
    if (nowDate == date) {
      foundToday = true
    }
    totalReadTime += value
    days.push({
      date,
      count: Math.round(value),
      level: valueToLevel(value),
    })
  }
  if (!foundToday) {
    days.push({
      date: nowDate,
      count: 0.0,
      level: valueToLevel(0.0),
    })
  }
  return { days, totalReadTime }
}

export const DEFAULT_LIGHT_THEME = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']

export const DEFAULT_DARK_THEME = [
  '#282828',
  'rgba(79, 140, 201, .25)',
  'rgba(79, 140, 201, .50)',
  'rgba(79, 140, 201, .75)',
  '#4f8cc9',
]

const ReadingActivity = (props) => {
  dayjs.extend(duration)
  dayjs.extend(relativeTime)

  let { days: data, totalReadTime } = readCalData(props.rawCalData)
  let readTimeStr = dayjs.duration(totalReadTime, 'seconds').humanize()

  let labels = {
    totalCount: `${readTimeStr} read in the last year.`,
  }
  let theme = { light: DEFAULT_LIGHT_THEME, dark: DEFAULT_DARK_THEME }
  return (
    <div className="overflow-x-scroll">
      <ActivityCalendar
        style={{ minWidth: '40rem', paddingTop: '10px' }}
        data={data}
        theme={theme}
        labels={labels}
        hideTotalCount={true}
        renderBlock={(block, day) =>
          React.cloneElement(block, {
            'data-tooltip-id': 'react-tooltip',
            'data-tooltip-html':
              day.count === 0
                ? `No reading on ${day.date}`
                : `${dayjs.duration(day.count, 'seconds').humanize()} spent reading on ${day.date}`,
          })
        }
      />
      {/* <ReactTooltip id="react-tooltip" /> */}
    </div>
  )
}

export default ReadingActivity
