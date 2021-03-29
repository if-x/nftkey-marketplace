export const getUnixTimeNowInSec = () => Math.floor(Date.now() / 1000);
export const getUnixTimeAfterMins = (mins: number) =>
  getUnixTimeNowInSec() + mins * 60;
export const getUnixTimeAfterDays = (days: number) =>
  getUnixTimeNowInSec() + days * 60 * 60 * 24;
