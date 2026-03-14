# POS SaaS 系统 - 部署指南

## 🚀 快速部署（3步完成）

### 第1步：准备服务器

购买一台云服务器（推荐配置）：
- **阿里云/腾讯云** ECS 2核4G
- 系统选 **Ubuntu 22.04**
- 带宽 5Mbps+
- 费用约 100-200元/月

购买后你会得到一个 **IP地址**（如 `47.96.xxx.xxx`）

### 第2步：在服务器上安装Docker

用SSH连接到服务器后，运行以下命令：

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
apt install -y docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 第3步：部署系统

```bash
# 1. 把代码上传到服务器（或用git clone）
cd /opt
mkdir pos-system && cd pos-system

# 2. 把项目文件放到这个目录（包含 Dockerfile, docker-compose.yml, backend/, frontend/）

# 3. 一键启动！
docker-compose up -d --build

# 完成！打开浏览器访问 http://你的IP地址 就能用了
```

---

## 🌐 绑定域名（让客户用域名访问）

### 1. 购买域名
- 阿里云/腾讯云购买（如 `mypos.com`）
- 约 50-80元/年

### 2. 域名解析
在域名管理后台添加记录：
```
类型: A
主机记录: @  (或 pos)
记录值: 你的服务器IP（如 47.96.xxx.xxx）
```

### 3. 添加SSL（https）
```bash
# 安装 certbot
apt install -y certbot python3-certbot-nginx

# 自动获取免费SSL证书
certbot --nginx -d yourdomain.com

# 自动续期
certbot renew --dry-run
```

完成后，客户就可以用 `https://yourdomain.com` 访问了

---

## 📋 日常维护

### 查看日志
```bash
docker-compose logs -f pos-app
```

### 更新系统
```bash
# 拉取最新代码后
docker-compose up -d --build
```

### 备份数据库
```bash
# 备份
docker exec pos-system_mongodb_1 mongodump --out /dump
docker cp pos-system_mongodb_1:/dump ./backup_$(date +%Y%m%d)

# 恢复
docker cp ./backup_20260314 pos-system_mongodb_1:/dump
docker exec pos-system_mongodb_1 mongorestore /dump
```

### 查看运行状态
```bash
docker-compose ps
```

---

## 💡 给客户的说明

部署好后，告诉客户：

```
系统地址：https://yourdomain.com
选择"商家登录"
商家ID：xxxx（您在后台创建的）
账号：xxxx
密码：xxxx

支持安装到桌面，断网也能收银！
```

---

## ⚠️ 注意事项

1. **修改密钥**：docker-compose.yml 中的 `JWT_SECRET` 务必改成随机字符串
2. **防火墙**：服务器只开放 80（HTTP）和 443（HTTPS）端口
3. **定期备份**：建议每天自动备份数据库
4. **监控**：建议使用阿里云/腾讯云自带的监控功能
