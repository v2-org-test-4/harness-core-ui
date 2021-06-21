import { Types as TransformValuesTypes } from '@pipeline/components/PipelineSteps/Steps/StepsTransformValuesUtils'
import { Types as ValidationFieldTypes } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'

export const transformValuesFieldsConfig = [
  {
    name: 'identifier',
    type: TransformValuesTypes.Text
  },
  {
    name: 'name',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.connectorRef',
    type: TransformValuesTypes.ConnectorRef
  },
  {
    name: 'spec.repo',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.tags',
    type: TransformValuesTypes.List
  },
  {
    name: 'spec.dockerfile',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.context',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.labels',
    type: TransformValuesTypes.Map
  },
  {
    name: 'spec.buildArgs',
    type: TransformValuesTypes.Map
  },
  {
    name: 'spec.optimize',
    type: TransformValuesTypes.Boolean
  },
  {
    name: 'spec.target',
    type: TransformValuesTypes.Text
  },
  {
    name: 'spec.remoteCacheImage',
    type: TransformValuesTypes.Text
  },
  // TODO: Right now we do not support Image Pull Policy but will do in the future
  // {
  //   name: 'spec.pull',
  //   type: TransformValuesTypes.Pull
  // },
  {
    name: 'spec.limitMemory',
    type: TransformValuesTypes.LimitMemory
  },
  {
    name: 'spec.limitCPU',
    type: TransformValuesTypes.LimitCPU
  },
  {
    name: 'timeout',
    type: TransformValuesTypes.Text
  }
]

export const editViewValidateFieldsConfig = [
  {
    name: 'identifier',
    type: ValidationFieldTypes.Identifier,
    label: 'identifier',
    isRequired: true
  },
  {
    name: 'name',
    type: ValidationFieldTypes.Name,
    label: 'pipelineSteps.stepNameLabel',
    isRequired: true
  },
  {
    name: 'spec.connectorRef',
    type: ValidationFieldTypes.Text,
    label: 'pipelineSteps.dockerHubConnectorLabel',
    isRequired: true
  },
  {
    name: 'spec.repo',
    type: ValidationFieldTypes.Text,
    label: 'dockerRegistry',
    isRequired: true
  },
  {
    name: 'spec.tags',
    type: ValidationFieldTypes.List,
    label: 'tagsLabel',
    isRequired: true
  },
  {
    name: 'spec.labels',
    type: ValidationFieldTypes.Map
  },
  {
    name: 'spec.buildArgs',
    type: ValidationFieldTypes.Map
  },
  {
    name: 'spec.optimize',
    type: ValidationFieldTypes.Boolean
  },
  {
    name: 'spec.remoteCacheImage',
    type: ValidationFieldTypes.Text
  },
  {
    name: 'spec.limitMemory',
    type: ValidationFieldTypes.LimitMemory
  },
  {
    name: 'spec.limitCPU',
    type: ValidationFieldTypes.LimitCPU
  },
  {
    name: 'timeout',
    type: ValidationFieldTypes.Timeout
  }
]

export function getInputSetViewValidateFieldsConfig(
  isRequired = true
): Array<{ name: string; type: ValidationFieldTypes; label?: string; isRequired?: boolean }> {
  return [
    {
      name: 'spec.connectorRef',
      type: ValidationFieldTypes.Text,
      label: 'pipelineSteps.dockerHubConnectorLabel',
      isRequired
    },
    {
      name: 'spec.repo',
      type: ValidationFieldTypes.Text,
      label: 'dockerRegistry',
      isRequired
    },
    {
      name: 'spec.tags',
      type: ValidationFieldTypes.List,
      label: 'tagsLabel',
      isRequired
    },
    {
      name: 'spec.labels',
      type: ValidationFieldTypes.Map
    },
    {
      name: 'spec.buildArgs',
      type: ValidationFieldTypes.Map
    },
    {
      name: 'spec.optimize',
      type: ValidationFieldTypes.Boolean
    },
    {
      name: 'spec.remoteCacheImage',
      type: ValidationFieldTypes.Text
    },
    {
      name: 'spec.resources.limits.memory',
      type: ValidationFieldTypes.LimitMemory
    },
    {
      name: 'spec.resources.limits.cpu',
      type: ValidationFieldTypes.LimitCPU
    },
    {
      name: 'timeout',
      type: ValidationFieldTypes.Timeout
    }
  ]
}
