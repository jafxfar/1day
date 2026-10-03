import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { tokenStore } from '../auth/tokenStore'
import { ApiConfigContext, type ApiConfigContextValue } from './apiConfigContext'
import { apiUrlStore } from './apiUrlStore'
import {
  checkApiHealth,
  getDefaultApiBaseUrl,
  normalizeApiBaseUrl,
  setApiBaseUrlOverride,
} from './config'

export const ApiConfigProvider = ({ children }: { children: ReactNode }) => {
  const [customUrl, setCustomUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const defaultApiBaseUrl = useMemo(() => getDefaultApiBaseUrl(), [])

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const stored = await apiUrlStore.get()
        const normalized = stored ? normalizeApiBaseUrl(stored) : null
        setApiBaseUrlOverride(normalized)
        if (isActive) setCustomUrl(normalized)
      } catch {
        await apiUrlStore.clear()
        setApiBaseUrlOverride(null)
      } finally {
        if (isActive) setIsLoading(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  const saveApiBaseUrl = useCallback(async (input: string) => {
    const normalized = normalizeApiBaseUrl(input)
    await checkApiHealth(normalized)
    await apiUrlStore.set(normalized)
    setApiBaseUrlOverride(normalized)
    await tokenStore.clear()
    setCustomUrl(normalized)
  }, [])

  const resetApiBaseUrl = useCallback(async () => {
    await apiUrlStore.clear()
    setApiBaseUrlOverride(null)
    await tokenStore.clear()
    setCustomUrl(null)
  }, [])

  const value = useMemo<ApiConfigContextValue>(() => ({
    apiBaseUrl: customUrl ?? defaultApiBaseUrl,
    defaultApiBaseUrl,
    isCustom: customUrl !== null,
    saveApiBaseUrl,
    resetApiBaseUrl,
  }), [customUrl, defaultApiBaseUrl, resetApiBaseUrl, saveApiBaseUrl])

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D7FF35" />
      </View>
    )
  }

  return (
    <ApiConfigContext.Provider value={value}>
      {children}
    </ApiConfigContext.Provider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
})
