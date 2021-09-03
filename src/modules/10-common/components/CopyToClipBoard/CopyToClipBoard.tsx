import React from 'react'
import { Position, PopoverInteractionKind } from '@blueprintjs/core'
import { Popover } from '@blueprintjs/core'
import { Icon } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { useToaster } from '@common/exports'

import css from './CopyToClipBoard.module.scss'

interface CopyToClipboardProps {
  content: string
  showFeedback?: boolean
  iconSize?: number
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = props => {
  const { showSuccess } = useToaster()
  const { getString } = useStrings()
  const getPopoverContent = (): JSX.Element => {
    return (
      <div className={css.popoverContent}>
        <span className={css.tooltipLabel}>{getString('snippets.copyToClipboard')} </span>
      </div>
    )
  }
  return (
    <>
      <Popover
        minimal
        position={Position.BOTTOM}
        interactionKind={PopoverInteractionKind.HOVER}
        content={getPopoverContent()}
      >
        <div>
          <Icon
            name="copy-alt"
            size={props.iconSize ?? 20}
            onClick={async (event: React.MouseEvent<HTMLHeadingElement, globalThis.MouseEvent>) => {
              event.preventDefault()
              event.stopPropagation()
              navigator?.clipboard?.writeText(props?.content)
              if (props.showFeedback) {
                showSuccess(getString('clipboardCopySuccess'))
              }
            }}
            className={css.copyIcon}
          />
        </div>
      </Popover>
    </>
  )
}

export default CopyToClipboard
