/**
 * 3D Memory Studio — Funnel 66
 * Studio Navigation Manager
 */

import { STANDARD_SECTIONS } from './studioNavigation';
import { BoundedNavigationHistory } from './navigationHistory';
import { SectionDescriptor, SectionId } from '../types';

export class StudioNavigationManager {
  private currentSection: SectionId = 'HOME';
  private readonly history: BoundedNavigationHistory;
  private readonly sections: Map<SectionId, SectionDescriptor>;

  constructor() {
    this.history = new BoundedNavigationHistory();
    this.sections = new Map();

    for (const s of STANDARD_SECTIONS) {
      this.sections.set(s.id, { ...s });
    }

    this.history.push('HOME');
  }

  public navigate(section: SectionId): boolean {
    if (!this.sections.has(section)) return false;

    this.currentSection = section;
    this.history.push(section);

    for (const [id, desc] of this.sections.entries()) {
      this.sections.set(id, { ...desc, active: id === section });
    }

    return true;
  }

  public getCurrentSection(): SectionId {
    return this.currentSection;
  }

  public goBack(): SectionId | null {
    const prev = this.history.goBack();
    if (prev) {
      this.currentSection = prev;
      for (const [id, desc] of this.sections.entries()) {
        this.sections.set(id, { ...desc, active: id === prev });
      }
    }
    return prev;
  }

  public goForward(): SectionId | null {
    const next = this.history.goForward();
    if (next) {
      this.currentSection = next;
      for (const [id, desc] of this.sections.entries()) {
        this.sections.set(id, { ...desc, active: id === next });
      }
    }
    return next;
  }

  public getSections(): readonly SectionDescriptor[] {
    return Array.from(this.sections.values()).sort((a, b) => a.order - b.order);
  }

  public getHistory(): readonly SectionId[] {
    return this.history.getHistory();
  }

  public reset(): void {
    this.currentSection = 'HOME';
    this.history.clear();
    this.history.push('HOME');
    for (const s of STANDARD_SECTIONS) {
      this.sections.set(s.id, { ...s, active: s.id === 'HOME' });
    }
  }
}
