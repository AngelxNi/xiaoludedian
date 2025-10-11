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
    // 优先策略：找到“数据库目录中数字文件名的最大值”，例如 1.json、2.json ... 以最大的为准
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
      // 恢复主题（如果 JSON 中有）
      if(typeof applyTheme === 'function'){
        try{
          const theme = obj.theme || 'white';
          applyTheme(theme);
        }catch(e){}
      }
      // 重新渲染列表
      try{
        const qEl = document.getElementById('q');
        if(typeof renderList === 'function') renderList(qEl ? qEl.value : '');
      }catch(e){}
      console.log('已自动加载备份 JSON：', url);
    }

    // 针对每个可用目录，优先线性扫描 1..64，找出任何存在的数字文件
    for(const base of bases){
      let best = 0;
      for(let i=1; i<=64; i++){
        if(await existsNum(base, i)) best = i;
      }
      // 如果找到至少一个，继续向上扫描，尽量找到最大的数字文件（控制请求数量）
      if(best > 0){
        for(let i=best+1; i<=Math.min(best+256, 2048); i++){
          if(await existsNum(base, i)) best = i; else break;
        }
        await loadNum(base, best);
        return;
      }
    }

    // 兜底策略：尝试固定文件名
    // 兜底策略：尝试固定文件名（遍历所有 base）
    for(const base of bases){
      const candidates = [
        `${base}1.json`,
        `${base}菜单2-数据备份-2.json`,
        `${base}菜单2-数据备份.json`
      ];
      for(const url of candidates){
        const obj = await tryFetch(url);
        if(obj && obj.data && Array.isArray(obj.data)){
          applyData(obj, url);
          return;
        }
      }
    }

    // 如果依旧未找到，输出提示，避免空白体验
    console.warn('未检测到数据文件：请确认上传了 数据库/3.json（或 db/3.json）并且 JSON 格式包含 { data: [] }');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoload);
  }else{
    autoload();
  }
})();