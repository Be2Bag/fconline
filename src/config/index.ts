/**
 * Central export สำหรับ config ทั้งหมด
 * Import จากที่นี่แทนการ import แยกไฟล์
 * 
 * @example
 * import { UPGRADE_CONFIG, BOX_CONFIG } from '@/config';
 */

export { APP_CONFIG } from './app.config';
export type { AppConfigType, TabType } from './app.config';

export { UPGRADE_CONFIG } from './upgrade.config';
export type { UpgradeConfigType } from './upgrade.config';

export { BOX_CONFIG } from './box.config';
export type { BoxConfigType } from './box.config';

export { API_CONFIG } from './api.config';
export type { ApiConfigType } from './api.config';
