/**
 * CubiO — Universal Spatial Operating Environment
 * Phase F74: Master Multimodal Certification Engine
 */

import {
  CrossModalUnifiedResult,
  IMultimodalCertificationEngine,
  UniversalMultimodalInputPayload,
  SpeechVerificationResult,
  VisionPerceptionResult,
} from './types';
import { VisionVerifier } from './visionVerifier';
import { SpeechVerifier } from './speechVerifier';
import { CrossModalDirector } from './crossModalDirector';

export class CubiOMultimodalCertificationEngine implements IMultimodalCertificationEngine {
  private vision = new VisionVerifier();
  private speech = new SpeechVerifier();
  private crossModal = new CrossModalDirector();

  public async verifyVisionPerception(image: {
    url?: string;
    data?: Uint8Array;
  }): Promise<VisionPerceptionResult> {
    return this.vision.verifyImagePerception(image);
  }

  public async verifySpeechSTTandTTS(voice: {
    audioText?: string;
    audioData?: Uint8Array;
  }): Promise<SpeechVerificationResult> {
    return this.speech.verifySpeech(voice);
  }

  public async executeCrossModalDirective(
    input: UniversalMultimodalInputPayload
  ): Promise<Readonly<CrossModalUnifiedResult>> {
    return this.crossModal.executeCrossModal(input);
  }
}
