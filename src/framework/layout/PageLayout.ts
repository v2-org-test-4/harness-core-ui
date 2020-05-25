import { DefaultLayout } from './DefaultLayout/DefaultLayout'
import { BlankLayout } from './EmptyLayout/EmptyLayout'
import { BasicLayout } from './BasicLayout/BasicLayout'

export const PageLayout = {
  DefaultLayout,
  BasicLayout,
  BlankLayout
}

export type PageLayout = Readonly<typeof PageLayout[keyof typeof PageLayout]>
