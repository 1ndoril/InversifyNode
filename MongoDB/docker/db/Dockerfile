FROM mongo:3.4.9

COPY dump /data/dump
COPY restore.sh /data/restore.sh
RUN chmod 777 /data/restore.sh

CMD /data/restore.sh
