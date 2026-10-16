// 仅供 star-letter dev 模拟预览，不进入 dist 或生产包。
const values = new Map();
export default {
  'storage.get': async ({key}) => values.get(key) || {value:null,version:0},
  'storage.set': async ({key,value,ifVersion}) => {
    const current=values.get(key)||{value:null,version:0};
    if(ifVersion!==undefined && ifVersion!==current.version){const e=new Error('存档版本冲突');e.code='STORAGE_CONFLICT';throw e;}
    const version=current.version+1;values.set(key,{value,version});return {ok:true,version};
  }
};
