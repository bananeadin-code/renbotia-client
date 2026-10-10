import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { authApi } from '../api/endpoints.js';

/**
 * Llaves de acceso (passkeys): entrar con la huella, la cara o el PIN del
 * dispositivo. La llave privada nunca sale del teléfono o la compu; nosotros
 * solo guardamos la pública.
 */

export const passkeysSupported = () => {
  try {
    return browserSupportsWebAuthn();
  } catch {
    return false;
  }
};

/** La persona cerró el aviso del sistema (huella/PIN) sin terminar. */
export class PasskeyCancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'PasskeyCancelled';
  }
}

function rethrow(err) {
  if (err?.name === 'NotAllowedError' || err?.name === 'AbortError') throw new PasskeyCancelled();
  if (err?.name === 'InvalidStateError') {
    throw new Error('Este dispositivo ya tiene una llave de acceso para tu cuenta.');
  }
  throw err;
}

/** Crea una llave en este dispositivo y la registra en la cuenta. */
export async function createPasskey() {
  const { options, challengeId } = await authApi.passkeyRegisterOptions();
  let response;
  try {
    response = await startRegistration({ optionsJSON: options });
  } catch (err) {
    rethrow(err);
  }
  return authApi.passkeyRegisterVerify({ challengeId, response });
}

/** Entrar con llave (el dispositivo ofrece las cuentas que tiene guardadas). */
export async function signInWithPasskey() {
  const { options, challengeId } = await authApi.passkeyLoginOptions();
  let response;
  try {
    response = await startAuthentication({ optionsJSON: options });
  } catch (err) {
    rethrow(err);
  }
  return authApi.passkeyLogin({ challengeId, response });
}

/** "Confirma que eres tú" con la llave (sin escribir contraseña). */
export async function stepUpWithPasskey() {
  const { options, challengeId } = await authApi.stepUpPasskeyOptions();
  let response;
  try {
    response = await startAuthentication({ optionsJSON: options });
  } catch (err) {
    rethrow(err);
  }
  return authApi.stepUpPasskey({ challengeId, response });
}
