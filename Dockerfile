FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY css /usr/share/nginx/html/css
COPY js /usr/share/nginx/html/js
COPY data /usr/share/nginx/html/data
COPY icons /usr/share/nginx/html/icons
COPY images /usr/share/nginx/html/images
EXPOSE 80
