/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import cx from 'classnames'
import { Container, Text, Icon, Layout, Card } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import moment from 'moment'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { defaultTo, merge } from 'lodash-es'
import { Duration, TimeAgoPopover, UserLabel } from '@common/exports'
import { useStrings } from 'framework/strings'
import { diffStartAndEndTime, roundNumber } from '@pipeline/components/Dashboards/shared'
import { defaultChartOptions } from '@pipeline/components/Dashboards/BuildCards/RepositoryCard'
import styles from './CardWithChart.module.scss'

interface BuildCount {
  count?: number
}
interface BuildInfo {
  builds?: BuildCount
  time?: number
}

export interface ServiceCardWithChartProps {
  title: string
  message?: string
  username?: string
  startTime?: number
  endTime?: number
  count: number
  successRate: number
  successRateDiff: number
  countLabel?: string
  seriesName?: string
  countList?: BuildInfo[]
  onClick?: () => void
  className?: string
}

export default function ServiceCardWithChart({
  title,
  message,
  username,
  startTime,
  endTime,
  count,
  successRate,
  successRateDiff,
  countLabel = 'builds',
  seriesName = 'Builds',
  countList,
  onClick,
  className
}: ServiceCardWithChartProps) {
  const { getString } = useStrings()
  const [chartOptions, setChartOptions] = useState(defaultChartOptions)
  const duration = diffStartAndEndTime(startTime, endTime)
  const mapTime = (value: BuildInfo) => (value?.time ? moment(value.time).format('YYYY-MM-DD') : '')

  useEffect(() => {
    if (countList?.length) {
      setChartOptions(
        merge({}, defaultChartOptions, {
          tooltip: {
            enabled: true
          },
          xAxis: {
            categories: countList.map(mapTime)
          },
          series: [
            {
              name: seriesName,
              type: 'line',
              color: 'var(--ci-color-blue-500)',
              data: countList.map(val => val?.builds?.count)
            }
          ]
        })
      )
    }
  }, [countList])

  const rateColor = successRateDiff >= 0 ? 'var(--ci-color-green-500)' : 'var(--ci-color-red-500)'
  return (
    <Card className={cx(styles.repositoryCard, className)} onClick={onClick}>
      <div className={styles.content}>
        <Text className={styles.title} lineClamp={1}>
          {title}
        </Text>
        <Container className={styles.mainContent}>
          <Container>
            <Container className={styles.cardStats}>
              <Text className={styles.statHeader}>{countLabel}</Text>
              <Text className={styles.statHeader}>{getString('pipeline.dashboards.successRate')}</Text>
              <Text className={styles.statContent}>{count}</Text>
              <Container className={styles.statWrap}>
                <Text className={styles.statContent}>{roundNumber(successRate)}%</Text>
                <Icon
                  size={14}
                  name={successRateDiff >= 0 ? 'caret-up' : 'caret-down'}
                  style={{
                    color: rateColor
                  }}
                />
                <Text
                  className={styles.rateDiffValue}
                  style={{
                    color: rateColor
                  }}
                >
                  {Math.abs(roundNumber(successRateDiff)!)}%
                </Text>
              </Container>
            </Container>
          </Container>
          <Container className={styles.chartWrapper} height={40} margin={{ left: 'medium' }}>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </Container>
        </Container>
      </div>
      <Layout.Horizontal className={styles.cardFooter} spacing="small">
        <Layout.Horizontal className={styles.avatarWrapper} spacing="small">
          {username && ( //todo: decision pending on whether to keepit or not
            <UserLabel
              name={username}
              textProps={{
                lineClamp: 1,
                font: { variation: FontVariation.TINY },
                alwaysShowTooltip: false
              }}
              iconProps={{ color: Color.GREY_900 }}
              className={styles.userLabel}
            />
          )}
          {message ? ( //todo: decision pending on whether to keepit or not
            <Text
              font={{ variation: FontVariation.TINY }}
              lineClamp={2}
              color={Color.GREY_900}
              className={styles.message}
            >
              {message}
            </Text>
          ) : null}
        </Layout.Horizontal>
        <Layout.Horizontal flex={{ justifyContent: 'end' }} className={styles.times} spacing="xsmall">
          {startTime ? (
            <TimeAgoPopover
              iconProps={{
                size: 10,
                color: Color.GREY_900
              }}
              icon="calendar"
              time={defaultTo(startTime, 0)}
              inline={false}
              className={styles.timeAgo}
              font={{ variation: FontVariation.TINY }}
            />
          ) : null}
          {duration ? (
            <Duration
              icon="time"
              className={styles.duration}
              iconProps={{
                size: 10,
                color: Color.GREY_900
              }}
              startTime={startTime}
              endTime={endTime}
              durationText={' '}
              font={{ variation: FontVariation.TINY }}
            />
          ) : null}
        </Layout.Horizontal>
      </Layout.Horizontal>
    </Card>
  )
}