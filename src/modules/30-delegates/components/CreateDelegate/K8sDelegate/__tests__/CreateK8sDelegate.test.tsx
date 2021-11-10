import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import CreateK8sDelegate from '../CreateK8sDelegate'
import DelegateSizesmock from './DelegateSizesmock.json'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
const mockGetCallFunction = jest.fn()
jest.mock('services/portal', () => ({
  useGetDelegateProfilesV2: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetDelegateSizes: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: DelegateSizesmock, refetch: jest.fn(), error: null, loading: false }
  }),
  useValidateKubernetesYaml: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  })
}))
jest.mock('services/cd-ng', () => ({
  useListDelegateProfilesNg: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  })
}))
jest.mock('@common/exports', () => ({
  useToaster: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}))
const onBack = jest.fn()

describe('Create K8s Delegate', () => {
  test('render data', () => {
    const { container } = render(
      <TestWrapper>
        <CreateK8sDelegate onBack={onBack} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('test back btn', () => {
    const { container } = render(
      <TestWrapper>
        <CreateK8sDelegate onBack={onBack} />
      </TestWrapper>
    )
    const buttons = container.getElementsByTagName('button')
    const backBtn = buttons[0]
    act(() => {
      fireEvent.click(backBtn!)
    })
    expect(onBack).toBeCalled()
  })
})
