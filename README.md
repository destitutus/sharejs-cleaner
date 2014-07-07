sharejs-cleaner
===============

## Installation

```bash
npm i destitutus/sharejs-cleaner
```

## Configuration

For configuration use file ```config.json``` in root directory or file path
given with -c options (require full absolute path)

Example config present in ```config.example.json``` file

### Config sections

log4js - logger configuration

redis - redis configuration

mongo - mongo configuration

Required parameter for mongo and redis is ```collection``` - collection for cleanup

## Usage

For usage just run ```./bin/sharejs-cleaner``` script manually or from crontab.
Do not forgot about configuration file

## Processing

Cleaner analyze mongo collection on old records(see cleanupOps param in mongo section).
If old records are found, cleanup will start. It remove record in ```collection``` and all
related records in ```collection_ops``` in mongo, also it delete
```document_name v``` and ```document_name ops``` keys in redis