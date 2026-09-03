import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '网页文章翻译',
    description: '一键提取英文网页文章并翻译为中文',
    permissions: ['sidePanel', 'storage', 'scripting', 'activeTab'],
    action: {},
  },
});
