[![Build Status](https://travis-ci.org/db-migrate/pg.svg?branch=master)](https://travis-ci.org/db-migrate/pg)
[![Dependency Status](https://david-dm.org/db-migrate/pg.svg)](https://david-dm.org/db-migrate/pg)
[![devDependency Status](https://david-dm.org/db-migrate/pg/dev-status.svg)](https://david-dm.org/db-migrate/pg#info=devDependencies)


# pg
postgres driver for db-migrate

## Installation

```
npm install --save db-migrate-pg
```

## Testing (for development)

Copy `test/db.config.example.json` to `test/db.config.json`.

If running Postgres locally, create a database called `db_migrate_test`, then run `npm test`.

There may be some issues running the `vows` library with Node versions 10 and above.

### Testing PostgreSQL versions with the docker-compose file

Change `test/db.config.json` to include the following values in the `pg` section
```json
  "pg": {
    "driver": "pg",
    "host": "postgres.local",
    "user": "postgres",
    "database": "db_migrate_test"
  }
```

The `docker-compose.yml` file specifies several versions of PostgreSQL.
To test a PostgreSQL version, run
```sh
docker-compose up -d postgres<version>
docker-compose run node
docker-compose down -v
```
The `sleep` command waits for the PostgreSQL container to complete initialization.
Later PostgreSQL versions generally have faster startup times.
For versions 10 and after the sleep might not be necessary.

So far the docker-compose file includes `postgres8`, `postgres9.0`, `postgres9.6`, `postgres10`, and `postgres11`.

Test all the versions
```sh
docker-compose up -d postgres8; sleep 5; docker-compose run node; docker-compose down -v
docker-compose up -d postgres9.0; sleep 2; docker-compose run node; docker-compose down -v
docker-compose up -d postgres9.6; sleep 2; docker-compose run node; docker-compose down -v
docker-compose up -d postgres10; docker-compose run node; docker-compose down -v
docker-compose up -d postgres11; docker-compose run node; docker-compose down -v
```
