import type { StageIcon } from '@/data/types';
import { Icon, type IconName } from './FigmaIcon';

/** Stage icons as in the Figma stage tabs (כללי / פירוק / צנרת / חשמל / קרמיקה / הוצאות נוספות) */
const stageIcons: Record<StageIcon, IconName> = {
  general: 'layout',
  demolition: 'hammer',
  plumbing: 'pipe',
  electric: 'zap',
  ceramic: 'grid',
  extras: 'addBudget',
};

export function StageGlyph({ icon, size = 24, className }: { icon: StageIcon; size?: number; className?: string }) {
  return <Icon name={stageIcons[icon]} size={size} className={className} />;
}

export function MoneyBag({ size = 24, className }: { size?: number; className?: string }) {
  return <Icon name="money" size={size} className={className} />;
}

export function General({ size = 24, className }: { size?: number; className?: string }) {
  return <Icon name="layout" size={size} className={className} />;
}
