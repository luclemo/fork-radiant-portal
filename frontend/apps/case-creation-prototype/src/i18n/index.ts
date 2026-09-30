import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

import en from './en';
import fr from './fr';

/**
 * The prototype's strings live in their own namespace, added at runtime, so the shared
 * translations/common/*.json files are never touched. To revisit later (see DESIGN-NOTES.md).
 */
export const NS = 'case-creation';

function register() {
  if (!i18n.hasResourceBundle('fr', NS)) i18n.addResourceBundle('fr', NS, fr);
  if (!i18n.hasResourceBundle('en', NS)) i18n.addResourceBundle('en', NS, en);
}

export function useCaseCreationT() {
  register();
  return useTranslation(NS);
}
