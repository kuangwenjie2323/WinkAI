import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useStore } from './useStore'

// 模拟持久化中间件，虽然 Zustand 的 persist 在测试中通常可以工作，
// 但为了确保每次测试都是干净的状态，我们可能需要一些技巧。
// 这里我们依赖 beforeEach 来重置状态。

describe('useStore', () => {
  const initialState = useStore.getState()

  beforeEach(() => {
    act(() => {
      useStore.setState(initialState, true) // 重置为初始状态
      // 清空所有会话，只保留默认的
      useStore.setState({
        sessions: [{
          id: 'default',
          name: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }],
        currentSessionId: 'default'
      })
    })
  })

  it('应该具有正确的初始状态', () => {
    const state = useStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.currentSessionId).toBe('default')
    expect(state.settings.theme).toBe('dark')
    expect(state.currentProvider).toBe('google')
  })

  it('应该能创建新会话', () => {
    const { createSession } = useStore.getState()
    let newSessionId
    act(() => {
      newSessionId = createSession('测试会话')
    })

    const state = useStore.getState()
    expect(state.sessions).toHaveLength(2)
    expect(state.currentSessionId).toBe(newSessionId)
    const newSession = state.sessions.find(s => s.id === newSessionId)
    expect(newSession).toBeDefined()
    expect(newSession.name).toBe('测试会话')
  })

  it('应该能重命名会话', () => {
    const { updateSessionName } = useStore.getState()
    act(() => {
      updateSessionName('default', '重命名后的会话')
    })

    const state = useStore.getState()
    const session = state.sessions.find(s => s.id === 'default')
    expect(session.name).toBe('重命名后的会话')
  })

  it('应该能删除会话', () => {
    const { createSession, deleteSession } = useStore.getState()
    let newSessionId
    act(() => {
      newSessionId = createSession('要删除的会话')
    })
    
    expect(useStore.getState().sessions).toHaveLength(2)

    act(() => {
      deleteSession(newSessionId)
    })

    const state = useStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions.find(s => s.id === newSessionId)).toBeUndefined()
  })

  it('应该能添加消息', () => {
    const { addMessage } = useStore.getState()
    const message = { id: 'msg-1', role: 'user', content: 'Hello' }
    
    act(() => {
      addMessage('default', message)
    })

    const state = useStore.getState()
    const session = state.sessions.find(s => s.id === 'default')
    expect(session.messages).toHaveLength(1)
    expect(session.messages[0]).toEqual(message)
  })

  it('应该能更新设置', () => {
    const { updateSettings } = useStore.getState()
    
    act(() => {
      updateSettings({ theme: 'light', temperature: 0.9 })
    })

    const state = useStore.getState()
    expect(state.settings.theme).toBe('light')
    expect(state.settings.temperature).toBe(0.9)
  })
  
  it('应该能更新当前提供商', () => {
    const { setCurrentProvider } = useStore.getState()
    
    act(() => {
      setCurrentProvider('anthropic')
    })
    
    const state = useStore.getState()
    expect(state.currentProvider).toBe('anthropic')
    // 同时也应该更新当前模型为该提供商的默认模型
    expect(state.currentModel).toBe(state.providers.anthropic.defaultModel)
  })
})
