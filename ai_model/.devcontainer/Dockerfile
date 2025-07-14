FROM python:3.11.11

WORKDIR /workspace

COPY requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt && rm /tmp/requirements.txt
RUN pip install tensorflow==2.12.0 --no-deps

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    g++ \
    make \
    cmake \
    openjdk-17-jdk-headless \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

COPY . /workspace/

CMD ["/bin/bash"]
