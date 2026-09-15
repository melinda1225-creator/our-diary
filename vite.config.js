import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 프로젝트 사이트(https://<아이디>.github.io/<레포이름>/)로 배포한다면
// base를 반드시 '/레포이름/' 형태로 바꿔주세요.
// 예: 레포 이름이 'our-diary'라면 base: '/our-diary/'
// (User/Organization Pages, 즉 <아이디>.github.io 레포라면 base: '/' 유지)
export default defineConfig({
  plugins: [react()],
  base: '/our-diary/',
})
