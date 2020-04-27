FROM alpine:latest
RUN apk update
RUN apk add openssh-server
ADD ./sshd_config /etc/ssh/sshd_config
RUN ssh-keygen -A
RUN echo root:password | chpasswd
WORKDIR /
RUN echo "service ssh restart" >> run.sh
RUN echo "/usr/sbin/sshd -D" >> run.sh
CMD ["sh","run.sh"]
