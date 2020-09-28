import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router'
import { Button, Layout, IconName } from '@wings-software/uikit'
import { parse } from 'yaml'
import cx from 'classnames'
import { omitBy, isNull } from 'lodash-es'
import { useToaster } from 'modules/common/exports'
import type { ConnectorInfoDTO, ConnectorRequestBody, ConnectorResponse } from 'services/cd-ng'
import YamlBuilder from 'modules/common/components/YAMLBuilder/YamlBuilder'
import { YamlEntity } from 'modules/common/constants/YamlConstants'
import type { SnippetInterface } from 'modules/common/interfaces/SnippetInterface'
import { YAMLService } from 'modules/dx/services'
import TestConnection from 'modules/dx/components/connectors/TestConnection/TestConnection'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from 'modules/common/interfaces/YAMLBuilderProps'
import ConnectorForm from 'modules/dx/components/connectors/ConnectorForm/ConnectorForm'
import type { ConnectorConnectivityDetails } from 'services/cd-ng'
import SavedConnectorDetails from './views/savedDetailsView/SavedConnectorDetails'
import ConnectorStats from './ConnectorStats'
import { getHeadingByType } from './utils/ConnectorHelper'
import i18n from './ConfigureConnector.i18n'
import css from './ConfigureConnector.module.scss'

export interface ConfigureConnectorProps {
  type: string
  response: ConnectorResponse
  updateConnector: (data: ConnectorRequestBody) => Promise<unknown>
  refetchConnector: () => Promise<any>
  isCreationThroughYamlBuilder: boolean
}

interface ConfigureConnectorState {
  enableEdit: boolean
  setEnableEdit: (val: boolean) => void
  connector: ConnectorInfoDTO
  setConnector: (object: ConnectorInfoDTO) => void
  selectedView: string
  setSelectedView: (selection: string) => void
  lastTested: number
  setLastTested: (val: number) => void
  lastConnected: number
  setLastConnected: (val: number) => void
}

const SelectedView = {
  VISUAL: 'VISUAL',
  YAML: 'YAML'
}

const ConfigureConnector: React.FC<ConfigureConnectorProps> = props => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams()
  const { isCreationThroughYamlBuilder } = props
  const [enableEdit, setEnableEdit] = useState(false)
  const [lastTested, setLastTested] = useState<number>(props.response?.status?.lastTestedAt || 0)
  const [lastConnected, setLastConnected] = useState<number>(props.response?.status?.lastTestedAt || 0)
  const [selectedView, setSelectedView] = useState(
    isCreationThroughYamlBuilder ? SelectedView.YAML : SelectedView.VISUAL
  )

  const [snippets, setSnippets] = useState<SnippetInterface[]>()
  const [connector, setConnector] = useState<ConnectorInfoDTO>(props.response?.connector || ({} as ConnectorInfoDTO))
  const [connectorForYaml, setConnectorForYaml] = useState<ConnectorInfoDTO>(
    props.response?.connector || ({} as ConnectorInfoDTO)
  )
  const [status, setStatus] = useState<ConnectorConnectivityDetails['status']>(props.response?.status?.status)
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [confirmButtonIsEnabled, setConfirmButtonIsEnabled] = React.useState<boolean>(true)

  const state: ConfigureConnectorState = {
    enableEdit,
    setEnableEdit,
    connector,
    setConnector,
    selectedView,
    setSelectedView,
    lastTested,
    setLastTested,
    lastConnected,
    setLastConnected
  }
  const { showSuccess, showError } = useToaster()

  const onSubmit = async (connectorPayload: ConnectorRequestBody) => {
    try {
      const data = await props.updateConnector(connectorPayload)
      if (data) {
        showSuccess(i18n.SaveConnector.SUCCESS)
        props.refetchConnector()
        state.setEnableEdit(false)
      }
    } catch (error) {
      showError(error.message)
    }
  }

  const handleModeSwitch = (targetMode: string): void => {
    if (targetMode === SelectedView.VISUAL) {
      const yamlString = yamlHandler?.getLatestYaml() || ''
      try {
        const connectorJSONEq = parse(yamlString)?.connector
        if (connectorJSONEq) {
          setConnector(connectorJSONEq)
          setSelectedView(targetMode)
        }
      } catch (err) {
        showError(`${err.name}: ${err.message}`)
      }
    } else {
      setSelectedView(targetMode)
    }
  }

  const handleSaveYaml = (event: React.MouseEvent<Element, MouseEvent>): void => {
    event.preventDefault()
    const yamlString = yamlHandler?.getLatestYaml() || ''
    try {
      const connectorJSONEq = parse(yamlString)
      if (connectorJSONEq) {
        onSubmit(connectorJSONEq)
        setConnector(connectorJSONEq?.connector)
      }
    } catch (err) {
      showError(`${err.name}: ${err.message}`)
    }
  }

  const addIconInfoToSnippets = (snippetsList: SnippetInterface[], iconName: IconName): void => {
    if (!snippetsList) {
      return
    }
    const snippetsClone = snippetsList.slice()
    snippetsClone.forEach(snippet => {
      snippet['iconName'] = iconName
    })
  }

  const fetchSnippets = (query?: string): void => {
    const { error, response: snippetsList } = YAMLService.fetchSnippets(YamlEntity.PIPELINE, query)
    if (error) {
      showError(error)
      return
    }
    addIconInfoToSnippets(snippetsList, 'command-shell-script')
    setSnippets(snippetsList)
  }

  const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
    fileName: `${connectorForYaml?.identifier ?? 'Connector'}.yaml`,
    entityType: YamlEntity.CONNECTOR,
    existingJSON: isCreationThroughYamlBuilder
      ? {}
      : { connector: omitBy(Object.assign({}, connectorForYaml), isNull) },
    snippets: snippets,
    onSnippetSearch: fetchSnippets,
    bind: setYamlHandler
  }

  useEffect(() => {
    fetchSnippets()
  })

  useEffect(() => {
    if (props.response.connector) {
      setConnector(props.response.connector)
      setConnectorForYaml(props.response.connector)
    }
  }, [props.response])

  useEffect(() => {
    const enableBtn =
      yamlHandler && yamlHandler.getYAMLValidationErrorMap()
        ? yamlHandler?.getYAMLValidationErrorMap()?.size === 0
        : true
    setConfirmButtonIsEnabled(enableBtn)
  }, [yamlHandler?.getYAMLValidationErrorMap])

  return (
    <div className={css.connectorWrp}>
      <div className={css.optionBtns}>
        <div
          className={cx(
            css.item,
            { [css.selected]: selectedView === SelectedView.VISUAL },
            { [css.disabled]: !confirmButtonIsEnabled }
          )}
          onClick={() => handleModeSwitch(SelectedView.VISUAL)}
        >
          {i18n.VISUAL}
        </div>
        <div
          className={cx(css.item, { [css.selected]: selectedView === SelectedView.YAML })}
          onClick={() => handleModeSwitch(SelectedView.YAML)}
        >
          {i18n.YAML}
        </div>
      </div>
      <Layout.Horizontal className={css.mainDetails}>
        <div className={css.connectorDetails}>
          <Layout.Horizontal className={css.header}>
            {connector?.type ? <span className={css.name}>{getHeadingByType(connector?.type)}</span> : null}
            {state.enableEdit ? null : (
              <Button
                text={isCreationThroughYamlBuilder ? 'Create Connector' : 'Edit Details'}
                icon="edit"
                onClick={() => state.setEnableEdit(true)}
              />
            )}
          </Layout.Horizontal>
          {enableEdit ? (
            selectedView === SelectedView.VISUAL ? (
              <ConnectorForm
                type={props.type}
                connector={connector}
                setConnector={setConnector}
                setConnectorForYaml={setConnectorForYaml}
                onSubmit={onSubmit}
              />
            ) : (
              <div className={css.editor}>
                <YamlBuilder {...yamlBuilderReadOnlyModeProps} />
                <Button
                  intent="primary"
                  text={i18n.submit}
                  onClick={handleSaveYaml}
                  margin={{ top: 'large' }}
                  disabled={!confirmButtonIsEnabled}
                  title={!confirmButtonIsEnabled ? 'YAML is invalid. Please fix the issues to proceed.' : ''}
                />
              </div>
            )
          ) : selectedView === SelectedView.VISUAL ? (
            <SavedConnectorDetails connector={connector} />
          ) : (
            <div className={css.editor}>
              <YamlBuilder {...yamlBuilderReadOnlyModeProps} isReadOnlyMode={true} showSnippetSection={false} />
            </div>
          )}
        </div>
        {selectedView === SelectedView.VISUAL && props.response ? (
          <Layout.Vertical width={'50%'}>
            <ConnectorStats
              createdAt={props.response.createdAt || 0}
              lastTested={lastTested || props.response.status?.lastTestedAt}
              lastUpdated={props.response.lastModifiedAt as number}
              lastConnected={lastConnected || props.response.status?.lastConnectedAt}
              status={status || props.response.status?.status}
            />
            <TestConnection
              accountId={accountId}
              orgIdentifier={orgIdentifier}
              projectIdentifier={projectIdentifier}
              connectorName={connector?.name || ''}
              connectorIdentifier={connector?.identifier || ''}
              delegateName={connector?.spec?.credential?.spec?.delegateName || ''}
              setLastTested={setLastTested}
              setLastConnected={setLastConnected}
              setStatus={setStatus}
              connectorType={connector?.type || ''}
            />
          </Layout.Vertical>
        ) : null}
      </Layout.Horizontal>
    </div>
  )
}

export default ConfigureConnector
