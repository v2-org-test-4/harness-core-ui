/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { Spinner } from '@blueprintjs/core'

import { Color, Layout, Text, useToaster } from '@harness/uicore'
import { LinkedPolicy, useGetPolicySet } from 'services/pm'

import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { PolicySetType } from '../../PolicyStepTypes'
import { getErrorMessage } from '../../utils'

import css from './PolicySetListRenderer.module.scss'

interface MiniPolicySetRendererProps {
  policySetId: string
}

export function MiniPolicySetRenderer({ policySetId }: MiniPolicySetRendererProps) {
  const { accountId: accountIdentifier, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { showError } = useToaster()

  const policySetType = policySetId.includes('account.')
    ? PolicySetType.ACCOUNT
    : policySetId.includes('org.')
    ? PolicySetType.ORG
    : PolicySetType.PROJECT

  const {
    data: policySet,
    loading,
    error
  } = useGetPolicySet({
    queryParams: {
      accountIdentifier,
      ...((policySetType === PolicySetType.ORG || policySetType === PolicySetType.PROJECT) && { orgIdentifier }),
      ...(policySetType === PolicySetType.PROJECT && { projectIdentifier })
    },
    policyset: policySetId
  })

  if (error) {
    showError(getErrorMessage(error))
    return null
  } else {
    return (
      <Layout.Horizontal
        className={css.policySetHolder}
        flex={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        {loading ? (
          <Spinner size={Spinner.SIZE_SMALL} />
        ) : policySet ? (
          <>
            <Text lineClamp={1} color={Color.BLACK}>
              {policySet.name}
            </Text>
            <Layout.Horizontal flex={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <MiniPoliciesRenderer policies={defaultTo(policySet.policies, [])} />
              <Text font={'small'} width={48}>
                {policySetType}
              </Text>
            </Layout.Horizontal>
          </>
        ) : null}
      </Layout.Horizontal>
    )
  }
}

interface MiniPoliciesRendererProps {
  policies: LinkedPolicy[]
}

export function MiniPoliciesRenderer({ policies }: MiniPoliciesRendererProps) {
  const length = policies.length
  // istanbul ignore else
  if (length === 0) {
    return null
  }
  const policyNames = policies.map(policy => policy.name)

  return (
    <Layout.Horizontal flex={{ justifyContent: 'flex-start', alignItems: 'center' }} margin={{ right: 'small' }}>
      {policyNames.slice(0, 2).map((policy, index) => (
        <Text className={css.styledPolicy} key={index} lineClamp={1}>
          {policy}
        </Text>
      ))}
      {length > 2 && (
        <Text
          className={css.styledPolicy}
          background={Color.GREY_100}
          alwaysShowTooltip
          tooltip={
            <Layout.Vertical padding="medium">
              {policyNames.splice(2).map((policy, index) => (
                <Text
                  lineClamp={1}
                  color={Color.BLACK}
                  margin={{ top: 'small', bottom: 'small' }}
                  style={{ maxWidth: '400px' }}
                  key={index}
                >
                  {policy}
                </Text>
              ))}
            </Layout.Vertical>
          }
        >
          {`+${length - 2}`}
        </Text>
      )}
    </Layout.Horizontal>
  )
}