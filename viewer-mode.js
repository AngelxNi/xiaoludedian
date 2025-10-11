// 公开版只读模式：
// - 隐藏“保存到文件/从文件导入”
// - 隐藏新增按钮、三点菜单（编辑/删除）
// - 禁用拖拽排序把手
// - 保留：查看详情、复制联系方式、支付方式切换、主题切换

(function(){
  function applyReadOnlyStyles(){
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏顶部文件读写工具 */
      .file-io{ display: none !important; }
      #btnSaveFile, #btnLoadFile{ display: none !important; }
      /* 隐藏新增按钮 */
      .add-category{ display: none !important; }
      /* 隐藏三点菜单入口 */
      .more-wrap, .more-btn, .menu{ display: none !important; }
      /* 禁用拖拽把手 */
      .handle{ pointer-events: none !important; opacity: .4; }
    `;
    document.head.appendChild(style);
  }

  function blockEditInteractions(){
    // 拦截可能的编辑/删除/新增事件
    const stop = (e)=>{ e.preventDefault(); e.stopPropagation(); };

    // 禁用拖拽相关事件
    ['mousedown','touchstart','pointerdown','dragstart'].forEach(evt=>{
      document.addEventListener(evt, function(e){
        if(e.target && e.target.closest && e.target.closest('.handle')){
          stop(e);
        }
      }, true);
    });

    // 禁用三点菜单点击
    document.addEventListener('click', function(e){
      if(e.target && e.target.closest){
        const t = e.target.closest('.more-wrap, .more-btn, .menu');
        if(t) stop(e);
      }
    }, true);
  }

  function markReadOnlyFlag(){
    try{ window.READ_ONLY = true; }catch(e){}
    // 如果需要，未来可在主脚本里根据 READ_ONLY 判断是否绑定编辑事件
  }

  function init(){
    markReadOnlyFlag();
    applyReadOnlyStyles();
    blockEditInteractions();
    console.log('已启用公开版只读模式');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  }else{
    init();
  }
})();