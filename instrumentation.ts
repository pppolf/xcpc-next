export async function register() {
  // 确保这段代码只在 Node.js 服务端环境中运行
  // 避免在 Edge Runtime 或 浏览器端构建时触发
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    
    // 动态导入，防止构建时的依赖循环问题
    const { initSuperAdmin } = await import('./lib/bootstrap');
    
    await initSuperAdmin();
  }
}