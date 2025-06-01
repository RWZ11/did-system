/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
      },
      spacing: {
        '88': '22rem',
      },
    },
  },
  plugins: [],
  // 与Ant Design配合使用时，禁用部分可能冲突的基础样式
  corePlugins: {
    preflight: false,
  },
}