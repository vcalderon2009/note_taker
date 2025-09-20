# 🚀 Note-Taker AI - Automatic Startup Guide

This guide shows you how to start the Note-Taker AI system automatically without manual monitoring.

## 🎯 Quick Start

### **One-Command Startup (Recommended)**
```bash
make start
```
This command will:
- Start all services
- Wait for models to download
- Show progress in real-time
- Automatically open the app when ready

### **Background Startup**
```bash
make start-bg
```
This starts the system in the background and returns immediately.

## 📋 Available Commands

### **Startup Commands**
- `make start` - Start and wait for readiness (recommended)
- `make start-bg` - Start in background
- `make dev` - Start with live logs (development)

### **Status Commands**
- `make status` - Show system status
- `make health` - Check system health
- `make logs` - Show all logs
- `make logs-api` - Show API logs only

### **Stop Commands**
- `make stop` - Stop all services
- `make restart` - Restart all services

### **Maintenance Commands**
- `make build` - Build Docker images
- `make clean` - Clean up containers
- `make clean-all` - Clean everything including images

## 🔧 How It Works

### **Automatic Dependencies**
The system uses Docker Compose health checks to ensure proper startup order:

1. **Database** starts and becomes healthy
2. **Ollama** starts and becomes healthy  
3. **Model Download** runs automatically when Ollama is ready
4. **API** starts only after models are downloaded
5. **Frontend** starts only after API is healthy

### **Health Checks**
Each service has built-in health checks:
- **Database**: PostgreSQL connection test
- **Ollama**: API endpoint availability
- **API**: System readiness endpoint
- **Frontend**: HTTP response check

### **Model Management**
- Models are automatically downloaded on first startup
- Models persist across container restarts
- System waits for both models before starting API

## 🌐 Access Points

Once ready, you can access:
- **Application**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 🐛 Troubleshooting

### **Check System Status**
```bash
make status
make health
```

### **View Logs**
```bash
make logs
make logs-api
make logs-ollama
```

### **Restart Everything**
```bash
make restart
```

### **Clean Start**
```bash
make clean
make start
```

## 🚀 Production Deployment

### **Production Mode**
```bash
docker-compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.prod.yml up -d
```

### **Systemd Service (Linux)**
1. Copy the service file:
   ```bash
   sudo cp scripts/note-taker.service /etc/systemd/system/
   ```
2. Edit the paths in the service file
3. Enable and start:
   ```bash
   sudo systemctl enable note-taker
   sudo systemctl start note-taker
   ```

## 📊 Monitoring

### **Automatic Monitoring**
The system includes built-in monitoring that:
- Checks health every 30 seconds
- Logs system status
- Restarts failed services automatically
- Shows model availability

### **Manual Monitoring**
```bash
# Watch logs in real-time
make logs

# Check health status
make health

# Monitor specific service
make logs-api
```

## ⚡ Performance Tips

### **First Startup**
- First startup takes 5-10 minutes (model download)
- Subsequent startups take 1-2 minutes
- Models are cached between restarts

### **Resource Usage**
- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Production**: 16GB RAM, 8 CPU cores

### **Storage**
- Models require ~6GB disk space
- Database grows with usage
- Logs are rotated automatically

## 🔒 Security Notes

- Change default database credentials in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Regular security updates for base images

## 📞 Support

If you encounter issues:
1. Check `make status` and `make health`
2. Review logs with `make logs`
3. Try `make restart` or `make clean && make start`
4. Check Docker and Docker Compose versions

---

**Happy Note-Taking! 🎉**
