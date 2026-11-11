/**
 * Selfie / face-liveness verification behind an interface so the vendor
 * (e.g. FaceTec, AWS Rekognition Face Liveness, Persona, Veriff) can be chosen later.
 */
export type LivenessSession = { id: string; instructions: string[] };
export type LivenessResult = { status: 'verified' | 'retry' | 'manual_review' | 'failed'; reason?: string };

export interface LivenessVerifier {
  start(): Promise<LivenessSession>;
  /** selfieUri: still or short clip captured with expo-camera */
  submit(sessionId: string, selfieUri: string): Promise<LivenessResult>;
}

export class MockLivenessVerifier implements LivenessVerifier {
  async start() {
    return {
      id: `liveness_${Date.now()}`,
      instructions: ['Find good, even light', 'Remove sunglasses or hats', 'Look at the camera and slowly turn your head'],
    };
  }
  async submit(_sessionId: string, selfieUri: string): Promise<LivenessResult> {
    await new Promise((r) => setTimeout(r, 900));
    if (!selfieUri) return { status: 'retry', reason: 'no_face' };
    return { status: 'verified' };
  }
}

export const livenessVerifier: LivenessVerifier = new MockLivenessVerifier();
