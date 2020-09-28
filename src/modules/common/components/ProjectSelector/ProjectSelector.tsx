import React, { useEffect, useState } from 'react'
import { Select, SelectOption, useIsMounted } from '@wings-software/uikit'
import type { IconProps } from '@wings-software/uikit/dist/icons/Icon'
import cx from 'classnames'
import { routeParams, ModuleName } from 'framework/exports'
import type { Project } from 'services/cd-ng'
import { useGetProjectList } from 'services/cd-ng'
import { useToaster } from 'modules/common/exports'
import i18n from './ProjectSelector.i18n'
import css from './ProjectSelector.module.scss'

type ProjectListOptions = SelectOption & Project
const PAGE_SIZE = 100

export interface ProjectSelectorProps {
  module: ModuleName.CD | ModuleName.CV | ModuleName.CE | ModuleName.CI | ModuleName.CF
  onSelect: (project: Project) => void
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ module, onSelect }) => {
  const {
    params: { accountId, projectIdentifier }
  } = routeParams()
  const { showError } = useToaster()
  const isMounted = useIsMounted()
  const [selectedProject, setSelectedProject] = useState<ProjectListOptions | undefined>()
  const { data: projects, error, refetch } = useGetProjectList({
    queryParams: {
      accountIdentifier: accountId,
      moduleType: module,
      pageSize: PAGE_SIZE
    }
  })
  const [currentProjectIdentifier, setCurrentProjectIdentifier] = useState(projectIdentifier)
  const projectSelectOptions: ProjectListOptions[] = React.useMemo(
    () =>
      (projects?.data?.content || [])
        .filter((project: Project) => project.modules?.includes?.(module))
        .sort(({ name: name1 = '' }, { name: name2 = '' }) => {
          // sort projects by name
          name1 = name1.toLocaleLowerCase()
          name2 = name2.toLocaleLowerCase()
          return name1 < name2 ? -1 : name1.length < name2.length ? 1 : name1 < name2 ? -1 : 1
        })
        .reduce((values, project) => {
          values.push({
            ...project,
            label: project.name || '',
            value: project.identifier || '',
            icon: { name: 'nav-project-hover' } as IconProps
          })
          return values
        }, [] as ProjectListOptions[]),
    [projects?.data?.content, module]
  )

  if (error) {
    showError(error?.message)
  }

  React.useEffect(() => {
    if (projectIdentifier) {
      const selected = projectSelectOptions.find(project => project.identifier === projectIdentifier)
      if (selected) setSelectedProject(selected)
      else {
        refetch()
      }
    } else {
      setSelectedProject(undefined)
    }
  }, [projectSelectOptions, projectIdentifier, refetch])

  useEffect(() => {
    if (isMounted.current && currentProjectIdentifier !== projectIdentifier) {
      setCurrentProjectIdentifier(projectIdentifier)
      refetch()
    }
  }, [isMounted, currentProjectIdentifier, projectIdentifier, refetch])

  return (
    <Select
      className={cx(css.projectSelector, !selectedProject && css.noSelected)}
      items={projectSelectOptions}
      value={selectedProject}
      inputProps={{
        placeholder: i18n.selectProject
      }}
      onChange={item => {
        setSelectedProject(item as ProjectListOptions)
        onSelect(item as ProjectListOptions)
      }}
    />
  )
}
