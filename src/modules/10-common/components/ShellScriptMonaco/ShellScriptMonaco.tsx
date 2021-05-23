import React from 'react'
import type { MonacoEditorProps } from 'react-monaco-editor'
import { Dialog, Classes } from '@blueprintjs/core'
import { FormikProps, connect } from 'formik'
import { get } from 'lodash-es'
import { Button } from '@wings-software/uicore'
import type { languages, IDisposable } from 'monaco-editor/esm/vs/editor/editor.api'
import { useStrings } from 'framework/strings'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import { useDeepCompareEffect } from '@common/hooks'
import css from './ShellScriptMonaco.module.scss'

export type ScriptType = 'Bash' | 'PowerShell'
type Languages = typeof languages

const langMap: Record<ScriptType, string> = {
  Bash: 'shell',
  PowerShell: 'powershell'
}

export interface ShellScriptMonacoProps {
  scriptType: ScriptType
  name: string
  disabled?: boolean
  expressions?: string[]
}

export interface ConnectedShellScriptMonacoProps extends ShellScriptMonacoProps {
  formik: FormikProps<unknown>
}

const VAR_REGEX = /.*<\+.*?/

export function ShellScriptMonaco(props: ConnectedShellScriptMonacoProps): React.ReactElement {
  const { scriptType, formik, name, disabled, expressions } = props
  const [isFullScreen, setFullScreen] = React.useState(false)
  const { getString } = useStrings()
  const value = get(formik.values, name) || ''

  useDeepCompareEffect(() => {
    const disposables: IDisposable[] = []

    if (Array.isArray(expressions) && expressions.length > 0) {
      const suggestions: Array<Partial<languages.CompletionItem>> = expressions
        .filter(label => label)
        .map(label => ({
          label,
          insertText: label + '>',
          kind: 13
        }))

      Object.values(langMap).forEach(lang => {
        const disposable = (monaco?.languages as Languages)?.registerCompletionItemProvider(lang, {
          triggerCharacters: ['<'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          provideCompletionItems(model, position): any {
            const prevText = model.getValueInRange({
              startLineNumber: position.lineNumber,
              startColumn: 0,
              endLineNumber: position.lineNumber,
              endColumn: position.column
            })

            if (VAR_REGEX.test(prevText)) {
              return { suggestions }
            }

            return { suggestions: [] }
          }
        })

        disposables.push(disposable)
      })
    }

    return () => {
      disposables.forEach(disposable => disposable.dispose())
    }
  }, [expressions])

  const editor = (
    <div className={css.monacoWrapper}>
      <MonacoEditor
        height={isFullScreen ? '70vh' : 300}
        value={value}
        language={langMap[scriptType] as string}
        options={
          {
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 13,
            minimap: {
              enabled: false
            },
            readOnly: disabled,
            scrollBeyondLastLine: false
          } as MonacoEditorProps['options']
        }
        onChange={txt => formik.setFieldValue(name, txt)}
      />
      {isFullScreen ? null : (
        <Button
          className={css.expandBtn}
          icon="fullscreen"
          small
          onClick={() => setFullScreen(true)}
          iconProps={{ size: 10 }}
        />
      )}
    </div>
  )
  return (
    <React.Fragment>
      {isFullScreen ? <div className={css.monacoWrapper} /> : editor}
      <Dialog
        lazy
        isOpen={isFullScreen}
        isCloseButtonShown
        canOutsideClickClose={false}
        onClose={() => setFullScreen(false)}
        title={`${getString('script')} (${scriptType})`}
        className={css.monacoDialog}
      >
        <div className={Classes.DIALOG_BODY}>{editor}</div>
      </Dialog>
    </React.Fragment>
  )
}

export const ShellScriptMonacoField = connect<ShellScriptMonacoProps>(ShellScriptMonaco)
