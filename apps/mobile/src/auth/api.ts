import type {
  AuthSessionResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@life-os/contracts'
import { authRepository } from '../data/authRepository'

export const authApi = {
  getCurrentUser: (): Promise<AuthUser> => authRepository.getCurrentUser(),
  login: (payload: LoginPayload): Promise<AuthSessionResponse> => authRepository.login(payload),
  register: (payload: RegisterPayload): Promise<AuthSessionResponse> => authRepository.register(payload),
  logout: (): Promise<{ ok: boolean }> => authRepository.logout(),
}
