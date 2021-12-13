import React, { useEffect, useState } from 'react'
import { Button, Layout, Text } from '@wings-software/uicore'
import type { GatewayDetails } from '@ce/components/COCreateGateway/models'
import type { Service, ServiceDep } from 'services/lw'
import { useStrings } from 'framework/strings'
import CORuleDendencySelector from '../../CORuleDependencySelector'

interface RuleDependencyProps {
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
  allServices: Service[]
}

const RuleDependency: React.FC<RuleDependencyProps> = props => {
  const { getString } = useStrings()
  const [serviceDependencies, setServiceDependencies] = useState<ServiceDep[]>(props.gatewayDetails.deps || [])

  useEffect(() => {
    props.setGatewayDetails({ ...props.gatewayDetails, deps: serviceDependencies })
  }, [serviceDependencies])

  const addDependency = () => {
    serviceDependencies.push({
      delay_secs: 5 // eslint-disable-line
    })
    const deps = [...serviceDependencies]
    setServiceDependencies(deps)
  }

  return (
    <Layout.Vertical spacing="medium">
      <Text>{getString('ce.co.autoStoppingRule.configuration.step4.tabs.deps.description')}</Text>
      {serviceDependencies && serviceDependencies.length ? (
        <CORuleDendencySelector
          deps={serviceDependencies}
          setDeps={setServiceDependencies}
          service_id={props.gatewayDetails.id}
          allServices={props.allServices}
        ></CORuleDendencySelector>
      ) : null}
      <Button
        intent="none"
        onClick={() => {
          addDependency()
        }}
        icon={'plus'}
        style={{ maxWidth: '180px' }}
      >
        {' Add dependency'}
      </Button>
    </Layout.Vertical>
  )
}

export default RuleDependency