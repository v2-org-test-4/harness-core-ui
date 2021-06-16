import React from 'react'
import get from 'lodash-es/get'
import isEmpty from 'lodash-es/isEmpty'
import set from 'lodash-es/set'
import {
  IconName,
  Layout,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Card,
  HarnessDocTooltip
} from '@wings-software/uicore'

import { parse } from 'yaml'
import cx from 'classnames'
import { CompletionItemKind } from 'vscode-languageserver-types'
import type { FormikErrors } from 'formik'
import WorkflowVariables from '@pipeline/components/WorkflowVariablesSelection/WorkflowVariables'
import ArtifactsSelection from '@pipeline/components/ArtifactsSelection/ArtifactsSelection'
import ManifestSelection from '@pipeline/components/ManifestSelection/ManifestSelection'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  ServiceSpec,
  getConnectorListV2Promise,
  ConnectorResponse,
  getBuildDetailsForDockerPromise,
  getBuildDetailsForGcrPromise,
  getBuildDetailsForEcrPromise
} from 'services/cd-ng'
import { Scope } from '@common/interfaces/SecretsInterface'
import { Step, StepProps } from '@pipeline/components/AbstractSteps/Step'
import { ArtifactToConnectorMap, ENABLED_ARTIFACT_TYPES } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'

import { useStrings } from 'framework/strings'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import type { CompletionItemInterface } from '@common/interfaces/YAMLBuilderProps'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type { UseStringsReturn } from 'framework/strings'
import { K8sServiceSpecVariablesForm, K8sServiceSpecVariablesFormProps } from './K8sServiceSpecVariablesForm'
import { KubernetesServiceSpecInputForm } from './K8sServiceSpecForms/KubernetesServiceSpecInputForm'
import type { K8SDirectServiceStep, KubernetesServiceInputFormProps } from './K8sServiceSpecInterface'
import css from './K8sServiceSpec.module.scss'

const logger = loggerFor(ModuleName.CD)
const tagExists = (value: unknown): boolean => typeof value === 'number' || !isEmpty(value)

const setupMode = {
  PROPAGATE: 'PROPAGATE',
  DIFFERENT: 'DIFFERENT'
}
const KubernetesServiceSpecEditable: React.FC<KubernetesServiceInputFormProps> = ({
  initialValues: { stageIndex = 0, setupModeType },
  factory,
  readonly
}) => {
  const { getString } = useStrings()
  const isPropagating = stageIndex > 0 && setupModeType === setupMode.PROPAGATE
  return (
    <div className={css.serviceDefinition}>
      <Card
        className={css.sectionCard}
        id={getString('pipelineSteps.deploy.serviceSpecifications.deploymentTypes.manifests')}
      >
        <div className={cx(css.tabSubHeading, 'ng-tooltip-native')} data-tooltip-id="deploymentTypeManifests">
          {getString('pipelineSteps.deploy.serviceSpecifications.deploymentTypes.manifests')}
          <HarnessDocTooltip tooltipId="deploymentTypeManifests" useStandAlone={true} />
        </div>
        <Layout.Horizontal>
          <ManifestSelection isPropagating={isPropagating} />
        </Layout.Horizontal>
      </Card>
      <Card
        className={css.sectionCard}
        id={getString('pipelineSteps.deploy.serviceSpecifications.deploymentTypes.artifacts')}
      >
        <div className={cx(css.tabSubHeading, 'ng-tooltip-native')} data-tooltip-id="deploymentTypeArtifacts">
          {getString('pipelineSteps.deploy.serviceSpecifications.deploymentTypes.artifacts')}
          <HarnessDocTooltip tooltipId="deploymentTypeArtifacts" useStandAlone={true} />
        </div>
        <Layout.Horizontal>
          <ArtifactsSelection isPropagating={isPropagating} />
        </Layout.Horizontal>
      </Card>

      <div className={css.accordionTitle}>
        <div id="advanced">{getString('advancedTitle')}</div>
        <Card className={css.sectionCard} id={getString('variablesText')}>
          <div className={css.tabSubHeading}>{getString('variablesText')}</div>
          <WorkflowVariables factory={factory as any} isPropagating={isPropagating} readonly={readonly} />
        </Card>
      </div>
    </div>
  )
}

const ManifestConnectorRefRegex = /^.+manifest\.spec\.store\.spec\.connectorRef$/
const ManifestConnectorRefType = 'Git'
const ArtifactsSidecarRegex = /^.+.sidecar\.spec\.connectorRef$/
const ArtifactsPrimaryRegex = /^.+artifacts\.primary\.spec\.connectorRef$/
const ArtifactsSidecarTagRegex = /^.+.sidecar\.spec\.tag$/
const ArtifactsPrimaryTagRegex = /^.+artifacts\.primary\.spec\.tag$/

const ArtifactConnectorTypes = [
  ENABLED_ARTIFACT_TYPES.DockerRegistry,
  ENABLED_ARTIFACT_TYPES.Gcr,
  ENABLED_ARTIFACT_TYPES.Ecr
]
const getConnectorValue = (connector?: ConnectorResponse): string =>
  `${
    connector?.connector?.orgIdentifier && connector?.connector?.projectIdentifier
      ? connector?.connector?.identifier
      : connector?.connector?.orgIdentifier
      ? `${Scope.ORG}.${connector?.connector?.identifier}`
      : `${Scope.ACCOUNT}.${connector?.connector?.identifier}`
  }` || ''

const getConnectorName = (connector?: ConnectorResponse): string =>
  `${
    connector?.connector?.orgIdentifier && connector?.connector?.projectIdentifier
      ? `${connector?.connector?.type}: ${connector?.connector?.name}`
      : connector?.connector?.orgIdentifier
      ? `${connector?.connector?.type}[Org]: ${connector?.connector?.name}`
      : `${connector?.connector?.type}[Account]: ${connector?.connector?.name}`
  }` || ''

export class KubernetesServiceSpec extends Step<ServiceSpec> {
  protected type = StepType.K8sServiceSpec
  protected defaultValues: ServiceSpec = {}

  protected stepIcon: IconName = 'service-kubernetes'
  protected stepName = 'Deplyment Service'
  protected stepPaletteVisible = false
  protected _hasStepVariables = true
  protected invocationMap: Map<
    RegExp,
    (path: string, yaml: string, params: Record<string, unknown>) => Promise<CompletionItemInterface[]>
  > = new Map()

  constructor() {
    super()
    this.invocationMap.set(ArtifactsPrimaryRegex, this.getArtifactsPrimaryConnectorsListForYaml.bind(this))
    this.invocationMap.set(ArtifactsSidecarRegex, this.getArtifactsSidecarConnectorsListForYaml.bind(this))
    this.invocationMap.set(ManifestConnectorRefRegex, this.getManifestConnectorsListForYaml.bind(this))
    this.invocationMap.set(ArtifactsPrimaryTagRegex, this.getArtifactsTagsListForYaml.bind(this))
    this.invocationMap.set(ArtifactsSidecarTagRegex, this.getArtifactsTagsListForYaml.bind(this))
  }

  protected getManifestConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }

    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (obj.type === ManifestConnectorRefType) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: { types: ['Git', 'Github', 'Gitlab', 'Bitbucket'], filterType: 'Connector' }
        }).then(response => {
          const data =
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  protected getArtifactsPrimaryConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (ArtifactConnectorTypes.includes(obj.type)) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: {
            types: [ArtifactToConnectorMap.DockerRegistry, ArtifactToConnectorMap.Gcr, ArtifactToConnectorMap.Ecr],
            filterType: 'Connector'
          }
        }).then(response => {
          const data =
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  protected getArtifactsSidecarConnectorsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }
    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.connectorRef', ''))
      if (ArtifactConnectorTypes.includes(obj.type)) {
        return getConnectorListV2Promise({
          queryParams: {
            accountIdentifier: accountId,
            orgIdentifier,
            projectIdentifier,
            includeAllConnectorsAvailableAtScope: true
          },
          body: {
            types: [ArtifactToConnectorMap.DockerRegistry, ArtifactToConnectorMap.Gcr, ArtifactToConnectorMap.Ecr],
            filterType: 'Connector'
          }
        }).then(response => {
          const data =
            response?.data?.content?.map(connector => ({
              label: getConnectorName(connector),
              insertText: getConnectorValue(connector),
              kind: CompletionItemKind.Field
            })) || []
          return data
        })
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  protected getArtifactsTagsListForYaml(
    path: string,
    yaml: string,
    params: Record<string, unknown>
  ): Promise<CompletionItemInterface[]> {
    let pipelineObj
    try {
      pipelineObj = parse(yaml)
    } catch (err) {
      logger.error('Error while parsing the yaml', err)
    }

    const { accountId, projectIdentifier, orgIdentifier } = params as {
      accountId: string
      orgIdentifier: string
      projectIdentifier: string
    }
    if (pipelineObj) {
      const obj = get(pipelineObj, path.replace('.spec.tag', ''))
      if (ArtifactConnectorTypes.includes(obj.type)) {
        switch (obj.type) {
          case ENABLED_ARTIFACT_TYPES.DockerRegistry: {
            return getBuildDetailsForDockerPromise({
              queryParams: {
                imagePath: obj.spec?.imagePath,
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              }
            }).then(response => {
              const data =
                response?.data?.buildDetailsList?.map(buildDetails => ({
                  label: buildDetails.tag || '',
                  insertText: buildDetails.tag || '',
                  kind: CompletionItemKind.Field
                })) || []
              return data
            })
          }
          case ENABLED_ARTIFACT_TYPES.Gcr: {
            return getBuildDetailsForGcrPromise({
              queryParams: {
                imagePath: obj.spec?.imagePath,
                registryHostname: obj.spec?.registryHostname,
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              }
            }).then(response => {
              const data =
                response?.data?.buildDetailsList?.map(buildDetails => ({
                  label: buildDetails.tag || '',
                  insertText: buildDetails.tag || '',
                  kind: CompletionItemKind.Field
                })) || []
              return data
            })
          }
          case ENABLED_ARTIFACT_TYPES.Ecr: {
            return getBuildDetailsForEcrPromise({
              queryParams: {
                imagePath: obj.spec?.imagePath,
                region: obj.spec?.region,
                connectorRef: obj.spec?.connectorRef,
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              }
            }).then(response => {
              const data =
                response?.data?.buildDetailsList?.map(buildDetails => ({
                  label: buildDetails.tag || '',
                  insertText: buildDetails.tag || '',
                  kind: CompletionItemKind.Field
                })) || []
              return data
            })
          }
        }
      }
    }

    return new Promise(resolve => {
      resolve([])
    })
  }

  validateInputSet(
    data: K8SDirectServiceStep,
    template?: ServiceSpec,
    getString?: UseStringsReturn['getString']
  ): FormikErrors<K8SDirectServiceStep> {
    const errors: FormikErrors<K8SDirectServiceStep> = {}
    if (
      isEmpty(data?.artifacts?.primary?.spec?.connectorRef) &&
      getMultiTypeFromValue(template?.artifacts?.primary?.spec?.connectorRef) === MultiTypeInputType.RUNTIME
    ) {
      set(errors, 'artifacts.primary.spec.connectorRef', getString?.('fieldRequired', { field: 'ConnectorRef' }))
    }
    if (
      isEmpty(data?.artifacts?.primary?.spec?.imagePath) &&
      getMultiTypeFromValue(template?.artifacts?.primary?.spec?.imagePath) === MultiTypeInputType.RUNTIME
    ) {
      set(errors, 'artifacts.primary.spec.imagePath', getString?.('fieldRequired', { field: 'Image Path' }))
    }

    if (
      !tagExists(data?.artifacts?.primary?.spec?.tag) &&
      getMultiTypeFromValue(template?.artifacts?.primary?.spec?.tag) === MultiTypeInputType.RUNTIME
    ) {
      set(errors, 'artifacts.primary.spec.tag', getString?.('fieldRequired', { field: 'Tag' }))
    }
    if (
      isEmpty(data?.artifacts?.primary?.spec?.tagRegex) &&
      getMultiTypeFromValue(template?.artifacts?.primary?.spec?.tagRegex) === MultiTypeInputType.RUNTIME
    ) {
      set(errors, 'artifacts.primary.spec.tagRegex', getString?.('fieldRequired', { field: 'Tag Regex' }))
    }
    data?.artifacts?.sidecars?.forEach((sidecar, index) => {
      const currentSidecarTemplate = get(template, `artifacts.sidecars[${index}].sidecar.spec`, '')
      if (
        isEmpty(sidecar?.sidecar?.spec?.connectorRef) &&
        getMultiTypeFromValue(currentSidecarTemplate?.connectorRef) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `artifacts.sidecars[${index}].sidecar.spec.connectorRef`,
          getString?.('fieldRequired', { field: 'Artifact Server' })
        )
      }
      if (
        isEmpty(sidecar?.sidecar?.spec?.imagePath) &&
        getMultiTypeFromValue(currentSidecarTemplate?.imagePath) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `artifacts.sidecars[${index}].sidecar.spec.imagePath`,
          getString?.('fieldRequired', { field: 'Image Path' })
        )
      }

      if (
        !tagExists(sidecar?.sidecar?.spec?.tag) &&
        getMultiTypeFromValue(currentSidecarTemplate?.tag) === MultiTypeInputType.RUNTIME
      ) {
        set(errors, `artifacts.sidecars[${index}].sidecar.spec.tag`, getString?.('fieldRequired', { field: 'Tag' }))
      }
      if (
        isEmpty(sidecar?.sidecar?.spec?.tagRegex) &&
        getMultiTypeFromValue(currentSidecarTemplate?.tagRegex) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `artifacts.sidecars[${index}].sidecar.spec.tagRegex`,
          getString?.('fieldRequired', { field: 'Tag Regex' })
        )
      }
      if (
        isEmpty(sidecar?.sidecar?.spec?.registryHostname) &&
        getMultiTypeFromValue(currentSidecarTemplate?.registryHostname) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `artifacts.sidecars[${index}].sidecar.spec.registryHostname`,
          getString?.('fieldRequired', { field: 'GCR Registry URL' })
        )
      }
    })

    data?.manifests?.forEach((manifest, index) => {
      const currentManifestTemplate = get(template, `manifests[${index}].manifest.spec.store.spec`, '')
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.connectorRef) &&
        getMultiTypeFromValue(currentManifestTemplate?.connectorRef) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.connectorRef`,
          getString?.('fieldRequired', { field: 'Artifact Server' })
        )
      }
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.branch) &&
        getMultiTypeFromValue(currentManifestTemplate?.branch) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.branch`,
          getString?.('fieldRequired', { field: 'Branch' })
        )
      }
      if (
        isEmpty(manifest?.manifest?.spec?.store?.spec?.paths?.[0]) &&
        getMultiTypeFromValue(currentManifestTemplate?.paths) === MultiTypeInputType.RUNTIME
      ) {
        set(
          errors,
          `manifests[${index}].manifest.spec.store.spec.paths`,
          getString?.('fieldRequired', { field: 'Paths' })
        )
      }
    })

    return errors
  }

  renderStep(props: StepProps<K8SDirectServiceStep>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, inputSetData, factory, customStepProps, readonly } = props

    if (stepViewType === StepViewType.InputVariable) {
      return (
        <K8sServiceSpecVariablesForm
          {...(customStepProps as K8sServiceSpecVariablesFormProps)}
          initialValues={initialValues}
          stepsFactory={factory}
          onUpdate={onUpdate}
          readonly={readonly}
        />
      )
    }

    if (stepViewType === StepViewType.InputSet || stepViewType === StepViewType.DeploymentForm) {
      return (
        <KubernetesServiceSpecInputForm
          {...(customStepProps as K8sServiceSpecVariablesFormProps)}
          initialValues={initialValues}
          onUpdate={onUpdate}
          stepViewType={stepViewType}
          template={inputSetData?.template}
          path={inputSetData?.path}
          readonly={inputSetData?.readonly || readonly}
          factory={factory}
        />
      )
    }

    return (
      <KubernetesServiceSpecEditable
        {...(customStepProps as K8sServiceSpecVariablesFormProps)}
        factory={factory}
        initialValues={initialValues}
        onUpdate={onUpdate}
        stepViewType={stepViewType}
        path={inputSetData?.path}
        readonly={readonly}
      />
    )
  }
}
