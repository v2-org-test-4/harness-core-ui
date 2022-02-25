/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import cx from 'classnames'
import { FormInput, getMultiTypeFromValue, Layout, MultiTypeInputType } from '@harness/uicore'
import { defaultTo, get } from 'lodash-es'
import {
  ManifestDataType,
  ManifestStoreMap,
  ManifestToConnectorMap
} from '@pipeline/components/ManifestSelection/Manifesthelper'
import { ManifestSourceBase, ManifestSourceRenderProps } from '@cd/factory/ManifestSourceFactory/ManifestSourceBase'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FormMultiTypeCheckboxField } from '@common/components'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { useListAwsRegions } from 'services/portal'
import { useGetBucketListForS3 } from 'services/cd-ng'
import { getConnectorRef, isFieldfromTriggerTabDisabled } from '../../ManifestSourceUtils'
import { isFieldFixedType, isFieldRuntime } from '../../../K8sServiceSpecHelper'
import ExperimentalInput from '../../../K8sServiceSpecForms/ExperimentalInput'
import css from '../../../KubernetesManifests/KubernetesManifests.module.scss'

const Content = ({
  initialValues,
  template,
  path,
  manifestPath,
  manifest,
  fromTrigger,
  allowableTypes,
  readonly,
  formik,
  accountId,
  projectIdentifier,
  orgIdentifier,
  repoIdentifier,
  branch,
  stageIdentifier
}: ManifestSourceRenderProps): React.ReactElement => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const { data: regionData } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })
  const getRegionData = (): string => {
    return getMultiTypeFromValue(manifest?.spec.store.spec.region) !== MultiTypeInputType.RUNTIME
      ? manifest?.spec.store.spec.region
      : get(initialValues, `${manifestPath}.spec.store.spec.region`, '')
  }

  const {
    data: s3BucketList,
    loading: s3bucketdataLoading,
    refetch: refetchS3Buckets
  } = useGetBucketListForS3({
    queryParams: {
      connectorRef: getConnectorRef(
        manifest?.spec.store.spec.connectorRef,
        get(initialValues, `${manifestPath}.spec.store.spec.connectorRef`, '')
      ),
      region: getRegionData(),
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  const regions = (regionData?.resource || []).map((region: any) => ({
    value: region.value,
    label: region.name
  }))

  const s3BucketOptions = Object.keys(s3BucketList || {}).map(item => ({
    label: item,
    value: item
  }))
  const isFieldDisabled = (fieldName: string): boolean => {
    // /* instanbul ignore else */
    if (readonly) {
      return true
    }
    return isFieldfromTriggerTabDisabled(
      fieldName,
      formik,
      stageIdentifier,
      manifest?.identifier as string,
      fromTrigger
    )
  }

  return (
    <Layout.Vertical
      data-name="manifest"
      key={manifest?.identifier}
      className={cx(css.inputWidth, css.layoutVerticalSpacing)}
    >
      {isFieldRuntime(`${manifestPath}.spec.store.spec.connectorRef`, template) && (
        <div data-name="connectorRefContainer" className={css.verticalSpacingInput}>
          <FormMultiTypeConnectorField
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.connectorRef`)}
            name={`${path}.${manifestPath}.spec.store.spec.connectorRef`}
            selected={get(initialValues, `${manifestPath}.spec.store.spec.connectorRef`, '')}
            label={getString('connector')}
            placeholder={''}
            setRefValue
            multiTypeProps={{
              allowableTypes,
              expressions
            }}
            width={370}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            type={ManifestToConnectorMap[defaultTo(manifest?.spec.store.type, '')]}
            gitScope={{
              repo: defaultTo(repoIdentifier, ''),
              branch: defaultTo(branch, ''),
              getDefaultFromOtherRepo: true
            }}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.region`, template) && (
        <div className={css.verticalSpacingInput}>
          <ExperimentalInput
            formik={formik}
            name={`${path}.${manifestPath}.spec.store.spec.region`}
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.region`)}
            multiTypeInputProps={{
              selectProps: {
                usePortal: true,
                addClearBtn: !readonly,
                items: regions
              },
              expressions,
              allowableTypes
            }}
            useValue
            selectItems={regions}
            label={getString('regionLabel')}
          />
        </div>
      )}
      {isFieldFixedType(`${manifestPath}.spec.store.spec.connectorRef`, initialValues) &&
      isFieldFixedType(`${manifestPath}.spec.store.spec.region`, initialValues) ? (
        <div className={css.verticalSpacingInput}>
          <ExperimentalInput
            name={`${path}.${manifestPath}.spec.store.spec.bucketName`}
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.bucketName`)}
            formik={formik}
            label={getString('pipeline.manifestType.bucketName')}
            placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
            multiTypeInputProps={{
              onFocus: () => {
                if (
                  !s3BucketList?.data &&
                  getConnectorRef(
                    manifest?.spec.store.spec.connectorRef,
                    get(initialValues, `${manifestPath}.spec.store.spec.connectorRef`, '')
                  ) &&
                  getRegionData()
                ) {
                  refetchS3Buckets()
                }
              },
              selectProps: {
                usePortal: true,
                addClearBtn: !readonly,
                items: s3bucketdataLoading
                  ? [{ label: 'Loading Buckets...', value: 'Loading Buckets...' }]
                  : s3BucketOptions,

                allowCreatingNewItems: true
              },
              expressions,
              allowableTypes
            }}
            useValue
            selectItems={s3BucketOptions}
          />
        </div>
      ) : (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.bucketName`)}
            name={`${path}.${manifestPath}.spec.store.spec.bucketName`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.bucketName')}
            placeholder={getString('pipeline.manifestType.bucketNamePlaceholder')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.chartName`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.chartName`)}
            name={`${path}.${manifestPath}.spec.chartName`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.http.chartName')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.chartVersion`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(
              fromTrigger ? `${manifestPath}.chartVersion` : `${manifestPath}.spec.chartVersion`
            )}
            name={`${path}.${manifestPath}.spec.chartVersion`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.http.chartVersion')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.store.spec.folderPath`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.folderPath`)}
            name={`${path}.${manifestPath}.spec.store.spec.folderPath`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('chartPath')}
          />
        </div>
      )}

      {isFieldRuntime(`${manifestPath}.spec.skipResourceVersioning`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormMultiTypeCheckboxField
            disabled={isFieldDisabled(`${manifestPath}.spec.skipResourceVersioning`)}
            name={`${path}.${manifestPath}.spec.skipResourceVersioning`}
            label={getString('skipResourceVersion')}
            setToFalseWhenEmpty={true}
            multiTypeTextbox={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
    </Layout.Vertical>
  )
}

export class HelmS3ManifestSource extends ManifestSourceBase<ManifestSourceRenderProps> {
  protected manifestType = `${ManifestDataType.HelmChart}-${ManifestStoreMap.S3}`

  renderContent(props: ManifestSourceRenderProps): JSX.Element | null {
    if (!props.isManifestsRuntime) {
      return null
    }

    return <Content {...props} />
  }
}