import { UnknownDomainDetection } from '../types';
export class UnknownDomainDetector { public detect(taskDescription: string): UnknownDomainDetection { return Object.freeze({ detectionId: 'UDD_' + Date.now(), isUnknownDomain: true, closestKnownDomain: 'SPATIAL_CAD', noveltyDistance: 0.72 }); } }
