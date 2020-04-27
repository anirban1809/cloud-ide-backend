FROM ubuntu:18.04
RUN apt-get update
RUN apt install -y openssh-server
ADD ./sshd_config /etc/ssh/sshd_config
RUN ssh-keygen -A
RUN echo root:password | chpasswd
WORKDIR /
RUN echo "service ssh restart" >> run.sh
RUN echo "/bin/bash" >> run.sh
CMD ["bash","run.sh"]