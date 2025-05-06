# Update ports in docker-compose.yml
sed -i "s|- \"[0-9]\+:80\"|- \"${frontend_port}:80\"|g" docker-compose.yml