#!/bin/bash

# BEGIN EDITS
# kittens in bcrypt
export HUB_SECRET='$2a$10$vt2TBymKZTKxMz/Z8J6g5OgtG2IslI8A2tGiEO0jYlfZ1XlAxTOsG'
export HUB_MONGO='mongodb://127.0.0.1:27017/test-uos-mediahubdb'
export PORT=3000
# END EDITS

$@