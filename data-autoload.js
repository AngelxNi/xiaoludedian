// 自动加载仓库中的备份 JSON，覆盖默认示例数据。
// 使用方法：
// 1) 将备份文件上传到仓库，例如：数据库/菜单2-数据备份-2.json
// 2) 页面中引入本文件（已在 菜单2.html 中添加 <script src="data-autoload.js"></script>）
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
    // 兼容两个文件名，哪个存在就用哪个
    const candidates = [
      './数据库/菜单2-数据备份-2.json',
      './数据库/菜单2-数据备份.json'
    ];
    for(const url of candidates){
      const obj = await tryFetch(url);
      if(obj && obj.data && Array.isArray(obj.data)){
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