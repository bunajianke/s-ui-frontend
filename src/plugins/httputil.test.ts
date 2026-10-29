import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, CanceledError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const mocks = vi.hoisted(() => ({
  success: vi.fn(), error: vi.fn(), push: vi.fn(), clear: vi.fn(), reset: vi.fn(),
}))
vi.mock('notivue', () => ({ push: { success: mocks.success, error: mocks.error } }))
vi.mock('@/locales', () => ({ i18n: { global: { t: (key: string) => key } } }))
vi.mock('@/router', () => ({ default: { push: mocks.push } }))
vi.mock('./auth', () => ({ clearAuthenticated: mocks.clear }))
vi.mock('@/store/modules/data', () => ({ default: () => ({ $reset: mocks.reset }) }))

import api from './api'
import HttpUtils from './httputil'

const originalAdapter = api.defaults.adapter
afterEach(() => {
  api.defaults.adapter = originalAdapter
  vi.clearAllMocks()
})

function response(config: InternalAxiosRequestConfig, obj: unknown = {}) {
  return { data: { success: true, msg: '', obj }, status: 200, statusText: 'OK', headers: {}, config }
}

describe('overlapping panel requests', () => {
  it('lets a slow poll and a simultaneous page load share the same successful result', async () => {
    let finish!: () => void
    const adapter = vi.fn((config: InternalAxiosRequestConfig) => new Promise<AxiosResponse>(resolve => {
      finish = () => resolve(response(config, { clients: [{ id: 1 }] }))
    }))
    api.defaults.adapter = adapter
    const poll = HttpUtils.get('api/load', { lu: 123 })
    const navigation = HttpUtils.get('api/load', { lu: 123 })
    await vi.waitFor(() => expect(adapter).toHaveBeenCalledTimes(1))
    finish()
    const results = await Promise.all([poll, navigation])
    expect(results.every(result => result.success)).toBe(true)
    expect(results[0].obj).toEqual({ clients: [{ id: 1 }] })
    expect(results[1].obj).toEqual(results[0].obj)
    expect(mocks.error).not.toHaveBeenCalled()

    const nextPoll = HttpUtils.get('api/load', { lu: 123 })
    await vi.waitFor(() => expect(adapter).toHaveBeenCalledTimes(2))
    finish()
    expect((await nextPoll).success).toBe(true)
  })

  it('shares equivalent query order but keeps different resource selections separate', async () => {
    const finishes: Array<() => void> = []
    const adapter = vi.fn((config: InternalAxiosRequestConfig) => new Promise<AxiosResponse>(resolve => {
      finishes.push(() => resolve(response(config, config.params)))
    }))
    api.defaults.adapter = adapter
    const first = HttpUtils.get('api/status', { r: 'sys', c: 1 })
    const same = HttpUtils.get('api/status', { c: 1, r: 'sys' })
    const other = HttpUtils.get('api/status', { r: 'cpu' })
    await vi.waitFor(() => expect(adapter).toHaveBeenCalledTimes(2))
    finishes.forEach(finish => finish())
    const results = await Promise.all([first, same, other])
    expect(results[0].obj).toEqual(results[1].obj)
    expect(results[2].obj).toEqual({ r: 'cpu' })
  })

  it('does not cancel or merge independent user edits sent to the same endpoint', async () => {
    const finishes: Array<() => void> = []
    const adapter = vi.fn((config: InternalAxiosRequestConfig) => new Promise<AxiosResponse>(resolve => {
      expect(config.cancelToken).toBeUndefined()
      finishes.push(() => resolve(response(config, config.data)))
    }))
    api.defaults.adapter = adapter
    const first = HttpUtils.post('api/save', { object: 'clients', data: 'first-user' })
    const second = HttpUtils.post('api/save', { object: 'clients', data: 'second-user' })
    await vi.waitFor(() => expect(adapter).toHaveBeenCalledTimes(2))
    finishes.forEach(finish => finish())
    const results = await Promise.all([first, second])
    expect(results.every(result => result.success)).toBe(true)
    expect(String(results[0].obj)).toContain('first-user')
    expect(String(results[1].obj)).toContain('second-user')
  })

  it('keeps explicitly configured cancellation independent and quiet', async () => {
    const controller = new AbortController()
    const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
      if (config.signal) throw new CanceledError('page closed', config)
      return response(config, { loaded: true })
    })
    api.defaults.adapter = adapter
    const [cancelled, successful] = await Promise.all([
      HttpUtils.get('api/clients', {}, { signal: controller.signal }),
      HttpUtils.get('api/clients'),
    ])
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(cancelled).toMatchObject({ success: false, msg: '' })
    expect(successful.success).toBe(true)
    expect(mocks.error).not.toHaveBeenCalled()
  })

  it('reports a real network error and allows the next poll to retry', async () => {
    const adapter = vi.fn().mockRejectedValueOnce(new Error('Network Error'))
      .mockImplementationOnce(async (config: InternalAxiosRequestConfig) => response(config, { recovered: true }))
    api.defaults.adapter = adapter
    expect((await HttpUtils.get('api/status')).success).toBe(false)
    expect(mocks.error).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Network Error') }))
    expect((await HttpUtils.get('api/status')).obj).toEqual({ recovered: true })
  })

  it('still clears an expired session and returns to login on HTTP 401', async () => {
    api.defaults.adapter = async config => {
      if (config.url === 'api/logout') return response(config)
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined,
        { ...response(config), status: 401, data: { success: false, msg: 'Invalid login', obj: null } })
    }
    expect((await HttpUtils.get('api/load')).success).toBe(false)
    await vi.waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/login'))
    expect(mocks.clear).toHaveBeenCalled()
    expect(mocks.reset).toHaveBeenCalled()
  })
})
