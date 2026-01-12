# 阶段 1：定义 go-judge 来源
FROM criyle/go-judge:latest AS source

# 阶段 2：构建实际运行环境
FROM ubuntu:24.04

# 设置环境变量
ENV TZ=America/Vancouver
ENV DEBIAN_FRONTEND=noninteractive

# 修改源 (可选)
RUN sed -i 's@//.*archive.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list.d/ubuntu.sources && \
    sed -i 's@//.*security.ubuntu.com@//mirrors.aliyun.com@g' /etc/apt/sources.list.d/ubuntu.sources

# 1. 安装基础环境 + locales (解决 setlocale 报错)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    locales \
    gcc g++ python3 pypy3 openjdk-21-jdk \
    vim curl \
    && rm -rf /var/lib/apt/lists/*

# 2. 生成语言包 (解决 LC_ALL 报错)
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# =========================================================
# 【核心修复】修复 Java 配置文件软链接问题
# Ubuntu 默认把 conf 软链到 /etc，我们把它变成真实文件
# 这样 go-judge 挂载 /usr 时就能直接读取配置，无需挂载 /etc
# =========================================================
RUN cp -rL /usr/lib/jvm/java-21-openjdk-amd64/conf /tmp/java-conf && \
    rm -rf /usr/lib/jvm/java-21-openjdk-amd64/conf && \
    mv /tmp/java-conf /usr/lib/jvm/java-21-openjdk-amd64/conf

WORKDIR /opt

# 拷贝 go-judge 二进制文件
COPY --from=source /opt/go-judge /opt/go-judge

EXPOSE 5050 5051

# 启动 (不需要 mount.yaml 了)
ENTRYPOINT ["/opt/go-judge", "-http-addr", "0.0.0.0:5050"]