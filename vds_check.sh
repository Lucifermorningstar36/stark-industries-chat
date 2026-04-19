#!/bin/bash
echo "========== DOCKER CONTAINERS =========="
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' 2>&1
echo ""
echo "========== DISK USAGE =========="
df -h / 2>&1
echo ""
echo "========== MEMORY =========="
free -h 2>&1
echo ""
echo "========== PROJECT DIRECTORY =========="
ls -la ~/stark-industries-chat/ 2>&1 || echo "DIR NOT FOUND at ~/stark-industries-chat/"
ls -la ~/stark-industries-chat/stark-industries-chat/ 2>&1 || echo "DIR NOT FOUND at ~/stark-industries-chat/stark-industries-chat/"
echo ""
echo "========== DOCKER COMPOSE FILE =========="
find /root -name 'docker-compose.yml' -maxdepth 3 2>&1
echo ""
echo "========== CADDY FILE =========="
find /root -name 'Caddyfile' -maxdepth 3 2>&1
echo ""
echo "========== DOCKER IMAGES =========="
docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' 2>&1
echo ""
echo "========== DOCKER LOGS (last 20 lines each) =========="
for c in $(docker ps -a --format '{{.Names}}'); do
  echo "--- $c ---"
  docker logs --tail 20 "$c" 2>&1
  echo ""
done
echo "========== DONE =========="
