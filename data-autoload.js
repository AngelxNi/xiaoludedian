// 自动加载仓库中的备份 JSON，覆盖默认示例数据。
// 使用方法：
// 1) 将备份文件上传到仓库，例如：数据库/1.json 或 数据库/菜单2-数据备份-2.json
// 2) 页面中引入本文件（已在 index.html 中添加 <script src="data-autoload.js"></script>）
// 本脚本仅在加载阶段覆盖 DATA 并重新渲染，不影响你的桌面端样式或交互。

(function(){
  async function tryFetch(url){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) return null;
      return await res.json();
    }catch(e){
      console.warn('加载备份失败：', url, e);
      return null;
    }
  }

  async function autoload(){
    // 优先策略：优先尝试固定文件名 newdata.json；如不存在，再尝试 latest.json 指向最新文件；否则在有限范围内扫描数字文件。
    // 兼容不同目录命名与仅存在较大数字文件（如仅有 3.json）
    const bases = ['./数据库/', './db/'];

    async function existsNum(base, n){
      const url = `${base}${n}.json`;
      try{
        const res = await fetch(url, { cache: 'no-store' });
        if(!res.ok) return false;
        // 简单校验格式
        const obj = await res.json();
        return !!(obj && obj.data && Array.isArray(obj.data));
      }catch(e){ return false; }
    }

    async function loadNum(base, n){
      const url = `${base}${n}.json`;
      const obj = await tryFetch(url);
      if(obj && obj.data && Array.isArray(obj.data)){
        applyData(obj, url);
        return true;
      }
      return false;
    }

    function applyData(obj, url){
      // 覆盖全局 DATA
      if(typeof DATA !== 'undefined'){
        DATA = obj.data;
      }else{
        window.DATA = obj.data;
      }
      // 恢复 UI 布局状态（文本框等）
      try{
        window.UI_STATE = obj.uiState || { elements:{}, boxes:[] };
      }catch(e){ window.UI_STATE = { elements:{}, boxes:[] }; }
      // 恢复全局折扣配置（如果 JSON 中有）
      try{
        if(obj.discountConfig){
          window.DISCOUNT_CONFIG = obj.discountConfig;
        }
      }catch(e){}
      // 恢复主题（如果 JSON 中有）
      if(typeof applyTheme === 'function'){
        try{
          let saved = null;
          try{ saved = localStorage.getItem('boost_theme_v1'); }catch(e){}
          const theme = saved || (obj.theme || 'white');
          applyTheme(theme);
        }catch(e){}
      }
      // 重新渲染列表
      try{
        const qEl = document.getElementById('q');
        if(typeof renderList === 'function') renderList(qEl ? qEl.value : '');
        // 为新渲染的元素绑定点按反馈
        if(typeof addPressFeedback === 'function') addPressFeedback(document);
        // 应用 UI 状态到页面（如果页面实现了此函数）
        if(typeof applyUIState === 'function') applyUIState();
      }catch(e){}
      console.log('已自动加载备份 JSON：', url);
    }

    async function tryLoadLatest(base){
      // 支持 latest.json 格式：{ latest: "3.json" } 或 { latest: 3 }
      const meta = await tryFetch(`${base}latest.json`);
      if(meta && (meta.latest || meta.file)){
        const latest = String(meta.latest || meta.file).replace(/\.json$/,'');
        const n = parseInt(latest, 10);
        if(!isNaN(n)){
          return await loadNum(base, n);
        }
        // 若是字符串文件名
        const url = `${base}${latest}.json`;
        const obj = await tryFetch(url);
        if(obj && obj.data && Array.isArray(obj.data)){
          applyData(obj, url);
          return true;
        }
      }
      return false;
    }

    // 针对每个可用目录，优先线性扫描 1..64，找出任何存在的数字文件
    for(const base of bases){
      // 0) 优先尝试固定文件名 newdata.json（支持你要求的“固定文件名覆盖保存”场景）
      const fixed = await tryFetch(`${base}newdata.json`);
      if(fixed && fixed.data && Array.isArray(fixed.data)){
        applyData(fixed, `${base}newdata.json`);
        return;
      }

      // 1) 其次尝试 latest.json
      if(await tryLoadLatest(base)) return;

      // 2) 快速候选：常见文件名（包含 3.json）
      const quick = [`${base}3.json`, `${base}1.json`, `${base}菜单2-数据备份-2.json`, `${base}菜单2-数据备份.json`];
      for(const url of quick){
        const obj = await tryFetch(url);
        if(obj && obj.data && Array.isArray(obj.data)){
          applyData(obj, url);
          return;
        }
      }

      // 3) 受控范围的数字扫描（减少请求次数）：1..12
      let best = 0;
      for(let i=1; i<=12; i++){
        if(await existsNum(base, i)) best = i;
      }
      if(best > 0){
        // 最多再向上探测 24 个（总计不超过 ~36 次）
        for(let i=best+1; i<=Math.min(best+24, 256); i++){
          if(await existsNum(base, i)) best = i; else break;
        }
        await loadNum(base, best);
        return;
      }
    }

    // 兜底策略：尝试固定文件名
    // 如果依旧未找到，输出提示，避免空白体验
    console.warn('未检测到数据文件：请确认上传了 数据库/3.json（或 db/3.json）并且 JSON 格式包含 { data: [] }');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoload);
  }else{
    autoload();
  }
})();