const KEY = 'echo-pact:save:v1';
let sdk = null;
let cloudVersion = null;
let lastSync = 0;
let identity = null;
let syncing = false;
export const syncInfo = {status:'local',message:'本机存档'};

function platformError(error) {
  const guard = window.GameSDK?.isPlatformSDKError;
  return typeof guard === 'function' && guard(error) ? String(error.code) : 'UNAVAILABLE';
}
export async function connectPlatform() {
  if (window.self === window.top || !window.GameSDK) return;
  try {
    sdk = await window.GameSDK.init();
    identity = sdk.context.user?.id ?? null;
    sdk.on('context.update', () => {
      const next = sdk.context.user?.id ?? null;
      if (identity !== next) {identity = next; cloudVersion = null; syncInfo.status='local'; syncInfo.message='账号已变化，请重新读取云档';}
    });
    syncInfo.message = identity ? '可手动同步云档' : '未同步到云端';
  } catch (error) {syncInfo.message = '未同步到云端'; syncInfo.error=platformError(error);}
}
export function readLocal() {
  try {const data=JSON.parse(localStorage.getItem(KEY));return data?.version===1&&data.courses&&data.stats?data:null;} catch {return null;}
}
export function writeLocal(state) {
  const snapshot = {...state,savedAt:Date.now()};
  try {localStorage.setItem(KEY,JSON.stringify(snapshot));syncInfo.status='local';syncInfo.message='本机已保存';return true;} catch {syncInfo.message='本机存储已满，请导出存档';return false;}
}
export async function saveCloud(state) {
  if (!sdk || !identity) throw new Error('请在星匣登录后同步；当前进度已保存在本机。');
  if (syncing || Date.now()-lastSync<1000) throw new Error('正在同步，请稍后再试。');
  const snapshot={...state,savedAt:Date.now()};
  if(new TextEncoder().encode(JSON.stringify(snapshot)).length>=240000)throw new Error('存档太大，请先导出备份。');
  if(cloudVersion===null)throw new Error('请先读取云档，确认云端进度后再同步。');
  syncing=true;const user=identity;
  try {
    const result=await sdk.storage.set({key:KEY,scope:'user',value:snapshot,ifVersion:cloudVersion});
    if(user!==identity)throw new Error('账号已变化，本次同步结果未应用。');
    cloudVersion=result.version;lastSync=Date.now();syncInfo.status='cloud';syncInfo.message='云端已同步';
  } catch(error) {
    const code=platformError(error);syncInfo.status='local';syncInfo.message='未同步到云端';
    if(code==='STORAGE_CONFLICT'){cloudVersion=null;throw new Error('云档在其他设备有更新，请重新读取后选择进度。');}
    if(code==='STORAGE_REQUIRE_LOGIN')throw new Error('请登录星匣后重试，本机进度已保留。');
    if(code==='STORAGE_RATE_LIMITED')throw new Error('同步过于频繁，请稍后重试。');
    if(code==='STORAGE_VALUE_TOO_LARGE'||code==='STORAGE_QUOTA_EXCEEDED')throw new Error('云档容量不足，本机进度已保留，请导出备份。');
    throw new Error(error.message||'云端暂时不可用，本机进度已保留。');
  } finally {syncing=false;}
}
export async function readCloud() {
  if(!sdk||!identity)throw new Error('请在星匣登录后读取云档。');
  const user=identity;
  try {
    const {value,version}=await sdk.storage.get({key:KEY,scope:'user'});
    if(user!==identity)throw new Error('账号已变化，请重新读取。');
    cloudVersion=version;
    if(value && (value.version!==1||!value.courses||!value.stats))throw new Error('云档格式不兼容，未覆盖本机进度。');
    return value;
  } catch(error){platformError(error);throw new Error(error.message||'读取云档失败。');}
}
