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
    const base = './数据库/';

    async function existsNum(n){
      const url = `${base}${n}.json`;
      try{
        const res = await fetch(url, { cache: 'no-store' });
        if(!res.ok) return false;
        // 简单校验格式
        const obj = await res.json();
        return !!(obj && obj.data && Array.isArray(obj.data));
      }catch(e){ return false; }
    }

    async function loadNum(n){
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
      // 冗余保存到 localStorage
      if(typeof saveData === 'function'){
        try{ saveData(); }catch(e){}
      }
      // 恢复主题（如果 JSON 中有）
      if(typeof applyTheme === 'function'){
        try{
          const theme = obj.theme || (localStorage.getItem('boost_theme_v1') || 'white');
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

    // 指数查找上界，然后二分查找最大存在的数字文件
    // 这样避免从很大的数一路向下请求过多 404
    let hi = 1;
    // 找到一个不存在的上界（指数增长）
    while(await existsNum(hi)){
      hi *= 2;
      // 安全限制，避免无限循环
      if(hi > 2048) break;
    }
    let lo = Math.floor(hi/2);
    let best = 0;
    while(lo <= hi){
      const mid = Math.floor((lo + hi) / 2);
      if(await existsNum(mid)){
        best = Math.max(best, mid);
        lo = mid + 1;
      }else{
        hi = mid - 1;
      }
    }

    if(best > 0){
      await loadNum(best);
      return;
    }

    // 兜底策略：尝试固定文件名
    const candidates = [
      `${base}1.json`,
      `${base}菜单2-数据备份-2.json`,
      `${base}菜单2-数据备份.json`
    ];
    for(const url of candidates){
      const obj = await tryFetch(url);
      if(obj && obj.data && Array.isArray(obj.data)){
        applyData(obj, url);
        break;
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoload);
  }else{
    autoload();
  }
})();