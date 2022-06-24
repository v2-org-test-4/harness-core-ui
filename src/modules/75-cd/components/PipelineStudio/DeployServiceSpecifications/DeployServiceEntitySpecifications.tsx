/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { Card, Container, Layout, MultiTypeInputType, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import produce from 'immer'
import { debounce, defaultTo, get, isEmpty, noop, set, unset } from 'lodash-es'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'

import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  NGServiceConfig,
  ServiceConfig,
  ServiceDefinition,
  ServiceResponseDTO,
  StageElementConfig,
  useGetRuntimeInputsServiceEntity,
  useGetServiceV2
} from 'services/cd-ng'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { getStageIndexFromPipeline } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import type { K8SDirectServiceStep } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpecInterface'
import DeployServiceErrors from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceErrors'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import {
  DeployTabs,
  getServiceEntityServiceRef,
  isNewServiceEnvEntity
} from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import SelectDeploymentType from '@cd/components/PipelineStudio/DeployServiceSpecifications/SelectDeploymentType'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { getStepTypeByDeploymentType, ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import type { DeployServiceData } from '@cd/components/PipelineSteps/DeployServiceStep/DeployServiceInterface'
import { useCache } from '@common/hooks/useCache'
import { FeatureFlag } from '@common/featureFlags'
import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'
import { setupMode } from './PropagateWidget/PropagateWidget'
import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'

export interface DeployServiceEntitySpecificationsProps {
  children: React.ReactNode
}

export default function DeployServiceEntitySpecifications({
  children
}: DeployServiceEntitySpecificationsProps): JSX.Element {
  const { getString } = useStrings()
  const isSvcEnvEntityEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)
  const queryParams = useParams<ProjectPathProps & ServicePathProps>()

  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    allowableTypes,
    isReadonly,
    scope,
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceUpdateStage = useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* istanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const getDeploymentType = (): ServiceDeploymentType => {
    return get(stage, 'stage.spec.deploymentType')
  }
  const [selectedDeploymentType, setSelectedDeploymentType] = useState<ServiceDeploymentType | undefined>(
    getDeploymentType()
  )
  const [gitOpsEnabled, setGitOpsEnabled] = useState(false)
  const [isReadonlyView, setIsReadOnlyView] = useState(false)

  const { index: stageIndex } = getStageIndexFromPipeline(pipeline, selectedStageId || '')
  const { submitFormsForTab } = useContext(StageErrorContext)
  const { errorMap } = useValidationErrors()
  const { setCache } = useCache()

  const memoizedQueryParam = useMemo(
    () => ({
      accountIdentifier: queryParams.accountId,
      orgIdentifier: queryParams.orgIdentifier,
      projectIdentifier: queryParams.projectIdentifier
    }),
    [queryParams]
  )

  const { data: selectedServiceResponse, refetch: refetchServiceData } = useGetServiceV2({
    serviceIdentifier: '',
    queryParams: memoizedQueryParam,
    lazy: true
  })
  const { data: serviceInputsResponse, refetch: refetchServiceInputs } = useGetRuntimeInputsServiceEntity({
    serviceIdentifier: '',
    queryParams: memoizedQueryParam,
    lazy: true
  })

  useEffect(() => {
    //When service.serviceRef is present refetch serviceAPI to populate deployment type and service definition
    if (getServiceEntityServiceRef(stage?.stage)) {
      const stageServiceRef = (stage?.stage?.spec as any)?.service?.serviceRef
      if (!isEmpty(stageServiceRef)) {
        const params = {
          pathParams: {
            serviceIdentifier: stageServiceRef
          },
          queryParams: memoizedQueryParam
        }
        Promise.all([
          refetchServiceData({
            ...params
          }),
          refetchServiceInputs({
            ...params
          })
        ])
      } else {
        if (
          scope !== Scope.PROJECT &&
          (stage?.stage?.spec as DeployStageConfig)?.service &&
          isEmpty((stage?.stage?.spec as DeployStageConfig)?.service?.serviceRef)
        ) {
          const stageData = produce(stage, draft => {
            if (draft) {
              set(draft, 'stage.spec.service.serviceRef', RUNTIME_INPUT_VALUE)
            }
          })
          if (stageData?.stage) {
            debounceUpdateStage(stageData?.stage)
          }
        }
      }
    }
  }, [])

  //This is to refetch the service API and update stage on change of service from service select
  useEffect(() => {
    const serviceData = selectedServiceResponse?.data?.service as ServiceResponseDTO
    //serviceInputsData is the runtime data for service inputs
    const serviceInputsData = serviceInputsResponse?.data?.inputSetTemplateYaml

    if (!isEmpty(serviceData?.yaml) && serviceInputsResponse?.data) {
      const serviceInputSetResponse = yamlParse(defaultTo(serviceInputsData, ''))
      const parsedYaml = yamlParse<NGServiceConfig>(defaultTo(serviceData.yaml, ''))
      const serviceInfo = parsedYaml.service?.serviceDefinition
      if (serviceInfo) {
        const stageData = produce(stage, draft => {
          if (draft) {
            set(draft, 'stage.spec.deploymentType', serviceInfo?.type)
            set(draft, 'stage.spec.service.serviceRef', parsedYaml.service?.identifier)
            if ((serviceInputSetResponse as any)?.serviceInputs) {
              set(draft, 'stage.spec.service.serviceInputs', (serviceInputSetResponse as any)?.serviceInputs)
            } else {
              unset(draft, 'stage.spec.service.serviceInputs')
            }
          }
        })
        if (stageData?.stage) {
          debounceUpdateStage(stageData?.stage)
        }
        //setting service data in cache to reuse it in manifests, artifacts, variables
        const serviceCacheId = `${pipeline.identifier}-${selectedStageId}-service`
        setCache(serviceCacheId, serviceInfo)

        setSelectedDeploymentType(serviceInfo.type as ServiceDeploymentType)
        setGitOpsEnabled(!!parsedYaml.service?.gitOpsEnabled)
        setIsReadOnlyView(true)
      }
    } else {
      //If old service entity is selected back, the readonly view should be false and deployment type should be unselected
      setIsReadOnlyView(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceResponse, serviceInputsResponse])

  useEffect(() => {
    if (errorMap.size > 0) {
      submitFormsForTab(DeployTabs.SERVICE)
    }
  }, [errorMap])

  const updateService = useCallback(
    async (value: ServiceConfig) => {
      const stageData = produce(stage, draft => {
        const serviceObj = get(draft, 'stage.spec.service', {})
        if (value.service) {
          serviceObj.service = value.service
          delete serviceObj.serviceRef
        } else {
          serviceObj.serviceRef = value.serviceRef
          delete serviceObj.service
        }
      })
      await debounceUpdateStage(stageData?.stage)

      if (isSvcEnvEntityEnabled && value.serviceRef) {
        const params = {
          pathParams: {
            serviceIdentifier: value.serviceRef
          },
          queryParams: memoizedQueryParam
        }
        Promise.all([
          refetchServiceData({
            ...params
          }),
          refetchServiceInputs({
            ...params
          })
        ])
      }
    },
    [debounceUpdateStage, memoizedQueryParam, refetchServiceData, stage]
  )

  const getServiceEntityBasedServiceRef = React.useCallback(() => {
    const stageObj = get(stage, 'stage.spec', {})
    if (stageObj.service) {
      return get(stage, 'stage.spec.service.serviceRef', '')
    }
    return ''
  }, [stage])

  const getServiceEntityBasedService = React.useCallback(() => {
    const stageObj = get(stage, 'stage.spec', {})
    if (stageObj.service) {
      return get(stage, 'stage.spec.service.service', {})
    }
    return ''
  }, [stage])

  const getDeployServiceWidgetInitValues = React.useCallback((): DeployServiceData => {
    const initValues: DeployServiceData = {
      service: getServiceEntityBasedService(),
      isNewServiceEntity: isNewServiceEnvEntity(isSvcEnvEntityEnabled, stage?.stage as DeploymentStageElementConfig),
      serviceRef:
        scope === Scope.PROJECT
          ? getServiceEntityBasedServiceRef()
          : getServiceEntityBasedServiceRef() || RUNTIME_INPUT_VALUE
    }
    if (isNewServiceEnvEntity(isSvcEnvEntityEnabled, stage?.stage as DeploymentStageElementConfig)) {
      initValues.deploymentType = (stage?.stage?.spec as any).deploymentType
    }
    return initValues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={stageCss.deployStage} ref={scrollRef}>
      <DeployServiceErrors domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
      <div className={cx(stageCss.contentSection, stageCss.paddedSection)}>
        <>
          <div className={stageCss.tabHeading}>{getString('cd.pipelineSteps.serviceTab.aboutYourService')}</div>
          <Card className={stageCss.sectionCard} id="aboutService">
            <StepWidget
              type={StepType.DeployService}
              readonly={isReadonly}
              initialValues={getDeployServiceWidgetInitValues()}
              allowableTypes={
                scope === Scope.PROJECT
                  ? allowableTypes
                  : allowableTypes.filter(item => item !== MultiTypeInputType.FIXED)
              }
              onUpdate={data => updateService(data)}
              factory={factory}
              stepViewType={StepViewType.Edit}
            />
          </Card>
        </>
        {isReadonlyView && (
          <>
            <div className={stageCss.tabHeading} id="serviceDefinition">
              {getString('pipelineSteps.deploy.serviceSpecifications.serviceDefinition')}
            </div>
            <SelectDeploymentType
              selectedDeploymentType={selectedDeploymentType}
              viewContext="setup"
              isReadonly={isReadonly || isReadonlyView}
              handleDeploymentTypeChange={noop}
              shouldShowGitops={isNewServiceEnvEntity(
                isSvcEnvEntityEnabled,
                stage?.stage as DeploymentStageElementConfig
              )}
              gitOpsEnabled={gitOpsEnabled}
            />
            <Layout.Horizontal>
              <StepWidget<K8SDirectServiceStep>
                factory={factory}
                readonly={isReadonly || isReadonlyView}
                initialValues={{
                  stageIndex,
                  setupModeType: setupMode.DIFFERENT,
                  deploymentType: selectedDeploymentType as ServiceDefinition['type'],
                  isReadonlyServiceMode: isReadonlyView
                }}
                allowableTypes={allowableTypes}
                type={getStepTypeByDeploymentType(defaultTo(selectedDeploymentType, ''))}
                stepViewType={StepViewType.Edit}
              />
            </Layout.Horizontal>
          </>
        )}
        <Container margin={{ top: 'xxlarge' }}>{children}</Container>
      </div>
    </div>
  )
}