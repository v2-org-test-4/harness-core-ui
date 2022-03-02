/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { cloneDeep, isNull, isUndefined, omitBy } from 'lodash-es'
import type { InputSetSummaryResponse } from 'services/pipeline-ng'
import { changeEmptyValuesToRunTimeInput } from './stageHelpers'
import type { InputSetDTO } from './types'

export interface InputSetSummaryResponseExtended extends InputSetSummaryResponse {
  action?: string
  lastUpdatedBy?: string
  createdBy?: string
  inputFieldSummary?: string
}

export const isInputSetInvalid = (data: InputSetSummaryResponseExtended): boolean => {
  if (data.entityValidityDetails?.valid === false) {
    return true
  }
  if (
    data.inputSetErrorDetails?.uuidToErrorResponseMap &&
    Object.keys(data.inputSetErrorDetails.uuidToErrorResponseMap)?.length
  ) {
    return true
  }
  if (data.overlaySetErrorDetails && Object.keys(data.overlaySetErrorDetails)?.length) {
    return true
  }
  return false
}

export const clearNullUndefined = /* istanbul ignore next */ (data: InputSetDTO): InputSetDTO => {
  const omittedInputset = omitBy(omitBy(data, isUndefined), isNull)
  return changeEmptyValuesToRunTimeInput(cloneDeep(omittedInputset), '')
}
