/**
 * 3D Memory Studio — Funnel 70
 * Navigation Action Adapter (F66 Integration)
 */

import { SectionId } from '../../funnel66/types';
import { StudioNavigationManager } from '../../funnel66/navigation/navigationManager';
import { VALID_SECTIONS } from '../actions/actionTypes';

export class NavigationActionAdapter {
  private currentSection: SectionId = 'DATABASE';

  constructor(public readonly navigationManager?: StudioNavigationManager) {
    if (this.navigationManager) {
      this.currentSection = this.navigationManager.getCurrentSection();
    }
  }

  public navigateToSection(sectionId: SectionId): boolean {
    if (!VALID_SECTIONS.has(sectionId)) return false;
    this.currentSection = sectionId;
    if (this.navigationManager) {
      return this.navigationManager.navigate(sectionId);
    }
    return true;
  }

  public getCurrentSection(): SectionId {
    if (this.navigationManager) {
      return this.navigationManager.getCurrentSection();
    }
    return this.currentSection;
  }
}
