import React from 'react'
import { render, waitFor, act, fireEvent } from '@testing-library/react'
import { Container, Button } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import { TestWrapper, TestWrapperProps } from '@common/utils/testUtils'
import { accountPathProps, projectPathProps } from '@common/utils/routeUtils'
import * as cvServices from 'services/cv'
import { yamlResponse, monitoredServiceMockData } from './MonitoreService.mock'
import MonitoredServicePage from '../MonitoredServicePage'

const testWrapperProps: TestWrapperProps = {
  path: routes.toCVAddMonitoringServicesSetup({ ...accountPathProps, ...projectPathProps }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org',
    identifier: 'monitored-service'
  }
}

const testWrapperEditMode = {
  path: routes.toCVAddMonitoringServicesEdit({ ...accountPathProps, ...projectPathProps, identifier: ':identifier' }),
  pathParams: {
    accountId: '1234_accountId',
    projectIdentifier: '1234_project',
    orgIdentifier: '1234_org',
    identifier: 'monitored-service'
  }
}

jest.mock('@cv/components/HarnessServiceAndEnvironment/HarnessServiceAndEnvironment', () => ({
  useGetHarnessServices: () => ({
    serviceOptions: [
      { label: 'service1', value: 'service1' },
      { label: 'AppDService101', value: 'AppDService101' }
    ]
  }),
  HarnessServiceAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addService"
          onClick={() => props.serviceProps.onNewCreated({ name: 'newService', identifier: 'newService' })}
        />
      </Container>
    )
  },
  HarnessEnvironmentAsFormField: function MockComponent(props: any) {
    return (
      <Container>
        <Button
          className="addEnv"
          onClick={() => props.environmentProps.onNewCreated({ name: 'newEnv', identifier: 'newEnv' })}
        />
      </Container>
    )
  },
  useGetHarnessEnvironments: () => {
    return {
      environmentOptions: [
        { label: 'env1', value: 'env1' },
        { label: 'AppDTestEnv1', value: 'AppDTestEnv1' }
      ]
    }
  }
}))

describe('Unit tests for createting monitored source', () => {
  test('Health source table and environment services compoenet renders ', async () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: monitoredServiceMockData,
          error: null,
          loading: false
        } as any)
    )
    jest.spyOn(cvServices, 'useGetMonitoredServiceYamlTemplate').mockImplementation(
      () =>
        ({
          data: yamlResponse,
          refetch: jest.fn()
        } as any)
    )
    const { getByText } = render(
      <TestWrapper {...testWrapperProps}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getByText('cv.monitoredServices.title')).toBeDefined()
    expect(getByText('cv.monitoredServices.addNewMonitoredServices')).toBeDefined()

    expect(getByText('cv.monitoredServices.monitoredServiceName')).toBeDefined()

    // Table cv.healthSource.defineYourSource
    expect(getByText('cv.healthSource.defineYourSource')).toBeDefined()
  })

  test('should render loading state', () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: {},
          error: null,
          loading: true,
          refetch: jest.fn()
        } as any)
    )
    const { getByText } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getByText(/Loading, please wait\.\.\./)).toBeTruthy()
  })

  test('should render error state', () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: {},
          error: { message: '' },
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    const { getByText } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getByText('We cannot perform your request at the moment. Please try again.')).toBeTruthy()
  })

  test('should render edit mode', async () => {
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: monitoredServiceMockData,
          error: null,
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    jest.spyOn(cvServices, 'useChangeEventList').mockImplementation(
      () =>
        ({
          data: {},
          error: null,
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    jest.spyOn(cvServices, 'useChangeEventTimeline').mockImplementation(
      () =>
        ({
          data: {
            resource: {
              categoryTimeline: {
                Deployment: [],
                Infrastructure: [],
                Alert: []
              }
            }
          },
          refetch: jest.fn(),
          error: null,
          loading: false
        } as any)
    )
    const { container, getByText, getAllByRole } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(getAllByRole('tab').length).toEqual(3)

    const tabTitle = [
      'cv.monitoredServices.monitoredServiceTabs.serviceHealth',
      'cv.monitoredServices.monitoredServiceTabs.slos',
      'cv.monitoredServices.monitoredServiceTabs.configurations'
    ]

    getAllByRole('tab').forEach((tab, index) => {
      expect(tab.textContent).toEqual(tabTitle[index])
    })

    await waitFor(() => expect(container.querySelector('div[data-tab-id="ServiceHealth"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('div[data-tab-id="SLOs"]')).toBeTruthy())
    await waitFor(() => expect(container.querySelector('div[data-tab-id="Configurations"]')).toBeTruthy())
    await waitFor(() => expect(getByText('cv.monitoredServices.monitoredServiceTabs.configurations')).toBeTruthy())
    act(() => {
      fireEvent.click(container.querySelector('div[data-tab-id="ServiceHealth"]')!)
    })

    act(() => {
      fireEvent.click(container.querySelector('div[data-tab-id="Configurations"]')!)
    })
  })

  test('should refetch on project change', async () => {
    const refetchMonitoredService = jest.fn()
    jest.spyOn(cvServices, 'useGetMonitoredService').mockImplementation(
      () =>
        ({
          data: monitoredServiceMockData,
          error: null,
          loading: false,
          refetch: refetchMonitoredService
        } as any)
    )
    jest.spyOn(cvServices, 'useChangeEventList').mockImplementation(
      () =>
        ({
          data: {},
          error: null,
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    jest.spyOn(cvServices, 'useChangeEventTimeline').mockImplementation(
      () =>
        ({
          data: {
            resource: {
              categoryTimeline: {
                Deployment: [],
                Infrastructure: [],
                Alert: []
              }
            }
          },
          refetch: jest.fn(),
          error: null,
          loading: false
        } as any)
    )
    const { rerender } = render(
      <TestWrapper {...testWrapperEditMode}>
        <MonitoredServicePage />
      </TestWrapper>
    )
    expect(refetchMonitoredService).toHaveBeenCalledWith()

    const renrenderProps = {
      path: routes.toCVAddMonitoringServicesEdit({
        ...accountPathProps,
        ...projectPathProps,
        identifier: ':identifier'
      }),
      pathParams: {
        accountId: '1234_accountId',
        projectIdentifier: '1234_project_new',
        orgIdentifier: '1234_org',
        identifier: 'monitored-service'
      }
    }
    // rerender with different projectIdentifier
    rerender(
      <TestWrapper {...renrenderProps}>
        <MonitoredServicePage />
      </TestWrapper>
    )

    expect(refetchMonitoredService).toHaveBeenCalledWith()
  })
})
