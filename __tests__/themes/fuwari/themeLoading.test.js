import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server.node'
import { useRouter } from 'next/router'
import { GlobalContextProvider, useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import {
  getBaseLayoutByTheme,
  getInitialThemeConfig,
  resolveThemeName,
  useLayoutByTheme
} from '@/themes/theme'
import { fuwariLayouts } from '@/themes/fuwari/layouts'
import CONFIG from '@/themes/fuwari/config'
import * as themeModule from '@/themes/theme'

jest.mock('next/config', () => () => ({
  publicRuntimeConfig: { THEMES: ['fuwari', 'simple', 'example'] }
}))
jest.mock('next/router', () => ({ useRouter: jest.fn() }))
jest.mock('@/blog.config', () => ({
  ...jest.requireActual('@/blog.config'), THEME: 'fuwari'
}))
jest.mock('@clerk/nextjs', () => ({ useUser: jest.fn() }))
jest.mock('@/themes/theme', () => {
  const actual = jest.requireActual('@/themes/theme')
  return { ...actual, getThemeConfig: jest.fn(actual.getThemeConfig) }
})
jest.mock('@/themes/simple', () => ({ THEME_CONFIG: { SIMPLE_ONLY: true } }))
jest.mock('@/lib/utils/lang', () => ({
  generateLocaleDict: () => ({}), initLocale: jest.fn(), redirectUserLang: jest.fn()
}))

const events = { on: jest.fn(), off: jest.fn() }
let router
beforeEach(() => {
  router = { asPath: '/', pathname: '/', query: {}, events }
  useRouter.mockImplementation(() => router)
})

function ConfigProbe() {
  const { THEME_CONFIG } = useGlobal()
  return <div data-testid='config'>{JSON.stringify({
    hasFuwariConfig: THEME_CONFIG === CONFIG,
    menu: siteConfig('FUWARI_MENU_INDEX')
  })}</div>
}

it('renders Fuwari configuration on the server and preserves Notion overrides', () => {
  const html = renderToString(
    <GlobalContextProvider NOTION_CONFIG={{ THEME: 'fuwari', FUWARI_MENU_INDEX: false }}>
      <ConfigProbe />
    </GlobalContextProvider>
  )
  expect(html).toContain('&quot;hasFuwariConfig&quot;:true')
  expect(html).toContain('&quot;menu&quot;:false')
})

it('uses the URL theme for both the first configuration and layout', () => {
  router.asPath = '/?theme=fuwari'
  // asPath is available before query is populated on statically optimized pages.
  const html = renderToString(
    <GlobalContextProvider NOTION_CONFIG={{ THEME: 'simple' }}>
      <ConfigProbe />
    </GlobalContextProvider>
  )
  expect(html).toContain('&quot;hasFuwariConfig&quot;:true')
  expect(resolveThemeName('fuwari', 'simple')).toBe('fuwari')
  expect(getInitialThemeConfig('simple')).toBeNull()
  expect(resolveThemeName('invalid', 'simple')).toBe('fuwari')
})

it('reuses registered layouts and preserves missing-layout fallback', () => {
  const selected = []
  function Probe({ name }) {
    selected.push(useLayoutByTheme({ theme: 'fuwari', layoutName: name }))
    return null
  }
  const { rerender } = render(<Probe name='LayoutIndex' />)
  rerender(<Probe name='LayoutIndex' />)
  rerender(<Probe name='LayoutSignIn' />)
  expect(selected).toEqual([
    fuwariLayouts.LayoutIndex, fuwariLayouts.LayoutIndex, fuwariLayouts.LayoutSlug
  ])
  expect(getBaseLayoutByTheme('fuwari')).toBe(fuwariLayouts.LayoutBase)
})

it('uses the new Notion theme immediately when page props change', async () => {
  const { rerender } = render(
    <GlobalContextProvider NOTION_CONFIG={{ THEME: 'fuwari' }}><ConfigProbe /></GlobalContextProvider>
  )
  expect(screen.getByTestId('config')).toHaveTextContent('"hasFuwariConfig":true')
  // Changing to another theme must not expose the previous Fuwari config.
  await act(async () => {
    rerender(
      <GlobalContextProvider NOTION_CONFIG={{ THEME: 'simple' }}><ConfigProbe /></GlobalContextProvider>
    )
  })
  expect(screen.getByTestId('config')).toHaveTextContent('"hasFuwariConfig":false')
})

it('ignores an obsolete configuration response after switching themes', async () => {
  let finishOldRequest
  themeModule.getThemeConfig.mockImplementationOnce(() =>
    new Promise(resolve => { finishOldRequest = resolve })
  )
  const { rerender } = render(
    <GlobalContextProvider NOTION_CONFIG={{ THEME: 'simple' }}><ConfigProbe /></GlobalContextProvider>
  )
  rerender(
    <GlobalContextProvider NOTION_CONFIG={{ THEME: 'fuwari' }}><ConfigProbe /></GlobalContextProvider>
  )
  await act(async () => { finishOldRequest({ FUWARI_MENU_INDEX: false }) })
  expect(screen.getByTestId('config')).toHaveTextContent('"hasFuwariConfig":true')
  expect(screen.getByTestId('config')).toHaveTextContent('"menu":true')
})
