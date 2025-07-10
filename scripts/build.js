// 构建脚本
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const versions = ['lite', 'full', 'pro']
const distDir = path.join(__dirname, '../dist')

// 清理dist目录
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true })
}
fs.mkdirSync(distDir)

// 构建各个版本
versions.forEach(version => {
  console.log(`🚀 Building ${version} version...`)
  
  try {
    execSync(`pnpm --filter web-${version} build`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
    // 复制构建结果
    const sourceDir = path.join(__dirname, `../packages/web-${version}/dist`)
    const targetDir = path.join(distDir, version)
    
    if (fs.existsSync(sourceDir)) {
      fs.cpSync(sourceDir, targetDir, { recursive: true })
      console.log(`✅ ${version} version built successfully`)
    }
  } catch (error) {
    console.error(`❌ Failed to build ${version} version:`, error.message)
  }
})

console.log('🎉 All versions built!')