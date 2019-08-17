# Leaderboard API

[![LoC](https://tokei.rs/b1/github/yingyeothon/leaderboard-api)](https://github.com/yingyeothon/leaderboard-api)
[![Build Status](https://travis-ci.org/yingyeothon/leaderboard-api.svg?branch=master)](https://travis-ci.org/yingyeothon/leaderboard-api)
[![Coverage Status](https://coveralls.io/repos/github/yingyeothon/leaderboard-api/badge.svg?branch=master)](https://coveralls.io/github/yingyeothon/leaderboard-api?branch=master)

Simple Serverless Leaderboard API. It uses

- `AWS API Gateway` and `AWS Lambda` to serve this Web API with Serverless model.
- `Redis` to control the concurrent updates on the same ranking document.
- `S3` to store it as permanently.

Since you are using `Redis`, strictly speaking, this is not Serverless. This dependency will be removed in the future by implementing the web-based state management for `ActorSystem`'s concurrency control.

## Documentation

### GET

#### Get all

Request `GET` to `/{serviceId}/{period}?limit=<number>` with a header `X-User` for `userId`, then it returns by this form.

```typescript
interface IRankRecord {
  rank: number;
  user: string;
  score: string;
}
interface IRankView {
  me: IRankRecord;
  top: IRankRecord[];
  around: IRankRecord[];
}
```

- `around` means some `record`s near my rank which contains my rank, too.
- `score` should be `string` because its value is bigger than `Number.MAX_SAFE_INTEGER`.
- `me` and `around` field can be `undefined` when there is no my record.

```bash
$ curl "https://API-DOMAIN/STAGE/service_id/period" -H "X-User: test"
{
  "top": [
    {
      "rank": 321,
      "user": "test",
      "score": "123456789123456789"
    },
    ...
  ],
  "around": [
    ...,
    {
      "rank": 321,
      "user": "test",
      "score": "123456789123456789"
    },
    ...
  ],
  "my": {
    "rank": 321,
    "user": "test",
    "score": "123456789123456789"
  },
}
```

#### Get `me` only

Request `GET` to `/{serviceId}/{period}/me` with a header `X-User` for `userId`.

```bash
$ curl "https://API-DOMAIN/STAGE/service_id/period/me" -H "X-User: test"
{
  "rank": 321,
  "user": "test",
  "score": "123456789123456789"
}
```

#### Get `top` with `offset` and `limit`

Request `GET` to `/{serviceId}/{period}/top?offset=<number>&limit=<number>`.

```bash
$ curl "https://API-DOMAIN/STAGE/service_id/period/top?offset=0&limit=10"
[{
  "rank": 1,
  "user": "test",
  "score": "123456789123456789"
}, ...]
```

#### Get `around` with `limit`

Request `GET` to `/{serviceId}/{period}/around?limit=<number>` with a header `X-User` for `userId`.

```bash
$ curl "https://API-DOMAIN/STAGE/service_id/period/around?limit=10" -H "X-User: test"
[..., {
  "rank": 321,
  "user": "test",
  "score": "123456789123456789"
}, ...]
```

#### Scrolling from the result

If you want to see more rankings from the current result, please request `GET` to `/{serviceId}/{period}/{direction}?cursor=<user>&limit=<number>` where `direction` is one of `up` and `down`.

For example, if we want to see more 10 higher rankings from the `test` user, it should request to `/{serviceId}/{period}/up?cursor=test&limit=10`. This is because this `user` field should be unique.

```bash
$ curl "https://API-DOMAIN/STAGE/service_id/period/up?limit=10"
[..., {
  "rank": 320,
  "user": "test2",
  "score": "123456789123456799"
}]
```

### PUT

Request `PUT` to `/{serviceId}/{period}` with a header `X-User` for `userId`, then it returns by the form that is same with `GET my` API. The type of payload for `score` is `string` because it can be bigger than `Number.MAX_SAFE_INTEGER`.

- **This API doesn't update a record when an old score is higher than a new score.**
- This API can be slow if there is so many concurrent `PUT` calls. It is because it is on the actor model to manage the consistency of ranks whiel updating concurrently. [Please see details in benchmark](benchmark/README.md).

```bash
$ curl -XPUT "https://API-DOMAIN/STAGE/service_id/period" -H "X-User: test" -d "123456789123456789"
{
  "rank": 321,
  "user": "test",
  "score": "123456789123456789"
}
```

### CLEAR

For admin purpose, it supports `CLEAR` command via `DELETE` request.

```bash
curl -XDELETE "https://API-DOMAIN/STAGE/service_id/period" -H "X-Auth: admin-secret"
```

But if `process.env.AUTH` isn't set while deploying, `X-Auth` can be omitted and it can lead very horrible problem, that is resetting all of ranks by anonymous.

## Deployment

1. Install dependencies via `yarn` command from your shell.
2. After editing some codes, deploy this stack via `yarn deploy` command.

```bash
yarn
yarn deploy
```

## Development

It contains `serverless-offline` plugin, you test it locally using `yarn start` command.

```bash
yarn
yarn start
```

Also, you can debug this stack using `yarn debug` command.

## License

MIT
