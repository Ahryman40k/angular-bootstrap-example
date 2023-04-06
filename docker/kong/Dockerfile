FROM kong

ENV KONG_DATABASE=off
ENV KONG_PROXY_ACCESS_LOG="/dev/stdout"
ENV KONG_ADMIN_ACCESS_LOG="/dev/stdout"
ENV KONG_PROXY_ERROR_LOG="/dev/stderr"
ENV KONG_ADMIN_ERROR_LOG="/dev/stderr"
ENV KONG_ADMIN_LISTEN="0.0.0.0:8001, 0.0.0.0:8444 ssl"

COPY ./config/kong.yml /etc/kong 
ENV KONG_DECLARATIVE_CONFIG="/etc/kong/kong.yml"