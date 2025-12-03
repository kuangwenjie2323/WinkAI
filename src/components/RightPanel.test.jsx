import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import RightPanel from './RightPanel'
import { useStore } from '../store/useStore'
import '@testing-library/jest-dom/vitest'

const baseProviders = useStore.getState().providers
const baseProvider = useStore.getState().currentProvider

const resetStore = () => {
  useStore.setState({
    providers: baseProviders,
    currentProvider: baseProvider
  })
}

describe('RightPanel', () => {
  beforeEach(() => {
    resetStore()
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    resetStore()
  })

  it('renders provider options from the store configuration', () => {
    useStore.setState((state) => ({
      providers: {
        ...state.providers,
        testProvider: {
          name: 'Test Provider',
          apiKey: '',
          baseURL: 'https://api.test.com',
          models: ['test-model'],
          defaultModel: 'test-model',
          supportsVision: false,
          supportsStreaming: false
        }
      },
      currentProvider: 'testProvider'
    }))

    render(<RightPanel isOpen onClose={() => {}} />)

    const providerSelect = screen.getAllByRole('combobox')[0]
    expect(providerSelect).toHaveValue('testProvider')
    expect(screen.getByRole('option', { name: 'Test Provider' })).toBeInTheDocument()
  })
})
