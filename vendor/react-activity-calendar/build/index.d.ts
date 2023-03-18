/// <reference types="node" />

import { Day as WeekDay } from 'date-fns'
import { CSSProperties, DOMAttributes, FunctionComponent, ReactNode } from 'react'
import { ColorInput } from 'tinycolor2'

export type Level = 0 | 1 | 2 | 3 | 4
export interface Day {
  date: string
  count: number
  level: Level
}
export type Labels = Partial<{
  readonly months: Array<string>
  readonly weekdays: Array<string>
  readonly totalCount: string
  readonly tooltip: string | ((contribution: Day) => string)
  readonly legend: Partial<{
    readonly less: string
    readonly more: string
  }>
}>
export interface Theme {
  readonly level4: string
  readonly level3: string
  readonly level2: string
  readonly level1: string
  readonly level0: string
}
export type SVGRectEventHandler = Omit<
  DOMAttributes<SVGRectElement>,
  'css' | 'children' | 'dangerouslySetInnerHTML'
>
export type EventHandlerMap = {
  [key in keyof SVGRectEventHandler]: (
    ...event: Parameters<NonNullable<SVGRectEventHandler[keyof SVGRectEventHandler]>>
  ) => (data: Day) => void
}
export type CalendarData = Array<Day>
export interface Props {
  /**
   * List of calendar entries. Every `Day` object requires an ISO 8601 `date`
   * property in the format `yyyy-MM-dd`, a `count` property with the amount
   * of tracked data and finally a `level` property in the range `0 - 4` to
   * specify activity intensity.
   *
   * Example object:
   *
   * ```json
   * {
   *   date: "2021-02-20",
   *   count: 16,
   *   level: 3
   * }
   * ```
   */
  data: CalendarData
  /**
   * Margin between blocks in pixels.
   */
  blockMargin?: number
  /**
   * Border radius of blocks in pixels.
   */
  blockRadius?: number
  /**
   * Block size in pixels.
   */
  blockSize?: number
  /**
   * Pass `<ReactTooltip html />` as child to show tooltips.
   */
  children?: ReactNode
  /**
   * Base color to compute graph intensity hues (the darkest color). Any valid CSS color is accepted
   */
  color?: ColorInput
  /**
   * A date-fns/format compatible date string used in tooltips.
   */
  dateFormat?: string
  /**
   * Event handlers to register for the SVG `<rect>` elements that are used to render the calendar days. Handler signature: `event => data => void`
   */
  eventHandlers?: EventHandlerMap
  /**
   * Font size for text in pixels.
   */
  fontSize?: number
  /**
   * Toggle to hide color legend below calendar.
   */
  hideColorLegend?: boolean
  /**
   * Toggle to hide month labels above calendar.
   */
  hideMonthLabels?: boolean
  /**
   * Toggle to hide total count below calendar.
   */
  hideTotalCount?: boolean
  /**
   * Localization strings for all calendar labels.
   *
   * - `totalCount` supports the placeholders `{{count}}` and `{{year}}`.
   * - `tooltip` supports the placeholders `{{count}}` and `{{date}}`.
   */
  labels?: Labels
  /**
   * Toggle for loading state. `data` property will be ignored if set.
   */
  loading?: boolean
  /**
   * Toggle to show weekday labels left to the calendar.
   */
  showWeekdayLabels?: boolean
  /**
   * Style object to pass to component container.
   */
  style?: CSSProperties
  /**
   * An object specifying all theme colors explicitly`.
   */
  theme?: Theme
  /**
   * Overwrite the total activity count.
   */
  totalCount?: number
  /**
   * Index of day to be used as start of week. 0 represents Sunday.
   */
  weekStart?: WeekDay
}
declare const ActivityCalendar: FunctionComponent<Props>
export declare const Skeleton: FunctionComponent<Omit<Props, 'data'>>
export declare function createCalendarTheme(baseColor: ColorInput, emptyColor?: string): Theme

export { ActivityCalendar as default }

export {}