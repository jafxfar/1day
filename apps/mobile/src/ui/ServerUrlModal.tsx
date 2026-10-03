import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Server, X } from 'lucide-react-native'
import { useApiConfig } from '@/api/useApiConfig'

type ServerUrlModalProps = {
  visible: boolean
  onClose: () => void
  onChanged?: () => void
}

export const ServerUrlModal = ({ visible, onClose, onChanged }: ServerUrlModalProps) => {
  const {
    apiBaseUrl,
    defaultApiBaseUrl,
    isCustom,
    saveApiBaseUrl,
    resetApiBaseUrl,
  } = useApiConfig()
  const [input, setInput] = useState(apiBaseUrl)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!visible) return
    setInput(apiBaseUrl)
    setError(null)
  }, [visible, apiBaseUrl])

  const handleClose = () => {
    if (busy) return
    onClose()
  }

  const handleSave = async () => {
    setError(null)
    setBusy(true)
    try {
      await saveApiBaseUrl(input)
      onChanged?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleReset = async () => {
    setError(null)
    setBusy(true)
    try {
      await resetApiBaseUrl()
      onChanged?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Server size={18} color="#D7FF35" />
              <Text style={styles.title}>Server</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close server settings"
              onPress={handleClose}
              disabled={busy}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <X size={18} color="#F4F4F0" />
            </Pressable>
          </View>

          <View style={styles.currentBox}>
            <View style={styles.currentHeader}>
              <Text style={styles.label}>Current</Text>
              <View style={[styles.badge, isCustom && styles.badgeCustom]}>
                <Text style={[styles.badgeText, isCustom && styles.badgeTextCustom]}>
                  {isCustom ? 'Custom' : 'Auto'}
                </Text>
              </View>
            </View>
            <Text style={styles.currentUrl} numberOfLines={1}>{apiBaseUrl}</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Backend address</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="http://10.0.0.90"
            placeholderTextColor="#686864"
            editable={!busy}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
            accessibilityLabel="Backend address"
            style={styles.input}
          />
          <Text style={styles.hint}>
            Use http://IP for Docker (nginx) or http://IP:3000 for the backend directly.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check and save server address"
            onPress={() => void handleSave()}
            disabled={busy}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
              busy && styles.disabled,
            ]}
          >
            {busy ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color="#151515" />
                <Text style={styles.primaryText}>Checking</Text>
              </View>
            ) : (
              <Text style={styles.primaryText}>Check and save</Text>
            )}
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reset to auto address ${defaultApiBaseUrl}`}
              onPress={() => void handleReset()}
              disabled={busy || !isCustom}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
                (busy || !isCustom) && styles.disabled,
              ]}
            >
              <Text style={styles.secondaryText}>Reset to auto</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              onPress={handleClose}
              disabled={busy}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
          </View>

          {isCustom && (
            <Text style={styles.hint} numberOfLines={1}>
              Auto: {defaultApiBaseUrl}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#1D1D1D',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#F4F4F0',
    fontSize: 20,
    fontWeight: '900',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBox: {
    backgroundColor: '#292929',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentUrl: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
  },
  badgeCustom: {
    backgroundColor: 'rgba(215,255,53,0.15)',
  },
  badgeText: {
    color: '#92928D',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextCustom: {
    color: '#D7FF35',
  },
  label: {
    color: '#92928D',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#F4F4F0',
    paddingHorizontal: 14,
    fontSize: 15,
  },
  hint: {
    color: '#686864',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FECACA',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    height: 52,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#D7FF35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#151515',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#F4F4F0',
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },
})
