import React from 'react'
import { Checkbox } from '@wings-software/uicore'
import { useStrings, StringKeys } from 'framework/strings'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import moduleTagCss from '@dashboards/common/ModuleTags.module.scss'

export interface ModuleTagsFilterProps {
  selectedFilter: Record<string, boolean>
  setPredefinedFilter: (moduleName: string, checked: boolean) => void
}

const ModuleTagsFilter: React.FC<ModuleTagsFilterProps> = ({ selectedFilter, setPredefinedFilter }) => {
  const { getString } = useStrings()
  const { CENG_ENABLED, CING_ENABLED, CDNG_ENABLED, CFNG_ENABLED } = useFeatureFlags()

  const renderTagsFilter = (moduleName: string, cssClass: string, text: StringKeys, isEnabled = false) => {
    return (
      isEnabled && (
        <>
          <Checkbox
            checked={selectedFilter[moduleName]}
            onChange={e => {
              setPredefinedFilter(moduleName, e.currentTarget.checked)
            }}
          />
          <div className={`${cssClass} ${moduleTagCss.moduleTag}`}>{getString(text)}</div>
        </>
      )
    )
  }

  return (
    <>
      {renderTagsFilter('HARNESS', moduleTagCss.harnessTag, 'dashboards.modules.harness', true)}
      {renderTagsFilter('CE', moduleTagCss.ceTag, 'common.purpose.ce.cloudCost', CENG_ENABLED)}
      {renderTagsFilter('CI', moduleTagCss.ciTag, 'buildsText', CING_ENABLED)}
      {renderTagsFilter('CD', moduleTagCss.cdTag, 'deploymentsText', CDNG_ENABLED)}
      {renderTagsFilter('CF', moduleTagCss.cfTag, 'common.purpose.cf.continuous', CFNG_ENABLED)}
    </>
  )
}

export default ModuleTagsFilter