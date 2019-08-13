# Leaderboard API

Simple Serverless Leaderboard API.

## Quickstart

### GET

Request `GET` to `/{serviceId}/{period}` with a header `X-User` for `userId`, then it returns by this form.

```typescript
interface IRankRecord {
  rank: number;
  user: string;
  score: string;
}
interface IRankView {
  top: IRankRecord[];
  context: IRankRecord[];
  me: IRankRecord[];
}
```

- `context` means some `record`s near my rank.
- `score` should be `string` because its value is bigger than `Number.MAX_SAFE_INTEGER`.
- `me` and `context` field can be omitted when there is no my record.

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
  "context": [
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

### PUT

Request `PUT` to `/{serviceId}/{period}` with a header `X-User` for `userId`, then it returns by the form that is same with `GET` API. The type of payload for `score` is `string` because it can be bigger than `Number.MAX_SAFE_INTEGER`.

- This API doesn't update a record when an old score is higher than a new score.
- This API can be slow if there is so many concurrent `PUT` calls. It is because it is on the actor model to manage the consistency of ranks whiel updating concurrently.

```bash
$ curl -XPUT "https://API-DOMAIN/STAGE/service_id/period" -H "X-User: test" -d "123456789123456789"
{
  "top": [
    {
      "rank": 321,
      "user": "test",
      "score": "123456789123456789"
    },
    ...
  ],
  "context": [
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

### CLEAR

For admin purpose, it supports `CLEAR` command via `DELETE` request.

```bash
curl -XPUT "https://API-DOMAIN/STAGE/service_id/period" -H "X-Auth: admin-secret"
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
