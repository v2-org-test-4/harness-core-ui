import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import TokenDelegatesList from '../modals/TokenDelegatesList'
import { delegateGroupsMock } from '../../../pages/delegates/__tests__/DelegateGroupsMock'

jest.mock('services/portal', () => ({
  useGetDelegatesV3: jest.fn().mockImplementation(() => ({
    data: {
      resource: {
        delegateGroupDetails: delegateGroupsMock
      }
    }
  }))
}))

describe('Token delegates component', () => {
  test('render Token delegates', async () => {
    const { queryByText } = render(
      <TestWrapper>
        <TokenDelegatesList tokenName="token1" />
      </TestWrapper>
    )
    expect(queryByText('delegates.tokens.tokenNotUsedByDelegates')).not.toBeInTheDocument()
  })
  test('Open troubleshoot', async () => {
    const { getByRole, queryAllByText } = render(
      <TestWrapper>
        <TokenDelegatesList tokenName="token1" />
      </TestWrapper>
    )
    await waitFor(() => {
      expect(getByRole('button', { name: 'delegates.troubleshootOption' })).toBeInTheDocument()
    })
    userEvent.click(getByRole('button', { name: 'delegates.troubleshootOption' }))
    expect(queryAllByText('delegates.delegateNotInstalled.tabs.commonProblems.troubleshoot')[0]).toBeInTheDocument()
  })
})