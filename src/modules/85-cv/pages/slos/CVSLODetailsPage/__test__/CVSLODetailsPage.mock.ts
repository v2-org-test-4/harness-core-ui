/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import routes from '@common/RouteDefinitions'
import { projectPathProps } from '@common/utils/routeUtils'
import type { TestWrapperProps } from '@common/utils/testUtils'
import { cvModuleParams } from '@cv/RouteDestinations'
import { editParams } from '@cv/utils/routeUtils'
import type { ResponseSLODashboardDetail } from 'services/cv'

export const errorMessage = 'TEST ERROR MESSAGE'

export const pathParams = {
  accountId: 'ACCOUNT_ID',
  projectIdentifier: 'PROJECT_IDENTIFIER',
  orgIdentifier: 'ORG_IDENTIFIER',
  identifier: 'IDENTIFIER',
  module: 'cv'
}

export const testWrapperProps: TestWrapperProps = {
  path: routes.toCVSLODetailsPage({ ...projectPathProps, ...editParams, ...cvModuleParams }),
  pathParams
}

export const responseSLODashboardDetail: ResponseSLODashboardDetail = {
  status: 'SUCCESS',
  data: {
    sloDashboardWidget: {
      sloIdentifier: 'Server_Error_Rate',
      title: 'Server Error Rate',
      monitoredServiceIdentifier: 'Service_1_Environment_1',
      monitoredServiceName: 'Service_1_Environment_1',
      healthSourceIdentifier: 'AppDynamics',
      healthSourceName: 'AppDynamics',
      serviceIdentifier: 'Service_1',
      environmentIdentifier: 'Environment_1',
      environmentName: 'Environment 1',
      serviceName: 'Service 1',
      tags: {},
      type: 'Latency',
      burnRate: {
        currentRatePercentage: 606.4356435643564
      },
      timeRemainingDays: 2,
      errorBudgetRemainingPercentage: -1112.8712871287128,
      errorBudgetRemaining: -1124,
      totalErrorBudget: 101,
      sloTargetType: 'Calender',
      currentPeriodLengthDays: 7,
      currentPeriodStartTime: 1648857600000,
      currentPeriodEndTime: 1649462400000,
      sloTargetPercentage: 99,
      errorBudgetBurndown: [],
      sloPerformanceTrend: [],
      recalculatingSLI: false,
      errorBudgetRisk: 'EXHAUSTED'
    },
    description: '99.9 percent of logins should have <= 50ms latency'
  },
  metaData: undefined,
  correlationId: '0c955a4d-29a2-42ff-90b3-2c629dffac84'
}