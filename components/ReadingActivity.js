import Calendar from 'react-activity-calendar'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useTheme } from 'next-themes'
import ReactTooltip from 'react-tooltip'

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

export const DEFAULT_LIGHT_THEME = {
  level4: '#216e39',
  level3: '#30a14e',
  level2: '#40c463',
  level1: '#9be9a8',
  level0: '#ebedf0',
}

export const DEFAULT_DARK_THEME = {
  level4: '#4f8cc9',
  level3: 'rgba(79, 140, 201, .75)',
  level2: 'rgba(79, 140, 201, .50)',
  level1: 'rgba(79, 140, 201, .25)',
  level0: '#282828',
}

const ReadingActivity = (props) => {
  let { resolvedTheme } = useTheme()
  dayjs.extend(duration)
  dayjs.extend(relativeTime)

  let { days: data, totalReadTime } = readCalData(props.rawCalData)
  let readTimeStr = dayjs.duration(totalReadTime, 'seconds').humanize()
  let theme = resolvedTheme === 'light' ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME

  let labels = {
    totalCount: `${readTimeStr} read in the last year.`,
    // Cannot humanize the seconds sadly
    tooltip: '{{date}}: {{count}} seconds',
  }
  return (
    <div className="flex overflow-x-scroll pt-4">
      <Calendar
        style={{ minWidth: '40rem' }}
        data={data}
        theme={theme}
        labels={labels}
        hideTotalCount={true}
      >
        <ReactTooltip html />
      </Calendar>
    </div>
  )
}

export default ReadingActivity
