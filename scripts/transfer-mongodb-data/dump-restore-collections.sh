#!/usr/bin/env bash

COLLECTION='mediaScenes'
BACKUP_DIR='./latest-dump'
BACKUP_DIR_FOR_RESTORE=$BACKUP_DIR
BACKUP_DIR_FOR_RESTORE+='/'
BACKUP_DIR_FOR_RESTORE+=$EXPORTING_DB
BACKUP_DIR_FOR_RESTORE+='/'
BACKUP_DIR_FOR_RESTORE+=$COLLECTION
BACKUP_DIR_FOR_RESTORE+='.bson'

echo $BACKUP_DIR_FOR_RESTORE

# APEP TODO Use Params for mongo path

# --query $QUERY
# --collection $COLLECTION
/c/Program\ Files/MongoDB/Server/3.2/bin/mongodump.exe -h $EXPORTING_MONGO_HOST_PORT -u $EXPORTING_USERNAME -p $EXPORTING_PASSWORD --db $EXPORTING_DB --collection $COLLECTION --query "{\"_groupID\": { \"\$in\": [101, 102, 103, 104, 105, 106, 107, 108, 109, 110]}}" --out $BACKUP_DIR

# -u $RESTORING_USERNAME -p $RESTORING_PASSWORD
/c/Program\ Files/MongoDB/Server/3.2/bin/mongorestore.exe --host $RESTORING_MONGO_HOST_PORT --db $RESTORING_DB --collection $COLLECTION $BACKUP_DIR_FOR_RESTORE