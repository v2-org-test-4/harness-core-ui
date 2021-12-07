import React, { useEffect } from 'react'
import { Color, Container, Icon, NoDataCard, PageError, Text } from '@wings-software/uicore'
import cx from 'classnames'
import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { useStrings } from 'framework/strings'
import css from './MetricsValidationChart.module.scss'

const GroupByClause = 'groupByFields'

export interface MetricsValidationChartProps {
  loading: boolean
  error?: string
  queryValue?: string
  onRetry: () => void
  sampleData?: Highcharts.Options
  setAsTooManyMetrics?: (_: boolean) => void
  isQueryExecuted?: boolean
}

export default function MetricsValidationChart(props: MetricsValidationChartProps): JSX.Element {
  const { loading, error, queryValue, onRetry, sampleData, setAsTooManyMetrics, isQueryExecuted = false } = props
  const { getString } = useStrings()
  const isTooManyMetrics = Boolean(
    sampleData?.series?.length && sampleData.series.length > 1 && queryValue?.includes(GroupByClause)
  )

  useEffect(() => {
    setAsTooManyMetrics?.(isTooManyMetrics)
  }, [sampleData])

  if (!queryValue?.length) {
    return (
      <Container className={cx(css.chartContainer, css.noDataContainer)}>
        <NoDataCard
          icon="main-notes"
          message={getString('cv.monitoringSources.gco.mapMetricsToServicesPage.enterQueryForValidation')}
        />
      </Container>
    )
  }

  if (!isQueryExecuted) {
    return (
      <Container className={cx(css.chartContainer, css.noDataContainer)}>
        <NoDataCard
          icon="timeline-line-chart"
          message={getString('cv.monitoringSources.gcoLogs.submitQueryToSeeRecords')}
        />
      </Container>
    )
  }

  if (loading) {
    return (
      <Container className={css.loadingContainer}>
        <Icon name="steps-spinner" size={32} color={Color.GREY_600} />
      </Container>
    )
  }

  if (error) {
    return (
      <Container className={css.chartContainer}>
        <PageError message={error} onClick={() => onRetry()} />
      </Container>
    )
  }

  if (!sampleData?.series?.length) {
    return (
      <Container className={cx(css.chartContainer, css.noDataContainer)}>
        <NoDataCard
          icon="warning-sign"
          message={getString('cv.monitoringSources.gco.mapMetricsToServicesPage.noDataForQuery')}
          buttonText={getString('retry')}
          onClick={() => onRetry()}
        />
      </Container>
    )
  }

  return (
    <Container className={css.chartContainer}>
      <HighchartsReact highcharts={Highcharts} options={sampleData} />
      {isTooManyMetrics && (
        <Text
          intent="danger"
          font={{ size: 'small' }}
          className={css.tooManyRecords}
          icon="warning-sign"
          iconProps={{ intent: 'danger' }}
        >
          {getString('cv.monitoringSources.gco.mapMetricsToServicesPage.validation.tooManyMetrics')}
        </Text>
      )}
    </Container>
  )
}