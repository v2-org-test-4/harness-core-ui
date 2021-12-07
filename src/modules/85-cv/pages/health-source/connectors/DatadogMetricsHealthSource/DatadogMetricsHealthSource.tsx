import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Formik, FormikForm, Utils } from '@wings-software/uicore'
import { noop } from 'lodash-es'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import isEmpty from 'lodash-es/isEmpty'
import { useStrings } from 'framework/strings'
import type {
  DatadogMetricInfo,
  DatadogMetricsHealthSourceProps
} from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.type'
import {
  validateFormMappings,
  getManuallyCreatedQueries,
  mapDatadogMetricHealthSourceToDatadogMetricSetupSource,
  validate,
  mapSelectedWidgetDataToDatadogMetricInfo,
  mapDatadogDashboardDetailToMetricWidget,
  getSelectedDashboards,
  mapDatadogMetricSetupSourceToDatadogHealthSource
} from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.utils'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  DatadogDashboardDetail,
  TimeSeriesSampleDTO,
  useGetDatadogActiveMetrics,
  useGetDatadogDashboardDetails,
  useGetDatadogSampleData,
  useGetDatadogMetricTagsList
} from 'services/cv'
import { MANUAL_INPUT_QUERY } from '@cv/pages/health-source/connectors/GCOMetricsHealthSource/components/ManualInputQueryModal/ManualInputQueryModal'
import { DatasourceTypeEnum } from '@cv/pages/monitored-service/components/ServiceHealth/components/MetricsAndLogs/MetricsAndLogs.types'
import { DatadogMetricsHealthSourceFieldNames } from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/DatadogMetricsHealthSource.constants'
import type { MetricWidget } from '@cv/components/MetricDashboardWidgetNav/MetricDashboardWidgetNav.type'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import CloudMetricsHealthSource from '@cv/components/CloudMetricsHealthSource/CloudMetricsHealthSource'
import type { SelectedWidgetMetricData } from '@cv/components/CloudMetricsHealthSource/CloudMetricsHealthSource.type'
import DatadogMetricsDetailsContent from '@cv/pages/health-source/connectors/DatadogMetricsHealthSource/components/DatadogMetricsDetailsContent/DatadogMetricsDetailsContent'
import { DatadogMetricsQueryExtractor } from './components/DatadogMetricsDetailsContent/DatadogMetricsDetailsContent.utils'

export default function DatadogMetricsHealthSource(props: DatadogMetricsHealthSourceProps): JSX.Element {
  const { data } = props
  const { getString } = useStrings()
  const transformedData = useMemo(() => mapDatadogMetricHealthSourceToDatadogMetricSetupSource(data), [data])
  const [metricHealthDetailsData, setMetricHealthDetailsData] = useState(transformedData.metricDefinition)
  const [activeMetricsTracingId, metricTagsTracingId] = useMemo(() => [Utils.randomId(), Utils.randomId()], [])
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()
  const [selectedMetric, setSelectedMetric] = useState<string>()
  const selectedMetricData = metricHealthDetailsData.get(selectedMetric || '')
  const { data: activeMetrics } = useGetDatadogActiveMetrics({
    queryParams: {
      projectIdentifier,
      orgIdentifier,
      accountId,
      connectorIdentifier: data.connectorRef as string,
      tracingId: activeMetricsTracingId
    }
  })
  const {
    data: timeseriesData,
    refetch: timeseriesRefech,
    loading: timeseriesLoading,
    error: timeseriesDataError
  } = useGetDatadogSampleData({ lazy: true })
  const timeseriesDataErrorMessage = useMemo(() => {
    return getErrorMessage(timeseriesDataError)
  }, [timeseriesDataError])
  const [currentTimeseriesData, setCurrentTimeseriesData] = useState<TimeSeriesSampleDTO[] | null>(
    timeseriesData?.data || null
  )
  useEffect(() => {
    setCurrentTimeseriesData(timeseriesData?.data || null)
  }, [timeseriesData?.data])
  const { data: metricTags, refetch: refetchMetricTags } = useGetDatadogMetricTagsList({
    lazy: true
  })
  useEffect(() => {
    if (selectedMetricData?.metric) {
      refetchMetricTags({
        queryParams: {
          projectIdentifier,
          orgIdentifier,
          accountId,
          connectorIdentifier: data.connectorRef,
          tracingId: metricTagsTracingId,
          metric: selectedMetricData.metric
        }
      })
    }
  }, [
    selectedMetricData?.metric,
    projectIdentifier,
    orgIdentifier,
    accountId,
    data.connectorRef,
    activeMetricsTracingId,
    refetchMetricTags,
    metricTagsTracingId
  ])
  const selectedDashboards = useMemo(() => {
    return getSelectedDashboards(data)
  }, [data])
  const handleOnTimeseriesFetch = (): void => {
    if (selectedMetricData?.query) {
      timeseriesRefech({
        queryParams: {
          orgIdentifier,
          projectIdentifier,
          accountId,
          tracingId: Utils.randomId(),
          connectorIdentifier: data.connectorRef as string,
          query: selectedMetricData?.query
        }
      })
    }
  }
  useEffect(() => {
    if (!activeMetrics?.data) {
      return
    }
    if (selectedMetricData && selectedMetricData.metricName && !selectedMetricData.metric) {
      const queryExtractor = DatadogMetricsQueryExtractor(selectedMetricData.query || '', activeMetrics?.data || [])
      metricHealthDetailsData.set(selectedMetricData.metricName, {
        ...selectedMetricData,
        metric: queryExtractor.activeMetric
      })
    }
  }, [activeMetrics?.data, selectedMetricData, metricHealthDetailsData])
  const handleOnMetricSelected = (
    selectedWidgetMetricData: SelectedWidgetMetricData,
    formikProps: FormikProps<DatadogMetricInfo>
  ): void => {
    let metricInfo: DatadogMetricInfo | undefined = metricHealthDetailsData.get(selectedWidgetMetricData.metricName)
    const query = selectedWidgetMetricData.query === MANUAL_INPUT_QUERY ? '' : selectedWidgetMetricData.query
    if (!metricInfo) {
      metricInfo = mapSelectedWidgetDataToDatadogMetricInfo(selectedWidgetMetricData, query, activeMetrics?.data || [])
    }
    metricHealthDetailsData.set(selectedWidgetMetricData.metricName, metricInfo)
    if (selectedMetric) {
      // save changes for previous metric
      metricHealthDetailsData.set(selectedMetric, { ...selectedMetricData, ...formikProps.values })
    }
    setMetricHealthDetailsData(new Map(metricHealthDetailsData))
    setSelectedMetric(selectedWidgetMetricData.metricName)
    setCurrentTimeseriesData(null)
  }
  const handleOnNext = async (formikProps: FormikProps<DatadogMetricInfo>): Promise<void> => {
    formikProps.setTouched({
      ...formikProps.touched,
      [DatadogMetricsHealthSourceFieldNames.RISK_CATEGORY]: true,
      [DatadogMetricsHealthSourceFieldNames.HIGHER_BASELINE_DEVIATION]: true,
      [DatadogMetricsHealthSourceFieldNames.LOWER_BASELINE_DEVIATION]: true
    })
    const errors = validate(formikProps.values, metricHealthDetailsData, getString)
    if (!isEmpty(errors)) {
      formikProps.setErrors({ ...errors })
      return
    }
    if (selectedMetric) {
      metricHealthDetailsData.set(selectedMetric, { ...selectedMetricData, ...formikProps.values })
    }
    const filteredData = new Map()
    for (const metric of metricHealthDetailsData) {
      const [metricName, metricInfo] = metric
      if (isEmpty(validateFormMappings(metricInfo, getString))) {
        filteredData.set(metricName, metricInfo)
      }
    }
    await props.onSubmit(
      data,
      mapDatadogMetricSetupSourceToDatadogHealthSource({
        ...transformedData,
        metricDefinition: filteredData
      })
    )
  }
  const dashboardRequest = useGetDatadogDashboardDetails({ lazy: true })
  const dashboardDetailToMetricWidgetItemMapper = useCallback(
    (datadogDashboardDetail: DatadogDashboardDetail): MetricWidget => {
      return mapDatadogDashboardDetailToMetricWidget(datadogDashboardDetail)
    },
    []
  )
  return (
    <Formik<DatadogMetricInfo>
      enableReinitialize={true}
      formName="mapDatadogMetrics"
      initialValues={selectedMetricData || {}}
      onSubmit={noop}
      validate={values => {
        const newMap = new Map(metricHealthDetailsData)
        if (selectedMetric) {
          newMap.set(selectedMetric, { ...values })
        }
        return validate(values, newMap, getString)
      }}
    >
      {formikProps => (
        <FormikForm>
          <CloudMetricsHealthSource
            dashboardDetailRequest={dashboardRequest}
            dashboardDetailMapper={dashboardDetailToMetricWidgetItemMapper}
            dataSourceType={DatasourceTypeEnum.DATADOG_METRICS}
            addManualQueryTitle={'cv.monitoringSources.datadog.manualInputQueryModal.modalTitle'}
            manualQueries={getManuallyCreatedQueries(metricHealthDetailsData)}
            onNextClicked={() => handleOnNext(formikProps)}
            selectedMetricInfo={{
              query: formikProps.values.query,
              queryEditable: false,
              timeseriesData: currentTimeseriesData
            }}
            onFetchTimeseriesData={handleOnTimeseriesFetch}
            timeseriesDataLoading={timeseriesLoading}
            timeseriesDataError={timeseriesDataErrorMessage}
            dashboards={selectedDashboards}
            connectorRef={data?.connectorRef as string}
            onWidgetMetricSelected={selectedWidgetMetricData =>
              handleOnMetricSelected(selectedWidgetMetricData, formikProps)
            }
            metricDetailsContent={
              <DatadogMetricsDetailsContent
                selectedMetric={selectedMetric}
                selectedMetricData={selectedMetricData}
                metricHealthDetailsData={metricHealthDetailsData}
                formikProps={formikProps}
                setMetricHealthDetailsData={setMetricHealthDetailsData}
                metricTags={metricTags?.data || []}
                activeMetrics={activeMetrics?.data || []}
              />
            }
          />
        </FormikForm>
      )}
    </Formik>
  )
}