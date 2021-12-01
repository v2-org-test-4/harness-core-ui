import React from 'react'
import { render } from '@testing-library/react'
import { mockTemplates } from '@templates-library/TemplatesTestHelper'
import { TestWrapper } from '@common/utils/testUtils'
import { TemplateCard } from '@templates-library/components/TemplateCard/TemplateCard'

describe('<TemplateCard /> tests', () => {
  test('snapshot test with git sync enabled', async () => {
    const template = {
      ...(mockTemplates.data?.content?.[0] || {}),
      ...{
        gitDetails: {
          repoIdentifier: 'some repo',
          branch: 'some branch'
        }
      }
    }
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: true }}>
        <TemplateCard template={template} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('should have menu icon', async () => {
    const template = mockTemplates.data?.content?.[0] || {}
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: false }}>
        <TemplateCard
          template={template}
          onPreview={jest.fn}
          onOpenEdit={jest.fn}
          onOpenSettings={jest.fn}
          onDelete={jest.fn}
        />
      </TestWrapper>
    )
    const menuBtn = container.querySelectorAll('button')
    expect(menuBtn).toHaveLength(1)
  })
  test('should not have menu icon', async () => {
    const template = mockTemplates.data?.content?.[0] || {}
    const { container } = render(
      <TestWrapper defaultAppStoreValues={{ isGitSyncEnabled: false }}>
        <TemplateCard template={template} />
      </TestWrapper>
    )
    const menuBtn = container.querySelectorAll('button')
    expect(menuBtn).toHaveLength(0)
  })
})