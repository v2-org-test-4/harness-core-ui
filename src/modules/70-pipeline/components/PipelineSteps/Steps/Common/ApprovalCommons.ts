// Common helpers and types for approval forms
import { flatMap } from 'lodash-es'

const getEntries = function <T>(object: T, prefix = ''): Array<any> {
  return flatMap(Object.entries(object), ([k, v]: { k: string; v: any }[]) =>
    Object(v) === v ? getEntries(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  )
}

export function flatObject(object: Record<string, any>): Record<string, unknown> {
  return getEntries(object).reduce((o, k) => ((o[k[0]] = k[1]), o), {})
}

// returns if an approval form field is disabled.
// More params might be added in the future
// readonly denotes RBAC
export const isApprovalStepFieldDisabled = (readonly = false, fetching = false): boolean => {
  if (readonly) {
    return true
  }
  if (fetching) {
    return true
  }
  return false
}