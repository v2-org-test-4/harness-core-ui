import { noop } from 'lodash-es'
import { getLinkForAccountResources } from '../BreadcrumbUtils'

describe('Breadcrumb utils', () => {
  test('should show Account Resources in account scope', () => {
    const returnValue = getLinkForAccountResources({ accountId: 'accountid', getString: noop as any })
    expect(returnValue).toMatchObject([{ label: undefined, url: '/account/accountid/settings/resources' }])
  })

  test('should NOT show Account Resources in org scope', () => {
    const returnValue = getLinkForAccountResources({
      accountId: 'accountid',
      getString: noop as any,
      orgIdentifier: 'orgid'
    })
    expect(returnValue).toMatchObject([])
  })

  test('should NOT show Account Resources in project scope', () => {
    const returnValue = getLinkForAccountResources({
      accountId: 'accountid',
      getString: noop as any,
      orgIdentifier: 'orgId',
      projectIdentifier: 'projectId'
    })
    expect(returnValue).toMatchObject([])
  })
})