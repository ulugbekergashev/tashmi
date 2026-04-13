import { nanoid } from 'nanoid';

const DEVICE_ID_KEY = 'medai_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${nanoid(16)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
