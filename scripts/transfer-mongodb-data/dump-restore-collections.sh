#!/usr/bin/env bash

COLLECTION='mediaScenes'
COLLECTION_QUERY_FILE='./scripts/transfer-mongodb-data/media-scenes-query.json'
BACKUP_DIR='./latest-dump'

function setdir {
    BACKUP_DIR_FOR_RESTORE=$BACKUP_DIR
    BACKUP_DIR_FOR_RESTORE+='/'
    BACKUP_DIR_FOR_RESTORE+=$EXPORTING_DB
    BACKUP_DIR_FOR_RESTORE+='/'
    BACKUP_DIR_FOR_RESTORE+=$COLLECTION
    BACKUP_DIR_FOR_RESTORE+='.bson'
}

setdir
# APEP TODO Use Params for mongo path
# --query $QUERY
# --collection $COLLECTION
# -u $RESTORING_USERNAME -p $RESTORING_PASSWORD
#/c/Program\ Files/MongoDB/Server/3.2/bin/mongodump.exe -h $EXPORTING_MONGO_HOST_PORT -u $EXPORTING_USERNAME -p $EXPORTING_PASSWORD --db $EXPORTING_DB --collection $COLLECTION --queryFile $COLLECTION_QUERY_FILE --out $BACKUP_DIR
/c/Program\ Files/MongoDB/Server/3.2/bin/mongorestore.exe --host $RESTORING_MONGO_HOST_PORT --db $RESTORING_DB --collection $COLLECTION $BACKUP_DIR_FOR_RESTORE

COLLECTION='mediaSceneGraphs'
setdir
#/c/Program\ Files/MongoDB/Server/3.2/bin/mongodump.exe -h $EXPORTING_MONGO_HOST_PORT -u $EXPORTING_USERNAME -p $EXPORTING_PASSWORD --db $EXPORTING_DB --collection $COLLECTION --out $BACKUP_DIR
/c/Program\ Files/MongoDB/Server/3.2/bin/mongorestore.exe --host $RESTORING_MONGO_HOST_PORT --db $RESTORING_DB --collection $COLLECTION $BACKUP_DIR_FOR_RESTORE

COLLECTION='audiomediaobjects'
setdir
COLLECTION_QUERY_FILE='./scripts/transfer-mongodb-data/amos-query.json'
#/c/Program\ Files/MongoDB/Server/3.2/bin/mongodump.exe -h $EXPORTING_MONGO_HOST_PORT -u $EXPORTING_USERNAME -p $EXPORTING_PASSWORD --db $EXPORTING_DB --collection $COLLECTION --queryFile $COLLECTION_QUERY_FILE --out $BACKUP_DIR
/c/Program\ Files/MongoDB/Server/3.2/bin/mongorestore.exe --host $RESTORING_MONGO_HOST_PORT --db $RESTORING_DB --collection $COLLECTION $BACKUP_DIR_FOR_RESTORE

COLLECTION='imagemediaobjects'
setdir
COLLECTION_QUERY_FILE='./scripts/transfer-mongodb-data/imos-query.json'
#/c/Program\ Files/MongoDB/Server/3.2/bin/mongodump.exe -h $EXPORTING_MONGO_HOST_PORT -u $EXPORTING_USERNAME -p $EXPORTING_PASSWORD --db $EXPORTING_DB --collection $COLLECTION --queryFile $COLLECTION_QUERY_FILE --out $BACKUP_DIR
/c/Program\ Files/MongoDB/Server/3.2/bin/mongorestore.exe --host $RESTORING_MONGO_HOST_PORT --db $RESTORING_DB --collection $COLLECTION $BACKUP_DIR_FOR_RESTORE

COLLECTION='videomediaobjects'
setdir
COLLECTION_QUERY_FILE='./scripts/transfer-mongodb-data/vmos-query.json'
#/c/Program\ Files/MongoDB/Server/3.2/bin/mongodump.exe -h $EXPORTING_MONGO_HOST_PORT -u $EXPORTING_USERNAME -p $EXPORTING_PASSWORD --db $EXPORTING_DB --collection $COLLECTION --queryFile $COLLECTION_QUERY_FILE --out $BACKUP_DIR
/c/Program\ Files/MongoDB/Server/3.2/bin/mongorestore.exe --host $RESTORING_MONGO_HOST_PORT --db $RESTORING_DB --collection $COLLECTION $BACKUP_DIR_FOR_RESTORE

