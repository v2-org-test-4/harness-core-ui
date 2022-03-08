/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { GovernanceRemoteComponentMounter, RemotePolicySetWizard } from './GovernanceApp'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PolicySetWizard: React.FC<Record<string, any>> = props => (
  <GovernanceRemoteComponentMounter component={<RemotePolicySetWizard {...props} />} />
)