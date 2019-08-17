# Benchmarks

This system uses a very simple data structure to store rankings so it can be slow in some situations, for example, there are so many concurrent update calls or there are so many tuples in a ranking file.

I would test with this code to measure the average elapsed milliseconds about `top` and `put` API with some concurrency.

## Test Environment

- I deploy the target to AWS production environment such as AWS API Gateway, AWS Lambda and Amazon S3.
- I use a cheapest AWS Lightsail instance as a server to request many calls. So I think there is a disadvantage about network speed.

## Result

| Operation | # of Rankings | Request(Total/Concurrent) | Elapsed(ms) |
| --------- | ------------- | ------------------------- | ----------- |
| top       | empty         | 10/1                      | 145ms       |
| top       | empty         | 1024/64                   | 183ms       |
| top       | 100K          | 10/1                      | 757ms       |
| top       | 100K          | 1024/64                   | 778ms       |
| put       | empty         | 10/1                      | 160ms       |
| put       | empty         | 1024/64                   | 475ms       |
| put       | 100K          | 10/1                      | 616ms       |
| put       | 100K          | 1024/64                   | 1228ms      |

## Test code

```javascript
const fetch = require("node-fetch");
const pLimit = require("p-limit");

const limit = pLimit(64);
const userCount = 1024 * 1024 * 1024;
const testCount = 1024;

const rand = maxValue => Math.floor(Math.random() * maxValue);

const prefix = `https://API-DOMAIN/STAGE/__tests__/period`;
const get = () => {
  const targetUrl = prefix + "/top";
  return fetch(targetUrl, {
    headers: {
      "x-user": `test${rand(userCount)}`
    }
  })
    .then(r => r.text())
    .then(console.log)
    .catch(console.error);
};

const put = () => {
  const targetUrl = prefix;
  return fetch(targetUrl, {
    method: "PUT",
    headers: {
      "x-user": `test${rand(userCount)}`
    },
    body: rand(1024 * 1024 * 1024).toString()
  })
    .then(r => r.text())
    .then(console.log)
    .catch(console.error);
};

const request = async () => {
  const startTime = Date.now();
  // await put();
  await get();
  console.log(Date.now() - startTime);
};

(async () => {
  const promises = Array(testCount)
    .fill(0)
    .map(_ => limit(() => request()));
  await Promise.all(promises);
})();
```
