import React from 'react'
import cx from 'classnames'
import * as Yup from 'yup'
import { Formik, FormInput, getMultiTypeFromValue, MultiTypeInputType } from '@harness/uicore'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { NameSchema } from '@common/utils/Validation'
import { useQueryParams } from '@common/hooks'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { AzureSlotDeploymentProps } from './AzureSlotDeploymentInterface.types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export const AzureSlotDeploymentRef = (
  props: AzureSlotDeploymentProps,
  formikRef: StepFormikFowardRef
): JSX.Element => {
  /* istanbul ignore next */
  const { allowableTypes, isNewStep = true, readonly, initialValues, onUpdate, onChange } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const query = useQueryParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionId = (query as any).sectionId || ''

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      formName={`AzureSlotDeployment-${sectionId}`}
      validate={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onChange?.(payload)
      }}
      onSubmit={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onUpdate?.(payload)
      }}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum'))
      })}
    >
      {formik => {
        setFormikRef(formikRef, formik)
        return (
          <>
            <div className={cx(stepCss.formGroup, stepCss.lg)}>
              <FormInput.InputWithIdentifier
                inputLabel={getString('name')}
                isIdentifierEditable={isNewStep}
                inputGroupProps={{
                  disabled: readonly
                }}
              />
            </div>
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeDurationField
                name="timeout"
                label={getString('pipelineSteps.timeoutLabel')}
                multiTypeDurationProps={{ enableConfigureOptions: false, expressions, allowableTypes }}
                disabled={readonly}
              />
              {getMultiTypeFromValue(get(formik, 'values.timeout')) === MultiTypeInputType.RUNTIME && (
                <ConfigureOptions
                  value={get(formik, 'values.timeout') as string}
                  type="String"
                  variableName="timeout"
                  showRequiredField={false}
                  showDefaultField={false}
                  showAdvanced={true}
                  onChange={
                    /* istanbul ignore next */ value => {
                      formik?.setFieldValue('timeout', value)
                    }
                  }
                  isReadonly={readonly}
                />
              )}
            </div>
          </>
        )
      }}
    </Formik>
  )
}