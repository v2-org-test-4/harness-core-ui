/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Feature, Features } from 'services/cf'
import * as cfServices from 'services/cf'
import { TestWrapper } from '@common/utils/testUtils'
import mockTarget from '@cf/utils/testData/data/mockTarget'
import { CF_DEFAULT_PAGE_SIZE } from '@cf/utils/CFUtils'
import FlagSettings, { FlagSettingsProps } from '../FlagSettings'

const mockFlags = [
  {
    identifier: 'f1',
    name: 'Flag 1',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' },
      { identifier: 'v3' }
    ],
    envProperties: {
      variationMap: [{ variation: 'v1', targets: [{ identifier: mockTarget.identifier, name: mockTarget.name }] }]
    }
  },
  {
    identifier: 'f2',
    name: 'Flag 2',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' }
    ],
    envProperties: {
      variationMap: [{ variation: 'v1', targets: [{ identifier: mockTarget.identifier, name: mockTarget.name }] }]
    }
  },
  {
    identifier: 'f3',
    name: 'Flag 3',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' }
    ],
    envProperties: {
      variationMap: [{ variation: 'v1', targets: [{ identifier: mockTarget.identifier, name: mockTarget.name }] }]
    }
  },
  {
    identifier: 'f4',
    name: 'Flag 4',
    variations: [
      { name: 'Variation 1', identifier: 'v1' },
      { name: 'Variation 2', identifier: 'v2' }
    ],
    envProperties: {
      variationMap: [{ variation: 'v1', targets: [{ identifier: mockTarget.identifier, name: mockTarget.name }] }]
    }
  }
] as Feature[]

const mockResponse = (flags: Feature[] = mockFlags): Features =>
  ({
    features: flags,
    pageIndex: 0,
    pageSize: CF_DEFAULT_PAGE_SIZE,
    itemCount: flags.length,
    pageCount: Math.ceil(flags.length / CF_DEFAULT_PAGE_SIZE),
    version: 1
  } as Features)

jest.mock('@common/components/ContainerSpinner/ContainerSpinner', () => ({
  ContainerSpinner: () => <span data-testid="container-spinner">Container Spinner</span>
}))

const renderComponent = (props: Partial<FlagSettingsProps> = {}): RenderResult =>
  render(
    <TestWrapper>
      <FlagSettings target={mockTarget} {...props} />
    </TestWrapper>
  )

describe('FlagSettings', () => {
  const useGetAllFeaturesMock = jest.spyOn(cfServices, 'useGetAllFeatures')
  const patchTargetMock = jest.fn()
  const usePatchTargetMock = jest.spyOn(cfServices, 'usePatchTarget')

  beforeEach(() => {
    jest.clearAllMocks()

    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse(),
      loading: false,
      error: null,
      refetch: jest.fn()
    } as any)

    usePatchTargetMock.mockReturnValue({
      mutate: patchTargetMock
    } as any)
  })

  test('it should display the error message when it fails to load flags ', async () => {
    const message = 'ERROR MESSAGE'
    const refetchMock = jest.fn()

    useGetAllFeaturesMock.mockReturnValue({
      data: null,
      loading: false,
      error: { message },
      refetch: refetchMock
    } as any)

    renderComponent()

    const btn = screen.getByRole('button', { name: 'Retry' })
    expect(btn).toBeInTheDocument()
    expect(refetchMock).not.toHaveBeenCalled()
    expect(screen.getByText(message)).toBeInTheDocument()

    userEvent.click(btn)

    await waitFor(() => expect(refetchMock).toHaveBeenCalled())
  })

  test('it should show the loading spinner when loading flags', async () => {
    useGetAllFeaturesMock.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    } as any)

    renderComponent()

    expect(screen.getByTestId('container-spinner')).toBeInTheDocument()
  })

  test('it should call the patchTarget hook and reload the flags when the form is submitted with changes', async () => {
    const refetchMock = jest.fn()

    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse(),
      loading: false,
      error: null,
      refetch: refetchMock
    } as any)

    patchTargetMock.mockResolvedValue(undefined)

    renderComponent()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])
    await waitFor(() => screen.getByRole('button', { name: 'saveChanges' }))

    expect(patchTargetMock).not.toHaveBeenCalled()
    expect(refetchMock).not.toHaveBeenCalled()

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => {
      expect(patchTargetMock).toHaveBeenCalled()
      expect(refetchMock).toHaveBeenCalled()
    })
  })

  test('it should display an error and not refetch if the patchTarget hook fails', async () => {
    const message = 'ERROR MESSAGE'
    const refetchMock = jest.fn()

    useGetAllFeaturesMock.mockReturnValue({
      data: mockResponse(),
      loading: false,
      error: null,
      refetch: refetchMock
    } as any)

    patchTargetMock.mockRejectedValue({ message })

    renderComponent()

    userEvent.click(screen.getAllByRole('button', { name: 'cf.targetManagementFlagConfiguration.removeFlag' })[0])
    await waitFor(() => screen.getByRole('button', { name: 'saveChanges' }))

    expect(refetchMock).not.toHaveBeenCalled()

    userEvent.click(screen.getByRole('button', { name: 'saveChanges' }))

    await waitFor(() => {
      expect(patchTargetMock).toHaveBeenCalled()
      expect(refetchMock).not.toHaveBeenCalled()
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })
})