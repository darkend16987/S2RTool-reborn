# Frontend Dockerfile for S2RTool
FROM nginx:alpine

# Copy static files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY building-render.html /usr/share/nginx/html/
COPY planning-render.html /usr/share/nginx/html/
COPY planning-detail-render.html /usr/share/nginx/html/
COPY settings.html /usr/share/nginx/html/

# --- BỔ SUNG CÁC FILE CÒN THIẾU ---
COPY interior-render.html /usr/share/nginx/html/
COPY interior-script.js /usr/share/nginx/html/
# ----------------------------------

# --- NEW FEATURES: Object Swap, Floor Plan, Render History ---
COPY object-swap.html /usr/share/nginx/html/
COPY object-swap-script.js /usr/share/nginx/html/
COPY floorplan-render.html /usr/share/nginx/html/
COPY floorplan-script.js /usr/share/nginx/html/
COPY render-history.html /usr/share/nginx/html/
COPY render-history-script.js /usr/share/nginx/html/
# -------------------------------------------------------------

COPY style.css /usr/share/nginx/html/
COPY building-script.js /usr/share/nginx/html/
COPY planning-script.js /usr/share/nginx/html/
COPY planning-detail-script.js /usr/share/nginx/html/
COPY settings.js /usr/share/nginx/html/

# --- BỔ SUNG CÁC FILE VERSION CHECK ---
COPY version-check.js /usr/share/nginx/html/
COPY version.json /usr/share/nginx/html/
# ---------------------------------------

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]