<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-icon">
        <el-icon><WarningFilled /></el-icon>
      </div>
      
      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">页面未找到</h2>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移动。
      </p>
      
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
      
      <div class="suggestions">
        <h3>您可能想要：</h3>
        <ul>
          <li><router-link to="/workspace">工作空间管理</router-link></li>
          <li><router-link to="/collections">API集合管理</router-link></li>
          <li><router-link to="/debugger">API调试工具</router-link></li>
          <li><router-link to="/environments">环境管理</router-link></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { WarningFilled, HomeFilled, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-icon {
  font-size: 80px;
  color: #f56565;
  margin-bottom: 24px;
}

.error-title {
  font-size: 72px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 16px 0;
  line-height: 1;
}

.error-subtitle {
  font-size: 24px;
  font-weight: 600;
  color: #4a5568;
  margin: 0 0 16px 0;
}

.error-description {
  font-size: 16px;
  color: #718096;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 32px;
}

.suggestions {
  text-align: left;
  background: #f7fafc;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid #e2e8f0;
}

.suggestions h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
}

.suggestions ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestions li {
  margin-bottom: 8px;
}

.suggestions a {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.suggestions a:hover {
  color: #2c5282;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .not-found-content {
    padding: 32px 24px;
  }
  
  .error-title {
    font-size: 56px;
  }
  
  .error-subtitle {
    font-size: 20px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 100%;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .not-found {
    padding: 16px;
  }
  
  .not-found-content {
    padding: 24px 16px;
  }
  
  .error-icon {
    font-size: 60px;
  }
  
  .error-title {
    font-size: 48px;
  }
  
  .error-subtitle {
    font-size: 18px;
  }
}
</style>