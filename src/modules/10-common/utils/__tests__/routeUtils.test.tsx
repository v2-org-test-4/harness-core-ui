import { validateReturnUrl, returnLaunchUrl } from '../routeUtils'

describe('validateReturnUrl', () => {
  test('different hostname url', () => {
    expect(validateReturnUrl('https://www.youtube.com/')).toBeFalsy()
  })
  test('invalid url', () => {
    expect(validateReturnUrl('testing')).toBeFalsy()
  })
  test('valid url', () => {
    expect(validateReturnUrl('/testing')).toBeTruthy()
  })
  test('same hostname  url', () => {
    expect(validateReturnUrl('https://localhost:8181/#/login')).toBeTruthy()
  })
  test('Launch redirection url', async () => {
    const redirectionUrl = '#/account/abc123/dashboard'
    const path = returnLaunchUrl(redirectionUrl)
    expect(path).toEqual(`${window.location.pathname}${redirectionUrl}`)
  })
})
