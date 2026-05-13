export default {
  root: '.',
  server: {
    port: 8080,
    proxy: {
      '/zhisuancf': {
        target: 'https://www.test.zhisuancf.cn',
        changeOrigin: true,
        secure: false
      }
    }
  }
}
